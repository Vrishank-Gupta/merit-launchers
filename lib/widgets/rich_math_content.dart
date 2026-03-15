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
    if (!_containsMath(normalized)) {
      return MathAwareText(normalized, style: style);
    }

    final parsedSegments = MathContentParser.parse(normalized);
    final resolvedSegments = preferProvidedSegments
        ? _mergePreferredSvgs(parsedSegments, segments)
        : parsedSegments;
    final effectiveStyle =
        style ?? Theme.of(context).textTheme.bodyLarge?.copyWith(height: 1.45);

    final content = _SegmentedMathContent(
      segments: resolvedSegments,
      style: effectiveStyle,
      compact: compact,
      zoomed: false,
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
            onPressed: () => _showExpandedMath(context, normalized, effectiveStyle),
            icon: const Icon(Icons.zoom_in_rounded, size: 18),
            label: const Text('Expand'),
          ),
        ),
      ],
    );
  }

  void _showExpandedMath(BuildContext context, String rawText, TextStyle? style) {
    final effectiveStyle =
        style?.copyWith(fontSize: (style.fontSize ?? 17) + 4, height: 1.55) ??
            Theme.of(context).textTheme.bodyLarge?.copyWith(
                  fontSize: 21,
                  height: 1.55,
                );
    final resolvedSegments = preferProvidedSegments
        ? _mergePreferredSvgs(
            MathContentParser.parse(rawText),
            segments,
          )
        : MathContentParser.parse(rawText);

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
                        child: _SegmentedMathContent(
                          segments: resolvedSegments,
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

class _SegmentedMathContent extends StatelessWidget {
  const _SegmentedMathContent({
    required this.segments,
    required this.style,
    required this.compact,
    required this.zoomed,
  });

  final List<MathContentSegment> segments;
  final TextStyle? style;
  final bool compact;
  final bool zoomed;

  @override
  Widget build(BuildContext context) {
    final blocks = <Widget>[];
    final inlineSpans = <InlineSpan>[];

    void flushInline() {
      if (inlineSpans.isEmpty) {
        return;
      }
      blocks.add(RichText(text: TextSpan(style: style, children: List<InlineSpan>.from(inlineSpans))));
      inlineSpans.clear();
    }

    for (final segment in segments) {
      if (!segment.isMath) {
        inlineSpans.add(TextSpan(text: segment.value, style: style));
        continue;
      }

      if (segment.display) {
        flushInline();
        blocks.add(
          _DisplayMath(
            math: segment.value,
            compact: compact,
            zoomed: zoomed,
            preferredSvg: segment.svg,
          ),
        );
        continue;
      }

      if (_shouldPromoteInlineMath(segment.value, compact: compact, zoomed: zoomed)) {
        flushInline();
        blocks.add(
          _DisplayMath(
            math: segment.value,
            compact: compact,
            zoomed: zoomed,
            preferredSvg: segment.svg,
          ),
        );
        continue;
      }

      inlineSpans.add(
        WidgetSpan(
          alignment: PlaceholderAlignment.middle,
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: 2),
            child: _InlineMath(
              math: segment.value,
              compact: compact,
              zoomed: zoomed,
              preferredSvg: segment.svg,
            ),
          ),
        ),
      );
    }

    flushInline();

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        for (var i = 0; i < blocks.length; i++) ...[
          blocks[i],
          if (i != blocks.length - 1) const SizedBox(height: 8),
        ],
      ],
    );
  }
}

class _InlineMath extends StatelessWidget {
  const _InlineMath({
    required this.math,
    required this.compact,
    required this.zoomed,
    this.preferredSvg,
  });

  final String math;
  final bool compact;
  final bool zoomed;
  final String? preferredSvg;

  @override
  Widget build(BuildContext context) {
    final svg = _looksUsableSvg(preferredSvg) ? preferredSvg! : null;
    final height = zoomed
        ? 34.0
        : compact
            ? 18.0
            : 22.0;
    if (svg != null) {
      return SizedBox(
        key: ValueKey('inline-svg:$math:$compact:$zoomed:${svg.hashCode}'),
        width: _svgWidth(svg, height),
        height: height,
        child: SvgPicture.string(
          svg,
          fit: BoxFit.contain,
          alignment: Alignment.centerLeft,
        ),
      );
    }

    return TeX2SVG(
      key: ValueKey('inline-tex:$math:$compact:$zoomed'),
      math: _normalizeMathLatex(math),
      formulaWidgetBuilder: (context, svg) {
        return SizedBox(
          key: ValueKey('inline-tex-svg:$math:$compact:$zoomed:${svg.hashCode}'),
          width: _svgWidth(svg, height),
          height: height,
          child: SvgPicture.string(
            svg,
            fit: BoxFit.contain,
            alignment: Alignment.centerLeft,
          ),
        );
      },
      errorWidgetBuilder: (context, error) => MathAwareText(math),
    );
  }
}

class _DisplayMath extends StatelessWidget {
  const _DisplayMath({
    required this.math,
    required this.compact,
    required this.zoomed,
    this.preferredSvg,
  });

  final String math;
  final bool compact;
  final bool zoomed;
  final String? preferredSvg;

  @override
  Widget build(BuildContext context) {
    final svg = _looksUsableSvg(preferredSvg) ? preferredSvg! : null;
    final height = zoomed
        ? 110.0
        : compact
            ? 56.0
            : 84.0;
    if (svg != null) {
      return SingleChildScrollView(
        key: ValueKey('display-svg-scroll:$math:$compact:$zoomed:${svg.hashCode}'),
        scrollDirection: Axis.horizontal,
        child: SizedBox(
          key: ValueKey('display-svg:$math:$compact:$zoomed:${svg.hashCode}'),
          width: _svgWidth(svg, height),
          height: height,
          child: SvgPicture.string(
            svg,
            fit: BoxFit.contain,
            alignment: Alignment.centerLeft,
          ),
        ),
      );
    }

    return SingleChildScrollView(
      key: ValueKey('display-tex-scroll:$math:$compact:$zoomed'),
      scrollDirection: Axis.horizontal,
      child: TeX2SVG(
        key: ValueKey('display-tex:$math:$compact:$zoomed'),
        math: _normalizeMathLatex(math),
        formulaWidgetBuilder: (context, svg) {
          return SizedBox(
            key: ValueKey('display-tex-svg:$math:$compact:$zoomed:${svg.hashCode}'),
            width: _svgWidth(svg, height),
            height: height,
            child: SvgPicture.string(
              svg,
              fit: BoxFit.contain,
              alignment: Alignment.centerLeft,
            ),
          );
        },
        errorWidgetBuilder: (context, error) => MathAwareText(math),
      ),
    );
  }
}

double _svgWidth(String svg, double fallbackHeight) {
  final viewBoxMatch = RegExp(
    r'viewBox="(-?[0-9.]+)\s+(-?[0-9.]+)\s+([0-9.]+)\s+([0-9.]+)"',
  ).firstMatch(svg);
  if (viewBoxMatch != null) {
    final width = double.tryParse(viewBoxMatch.group(3) ?? '');
    final height = double.tryParse(viewBoxMatch.group(4) ?? '');
    if (width != null && height != null && height > 0) {
      return (width * fallbackHeight / height).clamp(8.0, 2200.0);
    }
  }

  final widthMatch = RegExp(r'width="([0-9.]+)(?:ex|em|px)?"').firstMatch(svg);
  if (widthMatch != null) {
    final parsed = double.tryParse(widthMatch.group(1) ?? '');
    if (parsed != null && parsed > 0) {
      return (parsed * 12).clamp(8.0, 2200.0);
    }
  }

  return fallbackHeight * 2.4;
}

String _normalizeMathLatex(String input) {
  return input
      .replaceAll(r'\\', r'\')
      .replaceAll('\r\n', '\n')
      .replaceAll('\r', '\n')
      .trim();
}

bool _looksUsableSvg(String? svg) {
  if (svg == null || svg.isEmpty) {
    return false;
  }

  final widthMatch = RegExp(r'width="([0-9.]+)').firstMatch(svg);
  final viewBoxMatch = RegExp(
    r'viewBox="(-?[0-9.]+)\s+(-?[0-9.]+)\s+([0-9.]+)\s+([0-9.]+)"',
  ).firstMatch(svg);

  final width = widthMatch == null ? null : double.tryParse(widthMatch.group(1) ?? '');
  final viewBoxWidth = viewBoxMatch == null ? null : double.tryParse(viewBoxMatch.group(3) ?? '');
  final effectiveWidth = width ?? viewBoxWidth ?? 0;

  return effectiveWidth > 0.2;
}

bool _containsMath(String text) {
  return text.contains(r'$') ||
      text.contains(r'\(') ||
      text.contains(r'\[') ||
      RegExp(r'\\[A-Za-z]+').hasMatch(text);
}

List<MathContentSegment> _mergePreferredSvgs(
  List<MathContentSegment> parsed,
  List<MathContentSegment>? provided,
) {
  if (provided == null || provided.isEmpty) {
    return parsed;
  }

  final providedMath = provided.where((segment) => segment.isMath).toList();
  if (providedMath.isEmpty) {
    return parsed;
  }

  var providedIndex = 0;
  final merged = <MathContentSegment>[];

  for (final segment in parsed) {
    if (!segment.isMath) {
      merged.add(segment);
      continue;
    }

    MathContentSegment? match;
    for (var index = providedIndex; index < providedMath.length; index += 1) {
      final candidate = providedMath[index];
      if (_sameMathValue(candidate.value, segment.value)) {
        match = candidate;
        providedIndex = index + 1;
        break;
      }
    }

    merged.add(segment.copyWith(svg: match?.svg));
  }

  return merged;
}

bool _sameMathValue(String left, String right) {
  String normalize(String input) {
    return _normalizeMathLatex(input)
        .replaceAll(RegExp(r'\s+'), '')
        .replaceAll(r'\{', '{')
        .replaceAll(r'\}', '}');
  }

  return normalize(left) == normalize(right);
}

bool _shouldPromoteInlineMath(
  String math, {
  required bool compact,
  required bool zoomed,
}) {
  if (zoomed || compact) {
    return false;
  }

  final normalized = _normalizeMathLatex(math);
  return normalized.length > 18 ||
      normalized.contains('=') ||
      normalized.contains(r'\vec') ||
      normalized.contains(r'\hat') ||
      normalized.contains(r'\frac') ||
      normalized.contains(r'\cdot') ||
      normalized.contains('{') ||
      normalized.contains('}');
}
