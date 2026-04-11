import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:merit_launchers/widgets/math_text.dart';

void main() {
  group('MathFormatter fallback renderer', () {
    test('formats common raw LaTeX without leaking dollar or slash commands', () {
      final formatted = MathFormatter.format(
        r'$\sin^{-1}\left(\sin \frac{3\pi}{5}\right)$',
      );

      expect(formatted, isNot(contains(r'$')));
      expect(formatted, isNot(contains(r'\sin')));
      expect(formatted, isNot(contains(r'\frac')));
      expect(formatted, contains('sin'));
      expect(formatted, contains('π'));
      expect(formatted, contains('⁻¹'));
    });

    test('keeps powers and subscripts as rich inline spans for preview text', () {
      final spans = MathFormatter.toInlineSpans(
        r'The value of x^2 + y_{10} is',
        const TextStyle(fontSize: 18),
      );

      expect(spans.whereType<WidgetSpan>(), hasLength(2));
      expect(
        spans.whereType<TextSpan>().map((span) => span.text ?? '').join(),
        isNot(contains('^2')),
      );
      expect(
        spans.whereType<TextSpan>().map((span) => span.text ?? '').join(),
        isNot(contains('_{10}')),
      );
    });

    test('respects basic editor formatting tags', () {
      final spans = MathFormatter.toInlineSpans(
        '<b>Bold</b> <u>underlined</u> <i>italic</i>',
        const TextStyle(fontSize: 18),
      );

      expect(spans.whereType<TextSpan>().map((span) => span.text).join(), contains('Bold'));
      expect(
        spans.whereType<TextSpan>().any(
              (span) => span.style?.fontWeight == FontWeight.w700,
            ),
        isTrue,
      );
      expect(
        spans.whereType<TextSpan>().any(
              (span) => span.style?.decoration == TextDecoration.underline,
            ),
        isTrue,
      );
      expect(
        spans.whereType<TextSpan>().any(
              (span) => span.style?.fontStyle == FontStyle.italic,
            ),
        isTrue,
      );
    });
  });
}
