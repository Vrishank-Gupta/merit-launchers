import 'dart:convert';

import 'package:flutter_quill/flutter_quill.dart' as quill;

import 'rich_embeds.dart';

class RichContentCodec {
  static const String prefix = '__quill_delta__:';

  static bool isEncoded(String value) => value.trimLeft().startsWith(prefix);

  /// Encodes a Quill document to a storable string.
  ///
  /// • If the document has no structured content (embeds or formatting),
  ///   returns plain text — unchanged from before.
  /// • If the document has [richMathEmbedType] or [richGridEmbedType] blocks
  ///   but NO inline images and NO text formatting (bold/italic/etc.),
  ///   converts those embeds to `$...$` / LaTeX notation so the student
  ///   portal's RichMathContentView can render them directly.
  /// • Otherwise (inline images or bold/italic text present), falls back to
  ///   the `__quill_delta__:` JSON format so no information is lost.
  static String encodeDocument(quill.Document document) {
    final ops = document.toDelta().toJson();

    bool hasInlineImages = false;
    bool hasTextFormatting = false;
    bool hasMathOrGrid = false;

    for (final rawOp in ops) {
      final op = Map<String, dynamic>.from(rawOp as Map);
      final insert = op['insert'];
      final attrs = op['attributes'];

      if (insert is Map) {
        final insertMap = Map<String, dynamic>.from(insert);
        if (insertMap.containsKey(quill.BlockEmbed.imageType) ||
            insertMap.containsKey(richMathImageEmbedType)) {
          hasInlineImages = true;
        } else if (insertMap.containsKey(richMathEmbedType) ||
            insertMap.containsKey(richGridEmbedType)) {
          hasMathOrGrid = true;
        }
      }
      if (attrs is Map && attrs.isNotEmpty) {
        hasTextFormatting = true;
      }
    }

    if (!hasInlineImages && !hasTextFormatting) {
      if (!hasMathOrGrid) {
        // Pure plain text — keep the original lightweight encoding.
        return document.toPlainText().trimRight();
      }
      // Math/grid embeds only — convert to $...$ text so the student portal
      // can render without knowing about Quill delta format.
      return _embedsToMathText(ops);
    }

    // Inline images or text formatting present — store as Quill delta JSON.
    return '$prefix${jsonEncode(ops)}';
  }

  static quill.Document documentFromStored(String stored) {
    if (!isEncoded(stored)) {
      return quill.Document()..insert(0, stored);
    }

    final payload = stored.trimLeft().substring(prefix.length);
    final decoded = jsonDecode(payload);
    if (decoded is List) {
      return quill.Document.fromJson(
        List<Map<String, dynamic>>.from(
          decoded.map((item) => Map<String, dynamic>.from(item as Map)),
        ),
      );
    }
    return quill.Document();
  }

  // ---------------------------------------------------------------------------
  // Helpers

  static String _embedsToMathText(List<dynamic> ops) {
    final buffer = StringBuffer();
    for (final rawOp in ops) {
      final op = Map<String, dynamic>.from(rawOp as Map);
      final insert = op['insert'];
      if (insert is String) {
        buffer.write(insert);
      } else if (insert is Map) {
        final insertMap = Map<String, dynamic>.from(insert);

        final mathLatex = insertMap[richMathEmbedType];
        if (mathLatex is String && mathLatex.trim().isNotEmpty) {
          // Wrap bare LaTeX in $...$ so RichMathContentView parses it as math.
          buffer.write(' \$${mathLatex.trim()}\$ ');
        }

        final gridJson = insertMap[richGridEmbedType];
        if (gridJson is String && gridJson.isNotEmpty) {
          final data = RichGridEmbed.decode(gridJson);
          buffer.write(' \$${gridDataToLatex(data)}\$ ');
        }
      }
    }
    // Quill appends a trailing newline as U+0000 — remove it.
    return buffer.toString().replaceAll('\u0000', '').trim();
  }

  static String gridDataToLatex(RichGridData data) {
    switch (data.kind) {
      case RichGridKind.matrix:
        return _envToLatex('bmatrix', data);
      case RichGridKind.determinant:
        return _envToLatex('vmatrix', data);
      case RichGridKind.table:
        return _tableToLatex(data);
    }
  }

  static String _envToLatex(String env, RichGridData data) {
    final rows = data.cells.map((row) => row.join(' & ')).join(r' \\ ');
    return '\\begin{$env} $rows \\end{$env}';
  }

  static String _tableToLatex(RichGridData data) {
    final colSpec = List.filled(data.cols, 'c').join('|');
    final rows = data.cells
        .map((row) => row.join(' & '))
        .join(r' \\ \hline ');
    return '\\begin{array}{|$colSpec|}\\hline $rows \\\\ \\hline\\end{array}';
  }
}
