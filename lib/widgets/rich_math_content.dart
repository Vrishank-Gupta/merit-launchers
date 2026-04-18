import 'dart:convert';
import 'dart:typed_data';

import 'package:flutter/material.dart';
import 'package:flutter_tex/flutter_tex.dart';

import '../math/math_bootstrap.dart';
import '../math/math_content.dart';
import '../math/math_svg_renderer.dart';
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
    this.forceTeXWidget = false,
  });

  final String rawText;
  final List<MathContentSegment>? segments;
  final TextStyle? style;
  final bool compact;
  final bool allowExpand;
  final bool preferProvidedSegments;
  final bool forceTeXWidget;

  @override
  Widget build(BuildContext context) {
    final normalized = MathContentParser.normalizeSourceText(rawText);
    final effectiveSegments =
        forceTeXWidget ? null : _resolvedSegments(normalized);
    final mathSegments =
        effectiveSegments?.where((segment) => segment.isMath).length ?? 0;
    final imageSegments =
        effectiveSegments?.where((segment) => segment.isImage).length ?? 0;
    final rawMathSource = _sourceForRender(normalized, effectiveSegments);
    // In compact mode, downconvert any $$...$$ display delimiters in the raw
    // text path (when segments are null) to inline $...$ so rendering is uniform.
    final maybeDownconverted =
        compact ? _displayToInline(rawMathSource) : rawMathSource;
    final mathSource = _ensureDelimited(maybeDownconverted);

    if (!_containsMath(mathSource) && imageSegments == 0) {
      return MathAwareText(_normalizeDisplayText(normalized), style: style);
    }

    final effectiveStyle =
        style ?? Theme.of(context).textTheme.bodyLarge?.copyWith(height: 1.45);

    final shouldUseSegmentRenderer =
        effectiveSegments != null && (imageSegments > 0 || mathSegments > 0);
    final content =
        shouldUseSegmentRenderer
            ? _SvgSegmentContent(
              segments: effectiveSegments,
              style: effectiveStyle,
              compact: compact,
            )
            : _TeXContent(
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
            onPressed:
                () => _showExpandedMath(context, mathSource, effectiveStyle),
            icon: const Icon(Icons.zoom_in_rounded, size: 18),
            label: const Text('Expand'),
          ),
        ),
      ],
    );
  }

  List<MathContentSegment>? _resolvedSegments(String normalized) {
    final parsed = MathContentParser.parse(normalized);
    final provided = segments;
    if (!preferProvidedSegments || provided == null || provided.isEmpty) {
      return parsed.any((segment) => segment.isMath || segment.isImage)
          ? parsed
          : null;
    }
    final parsedMathCount = parsed.where((segment) => segment.isMath).length;
    final providedMathCount =
        provided.where((segment) => segment.isMath).length;
    final parsedImageCount = parsed.where((segment) => segment.isImage).length;
    final providedImageCount =
        provided.where((segment) => segment.isImage).length;
    if (providedMathCount == 0 && providedImageCount == 0) {
      return (parsedMathCount > 0 || parsedImageCount > 0) ? parsed : null;
    }

    if ((parsedMathCount == 0 && parsedImageCount == 0) ||
        (providedMathCount >= parsedMathCount &&
            providedImageCount >= parsedImageCount)) {
      return provided;
    }

    return (parsedMathCount > 0 || parsedImageCount > 0) ? parsed : null;
  }

  String _sourceForRender(
    String normalized,
    List<MathContentSegment>? effectiveSegments,
  ) {
    if (effectiveSegments == null || effectiveSegments.isEmpty) {
      return normalized;
    }

    final buffer = StringBuffer();
    for (final segment in effectiveSegments) {
      if (!segment.isMath) {
        if (segment.isImage) {
          continue;
        }
        buffer.write(segment.value);
        continue;
      }

      final value = segment.value.trim();
      if (value.isEmpty) {
        continue;
      }

      // In compact mode, always use inline delimiters so every option is
      // rendered by inlineFormulaWidgetBuilder at a consistent height.
      // Display math SVGs have different internal proportions that cause
      // size inconsistency even when the rendered height is clamped.
      if (_shouldRenderAsDisplay(segment) && !compact) {
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

  void _showExpandedMath(
    BuildContext context,
    String mathSource,
    TextStyle? style,
  ) {
    final effectiveStyle =
        style?.copyWith(fontSize: (style.fontSize ?? 17) + 4, height: 1.55) ??
        Theme.of(
          context,
        ).textTheme.bodyLarge?.copyWith(fontSize: 21, height: 1.55);

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

class _SvgSegmentContent extends StatelessWidget {
  const _SvgSegmentContent({
    required this.segments,
    required this.style,
    required this.compact,
  });

  final List<MathContentSegment> segments;
  final TextStyle? style;
  final bool compact;

  @override
  Widget build(BuildContext context) {
    final effectiveStyle =
        style ?? Theme.of(context).textTheme.bodyLarge?.copyWith(height: 1.45);
    return FutureBuilder<void>(
      future: ensureMathRenderingReady(),
      builder: (context, snapshot) {
        return _buildSegments(effectiveStyle);
      },
    );
  }

  Widget _buildSegments(TextStyle? effectiveStyle) {
    final hasDisplay =
        segments.any(_shouldRenderAsDisplay) ||
        segments.any((segment) => segment.isImage);
    if (!hasDisplay) {
      return RichText(
        text: TextSpan(
          style: effectiveStyle,
          children: _inlineSpans(effectiveStyle),
        ),
      );
    }

    final children = <Widget>[];
    final inlineBuffer = <MathContentSegment>[];

    void flushInline() {
      if (inlineBuffer.isEmpty) {
        return;
      }
      children.add(
        RichText(
          text: TextSpan(
            style: effectiveStyle,
            children: _segmentsToInlineSpans(inlineBuffer, effectiveStyle),
          ),
        ),
      );
      inlineBuffer.clear();
    }

    for (final segment in segments) {
      if (segment.isImage) {
        flushInline();
        children.add(
          Padding(
            padding: const EdgeInsets.symmetric(vertical: 8),
            child: _inlineImageWidget(
              segment.value,
              maxWidth: double.infinity,
              maxHeight: 320,
              borderRadius: 16,
            ),
          ),
        );
      } else if (_shouldRenderAsDisplay(segment) && !compact) {
        flushInline();
        children.add(
          Padding(
            padding: const EdgeInsets.symmetric(vertical: 8),
            child: SingleChildScrollView(
              scrollDirection: Axis.horizontal,
              child: _MathSegmentSvg(
                segment: segment,
                style: effectiveStyle,
                compact: compact,
                display: true,
              ),
            ),
          ),
        );
      } else {
        inlineBuffer.add(segment);
      }
    }
    flushInline();
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: children,
    );
  }

  List<InlineSpan> _inlineSpans(TextStyle? effectiveStyle) =>
      _segmentsToInlineSpans(segments, effectiveStyle);

  List<InlineSpan> _segmentsToInlineSpans(
    List<MathContentSegment> source,
    TextStyle? effectiveStyle,
  ) {
    final spans = <InlineSpan>[];
    for (final segment in source) {
      if (!segment.isMath) {
        if (segment.isImage) {
          spans.add(
            WidgetSpan(
              alignment: PlaceholderAlignment.middle,
              child: Padding(
                padding: const EdgeInsets.symmetric(horizontal: 4, vertical: 4),
                child: ConstrainedBox(
                  constraints: const BoxConstraints(
                    maxWidth: 240,
                    maxHeight: 180,
                  ),
                  child: ClipRRect(
                    borderRadius: BorderRadius.circular(12),
                    child: _inlineImageWidget(
                      segment.value,
                      maxWidth: 240,
                      maxHeight: 180,
                      borderRadius: 12,
                    ),
                  ),
                ),
              ),
            ),
          );
          continue;
        }
        if (segment.value.isNotEmpty) {
          spans.addAll(
            MathFormatter.toInlineSpans(
              _normalizeDisplayText(segment.value),
              effectiveStyle,
            ),
          );
        }
        continue;
      }
      final svg = segment.svg;
      final height = _inlineSvgHeight(effectiveStyle);
      if (svg != null && svg.isNotEmpty) {
        final sanitized = _sanitizeSvgMarkup(svg);
        spans.add(
          WidgetSpan(
            alignment: PlaceholderAlignment.middle,
            child: Padding(
              padding: const EdgeInsets.symmetric(horizontal: 2),
              child: ConstrainedBox(
                constraints: BoxConstraints(maxHeight: height),
                child: SvgPicture.string(
                  sanitized,
                  height: height,
                  fit: BoxFit.fitHeight,
                  alignment: Alignment.centerLeft,
                ),
              ),
            ),
          ),
        );
      } else {
        final text = segment.value;
        if (text.isNotEmpty) {
          spans.add(
            WidgetSpan(
              alignment: PlaceholderAlignment.middle,
              child: Padding(
                padding: const EdgeInsets.symmetric(horizontal: 2),
                child: _MathSegmentSvg(
                  segment: segment,
                  style: effectiveStyle,
                  compact: compact,
                  display: false,
                ),
              ),
            ),
          );
        }
      }
    }
    return spans;
  }

  double _inlineSvgHeight(TextStyle? style) {
    final baseSize = style?.fontSize ?? 17;
    return compact
        ? (baseSize * 1.85).clamp(28.0, 40.0)
        : (baseSize * 2.0).clamp(32.0, 48.0);
  }
}

Widget _inlineImageWidget(
  String source, {
  required double maxWidth,
  required double maxHeight,
  required double borderRadius,
}) {
  final trimmed = source.trim();
  if (_isDataImageUri(trimmed)) {
    final bytes = _tryDecodeDataImage(trimmed);
    if (bytes == null || bytes.isEmpty) {
      return const SizedBox.shrink();
    }
    return ClipRRect(
      borderRadius: BorderRadius.circular(borderRadius),
      child: ConstrainedBox(
        constraints: BoxConstraints(maxWidth: maxWidth, maxHeight: maxHeight),
        child: Image.memory(bytes, fit: BoxFit.contain),
      ),
    );
  }

  return ClipRRect(
    borderRadius: BorderRadius.circular(borderRadius),
    child: ConstrainedBox(
      constraints: BoxConstraints(maxWidth: maxWidth, maxHeight: maxHeight),
      child: Image.network(
        trimmed,
        fit: BoxFit.contain,
        errorBuilder: (_, __, ___) => const SizedBox.shrink(),
      ),
    ),
  );
}

bool _isDataImageUri(String value) =>
    value.startsWith('data:image/') && value.contains(';base64,');

Uint8List? _tryDecodeDataImage(String value) {
  final markerIndex = value.indexOf(';base64,');
  if (markerIndex < 0) {
    return null;
  }
  try {
    return base64Decode(value.substring(markerIndex + 8));
  } catch (_) {
    return null;
  }
}

class _MathSegmentSvg extends StatefulWidget {
  const _MathSegmentSvg({
    required this.segment,
    required this.style,
    required this.compact,
    required this.display,
  });

  final MathContentSegment segment;
  final TextStyle? style;
  final bool compact;
  final bool display;

  @override
  State<_MathSegmentSvg> createState() => _MathSegmentSvgState();
}

class _MathSegmentSvgState extends State<_MathSegmentSvg> {
  late Future<List<MathContentSegment>>? _renderFuture;
  late String _cacheKey;

  @override
  void initState() {
    super.initState();
    _cacheKey = _buildCacheKey();
    _renderFuture = _buildRenderFuture();
  }

  @override
  void didUpdateWidget(covariant _MathSegmentSvg oldWidget) {
    super.didUpdateWidget(oldWidget);
    final nextKey = _buildCacheKey();
    if (nextKey != _cacheKey) {
      _cacheKey = nextKey;
      _renderFuture = _buildRenderFuture();
    }
  }

  String _buildCacheKey() =>
      '${widget.display}|${widget.segment.value}|${widget.segment.svg ?? ''}';

  Future<List<MathContentSegment>>? _buildRenderFuture() {
    final svg = widget.segment.svg;
    if (svg != null && svg.isNotEmpty) {
      return null;
    }
    final math = _normalizeMathValue(widget.segment.value);
    final source =
        widget.display ? '${r'$$'}$math${r'$$'}' : '${r'$'}$math${r'$'}';
    return widget.display
        ? renderMathSegments(source)
        : renderOptionMathSegments(source);
  }

  @override
  Widget build(BuildContext context) {
    final height =
        widget.display
            ? _displayHeight(widget.style)
            : _inlineHeight(widget.style);
    final svg = widget.segment.svg;
    if (svg != null && svg.isNotEmpty) {
      final sanitized = _sanitizeSvgMarkup(svg);
      return ConstrainedBox(
        constraints: BoxConstraints(maxHeight: height),
        child: SvgPicture.string(
          sanitized,
          height: height,
          fit: BoxFit.fitHeight,
          alignment: Alignment.centerLeft,
        ),
      );
    }

    return FutureBuilder<List<MathContentSegment>>(
      future: _renderFuture,
      builder: (context, snapshot) {
        if (snapshot.connectionState != ConnectionState.done) {
          return SizedBox(
            height: height,
            width: height * 2.5,
            child: const Center(
              child: SizedBox(
                width: 16,
                height: 16,
                child: CircularProgressIndicator(strokeWidth: 1.5),
              ),
            ),
          );
        }
        MathContentSegment? renderedMath;
        final candidates = snapshot.data;
        if (candidates != null) {
          for (final item in candidates) {
            if (item.isMath && (item.svg?.isNotEmpty ?? false)) {
              renderedMath = item;
              break;
            }
          }
        }
        final renderedSvg = renderedMath?.svg;
        if (renderedSvg != null && renderedSvg.isNotEmpty) {
          final sanitized = _sanitizeSvgMarkup(renderedSvg);
          return ConstrainedBox(
            constraints: BoxConstraints(maxHeight: height),
            child: SvgPicture.string(
              sanitized,
              height: height,
              fit: BoxFit.fitHeight,
              alignment: Alignment.centerLeft,
            ),
          );
        }
        // Rendering failed: show raw LaTeX in a monospace style as fallback.
        return Text(
          widget.segment.value,
          style:
              widget.style?.copyWith(fontFamily: 'monospace') ?? widget.style,
        );
      },
    );
  }

  double _inlineHeight(TextStyle? style) {
    final baseSize = style?.fontSize ?? 17;
    return widget.compact
        ? (baseSize * 1.85).clamp(28.0, 40.0)
        : (baseSize * 2.0).clamp(32.0, 48.0);
  }

  double _displayHeight(TextStyle? style) {
    final baseSize = style?.fontSize ?? 17;
    return widget.compact
        ? (baseSize * 2.2).clamp(36.0, 56.0)
        : (baseSize * 2.8).clamp(52.0, 96.0);
  }
}

class _TeXContent extends StatefulWidget {
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
  State<_TeXContent> createState() => _TeXContentState();
}

class _TeXContentState extends State<_TeXContent> {
  late final Future<void> _mathReadyFuture;

  @override
  void initState() {
    super.initState();
    _mathReadyFuture = ensureMathRenderingReady();
  }

  @override
  Widget build(BuildContext context) {
    final effectiveStyle =
        widget.style ??
        Theme.of(context).textTheme.bodyLarge?.copyWith(height: 1.45);

    return FutureBuilder<void>(
      future: _mathReadyFuture,
      builder: (context, snapshot) {
        if (snapshot.connectionState != ConnectionState.done) {
          return MathAwareText(widget.source, style: effectiveStyle);
        }
        return TeXWidget(
          key: ValueKey(
            'tex-content:${widget.source.hashCode}:${widget.compact}:${widget.zoomed}',
          ),
          math: widget.source,
          textWidgetBuilder: (context, text) {
            return TextSpan(
              text: _normalizeDisplayText(text),
              style: effectiveStyle,
            );
          },
          inlineFormulaWidgetBuilder: (context, inlineFormula) {
            final height = _inlineHeight(effectiveStyle);
            return TeX2SVG(
              key: ValueKey(
                'inline:${inlineFormula.hashCode}:${widget.compact}:${widget.zoomed}',
              ),
              math: _normalizeMathValue(inlineFormula),
              formulaWidgetBuilder: (context, svg) {
                return SvgPicture.string(
                  _sanitizeSvgMarkup(svg),
                  key: ValueKey(
                    'inline-svg:${inlineFormula.hashCode}:${widget.compact}:${widget.zoomed}',
                  ),
                  height: height,
                );
              },
              errorWidgetBuilder:
                  (context, error) =>
                      MathAwareText(inlineFormula, style: effectiveStyle),
            );
          },
          displayFormulaWidgetBuilder: (context, displayFormula) {
            final height =
                widget.compact
                    ? _inlineHeight(effectiveStyle)
                    : _displayHeight(effectiveStyle);
            final padding =
                widget.compact
                    ? EdgeInsets.zero
                    : EdgeInsets.symmetric(vertical: widget.zoomed ? 10 : 6);
            return Padding(
              padding: padding,
              child: SingleChildScrollView(
                scrollDirection: Axis.horizontal,
                child: TeX2SVG(
                  key: ValueKey(
                    'display:${displayFormula.hashCode}:${widget.compact}:${widget.zoomed}',
                  ),
                  math: _normalizeMathValue(displayFormula),
                  formulaWidgetBuilder: (context, svg) {
                    return SvgPicture.string(
                      _sanitizeSvgMarkup(svg),
                      key: ValueKey(
                        'display-svg:${displayFormula.hashCode}:${widget.compact}:${widget.zoomed}',
                      ),
                      height: height,
                    );
                  },
                  errorWidgetBuilder:
                      (context, error) =>
                          MathAwareText(displayFormula, style: effectiveStyle),
                ),
              ),
            );
          },
        );
      },
    );
  }

  double _inlineHeight(TextStyle? style) {
    final baseSize = style?.fontSize ?? 17;
    if (widget.zoomed) {
      return (baseSize + 10).clamp(28.0, 44.0);
    }
    // Extra headroom so fractions/superscripts are not clipped.
    return widget.compact
        ? (baseSize * 1.85).clamp(28.0, 40.0)
        : (baseSize * 2.0).clamp(32.0, 48.0);
  }

  double _displayHeight(TextStyle? style) {
    final baseSize = style?.fontSize ?? 17;
    if (widget.zoomed) {
      return (baseSize * 3.2).clamp(64.0, 120.0);
    }
    return widget.compact
        ? (baseSize * 2.2).clamp(36.0, 56.0)
        : (baseSize * 2.8).clamp(52.0, 96.0);
  }
}

String _normalizeDisplayText(String input) {
  return input
      .replaceAll(RegExp(r'\\\\\s*'), '\n')
      .replaceAll(RegExp(r'[ \t]+\n'), '\n')
      .replaceAll(RegExp(r'\n{3,}'), '\n\n')
      .replaceAll(RegExp(r'[ \t]{2,}'), ' ')
      .replaceAll(RegExp(r'\s+([,.;:?])'), r'$1')
      .trim();
}

String _normalizeMathValue(String input) {
  final normalized =
      input.replaceAll('\r\n', '\n').replaceAll('\r', '\n').trim();
  return _repairCollapsedArrayEnvironment(normalized);
}

String _sanitizeSvgMarkup(String input) {
  final trimmed = input.trim();
  final match = RegExp(
    r'<svg[\s\S]*?</svg>',
    caseSensitive: false,
  ).firstMatch(trimmed);
  if (match != null) {
    var svg = match.group(0)!.trim();
    svg = svg.replaceFirstMapped(
      RegExp(r'<svg\b([^>]*)>', caseSensitive: false),
      (match) {
        var attrs = match.group(1) ?? '';
        attrs =
            attrs
                .replaceAll(
                  RegExp(
                    r'\s(?:width|height|style|x|y)="[^"]*"',
                    caseSensitive: false,
                  ),
                  '',
                )
                .replaceAll(RegExp(r'\s{2,}'), ' ')
                .trimRight();
        if (!RegExp(
          r'\spreserveAspectRatio=',
          caseSensitive: false,
        ).hasMatch(attrs)) {
          attrs = '$attrs preserveAspectRatio="xMinYMin meet"';
        }
        return '<svg$attrs>';
      },
    );
    return svg;
  }
  return trimmed;
}

bool _shouldRenderAsDisplay(MathContentSegment segment) {
  if (!segment.isMath) {
    return false;
  }
  if (segment.display) {
    return true;
  }
  final value = segment.value;
  if (value.isEmpty) {
    return false;
  }
  if (value.length > 60 &&
      (value.contains(r'\frac') || value.contains(r'\sqrt'))) {
    return true;
  }
  return RegExp(
    r'\\begin\{(?:array|matrix|bmatrix|pmatrix|vmatrix|Vmatrix|cases|aligned|gathered)\}'
    r'|\\left\|'
    r'|\\right\|'
    r'|\\operatorname\{det\}'
    r'|\\\\',
  ).hasMatch(value);
}

String _repairCollapsedArrayEnvironment(String input) {
  return input.replaceAllMapped(
    RegExp(r'\\begin\{array\}\{([^}]*)\}([\s\S]*?)\\end\{array\}'),
    (match) {
      final spec = match.group(1) ?? '';
      final body = (match.group(2) ?? '').trim();
      if (body.isEmpty || body.contains(r'\\')) {
        return match.group(0)!;
      }
      final columns = RegExp(r'[clr]').allMatches(spec).length;
      if (columns <= 1) {
        return match.group(0)!;
      }
      final cells =
          body
              .split('&')
              .map((cell) => cell.trim())
              .where((cell) => cell.isNotEmpty)
              .toList();
      if (cells.length <= columns || cells.length % columns != 0) {
        return match.group(0)!;
      }
      final rows = <String>[];
      for (var index = 0; index < cells.length; index += columns) {
        rows.add(cells.sublist(index, index + columns).join(' & '));
      }
      return '\\begin{array}{$spec}${rows.join(r' \\ ')}\\end{array}';
    },
  );
}

bool _containsMath(String text) {
  return text.contains(r'$') ||
      text.contains(r'\(') ||
      text.contains(r'\[') ||
      RegExp(r'\\[A-Za-z]+').hasMatch(text) ||
      RegExp(
        r'(?<!\w)[A-Za-z0-9)\]}]+(?:\^\{?[^ }\n]+\}?|_\{?[^ }\n]+\}?)+',
      ).hasMatch(text) ||
      RegExp(r'[∑∫√Δπωθ≤≥≈≠∞∂∇]').hasMatch(text);
}

// Replace $$...$$ display delimiters with $...$ inline delimiters.
// Used in compact mode so all math renders at a consistent inline height.
String _displayToInline(String text) {
  return text.replaceAllMapped(
    RegExp(r'\$\$(.+?)\$\$', dotAll: true),
    (m) => r'$' + (m[1] ?? '') + r'$',
  );
}

// If math commands exist but no delimiters, wrap the whole thing as display math
// so TeXWidget actually renders it instead of showing raw LaTeX.
String _ensureDelimited(String text) {
  if (text.contains(r'$') || text.contains(r'\(') || text.contains(r'\[')) {
    return text;
  }
  if (RegExp(r'\\[A-Za-z]+').hasMatch(text) ||
      RegExp(
        r'(?<!\w)[A-Za-z0-9)\]}]+(?:\^\{?[^ }\n]+\}?|_\{?[^ }\n]+\}?)+',
      ).hasMatch(text)) {
    return r'$' + text + r'$';
  }
  return text;
}
