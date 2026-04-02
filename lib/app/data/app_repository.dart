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

  Future<Subject> addSubject(Subject subject);

  Future<Subject> updateSubject(Subject subject);

  Future<void> deleteSubject(String subjectId);

  Future<void> updateCourseVideo({
    required String courseId,
    required String? videoUrl,
  });

  Future<Paper> addPaper(Paper paper);

  Future<Paper> updatePaper(Paper paper);

  Future<void> deletePaper(String paperId);

  Future<Purchase> savePurchase(Purchase purchase);

  Future<ExamAttempt> saveAttempt(ExamAttempt attempt);

  Future<ExamSession> saveExamSession(ExamSession session);

  Future<void> deleteExamSession(String sessionId);

  Future<SupportMessage> addSupportMessage(SupportMessage message);

  Future<List<AdminAllowlistEntry>> getAdminAllowlist();

  Future<AdminAllowlistEntry> addAdminAllowlistEntry({
    required String label,
    String? email,
    String? phone,
  });

  Future<void> removeAdminAllowlistEntry(String id);
}
