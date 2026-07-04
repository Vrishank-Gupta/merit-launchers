import 'package:flutter/material.dart';
import 'package:flutter_svg/svg.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:merit_launchers/math/math_content.dart';
import 'package:merit_launchers/widgets/rich_question_content.dart';

void main() {
  testWidgets('uses provided equation SVG segments instead of raw LaTeX', (
    tester,
  ) async {
    const svg = '''
<svg xmlns="http://www.w3.org/2000/svg" width="12ex" height="4ex" viewBox="0 -1000 5000 1800">
  <g fill="currentColor"><path d="M0 0H5000V100H0Z"/></g>
</svg>
''';

    await tester.pumpWidget(
      const MaterialApp(
        home: Scaffold(
          body: RichQuestionContentView(
            rawText:
                r'The value of \( \int \frac{dx}{x^{2}(x^{4} + 1)^{3}^{/}^{4}} \) is',
            segments: [
              MathContentSegment(type: 'text', value: 'The value of '),
              MathContentSegment(
                type: 'math',
                value: r'\int \frac{dx}{x^{2}(x^{4} + 1)^{3}^{/}^{4}}',
                display: true,
                original: r'\int \frac{dx}{x^{2}(x^{4} + 1)^{3}^{/}^{4}}',
                latex: r'\int \frac{dx}{x^{2}(x^{4} + 1)^{3/4}}',
                svg: svg,
                renderStatus: 'rendered',
              ),
              MathContentSegment(type: 'text', value: ' is'),
            ],
            preferProvidedSegments: true,
          ),
        ),
      ),
    );

    expect(find.byType(SvgPicture), findsOneWidget);
    expect(find.textContaining(r'\int'), findsNothing);
  });
}
