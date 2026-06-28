import 'dart:convert';
import 'dart:typed_data';

import 'package:archive/archive.dart' as archive;
import 'package:flutter/material.dart';
import 'package:flutter_tex/flutter_tex.dart';

import '../math/math_bootstrap.dart';
import '../math/math_content.dart';
import 'data_image_view.dart';
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

    final content =
        effectiveSegments != null && (mathSegments > 0 || imageSegments > 0)
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
    if (provided.any((segment) => segment.svg?.isNotEmpty ?? false)) {
      return provided;
    }
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
    return _buildSegments(effectiveStyle);
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
              maxHeight: compact ? 56 : 96,
              minReadableHeight: compact ? 28 : 36,
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
                      minReadableHeight: compact ? 28 : 32,
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
        final width = _svgWidthForHeight(sanitized, height);
        spans.add(
          WidgetSpan(
            alignment: PlaceholderAlignment.middle,
            child: Padding(
              padding: const EdgeInsets.symmetric(horizontal: 2),
              child: SizedBox(
                height: height,
                width: width,
                child: SvgPicture.string(sanitized, fit: BoxFit.contain),
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
        ? (baseSize + 4).clamp(20.0, 28.0)
        : (baseSize + 6).clamp(24.0, 34.0);
  }
}

Widget _inlineImageWidget(
  String source, {
  required double maxWidth,
  required double maxHeight,
  required double borderRadius,
  double minReadableHeight = 0,
}) {
  final trimmed = source.trim();
  if (_isDataImageUri(trimmed)) {
    final bytes = _tryDecodeDataImage(trimmed);
    if (bytes == null || bytes.isEmpty) {
      return _imageFallback();
    }
    final normalizedImage = _normalizeLegacyDataImage(trimmed, bytes);
    final renderSource = normalizedImage.source;
    final renderBytes = normalizedImage.bytes;
    if (renderSource.startsWith('data:image/svg+xml')) {
      try {
        final svg = utf8.decode(renderBytes);
        final fittedSize =
            _fittedImageSize(
              _svgIntrinsicSize(svg) ?? const Size(240, 96),
              maxWidth: maxWidth,
              maxHeight: maxHeight,
              minReadableHeight: minReadableHeight,
            ) ??
            const Size(240, 96);
        return ClipRRect(
          borderRadius: BorderRadius.circular(borderRadius),
          child:
              supportsPlatformDataImageView
                  ? buildPlatformDataImageView(
                    source: renderSource,
                    width: fittedSize.width,
                    height: fittedSize.height,
                    fallback: _scaledImageFallback(),
                  )
                  : SizedBox(
                    width: fittedSize.width,
                    height: fittedSize.height,
                    child: SvgPicture.string(
                      svg,
                      fit: BoxFit.contain,
                      errorBuilder: (_, __, ___) => _scaledImageFallback(),
                    ),
                  ),
        );
      } catch (_) {
        if (supportsPlatformDataImageView) {
          final fallbackSize =
              _fittedImageSize(
                const Size(240, 96),
                maxWidth: maxWidth,
                maxHeight: maxHeight,
                minReadableHeight: minReadableHeight,
              ) ??
              const Size(240, 96);
          return ClipRRect(
            borderRadius: BorderRadius.circular(borderRadius),
            child: buildPlatformDataImageView(
              source: renderSource,
              width: fallbackSize.width,
              height: fallbackSize.height,
              fallback: _scaledImageFallback(),
            ),
          );
        }
        return _imageFallback();
      }
    }
    final fittedSize = _fittedImageSize(
      _rasterIntrinsicSize(renderBytes),
      maxWidth: maxWidth,
      maxHeight: maxHeight,
      minReadableHeight: minReadableHeight,
    );
    if (fittedSize != null) {
      return ClipRRect(
        borderRadius: BorderRadius.circular(borderRadius),
        child:
            supportsPlatformDataImageView
                ? buildPlatformDataImageView(
                  source: renderSource,
                  width: fittedSize.width,
                  height: fittedSize.height,
                  fallback: _scaledImageFallback(),
                )
                : SizedBox(
                  width: fittedSize.width,
                  height: fittedSize.height,
                  child: Image.memory(
                    renderBytes,
                    fit: BoxFit.contain,
                    errorBuilder: (_, __, ___) => _scaledImageFallback(),
                  ),
                ),
      );
    }
    return ClipRRect(
      borderRadius: BorderRadius.circular(borderRadius),
      child: ConstrainedBox(
        constraints: BoxConstraints(maxWidth: maxWidth, maxHeight: maxHeight),
        child: Image.memory(
          renderBytes,
          fit: BoxFit.contain,
          errorBuilder: (_, __, ___) => _scaledImageFallback(),
        ),
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
        errorBuilder: (_, __, ___) => _imageFallback(),
      ),
    ),
  );
}

({String source, Uint8List bytes}) _normalizeLegacyDataImage(
  String source,
  Uint8List bytes,
) {
  if (!source.startsWith('data:image/png')) {
    return (source: source, bytes: bytes);
  }
  final normalized = _tryConvertGrayscale16PngToRgba8(bytes);
  if (normalized == null) {
    return (source: source, bytes: bytes);
  }
  return (
    source: 'data:image/png;base64,${base64Encode(normalized)}',
    bytes: normalized,
  );
}

Widget _imageFallback() {
  return Container(
    constraints: const BoxConstraints(minWidth: 120, minHeight: 36),
    padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 8),
    decoration: BoxDecoration(
      color: const Color(0xFFFFF7ED),
      borderRadius: BorderRadius.circular(8),
      border: Border.all(color: const Color(0xFFF4C790)),
    ),
    child: const Text(
      'Image could not be rendered',
      style: TextStyle(
        color: Color(0xFF7C3E12),
        fontSize: 12,
        fontWeight: FontWeight.w600,
      ),
    ),
  );
}

Widget _scaledImageFallback() {
  return FittedBox(fit: BoxFit.scaleDown, child: _imageFallback());
}

Size? _fittedImageSize(
  Size? intrinsic, {
  required double maxWidth,
  required double maxHeight,
  double minReadableHeight = 0,
}) {
  if (intrinsic == null || intrinsic.width <= 0 || intrinsic.height <= 0) {
    return null;
  }
  final widthScale =
      maxWidth.isFinite && maxWidth > 0
          ? maxWidth / intrinsic.width
          : double.infinity;
  final heightScale =
      maxHeight.isFinite && maxHeight > 0
          ? maxHeight / intrinsic.height
          : double.infinity;
  final maxScale = widthScale < heightScale ? widthScale : heightScale;
  var scale = [
    1.0,
    widthScale,
    heightScale,
  ].reduce((value, element) => value < element ? value : element);
  if (minReadableHeight > 0 &&
      intrinsic.height * scale < minReadableHeight &&
      maxScale > scale) {
    final readableScale = minReadableHeight / intrinsic.height;
    scale = readableScale < maxScale ? readableScale : maxScale;
  }
  return Size(intrinsic.width * scale, intrinsic.height * scale);
}

Size? _rasterIntrinsicSize(Uint8List bytes) {
  if (bytes.length >= 24 &&
      bytes[0] == 0x89 &&
      bytes[1] == 0x50 &&
      bytes[2] == 0x4E &&
      bytes[3] == 0x47) {
    final data = bytes.buffer.asByteData(bytes.offsetInBytes, bytes.length);
    return Size(data.getUint32(16).toDouble(), data.getUint32(20).toDouble());
  }
  return null;
}

Uint8List? _tryConvertGrayscale16PngToRgba8(Uint8List bytes) {
  const signature = [0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A];
  if (bytes.length < 33) {
    return null;
  }
  for (var index = 0; index < signature.length; index += 1) {
    if (bytes[index] != signature[index]) {
      return null;
    }
  }

  final data = bytes.buffer.asByteData(bytes.offsetInBytes, bytes.length);
  var offset = 8;
  var width = 0;
  var height = 0;
  final idat = BytesBuilder(copy: false);

  while (offset + 12 <= bytes.length) {
    final length = data.getUint32(offset);
    offset += 4;
    if (offset + 4 + length + 4 > bytes.length) {
      return null;
    }
    final type = ascii.decode(bytes.sublist(offset, offset + 4));
    offset += 4;
    final chunkData = bytes.sublist(offset, offset + length);
    offset += length + 4;

    if (type == 'IHDR') {
      if (length < 13) {
        return null;
      }
      final chunk = chunkData.buffer.asByteData(
        chunkData.offsetInBytes,
        chunkData.length,
      );
      width = chunk.getUint32(0);
      height = chunk.getUint32(4);
      final bitDepth = chunkData[8];
      final colorType = chunkData[9];
      final compression = chunkData[10];
      final filter = chunkData[11];
      final interlace = chunkData[12];
      if (width <= 0 ||
          height <= 0 ||
          bitDepth != 16 ||
          colorType != 0 ||
          compression != 0 ||
          filter != 0 ||
          interlace != 0) {
        return null;
      }
    } else if (type == 'IDAT') {
      idat.add(chunkData);
    } else if (type == 'IEND') {
      break;
    }
  }

  if (width <= 0 || height <= 0 || idat.length == 0) {
    return null;
  }

  Uint8List inflated;
  try {
    inflated = archive.ZLibDecoder().decodeBytes(idat.toBytes());
  } catch (_) {
    return null;
  }

  final rowLength = width * 2;
  final expectedLength = (rowLength + 1) * height;
  if (inflated.length < expectedLength) {
    return null;
  }

  final rgbaRows = BytesBuilder(copy: false);
  final previous = Uint8List(rowLength);
  final current = Uint8List(rowLength);
  var readOffset = 0;
  for (var y = 0; y < height; y += 1) {
    final filter = inflated[readOffset++];
    current.setRange(0, rowLength, inflated, readOffset);
    readOffset += rowLength;
    _unfilterPngRow(current, previous, filter, 2);

    rgbaRows.addByte(0);
    for (var x = 0; x < width; x += 1) {
      final gray = current[x * 2];
      rgbaRows
        ..addByte(gray)
        ..addByte(gray)
        ..addByte(gray)
        ..addByte(255);
    }
    previous.setAll(0, current);
  }

  return _encodeRgba8Png(
    width: width,
    height: height,
    filteredRows: rgbaRows.toBytes(),
  );
}

void _unfilterPngRow(
  Uint8List row,
  Uint8List previous,
  int filter,
  int bytesPerPixel,
) {
  for (var index = 0; index < row.length; index += 1) {
    final left = index >= bytesPerPixel ? row[index - bytesPerPixel] : 0;
    final up = previous[index];
    final upLeft = index >= bytesPerPixel ? previous[index - bytesPerPixel] : 0;
    final predictor = switch (filter) {
      0 => 0,
      1 => left,
      2 => up,
      3 => (left + up) >> 1,
      4 => _paethPredictor(left, up, upLeft),
      _ => 0,
    };
    row[index] = (row[index] + predictor) & 0xff;
  }
}

int _paethPredictor(int left, int up, int upLeft) {
  final p = left + up - upLeft;
  final pa = (p - left).abs();
  final pb = (p - up).abs();
  final pc = (p - upLeft).abs();
  if (pa <= pb && pa <= pc) {
    return left;
  }
  if (pb <= pc) {
    return up;
  }
  return upLeft;
}

Uint8List _encodeRgba8Png({
  required int width,
  required int height,
  required Uint8List filteredRows,
}) {
  final output = BytesBuilder(copy: false)
    ..add(const [0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]);
  final ihdr =
      ByteData(13)
        ..setUint32(0, width)
        ..setUint32(4, height)
        ..setUint8(8, 8)
        ..setUint8(9, 6)
        ..setUint8(10, 0)
        ..setUint8(11, 0)
        ..setUint8(12, 0);
  _addPngChunk(output, 'IHDR', ihdr.buffer.asUint8List());
  _addPngChunk(output, 'IDAT', archive.ZLibEncoder().encodeBytes(filteredRows));
  _addPngChunk(output, 'IEND', Uint8List(0));
  return output.toBytes();
}

void _addPngChunk(BytesBuilder output, String type, Uint8List data) {
  final typeBytes = ascii.encode(type);
  final length = ByteData(4)..setUint32(0, data.length);
  output
    ..add(length.buffer.asUint8List())
    ..add(typeBytes)
    ..add(data);
  final crcInput =
      BytesBuilder(copy: false)
        ..add(typeBytes)
        ..add(data);
  final crc = ByteData(4)..setUint32(0, archive.getCrc32(crcInput.toBytes()));
  output.add(crc.buffer.asUint8List());
}

Size? _svgIntrinsicSize(String svg) {
  final widthAttr = RegExp(
    r'''\bwidth=(["'])([0-9.]+)([a-zA-Z%]+)?\1''',
    caseSensitive: false,
  ).firstMatch(svg);
  final heightAttr = RegExp(
    r'''\bheight=(["'])([0-9.]+)([a-zA-Z%]+)?\1''',
    caseSensitive: false,
  ).firstMatch(svg);
  if (widthAttr != null && heightAttr != null) {
    final widthValue = double.tryParse(widthAttr.group(2) ?? '');
    final heightValue = double.tryParse(heightAttr.group(2) ?? '');
    final widthUnit = (widthAttr.group(3) ?? 'px').toLowerCase();
    final heightUnit = (heightAttr.group(3) ?? 'px').toLowerCase();
    final width =
        widthValue == null ? null : _imageSvgUnitToPx(widthValue, widthUnit);
    final height =
        heightValue == null ? null : _imageSvgUnitToPx(heightValue, heightUnit);
    if (width != null && height != null && width > 0 && height > 0) {
      return Size(width, height);
    }
  }

  final viewBoxMatch = RegExp(
    r'''\bviewBox=(["'])\s*-?[0-9.]+\s+-?[0-9.]+\s+([0-9.]+)\s+([0-9.]+)\1''',
    caseSensitive: false,
  ).firstMatch(svg);
  if (viewBoxMatch != null) {
    final width = double.tryParse(viewBoxMatch.group(2) ?? '');
    final height = double.tryParse(viewBoxMatch.group(3) ?? '');
    if (width != null && height != null && width > 0 && height > 0) {
      return Size(width, height);
    }
  }
  return null;
}

double? _imageSvgUnitToPx(double value, String unit) {
  if (unit == '%') {
    return null;
  }
  return _svgUnitToPx(value, unit, 16);
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

class _MathSegmentSvg extends StatelessWidget {
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
  Widget build(BuildContext context) {
    final height = display ? _displayHeight(style) : _inlineHeight(style);
    final svg = segment.svg;
    if (svg != null && svg.isNotEmpty) {
      final sanitized = _sanitizeSvgMarkup(svg);
      final width = _svgWidthForHeight(sanitized, height);
      return SizedBox(
        height: height,
        width: width,
        child: SvgPicture.string(sanitized, fit: BoxFit.contain),
      );
    }

    return Text(
      segment.value,
      style: style?.copyWith(fontFamily: 'monospace') ?? style,
    );
  }

  double _inlineHeight(TextStyle? style) {
    final baseSize = style?.fontSize ?? 17;
    return compact
        ? (baseSize + 4).clamp(20.0, 28.0)
        : (baseSize + 6).clamp(24.0, 34.0);
  }

  double _displayHeight(TextStyle? style) {
    final baseSize = style?.fontSize ?? 17;
    return compact
        ? (baseSize * 3.0).clamp(48.0, 76.0)
        : (baseSize * 4.2).clamp(72.0, 140.0);
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
        ? (baseSize + 4).clamp(20.0, 28.0)
        : (baseSize + 6).clamp(24.0, 34.0);
  }

  double _displayHeight(TextStyle? style) {
    final baseSize = style?.fontSize ?? 17;
    if (widget.zoomed) {
      return (baseSize * 4.4).clamp(76.0, 150.0);
    }
    return widget.compact
        ? (baseSize * 3.0).clamp(48.0, 76.0)
        : (baseSize * 4.2).clamp(72.0, 140.0);
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
    svg = _flattenNestedMathJaxSvgs(svg);
    svg = svg.replaceFirstMapped(
      RegExp(r'<svg\b([^>]*)>', caseSensitive: false),
      (match) {
        var attrs = match.group(1) ?? '';
        attrs =
            attrs
                .replaceAll(
                  RegExp(r'\s(?:style|x|y)="[^"]*"', caseSensitive: false),
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

String _flattenNestedMathJaxSvgs(String svg) {
  final rootMatch = RegExp(
    r'^<svg\b[^>]*>',
    caseSensitive: false,
  ).firstMatch(svg);
  final rootCloseIndex = svg.toLowerCase().lastIndexOf('</svg>');
  if (rootMatch == null || rootCloseIndex <= rootMatch.end) {
    return svg;
  }

  final rootOpen = svg.substring(0, rootMatch.end);
  final rootClose = svg.substring(rootCloseIndex);
  var body = svg.substring(rootMatch.end, rootCloseIndex);
  final nestedPattern = RegExp(
    r'<svg\b([^>]*\s(?:x|y|viewBox|width|height)\s*=\s*"[^"]*"[^>]*)>([\s\S]*?)</svg>',
    caseSensitive: false,
  );

  for (var pass = 0; pass < 4; pass += 1) {
    var changed = false;
    body = body.replaceAllMapped(nestedPattern, (match) {
      final attrs = match.group(1) ?? '';
      final content = match.group(2) ?? '';
      final x = _numberSvgAttr(attrs, 'x') ?? 0;
      final y = _numberSvgAttr(attrs, 'y') ?? 0;
      final width = _numberSvgAttr(attrs, 'width');
      final height = _numberSvgAttr(attrs, 'height');
      final viewBox = _svgViewBox(attrs);
      final transforms = <String>[];
      if (x != 0 || y != 0) {
        transforms.add(
          'translate(${_formatSvgNumber(x)},${_formatSvgNumber(y)})',
        );
      }
      if (viewBox != null) {
        if (width != null &&
            height != null &&
            viewBox.width > 0 &&
            viewBox.height > 0 &&
            ((width - viewBox.width).abs() > 0.001 ||
                (height - viewBox.height).abs() > 0.001)) {
          transforms.add(
            'scale(${_formatSvgNumber(width / viewBox.width)},${_formatSvgNumber(height / viewBox.height)})',
          );
        }
        if (viewBox.x != 0 || viewBox.y != 0) {
          transforms.add(
            'translate(${_formatSvgNumber(-viewBox.x)},${_formatSvgNumber(-viewBox.y)})',
          );
        }
      }
      changed = true;
      final transform =
          transforms.isEmpty ? '' : ' transform="${transforms.join(' ')}"';
      return '<g$transform>$content</g>';
    });
    if (!changed || !nestedPattern.hasMatch(body)) {
      break;
    }
  }

  return '$rootOpen$body$rootClose';
}

double? _numberSvgAttr(String attrs, String name) {
  final match = RegExp(
    '\\b${RegExp.escape(name)}\\s*=\\s*"(-?[0-9.]+)',
    caseSensitive: false,
  ).firstMatch(attrs);
  return match == null ? null : double.tryParse(match.group(1) ?? '');
}

({double x, double y, double width, double height})? _svgViewBox(String attrs) {
  final match = RegExp(
    r'\bviewBox\s*=\s*"(-?[0-9.]+)\s+(-?[0-9.]+)\s+([0-9.]+)\s+([0-9.]+)"',
    caseSensitive: false,
  ).firstMatch(attrs);
  if (match == null) {
    return null;
  }
  final x = double.tryParse(match.group(1) ?? '');
  final y = double.tryParse(match.group(2) ?? '');
  final width = double.tryParse(match.group(3) ?? '');
  final height = double.tryParse(match.group(4) ?? '');
  if (x == null || y == null || width == null || height == null) {
    return null;
  }
  return (x: x, y: y, width: width, height: height);
}

String _formatSvgNumber(double value) {
  return value.toStringAsFixed(4).replaceFirst(RegExp(r'\.?0+$'), '');
}

double _svgWidthForHeight(String svg, double fallbackHeight) {
  final widthAttr = RegExp(
    r'width="([0-9.]+)([a-zA-Z%]+)?"',
    caseSensitive: false,
  ).firstMatch(svg);
  final heightAttr = RegExp(
    r'height="([0-9.]+)([a-zA-Z%]+)?"',
    caseSensitive: false,
  ).firstMatch(svg);
  if (widthAttr != null && heightAttr != null) {
    final widthValue = double.tryParse(widthAttr.group(1) ?? '');
    final heightValue = double.tryParse(heightAttr.group(1) ?? '');
    final widthUnit = (widthAttr.group(2) ?? 'px').toLowerCase();
    final heightUnit = (heightAttr.group(2) ?? 'px').toLowerCase();
    if (widthValue != null && heightValue != null && heightValue > 0) {
      final widthPx = _svgUnitToPx(widthValue, widthUnit, fallbackHeight);
      final heightPx = _svgUnitToPx(heightValue, heightUnit, fallbackHeight);
      if (widthPx != null && heightPx != null && heightPx > 0) {
        return (widthPx * fallbackHeight / heightPx).clamp(24.0, 2200.0);
      }
    }
  }

  final viewBoxMatch = RegExp(
    r'viewBox="(-?[0-9.]+)\s+(-?[0-9.]+)\s+([0-9.]+)\s+([0-9.]+)"',
    caseSensitive: false,
  ).firstMatch(svg);
  if (viewBoxMatch != null) {
    final width = double.tryParse(viewBoxMatch.group(3) ?? '');
    final height = double.tryParse(viewBoxMatch.group(4) ?? '');
    if (width != null && height != null && height > 0) {
      return (width * fallbackHeight / height).clamp(24.0, 2200.0);
    }
  }
  return (fallbackHeight * 6.0).clamp(24.0, 2200.0);
}

double? _svgUnitToPx(double value, String unit, double fallbackHeight) {
  switch (unit) {
    case 'px':
      return value;
    case 'em':
      return value * (fallbackHeight / 1.2);
    case 'ex':
      return value * (fallbackHeight / (1.2 / 0.43));
    case 'pt':
      return value * 1.3333;
    default:
      return value;
  }
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
