import 'dart:convert';
import 'dart:html' as html;
import 'dart:js_util' as js_util;

Future<String?> renderLatexToSvgDataUri(
  String latex, {
  required bool display,
}) async {
  final normalized = latex.trim();
  if (normalized.isEmpty) {
    return null;
  }

  final meritMathRender = js_util.getProperty<Object?>(
    html.window,
    'meritMath',
  );
  if (meritMathRender == null) {
    return null;
  }

  try {
    final ensureLoaded = js_util.getProperty<Object?>(meritMathRender, 'ensureLoaded');
    if (ensureLoaded != null) {
      final loadResult = js_util.callMethod<Object?>(
        meritMathRender,
        'ensureLoaded',
        const [],
      );
      if (loadResult != null) {
        await js_util.promiseToFuture<Object?>(loadResult);
      }
    }

    final promise = js_util.callMethod<Object?>(
      meritMathRender,
      'texToSvg',
      [normalized, display],
    );
    if (promise == null) {
      return null;
    }
    final svgResult = await js_util.promiseToFuture<Object?>(promise);
    if (svgResult is! String) {
      return null;
    }
    final svg = svgResult;
    if (svg.trim().isEmpty) {
      return null;
    }
    final base64 = base64Encode(utf8.encode(svg));
    return 'data:image/svg+xml;base64,$base64';
  } catch (_) {
    return null;
  }
}
