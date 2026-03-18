import '../models.dart';
import '../sample_data.dart';
import 'app_repository.dart';

class DemoAppRepository implements AppRepository {
  @override
  Future<AppSeed> bootstrap() async => buildAppSeed();

  @override
  Future<bool> isAdminAllowed({
    String? email,
    String? phone,
  }) async => true;

  @override
  Future<Affiliate> addAffiliate(Affiliate affiliate) async => affiliate;

  @override
  Future<Course> addCourse(Course course) async => course;

  @override
  Future<void> updateCourseVideo({
    required String courseId,
    required String? videoUrl,
  }) async {}

  @override
  Future<Paper> addPaper(Paper paper) async => paper;

  @override
  Future<Paper> updatePaper(Paper paper) async => paper;

  @override
  Future<SupportMessage> addSupportMessage(SupportMessage message) async => message;

  @override
  Future<List<AdminAllowlistEntry>> getAdminAllowlist() async => const [];

  @override
  Future<AdminAllowlistEntry> addAdminAllowlistEntry({
    required String label,
    String? email,
    String? phone,
  }) async {
    return AdminAllowlistEntry(
      id: email ?? phone ?? 'demo',
      label: label,
      email: email,
      phone: phone,
      isActive: true,
      createdAt: DateTime.now(),
    );
  }

  @override
  Future<void> removeAdminAllowlistEntry(String id) async {}

  @override
  Future<ExamAttempt> saveAttempt(ExamAttempt attempt) async => attempt;

  @override
  Future<ExamSession> saveExamSession(ExamSession session) async => session;

  @override
  Future<void> deleteExamSession(String sessionId) async {}

  @override
  Future<Purchase> savePurchase(Purchase purchase) async => purchase;

  @override
  Future<StudentProfile> saveStudentProfile(StudentProfile profile) async => profile;
}
