import 'package:flutter/widgets.dart';

import 'data_image_view_stub.dart'
    if (dart.library.html) 'data_image_view_web.dart'
    as impl;

bool get supportsPlatformDataImageView => impl.supportsPlatformDataImageView;

Widget buildPlatformDataImageView({
  required String source,
  required double width,
  required double height,
  required Widget fallback,
}) {
  return impl.buildPlatformDataImageView(
    source: source,
    width: width,
    height: height,
    fallback: fallback,
  );
}
