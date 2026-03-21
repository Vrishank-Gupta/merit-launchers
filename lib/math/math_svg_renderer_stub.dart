import 'math_content.dart';

Future<List<MathContentSegment>> renderMathSegments(String input) async {
  return MathContentParser.parse(input);
}

Future<List<MathContentSegment>> renderOptionMathSegments(String input) async {
  final segments = await renderMathSegments(input);
  return segments
      .map((s) => s.isMath ? s.copyWith(display: false) : s)
      .toList();
}
