import 'package:flutter_quill/flutter_quill.dart' as quill;
import 'package:flutter_test/flutter_test.dart';
import 'package:merit_launchers/rich_content/rich_content_codec.dart';
import 'package:merit_launchers/rich_content/rich_embeds.dart';

void main() {
  group('RichContentCodec', () {
    test('stores math embeds as canonical inline math text', () {
      final document = quill.Document.fromJson([
        {
          'insert': {richMathEmbedType: r'\frac{1}{2}'},
        },
        {'insert': '\n'},
      ]);

      expect(RichContentCodec.encodeDocument(document), r'$\frac{1}{2}$');
    });

    test('preserves display delimiters from math embeds', () {
      final document = quill.Document.fromJson([
        {
          'insert': {richMathEmbedType: r'$$\int_a^b f(x)\,dx$$'},
        },
        {'insert': '\n'},
      ]);

      expect(
        RichContentCodec.encodeDocument(document),
        r'$$\int_a^b f(x)\,dx$$',
      );
    });
  });
}
