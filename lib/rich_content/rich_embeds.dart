import 'dart:convert';

import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:flutter_quill/flutter_quill.dart' as quill;
import 'package:flutter_svg/flutter_svg.dart';

import '../app/theme.dart';
import '../math/math_content.dart';
import '../widgets/rich_math_content.dart';

const String richGridEmbedType = 'ml_grid';
const String richMathEmbedType = 'ml_math';
const String richMathImageEmbedType = 'ml_math_img';

enum RichGridKind { table, matrix, determinant }

class RichGridData {
  const RichGridData({
    required this.kind,
    required this.rows,
    required this.cols,
    required this.cells,
  });

  final RichGridKind kind;
  final int rows;
  final int cols;
  final List<List<String>> cells;

  factory RichGridData.empty(RichGridKind kind, int rows, int cols) {
    return RichGridData(
      kind: kind,
      rows: rows,
      cols: cols,
      cells: List<List<String>>.generate(
        rows,
        (_) => List<String>.filled(cols, ''),
      ),
    );
  }

  factory RichGridData.fromJson(Map<String, dynamic> json) {
    final kindValue = (json['kind'] as String? ?? 'table').trim();
    final rows = (json['rows'] as num?)?.toInt() ?? 2;
    final cols = (json['cols'] as num?)?.toInt() ?? 2;
    final rawRows = json['cells'];
    final parsedCells =
        rawRows is List
            ? rawRows
                .map(
                  (row) =>
                      row is List
                          ? row.map((cell) => '${cell ?? ''}').toList()
                          : <String>[],
                )
                .toList()
            : <List<String>>[];
    final safeCells = List<List<String>>.generate(
      rows,
      (rowIndex) => List<String>.generate(cols, (colIndex) {
        if (rowIndex < parsedCells.length &&
            colIndex < parsedCells[rowIndex].length) {
          return parsedCells[rowIndex][colIndex];
        }
        return '';
      }),
    );
    return RichGridData(
      kind: RichGridKind.values.firstWhere(
        (value) => value.name == kindValue,
        orElse: () => RichGridKind.table,
      ),
      rows: rows,
      cols: cols,
      cells: safeCells,
    );
  }

  Map<String, dynamic> toJson() {
    return {'kind': kind.name, 'rows': rows, 'cols': cols, 'cells': cells};
  }
}

class RichGridEmbed extends quill.CustomBlockEmbed {
  RichGridEmbed._(String data) : super(richGridEmbedType, data);

  factory RichGridEmbed.fromData(RichGridData data) {
    return RichGridEmbed._(jsonEncode(data.toJson()));
  }

  static RichGridData decode(String data) {
    final decoded = jsonDecode(data);
    if (decoded is Map<String, dynamic>) {
      return RichGridData.fromJson(decoded);
    }
    return RichGridData.empty(RichGridKind.table, 2, 2);
  }
}

class RichMathEmbed extends quill.CustomBlockEmbed {
  RichMathEmbed._(String data) : super(richMathEmbedType, data);

  factory RichMathEmbed.fromRawText(String rawText) {
    return RichMathEmbed._(rawText.trim());
  }

  static String decode(String data) => data.trim();
}

class RichMathImagePayload {
  const RichMathImagePayload({
    required this.latex,
    required this.source,
  });

  final String latex;
  final String source;

  Map<String, dynamic> toJson() => {
        'latex': latex,
        'source': source,
      };

  factory RichMathImagePayload.fromJson(Map<String, dynamic> json) {
    return RichMathImagePayload(
      latex: (json['latex'] as String? ?? '').trim(),
      source: (json['source'] as String? ?? '').trim(),
    );
  }
}

class RichMathImageEmbed extends quill.CustomBlockEmbed {
  RichMathImageEmbed._(String data) : super(richMathImageEmbedType, data);

  factory RichMathImageEmbed.fromPayload(RichMathImagePayload payload) {
    return RichMathImageEmbed._(jsonEncode(payload.toJson()));
  }

  static RichMathImagePayload decode(String data) {
    try {
      final decoded = jsonDecode(data);
      if (decoded is Map<String, dynamic>) {
        return RichMathImagePayload.fromJson(decoded);
      }
    } catch (_) {}
    return const RichMathImagePayload(latex: '', source: '');
  }
}

Iterable<quill.EmbedBuilder> meritQuillEmbedBuilders() {
  return const [
    MeritMathImageEmbedBuilder(),
    MeritMathEmbedBuilder(),
    MeritGridEmbedBuilder(),
    MeritImageEmbedBuilder(),
  ];
}

class MeritImageEmbedBuilder extends quill.EmbedBuilder {
  const MeritImageEmbedBuilder();

  @override
  String get key => quill.BlockEmbed.imageType;

  @override
  Widget build(
    BuildContext context,
    quill.QuillController controller,
    quill.Embed node,
    bool readOnly,
    bool inline,
    TextStyle textStyle,
  ) {
    final source = '${node.value.data}';
    Widget image;
    if (source.startsWith('data:image/')) {
      final commaIndex = source.indexOf(',');
      if (commaIndex > 0) {
        final payload = source.substring(commaIndex + 1);
        final bytes = base64Decode(payload);
        if (source.startsWith('data:image/svg+xml')) {
          final svg = utf8.decode(bytes);
          final height = inline ? 72.0 : 180.0;
          final width = _svgWidthForHeight(svg, height);
          image = SvgPicture.string(
            svg,
            fit: BoxFit.contain,
            width: width,
            height: height,
            placeholderBuilder:
                (_) => const Center(child: CircularProgressIndicator()),
          );
        } else {
          image = Image.memory(
            bytes,
            fit: BoxFit.contain,
            errorBuilder: (_, __, ___) => const Text('Image could not render'),
          );
        }
      } else {
        image = const Text('Image could not render');
      }
    } else if (kIsWeb || source.startsWith('http')) {
      image = Image.network(
        source,
        fit: BoxFit.contain,
        errorBuilder: (_, __, ___) => const Text('Image could not render'),
      );
    } else {
      image = Image.asset(
        source,
        fit: BoxFit.contain,
        errorBuilder: (_, __, ___) => const Text('Image could not render'),
      );
    }
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 8),
      child: ClipRRect(
        borderRadius: BorderRadius.circular(14),
        child: ConstrainedBox(
          constraints: BoxConstraints(
            minHeight: source.startsWith('data:image/svg+xml') ? 72 : 0,
            maxHeight: 360,
          ),
          child: image,
        ),
      ),
    );
  }
}

double _svgWidthForHeight(String svg, double fallbackHeight) {
  // Prefer explicit width/height attributes (MathJax often uses ex units).
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
      // MathJax uses ex where 1ex ~ 0.43em.
      return value * (fallbackHeight / (1.2 / 0.43));
    case 'pt':
      return value * 1.3333;
    default:
      return value;
  }
}

class MeritGridEmbedBuilder extends quill.EmbedBuilder {
  const MeritGridEmbedBuilder();

  @override
  String get key => richGridEmbedType;

  @override
  String toPlainText(quill.Embed node) {
    final payload = node.value.data;
    if (payload is! String) {
      return '[ ]';
    }
    final data = RichGridEmbed.decode(payload);
    final rows = data.cells
        .map(
          (row) => row
              .map((cell) => MathContentParser.normalizeSourceText(cell).trim())
              .join(data.kind == RichGridKind.table ? ' | ' : '  '),
        )
        .toList(growable: false);
    if (rows.isEmpty) {
      return '[ ]';
    }
    final joined =
        data.kind == RichGridKind.table ? rows.join('\n') : rows.join('; ');
    switch (data.kind) {
      case RichGridKind.matrix:
        return '[ $joined ]';
      case RichGridKind.determinant:
        return '| $joined |';
      case RichGridKind.table:
        return joined;
    }
  }

  @override
  Widget build(
    BuildContext context,
    quill.QuillController controller,
    quill.Embed node,
    bool readOnly,
    bool inline,
    TextStyle textStyle,
  ) {
    final payload = node.value.data;
    final data =
        payload is String
            ? RichGridEmbed.decode(payload)
            : RichGridData.empty(RichGridKind.table, 2, 2);
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 8),
      child: MeritGridBlock(data: data, readOnly: readOnly),
    );
  }
}

class MeritMathEmbedBuilder extends quill.EmbedBuilder {
  const MeritMathEmbedBuilder();

  @override
  String get key => richMathEmbedType;

  @override
  String toPlainText(quill.Embed node) {
    final payload = node.value.data;
    return payload is String ? RichMathEmbed.decode(payload) : '';
  }

  @override
  Widget build(
    BuildContext context,
    quill.QuillController controller,
    quill.Embed node,
    bool readOnly,
    bool inline,
    TextStyle textStyle,
  ) {
    final payload = node.value.data;
    final rawText = payload is String ? RichMathEmbed.decode(payload) : '';
    if (rawText.isEmpty) {
      return const SizedBox.shrink();
    }
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 8),
      child: Container(
        width: double.infinity,
        padding: const EdgeInsets.all(12),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(14),
          border: Border.all(color: MeritTheme.border),
        ),
        child: RichMathContentView(
          rawText: _normalizeMathEmbedSource(rawText),
          style: textStyle,
          compact: true,
          allowExpand: false,
          preferProvidedSegments: false,
          forceTeXWidget: !kIsWeb,
        ),
      ),
    );
  }
}

class MeritMathImageEmbedBuilder extends quill.EmbedBuilder {
  const MeritMathImageEmbedBuilder();

  @override
  String get key => richMathImageEmbedType;

  @override
  String toPlainText(quill.Embed node) {
    final payload = node.value.data;
    if (payload is! String) {
      return '';
    }
    final data = RichMathImageEmbed.decode(payload);
    return data.latex;
  }

  @override
  Widget build(
    BuildContext context,
    quill.QuillController controller,
    quill.Embed node,
    bool readOnly,
    bool inline,
    TextStyle textStyle,
  ) {
    final payload = node.value.data;
    if (payload is! String) {
      return const SizedBox.shrink();
    }
    final data = RichMathImageEmbed.decode(payload);
    final source = data.source;
    if (source.isEmpty) {
      return _mathImageFallback(data, textStyle);
    }

    final baseSize = textStyle.fontSize ?? 16;
    final height =
        inline
            ? (baseSize * 2.0).clamp(34.0, 48.0)
            : (baseSize * 2.45).clamp(40.0, 72.0);

    return Padding(
      padding: EdgeInsets.symmetric(vertical: inline ? 3 : 6),
      child: LayoutBuilder(
        builder: (context, constraints) {
          final maxWidth =
              constraints.maxWidth.isFinite ? constraints.maxWidth : 420.0;
          if (source.startsWith('data:image/svg+xml')) {
            final svg = _decodeSvgDataUri(source);
            if (svg == null || svg.isEmpty) {
              return _mathImageFallback(data, textStyle);
            }
            final rawWidth = _svgWidthForHeight(svg, height);
            final visualWidth =
                (rawWidth > maxWidth
                        ? rawWidth
                        : rawWidth.clamp(28.0, maxWidth))
                    .toDouble();
            final math = SizedBox(
              height: height,
              width: visualWidth,
              child: SvgPicture.string(
                svg,
                fit: BoxFit.contain,
                width: visualWidth,
                height: height,
              ),
            );
            if (rawWidth <= maxWidth) {
              return Align(alignment: Alignment.centerLeft, child: math);
            }
            return SingleChildScrollView(
              scrollDirection: Axis.horizontal,
              child: math,
            );
          }

          return ConstrainedBox(
            constraints: BoxConstraints(maxWidth: maxWidth, minHeight: height),
            child: Image.network(
              source,
              fit: BoxFit.contain,
              height: height,
              alignment: Alignment.centerLeft,
              errorBuilder: (_, __, ___) => _mathImageFallback(data, textStyle),
            ),
          );
        },
      ),
    );
  }
}

String? _decodeSvgDataUri(String source) {
  final commaIndex = source.indexOf(',');
  final payload = commaIndex > 0 ? source.substring(commaIndex + 1) : '';
  if (payload.isEmpty) {
    return null;
  }
  try {
    return source.contains('base64')
        ? utf8.decode(base64Decode(payload))
        : Uri.decodeComponent(payload);
  } catch (_) {
    return null;
  }
}

Widget _mathImageFallback(RichMathImagePayload data, TextStyle textStyle) {
  final latex = data.latex.trim();
  if (latex.isEmpty) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 4),
      decoration: BoxDecoration(
        color: const Color(0xFFFCEBEB),
        borderRadius: BorderRadius.circular(6),
        border: Border.all(color: const Color(0xFFE8B4B4)),
      ),
      child: Text('Math', style: textStyle.copyWith(color: Colors.redAccent)),
    );
  }
  return Container(
    padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 4),
    decoration: BoxDecoration(
      color: const Color(0xFFF6F8FF),
      borderRadius: BorderRadius.circular(6),
      border: Border.all(color: const Color(0xFFD6E0FF)),
    ),
    child: RichMathContentView(
      rawText: latex.contains(r'$') ? latex : '\$$latex\$',
      style: textStyle,
      compact: true,
      allowExpand: false,
      preferProvidedSegments: false,
      forceTeXWidget: !kIsWeb,
    ),
  );
}

String _normalizeMathEmbedSource(String rawText) {
  final trimmed = rawText.trim();
  if (trimmed.isEmpty) {
    return trimmed;
  }
  final hasDelimitedMath =
      trimmed.contains(r'$') ||
      trimmed.contains(r'\(') ||
      trimmed.contains(r'\[') ||
      trimmed.contains(r'$$');
  if (hasDelimitedMath) {
    return trimmed;
  }
  final looksLikeLatex =
      trimmed.startsWith(r'\') ||
      trimmed.contains(r'\begin{') ||
      trimmed.contains(r'\frac') ||
      trimmed.contains(r'\sqrt') ||
      trimmed.contains(r'\sum') ||
      trimmed.contains(r'\int') ||
      trimmed.contains(r'\alpha') ||
      trimmed.contains(r'\beta') ||
      trimmed.contains(r'\pi') ||
      trimmed.contains(r'\lambda') ||
      trimmed.contains('^') ||
      trimmed.contains('_');
  if (looksLikeLatex) {
    return '\$$trimmed\$';
  }
  return trimmed;
}


class MeritGridBlock extends StatelessWidget {
  const MeritGridBlock({super.key, required this.data, this.readOnly = true});

  final RichGridData data;
  final bool readOnly;

  Widget _buildCell(BuildContext context, String value) {
    final normalized = MathContentParser.normalizeSourceText(value);
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 6),
      child:
          normalized.trim().isEmpty
              ? Text(' ', style: Theme.of(context).textTheme.bodyMedium)
              : RichMathContentView(
                rawText: normalized,
                compact: true,
                allowExpand: false,
                preferProvidedSegments: false,
              ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final border =
        data.kind == RichGridKind.table
            ? TableBorder.all(color: MeritTheme.border, width: 1)
            : TableBorder.symmetric(
              inside: BorderSide(color: MeritTheme.border, width: 1),
            );

    final table = Table(
      defaultVerticalAlignment: TableCellVerticalAlignment.middle,
      border: border,
      columnWidths: {
        for (var i = 0; i < data.cols; i += 1) i: const IntrinsicColumnWidth(),
      },
      children: List<TableRow>.generate(
        data.rows,
        (rowIndex) => TableRow(
          children: List<Widget>.generate(
            data.cols,
            (colIndex) => _buildCell(context, data.cells[rowIndex][colIndex]),
          ),
        ),
      ),
    );

    Widget framedTable;
    if (data.kind == RichGridKind.table) {
      framedTable = table;
    } else {
      final leftSymbol = data.kind == RichGridKind.matrix ? '[' : '|';
      final rightSymbol = data.kind == RichGridKind.matrix ? ']' : '|';
      framedTable = Row(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.center,
        children: [
          Text(
            leftSymbol,
            style: Theme.of(
              context,
            ).textTheme.headlineSmall?.copyWith(fontWeight: FontWeight.w300),
          ),
          const SizedBox(width: 8),
          Flexible(child: table),
          const SizedBox(width: 8),
          Text(
            rightSymbol,
            style: Theme.of(
              context,
            ).textTheme.headlineSmall?.copyWith(fontWeight: FontWeight.w300),
          ),
        ],
      );
    }

    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: MeritTheme.border),
      ),
      child: SingleChildScrollView(
        scrollDirection: Axis.horizontal,
        child: framedTable,
      ),
    );
  }
}
