import 'package:flutter/material.dart';
import 'package:flutter_svg/flutter_svg.dart';

import '../math/math_content.dart';
import 'math_text.dart';

class RichMathContentView extends StatelessWidget {
  const RichMathContentView({
    super.key,
    required this.rawText,
    this.segments,
    this.style,
  });

  final String rawText;
  final List<MathContentSegment>? segments;
  final TextStyle? style;

  @override
  Widget build(BuildContext context) {
    final sourceSegments = segments;
    if (sourceSegments == null || sourceSegments.isEmpty) {
      return MathAwareText(rawText, style: style);
    }

    final blocks = <Widget>[];
    final inlineWidgets = <Widget>[];

    void flushInline() {
      if (inlineWidgets.isEmpty) {
        return;
      }
      blocks.add(
        Wrap(
          crossAxisAlignment: WrapCrossAlignment.center,
          spacing: 2,
          runSpacing: 6,
          children: List.of(inlineWidgets),
        ),
      );
      inlineWidgets.clear();
    }

    for (final segment in sourceSegments) {
      if (segment.display) {
        flushInline();
        blocks.add(
          Padding(
            padding: const EdgeInsets.symmetric(vertical: 8),
            child: _MathSegmentView(segment: segment),
          ),
        );
        continue;
      }

      if (segment.isMath) {
        inlineWidgets.add(_MathSegmentView(segment: segment));
      } else {
        inlineWidgets.addAll(_textTokens(segment.value, context));
      }
    }

    flushInline();
    if (blocks.isEmpty) {
      return MathAwareText(rawText, style: style);
    }

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: blocks,
    );
  }

  List<Widget> _textTokens(String value, BuildContext context) {
    final tokens = value.split(RegExp(r'(\s+)'));
    return tokens
        .where((token) => token.isNotEmpty)
        .map(
          (token) => Text(
            token,
            style: style ?? Theme.of(context).textTheme.bodyLarge?.copyWith(height: 1.45),
          ),
        )
        .toList();
  }
}

class _MathSegmentView extends StatelessWidget {
  const _MathSegmentView({required this.segment});

  final MathContentSegment segment;

  @override
  Widget build(BuildContext context) {
    if (segment.svg != null && segment.svg!.isNotEmpty) {
      return SvgPicture.string(
        segment.svg!,
        fit: BoxFit.contain,
        placeholderBuilder: (context) => MathAwareText(segment.value),
      );
    }

    return MathAwareText(segment.value);
  }
}
