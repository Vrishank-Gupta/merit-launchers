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
    this.compact = false,
  });

  final String rawText;
  final List<MathContentSegment>? segments;
  final TextStyle? style;
  final bool compact;

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
            child: _MathSegmentView(segment: segment, compact: compact),
          ),
        );
        continue;
      }

      if (segment.isMath) {
        inlineWidgets.add(_MathSegmentView(segment: segment, compact: compact));
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
  const _MathSegmentView({
    required this.segment,
    required this.compact,
  });

  final MathContentSegment segment;
  final bool compact;

  @override
  Widget build(BuildContext context) {
    if (segment.svg != null && segment.svg!.isNotEmpty) {
      return LayoutBuilder(
        builder: (context, constraints) {
          final maxWidth = constraints.hasBoundedWidth
              ? constraints.maxWidth
              : (segment.display ? 640.0 : 220.0);
          final maxHeight = segment.display
              ? (compact ? 72.0 : 110.0)
              : (compact ? 24.0 : 30.0);

          return ConstrainedBox(
            constraints: BoxConstraints(
              maxWidth: maxWidth,
              maxHeight: maxHeight,
            ),
            child: SvgPicture.string(
              segment.svg!,
              fit: BoxFit.contain,
              alignment: Alignment.centerLeft,
              placeholderBuilder: (context) => MathAwareText(segment.value),
            ),
          );
        },
      );
    }

    return MathAwareText(segment.value);
  }
}
