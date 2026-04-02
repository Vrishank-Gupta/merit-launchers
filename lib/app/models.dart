import '../math/math_content.dart';

enum AppStage { landing, phoneVerification, emailCollection, onboarding, student, admin }

enum SenderRole { student, admin }

enum PurchaseMode { course, subject }

class StudentProfile {
  const StudentProfile({
    required this.id,
    required this.name,
    required this.contact,
    required this.city,
    required this.joinedAt,
    this.referralCode,
    this.hasCmsAdminAccess = false,
  });

  final String id;
  final String name;
  final String contact;
  final String city;
  final DateTime joinedAt;
  final String? referralCode;
  final bool hasCmsAdminAccess;

  StudentProfile copyWith({
    String? id,
    String? name,
    String? contact,
    String? city,
    DateTime? joinedAt,
    String? referralCode,
    bool? hasCmsAdminAccess,
  }) {
    return StudentProfile(
      id: id ?? this.id,
      name: name ?? this.name,
      contact: contact ?? this.contact,
      city: city ?? this.city,
      joinedAt: joinedAt ?? this.joinedAt,
      referralCode: referralCode ?? this.referralCode,
      hasCmsAdminAccess: hasCmsAdminAccess ?? this.hasCmsAdminAccess,
    );
  }
}

class Affiliate {
  const Affiliate({
    required this.id,
    required this.name,
    required this.code,
    required this.channel,
    this.loginEmail,
    this.status = 'active',
    this.invitationStatus = 'active',
    this.hasSetPassword = true,
  });

  final String id;
  final String name;
  final String code;
  final String channel;
  final String? loginEmail;
  final String status;
  final String invitationStatus;
  final bool hasSetPassword;
}

class Course {
  const Course({
    required this.id,
    required this.title,
    required this.subtitle,
    required this.description,
    required this.price,
    required this.validityDays,
    required this.highlights,
    this.introVideoUrl,
    this.heroLabel = 'POPULAR',
    this.purchaseMode = PurchaseMode.course,
    this.gstRate = 0.18,
  });

  final String id;
  final String title;
  final String subtitle;
  final String description;
  final double price;
  final int validityDays;
  final List<String> highlights;
  final String? introVideoUrl;
  final String heroLabel;
  final PurchaseMode purchaseMode;
  final double gstRate;
}

class Subject {
  const Subject({
    required this.id,
    required this.courseId,
    required this.title,
    this.description = '',
    this.sortOrder = 0,
    this.isPublished = true,
  });

  final String id;
  final String courseId;
  final String title;
  final String description;
  final int sortOrder;
  final bool isPublished;
}

class Paper {
  const Paper({
    required this.id,
    required this.courseId,
    this.subjectId,
    required this.title,
    required this.durationMinutes,
    required this.instructions,
    required this.questions,
    this.isFreePreview = false,
  });

  final String id;
  final String courseId;
  final String? subjectId;
  final String title;
  final int durationMinutes;
  final List<String> instructions;
  final List<Question> questions;
  final bool isFreePreview;
}

class Question {
  const Question({
    required this.id,
    required this.section,
    required this.prompt,
    required this.options,
    required this.correctIndex,
    this.promptSegments,
    this.optionSegments,
    this.explanation,
    this.topic,
    this.concepts = const [],
    this.difficulty = 'medium',
    this.marks = 3,
    this.negativeMarks = 1,
  });

  final String id;
  final String section;
  final String prompt;
  final List<String> options;
  final int correctIndex;
  final List<MathContentSegment>? promptSegments;
  final List<List<MathContentSegment>>? optionSegments;
  final String? explanation;
  final String? topic;
  final List<String> concepts;
  final String difficulty;
  final int marks;
  final int negativeMarks;
}

class Purchase {
  const Purchase({
    required this.id,
    required this.studentId,
    required this.courseId,
    required this.amount,
    required this.purchasedAt,
    required this.receiptNumber,
    this.subjectId,
    this.validUntil,
    this.paymentProvider = 'razorpay',
    this.paymentId,
    this.paymentOrderId,
    this.paymentSignature,
    this.verifiedAt,
  });

  final String id;
  final String studentId;
  final String courseId;
  final String? subjectId;
  final double amount;
  final DateTime purchasedAt;
  final String receiptNumber;
  final DateTime? validUntil;
  final String paymentProvider;
  final String? paymentId;
  final String? paymentOrderId;
  final String? paymentSignature;
  final DateTime? verifiedAt;

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'student_id': studentId,
      'course_id': courseId,
      'subject_id': subjectId,
      'amount': amount,
      'purchased_at': purchasedAt.toIso8601String(),
      'receipt_number': receiptNumber,
      'valid_until': validUntil?.toIso8601String(),
      'payment_provider': paymentProvider,
      'payment_id': paymentId,
      'payment_order_id': paymentOrderId,
      'payment_signature': paymentSignature,
      'verified_at': verifiedAt?.toIso8601String(),
    };
  }

  factory Purchase.fromJson(Map<String, dynamic> json) {
    return Purchase(
      id: json['id'] as String,
      studentId: json['student_id'] as String,
      courseId: json['course_id'] as String,
      subjectId: json['subject_id'] as String?,
      amount: (json['amount'] as num).toDouble(),
      purchasedAt: DateTime.parse(json['purchased_at'] as String),
      receiptNumber: json['receipt_number'] as String,
      validUntil: json['valid_until'] == null
          ? null
          : DateTime.parse(json['valid_until'] as String),
      paymentProvider: json['payment_provider'] as String? ?? 'razorpay',
      paymentId: json['payment_id'] as String?,
      paymentOrderId: json['payment_order_id'] as String?,
      paymentSignature: json['payment_signature'] as String?,
      verifiedAt: json['verified_at'] == null
          ? null
          : DateTime.parse(json['verified_at'] as String),
    );
  }
}

class ExamAttempt {
  const ExamAttempt({
    required this.id,
    required this.studentId,
    required this.courseId,
    required this.paperId,
    required this.answers,
    required this.sectionScores,
    required this.score,
    required this.maxScore,
    required this.submittedAt,
  });

  final String id;
  final String studentId;
  final String courseId;
  final String paperId;
  final Map<String, int> answers;
  final Map<String, int> sectionScores;
  final int score;
  final int maxScore;
  final DateTime submittedAt;

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'student_id': studentId,
      'course_id': courseId,
      'paper_id': paperId,
      'answers': answers,
      'section_scores': sectionScores,
      'score': score,
      'max_score': maxScore,
      'submitted_at': submittedAt.toIso8601String(),
    };
  }

  factory ExamAttempt.fromJson(Map<String, dynamic> json) {
    return ExamAttempt(
      id: json['id'] as String,
      studentId: json['student_id'] as String,
      courseId: json['course_id'] as String,
      paperId: json['paper_id'] as String,
      answers: Map<String, int>.from(json['answers'] as Map),
      sectionScores: Map<String, int>.from(json['section_scores'] as Map),
      score: json['score'] as int,
      maxScore: json['max_score'] as int,
      submittedAt: DateTime.parse(json['submitted_at'] as String),
    );
  }
}

class ExamSession {
  const ExamSession({
    required this.id,
    required this.studentId,
    required this.courseId,
    required this.paperId,
    required this.answers,
    required this.remainingSeconds,
    required this.currentQuestionIndex,
    required this.startedAt,
    required this.updatedAt,
  });

  final String id;
  final String studentId;
  final String courseId;
  final String paperId;
  final Map<String, int> answers;
  final int remainingSeconds;
  final int currentQuestionIndex;
  final DateTime startedAt;
  final DateTime updatedAt;

  ExamSession copyWith({
    String? id,
    String? studentId,
    String? courseId,
    String? paperId,
    Map<String, int>? answers,
    int? remainingSeconds,
    int? currentQuestionIndex,
    DateTime? startedAt,
    DateTime? updatedAt,
  }) {
    return ExamSession(
      id: id ?? this.id,
      studentId: studentId ?? this.studentId,
      courseId: courseId ?? this.courseId,
      paperId: paperId ?? this.paperId,
      answers: answers ?? this.answers,
      remainingSeconds: remainingSeconds ?? this.remainingSeconds,
      currentQuestionIndex: currentQuestionIndex ?? this.currentQuestionIndex,
      startedAt: startedAt ?? this.startedAt,
      updatedAt: updatedAt ?? this.updatedAt,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'student_id': studentId,
      'course_id': courseId,
      'paper_id': paperId,
      'answers': answers,
      'remaining_seconds': remainingSeconds,
      'current_question_index': currentQuestionIndex,
      'started_at': startedAt.toIso8601String(),
      'updated_at': updatedAt.toIso8601String(),
    };
  }

  factory ExamSession.fromJson(Map<String, dynamic> json) {
    return ExamSession(
      id: json['id'] as String,
      studentId: json['student_id'] as String,
      courseId: json['course_id'] as String,
      paperId: json['paper_id'] as String,
      answers: Map<String, int>.from(json['answers'] as Map? ?? const {}),
      remainingSeconds: json['remaining_seconds'] as int,
      currentQuestionIndex: json['current_question_index'] as int? ?? 0,
      startedAt: DateTime.parse(json['started_at'] as String),
      updatedAt: DateTime.parse(json['updated_at'] as String),
    );
  }
}

class SupportMessage {
  const SupportMessage({
    required this.id,
    required this.sender,
    required this.message,
    required this.sentAt,
    this.studentId,
  });

  final String id;
  final SenderRole sender;
  final String message;
  final DateTime sentAt;
  /// The student this message belongs to. Set for all messages in a thread
  /// (both student-sent and admin replies targeting that student).
  final String? studentId;

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'sender_role': sender.name,
      'message': message,
      'sent_at': sentAt.toIso8601String(),
      if (studentId != null) 'student_id': studentId,
    };
  }

  factory SupportMessage.fromJson(Map<String, dynamic> json) {
    return SupportMessage(
      id: json['id'] as String,
      sender: (json['sender_role'] as String) == 'admin'
          ? SenderRole.admin
          : SenderRole.student,
      message: json['message'] as String,
      sentAt: DateTime.parse(json['sent_at'] as String),
      studentId: json['student_id'] as String?,
    );
  }
}

class AdminAllowlistEntry {
  const AdminAllowlistEntry({
    required this.id,
    required this.label,
    this.email,
    this.phone,
    required this.isActive,
    required this.createdAt,
  });

  final String id;
  final String label;
  final String? email;
  final String? phone;
  final bool isActive;
  final DateTime createdAt;

  factory AdminAllowlistEntry.fromJson(Map<String, dynamic> json) {
    return AdminAllowlistEntry(
      id: json['id'] as String,
      label: json['label'] as String? ?? '',
      email: json['email'] as String?,
      phone: json['phone'] as String?,
      isActive: json['isActive'] as bool? ?? true,
      createdAt: DateTime.tryParse(json['createdAt'] as String? ?? '') ?? DateTime.now(),
    );
  }
}

class AppSeed {
  const AppSeed({
    required this.courses,
    required this.subjects,
    required this.papers,
    required this.affiliates,
    required this.currentStudent,
    required this.students,
    required this.purchases,
    required this.attempts,
    required this.examSessions,
    required this.supportMessages,
  });

  final List<Course> courses;
  final List<Subject> subjects;
  final List<Paper> papers;
  final List<Affiliate> affiliates;
  final StudentProfile currentStudent;
  final List<StudentProfile> students;
  final List<Purchase> purchases;
  final List<ExamAttempt> attempts;
  final List<ExamSession> examSessions;
  final List<SupportMessage> supportMessages;
}
