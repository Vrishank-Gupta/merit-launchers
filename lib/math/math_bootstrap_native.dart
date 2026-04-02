import 'package:flutter_tex/flutter_tex.dart';

Future<void>? _startupFuture;

Future<void> ensureMathRenderingReady() {
  return _startupFuture ??= _start();
}

Future<void> _start() async {
  try {
    await TeXRenderingServer.start();
  } catch (error) {
    final message = error.toString().toLowerCase();
    if (!message.contains('server already started')) {
      rethrow;
    }
  }
}
