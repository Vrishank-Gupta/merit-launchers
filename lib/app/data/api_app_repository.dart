import 'package:flutter/foundation.dart';

import '../../math/math_content.dart';
import '../api_client.dart';
import '../models.dart';
import 'app_repository.dart';

class ApiAppRepository implements AppRepository {
  ApiAppRepository(this._apiClient);

  final ApiClient _apiClient;

  @override
  Future<AppSeed> bootstrap() async {
    final response = await _apiClient.getJson('/v1/bootstrap', authenticated: true);

    final courses = (response['courses'] as List<dynamic>? ?? const [])
        .map((item) => _courseFromJson(Map<String, dynamic>.from(item as Map)))
        .toList();
    final subjects = (response['subjects'] as List<dynamic>? ?? const [])
        .map((item) => _subjectFromJson(Map<String, dynamic>.from(item as Map)))
        .toList();
    final papers = (response['papers'] as List<dynamic>? ?? const [])
        .map((item) => _paperFromJson(Map<String, dynamic>.from(item as Map)))
        .toList();
    final affiliates = (response['affiliates'] as List<dynamic>? ?? const [])
        .map((item) => _affiliateFromJson(Map<String, dynamic>.from(item as Map)))
        .toList();
    final currentStudent = _studentFromJson(
      Map<String, dynamic>.from(response['currentStudent'] as Map? ?? const {}),
    );
    final students = (response['students'] as List<dynamic>? ?? const [])
        .map((item) => _studentFromJson(Map<String, dynamic>.from(item as Map)))
        .toList();
    final purchases = (response['purchases'] as List<dynamic>? ?? const [])
        .map((item) => Purchase.fromJson(Map<String, dynamic>.from(item as Map)))
        .toList();
    final attempts = (response['attempts'] as List<dynamic>? ?? const [])
        .map((item) => ExamAttempt.fromJson(Map<String, dynamic>.from(item as Map)))
        .toList();
    final examSessions = (response['examSessions'] as List<dynamic>? ?? const [])
        .map((item) => ExamSession.fromJson(Map<String, dynamic>.from(item as Map)))
        .toList();
    final supportMessages = (response['supportMessages'] as List<dynamic>? ?? const [])
        .map((item) => SupportMessage.fromJson(Map<String, dynamic>.from(item as Map)))
        .toList();

    return AppSeed(
      courses: courses,
      subjects: subjects,
      papers: papers,
      affiliates: affiliates,
      currentStudent: currentStudent,
      students: students,
      purchases: purchases,
      attempts: attempts,
      examSessions: examSessions,
      supportMessages: supportMessages,
    );
  }

  @override
  Future<Paper> fetchPaper(String paperId) async {
    final response = await _apiClient.getJson(
      '/v1/papers/${Uri.encodeComponent(paperId)}',
      authenticated: true,
    );
    return _paperFromJson(response);
  }

  @override
  Future<bool> isAdminAllowed({String? email, String? phone}) async {
    return false;
  }

  @override
  Future<StudentProfile> saveStudentProfile(StudentProfile profile) async {
    final response = await _apiClient.putJson(
      '/v1/me/profile',
      authenticated: true,
      body: {
        'name': profile.name,
        'city': profile.city,
        'referralCode': profile.referralCode,
        'signupSource': kIsWeb ? 'web' : 'android',
      },
    );
    return _studentFromJson(response);
  }

  @override
  Future<Affiliate> addAffiliate(Affiliate affiliate) async {
    final response = await _apiClient.postJson(
      '/v1/admin/affiliates',
      authenticated: true,
      body: {
        'id': affiliate.id,
        'name': affiliate.name,
        'code': affiliate.code,
        'channel': affiliate.channel,
      },
    );
    return _affiliateFromJson(response);
  }

  @override
  Future<Course> addCourse(Course course) async {
    final response = await _apiClient.postJson(
      '/v1/admin/courses',
      authenticated: true,
      body: {
        'id': course.id,
        'title': course.title,
        'subtitle': course.subtitle,
        'description': course.description,
        'price': course.price,
        'validityDays': course.validityDays,
        'highlights': course.highlights,
        'introVideoUrl': course.introVideoUrl,
        'heroLabel': course.heroLabel,
      },
    );
    return _courseFromJson(response);
  }

  @override
  Future<Subject> addSubject(Subject subject) async {
    final response = await _apiClient.postJson(
      '/v1/admin/subjects',
      authenticated: true,
      body: {
        'id': subject.id,
        'courseId': subject.courseId,
        'title': subject.title,
        'description': subject.description,
        'sortOrder': subject.sortOrder,
        'isPublished': subject.isPublished,
      },
    );
    return _subjectFromJson(response);
  }

  @override
  Future<Subject> updateSubject(Subject subject) async {
    final response = await _apiClient.putJson(
      '/v1/admin/subjects/${Uri.encodeComponent(subject.id)}',
      authenticated: true,
      body: {
        'courseId': subject.courseId,
        'title': subject.title,
        'description': subject.description,
        'sortOrder': subject.sortOrder,
        'isPublished': subject.isPublished,
      },
    );
    return _subjectFromJson(response);
  }

  @override
  Future<void> deleteSubject(String subjectId) async {
    await _apiClient.deleteJson(
      '/v1/admin/subjects/${Uri.encodeComponent(subjectId)}',
      authenticated: true,
    );
  }

  @override
  Future<void> updateCourseVideo({
    required String courseId,
    required String? videoUrl,
  }) async {
    await _apiClient.putJson(
      '/v1/admin/courses/$courseId/video',
      authenticated: true,
      body: {
        'videoUrl': videoUrl,
      },
    );
  }

  @override
  Future<Paper> addPaper(Paper paper) async {
    await _apiClient.postJson(
      '/v1/admin/papers',
      authenticated: true,
      body: {
        'paper': {
          'id': paper.id,
          'courseId': paper.courseId,
          'subjectId': paper.subjectId,
          'title': paper.title,
          'durationMinutes': paper.durationMinutes,
          'instructions': paper.instructions,
          'isFreePreview': paper.isFreePreview,
          'sourceFileUrl': paper.sourceFileUrl,
          'sourceFileName': paper.sourceFileName,
        },
        'questions': paper.questions.map((question) => _questionToJson(question)).toList(),
      },
    );
    return paper;
  }

  @override
  Future<Paper> updatePaper(Paper paper) async {
    await _apiClient.putJson(
      '/v1/admin/papers/${paper.id}',
      authenticated: true,
      body: {
        'paper': {
          'id': paper.id,
          'courseId': paper.courseId,
          'subjectId': paper.subjectId,
          'title': paper.title,
          'durationMinutes': paper.durationMinutes,
          'instructions': paper.instructions,
          'isFreePreview': paper.isFreePreview,
          'sourceFileUrl': paper.sourceFileUrl,
          'sourceFileName': paper.sourceFileName,
        },
        'questions': paper.questions.map((question) => _questionToJson(question)).toList(),
      },
    );
    return paper;
  }

  @override
  Future<void> deletePaper(String paperId) async {
    await _apiClient.deleteJson(
      '/v1/admin/papers/${Uri.encodeComponent(paperId)}',
      authenticated: true,
    );
  }

  @override
  Future<Purchase> savePurchase(Purchase purchase) async => purchase;

  @override
  Future<ExamAttempt> saveAttempt(ExamAttempt attempt) async {
    await _apiClient.postJson(
      '/v1/attempts',
      authenticated: true,
      body: {
        'id': attempt.id,
        'courseId': attempt.courseId,
        'paperId': attempt.paperId,
        'answers': attempt.answers,
        'sectionScores': attempt.sectionScores,
        'score': attempt.score,
        'maxScore': attempt.maxScore,
        'submittedAt': attempt.submittedAt.toIso8601String(),
      },
    );
    return attempt;
  }

  @override
  Future<ExamSession> saveExamSession(ExamSession session) async {
    await _apiClient.postJson(
      '/v1/exam-sessions',
      authenticated: true,
      body: {
        'id': session.id,
        'courseId': session.courseId,
        'paperId': session.paperId,
        'answers': session.answers,
        'remainingSeconds': session.remainingSeconds,
        'currentQuestionIndex': session.currentQuestionIndex,
        'startedAt': session.startedAt.toIso8601String(),
        'updatedAt': session.updatedAt.toIso8601String(),
      },
    );
    return session;
  }

  @override
  Future<void> deleteExamSession(String sessionId) async {
    await _apiClient.deleteJson(
      '/v1/exam-sessions/$sessionId',
      authenticated: true,
    );
  }

  @override
  Future<List<AdminAllowlistEntry>> getAdminAllowlist() async {
    final response = await _apiClient.getJson('/v1/admin/allowlist', authenticated: true);
    return (response['entries'] as List<dynamic>? ?? const [])
        .map((item) => AdminAllowlistEntry.fromJson(Map<String, dynamic>.from(item as Map)))
        .toList();
  }

  @override
  Future<AdminAllowlistEntry> addAdminAllowlistEntry({
    required String label,
    String? email,
    String? phone,
  }) async {
    final response = await _apiClient.postJson(
      '/v1/admin/allowlist',
      authenticated: true,
      body: {
        'label': label,
        if (email != null && email.isNotEmpty) 'email': email,
        if (phone != null && phone.isNotEmpty) 'phone': phone,
      },
    );
    return AdminAllowlistEntry.fromJson(response);
  }

  @override
  Future<void> removeAdminAllowlistEntry(String id) async {
    await _apiClient.deleteJson(
      '/v1/admin/allowlist/${Uri.encodeComponent(id)}',
      authenticated: true,
    );
  }

  @override
  Future<SupportMessage> addSupportMessage(SupportMessage message) async {
    await _apiClient.postJson(
      '/v1/support-messages',
      authenticated: true,
      body: {
        'id': message.id,
        'senderRole': message.sender.name,
        'message': message.message,
        'sentAt': message.sentAt.toIso8601String(),
        if (message.studentId != null) 'studentId': message.studentId,
      },
    );
    return message;
  }

  Course _courseFromJson(Map<String, dynamic> json) {
    final purchaseModeValue = (json['purchaseMode'] as String? ?? 'course').toLowerCase();
    return Course(
      id: json['id'] as String? ?? '',
      title: json['title'] as String? ?? '',
      subtitle: json['subtitle'] as String? ?? '',
      description: json['description'] as String? ?? '',
      price: (json['price'] as num?)?.toDouble() ?? 0,
      validityDays: (json['validityDays'] as num?)?.toInt() ?? 365,
      highlights: (json['highlights'] as List<dynamic>? ?? const []).cast<String>(),
      introVideoUrl: json['introVideoUrl'] as String?,
      heroLabel: json['heroLabel'] as String? ?? 'POPULAR',
      purchaseMode: purchaseModeValue == 'subject' ? PurchaseMode.subject : PurchaseMode.course,
      gstRate: (json['gstRate'] as num?)?.toDouble() ?? 0.18,
    );
  }

  Paper _paperFromJson(Map<String, dynamic> json) {
    return Paper(
      id: json['id'] as String? ?? '',
      courseId: json['courseId'] as String? ?? '',
      subjectId: json['subjectId'] as String?,
      title: json['title'] as String? ?? '',
      durationMinutes: (json['durationMinutes'] as num?)?.toInt() ?? 0,
      instructions: (json['instructions'] as List<dynamic>? ?? const []).cast<String>(),
      questions: (json['questions'] as List<dynamic>? ?? const [])
          .map((item) => _questionFromJson(Map<String, dynamic>.from(item as Map)))
          .toList(),
      isFreePreview: json['isFreePreview'] as bool? ?? false,
      questionCount: (json['questionCount'] as num?)?.toInt(),
      sourceFileUrl: json['sourceFileUrl'] as String?,
      sourceFileName: json['sourceFileName'] as String?,
    );
  }

  Subject _subjectFromJson(Map<String, dynamic> json) {
    return Subject(
      id: json['id'] as String? ?? '',
      courseId: json['courseId'] as String? ?? '',
      title: json['title'] as String? ?? '',
      description: json['description'] as String? ?? '',
      sortOrder: (json['sortOrder'] as num?)?.toInt() ?? 0,
      isPublished: json['isPublished'] as bool? ?? true,
    );
  }

  Question _questionFromJson(Map<String, dynamic> json) {
    final prompt = MathContentParser.normalizeSourceText(json['prompt'] as String? ?? '');
    final options = (json['options'] as List<dynamic>? ?? const [])
        .map((item) => MathContentParser.normalizeSourceText(item.toString()))
        .toList();
    return Question(
      id: json['id'] as String? ?? '',
      section: json['section'] as String? ?? '',
      prompt: prompt,
      options: options,
      correctIndex: (json['correctIndex'] as num?)?.toInt() ?? 0,
      promptSegments: (json['promptSegments'] as List<dynamic>?)
          ?.map((item) => MathContentSegment.fromJson(Map<String, dynamic>.from(item as Map)))
          .toList(),
      optionSegments: (json['optionSegments'] as List<dynamic>?)
          ?.map((group) => (group as List<dynamic>)
              .map((item) => MathContentSegment.fromJson(Map<String, dynamic>.from(item as Map)))
              .toList())
          .toList(),
      explanation: json['explanation'] as String?,
      topic: json['topic'] as String?,
      concepts: (json['concepts'] as List<dynamic>? ?? const []).map((item) => item.toString()).toList(),
      attachments: (json['attachments'] as List<dynamic>? ?? const [])
          .map((item) => QuestionAttachment.fromJson(Map<String, dynamic>.from(item as Map)))
          .where((item) => item.url.trim().isNotEmpty)
          .toList(),
      optionAttachments: (json['optionAttachments'] as List<dynamic>? ?? const [])
          .map((group) => (group as List<dynamic>)
              .map((item) => QuestionAttachment.fromJson(Map<String, dynamic>.from(item as Map)))
              .where((item) => item.url.trim().isNotEmpty)
              .toList())
          .toList(),
      difficulty: json['difficulty'] as String? ?? 'medium',
      marks: (json['marks'] as num?)?.toInt() ?? 3,
      negativeMarks: (json['negativeMarks'] as num?)?.toInt() ?? 1,
    );
  }

  Map<String, dynamic> _questionToJson(Question question) {
    return {
      'id': question.id,
      'section': question.section,
      'prompt': question.prompt,
      'promptSegments': question.promptSegments?.map((item) => item.toJson()).toList(),
      'options': question.options,
      'optionSegments': question.optionSegments
          ?.map((group) => group.map((item) => item.toJson()).toList())
          .toList(),
      'correctIndex': question.correctIndex,
      'explanation': question.explanation,
      'topic': question.topic,
      'concepts': question.concepts,
      'attachments': question.attachments.map((item) => item.toJson()).toList(),
      'optionAttachments': question.optionAttachments
          .map((group) => group.map((item) => item.toJson()).toList())
          .toList(),
      'difficulty': question.difficulty,
      'marks': question.marks,
      'negativeMarks': question.negativeMarks,
    };
  }

  Affiliate _affiliateFromJson(Map<String, dynamic> json) {
    return Affiliate(
      id: json['id'] as String? ?? '',
      name: json['name'] as String? ?? '',
      code: json['code'] as String? ?? '',
      channel: json['channel'] as String? ?? '',
      loginEmail: json['loginEmail'] as String? ?? json['login_email'] as String?,
      status: json['status'] as String? ?? 'active',
      invitationStatus: json['invitationStatus'] as String? ?? json['invitation_status'] as String? ?? 'active',
      hasSetPassword: json['hasSetPassword'] as bool? ?? json['has_set_password'] as bool? ?? true,
    );
  }

  StudentProfile _studentFromJson(Map<String, dynamic> json) {
    return StudentProfile(
      id: json['id'] as String? ?? '',
      name: json['name'] as String? ?? '',
      contact: json['contact'] as String? ?? '',
      city: json['city'] as String? ?? '',
      joinedAt: DateTime.tryParse(json['joinedAt'] as String? ?? '') ?? DateTime.now(),
      referralCode: json['referralCode'] as String?,
      hasCmsAdminAccess: json['hasCmsAdminAccess'] as bool? ?? false,
    );
  }
}
