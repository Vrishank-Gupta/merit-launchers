class MathContentSegment {
  const MathContentSegment({
    required this.type,
    required this.value,
    this.display = false,
    this.svg,
  });

  final String type;
  final String value;
  final bool display;
  final String? svg;

  bool get isMath => type == 'math';

  MathContentSegment copyWith({
    String? type,
    String? value,
    bool? display,
    String? svg,
  }) {
    return MathContentSegment(
      type: type ?? this.type,
      value: value ?? this.value,
      display: display ?? this.display,
      svg: svg ?? this.svg,
    );
  }

  Map<String, dynamic> toJson() {
    return {'type': type, 'value': value, 'display': display, 'svg': svg};
  }

  factory MathContentSegment.fromJson(Map<String, dynamic> json) {
    return MathContentSegment(
      type: json['type'] as String? ?? 'text',
      value: MathContentParser.normalizeSourceText(
        json['value'] as String? ?? '',
      ),
      display: json['display'] as bool? ?? false,
      svg: json['svg'] as String?,
    );
  }
}

class MathContentParser {
  static String normalizeSourceText(String input) {
    final normalized = input
        .replaceAll(r'\$', r'$')
        .replaceAll('\r\n', '\n')
        .replaceAll('\r', '\n');
    return _repairBareMathEnvironments(normalized);
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

    if (segments.isEmpty && _looksLikeStandaloneMath(source)) {
      return [MathContentSegment(type: 'math', value: source, display: true)];
    }

    return segments.isEmpty
        ? [MathContentSegment(type: 'text', value: source)]
        : segments;
  }

  static bool _looksLikeStandaloneMath(String source) {
    return (_rawMathEnvironmentStart(source) >= 0 ||
            RegExp(r'\\[A-Za-z]+').hasMatch(source) ||
            RegExp(
              r'(?<!\w)[A-Za-z0-9)\]}]+(?:\^\{?[^ }\n]+\}?|_\{?[^ }\n]+\}?)+',
            ).hasMatch(source) ||
            RegExp(r'[∑∫√Δπωθ≤≥≈≠∞∂∇]').hasMatch(source)) &&
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

    return output;
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
      final match = _nextRawMathMatch(value, cursor);
      if (match == null) {
        _appendText(segments, value.substring(cursor));
        return;
      }
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
    final commandMatch = RegExp(
      r'\\(?:frac|sqrt|Delta|alpha|beta|gamma|theta|pi|omega|sin|cos|tan|cot|sec|csc|log|ln|det|operatorname|sum|int|lim|times|cdot|bar|overline|vec|hat|angle)',
    ).matchAsPrefix(source.substring(cursor));

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
    if (commandMatch != null) {
      final start = cursor + commandMatch.start;
      final end = _rawCommandEnd(source, start);
      if (end > start) {
        candidates.add(_RawMathMatch(start, end, false));
      }
    }

    if (candidates.isEmpty) {
      final scriptMatch = RegExp(
        r'(?<!\w)[A-Za-z0-9)\]}]+(?:\^\{?[^ }\n]+\}?|_\{?[^ }\n]+\}?)+',
      ).firstMatch(source.substring(cursor));
      if (scriptMatch != null) {
        final start = cursor + scriptMatch.start;
        final end = cursor + scriptMatch.end;
        return _RawMathMatch(start, end, false);
      }
      final firstCommand = RegExp(
        r'\\(?:frac|sqrt|Delta|alpha|beta|gamma|theta|pi|omega|sin|cos|tan|cot|sec|csc|log|ln|det|operatorname|sum|int|lim|times|cdot|bar|overline|vec|hat|angle)',
      ).firstMatch(source.substring(cursor));
      if (firstCommand != null) {
        final start = cursor + firstCommand.start;
        final end = _rawCommandEnd(source, start);
        if (end > start) {
          return _RawMathMatch(start, end, false);
        }
      }
      return null;
    }

    candidates.sort((left, right) => left.start.compareTo(right.start));
    return candidates.first;
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

  static int _rawCommandEnd(String source, int start) {
    var index = start;
    var braceDepth = 0;
    var parenDepth = 0;
    var bracketDepth = 0;

    while (index < source.length) {
      final char = source[index];

      if (char == r'\') {
        index++;
        while (index < source.length &&
            RegExp(r'[A-Za-z]').hasMatch(source[index])) {
          index++;
        }
        continue;
      }

      if (char == '{') braceDepth++;
      if (char == '}') braceDepth = braceDepth > 0 ? braceDepth - 1 : 0;
      if (char == '(') parenDepth++;
      if (char == ')') parenDepth = parenDepth > 0 ? parenDepth - 1 : 0;
      if (char == '[') bracketDepth++;
      if (char == ']') bracketDepth = bracketDepth > 0 ? bracketDepth - 1 : 0;

      if (braceDepth == 0 && parenDepth == 0 && bracketDepth == 0) {
        if (char == '\n') {
          break;
        }
        if (char == ' ') {
          final remainder = source.substring(index + 1);
          if (RegExp(
            r'^(?:and|or|then|where|equal|equals|is|are|if|what|which|whose|that|than|of|to|in|on|at|for|with|from|the|a|an)\b',
            caseSensitive: false,
          ).hasMatch(remainder)) {
            break;
          }
        }
      }

      index++;
    }

    return index;
  }
}

class _RawMathMatch {
  const _RawMathMatch(this.start, this.end, this.display);

  final int start;
  final int end;
  final bool display;
}

class _MathDelimiter {
  const _MathDelimiter(this.open, this.close, this.display, this.start);

  final String open;
  final String close;
  final bool display;
  final int start;
}
