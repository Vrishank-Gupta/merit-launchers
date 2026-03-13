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
      value: json['value'] as String? ?? '',
      display: json['display'] as bool? ?? false,
      svg: json['svg'] as String?,
    );
  }
}

class MathContentParser {
  static List<MathContentSegment> parse(String input) {
    final source = input.trim();
    if (source.isEmpty) {
      return const [];
    }

    final segments = <MathContentSegment>[];
    var cursor = 0;

    while (cursor < source.length) {
      final displayStart = source.indexOf('\$\$', cursor);
      final inlineStart = source.indexOf('\$', cursor);

      final nextStart = _pickStart(displayStart, inlineStart);
      if (nextStart == -1) {
        _appendText(segments, source.substring(cursor));
        break;
      }

      if (nextStart > cursor) {
        _appendText(segments, source.substring(cursor, nextStart));
      }

      final isDisplay = displayStart != -1 && displayStart == nextStart;
      final marker = isDisplay ? '\$\$' : '\$';
      final contentStart = nextStart + marker.length;
      final end = source.indexOf(marker, contentStart);

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
            display: isDisplay,
          ),
        );
      }
      cursor = end + marker.length;
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

  static int _pickStart(int displayStart, int inlineStart) {
    if (displayStart == -1) {
      return inlineStart;
    }
    if (inlineStart == -1) {
      return displayStart;
    }
    return displayStart < inlineStart ? displayStart : inlineStart;
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
