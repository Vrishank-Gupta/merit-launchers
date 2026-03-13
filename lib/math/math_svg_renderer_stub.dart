import 'math_content.dart';

Future<List<MathContentSegment>> renderMathSegments(String input) async {
  return MathContentParser.parse(input);
}
