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
    final effectiveStyle =
        style ?? Theme.of(context).textTheme.bodyLarge?.copyWith(height: 1.45);

    if (!RichContentCodec.isEncoded(rawText)) {
      return RichMathContentView(
        rawText: rawText,
        segments: segments,
        style: effectiveStyle,
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
          customStyles: _quillStylesFor(effectiveStyle, compact: compact),
          sharedConfigurations: const quill.QuillSharedConfigurations(),
        ),
      ),
    );
  }
}

quill.DefaultStyles _quillStylesFor(TextStyle? style, {required bool compact}) {
  final base = (style ?? const TextStyle(fontSize: 16, height: 1.45)).copyWith(
    decoration: TextDecoration.none,
  );
  final lineHeight = base.height ?? (compact ? 1.35 : 1.45);
  final blockStyle = quill.DefaultTextBlockStyle(
    base.copyWith(height: lineHeight),
    const quill.HorizontalSpacing(0, 0),
    quill.VerticalSpacing(compact ? 2 : 4, compact ? 2 : 4),
    const quill.VerticalSpacing(0, 0),
    null,
  );
  return quill.DefaultStyles(
    paragraph: blockStyle,
    lineHeightNormal: blockStyle,
    lineHeightOneAndHalf: blockStyle,
    lineHeightDouble: blockStyle,
    placeHolder: blockStyle,
    bold: base.copyWith(fontWeight: FontWeight.w700),
    italic: base.copyWith(fontStyle: FontStyle.italic),
    underline: base.copyWith(decoration: TextDecoration.underline),
    sizeSmall: base.copyWith(fontSize: (base.fontSize ?? 16) * 0.88),
    sizeLarge: base.copyWith(fontSize: (base.fontSize ?? 16) * 1.15),
    sizeHuge: base.copyWith(fontSize: (base.fontSize ?? 16) * 1.3),
  );
}
