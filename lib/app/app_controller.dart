import 'dart:async';
import 'dart:math';

import 'package:flutter/foundation.dart';
import 'package:flutter/services.dart';
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
import 'pricing.dart';
import '../math/math_content.dart';
import '../rich_content/rich_content_codec.dart';
import 'models.dart';

class AppController extends ChangeNotifier {
  AppController._({
    required this.backendConfig,
    required this.repository,
    required this.localActivityStore,
    required this.sessionStore,
    required this.authClient,
    required List<Course> courses,
    required List<Subject> subjects,
    required List<Paper> papers,
    required List<Affiliate> affiliates,
    required StudentProfile student,
    required List<StudentProfile> students,
    required List<Purchase> purchases,
    required List<ExamAttempt> attempts,
    required List<ExamSession> examSessions,
    required List<SupportMessage> supportMessages,
    ApiSession? session,
  }) : _courses = courses,
       _subjects = subjects,
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
    if (kDebugMode) {
      debugPrint('[AppController] create start');
    }
    final localActivityStore = await LocalActivityStore.create();
    final sessionStore = await ApiSessionStore.create();
    final apiClient =
        backendConfig.isDemo || backendConfig.apiBaseUrl == null
            ? null
            : ApiClient(baseUrl: backendConfig.apiBaseUrl!);
    final authClient =
        apiClient == null
            ? null
            : ApiAuthClient(apiClient: apiClient, sessionStore: sessionStore);
    final session =
        authClient == null ? null : await authClient.restoreSession();
    if (kDebugMode) {
      debugPrint(
        '[AppController] session restored: ${session != null} api=${backendConfig.apiBaseUrl}',
      );
    }
    final repository =
        backendConfig.isDemo
            ? DemoAppRepository()
            : ApiAppRepository(apiClient!);

    if (kDebugMode) {
      debugPrint('[AppController] bootstrap start');
    }
    AppSeed seed;
    try {
      seed = await repository.bootstrap();
    } on ApiException catch (error) {
      final message = error.message.toLowerCase();
      final invalidSession =
          message.contains('invalid signature') ||
          message.contains('session expired or invalid');
      if (!invalidSession || authClient == null || session == null) {
        rethrow;
      }
      if (kDebugMode) {
        debugPrint(
          '[AppController] clearing stale session after bootstrap failure: ${error.message}',
        );
      }
      await authClient.discardStoredSession();
      seed = await repository.bootstrap();
    }
    if (kDebugMode) {
      debugPrint('[AppController] bootstrap done');
    }
    final snapshotStudentId = _seedStudentId(seed, session);
    final localSnapshot = await localActivityStore.load(snapshotStudentId);
    final mergedPurchases = _mergePurchases(
      backendConfig: backendConfig,
      remote: seed.purchases,
      local: localSnapshot.purchases,
    );
    final mergedAttempts = _mergeById(seed.attempts, localSnapshot.attempts);
    final mergedExamSessions = _mergeById(
      seed.examSessions,
      localSnapshot.examSessions,
    );
    final mergedSupport = _mergeById(
      seed.supportMessages,
      localSnapshot.supportMessages,
    );

    final controller = AppController._(
      backendConfig: backendConfig,
      repository: repository,
      localActivityStore: localActivityStore,
      sessionStore: sessionStore,
      authClient: authClient,
      courses: List.of(seed.courses),
      subjects: List.of(seed.subjects),
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
    apiClient?.onUnauthorized = controller.logout;
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
      final sessionHasCmsAdminAccess =
          session != null &&
          session.user.role == 'student' &&
          session.user.id == seed.currentStudent.id &&
          session.user.hasCmsAdminAccess;
      return seed.currentStudent.copyWith(
        hasCmsAdminAccess:
            seed.currentStudent.hasCmsAdminAccess || sessionHasCmsAdminAccess,
      );
    }
    if (session != null && session.user.role == 'student') {
      return StudentProfile(
        id: session.user.id,
        name: session.user.name,
        contact: session.user.phone ?? session.user.email ?? '',
        city: session.user.city ?? '',
        joinedAt: DateTime.now(),
        referralCode: session.user.referralCode,
        hasCmsAdminAccess: session.user.hasCmsAdminAccess,
      );
    }
    return StudentProfile(
      id: '',
      name: '',
      contact: '',
      city: '',
      joinedAt: DateTime.now(),
      hasCmsAdminAccess: false,
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

  static List<Purchase> _mergePurchases({
    required BackendConfig backendConfig,
    required List<Purchase> remote,
    required List<Purchase> local,
  }) {
    if (backendConfig.isDemo) {
      return _mergeById(remote, local);
    }
    return List.of(remote);
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
  List<Subject> _subjects;
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
  String? pendingReferralCode;
  String? authNotice;

  // Post-login phone collection (Google login -> add phone)
  bool phoneVerificationBusy = false;
  String? phoneVerificationError;
  bool emailCollectionBusy = false;
  String? emailCollectionError;

  List<Course> get courses => List.unmodifiable(_courses);
  List<Subject> get subjects => List.unmodifiable(_subjects);
  List<Paper> get papers => List.unmodifiable(_papers);
  List<Affiliate> get affiliates => List.unmodifiable(_affiliates);
  List<StudentProfile> get students => List.unmodifiable(_students);
  List<Purchase> get purchases => List.unmodifiable(_purchases);
  List<ExamAttempt> get attempts => List.unmodifiable(_attempts);
  List<ExamSession> get examSessions => List.unmodifiable(_examSessions);
  List<SupportMessage> get supportMessages =>
      List.unmodifiable(_supportMessages);
  List<AdminAllowlistEntry> get allowlistEntries =>
      List.unmodifiable(_allowlistEntries);
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
    return (backendConfig.googleAndroidServerClientId ??
            backendConfig.googleWebClientId) !=
        null;
  }

  double get totalRevenue =>
      _purchases.fold(0, (sum, purchase) => sum + purchase.amount);
  String? get capturedReferralCode => pendingReferralCode;

  int get activeUsers => _students.length;

  int get paidUsers =>
      _students
          .where(
            (student) =>
                _purchases.any((purchase) => purchase.studentId == student.id),
          )
          .length;

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
    stage = _nextStudentStage(_session!, _student);
  }

  Future<void> _persistActivity(
    Future<void> Function() action, {
    String? label,
  }) async {
    await _saveLocalActivityState();
    try {
      await action();
    } catch (error, stackTrace) {
      debugPrint(
        'Local-first activity persistence skipped for ${label ?? 'activity'}: $error',
      );
      debugPrintStack(stackTrace: stackTrace);
    }
  }

  bool _requiresOnboarding(StudentProfile student) =>
      student.name.trim().isEmpty || student.city.trim().isEmpty;

  AppStage _nextStudentStage(ApiSession session, StudentProfile student) {
    // Google login (has email, no phone) -> collect phone directly.
    if (session.user.phone == null && session.user.email != null) {
      return AppStage.phoneVerification;
    }
    return _requiresOnboarding(student)
        ? AppStage.onboarding
        : AppStage.student;
  }

  void resetPhoneVerification() {
    phoneVerificationError = null;
    notifyListeners();
  }

  void clearAuthFeedback() {
    authError = null;
    authNotice = null;
    notifyListeners();
  }

  void showAuthError(String message) {
    authError = message;
    authNotice = null;
    notifyListeners();
  }

  void showAuthNotice(String message) {
    authNotice = message;
    authError = null;
    notifyListeners();
  }

  void setPhoneVerificationError(String message) {
    phoneVerificationError = message;
    notifyListeners();
  }

  Future<void> saveProfilePhone(String phone) async {
    phoneVerificationBusy = true;
    phoneVerificationError = null;
    notifyListeners();
    try {
      final session = await authClient!.saveProfilePhone(
        phone: _normalizePhone(phone),
      );
      _session = session;
      if (_session!.user.role == 'student') {
        _student = _student.copyWith(
          contact: session.user.phone ?? session.user.email ?? '',
        );
      }
      stage =
          _requiresOnboarding(_student)
              ? AppStage.onboarding
              : AppStage.student;
    } catch (error) {
      phoneVerificationError = error.toString().replaceFirst('Exception: ', '');
    } finally {
      phoneVerificationBusy = false;
      notifyListeners();
    }
  }

  Future<void> saveProfileEmail(String email) async {
    emailCollectionBusy = true;
    emailCollectionError = null;
    notifyListeners();
    try {
      final session = await authClient!.saveProfileEmail(email: email.trim());
      _session = session;
      stage =
          _requiresOnboarding(_student)
              ? AppStage.onboarding
              : AppStage.student;
    } catch (error) {
      emailCollectionError = error.toString().replaceFirst('Exception: ', '');
    } finally {
      emailCollectionBusy = false;
      notifyListeners();
    }
  }

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
    final currentId =
        _student.id.isNotEmpty ? _student.id : fresh.currentStudent.id;
    final localSnapshot = await localActivityStore.load(currentId);
    _courses = List.of(fresh.courses);
    _papers = List.of(fresh.papers);
    _affiliates = List.of(fresh.affiliates);
    _students = List.of(fresh.students);
    _purchases = List.of(
      _mergePurchases(
        backendConfig: backendConfig,
        remote: fresh.purchases,
        local: localSnapshot.purchases,
      ),
    );
    _attempts = List.of(_mergeById(fresh.attempts, localSnapshot.attempts));
    _examSessions = List.of(
      _mergeById(fresh.examSessions, localSnapshot.examSessions),
    );
    final mergedSupport = _mergeById(
      fresh.supportMessages,
      localSnapshot.supportMessages,
    );
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
      if (fresh.currentStudent.id == _session!.user.id) {
        _student = fresh.currentStudent;
      } else {
        _student = _students.firstWhere(
          (student) => student.id == _session!.user.id,
          orElse: () => _student,
        );
      }
    }

    await _saveLocalActivityState();
    notifyListeners();
  }

  Future<void> _saveLocalActivityState() async {
    await localActivityStore.save(
      studentId: _student.id,
      purchases:
          _purchases
              .where((purchase) => purchase.studentId == _student.id)
              .toList(),
      attempts:
          _attempts
              .where((attempt) => attempt.studentId == _student.id)
              .toList(),
      examSessions:
          _examSessions
              .where((session) => session.studentId == _student.id)
              .toList(),
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
    authNotice = null;
    notifyListeners();
    try {
      final session = await _signInWithGoogle(admin: false);
      await _completeAuthSession(session);
    } catch (error) {
      authBusy = false;
      if (error is! StateError ||
          error.message != 'Google sign-in was cancelled.') {
        authError = _formatGoogleSignInError(error);
      }
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
    authNotice = null;
    notifyListeners();
    try {
      final session = await _signInWithGoogle(admin: true);
      await _completeAuthSession(session);
    } catch (error) {
      authBusy = false;
      if (error is! StateError ||
          error.message != 'Google sign-in was cancelled.') {
        authError = _formatGoogleSignInError(error);
      }
      notifyListeners();
    }
  }

  Future<void> signInStudentWithDevBypass() async {
    if (!canUseDevBypass || authClient == null) {
      return;
    }

    authBusy = true;
    authError = null;
    authNotice = null;
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
    authNotice = null;
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
    authNotice = null;
    notifyListeners();
    try {
      final session = await authClient!.passwordLogin(
        email: email,
        password: password,
        admin: true,
      );
      await _completeAuthSession(session);
    } catch (error) {
      authBusy = false;
      authError = error.toString();
      notifyListeners();
    }
  }

  Future<void> signInStudentWithPassword(String email, String password) async {
    if (authClient == null) return;
    authBusy = true;
    authError = null;
    authNotice = null;
    notifyListeners();
    try {
      final session = await authClient!.passwordLogin(
        email: email,
        password: password,
      );
      await _completeAuthSession(session);
    } catch (error) {
      authBusy = false;
      authError = error.toString();
      notifyListeners();
    }
  }

  Future<void> signUpStudentWithEmail(String email, String password) async {
    if (authClient == null) return;
    authBusy = true;
    authError = null;
    authNotice = null;
    notifyListeners();
    try {
      final message = await authClient!.signUpStudentWithEmail(
        email: email.trim(),
        password: password,
        referralCode: pendingReferralCode,
      );
      authBusy = false;
      authNotice =
          message ?? 'Account created. Please verify your email, then sign in.';
      notifyListeners();
    } catch (error) {
      authBusy = false;
      authError = error.toString();
      notifyListeners();
    }
  }

  Future<void> resendStudentVerification(String email) async {
    if (authClient == null) return;
    authBusy = true;
    authError = null;
    authNotice = null;
    notifyListeners();
    try {
      await authClient!.resendStudentVerification(email: email.trim());
      authBusy = false;
      authNotice = 'Verification email sent. Please check your inbox.';
      notifyListeners();
    } catch (error) {
      authBusy = false;
      authError = error.toString();
      notifyListeners();
    }
  }

  Future<void> requestPasswordReset({
    required String email,
    required String audience,
  }) async {
    if (authClient == null) return;
    authBusy = true;
    authError = null;
    authNotice = null;
    notifyListeners();
    try {
      await authClient!.requestPasswordReset(
        email: email.trim(),
        audience: audience,
      );
      authBusy = false;
      authNotice = 'If this account exists, a reset email has been sent.';
      notifyListeners();
    } catch (error) {
      authBusy = false;
      authError = error.toString();
      notifyListeners();
    }
  }

  Future<void> _completeAuthSession(ApiSession session) async {
    _session = session;

    if (session.user.role == 'student') {
      _student = StudentProfile(
        id: session.user.id,
        name: session.user.name,
        contact: session.user.phone ?? session.user.email ?? '',
        city: session.user.city ?? '',
        joinedAt: DateTime.now(),
        referralCode: session.user.referralCode ?? pendingReferralCode,
        hasCmsAdminAccess: session.user.hasCmsAdminAccess,
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
      stage = _nextStudentStage(_session!, _student);
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
      referralCode:
          referralCode == null || referralCode.trim().isEmpty
              ? _student.referralCode
              : referralCode.trim().toUpperCase(),
    );

    _students =
        _students.map((student) {
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
      referralCode:
          referralCode == null || referralCode.trim().isEmpty
              ? null
              : referralCode.trim().toUpperCase(),
      clearReferralCode: referralCode == null || referralCode.trim().isEmpty,
    );
    _students =
        _students.map((student) {
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

  bool get hasCmsAdminStudentAccess => _student.hasCmsAdminAccess;

  bool isCourseUnlocked(String courseId) {
    if (hasCmsAdminStudentAccess) {
      return true;
    }
    final course = courseById(courseId);
    if (course == null) {
      return false;
    }
    if (course.purchaseMode == PurchaseMode.subject) {
      final subjects = subjectsForCourse(courseId);
      if (subjects.isEmpty) {
        return false;
      }
      return subjects.every(
        (subject) => isSubjectUnlocked(courseId, subject.id),
      );
    }
    return _purchases.any(
      (purchase) =>
          purchase.courseId == courseId &&
          purchase.studentId == _student.id &&
          purchase.subjectId == null,
    );
  }

  bool isSubjectUnlocked(String courseId, String subjectId) {
    if (hasCmsAdminStudentAccess) {
      return true;
    }
    return _purchases.any(
      (purchase) =>
          purchase.courseId == courseId &&
          purchase.studentId == _student.id &&
          purchase.subjectId == subjectId,
    );
  }

  int unlockedSubjectCount(String courseId) {
    final course = courseById(courseId);
    if (course == null || course.purchaseMode != PurchaseMode.subject) {
      return isCourseUnlocked(courseId) ? 1 : 0;
    }
    return subjectsForCourse(
      courseId,
    ).where((subject) => isSubjectUnlocked(courseId, subject.id)).length;
  }

  List<Paper> papersForCourse(String courseId) {
    return _papers.where((paper) => paper.courseId == courseId).toList();
  }

  List<Subject> subjectsForCourse(String courseId) {
    final subjects =
        _subjects.where((subject) => subject.courseId == courseId).toList()
          ..sort((a, b) {
            final order = a.sortOrder.compareTo(b.sortOrder);
            if (order != 0) return order;
            return a.title.toLowerCase().compareTo(b.title.toLowerCase());
          });
    return subjects;
  }

  Subject? subjectById(String subjectId) {
    for (final subject in _subjects) {
      if (subject.id == subjectId) {
        return subject;
      }
    }
    return null;
  }

  List<Paper> accessiblePapersForCourse(String courseId) {
    final course = courseById(courseId);
    if (course == null) {
      return const [];
    }
    if (course.purchaseMode == PurchaseMode.subject) {
      return papersForCourse(courseId).where((paper) {
        if (!paper.isActive) {
          return false;
        }
        if (paper.isFreePreview) {
          return true;
        }
        final subjectId = paper.subjectId;
        return subjectId != null && isSubjectUnlocked(courseId, subjectId);
      }).toList();
    }
    final unlocked = isCourseUnlocked(courseId);
    return papersForCourse(courseId)
        .where((paper) => paper.isActive && (unlocked || paper.isFreePreview))
        .toList();
  }

  List<Paper> papersForSubject(String subjectId) {
    return _papers.where((paper) => paper.subjectId == subjectId).toList();
  }

  List<Paper> accessiblePapersForSubject(String courseId, String subjectId) {
    final course = courseById(courseId);
    if (course != null && course.purchaseMode == PurchaseMode.subject) {
      final unlocked = isSubjectUnlocked(courseId, subjectId);
      return papersForSubject(subjectId)
          .where((paper) => paper.isActive && (unlocked || paper.isFreePreview))
          .toList();
    }
    final unlocked = isCourseUnlocked(courseId);
    return papersForSubject(subjectId)
        .where((paper) => paper.isActive && (unlocked || paper.isFreePreview))
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

  bool paperHasLoadedQuestions(Paper paper) {
    return paper.questions.isNotEmpty;
  }

  Future<Paper> ensurePaperLoaded(String paperId, {bool force = false}) async {
    final existing = paperById(paperId);
    if (existing == null) {
      throw StateError('Paper not found.');
    }
    if (!force && paperHasLoadedQuestions(existing)) {
      return existing;
    }
    final loaded = await repository.fetchPaper(paperId);
    _papers =
        _papers.map((paper) => paper.id == paperId ? loaded : paper).toList();
    notifyListeners();
    return loaded;
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
    final sessions =
        _examSessions
            .where((session) => session.studentId == studentId)
            .toList();
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
    if (course.purchaseMode == PurchaseMode.subject ||
        isCourseUnlocked(course.id)) {
      return null;
    }

    final purchase =
        verifiedPurchase ??
        Purchase(
          id: 'purchase-${_random.nextInt(999999)}',
          studentId: _student.id,
          courseId: course.id,
          amount: normalizedCourseTotalPrice(course),
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

  Future<Purchase?> purchaseSubject(
    Course course,
    Subject subject, {
    String? paymentId,
    String? paymentOrderId,
    String? paymentSignature,
    Purchase? verifiedPurchase,
  }) async {
    if (course.purchaseMode != PurchaseMode.subject ||
        isSubjectUnlocked(course.id, subject.id)) {
      return null;
    }

    final purchase =
        verifiedPurchase ??
        Purchase(
          id: 'purchase-${_random.nextInt(999999)}',
          studentId: _student.id,
          courseId: course.id,
          subjectId: subject.id,
          amount: normalizedCourseTotalPrice(course),
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
        delta =
            given == question.correctIndex
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
    if (sessionId != null) {
      _examSessions =
          _examSessions.where((session) => session.id != sessionId).toList();
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
    unawaited(
      _persistActivity(
        () => repository.saveExamSession(session),
        label: 'exam session',
      ),
    );
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
    _examSessions =
        _examSessions.where((session) => session.id != sessionId).toList();
    notifyListeners();
    await _persistActivity(
      () => repository.deleteExamSession(sessionId),
      label: 'exam session delete',
    );
  }

  Future<void> addSupportMessage(
    SenderRole sender,
    String message, {
    String? studentId,
  }) async {
    if (message.trim().isEmpty) {
      return;
    }
    final supportMessage = SupportMessage(
      id: 'msg-${_random.nextInt(999999)}',
      sender: sender,
      message: message.trim(),
      sentAt: DateTime.now(),
      studentId:
          studentId ?? (sender == SenderRole.student ? _student.id : null),
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
    _allowlistEntries = [
      entry,
      ..._allowlistEntries.where((e) => e.id != entry.id),
    ];
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
    required String heroLabel,
    String? introVideoUrl,
  }) async {
    if (title.trim().isEmpty) {
      return;
    }
    final courseId = title.toLowerCase().replaceAll(RegExp(r'[^a-z0-9]+'), '-');
    final course = Course(
      id: courseId,
      title: title,
      subtitle: subtitle,
      description: description,
      price: basePriceForCourseId(courseId),
      validityDays: 365,
      heroLabel: heroLabel,
      introVideoUrl: introVideoUrl,
      purchaseMode: purchaseModeForCourseId(courseId),
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

  Future<void> addSubject({
    required String courseId,
    required String title,
    String description = '',
  }) async {
    if (title.trim().isEmpty) {
      return;
    }
    final existingCount = subjectsForCourse(courseId).length;
    final subject = Subject(
      id:
          '$courseId-${title.toLowerCase().replaceAll(RegExp(r'[^a-z0-9]+'), '-')}-${_random.nextInt(999999)}',
      courseId: courseId,
      title: title.trim(),
      description: description.trim(),
      sortOrder: existingCount,
    );
    final saved = await repository.addSubject(subject);
    _subjects = [..._subjects, saved];
    notifyListeners();
  }

  Future<void> updateSubject({
    required String subjectId,
    required String courseId,
    required String title,
    String description = '',
    int? sortOrder,
    bool isPublished = true,
  }) async {
    if (title.trim().isEmpty) {
      return;
    }
    final existing = subjectById(subjectId);
    final subject = Subject(
      id: subjectId,
      courseId: courseId,
      title: title.trim(),
      description: description.trim(),
      sortOrder: sortOrder ?? existing?.sortOrder ?? 0,
      isPublished: isPublished,
    );
    final saved = await repository.updateSubject(subject);
    _subjects =
        _subjects.map((item) => item.id == subjectId ? saved : item).toList();
    notifyListeners();
  }

  Future<void> deleteSubject(String subjectId) async {
    await repository.deleteSubject(subjectId);
    final deletedPaperIds =
        _papers
            .where((paper) => paper.subjectId == subjectId)
            .map((paper) => paper.id)
            .toSet();
    _subjects = _subjects.where((subject) => subject.id != subjectId).toList();
    _papers = _papers.where((paper) => paper.subjectId != subjectId).toList();
    _attempts =
        _attempts
            .where((attempt) => !deletedPaperIds.contains(attempt.paperId))
            .toList();
    _examSessions =
        _examSessions
            .where((session) => !deletedPaperIds.contains(session.paperId))
            .toList();
    notifyListeners();
  }

  Future<void> updateCourseVideo({
    required String courseId,
    required String? videoUrl,
  }) async {
    await repository.updateCourseVideo(courseId: courseId, videoUrl: videoUrl);
    _courses =
        _courses
            .map(
              (course) =>
                  course.id == courseId
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
                        purchaseMode: course.purchaseMode,
                        gstRate: course.gstRate,
                      )
                      : course,
            )
            .toList();
    notifyListeners();
  }

  Future<void> addPaper({
    required String courseId,
    String? subjectId,
    required String title,
    required int durationMinutes,
    required bool isFreePreview,
    bool isActive = true,
    bool shuffleQuestions = false,
    int defaultMarks = 3,
    int defaultNegativeMarks = 1,
    required List<String> instructions,
    required List<Question> questions,
    String? sourceFileUrl,
    String? sourceFileName,
  }) async {
    if (title.trim().isEmpty || questions.isEmpty) {
      return;
    }
    final preparedQuestions = await _prepareQuestionsForPersistence(questions);
    final paper = Paper(
      id: '$courseId-${_random.nextInt(999999)}',
      courseId: courseId,
      subjectId: subjectId,
      title: title,
      durationMinutes: durationMinutes,
      instructions: instructions,
      questions: preparedQuestions,
      isFreePreview: isFreePreview,
      isActive: isActive,
      shuffleQuestions: shuffleQuestions,
      defaultMarks: defaultMarks,
      defaultNegativeMarks: defaultNegativeMarks,
      sourceFileUrl: sourceFileUrl,
      sourceFileName: sourceFileName,
    );
    final saved = await repository.addPaper(paper);
    _papers = [saved, ..._papers];
    notifyListeners();
  }

  Future<void> updatePaper({
    required String paperId,
    required String courseId,
    String? subjectId,
    required String title,
    required int durationMinutes,
    required bool isFreePreview,
    bool isActive = true,
    bool shuffleQuestions = false,
    int defaultMarks = 3,
    int defaultNegativeMarks = 1,
    required List<String> instructions,
    required List<Question> questions,
    String? sourceFileUrl,
    String? sourceFileName,
  }) async {
    if (title.trim().isEmpty || questions.isEmpty) {
      return;
    }
    final preparedQuestions = await _prepareQuestionsForPersistence(questions);
    final paper = Paper(
      id: paperId,
      courseId: courseId,
      subjectId: subjectId,
      title: title,
      durationMinutes: durationMinutes,
      instructions: instructions,
      questions: preparedQuestions,
      isFreePreview: isFreePreview,
      isActive: isActive,
      shuffleQuestions: shuffleQuestions,
      defaultMarks: defaultMarks,
      defaultNegativeMarks: defaultNegativeMarks,
      sourceFileUrl:
          sourceFileUrl ??
          _papers
              .firstWhere((existing) => existing.id == paperId)
              .sourceFileUrl,
      sourceFileName:
          sourceFileName ??
          _papers
              .firstWhere((existing) => existing.id == paperId)
              .sourceFileName,
    );
    final saved = await repository.updatePaper(paper);
    _papers =
        _papers
            .map((existing) => existing.id == paperId ? saved : existing)
            .toList();
    notifyListeners();
  }

  Future<void> deletePaper(String paperId) async {
    await repository.deletePaper(paperId);
    _papers = _papers.where((paper) => paper.id != paperId).toList();
    _attempts =
        _attempts.where((attempt) => attempt.paperId != paperId).toList();
    _examSessions =
        _examSessions.where((session) => session.paperId != paperId).toList();
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
    final referredStudentIds =
        studentsForReferralCode(code).map((student) => student.id).toSet();
    return _purchases
        .where((purchase) => referredStudentIds.contains(purchase.studentId))
        .toList()
      ..sort((a, b) => b.purchasedAt.compareTo(a.purchasedAt));
  }

  int affiliatePaidStudents(String code) {
    final paidStudentIds =
        purchasesForReferralCode(
          code,
        ).map((purchase) => purchase.studentId).toSet();
    return paidStudentIds.length;
  }

  double affiliateRevenue(String code) {
    return purchasesForReferralCode(
      code,
    ).fold(0, (sum, purchase) => sum + purchase.amount);
  }

  Future<List<Question>> _prepareQuestionsForPersistence(
    List<Question> questions,
  ) async {
    final prepared = <Question>[];

    for (final question in questions) {
      final promptIsRich = RichContentCodec.isEncoded(question.prompt);
      final normalizedPrompt =
          promptIsRich
              ? question.prompt
              : MathContentParser.normalizeSourceText(question.prompt);
      final normalizedOptions = question.options
          .map(
            (option) =>
                RichContentCodec.isEncoded(option)
                    ? option
                    : MathContentParser.normalizeSourceText(option),
          )
          .toList(growable: false);

      final promptSegments =
          promptIsRich
              ? null
              : (question.promptSegments?.isNotEmpty == true
                  ? question.promptSegments
                  : MathContentParser.parse(normalizedPrompt));
      final optionSegments = normalizedOptions
          .asMap()
          .entries
          .map((entry) {
            final index = entry.key;
            final option = entry.value;
            if (RichContentCodec.isEncoded(option)) {
              return <MathContentSegment>[];
            }
            if (question.optionSegments != null &&
                index < question.optionSegments!.length &&
                question.optionSegments![index].isNotEmpty) {
              return question.optionSegments![index];
            }
            return MathContentParser.parse(option);
          })
          .toList(growable: false);

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
          attachments: question.attachments,
          optionAttachments: question.optionAttachments,
          difficulty: question.difficulty,
          marks: question.marks,
          negativeMarks: question.negativeMarks,
        ),
      );
    }

    return prepared;
  }

  List<Purchase> purchasesForStudent(String studentId) {
    return _purchases
        .where((purchase) => purchase.studentId == studentId)
        .toList();
  }

  List<ExamAttempt> attemptsForStudent(String studentId) {
    return _attempts
        .where((attempt) => attempt.studentId == studentId)
        .toList();
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
    authNotice = null;
    resetPhoneVerification();
    notifyListeners();
  }

  Future<ApiSession> _signInWithGoogle({required bool admin}) async {
    final googleClient = _googleSignInClient();
    try {
      await googleClient.signOut();
    } catch (_) {
      // Best effort only: some platforms may not have an active session yet.
    }

    final googleUser = await googleClient.signIn();
    if (googleUser == null) {
      throw StateError('Google sign-in was cancelled.');
    }

    final googleAuth = await googleUser.authentication;

    final idToken = googleAuth.idToken;
    if (idToken != null && idToken.isNotEmpty) {
      return authClient!.signInWithGoogle(idToken: idToken, admin: admin);
    }

    final accessToken = googleAuth.accessToken;
    if (accessToken != null && accessToken.isNotEmpty) {
      return authClient!.signInWithGoogleAccessToken(
        accessToken: accessToken,
        admin: admin,
      );
    }

    throw StateError('Google did not return a usable sign-in token.');
  }

  GoogleSignIn _googleSignInClient() {
    return _googleSignIn ??= GoogleSignIn(
      clientId:
          defaultTargetPlatform == TargetPlatform.iOS
              ? backendConfig.googleIosClientId
              : (kIsWeb ? backendConfig.googleWebClientId : null),
      // On Android, Google Sign-In expects the web/server OAuth client here
      // so it can mint an ID token for backend verification.
      serverClientId: kIsWeb ? null : backendConfig.googleWebClientId,
    );
  }

  String _formatGoogleSignInError(Object error) {
    if (error is StateError &&
        error.message == 'Google sign-in was cancelled.') {
      return 'Google sign-in was cancelled.';
    }
    if (error is PlatformException && error.code == 'sign_in_failed') {
      final details = '${error.message ?? ''} ${error.details ?? ''}';
      final normalized = details.toLowerCase();
      if (normalized.contains('apiexception: 10') ||
          normalized.contains(' 10:')) {
        return 'Google sign-in is not configured for this Android app build. '
            'Add package `com.meritlaunchers.student` with the correct SHA-1/SHA-256 signing key in Google Cloud or Firebase, then download the matching Android OAuth config.';
      }
      if (normalized.contains('network_error')) {
        return 'Google sign-in could not reach Google services. Please check the network and try again.';
      }
    }
    return 'Google sign-in failed. $error';
  }
}
