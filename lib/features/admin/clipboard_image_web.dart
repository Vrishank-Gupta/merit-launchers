// ignore_for_file: avoid_web_libraries_in_flutter, deprecated_member_use

import 'dart:async';
import 'dart:html' as html;
import 'dart:typed_data';

Future<Uint8List?> readClipboardImageBytes() async {
  try {
    final clipboard = html.window.navigator.clipboard;
    if (clipboard == null) {
      return null;
    }
    final dynamic items = await clipboard.read().timeout(
      const Duration(seconds: 4),
    );
    if (items is! List) {
      return null;
    }
    for (final dynamic item in items) {
      final dynamic types = item.types;
      if (types is! List) {
        continue;
      }
      for (final dynamic type in types) {
        final mime = '$type';
        if (!mime.startsWith('image/')) {
          continue;
        }
        final blob = await item.getType(mime).timeout(
          const Duration(seconds: 4),
        );
        final reader = html.FileReader();
        final completer = Completer<Uint8List?>();
        reader.onLoadEnd.first.then((_) {
          final result = reader.result;
          if (result is Uint8List) {
            completer.complete(result);
          } else if (result is ByteBuffer) {
            completer.complete(Uint8List.view(result));
          } else {
            completer.complete(null);
          }
        });
        reader.readAsArrayBuffer(blob);
        final bytes = await completer.future;
        if (bytes != null && bytes.isNotEmpty) {
          return bytes;
        }
      }
    }
  } catch (_) {
    return null;
  }
  return null;
}

typedef ClipboardImageDisposer = void Function();

ClipboardImageDisposer registerClipboardImagePasteListener(
  Future<void> Function(Uint8List bytes, String filename) onImage,
) {
  final subscription = html.document.onPaste.listen((event) async {
    try {
      final data = event.clipboardData;
      if (data == null) {
        return;
      }

      final items = data.items;
      final itemCount = items?.length ?? 0;
      if (itemCount > 0) {
        final itemList = items!;
        for (var index = 0; index < itemCount; index += 1) {
          final item = itemList[index];
          final mime = item.type ?? '';
          if (!mime.startsWith('image/')) {
            continue;
          }
          final file = item.getAsFile();
          if (file == null) {
            continue;
          }
          final reader = html.FileReader();
          final completer = Completer<Uint8List?>();
          reader.onLoadEnd.first.then((_) {
            final result = reader.result;
            if (result is Uint8List) {
              completer.complete(result);
            } else if (result is ByteBuffer) {
              completer.complete(Uint8List.view(result));
            } else {
              completer.complete(null);
            }
          });
          reader.readAsArrayBuffer(file);
          final bytes = await completer.future.timeout(
            const Duration(seconds: 4),
            onTimeout: () => null,
          );
          if (bytes != null && bytes.isNotEmpty) {
            event.preventDefault();
            await onImage(
              bytes,
              file.name.isNotEmpty ? file.name : 'clipboard-image.png',
            );
            return;
          }
        }
      }

      final files = data.files;
      if (files == null || files.isEmpty) {
        return;
      }

      for (final file in files) {
        final mime = file.type;
        if (!mime.startsWith('image/')) {
          continue;
        }
        final reader = html.FileReader();
        final completer = Completer<Uint8List?>();
        reader.onLoadEnd.first.then((_) {
          final result = reader.result;
          if (result is Uint8List) {
            completer.complete(result);
          } else if (result is ByteBuffer) {
            completer.complete(Uint8List.view(result));
          } else {
            completer.complete(null);
          }
        });
        reader.readAsArrayBuffer(file);
        final bytes = await completer.future.timeout(
          const Duration(seconds: 4),
          onTimeout: () => null,
        );
        if (bytes != null && bytes.isNotEmpty) {
          event.preventDefault();
          await onImage(
            bytes,
            file.name.isNotEmpty ? file.name : 'clipboard-image.png',
          );
          return;
        }
      }
    } catch (_) {
      return;
    }
  });
  return () => subscription.cancel();
}
