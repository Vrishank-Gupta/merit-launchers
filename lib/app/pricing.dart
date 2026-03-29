import 'models.dart';

const double kDefaultGstRate = 0.18;

double basePriceForCourseId(String courseId) {
  final normalized = courseId.trim().toLowerCase();
  if (normalized == 'ipmat') {
    return 2499;
  }
  return 499;
}

PurchaseMode purchaseModeForCourseId(String courseId) {
  final normalized = courseId.trim().toLowerCase();
  return normalized == 'cuet' ? PurchaseMode.subject : PurchaseMode.course;
}

double totalPriceWithGst(double basePrice, {double gstRate = kDefaultGstRate}) {
  return double.parse((basePrice * (1 + gstRate)).toStringAsFixed(2));
}

double normalizedCourseBasePrice(Course course) {
  return basePriceForCourseId(course.id);
}

double normalizedCourseTotalPrice(Course course) {
  return totalPriceWithGst(normalizedCourseBasePrice(course), gstRate: course.gstRate);
}

bool isSubjectUnlockCourse(Course course) {
  return course.purchaseMode == PurchaseMode.subject;
}

String formatRupees(double value) {
  if (value == value.roundToDouble()) {
    return 'Rs ${value.toStringAsFixed(0)}';
  }
  return 'Rs ${value.toStringAsFixed(2)}';
}

String accessLabelForCourse(Course course) {
  return isSubjectUnlockCourse(course) ? 'Subject unlock' : 'Full course unlock';
}

String purchaseBadgeLabel(Course course) {
  final base = formatRupees(normalizedCourseBasePrice(course));
  return isSubjectUnlockCourse(course) ? '$base* / subject' : '$base*';
}

String purchaseCtaLabel(Course course) {
  final base = formatRupees(normalizedCourseBasePrice(course));
  return isSubjectUnlockCourse(course)
      ? 'Unlock subject for $base*'
      : 'Unlock full course for $base*';
}

String totalPriceLabel(Course course) {
  return '*GST extra';
}

String gstBreakdownLabel(Course course) {
  return '*GST extra';
}
