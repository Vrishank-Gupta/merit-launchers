import 'dart:convert';

import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:flutter_quill/flutter_quill.dart' as quill;

import '../app/theme.dart';
import '../math/math_content.dart';
import '../widgets/rich_math_content.dart';

const String richGridEmbedType = 'ml_grid';

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

Iterable<quill.EmbedBuilder> meritQuillEmbedBuilders() {
  return const [MeritGridEmbedBuilder(), MeritImageEmbedBuilder()];
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
        image = Image.memory(
          base64Decode(payload),
          fit: BoxFit.contain,
          errorBuilder: (_, __, ___) => const Text('Image could not render'),
        );
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
          constraints: const BoxConstraints(maxHeight: 360),
          child: image,
        ),
      ),
    );
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
      return '[grid]';
    }
    final data = RichGridEmbed.decode(payload);
    switch (data.kind) {
      case RichGridKind.matrix:
        return '[matrix ${data.rows}x${data.cols}]';
      case RichGridKind.determinant:
        return '[determinant ${data.rows}x${data.cols}]';
      case RichGridKind.table:
        return '[table ${data.rows}x${data.cols}]';
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

    final label = switch (data.kind) {
      RichGridKind.table => 'Table',
      RichGridKind.matrix => 'Matrix',
      RichGridKind.determinant => 'Determinant',
    };

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
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              Icon(
                data.kind == RichGridKind.table
                    ? Icons.table_chart_rounded
                    : Icons.calculate_rounded,
                size: 16,
                color: MeritTheme.secondary,
              ),
              const SizedBox(width: 6),
              Text(
                '$label ${data.rows}x${data.cols}',
                style: Theme.of(context).textTheme.labelMedium?.copyWith(
                  color: MeritTheme.secondary,
                  fontWeight: FontWeight.w700,
                ),
              ),
            ],
          ),
          const SizedBox(height: 10),
          SingleChildScrollView(
            scrollDirection: Axis.horizontal,
            child: framedTable,
          ),
        ],
      ),
    );
  }
}
