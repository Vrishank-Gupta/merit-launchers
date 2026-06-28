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

    test('detects bare imported integral equations inside prompt text', () {
      final segments = MathContentParser.parse(
        r'The value of \int \frac{dx}{x^{2}(x^{4} + 1)^{3}^{/}^{4}} is',
      );

      final mathSegments = segments.where((segment) => segment.isMath).toList();
      expect(mathSegments, hasLength(1));
      expect(mathSegments.single.value, contains(r'\int'));
      expect(mathSegments.single.value, contains(r'\frac{dx}'));
    });

    test('keeps PDF-style raw equations as complete math segments', () {
      const samples = {
        r'The differential equation y \frac{dx}{dy} = y -1, y(0) =1 has':
            r'y \frac{dx}{dy} = y -1, y(0) =1',
        r'Solution of the differential equation sec^2 x tan y dx + sec^2 y tan x dy = 0 is':
            r'sec^2 x tan y dx + sec^2 y tan x dy = 0',
        r'x - y + C =log (3x - 4y + 1)': r'x - y + C =log (3x - 4y + 1)',
        r'|z_1|+|z^2|is': r'|z_1|+|z^2|',
        r'The point on the line 3x + 4y = 5, which is equidistant':
            r'3x + 4y = 5',
      };

      for (final entry in samples.entries) {
        final mathSegments =
            MathContentParser.parse(
              entry.key,
            ).where((segment) => segment.isMath).toList();

        expect(mathSegments.map((segment) => segment.value), [entry.value]);
      }
    });

    test('treats matching PDF option expressions consistently', () {
      const optionSets = [
        [
          r'tan x + tan y = C',
          r'tan x tan y = C',
          r'tan x - tan y = C',
          r'tan x sec y = C',
        ],
        [r'a \ge 1', r'a > 1', r'0 < a \le 1', r'0 < a < 1'],
        [r'2 sin A cos B', r'sin 2A', r'cos 2A', r'2 cos A sin B'],
        [r'A = 0', r'A \ne 0', r'|A|= 0', r'|A| \ne 0'],
      ];

      for (final options in optionSets) {
        for (final option in options) {
          final segments = MathContentParser.parse(option);
          expect(segments, hasLength(1), reason: option);
          expect(segments.single.isMath, isTrue, reason: option);
          expect(segments.single.display, isFalse, reason: option);
        }
      }

      expect(MathContentParser.parse('-1').single.isMath, isFalse);
      expect(MathContentParser.parse('unique solution').single.isMath, isFalse);
    });

    test('repairs collapsed imported rotation matrix into a block matrix', () {
      const samples = [
        r'If Aα = -csoisnααccsoiinnsαα¹ then value of Aα A - α is',
        r'If \( A\alpha = - csoisn\alpha\alpha csoins\alpha\alpha \) , then value of \( A\alpha A - \alpha \) is',
      ];

      for (final sample in samples) {
        final segments = MathContentParser.parse(sample);

        final mathSegments =
            segments.where((segment) => segment.isMath).toList();
        expect(mathSegments, isNotEmpty, reason: sample);
        expect(mathSegments.first.value, isNot(contains(r'\(')));
        expect(mathSegments.first.value, contains(r'\begin{bmatrix}'));
        expect(mathSegments.first.value, contains(r'\\'));
        expect(mathSegments.first.value, contains(r'\cos\alpha'));
        expect(mathSegments.first.value, contains(r'\sin\alpha'));
      }
    });

    test('repairs collapsed imported numeric matrices into matrix segments', () {
      const samples = {
        r'If \( A = 13 - 25 \) then':
            r'A = \begin{bmatrix}1 & 2 \\ 3 & -5\end{bmatrix}',
        r'If \( 124 - \lambda23 152 \) is singular':
            r'\begin{bmatrix}1 & -3 & 2 \\ 2 & \lambda & 5 \\ 4 & 2 & 1\end{bmatrix}',
        r'Consider \( M = 323 114 k00 \)':
            r'M = \begin{bmatrix}3 & 4 & 0 \\ 2 & 1 & 0 \\ 3 & 1 & k\end{bmatrix}',
        r'Statement 2: \( k 0 \)': r'k \ne 0',
        r'\( - - 53 - - 21 \)':
            r'\begin{bmatrix}-5 & -2 \\ -3 & -1\end{bmatrix}',
      };

      for (final entry in samples.entries) {
        final segments = MathContentParser.parse(entry.key);
        final mathSegments =
            segments.where((segment) => segment.isMath).toList();

        expect(mathSegments, isNotEmpty, reason: entry.key);
        expect(mathSegments.first.value, entry.value, reason: entry.key);
      }
    });

    test('keeps Q4-style overbars inside one inline math segment', () {
      final segments = MathContentParser.parse(
        r'The equation \( z\bar{z} + a\bar{z} + \bar{a}z + b = 0 \), b∈ R represents a circle, if',
      );

      final mathSegments = segments.where((segment) => segment.isMath).toList();
      expect(mathSegments, hasLength(2));
      expect(mathSegments.first.value, contains(r'z\bar{z}'));
      expect(mathSegments.first.value, contains(r'\bar{a}z'));
      expect(mathSegments.last.value, r'b∈ R');
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
