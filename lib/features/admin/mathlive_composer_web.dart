// ignore_for_file: deprecated_member_use, avoid_web_libraries_in_flutter

import 'dart:html' as html;
import 'dart:js_util' as js_util;
import 'dart:ui_web' as ui_web;

import 'package:flutter/material.dart';

import 'mathlive_composer_platform.dart';

AdminMathComposer createAdminMathComposer({String initialLatex = ''}) {
  return _WebAdminMathComposer(initialLatex: initialLatex);
}

class _WebAdminMathComposer implements AdminMathComposer {
  _WebAdminMathComposer({String initialLatex = ''})
    : _initialLatex = initialLatex,
      _viewType = 'ml-mathlive-${_nextId++}';

  static int _nextId = 0;

  final String _initialLatex;
  final String _viewType;

  html.Element? _mathField;
  Future<void>? _initFuture;
  bool _disposed = false;

  @override
  bool get supportsVisualBuilder => true;

  @override
  Future<void> initialize() {
    return _initFuture ??= _initializeInternal();
  }

  Future<void> _initializeInternal() async {
    final meritMathLive = js_util.getProperty(html.window, 'meritMathLive');
    if (meritMathLive != null) {
      final promise = js_util.callMethod<Object?>(
        meritMathLive,
        'ensureLoaded',
        const [],
      );
      if (promise != null) {
        await js_util.promiseToFuture<Object?>(promise);
      }
    }
    if (_disposed) return;

    final host =
        html.DivElement()
          ..style.width = '100%'
          ..style.height = '100%'
          ..style.border = '1px solid #d7e3f3'
          ..style.borderRadius = '16px'
          ..style.background = '#ffffff'
          ..style.overflow = 'auto'
          ..style.boxSizing = 'border-box';

    final mathField =
        html.Element.tag('math-field')
          ..style.display = 'block'
          ..style.width = '100%'
          ..style.minHeight = '240px'
          ..style.padding = '16px'
          ..style.fontSize = '30px'
          ..style.boxSizing = 'border-box'
          ..style.outline = 'none'
          ..style.border = 'none'
          ..style.background = 'transparent';

    js_util.setProperty(mathField, 'smartMode', false);
    js_util.setProperty(mathField, 'defaultMode', 'math');
    js_util.setProperty(mathField, 'smartFence', true);
    js_util.setProperty(mathField, 'virtualKeyboardMode', 'manual');
    js_util.setProperty(mathField, 'value', _initialLatex);

    host.append(mathField);
    _mathField = mathField;

    ui_web.platformViewRegistry.registerViewFactory(_viewType, (_) => host);

    await focus();
  }

  @override
  Widget buildEditor() {
    return HtmlElementView(viewType: _viewType);
  }

  @override
  Future<void> insertTemplate(String latexTemplate) async {
    await initialize();
    final field = _mathField;
    if (field == null) return;
    try {
      final insertOptions = js_util.jsify(<String, Object?>{
        'selectionMode': 'placeholder',
        'focus': true,
      });
      js_util.callMethod(field, 'insert', <Object?>[latexTemplate, insertOptions]);
    } catch (_) {
      try {
        js_util.callMethod(field, 'executeCommand', <Object?>[
          js_util.jsify(<Object?>['insert', latexTemplate]),
        ]);
      } catch (_) {
        final current = await getLatex();
        js_util.setProperty(field, 'value', '$current$latexTemplate');
      }
    }
    await moveToNextPlaceholder();
    await focus();
  }

  @override
  Future<void> moveToNextPlaceholder() async {
    await initialize();
    final field = _mathField;
    if (field == null) return;
    try {
      js_util.callMethod(field, 'executeCommand', <Object?>[
        js_util.jsify(<Object?>['moveToNextPlaceholder']),
      ]);
    } catch (_) {}
    await focus();
  }

  @override
  Future<void> deleteBackward() async {
    await initialize();
    final field = _mathField;
    if (field == null) return;
    try {
      js_util.callMethod(field, 'executeCommand', <Object?>[
        js_util.jsify(<Object?>['deleteBackward']),
      ]);
    } catch (_) {
      final current = await getLatex();
      if (current.isNotEmpty) {
        js_util.setProperty(
          field,
          'value',
          current.substring(0, current.length - 1),
        );
      }
    }
    await focus();
  }

  @override
  Future<void> clear() async {
    await initialize();
    final field = _mathField;
    if (field == null) return;
    js_util.setProperty(field, 'value', '');
    await focus();
  }

  @override
  Future<void> focus() async {
    final field = _mathField;
    if (field == null) return;
    try {
      js_util.callMethod(field, 'focus', const []);
    } catch (_) {}
  }

  @override
  Future<String> getLatex() async {
    await initialize();
    final field = _mathField;
    if (field == null) return '';
    try {
      final expanded = js_util.callMethod<Object?>(field, 'getValue', <Object?>[
        'latex-expanded',
      ]);
      if (expanded is String && expanded.trim().isNotEmpty) {
        return expanded.trim();
      }
      final value = js_util.callMethod<Object?>(field, 'getValue', <Object?>[
        'latex',
      ]);
      if (value is String && value.trim().isNotEmpty) {
        return value.trim();
      }
    } catch (_) {}
    final raw = js_util.getProperty<Object?>(field, 'value');
    return raw is String ? raw.trim() : '';
  }

  @override
  void dispose() {
    _disposed = true;
    _mathField = null;
  }
}
