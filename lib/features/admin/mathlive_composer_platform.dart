import 'package:flutter/widgets.dart';

abstract class AdminMathComposer {
  bool get supportsVisualBuilder;
  Future<void> initialize();
  Widget buildEditor();
  Future<void> insertTemplate(String latexTemplate);
  Future<void> moveToNextPlaceholder();
  Future<void> deleteBackward();
  Future<void> clear();
  Future<void> focus();
  Future<String> getLatex();
  void dispose();
}
