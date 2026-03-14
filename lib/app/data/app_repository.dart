import '../models.dart';

abstract class AppRepository {
  Future<AppSeed> bootstrap();

  Future<bool> isAdminAllowed({
    String? email,
    String? phone,
  });

  Future<StudentProfile> saveStudentProfile(StudentProfile profile);

  Future<Affiliate> addAffiliate(Affiliate affiliate);

  Future<Course> addCourse(Course course);

  Future<void> updateCourseVideo({
    required String courseId,
    required String? videoUrl,
  });

  Future<Paper> addPaper(Paper paper);

  Future<Paper> updatePaper(Paper paper);

  Future<Purchase> savePurchase(Purchase purchase);

  Future<ExamAttempt> saveAttempt(ExamAttempt attempt);

  Future<SupportMessage> addSupportMessage(SupportMessage message);
}
