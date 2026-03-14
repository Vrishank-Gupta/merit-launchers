import 'package:flutter/material.dart';
import 'package:flutter_tex/flutter_tex.dart';

import '../math/math_content.dart';
import 'math_text.dart';

class RichMathContentView extends StatelessWidget {
  const RichMathContentView({
    super.key,
    required this.rawText,
    this.segments,
    this.style,
    this.compact = false,
  });

  final String rawText;
  final List<MathContentSegment>? segments;
  final TextStyle? style;
  final bool compact;

  @override
  Widget build(BuildContext context) {
    final normalized = MathContentParser.normalizeSourceText(rawText);
    if (!_containsMath(normalized)) {
      return MathAwareText(normalized, style: style);
    }

    final effectiveStyle =
        style ?? Theme.of(context).textTheme.bodyLarge?.copyWith(height: 1.45);

    return TeXWidget(
      math: normalized,
      textWidgetBuilder: (context, text) {
        return TextSpan(
          text: text,
          style: effectiveStyle,
        );
      },
      inlineFormulaWidgetBuilder: (context, inlineFormula) {
        return TeX2SVG(
          math: inlineFormula,
          formulaWidgetBuilder: (context, svg) {
            return SizedBox(
              height: compact ? 18 : 22,
              child: SvgPicture.string(
                svg,
                fit: BoxFit.contain,
                alignment: Alignment.centerLeft,
              ),
            );
          },
        );
      },
      displayFormulaWidgetBuilder: (context, displayFormula) {
        return Padding(
          padding: const EdgeInsets.symmetric(vertical: 6),
          child: SingleChildScrollView(
            scrollDirection: Axis.horizontal,
            child: TeX2SVG(
              math: displayFormula,
              formulaWidgetBuilder: (context, svg) {
                return SizedBox(
                  height: compact ? 56 : 84,
                  child: SvgPicture.string(
                    svg,
                    fit: BoxFit.contain,
                    alignment: Alignment.centerLeft,
                  ),
                );
              },
            ),
          ),
        );
      },
    );
  }
}

bool _containsMath(String text) {
  return text.contains(r'$') ||
      text.contains(r'\(') ||
      text.contains(r'\[') ||
      RegExp(r'\\[A-Za-z]+').hasMatch(text);
}
