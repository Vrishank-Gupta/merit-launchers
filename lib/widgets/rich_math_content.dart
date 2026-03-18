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
    this.allowExpand = false,
    this.preferProvidedSegments = true,
  });

  final String rawText;
  final List<MathContentSegment>? segments;
  final TextStyle? style;
  final bool compact;
  final bool allowExpand;
  final bool preferProvidedSegments;

  @override
  Widget build(BuildContext context) {
    final normalized = MathContentParser.normalizeSourceText(rawText);
    final effectiveSegments = _resolvedSegments(normalized);
    final mathSource = _sourceForRender(normalized, effectiveSegments);

    if (!_containsMath(mathSource)) {
      return MathAwareText(normalized, style: style);
    }

    final effectiveStyle =
        style ?? Theme.of(context).textTheme.bodyLarge?.copyWith(height: 1.45);

    final content = _TeXContent(
      source: mathSource,
      style: effectiveStyle,
      compact: compact,
    );

    if (!allowExpand) {
      return content;
    }

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        content,
        const SizedBox(height: 6),
        Align(
          alignment: Alignment.centerRight,
          child: TextButton.icon(
            onPressed: () => _showExpandedMath(context, mathSource, effectiveStyle),
            icon: const Icon(Icons.zoom_in_rounded, size: 18),
            label: const Text('Expand'),
          ),
        ),
      ],
    );
  }

  List<MathContentSegment>? _resolvedSegments(String normalized) {
    final provided = segments;
    if (!preferProvidedSegments || provided == null || provided.isEmpty) {
      return null;
    }

    final parsed = MathContentParser.parse(normalized);
    final parsedMathCount = parsed.where((segment) => segment.isMath).length;
    final providedMathCount = provided.where((segment) => segment.isMath).length;
    if (providedMathCount == 0) {
      return null;
    }

    if (parsedMathCount == 0 || providedMathCount >= parsedMathCount) {
      return provided;
    }

    return null;
  }

  String _sourceForRender(String normalized, List<MathContentSegment>? effectiveSegments) {
    if (effectiveSegments == null || effectiveSegments.isEmpty) {
      return normalized;
    }

    final buffer = StringBuffer();
    for (final segment in effectiveSegments) {
      if (!segment.isMath) {
        buffer.write(segment.value);
        continue;
      }

      final value = segment.value.trim();
      if (value.isEmpty) {
        continue;
      }

      if (segment.display) {
        buffer.write(' ');
        buffer.write(r'$$');
        buffer.write(_normalizeMathValue(value));
        buffer.write(r'$$');
        buffer.write(' ');
      } else {
        buffer.write(r'$');
        buffer.write(_normalizeMathValue(value));
        buffer.write(r'$');
      }
    }
    return MathContentParser.normalizeSourceText(buffer.toString());
  }

  void _showExpandedMath(BuildContext context, String mathSource, TextStyle? style) {
    final effectiveStyle =
        style?.copyWith(fontSize: (style.fontSize ?? 17) + 4, height: 1.55) ??
            Theme.of(context).textTheme.bodyLarge?.copyWith(
                  fontSize: 21,
                  height: 1.55,
                );

    showDialog<void>(
      context: context,
      builder: (dialogContext) {
        return Dialog(
          insetPadding: const EdgeInsets.all(16),
          child: ConstrainedBox(
            constraints: const BoxConstraints(maxWidth: 920, maxHeight: 720),
            child: Padding(
              padding: const EdgeInsets.all(20),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Expanded(
                        child: Text(
                          'Equation view',
                          style: Theme.of(dialogContext).textTheme.titleLarge,
                        ),
                      ),
                      IconButton(
                        onPressed: () => Navigator.of(dialogContext).pop(),
                        icon: const Icon(Icons.close_rounded),
                      ),
                    ],
                  ),
                  const SizedBox(height: 12),
                  Expanded(
                    child: InteractiveViewer(
                      minScale: 1,
                      maxScale: 4,
                      child: SingleChildScrollView(
                        padding: const EdgeInsets.only(right: 12, bottom: 12),
                        child: _TeXContent(
                          source: mathSource,
                          style: effectiveStyle,
                          compact: false,
                          zoomed: true,
                        ),
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ),
        );
      },
    );
  }
}

class _TeXContent extends StatelessWidget {
  const _TeXContent({
    required this.source,
    required this.style,
    required this.compact,
    this.zoomed = false,
  });

  final String source;
  final TextStyle? style;
  final bool compact;
  final bool zoomed;

  @override
  Widget build(BuildContext context) {
    final effectiveStyle =
        style ?? Theme.of(context).textTheme.bodyLarge?.copyWith(height: 1.45);

    return TeXWidget(
      key: ValueKey('tex-content:${source.hashCode}:$compact:$zoomed'),
      math: source,
      textWidgetBuilder: (context, text) {
        return TextSpan(
          text: text,
          style: effectiveStyle,
        );
      },
      inlineFormulaWidgetBuilder: (context, inlineFormula) {
        final height = _inlineHeight(effectiveStyle);
        return TeX2SVG(
          key: ValueKey('inline:${inlineFormula.hashCode}:$compact:$zoomed'),
          math: _normalizeMathValue(inlineFormula),
          formulaWidgetBuilder: (context, svg) {
            return SvgPicture.string(
              svg,
              key: ValueKey('inline-svg:${inlineFormula.hashCode}:$compact:$zoomed'),
              height: height,
            );
          },
          errorWidgetBuilder: (context, error) => MathAwareText(
            inlineFormula,
            style: effectiveStyle,
          ),
        );
      },
      displayFormulaWidgetBuilder: (context, displayFormula) {
        final height = _displayHeight(effectiveStyle);
        return Padding(
          padding: EdgeInsets.symmetric(vertical: zoomed ? 10 : 6),
          child: SingleChildScrollView(
            scrollDirection: Axis.horizontal,
            child: TeX2SVG(
              key: ValueKey('display:${displayFormula.hashCode}:$compact:$zoomed'),
              math: _normalizeMathValue(displayFormula),
              formulaWidgetBuilder: (context, svg) {
                return SvgPicture.string(
                  svg,
                  key: ValueKey('display-svg:${displayFormula.hashCode}:$compact:$zoomed'),
                  height: height,
                );
              },
              errorWidgetBuilder: (context, error) => MathAwareText(
                displayFormula,
                style: effectiveStyle,
              ),
            ),
          ),
        );
      },
    );
  }

  double _inlineHeight(TextStyle? style) {
    final baseSize = style?.fontSize ?? 17;
    if (zoomed) {
      return (baseSize + 10).clamp(28.0, 44.0);
    }
    // Extra headroom so fractions/superscripts are not clipped.
    return compact ? (baseSize + 4).clamp(20.0, 28.0) : (baseSize + 6).clamp(22.0, 32.0);
  }

  double _displayHeight(TextStyle? style) {
    final baseSize = style?.fontSize ?? 17;
    if (zoomed) {
      return (baseSize * 3.2).clamp(64.0, 110.0);
    }
    return compact ? (baseSize * 2.2).clamp(36.0, 56.0) : (baseSize * 2.6).clamp(44.0, 72.0);
  }
}

String _normalizeMathValue(String input) {
  return input
      .replaceAll(r'\\', r'\')
      .replaceAll('\r\n', '\n')
      .replaceAll('\r', '\n')
      .trim();
}

bool _containsMath(String text) {
  return text.contains(r'$') ||
      text.contains(r'\(') ||
      text.contains(r'\[') ||
      RegExp(r'\\[A-Za-z]+').hasMatch(text);
}
