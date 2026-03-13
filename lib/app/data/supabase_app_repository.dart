import 'package:supabase_flutter/supabase_flutter.dart';

import '../../math/math_content.dart';
import '../models.dart';
import '../sample_data.dart';
import 'app_repository.dart';

class SupabaseAppRepository implements AppRepository {
  SupabaseAppRepository([SupabaseClient? client])
      : _client = client ?? Supabase.instance.client;

  final SupabaseClient _client;

  @override
  Future<AppSeed> bootstrap() async {
    final fallback = buildAppSeed();

    final coursesRaw = await _client.from('courses').select().order('title');
    if (coursesRaw.isEmpty) {
      return fallback;
    }

    final papersRaw = await _client.from('papers').select().order('created_at');
    final questionsRaw = await _client.from('questions').select().order('sort_order');
    final affiliatesRaw = await _client.from('affiliates').select().order('created_at');
    final studentsRaw = await _client.from('profiles').select().order('joined_at');
    final purchasesRaw = await _client.from('purchases').select().order('purchased_at', ascending: false);
    final attemptsRaw = await _client.from('attempts').select().order('submitted_at', ascending: false);
    final supportRaw =
        await _client.from('support_messages').select().order('sent_at', ascending: true);

    final questionsByPaper = <String, List<Question>>{};
    for (final row in questionsRaw) {
      final question = _questionFromRow(row);
      questionsByPaper.update(
        row['paper_id'] as String,
        (list) => [...list, question],
        ifAbsent: () => [question],
      );
    }

    final courses = coursesRaw.map(_courseFromRow).toList();
    final papers = papersRaw
        .map(
          (row) => _paperFromRow(
            row,
            questionsByPaper[row['id'] as String] ?? const [],
          ),
        )
        .toList();
    final affiliates = affiliatesRaw.map(_affiliateFromRow).toList();
    final students = studentsRaw.map(_studentFromRow).toList();
    final currentStudent = students.firstWhere(
      (student) => student.id == fallback.currentStudent.id,
      orElse: () => fallback.currentStudent,
    );

    return AppSeed(
      courses: courses,
      papers: papers,
      affiliates: affiliates,
      currentStudent: currentStudent,
      students: students.isEmpty ? [fallback.currentStudent] : students,
      purchases: purchasesRaw.map(_purchaseFromRow).toList(),
      attempts: attemptsRaw.map(_attemptFromRow).toList(),
      supportMessages: supportRaw.map(_supportMessageFromRow).toList(),
    );
  }

  @override
  Future<StudentProfile> saveStudentProfile(StudentProfile profile) async {
    await _client.from('profiles').upsert({
      'id': profile.id,
      'name': profile.name,
      'contact': profile.contact,
      'city': profile.city,
      'referral_code': profile.referralCode,
      'joined_at': profile.joinedAt.toIso8601String(),
    });
    return profile;
  }

  @override
  Future<Affiliate> addAffiliate(Affiliate affiliate) async {
    await _client.from('affiliates').insert({
      'id': affiliate.id,
      'name': affiliate.name,
      'code': affiliate.code,
      'channel': affiliate.channel,
    });
    return affiliate;
  }

  @override
  Future<Course> addCourse(Course course) async {
    await _client.from('courses').upsert({
      'id': course.id,
      'title': course.title,
      'subtitle': course.subtitle,
      'description': course.description,
      'price': course.price,
      'validity_days': course.validityDays,
      'highlights': course.highlights,
      'intro_video_url': course.introVideoUrl,
      'hero_label': course.heroLabel,
    });
    return course;
  }

  @override
  Future<void> updateCourseVideo({
    required String courseId,
    required String? videoUrl,
  }) async {
    await _client.from('courses').update({
      'intro_video_url': videoUrl,
    }).eq('id', courseId);
  }

  @override
  Future<Paper> addPaper(Paper paper) async {
    await _client.from('papers').upsert({
      'id': paper.id,
      'course_id': paper.courseId,
      'title': paper.title,
      'duration_minutes': paper.durationMinutes,
      'instructions': paper.instructions,
      'is_free_preview': paper.isFreePreview,
    });

    for (var i = 0; i < paper.questions.length; i++) {
      final question = paper.questions[i];
      await _client.from('questions').upsert({
        'id': question.id,
        'paper_id': paper.id,
        'section': question.section,
        'prompt': question.prompt,
        'prompt_segments': question.promptSegments?.map((segment) => segment.toJson()).toList(),
        'options': question.options,
        'option_segments': question.optionSegments
            ?.map((segments) => segments.map((segment) => segment.toJson()).toList())
            .toList(),
        'correct_index': question.correctIndex,
        'explanation': question.explanation,
        'marks': question.marks,
        'negative_marks': question.negativeMarks,
        'sort_order': i,
      });
    }

    return paper;
  }

  @override
  Future<Purchase> savePurchase(Purchase purchase) async {
    await _client.from('purchases').insert({
      'id': purchase.id,
      'student_id': purchase.studentId,
      'course_id': purchase.courseId,
      'amount': purchase.amount,
      'receipt_number': purchase.receiptNumber,
      'valid_until': purchase.validUntil?.toIso8601String(),
      'payment_provider': purchase.paymentProvider,
      'payment_id': purchase.paymentId,
      'payment_order_id': purchase.paymentOrderId,
      'payment_signature': purchase.paymentSignature,
      'verified_at': purchase.verifiedAt?.toIso8601String(),
      'purchased_at': purchase.purchasedAt.toIso8601String(),
    });
    return purchase;
  }

  @override
  Future<ExamAttempt> saveAttempt(ExamAttempt attempt) async {
    await _client.from('attempts').insert({
      'id': attempt.id,
      'student_id': attempt.studentId,
      'course_id': attempt.courseId,
      'paper_id': attempt.paperId,
      'answers': attempt.answers,
      'section_scores': attempt.sectionScores,
      'score': attempt.score,
      'max_score': attempt.maxScore,
      'submitted_at': attempt.submittedAt.toIso8601String(),
    });
    return attempt;
  }

  @override
  Future<SupportMessage> addSupportMessage(SupportMessage message) async {
    await _client.from('support_messages').insert({
      'id': message.id,
      'sender_role': message.sender.name,
      'student_id': 'student-1',
      'message': message.message,
      'sent_at': message.sentAt.toIso8601String(),
    });
    return message;
  }

  Course _courseFromRow(Map<String, dynamic> row) {
    return Course(
      id: row['id'] as String,
      title: row['title'] as String,
      subtitle: row['subtitle'] as String,
      description: row['description'] as String,
      price: (row['price'] as num).toDouble(),
      validityDays: row['validity_days'] as int? ?? 365,
      highlights: (row['highlights'] as List<dynamic>? ?? const []).cast<String>(),
      introVideoUrl: row['intro_video_url'] as String?,
      heroLabel: row['hero_label'] as String? ?? 'POPULAR',
    );
  }

  Paper _paperFromRow(Map<String, dynamic> row, List<Question> questions) {
    return Paper(
      id: row['id'] as String,
      courseId: row['course_id'] as String,
      title: row['title'] as String,
      durationMinutes: row['duration_minutes'] as int,
      instructions: (row['instructions'] as List<dynamic>? ?? const []).cast<String>(),
      questions: questions,
      isFreePreview: row['is_free_preview'] as bool? ?? false,
    );
  }

  Question _questionFromRow(Map<String, dynamic> row) {
    return Question(
      id: row['id'] as String,
      section: row['section'] as String,
      prompt: row['prompt'] as String,
      options: (row['options'] as List<dynamic>).cast<String>(),
      correctIndex: row['correct_index'] as int,
      promptSegments: (row['prompt_segments'] as List<dynamic>?)
          ?.map((item) => MathContentSegment.fromJson(Map<String, dynamic>.from(item as Map)))
          .toList(),
      optionSegments: (row['option_segments'] as List<dynamic>?)
          ?.map(
            (group) => (group as List<dynamic>)
                .map(
                  (item) => MathContentSegment.fromJson(
                    Map<String, dynamic>.from(item as Map),
                  ),
                )
                .toList(),
          )
          .toList(),
      explanation: row['explanation'] as String?,
      marks: row['marks'] as int? ?? 3,
      negativeMarks: row['negative_marks'] as int? ?? 1,
    );
  }

  Affiliate _affiliateFromRow(Map<String, dynamic> row) {
    return Affiliate(
      id: row['id'] as String,
      name: row['name'] as String,
      code: row['code'] as String,
      channel: row['channel'] as String,
    );
  }

  StudentProfile _studentFromRow(Map<String, dynamic> row) {
    return StudentProfile(
      id: row['id'] as String,
      name: row['name'] as String,
      contact: row['contact'] as String,
      city: row['city'] as String,
      joinedAt: DateTime.parse(row['joined_at'] as String),
      referralCode: row['referral_code'] as String?,
    );
  }

  Purchase _purchaseFromRow(Map<String, dynamic> row) {
    return Purchase(
      id: row['id'] as String,
      studentId: row['student_id'] as String,
      courseId: row['course_id'] as String,
      amount: (row['amount'] as num).toDouble(),
      purchasedAt: DateTime.parse(row['purchased_at'] as String),
      receiptNumber: row['receipt_number'] as String,
      validUntil: row['valid_until'] == null
          ? null
          : DateTime.parse(row['valid_until'] as String),
      paymentProvider: row['payment_provider'] as String? ?? 'razorpay',
      paymentId: row['payment_id'] as String?,
      paymentOrderId: row['payment_order_id'] as String?,
      paymentSignature: row['payment_signature'] as String?,
      verifiedAt: row['verified_at'] == null
          ? null
          : DateTime.parse(row['verified_at'] as String),
    );
  }

  ExamAttempt _attemptFromRow(Map<String, dynamic> row) {
    return ExamAttempt(
      id: row['id'] as String,
      studentId: row['student_id'] as String,
      courseId: row['course_id'] as String,
      paperId: row['paper_id'] as String,
      answers: Map<String, int>.from(row['answers'] as Map),
      sectionScores: Map<String, int>.from(row['section_scores'] as Map),
      score: row['score'] as int,
      maxScore: row['max_score'] as int,
      submittedAt: DateTime.parse(row['submitted_at'] as String),
    );
  }

  SupportMessage _supportMessageFromRow(Map<String, dynamic> row) {
    return SupportMessage(
      id: row['id'] as String,
      sender: (row['sender_role'] as String) == 'admin'
          ? SenderRole.admin
          : SenderRole.student,
      message: row['message'] as String,
      sentAt: DateTime.parse(row['sent_at'] as String),
    );
  }
}
