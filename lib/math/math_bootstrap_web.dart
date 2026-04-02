// ignore_for_file: deprecated_member_use, avoid_web_libraries_in_flutter

import 'dart:html' as html;
import 'dart:js_util' as js_util;

import 'package:flutter_tex/flutter_tex.dart';

Future<void>? _startupFuture;

Future<void> ensureMathRenderingReady() {
  return _startupFuture ??= _start();
}

Future<void> _start() async {
  final meritMath = js_util.getProperty(html.window, 'meritMath');
  if (meritMath != null) {
    final promise = js_util.callMethod<Object?>(meritMath, 'ensureLoaded', const []);
    if (promise != null) {
      await js_util.promiseToFuture<Object?>(promise);
    }
  }
  await TeXRenderingServer.start();
}
