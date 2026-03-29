import 'models.dart';

AppSeed buildAppSeed() {
  final student = StudentProfile(
    id: 'student-1',
    name: 'Aarav Sharma',
    contact: 'aarav.sharma@gmail.com',
    city: 'Delhi',
    joinedAt: DateTime(2026, 3, 1),
    referralCode: 'AFF-CAMPUS-11',
  );

  const courses = <Course>[
    Course(
      id: 'cuet',
      title: 'CUET',
      subtitle: 'General Test + domain-style sample papers',
      description:
          'Affordable full-length papers with realistic instructions, timed attempts, and result analytics.',
      price: 499,
      validityDays: 365,
      heroLabel: 'BESTSELLER',
      purchaseMode: PurchaseMode.subject,
      highlights: [
        '2 free papers',
        'Detailed scorecards',
        'Unlock one subject at a time',
      ],
    ),
    Course(
      id: 'clat',
      title: 'CLAT',
      subtitle: 'Mock tests for legal aptitude and reading sections',
      description:
          'Balanced coverage across legal reasoning, English, GK, logical reasoning, and quantitative techniques.',
      price: 499,
      validityDays: 365,
      heroLabel: 'TRENDING',
      highlights: [
        'One free full paper',
        'Section-wise analysis',
        'Exam-day UI with timer',
      ],
    ),
    Course(
      id: 'ctet',
      title: 'CTET',
      subtitle: 'Teacher eligibility sample papers',
      description:
          'Child pedagogy, language, mathematics, and EVS papers aligned for CTET practice.',
      price: 499,
      validityDays: 365,
      heroLabel: 'NEW',
      highlights: [
        'Friendly for first-time learners',
        'Instant result summary',
        'Receipt and payment log',
      ],
    ),
  ];

  const subjects = <Subject>[
    Subject(
      id: 'cuet-general-test',
      courseId: 'cuet',
      title: 'General Test',
      description: 'Language, reasoning, quantitative aptitude, and general awareness papers.',
      sortOrder: 0,
    ),
    Subject(
      id: 'clat-foundation',
      courseId: 'clat',
      title: 'Foundation',
      description: 'Legal reasoning, English, and quantitative techniques practice sets.',
      sortOrder: 0,
    ),
    Subject(
      id: 'ctet-paper-1',
      courseId: 'ctet',
      title: 'Paper 1 Subjects',
      description: 'Pedagogy, language, mathematics, and EVS-aligned papers.',
      sortOrder: 0,
    ),
  ];

  final papers = <Paper>[
    Paper(
      id: 'cuet-free-1',
      courseId: 'cuet',
      subjectId: 'cuet-general-test',
      title: 'CUET Free Paper 1',
      durationMinutes: 30,
      isFreePreview: true,
      instructions: const [
        'Read each question carefully before answering.',
        'Correct answer: +3, incorrect answer: -1.',
        'Do not close the exam while the timer is running.',
      ],
      questions: const [
        Question(
          id: 'q1',
          section: 'Quantitative Aptitude',
          prompt: r'\int_0^1 x^2 \, dx = ?',
          options: ['1/2', '1/3', '2/3', '1'],
          correctIndex: 1,
          explanation: 'Power rule gives x^3/3 from 0 to 1.',
        ),
        Question(
          id: 'q2',
          section: 'English',
          prompt: 'Choose the correctly spelled word.',
          options: ['Accomodation', 'Accommodation', 'Acommodation', 'Acomodation'],
          correctIndex: 1,
        ),
        Question(
          id: 'q3',
          section: 'General Knowledge',
          prompt: 'Which constitutional body conducts the CUET UG exam in India?',
          options: ['UGC', 'NTA', 'NCERT', 'CBSE'],
          correctIndex: 1,
        ),
        Question(
          id: 'q4',
          section: 'Logical Reasoning',
          prompt: 'If all launchers are mentors and some mentors are teachers, which conclusion is certain?',
          options: [
            'All teachers are launchers',
            'Some launchers are teachers',
            'All launchers are mentors',
            'No mentor is a teacher'
          ],
          correctIndex: 2,
        ),
      ],
    ),
    Paper(
      id: 'cuet-pro-1',
      courseId: 'cuet',
      subjectId: 'cuet-general-test',
      title: 'CUET Premium Paper 1',
      durationMinutes: 45,
      instructions: const [
        'Attempt every section within the allotted duration.',
        'Use the navigator to revisit answered questions.',
        'Submission happens automatically when the timer ends.',
      ],
      questions: const [
        Question(
          id: 'q5',
          section: 'Quantitative Aptitude',
          prompt: r'\lim_{x \to 0} \frac{\sin x}{x} = ?',
          options: ['0', '1', 'Infinity', 'Undefined'],
          correctIndex: 1,
        ),
        Question(
          id: 'q6',
          section: 'General Test',
          prompt: 'A student buys a course for Rs 499 with 18% GST included. Approximate base price?',
          options: ['423', '430', '460', '499'],
          correctIndex: 0,
        ),
        Question(
          id: 'q7',
          section: 'Language',
          prompt: 'Pick the sentence with the best grammar.',
          options: [
            'The faculty have gave the paper.',
            'The faculty has given the paper.',
            'The faculty is gave the paper.',
            'The faculty giving the paper.'
          ],
          correctIndex: 1,
        ),
        Question(
          id: 'q8',
          section: 'Reasoning',
          prompt: 'Series: 2, 6, 12, 20, 30, ?',
          options: ['40', '42', '44', '46'],
          correctIndex: 1,
        ),
      ],
    ),
    Paper(
      id: 'clat-free-1',
      courseId: 'clat',
      subjectId: 'clat-foundation',
      title: 'CLAT Free Paper',
      durationMinutes: 35,
      isFreePreview: true,
      instructions: const [
        'Focus on accuracy and time discipline.',
        'Use the timer strip at the top to track pace.',
      ],
      questions: const [
        Question(
          id: 'q9',
          section: 'Legal Reasoning',
          prompt: 'A contract made under coercion is generally:',
          options: ['Void', 'Voidable', 'Illegal', 'Unenforceable forever'],
          correctIndex: 1,
        ),
        Question(
          id: 'q10',
          section: 'English',
          prompt: 'Choose the best synonym of "prudent".',
          options: ['Careless', 'Wise', 'Harsh', 'Quick'],
          correctIndex: 1,
        ),
        Question(
          id: 'q11',
          section: 'Quantitative Techniques',
          prompt: r'\det \begin{bmatrix} 1 & 2 \\ 3 & 4 \end{bmatrix} = ?',
          options: ['-2', '2', '10', '7'],
          correctIndex: 0,
        ),
      ],
    ),
    Paper(
      id: 'ctet-free-1',
      courseId: 'ctet',
      subjectId: 'ctet-paper-1',
      title: 'CTET Free Paper',
      durationMinutes: 25,
      isFreePreview: true,
      instructions: const [
        'All questions are compulsory.',
        'The report includes section-wise performance.',
      ],
      questions: const [
        Question(
          id: 'q12',
          section: 'Pedagogy',
          prompt: 'Continuous and comprehensive evaluation mainly focuses on:',
          options: ['Punitive testing', 'Holistic assessment', 'Only final exams', 'Attendance'],
          correctIndex: 1,
        ),
        Question(
          id: 'q13',
          section: 'Mathematics',
          prompt: r'\frac{3}{4} + \frac{1}{8} = ?',
          options: ['7/8', '1', '5/6', '3/8'],
          correctIndex: 0,
        ),
      ],
    ),
  ];

  const affiliates = <Affiliate>[
    Affiliate(
      id: 'aff-1',
      name: 'North Campus Partner',
      code: 'AFF-CAMPUS-11',
      channel: 'Campus affiliate',
    ),
    Affiliate(
      id: 'aff-2',
      name: 'Instagram Legal Prep',
      code: 'CLAT-BOOST',
      channel: 'Instagram creator',
    ),
  ];

  final purchases = <Purchase>[
    Purchase(
      id: 'purchase-1',
      studentId: student.id,
      courseId: 'cuet',
      subjectId: 'cuet-general-test',
      amount: 588.82,
      purchasedAt: DateTime(2026, 3, 4, 10, 45),
      receiptNumber: 'ML-20260304-001',
      validUntil: DateTime(2027, 3, 4, 23, 59),
      paymentId: 'pay_demo_001',
      paymentOrderId: 'order_demo_001',
      verifiedAt: DateTime(2026, 3, 4, 10, 46),
    ),
  ];

  final attempts = <ExamAttempt>[
    ExamAttempt(
      id: 'attempt-1',
      studentId: student.id,
      courseId: 'cuet',
      paperId: 'cuet-free-1',
      answers: const {'q1': 1, 'q2': 1, 'q3': 0, 'q4': 2},
      sectionScores: const {
        'Quantitative Aptitude': 3,
        'English': 3,
        'General Knowledge': -1,
        'Logical Reasoning': 3,
      },
      score: 8,
      maxScore: 12,
      submittedAt: DateTime(2026, 3, 6, 18, 10),
    ),
  ];

  final examSessions = <ExamSession>[
    ExamSession(
      id: 'session-1',
      studentId: student.id,
      courseId: 'cuet',
      paperId: 'cuet-pro-1',
      answers: const {'q5': 1, 'q6': 0},
      remainingSeconds: 32 * 60,
      currentQuestionIndex: 2,
      startedAt: DateTime(2026, 3, 7, 18, 0),
      updatedAt: DateTime(2026, 3, 7, 18, 13),
    ),
  ];

  final supportMessages = <SupportMessage>[
    SupportMessage(
      id: 'msg-1',
      sender: SenderRole.admin,
      message: 'Welcome to Merit Launchers. Reach out here for payment or course access help.',
      sentAt: DateTime(2026, 3, 6, 9),
      studentId: student.id,
    ),
    SupportMessage(
      id: 'msg-2',
      sender: SenderRole.student,
      message: 'I received my CUET purchase. Where do I find the premium paper?',
      sentAt: DateTime(2026, 3, 6, 9, 30),
      studentId: student.id,
    ),
    SupportMessage(
      id: 'msg-3',
      sender: SenderRole.admin,
      message: 'It is already unlocked on your home screen. Open CUET and you will see Premium Paper 1.',
      sentAt: DateTime(2026, 3, 6, 9, 40),
      studentId: student.id,
    ),
  ];

  return AppSeed(
    courses: courses,
    subjects: subjects,
    papers: papers,
    affiliates: affiliates,
    currentStudent: student,
    students: [student],
    purchases: purchases,
    attempts: attempts,
    examSessions: examSessions,
    supportMessages: supportMessages,
  );
}
