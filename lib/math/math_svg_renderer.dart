import 'math_content.dart';
import 'math_svg_renderer_stub.dart'
    if (dart.library.html) 'math_svg_renderer_web.dart' as impl;

Future<List<MathContentSegment>> renderMathSegments(String input) {
  return impl.renderMathSegments(input);
}

Future<List<MathContentSegment>> renderOptionMathSegments(String input) {
  return impl.renderOptionMathSegments(input);
}
