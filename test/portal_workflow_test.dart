import 'package:flutter_test/flutter_test.dart';
import 'package:merit_launchers/app/app_controller.dart';
import 'package:merit_launchers/app/backend_config.dart';
import 'package:merit_launchers/app/models.dart';
import 'package:shared_preferences/shared_preferences.dart';

BackendConfig _demoConfig() {
  return BackendConfig(
    environment: AppEnvironment.demo,
    apiBaseUrl: null,
    paymentMode: PaymentMode.mock,
    googleWebClientId: null,
    googleAndroidServerClientId: null,
    googleIosClientId: null,
  );
}

Question _qaQuestion({
  String id = 'qa-q1',
  String prompt = r'beginmatrix a & b \\ c & d endmatrix',
  List<String> options = const [
    r'\frac{1}{2}',
    r'\sqrt{x}',
    r'x^{2}',
    'None of these',
  ],
  List<QuestionAttachment> attachments = const [],
  List<List<QuestionAttachment>> optionAttachments = const [[], [], [], []],
}) {
  return Question(
    id: id,
    section: 'QA Section',
    prompt: prompt,
    options: options,
    correctIndex: 0,
    attachments: attachments,
    optionAttachments: optionAttachments,
  );
}

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();

  setUp(() {
    SharedPreferences.setMockInitialValues({});
  });

  group('Portal paper workflow', () {
    test('metadata-only papers are not treated as fully loaded', () async {
      final controller = await AppController.create(_demoConfig());
      const metadataOnly = Paper(
        id: 'metadata-paper',
        courseId: 'clat',
        title: 'Metadata paper',
        durationMinutes: 120,
        instructions: ['Read carefully'],
        questions: [],
        questionCount: 50,
      );

      expect(metadataOnly.displayQuestionCount, 50);
      expect(controller.paperHasLoadedQuestions(metadataOnly), isFalse);
    });

    test(
      'admin can add and update a paper without losing math segments or images',
      () async {
        final controller = await AppController.create(_demoConfig());
        const questionAttachment = QuestionAttachment(
          url: '/uploads/qa-question.png',
          mimeType: 'image/png',
          label: 'Question diagram',
        );
        const optionAttachment = QuestionAttachment(
          url: '/uploads/qa-option.png',
          mimeType: 'image/png',
          label: 'Option diagram',
        );

        await controller.addPaper(
          courseId: 'clat',
          subjectId: null,
          title: 'QA Parser Paper',
          durationMinutes: 45,
          isFreePreview: false,
          instructions: const ['Use all questions.'],
          questions: [
            _qaQuestion(
              attachments: const [questionAttachment],
              optionAttachments: const [
                [optionAttachment],
                [],
                [],
                [],
              ],
            ),
          ],
        );

        final saved = controller.papers.firstWhere(
          (paper) => paper.title == 'QA Parser Paper',
        );
        expect(saved.questions, hasLength(1));
        expect(
          saved.questions.single.prompt,
          r'\begin{matrix} a & b \\ c & d \end{matrix}',
        );
        expect(saved.questions.single.promptSegments?.single.isMath, isTrue);
        expect(saved.questions.single.optionSegments?[0].single.isMath, isTrue);
        expect(
          saved.questions.single.attachments.single.url,
          '/uploads/qa-question.png',
        );
        expect(
          saved.questions.single.optionAttachments.first.single.url,
          '/uploads/qa-option.png',
        );

        await controller.updatePaper(
          paperId: saved.id,
          courseId: saved.courseId,
          subjectId: saved.subjectId,
          title: 'QA Parser Paper Updated',
          durationMinutes: 60,
          isFreePreview: true,
          instructions: const ['Updated instruction.'],
          questions: [
            _qaQuestion(
              id: saved.questions.single.id,
              prompt: r'\begin{vmatrix} a & b \\ c & d \end{vmatrix}',
              options: const [
                r'\sin^{-1}x',
                r'\Delta',
                r'\sum_{i=1}^{n} i',
                'All of these',
              ],
              attachments: saved.questions.single.attachments,
              optionAttachments: saved.questions.single.optionAttachments,
            ),
          ],
        );

        final updated = controller.paperById(saved.id)!;
        expect(updated.title, 'QA Parser Paper Updated');
        expect(updated.isFreePreview, isTrue);
        expect(updated.questions.single.promptSegments?.single.isMath, isTrue);
        expect(
          updated.questions.single.optionSegments
              ?.take(3)
              .every((segments) => segments.any((segment) => segment.isMath)),
          isTrue,
        );
        expect(
          updated.questions.single.attachments.single.url,
          '/uploads/qa-question.png',
        );
        expect(
          updated.questions.single.optionAttachments.first.single.url,
          '/uploads/qa-option.png',
        );
      },
    );

    test(
      'subject create update delete keeps course state consistent',
      () async {
        final controller = await AppController.create(_demoConfig());
        final beforeCount = controller.subjectsForCourse('cuet').length;

        await controller.addSubject(
          courseId: 'cuet',
          title: 'QA Subject',
          description: 'Temporary test subject',
        );
        final created = controller
            .subjectsForCourse('cuet')
            .firstWhere((subject) => subject.title == 'QA Subject');
        expect(
          controller.subjectsForCourse('cuet'),
          hasLength(beforeCount + 1),
        );

        await controller.updateSubject(
          subjectId: created.id,
          courseId: 'cuet',
          title: 'QA Subject Updated',
          description: 'Updated test subject',
          sortOrder: 99,
        );
        final updated = controller.subjectById(created.id)!;
        expect(updated.title, 'QA Subject Updated');
        expect(updated.sortOrder, 99);

        await controller.deleteSubject(created.id);
        expect(controller.subjectById(created.id), isNull);
        expect(controller.subjectsForCourse('cuet'), hasLength(beforeCount));
      },
    );

    test(
      'student paper filtering respects free preview for subject-based courses',
      () async {
        final controller = await AppController.create(_demoConfig());
        await controller.addSubject(
          courseId: 'cuet',
          title: 'QA Access Subject',
          description: 'Temporary access test subject',
        );
        final subject = controller
            .subjectsForCourse('cuet')
            .firstWhere((item) => item.title == 'QA Access Subject');

        await controller.addPaper(
          courseId: 'cuet',
          subjectId: subject.id,
          title: 'QA Locked Subject Paper',
          durationMinutes: 30,
          isFreePreview: false,
          instructions: const ['Locked paper'],
          questions: [_qaQuestion(id: 'qa-locked')],
        );
        final locked = controller.papers.firstWhere(
          (paper) => paper.title == 'QA Locked Subject Paper',
        );
        expect(
          controller
              .accessiblePapersForSubject('cuet', subject.id)
              .map((paper) => paper.id),
          isNot(contains(locked.id)),
        );

        await controller.updatePaper(
          paperId: locked.id,
          courseId: locked.courseId,
          subjectId: locked.subjectId,
          title: locked.title,
          durationMinutes: locked.durationMinutes,
          isFreePreview: true,
          instructions: locked.instructions,
          questions: locked.questions,
        );
        expect(
          controller
              .accessiblePapersForSubject('cuet', subject.id)
              .map((paper) => paper.id),
          contains(locked.id),
        );
      },
    );

    test('purchase flows unlock course and subject papers correctly', () async {
      final controller = await AppController.create(_demoConfig());

      final clat = controller.courseById('clat')!;
      expect(controller.isCourseUnlocked(clat.id), isFalse);
      final clatPurchase = await controller.purchaseCourse(clat);
      expect(clatPurchase, isNotNull);
      expect(controller.isCourseUnlocked(clat.id), isTrue);
      expect(await controller.purchaseCourse(clat), isNull);

      final cuet = controller.courseById('cuet')!;
      await controller.addSubject(
        courseId: 'cuet',
        title: 'QA Purchase Subject',
        description: 'Temporary purchase test subject',
      );
      final subject = controller
          .subjectsForCourse('cuet')
          .firstWhere((item) => item.title == 'QA Purchase Subject');
      expect(cuet.purchaseMode, PurchaseMode.subject);
      expect(controller.isSubjectUnlocked('cuet', subject.id), isFalse);
      final subjectPurchase = await controller.purchaseSubject(cuet, subject);
      expect(subjectPurchase, isNotNull);
      expect(controller.isSubjectUnlocked('cuet', subject.id), isTrue);
      expect(await controller.purchaseSubject(cuet, subject), isNull);
    });

    test('exam session lifecycle scores, saves, submits, and clears state', () async {
      final controller = await AppController.create(_demoConfig());
      final paper = controller
          .papersForCourse('cuet')
          .firstWhere((item) => item.questions.length >= 2);

      final session = controller.startOrResumeExamSession(paper);
      expect(session.remainingSeconds, paper.durationMinutes * 60);
      expect(controller.startOrResumeExamSession(paper).id, session.id);

      final updatedSession = session.copyWith(
        answers: {paper.questions[0].id: paper.questions[0].correctIndex},
        currentQuestionIndex: 1,
        remainingSeconds: session.remainingSeconds - 30,
        updatedAt: DateTime.now(),
      );
      await controller.saveExamSession(updatedSession);
      expect(controller.sessionForPaper(paper.id)?.answers, updatedSession.answers);

      final attempt = await controller.submitAttempt(
        paper: paper,
        sessionId: session.id,
        answers: {
          paper.questions[0].id: paper.questions[0].correctIndex,
          paper.questions[1].id: (paper.questions[1].correctIndex + 1) %
              paper.questions[1].options.length,
        },
      );

      expect(attempt.score, paper.questions[0].marks - paper.questions[1].negativeMarks);
      expect(attempt.maxScore, paper.questions.fold<int>(0, (sum, q) => sum + q.marks));
      expect(controller.sessionForPaper(paper.id), isNull);
      expect(controller.attempts.map((item) => item.id), contains(attempt.id));
    });

    test('discarding an exam session removes it without creating an attempt', () async {
      final controller = await AppController.create(_demoConfig());
      final paper = controller.papersForCourse('clat').first;
      final session = controller.startOrResumeExamSession(paper);

      await controller.discardExamSession(session.id);

      expect(controller.sessionForPaper(paper.id), isNull);
      expect(controller.attempts.where((item) => item.paperId == paper.id), isEmpty);
    });

    test('support messages trim text and bind student/admin ownership', () async {
      final controller = await AppController.create(_demoConfig());
      final initialCount = controller.supportMessages.length;

      await controller.addSupportMessage(SenderRole.student, '   Need help   ');
      await controller.addSupportMessage(
        SenderRole.admin,
        'Reply from admin',
        studentId: controller.currentStudent.id,
      );
      await controller.addSupportMessage(SenderRole.student, '   ');

      final created = controller.supportMessages.skip(initialCount).toList();
      expect(created, hasLength(2));
      expect(created.first.message, 'Need help');
      expect(created.first.studentId, controller.currentStudent.id);
      expect(created.last.sender, SenderRole.admin);
      expect(created.last.studentId, controller.currentStudent.id);
    });

    test('student profile updates preserve referral normalization', () async {
      final controller = await AppController.create(_demoConfig());

      await controller.updateCurrentStudentProfile(
        name: 'QA Student',
        city: 'Patna',
        referralCode: ' campus-11 ',
      );

      expect(controller.currentStudent.name, 'QA Student');
      expect(controller.currentStudent.city, 'Patna');
      expect(controller.currentStudent.referralCode, 'CAMPUS-11');

      await controller.updateCurrentStudentProfile(
        name: 'QA Student Updated',
        city: 'Delhi',
        referralCode: '   ',
      );

      expect(controller.currentStudent.name, 'QA Student Updated');
      expect(controller.currentStudent.city, 'Delhi');
      expect(controller.currentStudent.referralCode, isNull);
    });

    test('admin affiliate and allowlist workflows mutate state safely', () async {
      final controller = await AppController.create(_demoConfig());
      final affiliateCount = controller.affiliates.length;

      await controller.addAffiliate(name: 'Campus Lead', code: 'campus 1', channel: 'College');
      await controller.addAffiliate(name: '', code: 'blank', channel: 'College');

      expect(controller.affiliates, hasLength(affiliateCount + 1));
      expect(controller.affiliates.first.code, 'CAMPUS 1');

      await controller.loadAdminAllowlist();
      expect(controller.allowlistEntries, isEmpty);
      await controller.addAdminAllowlistEntry(
        label: 'QA Admin',
        email: 'qa-admin@example.com',
      );
      expect(controller.allowlistEntries, hasLength(1));
      final entryId = controller.allowlistEntries.single.id;
      await controller.removeAdminAllowlistEntry(entryId);
      expect(controller.allowlistEntries, isEmpty);
    });

    test('course video updates preserve pricing and purchase mode metadata', () async {
      final controller = await AppController.create(_demoConfig());
      final before = controller.courseById('cuet')!;

      await controller.updateCourseVideo(
        courseId: before.id,
        videoUrl: 'https://video.example/cuet-intro',
      );

      final after = controller.courseById('cuet')!;
      expect(after.introVideoUrl, 'https://video.example/cuet-intro');
      expect(after.purchaseMode, before.purchaseMode);
      expect(after.gstRate, before.gstRate);
      expect(after.price, before.price);
    });

    test('deleting a subject cascades papers, sessions, and attempts locally', () async {
      final controller = await AppController.create(_demoConfig());
      await controller.addSubject(
        courseId: 'cuet',
        title: 'QA Cascade Subject',
        description: 'Cascade test subject',
      );
      final subject = controller
          .subjectsForCourse('cuet')
          .firstWhere((item) => item.title == 'QA Cascade Subject');
      await controller.addPaper(
        courseId: 'cuet',
        subjectId: subject.id,
        title: 'QA Cascade Paper',
        durationMinutes: 15,
        isFreePreview: true,
        instructions: const ['Cascade test'],
        questions: [_qaQuestion(id: 'qa-cascade')],
      );
      final paper = controller.papers.firstWhere((item) => item.title == 'QA Cascade Paper');
      final session = controller.startOrResumeExamSession(paper);
      final attempt = await controller.submitAttempt(
        paper: paper,
        answers: {paper.questions.single.id: paper.questions.single.correctIndex},
      );

      expect(controller.paperById(paper.id), isNotNull);
      expect(controller.sessionForPaper(paper.id)?.id, session.id);
      expect(controller.attempts.map((item) => item.id), contains(attempt.id));

      await controller.deleteSubject(subject.id);

      expect(controller.subjectById(subject.id), isNull);
      expect(controller.paperById(paper.id), isNull);
      expect(controller.sessionForPaper(paper.id), isNull);
      expect(controller.attempts.map((item) => item.id), isNot(contains(attempt.id)));
    });
  });
}
