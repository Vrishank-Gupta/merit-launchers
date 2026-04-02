import 'math_bootstrap_stub.dart'
    if (dart.library.html) 'math_bootstrap_web.dart'
    if (dart.library.io) 'math_bootstrap_native.dart' as impl;

Future<void> ensureMathRenderingReady() => impl.ensureMathRenderingReady();
