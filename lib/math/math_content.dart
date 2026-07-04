class MathContentSegment {
  const MathContentSegment({
    required this.type,
    required this.value,
    this.display = false,
    this.svg,
    this.original,
    this.latex,
    this.svgPath,
    this.renderStatus,
    this.error,
  });

  final String type;
  final String value;
  final bool display;
  final String? svg;
  final String? original;
  final String? latex;
  final String? svgPath;
  final String? renderStatus;
  final String? error;

  bool get isMath => type == 'math';
  bool get isImage => type == 'image';

  MathContentSegment copyWith({
    String? type,
    String? value,
    bool? display,
    String? svg,
    String? original,
    String? latex,
    String? svgPath,
    String? renderStatus,
    String? error,
  }) {
    return MathContentSegment(
      type: type ?? this.type,
      value: value ?? this.value,
      display: display ?? this.display,
      svg: svg ?? this.svg,
      original: original ?? this.original,
      latex: latex ?? this.latex,
      svgPath: svgPath ?? this.svgPath,
      renderStatus: renderStatus ?? this.renderStatus,
      error: error ?? this.error,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'type': type,
      'value': value,
      'display': display,
      if (svg != null) 'svg': svg,
      if (original != null) 'original': original,
      if (latex != null) 'latex': latex,
      if (svgPath != null) 'svgPath': svgPath,
      if (renderStatus != null) 'renderStatus': renderStatus,
      if (error != null) 'error': error,
    };
  }

  factory MathContentSegment.fromJson(Map<String, dynamic> json) {
    return MathContentSegment(
      type: json['type'] as String? ?? 'text',
      value: MathContentParser.normalizeSourceText(
        json['value'] as String? ?? '',
      ),
      display: json['display'] as bool? ?? false,
      svg: json['svg'] as String?,
      original: json['original'] as String?,
      latex: json['latex'] as String?,
      svgPath: json['svgPath'] as String?,
      renderStatus:
          json['renderStatus'] as String? ?? json['status'] as String?,
      error: json['error'] as String?,
    );
  }
}

class MathContentParser {
  static String normalizeSourceText(String input) {
    final normalized = input
        .replaceAll(r'\$', r'$')
        .replaceAll('\r\n', '\n')
        .replaceAll('\r', '\n');
    return _repairBareMathEnvironments(
      _repairCollapsedMatrixNotation(
        _repairCollapsedRotationMatrices(normalized),
      ),
    );
  }

  static List<MathContentSegment> parse(String input) {
    final source = normalizeSourceText(input).trim();
    if (source.isEmpty) {
      return const [];
    }

    final segments = <MathContentSegment>[];
    var cursor = 0;

    while (cursor < source.length) {
      final candidates = <_MathDelimiter>[
        _MathDelimiter(r'$$', r'$$', true, source.indexOf(r'$$', cursor)),
        _MathDelimiter(r'\[', r'\]', true, source.indexOf(r'\[', cursor)),
        _MathDelimiter(r'\(', r'\)', false, source.indexOf(r'\(', cursor)),
        _MathDelimiter(r'$', r'$', false, source.indexOf(r'$', cursor)),
      ]..removeWhere((candidate) => candidate.start == -1);

      if (candidates.isEmpty) {
        _appendMixedContent(segments, source.substring(cursor));
        break;
      }

      candidates.sort((left, right) => left.start.compareTo(right.start));
      final nextDelimiter = candidates.first;
      final nextStart = nextDelimiter.start;
      if (nextStart == -1) {
        _appendMixedContent(segments, source.substring(cursor));
        break;
      }

      if (nextStart > cursor) {
        _appendMixedContent(segments, source.substring(cursor, nextStart));
      }

      final contentStart = nextStart + nextDelimiter.open.length;
      final end = source.indexOf(nextDelimiter.close, contentStart);

      if (end == -1) {
        _appendMixedContent(segments, source.substring(nextStart));
        break;
      }

      final math = source.substring(contentStart, end).trim();
      if (math.isNotEmpty) {
        segments.add(
          MathContentSegment(
            type: 'math',
            value: math,
            display: nextDelimiter.display,
          ),
        );
      }
      cursor = end + nextDelimiter.close.length;
    }

    final hasRenderableSegment = segments.any(
      (segment) => segment.isMath || segment.isImage,
    );
    if (!hasRenderableSegment && _looksLikeStandaloneMath(source)) {
      return [
        MathContentSegment(
          type: 'math',
          value: source,
          display:
              _rawMathEnvironmentStart(source) >= 0 ||
              _shouldDisplayRawExpression(source),
        ),
      ];
    }

    return segments.isEmpty
        ? [MathContentSegment(type: 'text', value: source)]
        : segments;
  }

  static final RegExp _inlineImagePattern = RegExp(
    r'\[\[image:([^\]]+)\]\]',
    caseSensitive: false,
  );

  static bool _looksLikeStandaloneMath(String source) {
    return (_rawMathEnvironmentStart(source) >= 0 ||
            RegExp(r'\\[A-Za-z]+').hasMatch(source) ||
            RegExp(
              r'(?<!\w)[A-Za-z0-9)\]}]+(?:\^\{[^{}\s]+\}|_\{[^{}\s]+\}|\^[A-Za-z0-9\\.+\-−]+|_[A-Za-z0-9\\.+\-−]+)+',
            ).hasMatch(source) ||
            RegExp(
              r'(?<!\w)[A-Za-z0-9)\]}]+(?:[₀₁₂₃₄₅₆₇₈₉₊₋₌₍₎ₐₑₕᵢⱼₖₗₘₙₒₚᵣₛₜₓ⁰¹²³⁴⁵⁶⁷⁸⁹⁺⁻⁼⁽⁾ⁿᵃᵇᶜᵈᵉᶠᵍʰⁱʲᵏˡᵐᵒᵖʳˢᵗᵘᵛʷˣʸᶻ]+)+',
            ).hasMatch(source) ||
            RegExp(
              r'[∑∫√αβγδλμπωθ≤≥≈≠∞∂∇∈∉∀∠∪∩⊂⊆∅⊥⇔]',
            ).hasMatch(source) ||
            _looksLikeStandaloneMathExpression(source)) &&
        !RegExp(r'[.!?]\s').hasMatch(source);
  }

  static String _repairBareMathEnvironments(String input) {
    var output = input;
    const envs = [
      'array',
      'matrix',
      'bmatrix',
      'pmatrix',
      'vmatrix',
      'Vmatrix',
      'cases',
      'aligned',
      'gathered',
    ];

    for (final env in envs) {
      output = output
          .replaceAllMapped(
            RegExp('(?<!\\\\)begin\\{$env\\}'),
            (_) => '\\begin{$env}',
          )
          .replaceAllMapped(
            RegExp('(?<!\\\\)end\\{$env\\}'),
            (_) => '\\end{$env}',
          )
          .replaceAllMapped(
            RegExp('(?<![\\\\A-Za-z])begin$env\\b'),
            (_) => '\\begin{$env}',
          )
          .replaceAllMapped(
            RegExp('(?<![\\\\A-Za-z])end$env\\b'),
            (_) => '\\end{$env}',
          );
    }

    // A few copy/paste paths collapse "\begin{bmatrix}" to "beginmatrix" or
    // produce "endymatrix". Treat those as the plain matrix environment so the
    // admin preview and student portal still render a matrix instead of text.
    output = output
        .replaceAllMapped(
          RegExp(r'(?<![\\A-Za-z])beginmatrix\b'),
          (_) => r'\begin{matrix}',
        )
        .replaceAllMapped(
          RegExp(r'(?<![\\A-Za-z])endymatrix\b'),
          (_) => r'\end{matrix}',
        );

    return _repairMatrixRowSeparators(output);
  }

  static const String _rotationMatrixLatex =
      r'A_{\alpha}=\begin{bmatrix}\cos\alpha & \sin\alpha \\ -\sin\alpha & \cos\alpha\end{bmatrix}';

  static String _repairCollapsedRotationMatrices(String input) {
    var output = input.replaceAllMapped(
      RegExp(
        r'\\\(\s*A\s*(?:\\alpha|α)\s*=\s*[-−]?\s*csoisn\s*(?:\\alpha|α)\s*(?:\\alpha|α)\s*(?:ccsoiinns|csoins)\s*(?:\\alpha|α)\s*(?:\\alpha|α)(?:\^?\{?1\}?|¹)?\s*\\\)',
        caseSensitive: false,
      ),
      (_) => r'\(' + _rotationMatrixLatex + r'\)',
    );

    output = output.replaceAllMapped(
      RegExp(
        r'A\s*(?:\\alpha|α)\s*=\s*[-−]?\s*csoisn\s*(?:\\alpha|α)\s*(?:\\alpha|α)\s*(?:ccsoiinns|csoins)\s*(?:\\alpha|α)\s*(?:\\alpha|α)(?:\^?\{?1\}?|¹)?',
        caseSensitive: false,
      ),
      (_) => r'\(' + _rotationMatrixLatex + r'\)',
    );

    output = output.replaceAllMapped(
      RegExp(
        r'[-−]?\s*csoisn\s*(?:\\alpha|α)\s*(?:\\alpha|α)\s*(?:ccsoiinns|csoins)\s*(?:\\alpha|α)\s*(?:\\alpha|α)(?:\^?\{?1\}?|¹)?',
        caseSensitive: false,
      ),
      (_) =>
          r'\(\begin{bmatrix}\cos\alpha & \sin\alpha \\ -\sin\alpha & \cos\alpha\end{bmatrix}\)',
    );

    return output;
  }

  static String _repairCollapsedMatrixNotation(String input) {
    const mathSegmentPattern =
        r'(\\\([\s\S]*?\\\)|\\\[[\s\S]*?\\\]|\$\$[\s\S]*?\$\$|\$[\s\S]*?\$)';
    final source = _repairMatrixQuestionStatements(input);
    final pattern = RegExp(mathSegmentPattern);
    if (!pattern.hasMatch(source)) {
      return _repairCollapsedMatrixLatex(source);
    }

    return source.replaceAllMapped(pattern, (match) {
      final segment = match.group(0) ?? '';
      final stripped = _stripMathDelimiters(segment);
      return '${stripped.open}${_repairCollapsedMatrixLatex(stripped.body)}${stripped.close}';
    });
  }

  static String _repairCollapsedMatrixLatex(String input) {
    var output = input;

    output = output.replaceAllMapped(
      RegExp(r'\bA\s*=\s*13\s*-\s*25\b'),
      (_) =>
          'A = ${_bmatrix([
            ['1', '2'],
            ['3', '-5'],
          ])}',
    );

    output = output.replaceAllMapped(
      RegExp(r'\b124\s*-\s*(?:\\lambda|lambda|λ)\s*23\s+152\b'),
      (_) => _bmatrix([
        ['1', '-3', '2'],
        ['2', r'\lambda', '5'],
        ['4', '2', '1'],
      ]),
    );

    output = output.replaceAllMapped(
      RegExp(r'\bM\s*=\s*323\s+114\s+k00\b'),
      (_) =>
          'M = ${_bmatrix([
            ['3', '4', '0'],
            ['2', '1', '0'],
            ['3', '1', 'k'],
          ])}',
    );

    output = output.replaceAllMapped(
      RegExp(r'^\s*-\s*-\s*53\s*-\s*-\s*21\s*$'),
      (_) => _bmatrix([
        ['-5', '-2'],
        ['-3', '-1'],
      ]),
    );

    output = output.replaceAllMapped(
      RegExp(r'^\s*-\s*-\s*53\s*-\s*12\s*$'),
      (_) => _bmatrix([
        ['-5', '-2'],
        ['-3', '1'],
      ]),
    );

    output = output.replaceAllMapped(
      RegExp(r'^\s*-\s*53\s*-\s*12\s*$'),
      (_) => _bmatrix([
        ['5', '-2'],
        ['-3', '1'],
      ]),
    );

    output = output.replaceAllMapped(
      RegExp(r'\b([A-Z])\s*=\s*([0-9])([0-9])\s*-\s*([0-9])([0-9])\b'),
      (match) =>
          '${match.group(1)} = ${_bmatrix([
            [match.group(2)!, match.group(3)!],
            ['-${match.group(4)!}', match.group(5)!],
          ])}',
    );

    output = output.replaceAllMapped(
      RegExp(
        r'\b([0-9])([0-9])([0-9])\s+(-\s*(?:\\lambda|lambda|λ)|(?:\\lambda|lambda|λ)|[A-Za-z0-9])([0-9])([0-9])\s+([0-9])([0-9])([0-9])\b',
      ),
      (match) => _bmatrix([
        [match.group(1)!, match.group(2)!, match.group(3)!],
        [_matrixCell(match.group(4)!), match.group(5)!, match.group(6)!],
        [match.group(7)!, match.group(8)!, match.group(9)!],
      ]),
    );

    output = output.replaceAllMapped(
      RegExp(
        r'\b([A-Z])\s*=\s*([0-9])([0-9])([0-9])\s+([0-9])([0-9])([0-9])\s+([A-Za-z]|\\[A-Za-z]+|[0-9])([0-9])([0-9])\b',
      ),
      (match) =>
          '${match.group(1)} = ${_bmatrix([
            [match.group(2)!, match.group(3)!, match.group(4)!],
            [match.group(5)!, match.group(6)!, match.group(7)!],
            [_matrixCell(match.group(8)!), match.group(9)!, match.group(10)!],
          ])}',
    );

    output = output.replaceAllMapped(
      RegExp(
        r'^\s*([+-])?\s*([+-])?\s*([0-9])([0-9])\s*([+-])\s*([+-])?\s*([0-9])([0-9])\s*$',
      ),
      (match) {
        return _bmatrix([
          [
            _signedMatrixCell([
              match.group(1),
              match.group(2),
            ], match.group(3)!),
            match.group(4)!,
          ],
          [
            _signedMatrixCell([
              match.group(5),
              match.group(6),
            ], match.group(7)!),
            match.group(8)!,
          ],
        ]);
      },
    );

    return _compactMatrixCellSigns(output);
  }

  static String _repairMatrixQuestionStatements(String input) {
    return input.replaceAllMapped(
      RegExp(r'(Statement\s*2:\s*\\\(\s*)k\s+0(\s*\\\))', caseSensitive: false),
      (match) => '${match.group(1)}k \\ne 0${match.group(2)}',
    );
  }

  static _StrippedMathDelimiters _stripMathDelimiters(String segment) {
    const pairs = [
      _MathDelimiterPair(r'\(', r'\)'),
      _MathDelimiterPair(r'\[', r'\]'),
      _MathDelimiterPair(r'$$', r'$$'),
      _MathDelimiterPair(r'$', r'$'),
    ];
    for (final pair in pairs) {
      if (segment.startsWith(pair.open) &&
          segment.endsWith(pair.close) &&
          segment.length > pair.open.length + pair.close.length) {
        return _StrippedMathDelimiters(
          pair.open,
          pair.close,
          segment.substring(
            pair.open.length,
            segment.length - pair.close.length,
          ),
        );
      }
    }
    return _StrippedMathDelimiters('', '', segment);
  }

  static String _bmatrix(List<List<String>> rows) {
    final body = rows
        .map((row) => row.map(_matrixCell).join(' & '))
        .join(r' \\ ');
    return '\\begin{bmatrix}$body\\end{bmatrix}';
  }

  static String _matrixCell(String value) {
    return value
        .replaceAll('λ', r'\lambda')
        .replaceAllMapped(RegExp(r'(?<!\\)\blambda\b'), (_) => r'\lambda')
        .replaceAllMapped(RegExp(r'\\{2,}(?=lambda\b)'), (_) => '\\')
        .replaceAllMapped(RegExp(r'-\s*\\+'), (_) => '-\\')
        .replaceAll(RegExp(r'\s+'), '')
        .trim();
  }

  static String _signedMatrixCell(List<String?> signs, String value) {
    final minusCount = signs.where((sign) => sign == '-').length;
    return '${minusCount.isOdd ? '-' : ''}$value';
  }

  static String _compactMatrixCellSigns(String input) {
    return input.replaceAllMapped(
      RegExp(
        r'\\begin\{(bmatrix|matrix|pmatrix|vmatrix|Vmatrix)\}([\s\S]*?)\\end\{\1\}',
      ),
      (match) {
        final env = match.group(1)!;
        final body =
            (match.group(2) ?? '')
                .replaceAllMapped(
                  RegExp(r'(^|&|\\\\)\s*([+-])\s+([A-Za-z0-9\\])'),
                  (cell) => '${cell.group(1)} ${cell.group(2)}${cell.group(3)}',
                )
                .replaceAll(RegExp(r'\s{2,}'), ' ')
                .trim();
        return '\\begin{$env}$body\\end{$env}';
      },
    );
  }

  static String _repairMatrixRowSeparators(String input) {
    return input.replaceAllMapped(
      RegExp(
        r'\\begin\{(array|matrix|bmatrix|pmatrix|vmatrix|Vmatrix|cases|aligned|gathered)\}([\s\S]*?)\\end\{\1\}',
      ),
      (match) {
        final env = match.group(1)!;
        var body = match.group(2) ?? '';

        // Clipboard/selection paths can degrade a TeX row break from "\\ c & d"
        // to "\ c & d". Repair only inside matrix-like environments so normal
        // text and commands such as "\alpha" are not touched.
        body = body.replaceAllMapped(
          RegExp(r'(?<!\\)\\\s+(?=[A-Za-z0-9({\[-])'),
          (_) => r'\\ ',
        );

        // If the admin reference 2x2 example is copied through a hostile path,
        // it may also lose the second row ampersand: "a & b \\ c d". Fix only
        // the obvious two-token second-row case.
        final rows = body.split(RegExp(r'\\\\'));
        if (rows.length == 2 && '&'.allMatches(body).length == 1) {
          final secondRowTokens =
              rows[1]
                  .trim()
                  .split(RegExp(r'\s+'))
                  .where((token) => token.isNotEmpty)
                  .toList();
          if (secondRowTokens.length == 2) {
            rows[1] = ' ${secondRowTokens.join(' & ')}';
            body = rows.join(r'\\');
          }
        }

        return '\\begin{$env}$body\\end{$env}';
      },
    );
  }

  static void _appendText(List<MathContentSegment> segments, String value) {
    if (value.isEmpty) {
      return;
    }
    segments.add(MathContentSegment(type: 'text', value: value));
  }

  static void _appendMixedContent(
    List<MathContentSegment> segments,
    String value,
  ) {
    if (value.isEmpty) {
      return;
    }

    var cursor = 0;
    while (cursor < value.length) {
      final imageMatch = _inlineImagePattern.firstMatch(
        value.substring(cursor),
      );
      final mathMatch = _nextRawMathMatch(value, cursor);
      final nextImageStart =
          imageMatch == null ? -1 : cursor + imageMatch.start;
      final nextMathStart = mathMatch?.start ?? -1;

      if (nextImageStart == -1 && mathMatch == null) {
        _appendText(segments, value.substring(cursor));
        return;
      }

      final useImage =
          nextImageStart >= 0 &&
          (nextMathStart == -1 || nextImageStart <= nextMathStart);

      if (useImage) {
        if (nextImageStart > cursor) {
          _appendText(segments, value.substring(cursor, nextImageStart));
        }
        final imageUrl = (imageMatch?.group(1) ?? '').trim();
        if (imageUrl.isNotEmpty) {
          segments.add(MathContentSegment(type: 'image', value: imageUrl));
        }
        cursor = nextImageStart + (imageMatch?.group(0)?.length ?? 0);
        continue;
      }

      final match = mathMatch!;
      if (match.start > cursor) {
        _appendText(segments, value.substring(cursor, match.start));
      }
      final math = value.substring(match.start, match.end).trim();
      if (math.isNotEmpty) {
        segments.add(
          MathContentSegment(type: 'math', value: math, display: match.display),
        );
      }
      cursor = match.end;
    }
  }

  static _RawMathMatch? _nextRawMathMatch(String source, int cursor) {
    final envStart = _rawMathEnvironmentStart(source, cursor);
    final determinantStart = source.indexOf(r'\left|', cursor);

    final candidates = <_RawMathMatch>[];
    if (envStart >= 0) {
      final end = _rawMathEnvironmentEnd(source, envStart);
      if (end > envStart) {
        candidates.add(_RawMathMatch(envStart, end, true));
      }
    }
    if (determinantStart >= 0) {
      final end = source.indexOf(r'\right|', determinantStart + 6);
      if (end > determinantStart) {
        candidates.add(_RawMathMatch(determinantStart, end + 7, true));
      }
    }

    if (candidates.isEmpty) {
      return _nextRawExpressionMatch(source, cursor);
    }

    candidates.sort((left, right) => left.start.compareTo(right.start));
    return candidates.first;
  }

  static _RawMathMatch? _nextRawExpressionMatch(String source, int cursor) {
    final remainder = source.substring(cursor);
    final triggerMatches = <RegExpMatch>[
      ...RegExp(_rawMathCommandPattern).allMatches(remainder).take(1),
      ...RegExp(
        r'(?<!\w)[A-Za-z0-9)\]}]+(?:\^\{[^{}\s]+\}|_\{[^{}\s]+\}|\^[A-Za-z0-9\\.+\-−]+|_[A-Za-z0-9\\.+\-−]+)+',
      ).allMatches(remainder).take(1),
      ...RegExp(
        r'(?<!\w)[A-Za-z0-9)\]}]+(?:[₀₁₂₃₄₅₆₇₈₉₊₋₌₍₎ₐₑₕᵢⱼₖₗₘₙₒₚᵣₛₜₓ⁰¹²³⁴⁵⁶⁷⁸⁹⁺⁻⁼⁽⁾ⁿᵃᵇᶜᵈᵉᶠᵍʰⁱʲᵏˡᵐᵒᵖʳˢᵗᵘᵛʷˣʸᶻ]+)+',
      ).allMatches(remainder).take(1),
      ...RegExp(
        r'[∑∫√αβγδλμπωθ≤≥≈≠∞∂∇∈∉∀∠∪∩⊂⊆∅⊥⇔₀₁₂₃₄₅₆₇₈₉₊₋₌₍₎ₐₑₕᵢⱼₖₗₘₙₒₚᵣₛₜₓ⁰¹²³⁴⁵⁶⁷⁸⁹⁺⁻⁼⁽⁾ⁿᵃᵇᶜᵈᵉᶠᵍʰⁱʲᵏˡᵐᵒᵖʳˢᵗᵘᵛʷˣʸᶻ]',
      ).allMatches(remainder).take(1),
      ...RegExp(
        r'[A-Za-z0-9)\]}|]\s*(?:=|<|>|≤|≥|≠)\s*(?:\\[A-Za-z]+|[A-Za-z]+|[0-9]+|[({\[|+\-−])',
      ).allMatches(remainder).take(1),
    ];
    if (triggerMatches.isEmpty) {
      return null;
    }

    triggerMatches.sort((left, right) => left.start.compareTo(right.start));
    final trigger = triggerMatches.first;
    return _expandRawMathExpression(
      source,
      cursor + trigger.start,
      cursor + trigger.end,
      cursor,
    );
  }

  static _RawMathMatch? _expandRawMathExpression(
    String source,
    int triggerStart,
    int triggerEnd,
    int floor,
  ) {
    var start = triggerStart;
    var end = triggerEnd;

    while (start > floor) {
      final previous = _previousMathToken(source, start, floor);
      if (previous == null) {
        break;
      }
      start = previous.start;
    }

    while (end < source.length) {
      final next = _nextMathToken(source, end);
      if (next == null) {
        break;
      }
      end = next.end;
    }

    while (start < end && source[start].trim().isEmpty) {
      start++;
    }
    while (start < end && RegExp(r'[,.;:!?]').hasMatch(source[start])) {
      start++;
      while (start < end && source[start].trim().isEmpty) {
        start++;
      }
    }
    while (end > start && source[end - 1].trim().isEmpty) {
      end--;
    }
    while (end > start && RegExp(r'[,.;:!?]').hasMatch(source[end - 1])) {
      end--;
      while (end > start && source[end - 1].trim().isEmpty) {
        end--;
      }
    }

    if (end <= start) {
      return null;
    }

    final value = source.substring(start, end);
    if (!_looksLikeMathExpression(value)) {
      return null;
    }

    return _RawMathMatch(start, end, _shouldDisplayRawExpression(value));
  }

  static _TokenRange? _previousMathToken(String source, int index, int floor) {
    var cursor = index;
    while (cursor > floor && source[cursor - 1].trim().isEmpty) {
      cursor--;
    }
    if (cursor <= floor) {
      return null;
    }

    final char = source[cursor - 1];
    if (_isMathPunctuation(char)) {
      return _TokenRange(cursor - 1, cursor);
    }
    if (RegExp(r'[0-9.]').hasMatch(char)) {
      var start = cursor - 1;
      while (start > floor && RegExp(r'[0-9.]').hasMatch(source[start - 1])) {
        start--;
      }
      return _TokenRange(start, cursor);
    }
    if (RegExp(r'[A-Za-z]').hasMatch(char)) {
      var start = cursor - 1;
      while (start > floor && RegExp(r'[A-Za-z]').hasMatch(source[start - 1])) {
        start--;
      }
      final word = source.substring(start, cursor);
      return _isMathWord(word) ? _TokenRange(start, cursor) : null;
    }
    if (_isUnicodeMathChar(char)) {
      return _TokenRange(cursor - 1, cursor);
    }
    if (char == r'}') {
      final start = _matchingOpenBrace(source, cursor - 1, floor);
      if (start != null) {
        return _TokenRange(start, cursor);
      }
    }
    if (char == r'\') {
      return _TokenRange(cursor - 1, cursor);
    }
    return null;
  }

  static _TokenRange? _nextMathToken(String source, int index) {
    var cursor = index;
    while (cursor < source.length && source[cursor].trim().isEmpty) {
      cursor++;
    }
    if (cursor >= source.length) {
      return null;
    }

    final char = source[cursor];
    if (_isMathPunctuation(char)) {
      return _TokenRange(cursor, cursor + 1);
    }
    if (char == r'\') {
      var end = cursor + 1;
      while (end < source.length && RegExp(r'[A-Za-z]').hasMatch(source[end])) {
        end++;
      }
      return end > cursor + 1 ? _TokenRange(cursor, end) : null;
    }
    if (RegExp(r'[0-9.]').hasMatch(char)) {
      var end = cursor + 1;
      while (end < source.length && RegExp(r'[0-9.]').hasMatch(source[end])) {
        end++;
      }
      return _TokenRange(cursor, end);
    }
    if (RegExp(r'[A-Za-z]').hasMatch(char)) {
      var end = cursor + 1;
      while (end < source.length && RegExp(r'[A-Za-z]').hasMatch(source[end])) {
        end++;
      }
      final word = source.substring(cursor, end);
      return _isMathWord(word) ? _TokenRange(cursor, end) : null;
    }
    if (_isUnicodeMathChar(char)) {
      return _TokenRange(cursor, cursor + 1);
    }
    return null;
  }

  static bool _looksLikeStandaloneMathExpression(String source) {
    final value = source.trim();
    if (value.length > 140 ||
        RegExp(
          r'\b(?:none|only|cannot|solution|solutions|matrix|vertices|circle|ellipse|parabola|hyperbola|units?|above|these|following)\b',
          caseSensitive: false,
        ).hasMatch(value)) {
      return false;
    }
    return _looksLikeMathExpression(value);
  }

  static bool _looksLikeMathExpression(String source) {
    final value = source.trim();
    if (value.isEmpty) {
      return false;
    }
    if (RegExp(r'^[+\-−]?\s*\d+(?:\.\d+)?$').hasMatch(value)) {
      return false;
    }
    final hasMathSignal =
        RegExp(r'\\[A-Za-z]+').hasMatch(value) ||
        RegExp(
          r'[∑∫√αβγδλμπωθ≤≥≈≠∞∂∇∈∉∀∠∪∩⊂⊆∅⊥⇔₀₁₂₃₄₅₆₇₈₉₊₋₌₍₎ₐₑₕᵢⱼₖₗₘₙₒₚᵣₛₜₓ⁰¹²³⁴⁵⁶⁷⁸⁹⁺⁻⁼⁽⁾ⁿᵃᵇᶜᵈᵉᶠᵍʰⁱʲᵏˡᵐᵒᵖʳˢᵗᵘᵛʷˣʸᶻ]',
        ).hasMatch(value) ||
        RegExp(
          r'\b(?:sin|cos|tan|cot|sec|csc|cosec|log|ln|lim)\b',
        ).hasMatch(value) ||
        RegExp(r'[\^_=<>+\-*/|]').hasMatch(value);
    if (!hasMathSignal) {
      return false;
    }

    final words = RegExp(r'(?<!\\)\b[A-Za-z]{2,}\b')
        .allMatches(value)
        .map((match) => match.group(0) ?? '')
        .where((word) => word.isNotEmpty);
    for (final word in words) {
      if (!_isMathWord(word)) {
        return false;
      }
    }
    return true;
  }

  static bool _shouldDisplayRawExpression(String value) {
    return value.length > 48 ||
        RegExp(r'\\(?:frac|sqrt|sum|prod|int|lim|begin\{)').hasMatch(value);
  }

  static bool _isMathWord(String word) {
    final clean = word.trim();
    if (clean.length <= 1) {
      return true;
    }
    if (RegExp(
      r'^(?:sin|cos|tan|cot|sec|csc|cosec|log|ln)[A-Za-z]$',
    ).hasMatch(clean)) {
      return true;
    }
    return const {
      'sin',
      'cos',
      'cox',
      'tan',
      'cot',
      'sec',
      'csc',
      'cosec',
      'log',
      'ln',
      'lim',
      'amp',
      'arg',
      'det',
      'mod',
      'dx',
      'dy',
      'dz',
      'dt',
      'Re',
      'Im',
    }.contains(clean);
  }

  static bool _isMathPunctuation(String char) =>
      RegExp(r'[+\-−*/=<>^_(){}\[\]|,°]').hasMatch(char);

  static bool _isUnicodeMathChar(String char) =>
      RegExp(
        r'[∑∫√αβγδλμπωθ≤≥≈≠∞∂∇∈∉∀∠∪∩⊂⊆∅⊥⇔₀₁₂₃₄₅₆₇₈₉₊₋₌₍₎ₐₑₕᵢⱼₖₗₘₙₒₚᵣₛₜₓ⁰¹²³⁴⁵⁶⁷⁸⁹⁺⁻⁼⁽⁾ⁿᵃᵇᶜᵈᵉᶠᵍʰⁱʲᵏˡᵐᵒᵖʳˢᵗᵘᵛʷˣʸᶻ]',
      ).hasMatch(char);

  static int? _matchingOpenBrace(String source, int closeIndex, int floor) {
    var depth = 0;
    for (var index = closeIndex; index >= floor; index--) {
      if (source[index] == '}') {
        depth++;
      } else if (source[index] == '{') {
        depth--;
        if (depth == 0) {
          if (index > floor && source[index - 1] == r'\') {
            var commandStart = index - 1;
            while (commandStart > floor &&
                RegExp(r'[A-Za-z]').hasMatch(source[commandStart - 1])) {
              commandStart--;
            }
            return commandStart;
          }
          return index;
        }
      }
    }
    return null;
  }

  static int _rawMathEnvironmentStart(String source, [int cursor = 0]) {
    final match = RegExp(
      r'\\begin\{(?:array|matrix|bmatrix|pmatrix|vmatrix|Vmatrix|cases|aligned|gathered)\}',
    ).firstMatch(source.substring(cursor));
    if (match == null) {
      return -1;
    }
    return cursor + match.start;
  }

  static int _rawMathEnvironmentEnd(String source, int start) {
    final envMatch = RegExp(
      r'\\begin\{(array|matrix|bmatrix|pmatrix|vmatrix|Vmatrix|cases|aligned|gathered)\}',
    ).matchAsPrefix(source.substring(start));
    if (envMatch == null) {
      return start;
    }
    final env = envMatch.group(1)!;
    final endToken = '\\end{$env}';
    final end = source.indexOf(endToken, start + envMatch.group(0)!.length);
    if (end == -1) {
      return start;
    }
    return end + endToken.length;
  }

  static const String _rawMathCommandPattern =
      r'\\(?:frac|sqrt|Gamma|Delta|Theta|Lambda|Xi|Pi|Sigma|Upsilon|Phi|Psi|Omega|alpha|beta|gamma|delta|epsilon|varepsilon|theta|lambda|mu|pi|sigma|phi|varphi|omega|sin|cos|tan|cot|sec|csc|log|ln|det|operatorname|sum|prod|int|oint|lim|times|cdot|div|pm|mp|le|leq|ge|geq|ne|neq|approx|equiv|notin|in|forall|exists|angle|cup|cap|subset|subseteq|supset|supseteq|emptyset|varnothing|perp|parallel|circ|to|rightarrow|leftarrow|Rightarrow|Leftarrow|Leftrightarrow|leftrightarrow|iff|implies|ldots|cdots|dots|bar|overline|vec|hat|widehat|tilde|dot|ddot)';
}

class _RawMathMatch {
  const _RawMathMatch(this.start, this.end, this.display);

  final int start;
  final int end;
  final bool display;
}

class _TokenRange {
  const _TokenRange(this.start, this.end);

  final int start;
  final int end;
}

class _MathDelimiter {
  const _MathDelimiter(this.open, this.close, this.display, this.start);

  final String open;
  final String close;
  final bool display;
  final int start;
}

class _MathDelimiterPair {
  const _MathDelimiterPair(this.open, this.close);

  final String open;
  final String close;
}

class _StrippedMathDelimiters {
  const _StrippedMathDelimiters(this.open, this.close, this.body);

  final String open;
  final String close;
  final String body;
}
