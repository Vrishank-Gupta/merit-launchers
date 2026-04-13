import 'package:flutter/material.dart';

import 'mathlive_composer_platform.dart';

AdminMathComposer createAdminMathComposer({String initialLatex = ''}) {
  return _FallbackAdminMathComposer(initialLatex: initialLatex);
}

class _FallbackAdminMathComposer implements AdminMathComposer {
  _FallbackAdminMathComposer({String initialLatex = ''})
    : _controller = TextEditingController(text: initialLatex);

  final TextEditingController _controller;

  @override
  bool get supportsVisualBuilder => false;

  @override
  Future<void> clear() async {
    _controller.clear();
  }

  @override
  void dispose() {
    _controller.dispose();
  }

  @override
  Widget buildEditor() {
    return TextField(
      controller: _controller,
      maxLines: null,
      expands: true,
      decoration: const InputDecoration(
        hintText: 'Visual math builder is available on web. Type LaTeX here.',
        border: InputBorder.none,
        contentPadding: EdgeInsets.all(16),
      ),
    );
  }

  @override
  Future<void> deleteBackward() async {
    final text = _controller.text;
    if (text.isEmpty) return;
    _controller.text = text.substring(0, text.length - 1);
    _controller.selection = TextSelection.collapsed(
      offset: _controller.text.length,
    );
  }

  @override
  Future<void> focus() async {}

  @override
  Future<String> getLatex() async => _controller.text.trim();

  @override
  Future<void> initialize() async {}

  @override
  Future<void> insertTemplate(String latexTemplate) async {
    final selection = _controller.selection;
    final start = selection.isValid ? selection.start : _controller.text.length;
    final end = selection.isValid ? selection.end : _controller.text.length;
    final next =
        _controller.text.substring(0, start) +
        latexTemplate +
        _controller.text.substring(end);
    _controller.text = next;
    _controller.selection = TextSelection.collapsed(
      offset: start + latexTemplate.length,
    );
  }

  @override
  Future<void> moveToNextPlaceholder() async {}
}
