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
    return {
      'type': type,
      'value': value,
      'display': display,
      'svg': svg,
    };
  }

  factory MathContentSegment.fromJson(Map<String, dynamic> json) {
    return MathContentSegment(
      type: json['type'] as String? ?? 'text',
      value: MathContentParser.normalizeSourceText(json['value'] as String? ?? ''),
      display: json['display'] as bool? ?? false,
      svg: json['svg'] as String?,
    );
  }
}

class MathContentParser {
  static String normalizeSourceText(String input) {
    return input
        .replaceAll(r'\$', r'$')
        .replaceAll('\r\n', '\n')
        .replaceAll('\r', '\n');
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
        _appendText(segments, source.substring(cursor));
        break;
      }

      candidates.sort((left, right) => left.start.compareTo(right.start));
      final nextDelimiter = candidates.first;
      final nextStart = nextDelimiter.start;
      if (nextStart == -1) {
        _appendText(segments, source.substring(cursor));
        break;
      }

      if (nextStart > cursor) {
        _appendText(segments, source.substring(cursor, nextStart));
      }

      final contentStart = nextStart + nextDelimiter.open.length;
      final end = source.indexOf(nextDelimiter.close, contentStart);

      if (end == -1) {
        _appendText(segments, source.substring(nextStart));
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
      return [
        MathContentSegment(
          type: 'math',
          value: source,
          display: true,
        ),
      ];
    }

    return segments.isEmpty
        ? [MathContentSegment(type: 'text', value: source)]
        : segments;
  }

  static bool _looksLikeStandaloneMath(String source) {
    return RegExp(r'\\[A-Za-z]+').hasMatch(source) &&
        !RegExp(r'[.!?]\s').hasMatch(source);
  }

  static void _appendText(List<MathContentSegment> segments, String value) {
    if (value.isEmpty) {
      return;
    }
    segments.add(MathContentSegment(type: 'text', value: value));
  }
}

class _MathDelimiter {
  const _MathDelimiter(this.open, this.close, this.display, this.start);

  final String open;
  final String close;
  final bool display;
  final int start;
}
