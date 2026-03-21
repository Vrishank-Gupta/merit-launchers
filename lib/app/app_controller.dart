import 'dart:async';
import 'dart:math';

import 'package:flutter/foundation.dart';
import 'package:google_sign_in/google_sign_in.dart';

import 'api_auth_client.dart';
import 'api_client.dart';
import 'api_session.dart';
import 'api_session_store.dart';
import 'backend_config.dart';
import 'data/api_app_repository.dart';
import 'data/app_repository.dart';
import 'data/demo_app_repository.dart';
import 'local_activity_store.dart';
import '../math/math_content.dart';
import '../math/math_svg_renderer.dart';
import 'models.dart';

class AppController extends ChangeNotifier {
  AppController._({
    required this.backendConfig,
    required this.repository,
    required this.localActivityStore,
    required this.sessionStore,
    required this.authClient,
    required List<Course> courses,
    required List<Paper> papers,
    required List<Affiliate> affiliates,
    required StudentProfile student,
    required List<StudentProfile> students,
    required List<Purchase> purchases,
    required List<ExamAttempt> attempts,
    required List<ExamSession> examSessions,
    required List<SupportMessage> supportMessages,
    ApiSession? session,
  })  : _courses = courses,
        _papers = papers,
        _affiliates = affiliates,
        _student = student,
        _students = students,
        _purchases = purchases,
        _attempts = attempts,
        _examSessions = examSessions,
        _supportMessages = supportMessages,
        _session = session;

  final BackendConfig backendConfig;
  final AppRepository repository;
  final LocalActivityStore localActivityStore;
  final ApiSessionStore sessionStore;
  final ApiAuthClient? authClient;

  String? get apiAccessToken => authClient?.token;
  ApiClient? get apiClient => authClient?.rawClient;

  static Future<AppController> create(BackendConfig backendConfig) async {
    final localActivityStore = await LocalActivityStore.create();
    final sessionStore = await ApiSessionStore.create();
    final apiClient = backendConfig.isDemo || backendConfig.apiBaseUrl == null
        ? null
        : ApiClient(baseUrl: backendConfig.apiBaseUrl!);
    final authClient = apiClient == null
        ? null
        : ApiAuthClient(
            apiClient: apiClient,
            sessionStore: sessionStore,
          );
    final session = authClient == null ? null : await authClient.restoreSession();
    final repository = backendConfig.isDemo
        ? DemoAppRepository()
        : ApiAppRepository(apiClient!);

    final seed = await repository.bootstrap();
    final snapshotStudentId = _seedStudentId(seed, session);
    final localSnapshot = await localActivityStore.load(snapshotStudentId);
    final mergedPurchases = _mergeById(seed.purchases, localSnapshot.purchases);
    final mergedAttempts = _mergeById(seed.attempts, localSnapshot.attempts);
    final mergedExamSessions = _mergeById(seed.examSessions, localSnapshot.examSessions);
    final mergedSupport = _mergeById(seed.supportMessages, localSnapshot.supportMessages);

    final controller = AppController._(
      backendConfig: backendConfig,
      repository: repository,
      localActivityStore: localActivityStore,
      sessionStore: sessionStore,
      authClient: authClient,
      courses: List.of(seed.courses),
      papers: List.of(seed.papers),
      affiliates: List.of(seed.affiliates),
      student: _studentFromSeed(seed, session),
      students: List.of(seed.students),
      purchases: List.of(mergedPurchases),
      attempts: List.of(mergedAttempts),
      examSessions: List.of(mergedExamSessions),
      supportMessages: List.of(
        mergedSupport.isEmpty
            ? [
                SupportMessage(
                  id: 'welcome-msg',
                  sender: SenderRole.admin,
                  message: 'Welcome to Merit Launchers support.',
                  sentAt: DateTime(2026, 3, 1),
                ),
              ]
            : mergedSupport,
      ),
      session: session,
    );
    controller._initializeStage();
    return controller;
  }

  static String _seedStudentId(AppSeed seed, ApiSession? session) {
    if (seed.currentStudent.id.isNotEmpty) {
      return seed.currentStudent.id;
    }
    return session?.user.id ?? '';
  }

  static StudentProfile _studentFromSeed(AppSeed seed, ApiSession? session) {
    if (seed.currentStudent.id.isNotEmpty) {
      return seed.currentStudent;
    }
    if (session != null && session.user.role == 'student') {
      return StudentProfile(
        id: session.user.id,
        name: session.user.name,
        contact: session.user.phone ?? session.user.email ?? '',
        city: session.user.city ?? '',
        joinedAt: DateTime.now(),
        referralCode: session.user.referralCode,
      );
    }
    return StudentProfile(
      id: '',
      name: '',
      contact: '',
      city: '',
      joinedAt: DateTime.now(),
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
      ExamSession session => session.id,
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
  List<ExamSession> _examSessions;
  List<SupportMessage> _supportMessages;
  List<AdminAllowlistEntry> _allowlistEntries = [];
  StudentProfile _student;
  ApiSession? _session;
  GoogleSignIn? _googleSignIn;

  AppStage stage = AppStage.landing;
  int studentTabIndex = 0;
  int adminTabIndex = 0;
  bool authBusy = false;
  String? authError;
  bool studentOtpRequested = false;
  bool adminOtpRequested = false;
  String? pendingStudentPhone;
  String? pendingAdminPhone;
  String? pendingReferralCode;

  List<Course> get courses => List.unmodifiable(_courses);
  List<Paper> get papers => List.unmodifiable(_papers);
  List<Affiliate> get affiliates => List.unmodifiable(_affiliates);
  List<StudentProfile> get students => List.unmodifiable(_students);
  List<Purchase> get purchases => List.unmodifiable(_purchases);
  List<ExamAttempt> get attempts => List.unmodifiable(_attempts);
  List<ExamSession> get examSessions => List.unmodifiable(_examSessions);
  List<SupportMessage> get supportMessages => List.unmodifiable(_supportMessages);
  List<AdminAllowlistEntry> get allowlistEntries => List.unmodifiable(_allowlistEntries);
  StudentProfile get currentStudent => _student;
  bool get isDemo => backendConfig.isDemo;
  bool get canUseDevBypass => backendConfig.environment == AppEnvironment.dev;
  bool get canUseGoogleSignIn {
    if (backendConfig.isDemo || authClient == null) {
      return false;
    }
    if (kIsWeb) {
      return backendConfig.googleWebClientId != null;
    }
    if (defaultTargetPlatform == TargetPlatform.iOS) {
      return backendConfig.googleIosClientId != null;
    }
    return (backendConfig.googleAndroidServerClientId ?? backendConfig.googleWebClientId) != null;
  }

  double get totalRevenue => _purchases.fold(0, (sum, purchase) => sum + purchase.amount);
  String? get capturedReferralCode => pendingReferralCode;

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

  void _initializeStage() {
    if (backendConfig.isDemo) {
      stage = AppStage.landing;
      return;
    }
    if (_session == null) {
      stage = AppStage.landing;
      return;
    }
    if (_session!.user.role == 'admin') {
      stage = AppStage.admin;
      return;
    }
    stage = _requiresOnboarding(_student) ? AppStage.onboarding : AppStage.student;
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

  bool _requiresOnboarding(StudentProfile student) =>
      student.name.trim().isEmpty || student.city.trim().isEmpty;

  String _normalizePhone(String input) {
    final trimmed = input.trim();
    if (trimmed.startsWith('+')) {
      return trimmed;
    }

    final digits = trimmed.replaceAll(RegExp(r'[^0-9]'), '');
    if (digits.length == 10) {
      return '+91$digits';
    }
    if (digits.length == 12 && digits.startsWith('91')) {
      return '+$digits';
    }
    if (digits.length == 11 && digits.startsWith('0')) {
      return '+91${digits.substring(1)}';
    }
    return '+$digits';
  }

  Future<void> refreshContent() async {
    final fresh = await repository.bootstrap();
    final currentId = _student.id.isNotEmpty ? _student.id : fresh.currentStudent.id;
    final localSnapshot = await localActivityStore.load(currentId);
    _courses = List.of(fresh.courses);
    _papers = List.of(fresh.papers);
    _affiliates = List.of(fresh.affiliates);
    _students = List.of(fresh.students);
    _purchases = List.of(_mergeById(fresh.purchases, localSnapshot.purchases));
    _attempts = List.of(_mergeById(fresh.attempts, localSnapshot.attempts));
    _examSessions = List.of(_mergeById(fresh.examSessions, localSnapshot.examSessions));
    final mergedSupport = _mergeById(fresh.supportMessages, localSnapshot.supportMessages);
    _supportMessages = List.of(
      mergedSupport.isEmpty
          ? [
              SupportMessage(
                id: 'welcome-msg',
                sender: SenderRole.admin,
                message: 'Welcome to Merit Launchers support.',
                sentAt: DateTime(2026, 3, 1),
              ),
            ]
          : mergedSupport,
    );

    if (_session?.user.role == 'student') {
      _student = _students.firstWhere(
        (student) => student.id == _session!.user.id,
        orElse: () => fresh.currentStudent.id.isNotEmpty ? fresh.currentStudent : _student,
      );
    }

    await _saveLocalActivityState();
    notifyListeners();
  }

  Future<void> _saveLocalActivityState() async {
    await localActivityStore.save(
      studentId: _student.id,
      purchases: _purchases.where((purchase) => purchase.studentId == _student.id).toList(),
      attempts: _attempts.where((attempt) => attempt.studentId == _student.id).toList(),
      examSessions: _examSessions.where((session) => session.studentId == _student.id).toList(),
      supportMessages: _supportMessages,
    );
  }

  void continueAsAdmin() {
    if (!backendConfig.isDemo) {
      return;
    }
    stage = AppStage.admin;
    notifyListeners();
  }

  Future<void> signInStudentWithGoogle() async {
    if (backendConfig.isDemo) {
      stage = AppStage.onboarding;
      notifyListeners();
      return;
    }

    authBusy = true;
    authError = null;
    notifyListeners();
    try {
      final session = await _signInWithGoogle(admin: false);
      await _completeAuthSession(session);
    } catch (error) {
      authBusy = false;
      authError = 'Google sign-in failed. $error';
      notifyListeners();
    }
  }

  Future<void> signInAdminWithGoogle() async {
    if (backendConfig.isDemo) {
      stage = AppStage.admin;
      notifyListeners();
      return;
    }

    authBusy = true;
    authError = null;
    notifyListeners();
    try {
      final session = await _signInWithGoogle(admin: true);
      await _completeAuthSession(session);
    } catch (error) {
      authBusy = false;
      authError = 'Google sign-in failed. $error';
      notifyListeners();
    }
  }

  Future<void> signInStudentWithDevBypass() async {
    if (!canUseDevBypass || authClient == null) {
      return;
    }

    authBusy = true;
    authError = null;
    notifyListeners();
    try {
      final session = await authClient!.devLogin(admin: false);
      await _completeAuthSession(session);
    } catch (error) {
      authBusy = false;
      authError = 'Dev sign-in failed. $error';
      notifyListeners();
    }
  }

  Future<void> signInAdminWithDevBypass() async {
    if (!canUseDevBypass || authClient == null) {
      return;
    }

    authBusy = true;
    authError = null;
    notifyListeners();
    try {
      final session = await authClient!.devLogin(admin: true);
      await _completeAuthSession(session);
    } catch (error) {
      authBusy = false;
      authError = 'Dev sign-in failed. $error';
      notifyListeners();
    }
  }

  Future<void> signInAdminWithPassword(String email, String password) async {
    if (authClient == null) return;
    authBusy = true;
    authError = null;
    notifyListeners();
    try {
      final session = await authClient!.passwordLogin(email: email, password: password);
      await _completeAuthSession(session);
    } catch (error) {
      authBusy = false;
      authError = error.toString();
      notifyListeners();
    }
  }

  Future<void> requestStudentOtp(String phone) async {
    if (backendConfig.isDemo) {
      stage = AppStage.onboarding;
      notifyListeners();
      return;
    }

    authBusy = true;
    authError = null;
    notifyListeners();
    try {
      pendingStudentPhone = _normalizePhone(phone);
      await authClient!.requestOtp(phone: pendingStudentPhone!, admin: false);
      authBusy = false;
      studentOtpRequested = true;
      notifyListeners();
    } catch (error) {
      authBusy = false;
      authError = 'Unable to send OTP. $error';
      notifyListeners();
    }
  }

  Future<void> verifyStudentOtp(String token) async {
    if (backendConfig.isDemo) {
      stage = AppStage.onboarding;
      notifyListeners();
      return;
    }
    if (pendingStudentPhone == null) {
      authError = 'Request an OTP first.';
      notifyListeners();
      return;
    }

    authBusy = true;
    authError = null;
    notifyListeners();
    try {
      final session = await authClient!.verifyOtp(
        phone: pendingStudentPhone!,
        code: token.trim(),
        admin: false,
      );
      await _completeAuthSession(session);
    } catch (error) {
      authBusy = false;
      authError = 'OTP verification failed. $error';
      notifyListeners();
    }
  }

  Future<void> requestAdminOtp(String phone) async {
    if (backendConfig.isDemo) {
      stage = AppStage.admin;
      notifyListeners();
      return;
    }

    authBusy = true;
    authError = null;
    notifyListeners();
    try {
      pendingAdminPhone = _normalizePhone(phone);
      await authClient!.requestOtp(phone: pendingAdminPhone!, admin: true);
      authBusy = false;
      adminOtpRequested = true;
      notifyListeners();
    } catch (error) {
      authBusy = false;
      authError = 'Unable to send OTP. $error';
      notifyListeners();
    }
  }

  Future<void> verifyAdminOtp(String token) async {
    if (backendConfig.isDemo) {
      stage = AppStage.admin;
      notifyListeners();
      return;
    }
    if (pendingAdminPhone == null) {
      authError = 'Request an OTP first.';
      notifyListeners();
      return;
    }

    authBusy = true;
    authError = null;
    notifyListeners();
    try {
      final session = await authClient!.verifyOtp(
        phone: pendingAdminPhone!,
        code: token.trim(),
        admin: true,
      );
      await _completeAuthSession(session);
    } catch (error) {
      authBusy = false;
      authError = 'OTP verification failed. $error';
      notifyListeners();
    }
  }

  Future<void> _completeAuthSession(ApiSession session) async {
    _session = session;
    pendingStudentPhone = null;
    pendingAdminPhone = null;
    studentOtpRequested = false;
    adminOtpRequested = false;

    if (session.user.role == 'student') {
      _student = StudentProfile(
        id: session.user.id,
        name: session.user.name,
        contact: session.user.phone ?? session.user.email ?? '',
        city: session.user.city ?? '',
        joinedAt: DateTime.now(),
        referralCode: session.user.referralCode ?? pendingReferralCode,
      );
    }

    await refreshContent();

    authBusy = false;
    authError = null;
    if (session.user.role == 'admin') {
      stage = AppStage.admin;
    } else {
      _student = _students.firstWhere(
        (student) => student.id == session.user.id,
        orElse: () => _student,
      );
      if ((_student.referralCode == null || _student.referralCode!.isEmpty) &&
          pendingReferralCode != null &&
          pendingReferralCode!.isNotEmpty) {
        _student = _student.copyWith(referralCode: pendingReferralCode);
      }
      stage = _requiresOnboarding(_student) ? AppStage.onboarding : AppStage.student;
    }
    notifyListeners();
  }

  void setPendingReferralCode(String value) {
    final normalized = value.trim().toUpperCase();
    pendingReferralCode = normalized.isEmpty ? null : normalized;
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
          ? _student.referralCode
          : referralCode.trim().toUpperCase(),
    );

    _students = _students.map((student) {
      return student.id == _student.id ? _student : student;
    }).toList();

    _student = await repository.saveStudentProfile(_student);
    pendingReferralCode = null;
    stage = AppStage.student;
    notifyListeners();
  }

  Future<void> updateCurrentStudentProfile({
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
    notifyListeners();
    _student = await repository.saveStudentProfile(_student);
    pendingReferralCode = _student.referralCode;
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
      (purchase) => purchase.courseId == courseId && purchase.studentId == _student.id,
    );
  }

  List<Paper> papersForCourse(String courseId) {
    return _papers.where((paper) => paper.courseId == courseId).toList();
  }

  List<Paper> accessiblePapersForCourse(String courseId) {
    final unlocked = isCourseUnlocked(courseId);
    return papersForCourse(courseId).where((paper) => unlocked || paper.isFreePreview).toList();
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

  ExamSession? sessionForPaper(String paperId) {
    for (final session in _examSessions) {
      if (session.studentId == _student.id && session.paperId == paperId) {
        return session;
      }
    }
    return null;
  }

  List<ExamSession> sessionsForStudent(String studentId) {
    final sessions = _examSessions.where((session) => session.studentId == studentId).toList();
    sessions.sort((a, b) => b.updatedAt.compareTo(a.updatedAt));
    return sessions;
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
    return purchase;
  }

  Future<ExamAttempt> submitAttempt({
    required Paper paper,
    required Map<String, int> answers,
    String? sessionId,
  }) async {
    int score = 0;
    int maxScore = 0;
    final sectionScores = <String, int>{};

    for (final question in paper.questions) {
      maxScore += question.marks;
      final given = answers[question.id];
      int delta = 0;
      if (given != null) {
        delta = given == question.correctIndex ? question.marks : -question.negativeMarks;
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
    if (sessionId != null) {
      _examSessions = _examSessions.where((session) => session.id != sessionId).toList();
    }
    notifyListeners();
    await _persistActivity(
      () => repository.saveAttempt(attempt),
      label: 'attempt',
    );
    if (sessionId != null) {
      await _persistActivity(
        () => repository.deleteExamSession(sessionId),
        label: 'exam session delete',
      );
    }
    return attempt;
  }

  ExamSession startOrResumeExamSession(Paper paper) {
    final existing = sessionForPaper(paper.id);
    if (existing != null) {
      return existing;
    }

    final session = ExamSession(
      id: 'session-${paper.id}-${DateTime.now().millisecondsSinceEpoch}',
      studentId: _student.id,
      courseId: paper.courseId,
      paperId: paper.id,
      answers: const {},
      remainingSeconds: paper.durationMinutes * 60,
      currentQuestionIndex: 0,
      startedAt: DateTime.now(),
      updatedAt: DateTime.now(),
    );
    _examSessions = [session, ..._examSessions];
    notifyListeners();
    unawaited(_persistActivity(
      () => repository.saveExamSession(session),
      label: 'exam session',
    ));
    return session;
  }

  Future<void> saveExamSession(ExamSession session) async {
    _examSessions = [
      session,
      ..._examSessions.where((existing) => existing.id != session.id),
    ];
    notifyListeners();
    await _persistActivity(
      () => repository.saveExamSession(session),
      label: 'exam session',
    );
  }

  Future<void> discardExamSession(String sessionId) async {
    _examSessions = _examSessions.where((session) => session.id != sessionId).toList();
    notifyListeners();
    await _persistActivity(
      () => repository.deleteExamSession(sessionId),
      label: 'exam session delete',
    );
  }

  Future<void> addSupportMessage(SenderRole sender, String message, {String? studentId}) async {
    if (message.trim().isEmpty) {
      return;
    }
    final supportMessage = SupportMessage(
      id: 'msg-${_random.nextInt(999999)}',
      sender: sender,
      message: message.trim(),
      sentAt: DateTime.now(),
      studentId: studentId ?? (sender == SenderRole.student ? _student.id : null),
    );
    _supportMessages = [..._supportMessages, supportMessage];
    notifyListeners();
    await _persistActivity(
      () => repository.addSupportMessage(supportMessage),
      label: 'support message',
    );
  }

  Future<void> loadAdminAllowlist() async {
    _allowlistEntries = await repository.getAdminAllowlist();
    notifyListeners();
  }

  Future<void> addAdminAllowlistEntry({
    required String label,
    String? email,
    String? phone,
  }) async {
    final entry = await repository.addAdminAllowlistEntry(
      label: label,
      email: email,
      phone: phone,
    );
    _allowlistEntries = [entry, ..._allowlistEntries.where((e) => e.id != entry.id)];
    notifyListeners();
  }

  Future<void> removeAdminAllowlistEntry(String id) async {
    await repository.removeAdminAllowlistEntry(id);
    _allowlistEntries = _allowlistEntries.where((e) => e.id != id).toList();
    notifyListeners();
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
    final saved = await repository.addAffiliate(affiliate);
    _affiliates = [saved, ..._affiliates];
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
    final saved = await repository.addCourse(course);
    _courses = [saved, ..._courses];
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
    final preparedQuestions = await _prepareQuestionsForPersistence(questions);
    final paper = Paper(
      id: '$courseId-${_random.nextInt(999999)}',
      courseId: courseId,
      title: title,
      durationMinutes: durationMinutes,
      instructions: instructions,
      questions: preparedQuestions,
      isFreePreview: isFreePreview,
    );
    final saved = await repository.addPaper(paper);
    _papers = [saved, ..._papers];
    notifyListeners();
  }

  Future<void> updatePaper({
    required String paperId,
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
    final preparedQuestions = await _prepareQuestionsForPersistence(questions);
    final paper = Paper(
      id: paperId,
      courseId: courseId,
      title: title,
      durationMinutes: durationMinutes,
      instructions: instructions,
      questions: preparedQuestions,
      isFreePreview: isFreePreview,
    );
    final saved = await repository.updatePaper(paper);
    _papers = _papers.map((existing) => existing.id == paperId ? saved : existing).toList();
    notifyListeners();
  }

  int affiliateReferrals(String code) {
    return _students.where((student) => student.referralCode == code).length;
  }

  List<StudentProfile> studentsForReferralCode(String code) {
    return _students.where((student) => student.referralCode == code).toList()
      ..sort((a, b) => b.joinedAt.compareTo(a.joinedAt));
  }

  List<Purchase> purchasesForReferralCode(String code) {
    final referredStudentIds = studentsForReferralCode(code).map((student) => student.id).toSet();
    return _purchases.where((purchase) => referredStudentIds.contains(purchase.studentId)).toList()
      ..sort((a, b) => b.purchasedAt.compareTo(a.purchasedAt));
  }

  int affiliatePaidStudents(String code) {
    final paidStudentIds = purchasesForReferralCode(code).map((purchase) => purchase.studentId).toSet();
    return paidStudentIds.length;
  }

  double affiliateRevenue(String code) {
    return purchasesForReferralCode(code).fold(0, (sum, purchase) => sum + purchase.amount);
  }

  Future<List<Question>> _prepareQuestionsForPersistence(List<Question> questions) async {
    final prepared = <Question>[];

    for (final question in questions) {
      final normalizedPrompt = MathContentParser.normalizeSourceText(question.prompt);
      final normalizedOptions = question.options
          .map(MathContentParser.normalizeSourceText)
          .toList(growable: false);

      List<MathContentSegment>? promptSegments = question.promptSegments;
      List<List<MathContentSegment>>? optionSegments = question.optionSegments;

      if (kIsWeb) {
        promptSegments = await renderMathSegments(normalizedPrompt);
        optionSegments = <List<MathContentSegment>>[];
        for (final option in normalizedOptions) {
          optionSegments.add(await renderOptionMathSegments(option));
        }
      }

      prepared.add(
        Question(
          id: question.id,
          section: question.section,
          prompt: normalizedPrompt,
          options: normalizedOptions,
          correctIndex: question.correctIndex,
          promptSegments: promptSegments,
          optionSegments: optionSegments,
          explanation: question.explanation,
          topic: question.topic,
          concepts: question.concepts,
          difficulty: question.difficulty,
          marks: question.marks,
          negativeMarks: question.negativeMarks,
        ),
      );
    }

    return prepared;
  }

  List<Purchase> purchasesForStudent(String studentId) {
    return _purchases.where((purchase) => purchase.studentId == studentId).toList();
  }

  List<ExamAttempt> attemptsForStudent(String studentId) {
    return _attempts.where((attempt) => attempt.studentId == studentId).toList();
  }

  Future<void> logout() async {
    if (!backendConfig.isDemo) {
      await authClient?.clearSession();
      await _googleSignInClient().signOut();
    }
    _session = null;
    stage = AppStage.landing;
    studentTabIndex = 0;
    adminTabIndex = 0;
    authBusy = false;
    authError = null;
    studentOtpRequested = false;
    adminOtpRequested = false;
    pendingStudentPhone = null;
    pendingAdminPhone = null;
    notifyListeners();
  }

  Future<ApiSession> _signInWithGoogle({required bool admin}) async {
    final googleUser = await _googleSignInClient().signIn();
    if (googleUser == null) {
      throw StateError('Google sign-in was cancelled.');
    }

    final googleAuth = await googleUser.authentication;

    if (kIsWeb) {
      final accessToken = googleAuth.accessToken;
      if (accessToken == null || accessToken.isEmpty) {
        throw StateError('Google did not return an access token.');
      }
      return authClient!.signInWithGoogleAccessToken(
        accessToken: accessToken,
        admin: admin,
      );
    }

    final idToken = googleAuth.idToken;
    if (idToken == null || idToken.isEmpty) {
      throw StateError('Google did not return an ID token.');
    }

    return authClient!.signInWithGoogle(
      idToken: idToken,
      admin: admin,
    );
  }

  GoogleSignIn _googleSignInClient() {
    return _googleSignIn ??= GoogleSignIn(
      clientId: defaultTargetPlatform == TargetPlatform.iOS
          ? backendConfig.googleIosClientId
          : (kIsWeb ? backendConfig.googleWebClientId : null),
      serverClientId: kIsWeb ? null : (backendConfig.googleAndroidServerClientId ?? backendConfig.googleWebClientId),
    );
  }
}
