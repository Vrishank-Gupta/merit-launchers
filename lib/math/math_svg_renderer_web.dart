// ignore_for_file: deprecated_member_use, avoid_web_libraries_in_flutter

import 'dart:html' as html;
import 'dart:js_util' as js_util;

import 'math_content.dart';
import 'math_bootstrap.dart';

Future<List<MathContentSegment>> renderMathSegments(String input) async {
  final segments = MathContentParser.parse(input);
  await ensureMathRenderingReady();
  final meritMath = js_util.getProperty(html.window, 'meritMath');
  if (meritMath == null) {
    return segments;
  }

  final rendered = <MathContentSegment>[];
  for (final segment in segments) {
    if (!segment.isMath) {
      rendered.add(segment);
      continue;
    }

    try {
      final promise = js_util.callMethod(
        meritMath,
        'texToSvg',
        [segment.value, segment.display],
      );
      final svg = await js_util.promiseToFuture<String>(promise);
      rendered.add(segment.copyWith(svg: svg));
    } catch (_) {
      rendered.add(segment);
    }
  }

  return rendered;
}

/// Like [renderMathSegments] but forces every math segment to [display]=false.
/// Use this for answer options so they are always stored and rendered as inline
/// math, producing consistent heights across all options in an exam.
Future<List<MathContentSegment>> renderOptionMathSegments(String input) async {
  final segments = await renderMathSegments(input);
  return segments
      .map((s) => s.isMath ? s.copyWith(display: false) : s)
      .toList();
}
