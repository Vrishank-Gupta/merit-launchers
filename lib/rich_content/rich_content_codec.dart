import 'dart:convert';

import 'package:flutter_quill/flutter_quill.dart' as quill;

class RichContentCodec {
  static const String prefix = '__quill_delta__:';

  static bool isEncoded(String value) => value.trimLeft().startsWith(prefix);

  static String encodeDocument(quill.Document document) {
    final ops = document.toDelta().toJson();
    final hasStructuredContent = ops.any((op) {
      final opMap = Map<String, dynamic>.from(op as Map);
      final insert = opMap['insert'];
      if (insert is Map) {
        return true;
      }
      final attributes = opMap['attributes'];
      return attributes is Map && attributes.isNotEmpty;
    });

    if (!hasStructuredContent) {
      return document.toPlainText().trimRight();
    }

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
}
