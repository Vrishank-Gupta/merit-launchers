import 'package:flutter/material.dart';
import 'package:flutter_quill/flutter_quill.dart' as quill;

import '../math/math_content.dart';
import '../rich_content/rich_content_codec.dart';
import '../rich_content/rich_embeds.dart';
import 'rich_math_content.dart';

class RichQuestionContentView extends StatelessWidget {
  const RichQuestionContentView({
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
    if (!RichContentCodec.isEncoded(rawText)) {
      return RichMathContentView(
        rawText: rawText,
        segments: segments,
        style: style,
        compact: compact,
        allowExpand: allowExpand,
        preferProvidedSegments: preferProvidedSegments,
      );
    }

    final controller = quill.QuillController(
      document: RichContentCodec.documentFromStored(rawText),
      selection: const TextSelection.collapsed(offset: 0),
      readOnly: true,
    );

    return IgnorePointer(
      child: quill.QuillEditor.basic(
        controller: controller,
        configurations: quill.QuillEditorConfigurations(
          padding: EdgeInsets.zero,
          scrollable: false,
          autoFocus: false,
          expands: false,
          embedBuilders: meritQuillEmbedBuilders(),
          sharedConfigurations: const quill.QuillSharedConfigurations(),
        ),
      ),
    );
  }
}
