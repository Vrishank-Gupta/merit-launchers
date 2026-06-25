// ignore_for_file: avoid_web_libraries_in_flutter, deprecated_member_use

import 'dart:html' as html;
import 'dart:ui_web' as ui_web;

import 'package:flutter/widgets.dart';

bool get supportsPlatformDataImageView => true;

final Set<String> _registeredViewTypes = <String>{};

Widget buildPlatformDataImageView({
  required String source,
  required double width,
  required double height,
  required Widget fallback,
}) {
  if (source.trim().isEmpty || width <= 0 || height <= 0) {
    return fallback;
  }

  final viewType =
      'merit-data-image-${Object.hash(source, width.round(), height.round())}';
  if (_registeredViewTypes.add(viewType)) {
    ui_web.platformViewRegistry.registerViewFactory(viewType, (int viewId) {
      final image =
          html.ImageElement(src: source)
            ..draggable = false
            ..alt = 'Imported equation image';
      image.style
        ..width = '100%'
        ..height = '100%'
        ..display = 'block'
        ..objectFit = 'contain';
      return image;
    });
  }

  return SizedBox(
    width: width,
    height: height,
    child: HtmlElementView(viewType: viewType),
  );
}
