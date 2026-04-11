import 'dart:typed_data';

Future<Uint8List?> readClipboardImageBytes() async => null;

typedef ClipboardImageDisposer = void Function();

ClipboardImageDisposer registerClipboardImagePasteListener(
  Future<void> Function(Uint8List bytes, String filename) onImage,
) {
  return () {};
}
