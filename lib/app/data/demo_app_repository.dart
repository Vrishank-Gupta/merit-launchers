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
  Future<ExamAttempt> saveAttempt(ExamAttempt attempt) async => attempt;

  @override
  Future<Purchase> savePurchase(Purchase purchase) async => purchase;

  @override
  Future<StudentProfile> saveStudentProfile(StudentProfile profile) async => profile;
}
