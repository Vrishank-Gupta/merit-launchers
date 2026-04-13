import 'mathlive_composer_platform.dart';
import 'mathlive_composer_stub.dart'
    if (dart.library.html) 'mathlive_composer_web.dart'
    as impl;

AdminMathComposer createAdminMathComposer({String initialLatex = ''}) {
  return impl.createAdminMathComposer(initialLatex: initialLatex);
}
