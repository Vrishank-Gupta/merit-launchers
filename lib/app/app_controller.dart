import 'dart:math';

import 'package:flutter/foundation.dart';

import 'backend_config.dart';
import 'data/app_repository.dart';
import 'data/demo_app_repository.dart';
import 'local_activity_store.dart';
import 'data/supabase_app_repository.dart';
import 'models.dart';

class AppController extends ChangeNotifier {
  AppController._({
    required this.repository,
    required this.localActivityStore,
    required List<Course> courses,
    required List<Paper> papers,
    required List<Affiliate> affiliates,
    required StudentProfile student,
    required List<StudentProfile> students,
    required List<Purchase> purchases,
    required List<ExamAttempt> attempts,
    required List<SupportMessage> supportMessages,
  })  : _courses = courses,
        _papers = papers,
        _affiliates = affiliates,
        _student = student,
        _students = students,
        _purchases = purchases,
        _attempts = attempts,
        _supportMessages = supportMessages;

  final AppRepository repository;
  final LocalActivityStore localActivityStore;

  static Future<AppController> create(BackendConfig backendConfig) async {
    final repository = backendConfig.isDemo
        ? DemoAppRepository()
        : SupabaseAppRepository();
    final localActivityStore = await LocalActivityStore.create();
    final seed = await repository.bootstrap();
    final localSnapshot = await localActivityStore.load(seed.currentStudent.id);
    final mergedPurchases = _mergeById(seed.purchases, localSnapshot.purchases);
    final mergedAttempts = _mergeById(seed.attempts, localSnapshot.attempts);
    final mergedSupport = _mergeById(seed.supportMessages, localSnapshot.supportMessages);
    return AppController._(
      repository: repository,
      localActivityStore: localActivityStore,
      courses: List.of(seed.courses),
      papers: List.of(seed.papers),
      affiliates: List.of(seed.affiliates),
      student: seed.currentStudent,
      students: List.of(seed.students),
      purchases: List.of(mergedPurchases),
      attempts: List.of(mergedAttempts),
      supportMessages: List.of(mergedSupport.isEmpty ? [
        SupportMessage(
          id: 'welcome-msg',
          sender: SenderRole.admin,
          message: 'Welcome to Merit Launchers support.',
          sentAt: DateTime(2026, 3, 1),
        ),
      ] : mergedSupport),
    );
  }

  static List<T> _mergeById<T extends Object>(List<T> base, List<T> overlay) {
    final merged = <String, T>{};
    for (final item in base) {
      merged[_itemId(item)] = item;
    }
    for (final item in overlay) {
      merged[_itemId(item)] = item;
    }
    return merged.values.toList();
  }

  static String _itemId(Object item) {
    return switch (item) {
      Purchase purchase => purchase.id,
      ExamAttempt attempt => attempt.id,
      SupportMessage message => message.id,
      _ => throw ArgumentError('Unsupported merge item: ${item.runtimeType}'),
    };
  }

  final Random _random = Random();
  List<Course> _courses;
  List<Paper> _papers;
  List<Affiliate> _affiliates;
  List<StudentProfile> _students;
  List<Purchase> _purchases;
  List<ExamAttempt> _attempts;
  List<SupportMessage> _supportMessages;
  StudentProfile _student;

  AppStage stage = AppStage.landing;
  int studentTabIndex = 0;
  int adminTabIndex = 0;

  List<Course> get courses => List.unmodifiable(_courses);
  List<Paper> get papers => List.unmodifiable(_papers);
  List<Affiliate> get affiliates => List.unmodifiable(_affiliates);
  List<StudentProfile> get students => List.unmodifiable(_students);
  List<Purchase> get purchases => List.unmodifiable(_purchases);
  List<ExamAttempt> get attempts => List.unmodifiable(_attempts);
  List<SupportMessage> get supportMessages => List.unmodifiable(_supportMessages);
  StudentProfile get currentStudent => _student;

  double get totalRevenue =>
      _purchases.fold(0, (sum, purchase) => sum + purchase.amount);

  int get activeUsers => _students.length;

  int get paidUsers =>
      _students.where((student) => _purchases.any((purchase) => purchase.studentId == student.id)).length;

  Map<String, int> get courseEnrollments {
    final counts = <String, int>{};
    for (final purchase in _purchases) {
      counts.update(purchase.courseId, (value) => value + 1, ifAbsent: () => 1);
    }
    return counts;
  }

  Future<void> _persistActivity(
    Future<void> Function() action, {
    String? label,
  }) async {
    await _saveLocalActivityState();
    try {
      await action();
    } catch (error, stackTrace) {
      debugPrint('Local-first activity persistence skipped for ${label ?? 'activity'}: $error');
      debugPrintStack(stackTrace: stackTrace);
    }
  }

  Future<void> refreshContent() async {
    final fresh = await repository.bootstrap();
    final localSnapshot = await localActivityStore.load(_student.id);
    _courses = List.of(fresh.courses);
    _papers = List.of(fresh.papers);
    _affiliates = List.of(fresh.affiliates);
    _students = List.of(fresh.students);
    _purchases = List.of(_mergeById(fresh.purchases, localSnapshot.purchases));
    _attempts = List.of(_mergeById(fresh.attempts, localSnapshot.attempts));
    _supportMessages = List.of(
      _mergeById(fresh.supportMessages, localSnapshot.supportMessages).isEmpty
          ? [
              SupportMessage(
                id: 'welcome-msg',
                sender: SenderRole.admin,
                message: 'Welcome to Merit Launchers support.',
                sentAt: DateTime(2026, 3, 1),
              ),
            ]
          : _mergeById(fresh.supportMessages, localSnapshot.supportMessages),
    );

    _student = _students.firstWhere(
      (student) => student.id == _student.id,
      orElse: () => fresh.currentStudent,
    );
    await _saveLocalActivityState();
    notifyListeners();
  }

  Future<void> _saveLocalActivityState() async {
    await localActivityStore.save(
      studentId: _student.id,
      purchases: _purchases.where((purchase) => purchase.studentId == _student.id).toList(),
      attempts: _attempts.where((attempt) => attempt.studentId == _student.id).toList(),
      supportMessages: _supportMessages,
    );
  }

  void continueAsAdmin() {
    stage = AppStage.admin;
    notifyListeners();
  }

  void mockGoogleLogin() {
    stage = AppStage.onboarding;
    notifyListeners();
  }

  void mockOtpLogin() {
    stage = AppStage.onboarding;
    notifyListeners();
  }

  Future<void> completeOnboarding({
    required String name,
    required String city,
    String? referralCode,
  }) async {
    _student = _student.copyWith(
      name: name,
      city: city,
      referralCode: referralCode == null || referralCode.trim().isEmpty
          ? null
          : referralCode.trim().toUpperCase(),
    );

    _students = _students.map((student) {
      return student.id == _student.id ? _student : student;
    }).toList();

    await repository.saveStudentProfile(_student);
    stage = AppStage.student;
    notifyListeners();
  }

  void setStudentTab(int index) {
    studentTabIndex = index;
    notifyListeners();
  }

  void setAdminTab(int index) {
    adminTabIndex = index;
    notifyListeners();
  }

  bool isCourseUnlocked(String courseId) {
    return _purchases.any(
      (purchase) =>
          purchase.courseId == courseId && purchase.studentId == _student.id,
    );
  }

  List<Paper> papersForCourse(String courseId) {
    return _papers.where((paper) => paper.courseId == courseId).toList();
  }

  List<Paper> accessiblePapersForCourse(String courseId) {
    final unlocked = isCourseUnlocked(courseId);
    return papersForCourse(courseId)
        .where((paper) => unlocked || paper.isFreePreview)
        .toList();
  }

  Course? courseById(String courseId) {
    for (final course in _courses) {
      if (course.id == courseId) {
        return course;
      }
    }
    return null;
  }

  Paper? paperById(String paperId) {
    for (final paper in _papers) {
      if (paper.id == paperId) {
        return paper;
      }
    }
    return null;
  }

  Future<Purchase?> purchaseCourse(
    Course course, {
    String? paymentId,
    String? paymentOrderId,
    String? paymentSignature,
    Purchase? verifiedPurchase,
  }) async {
    if (isCourseUnlocked(course.id)) {
      return null;
    }

    final purchase = verifiedPurchase ??
        Purchase(
          id: 'purchase-${_random.nextInt(999999)}',
          studentId: _student.id,
          courseId: course.id,
          amount: course.price,
          purchasedAt: DateTime.now(),
          receiptNumber: 'ML-${DateTime.now().millisecondsSinceEpoch}',
          validUntil: DateTime.now().add(Duration(days: course.validityDays)),
          paymentId: paymentId,
          paymentOrderId: paymentOrderId,
          paymentSignature: paymentSignature,
        );

    _purchases = [
      purchase,
      ..._purchases.where((existing) => existing.id != purchase.id),
    ];
    notifyListeners();
    if (verifiedPurchase == null) {
      await _persistActivity(
        () => repository.savePurchase(purchase),
        label: 'purchase',
      );
    }
    return purchase;
  }

  Future<ExamAttempt> submitAttempt({
    required Paper paper,
    required Map<String, int> answers,
  }) async {
    int score = 0;
    int maxScore = 0;
    final sectionScores = <String, int>{};

    for (final question in paper.questions) {
      maxScore += question.marks;
      final given = answers[question.id];
      int delta = 0;
      if (given != null) {
        delta = given == question.correctIndex
            ? question.marks
            : -question.negativeMarks;
      }
      score += delta;
      sectionScores.update(
        question.section,
        (value) => value + delta,
        ifAbsent: () => delta,
      );
    }

    final attempt = ExamAttempt(
      id: 'attempt-${_random.nextInt(999999)}',
      studentId: _student.id,
      courseId: paper.courseId,
      paperId: paper.id,
      answers: answers,
      sectionScores: sectionScores,
      score: score,
      maxScore: maxScore,
      submittedAt: DateTime.now(),
    );
    _attempts = [attempt, ..._attempts];
    notifyListeners();
    await _persistActivity(
      () => repository.saveAttempt(attempt),
      label: 'attempt',
    );
    return attempt;
  }

  Future<void> addSupportMessage(SenderRole sender, String message) async {
    if (message.trim().isEmpty) {
      return;
    }
    final supportMessage = SupportMessage(
      id: 'msg-${_random.nextInt(999999)}',
      sender: sender,
      message: message.trim(),
      sentAt: DateTime.now(),
    );
    _supportMessages = [..._supportMessages, supportMessage];
    notifyListeners();
    await _persistActivity(
      () => repository.addSupportMessage(supportMessage),
      label: 'support message',
    );
  }

  Future<void> addAffiliate({
    required String name,
    required String code,
    required String channel,
  }) async {
    if (name.trim().isEmpty || code.trim().isEmpty) {
      return;
    }
    final affiliate = Affiliate(
      id: 'aff-${_random.nextInt(999999)}',
      name: name,
      code: code.trim().toUpperCase(),
      channel: channel,
    );
    await repository.addAffiliate(affiliate);
    _affiliates = [affiliate, ..._affiliates];
    notifyListeners();
  }

  Future<void> addCourse({
    required String title,
    required String subtitle,
    required String description,
    required double price,
    required String heroLabel,
    String? introVideoUrl,
  }) async {
    if (title.trim().isEmpty) {
      return;
    }
    final course = Course(
      id: title.toLowerCase().replaceAll(RegExp(r'[^a-z0-9]+'), '-'),
      title: title,
      subtitle: subtitle,
      description: description,
      price: price,
      validityDays: 365,
      heroLabel: heroLabel,
      introVideoUrl: introVideoUrl,
      highlights: const [
        'Dynamic content ready',
        'Free preview capable',
        'Payment unlock flow',
      ],
    );
    await repository.addCourse(course);
    _courses = [course, ..._courses];
    notifyListeners();
  }

  Future<void> updateCourseVideo({
    required String courseId,
    required String? videoUrl,
  }) async {
    await repository.updateCourseVideo(
      courseId: courseId,
      videoUrl: videoUrl,
    );
    _courses = _courses
        .map((course) => course.id == courseId
            ? Course(
                id: course.id,
                title: course.title,
                subtitle: course.subtitle,
                description: course.description,
                price: course.price,
                validityDays: course.validityDays,
                highlights: course.highlights,
                introVideoUrl: videoUrl,
                heroLabel: course.heroLabel,
              )
            : course)
        .toList();
    notifyListeners();
  }

  Future<void> addPaper({
    required String courseId,
    required String title,
    required int durationMinutes,
    required bool isFreePreview,
    required List<String> instructions,
    required List<Question> questions,
  }) async {
    if (title.trim().isEmpty || questions.isEmpty) {
      return;
    }
    final paper = Paper(
      id: '$courseId-${_random.nextInt(999999)}',
      courseId: courseId,
      title: title,
      durationMinutes: durationMinutes,
      instructions: instructions,
      questions: questions,
      isFreePreview: isFreePreview,
    );
    await repository.addPaper(paper);
    _papers = [paper, ..._papers];
    notifyListeners();
  }

  int affiliateReferrals(String code) {
    return _students.where((student) => student.referralCode == code).length;
  }

  List<Purchase> purchasesForStudent(String studentId) {
    return _purchases.where((purchase) => purchase.studentId == studentId).toList();
  }

  List<ExamAttempt> attemptsForStudent(String studentId) {
    return _attempts.where((attempt) => attempt.studentId == studentId).toList();
  }

  void logout() {
    stage = AppStage.landing;
    studentTabIndex = 0;
    adminTabIndex = 0;
    notifyListeners();
  }
}
