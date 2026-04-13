import 'math_svg_embed_stub.dart'
    if (dart.library.html) 'math_svg_embed_web.dart' as impl;

Future<String?> renderLatexToSvgDataUri(
  String latex, {
  required bool display,
}) {
  return impl.renderLatexToSvgDataUri(latex, display: display);
}
