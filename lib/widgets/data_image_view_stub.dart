import 'package:flutter/widgets.dart';

bool get supportsPlatformDataImageView => false;

Widget buildPlatformDataImageView({
  required String source,
  required double width,
  required double height,
  required Widget fallback,
}) {
  return fallback;
}
