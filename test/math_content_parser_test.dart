import 'package:flutter_test/flutter_test.dart';
import 'package:merit_launchers/math/math_content.dart';

void main() {
  group('MathContentParser', () {
    test('repairs copied bare matrix environments into math segments', () {
      const samples = [
        r'beginmatrix a & b \\ c & d endmatrix',
        r'beginmatrix a & b \\ c & d endymatrix',
        r'begin{bmatrix} a & b \\ c & d end{bmatrix}',
        r'\begin{bmatrix} a & b \\ c & d \end{bmatrix}',
      ];

      for (final sample in samples) {
        final segments = MathContentParser.parse(sample);

        expect(segments, hasLength(1), reason: sample);
        expect(segments.single.isMath, isTrue, reason: sample);
        expect(segments.single.value, contains(r'\begin{'), reason: sample);
        expect(segments.single.value, contains(r'\end{'), reason: sample);
      }
    });

    test('keeps inline and display delimiters renderable', () {
      final segments = MathContentParser.parse(
        r'The value of $x^{2} + \sqrt{y}$ and $$\frac{a}{b}$$ is known.',
      );

      expect(segments.where((segment) => segment.isMath), hasLength(2));
      expect(segments.where((segment) => segment.display), hasLength(1));
      expect(
        segments.map((segment) => segment.value).join(' '),
        contains(r'x^{2}'),
      );
      expect(
        segments.map((segment) => segment.value).join(' '),
        contains(r'\frac{a}{b}'),
      );
    });

    test(
      'detects representative raw LaTeX commands without leaking as plain text',
      () {
        const samples = [
          r'\frac{numerator}{denominator}',
          r'\sqrt[n]{x}',
          r'\sin^{-1}x',
          r'\alpha \beta \gamma \theta \lambda \mu \pi \sigma \omega \Delta',
          r'\sum_{i=1}^{n} i',
          r'\int_a^b f(x)\,dx',
          r'\begin{vmatrix} a & b \\ c & d \end{vmatrix}',
          r'f(x)=\begin{cases} x^2, & x>0 \\ 0, & x=0 \end{cases}',
        ];

        for (final sample in samples) {
          final segments = MathContentParser.parse(sample);

          expect(
            segments.any((segment) => segment.isMath),
            isTrue,
            reason: sample,
          );
          expect(
            segments
                .where((segment) => segment.isMath)
                .map((segment) => segment.value)
                .join(' '),
            isNot(contains(r'$')),
            reason: sample,
          );
        }
      },
    );

    test('normalizes escaped dollar signs from admin inputs', () {
      final normalized = MathContentParser.normalizeSourceText(
        r'The value of \$x^2\$ is 4',
      );

      expect(normalized, r'The value of $x^2$ is 4');
      expect(
        MathContentParser.parse(normalized).where((segment) => segment.isMath),
        hasLength(1),
      );
    });
  });
}
