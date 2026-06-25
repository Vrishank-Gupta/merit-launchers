import 'package:flutter_test/flutter_test.dart';
import 'package:merit_launchers/math/math_content.dart';

void main() {
  group('MathContentParser', () {
    test('repairs copied bare matrix environments into math segments', () {
      const samples = [
        r'beginmatrix a & b \\ c & d endmatrix',
        r'beginmatrix a & b \\ c & d endymatrix',
        r'beginmatrix a & b \ c & d endmatrix',
        r'beginmatrix a & b \ c d endmatrix',
        r'begin{bmatrix} a & b \\ c & d end{bmatrix}',
        r'\begin{bmatrix} a & b \\ c & d \end{bmatrix}',
      ];

      for (final sample in samples) {
        final segments = MathContentParser.parse(sample);

        expect(segments, hasLength(1), reason: sample);
        expect(segments.single.isMath, isTrue, reason: sample);
        expect(segments.single.value, contains(r'\begin{'), reason: sample);
        expect(segments.single.value, contains(r'\end{'), reason: sample);
        expect(segments.single.value, isNot(contains('beginmatrix')));
      }
    });

    test('repairs copied reference matrix when embedded in question text', () {
      final segments = MathContentParser.parse(
        r'What is the central idea of the passage? beginmatrix a & b \ c d endmatrix',
      );

      expect(segments.where((segment) => segment.isMath), hasLength(1));
      final math = segments.firstWhere((segment) => segment.isMath).value;
      expect(math, r'\begin{matrix} a & b \\ c & d\end{matrix}');
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

    test('parses deterministic import fractions as a single math segment', () {
      final segments = MathContentParser.parse(r'\( (\frac{\pi}{16})^c \)');

      expect(segments, hasLength(1));
      expect(segments.single.isMath, isTrue);
      expect(segments.single.value, r'(\frac{\pi}{16})^c');
    });

    test('keeps Q4-style overbars inside one inline math segment', () {
      final segments = MathContentParser.parse(
        r'The equation \( z\bar{z} + a\bar{z} + \bar{a}z + b = 0 \), b∈ R represents a circle, if',
      );

      final mathSegments = segments.where((segment) => segment.isMath).toList();
      expect(mathSegments, hasLength(1));
      expect(mathSegments.single.value, contains(r'z\bar{z}'));
      expect(mathSegments.single.value, contains(r'\bar{a}z'));
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
          r'\lambda=6',
          r'\mu \in A \cap B',
          r'A \subseteq B \Leftrightarrow B \supseteq A',
          r'a \perp b, \emptyset, \ldots',
          r'30^\circ, x \notin A',
          r'\hat{a} \cdot \hat{b}',
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

    test('parses SVG image markers as image segments', () {
      final svgData =
          'data:image/svg+xml;base64,'
          'PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI4MCIgaGVpZ2h0PSIyOCI+PC9zdmc+';
      final segments = MathContentParser.parse(
        'The value of [[image:$svgData]] is',
      );

      expect(segments.where((segment) => segment.isImage), hasLength(1));
      expect(segments.first.value, 'The value of ');
      expect(segments[1].value, svgData);
      expect(segments.last.value, ' is');
    });
  });
}
