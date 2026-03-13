import 'dart:async';

import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'package:pdf/widgets.dart' as pw;
import 'package:printing/printing.dart';
import 'package:video_player/video_player.dart';

import '../../app/app.dart';
import '../../app/models.dart';
import '../../app/payments/payment_gateway.dart';
import '../../app/payments/payment_models.dart';
import '../../app/theme.dart';
import '../../widgets/rich_math_content.dart';

class StudentShell extends StatefulWidget {
  const StudentShell({super.key});

  @override
  State<StudentShell> createState() => _StudentShellState();
}

class _StudentShellState extends State<StudentShell> with WidgetsBindingObserver {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addObserver(this);
  }

  @override
  void dispose() {
    WidgetsBinding.instance.removeObserver(this);
    super.dispose();
  }

  @override
  void didChangeAppLifecycleState(AppLifecycleState state) {
    if (state == AppLifecycleState.resumed && mounted) {
      AppScope.of(context).refreshContent();
    }
  }

  @override
  Widget build(BuildContext context) {
    final controller = AppScope.of(context);
    final pages = [
      const StudentHomePage(),
      const StudentLibraryPage(),
      const StudentProfilePage(),
      const StudentSupportPage(),
    ];

    return Scaffold(
      appBar: AppBar(
        titleSpacing: 16,
        title: Row(
          children: [
            Image.asset('assets/branding/logo.png', width: 30, height: 30),
            const SizedBox(width: 10),
            const Text('Merit Launchers'),
          ],
        ),
        actions: [
          IconButton(
            onPressed: controller.logout,
            icon: const Icon(Icons.logout_rounded),
          ),
        ],
      ),
      body: IndexedStack(
        index: controller.studentTabIndex,
        children: pages,
      ),
      bottomNavigationBar: NavigationBar(
        selectedIndex: controller.studentTabIndex,
        onDestinationSelected: controller.setStudentTab,
        destinations: const [
          NavigationDestination(icon: Icon(Icons.home_outlined), label: 'Home'),
          NavigationDestination(icon: Icon(Icons.library_books_outlined), label: 'Library'),
          NavigationDestination(icon: Icon(Icons.person_outline), label: 'Profile'),
          NavigationDestination(icon: Icon(Icons.support_agent_outlined), label: 'Support'),
        ],
      ),
    );
  }
}

class StudentHomePage extends StatelessWidget {
  const StudentHomePage({super.key});

  @override
  Widget build(BuildContext context) {
    final controller = AppScope.of(context);
    final theme = Theme.of(context);

    return RefreshIndicator(
      onRefresh: controller.refreshContent,
      child: ListView(
        padding: const EdgeInsets.fromLTRB(16, 8, 16, 120),
        children: [
        Container(
          padding: const EdgeInsets.all(20),
          decoration: BoxDecoration(
            color: MeritTheme.secondary,
            borderRadius: BorderRadius.circular(28),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                'Exam dashboard',
                style: theme.textTheme.labelLarge?.copyWith(
                  color: const Color(0xFFBADAE8),
                ),
              ),
              const SizedBox(height: 8),
              Text(
                'Welcome back, ${controller.currentStudent.name.split(' ').first}',
                style: theme.textTheme.headlineSmall?.copyWith(color: Colors.white),
              ),
              const SizedBox(height: 8),
              const Text(
                'Continue with your latest papers, unlock full packs, and keep your exam history organized.',
                style: TextStyle(color: Colors.white70, height: 1.45),
              ),
              const SizedBox(height: 18),
              _DashboardStat(
                label: 'Purchased courses',
                value: controller.purchases.length.toString(),
              ),
              const SizedBox(height: 10),
              _DashboardStat(
                label: 'Attempts recorded',
                value: controller.attempts.length.toString(),
              ),
            ],
          ),
        ),
        const SizedBox(height: 24),
        Text('Courses', style: theme.textTheme.titleLarge),
        const SizedBox(height: 8),
        Text(
          'Free preview papers are available immediately. Paid packs unlock after successful payment.',
          style: theme.textTheme.bodyMedium,
        ),
        const SizedBox(height: 14),
        ...controller.courses.map(
          (course) => Padding(
            padding: const EdgeInsets.only(bottom: 14),
            child: CourseCard(course: course),
          ),
        ),
        ],
      ),
    );
  }
}

class CourseCard extends StatelessWidget {
  const CourseCard({super.key, required this.course});

  final Course course;

  @override
  Widget build(BuildContext context) {
    final controller = AppScope.of(context);
    final unlocked = controller.isCourseUnlocked(course.id);
    final papers = controller.papersForCourse(course.id);

    return Card(
      child: Padding(
        padding: const EdgeInsets.all(18),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 7),
                  decoration: BoxDecoration(
                    color: MeritTheme.primarySoft,
                    borderRadius: BorderRadius.circular(999),
                  ),
                  child: Text(course.heroLabel),
                ),
                const Spacer(),
                Icon(
                  unlocked ? Icons.lock_open_rounded : Icons.lock_outline_rounded,
                  color: unlocked ? MeritTheme.success : MeritTheme.secondaryMuted,
                  size: 20,
                ),
              ],
            ),
            const SizedBox(height: 14),
            Text(course.title, style: Theme.of(context).textTheme.titleLarge),
            const SizedBox(height: 6),
            Text(course.subtitle, style: Theme.of(context).textTheme.bodyMedium),
            const SizedBox(height: 12),
            Text(course.description),
            const SizedBox(height: 16),
            Wrap(
              spacing: 8,
              runSpacing: 8,
              children: [
                _MetaChip(label: '${papers.length} papers'),
                _MetaChip(label: '${course.validityDays} days'),
                _MetaChip(label: unlocked ? 'Unlocked' : 'Locked'),
              ],
            ),
            const SizedBox(height: 16),
            Text(
              'Rs ${course.price.toStringAsFixed(0)}',
              style: Theme.of(context).textTheme.titleLarge,
            ),
            const SizedBox(height: 12),
            SizedBox(
              width: double.infinity,
              child: ElevatedButton(
                onPressed: () {
                  Navigator.of(context).push(
                    MaterialPageRoute<void>(
                      builder: (_) => CourseDetailsPage(course: course),
                    ),
                  );
                },
                child: Text(unlocked ? 'Open course' : 'View course'),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class CourseDetailsPage extends StatelessWidget {
  const CourseDetailsPage({super.key, required this.course});

  final Course course;

  Future<void> _startPayment(BuildContext context) async {
    final controller = AppScope.of(context);
    final backend = AppScope.backendOf(context);
    final messenger = ScaffoldMessenger.of(context);

    messenger.showSnackBar(
      const SnackBar(content: Text('Creating order and opening checkout...')),
    );

    final result = await PaymentGateway(backend).payForCourse(
      course: course,
      student: controller.currentStudent,
    );

    if (!context.mounted) {
      return;
    }

    switch (result.status) {
      case PaymentResultStatus.success:
        await controller.purchaseCourse(
          course,
          paymentId: result.paymentId,
          paymentOrderId: result.orderId,
          paymentSignature: result.signature,
          verifiedPurchase: result.purchase,
        );
        messenger.showSnackBar(
          SnackBar(
            content: Text(
              '${course.title} unlocked. Payment ${result.paymentId ?? ''} verified successfully.',
            ),
          ),
        );
      case PaymentResultStatus.cancelled:
      case PaymentResultStatus.unsupported:
      case PaymentResultStatus.failed:
        messenger.showSnackBar(
          SnackBar(content: Text(result.message ?? 'Unable to complete payment.')),
        );
    }
  }

  @override
  Widget build(BuildContext context) {
    final controller = AppScope.of(context);
    final unlocked = controller.isCourseUnlocked(course.id);
    final visiblePapers = controller.accessiblePapersForCourse(course.id);

    return Scaffold(
      appBar: AppBar(title: Text(course.title)),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          Card(
            child: Padding(
              padding: const EdgeInsets.all(20),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(course.title, style: Theme.of(context).textTheme.headlineSmall),
                  const SizedBox(height: 10),
                  Text(course.description),
                  const SizedBox(height: 16),
                  Wrap(
                    spacing: 8,
                    runSpacing: 8,
                    children: course.highlights
                        .map((highlight) => _MetaChip(label: highlight))
                        .toList(),
                  ),
                  const SizedBox(height: 18),
                  if (course.introVideoUrl != null && course.introVideoUrl!.trim().isNotEmpty) ...[
                    Text('Intro video', style: Theme.of(context).textTheme.titleMedium),
                    const SizedBox(height: 8),
                    CourseVideoCard(videoUrl: course.introVideoUrl),
                    const SizedBox(height: 18),
                  ],
                  if (!unlocked)
                    SizedBox(
                      width: double.infinity,
                      child: ElevatedButton(
                        onPressed: () => _startPayment(context),
                        child: Text('Buy now for Rs ${course.price.toStringAsFixed(0)}'),
                      ),
                    ),
                ],
              ),
            ),
          ),
          const SizedBox(height: 18),
          Text('Papers', style: Theme.of(context).textTheme.titleLarge),
          const SizedBox(height: 12),
          ...visiblePapers.map(
            (paper) => Card(
              child: ListTile(
                contentPadding: const EdgeInsets.symmetric(horizontal: 18, vertical: 12),
                title: Text(paper.title),
                subtitle: Text(
                  '${paper.durationMinutes} minutes - ${paper.questions.length} questions'
                  '${paper.isFreePreview ? ' - Free preview' : ''}',
                ),
                trailing: const Icon(Icons.chevron_right),
                onTap: () {
                  Navigator.of(context).push(
                    MaterialPageRoute<void>(
                      builder: (_) => ExamIntroPage(course: course, paper: paper),
                    ),
                  );
                },
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class ExamIntroPage extends StatelessWidget {
  const ExamIntroPage({super.key, required this.course, required this.paper});

  final Course course;
  final Paper paper;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: Text(paper.title)),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          Card(
            child: Padding(
              padding: const EdgeInsets.all(20),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    '${course.title} - ${paper.title}',
                    style: Theme.of(context).textTheme.headlineSmall,
                  ),
                  const SizedBox(height: 14),
                  Text('Duration: ${paper.durationMinutes} minutes'),
                  const SizedBox(height: 10),
                  const Text('Marking: +3 for correct answers, -1 for incorrect answers'),
                  const SizedBox(height: 18),
                  ...paper.instructions.map(
                    (instruction) => Padding(
                      padding: const EdgeInsets.only(bottom: 8),
                      child: Row(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          const Padding(
                            padding: EdgeInsets.only(top: 2),
                            child: Icon(Icons.circle, size: 8, color: MeritTheme.secondary),
                          ),
                          const SizedBox(width: 10),
                          Expanded(child: Text(instruction)),
                        ],
                      ),
                    ),
                  ),
                  const SizedBox(height: 22),
                  SizedBox(
                    width: double.infinity,
                    child: ElevatedButton(
                      onPressed: () {
                        Navigator.of(context).push(
                          MaterialPageRoute<void>(
                            builder: (_) => ExamPlayerPage(course: course, paper: paper),
                          ),
                        );
                      },
                      child: const Text('Start exam'),
                    ),
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class ExamPlayerPage extends StatefulWidget {
  const ExamPlayerPage({super.key, required this.course, required this.paper});

  final Course course;
  final Paper paper;

  @override
  State<ExamPlayerPage> createState() => _ExamPlayerPageState();
}

class _ExamPlayerPageState extends State<ExamPlayerPage> {
  late int _remainingSeconds;
  late Timer _timer;
  final Map<String, int> _answers = {};
  int _currentIndex = 0;
  bool _submitted = false;
  bool _submitting = false;

  @override
  void initState() {
    super.initState();
    _remainingSeconds = widget.paper.durationMinutes * 60;
    _timer = Timer.periodic(const Duration(seconds: 1), (timer) {
      if (_remainingSeconds == 0) {
        _submit();
      } else {
        setState(() {
          _remainingSeconds--;
        });
      }
    });
  }

  @override
  void dispose() {
    _timer.cancel();
    super.dispose();
  }

  Future<bool> _confirmExit() async {
    if (_submitted) {
      return true;
    }
    return await showDialog<bool>(
          context: context,
          builder: (context) => AlertDialog(
            title: const Text('Exit ongoing exam?'),
            content: const Text(
              'The timer is running. If you leave now, this attempt will be lost.',
            ),
            actions: [
              TextButton(
                onPressed: () => Navigator.pop(context, false),
                child: const Text('Stay'),
              ),
              ElevatedButton(
                onPressed: () => Navigator.pop(context, true),
                child: const Text('Exit'),
              ),
            ],
          ),
        ) ??
        false;
  }

  Future<void> _submit() async {
    if (_submitted || _submitting) {
      return;
    }
    setState(() {
      _submitting = true;
    });
    _timer.cancel();
    try {
      final controller = AppScope.of(context);
      final attempt = await controller.submitAttempt(
        paper: widget.paper,
        answers: Map.of(_answers),
      );
      if (!mounted) {
        return;
      }

      setState(() {
        _submitted = true;
        _submitting = false;
      });

      await showDialog<void>(
        context: context,
        barrierDismissible: false,
        builder: (context) => ResultDialog(
          attempt: attempt,
          paper: widget.paper,
          course: widget.course,
          student: controller.currentStudent,
        ),
      );
    } catch (error) {
      if (!mounted) {
        return;
      }
      setState(() {
        _submitting = false;
      });
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Failed to submit exam: $error')),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    final question = widget.paper.questions[_currentIndex];
    final progress = (_currentIndex + 1) / widget.paper.questions.length;
    final time = Duration(seconds: _remainingSeconds);

    return PopScope(
      canPop: false,
      onPopInvokedWithResult: (didPop, result) async {
        final shouldExit = !didPop && await _confirmExit();
        if (!context.mounted) {
          return;
        }
        if (shouldExit) {
          Navigator.of(context).pop();
        }
      },
      child: Scaffold(
        appBar: AppBar(
          title: Text(widget.paper.title),
          leading: IconButton(
            onPressed: () async {
              final shouldExit = await _confirmExit();
              if (!context.mounted) {
                return;
              }
              if (shouldExit) {
                Navigator.of(context).pop();
              }
            },
            icon: const Icon(Icons.close),
          ),
          actions: [
            Padding(
              padding: const EdgeInsets.only(right: 16),
              child: Center(
                child: Text(
                  '${time.inHours.toString().padLeft(2, '0')}:'
                  '${(time.inMinutes % 60).toString().padLeft(2, '0')}:'
                  '${(time.inSeconds % 60).toString().padLeft(2, '0')}',
                ),
              ),
            ),
          ],
          bottom: PreferredSize(
            preferredSize: const Size.fromHeight(8),
            child: LinearProgressIndicator(value: progress),
          ),
        ),
        body: Padding(
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text('Question ${_currentIndex + 1} of ${widget.paper.questions.length}'),
              const SizedBox(height: 8),
              Align(
                alignment: Alignment.centerLeft,
                child: _MetaChip(label: question.section),
              ),
              const SizedBox(height: 16),
              Expanded(
                child: ListView(
                  children: [
                    Card(
                      child: Padding(
                        padding: const EdgeInsets.all(20),
                        child: RichMathContentView(
                          rawText: question.prompt,
                          segments: question.promptSegments,
                        ),
                      ),
                    ),
                    const SizedBox(height: 12),
                    ...List.generate(question.options.length, (index) {
                      final selected = _answers[question.id] == index;
                      return Padding(
                        padding: const EdgeInsets.only(bottom: 12),
                        child: InkWell(
                          borderRadius: BorderRadius.circular(20),
                          onTap: () {
                            setState(() {
                              _answers[question.id] = index;
                            });
                          },
                          child: Container(
                            padding: const EdgeInsets.all(16),
                            decoration: BoxDecoration(
                              color: selected ? MeritTheme.primarySoft : Colors.white,
                              borderRadius: BorderRadius.circular(20),
                              border: Border.all(
                                color: selected ? MeritTheme.primary : MeritTheme.border,
                              ),
                            ),
                            child: Row(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                CircleAvatar(
                                  radius: 18,
                                  backgroundColor: selected
                                      ? MeritTheme.secondary
                                      : MeritTheme.primarySoft,
                                  foregroundColor: selected
                                      ? Colors.white
                                      : MeritTheme.secondary,
                                  child: Text(String.fromCharCode(65 + index)),
                                ),
                                const SizedBox(width: 14),
                                Expanded(
                                  child: RichMathContentView(
                                    rawText: question.options[index],
                                    segments: question.optionSegments?[index],
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ),
                      );
                    }),
                  ],
                ),
              ),
              SafeArea(
                top: false,
                child: Padding(
                  padding: const EdgeInsets.only(top: 8),
                  child: Row(
                    children: [
                      Expanded(
                        child: OutlinedButton(
                          onPressed: _currentIndex == 0
                              ? null
                              : () => setState(() => _currentIndex--),
                          child: const Text('Previous'),
                        ),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: ElevatedButton(
                          onPressed: _submitting
                              ? null
                              : _currentIndex == widget.paper.questions.length - 1
                                  ? _submit
                                  : () => setState(() => _currentIndex++),
                          child: Text(
                            _submitting
                                ? 'Submitting...'
                                : _currentIndex == widget.paper.questions.length - 1
                                    ? 'Submit exam'
                                    : 'Next',
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class ResultDialog extends StatelessWidget {
  const ResultDialog({
    super.key,
    required this.attempt,
    required this.paper,
    required this.course,
    required this.student,
  });

  final ExamAttempt attempt;
  final Paper paper;
  final Course course;
  final StudentProfile student;

  Future<void> _printReport() async {
    final document = pw.Document();
    document.addPage(
      pw.Page(
        build: (context) {
          return pw.Padding(
            padding: const pw.EdgeInsets.all(24),
            child: pw.Column(
              crossAxisAlignment: pw.CrossAxisAlignment.start,
              children: [
                pw.Text(
                  'Merit Launchers',
                  style: pw.TextStyle(fontSize: 24, fontWeight: pw.FontWeight.bold),
                ),
                pw.SizedBox(height: 8),
                pw.Text('${course.title} - ${paper.title}'),
                pw.SizedBox(height: 8),
                pw.Text('Score: ${attempt.score} / ${attempt.maxScore}'),
                pw.Text(
                  'Submitted: ${DateFormat('dd MMM yyyy, hh:mm a').format(attempt.submittedAt)}',
                ),
                pw.Text('Student: ${student.name}'),
                pw.SizedBox(height: 16),
                pw.Text(
                  'Section scores',
                  style: pw.TextStyle(fontWeight: pw.FontWeight.bold),
                ),
                pw.SizedBox(height: 8),
                ...attempt.sectionScores.entries.map(
                  (entry) => pw.Text('${entry.key}: ${entry.value}'),
                ),
              ],
            ),
          );
        },
      ),
    );

    await Printing.layoutPdf(onLayout: (format) => document.save());
  }

  @override
  Widget build(BuildContext context) {
    final percentage = attempt.maxScore == 0
        ? 0.0
        : (attempt.score / attempt.maxScore).clamp(0.0, 1.0).toDouble();
    final attemptedCount = attempt.answers.length;
    final correctAnswers = attempt.answers.entries.where((entry) {
      final question = paper.questions.firstWhere(
        (question) => question.id == entry.key,
        orElse: () => paper.questions.first,
      );
      return entry.value == question.correctIndex;
    }).length;

    return AlertDialog(
      title: const Text('Exam submitted'),
      content: SizedBox(
        width: 420,
        child: SingleChildScrollView(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Container(
                width: double.infinity,
                padding: const EdgeInsets.all(18),
                decoration: BoxDecoration(
                  color: MeritTheme.primarySoft,
                  borderRadius: BorderRadius.circular(20),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text('${course.title} - ${paper.title}'),
                    const SizedBox(height: 10),
                    Text(
                      '${attempt.score} / ${attempt.maxScore}',
                      style: Theme.of(context).textTheme.displaySmall,
                    ),
                    const SizedBox(height: 10),
                    ClipRRect(
                      borderRadius: BorderRadius.circular(999),
                      child: LinearProgressIndicator(
                        value: percentage,
                        minHeight: 10,
                        backgroundColor: Colors.white,
                        color: MeritTheme.secondary,
                      ),
                    ),
                    const SizedBox(height: 10),
                    Text('${(percentage * 100).round()}% overall score'),
                  ],
                ),
              ),
              const SizedBox(height: 16),
              Row(
                children: [
                  Expanded(
                    child: _ResultStatCard(
                      label: 'Attempted',
                      value: '$attemptedCount/${paper.questions.length}',
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: _ResultStatCard(
                      label: 'Correct',
                      value: '$correctAnswers',
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 16),
              Text('Section performance', style: Theme.of(context).textTheme.titleMedium),
              const SizedBox(height: 10),
              ...attempt.sectionScores.entries.map(
                (entry) => Padding(
                  padding: const EdgeInsets.only(bottom: 12),
                  child: _SectionScoreTile(
                    label: entry.key,
                    value: entry.value,
                    maxValue: paper.questions
                        .where((question) => question.section == entry.key)
                        .fold<int>(0, (sum, question) => sum + question.marks),
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
      actions: [
        TextButton(
          onPressed: _printReport,
          child: const Text('Download PDF'),
        ),
        ElevatedButton(
          onPressed: () {
            Navigator.of(context).pop();
            Navigator.of(context).pop();
            Navigator.of(context).pop();
          },
          child: const Text('Back to course'),
        ),
      ],
    );
  }
}

class StudentLibraryPage extends StatelessWidget {
  const StudentLibraryPage({super.key});

  @override
  Widget build(BuildContext context) {
    final controller = AppScope.of(context);
    final purchases = controller.purchasesForStudent(controller.currentStudent.id);
    final attempts = controller.attemptsForStudent(controller.currentStudent.id);

    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        Text('Purchased courses', style: Theme.of(context).textTheme.titleLarge),
        const SizedBox(height: 12),
        ...purchases.map((purchase) {
          final course = controller.courseById(purchase.courseId)!;
          return Card(
            child: ListTile(
              title: Text(course.title),
              subtitle: Text(
                'Purchased ${DateFormat('dd MMM yyyy').format(purchase.purchasedAt)} - Receipt ${purchase.receiptNumber}',
              ),
              trailing: const Icon(Icons.receipt_long_outlined),
              onTap: () {
                Navigator.of(context).push(
                  MaterialPageRoute<void>(
                    builder: (_) => ReceiptPage(
                      purchase: purchase,
                      course: course,
                      student: controller.currentStudent,
                    ),
                  ),
                );
              },
            ),
          );
        }),
        const SizedBox(height: 24),
        Text('Recent attempts', style: Theme.of(context).textTheme.titleLarge),
        const SizedBox(height: 12),
        ...attempts.map((attempt) {
          final paper = controller.paperById(attempt.paperId)!;
          return Card(
            child: ListTile(
              title: Text(paper.title),
              subtitle: Text(
                '${attempt.score}/${attempt.maxScore} - ${DateFormat('dd MMM yyyy, hh:mm a').format(attempt.submittedAt)}',
              ),
            ),
          );
        }),
      ],
    );
  }
}

class StudentProfilePage extends StatelessWidget {
  const StudentProfilePage({super.key});

  @override
  Widget build(BuildContext context) {
    final controller = AppScope.of(context);
    final student = controller.currentStudent;
    final attempts = controller.attemptsForStudent(student.id);

    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        Card(
          child: Padding(
            padding: const EdgeInsets.all(20),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(student.name, style: Theme.of(context).textTheme.headlineSmall),
                const SizedBox(height: 12),
                Text(student.contact),
                const SizedBox(height: 8),
                Text('City: ${student.city}'),
                const SizedBox(height: 8),
                Text('Referral code used: ${student.referralCode ?? 'Not provided'}'),
              ],
            ),
          ),
        ),
        const SizedBox(height: 16),
        Text('Attempt history', style: Theme.of(context).textTheme.titleLarge),
        const SizedBox(height: 12),
        ...attempts.map((attempt) {
          final paper = controller.paperById(attempt.paperId);
          final course = paper == null ? null : controller.courseById(paper.courseId);
          return Card(
            child: ListTile(
              title: Text(paper?.title ?? 'Paper ${attempt.paperId}'),
              subtitle: Text(
                '${course?.title ?? 'Course'} - ${attempt.score}/${attempt.maxScore} - ${DateFormat('dd MMM yyyy, hh:mm a').format(attempt.submittedAt)}',
              ),
            ),
          );
        }),
        const SizedBox(height: 16),
        Text('Payment history', style: Theme.of(context).textTheme.titleLarge),
        const SizedBox(height: 12),
        ...controller.purchasesForStudent(student.id).map((purchase) {
          final course = controller.courseById(purchase.courseId)!;
          return Card(
            child: ListTile(
              title: Text('${course.title} - Rs ${purchase.amount.toStringAsFixed(0)}'),
              subtitle: Text(
                purchase.paymentId == null
                    ? 'Receipt ${purchase.receiptNumber}'
                    : 'Receipt ${purchase.receiptNumber} - ${purchase.paymentId}',
              ),
              trailing: Text(DateFormat('dd MMM').format(purchase.purchasedAt)),
              onTap: () {
                Navigator.of(context).push(
                  MaterialPageRoute<void>(
                    builder: (_) => ReceiptPage(
                      purchase: purchase,
                      course: course,
                      student: student,
                    ),
                  ),
                );
              },
            ),
          );
        }),
      ],
    );
  }
}

class StudentSupportPage extends StatefulWidget {
  const StudentSupportPage({super.key});

  @override
  State<StudentSupportPage> createState() => _StudentSupportPageState();
}

class _StudentSupportPageState extends State<StudentSupportPage> {
  final _controller = TextEditingController();

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final app = AppScope.of(context);
    return Column(
      children: [
        Container(
          margin: const EdgeInsets.all(16),
          padding: const EdgeInsets.all(18),
          decoration: BoxDecoration(
            color: MeritTheme.primarySoft,
            borderRadius: BorderRadius.circular(24),
          ),
          child: const Row(
            children: [
              Icon(Icons.mail_outline),
              SizedBox(width: 12),
              Expanded(child: Text('Support email: info@meritlaunchers.com')),
            ],
          ),
        ),
        Expanded(
          child: ListView(
            padding: const EdgeInsets.symmetric(horizontal: 16),
            children: app.supportMessages.map((message) {
              final isStudent = message.sender == SenderRole.student;
              return Align(
                alignment: isStudent ? Alignment.centerRight : Alignment.centerLeft,
                child: Container(
                  margin: const EdgeInsets.only(bottom: 12),
                  padding: const EdgeInsets.all(16),
                  constraints: const BoxConstraints(maxWidth: 420),
                  decoration: BoxDecoration(
                    color: isStudent ? MeritTheme.secondary : Colors.white,
                    borderRadius: BorderRadius.circular(20),
                    border: Border.all(color: MeritTheme.border),
                  ),
                  child: Text(
                    message.message,
                    style: TextStyle(color: isStudent ? Colors.white : MeritTheme.secondary),
                  ),
                ),
              );
            }).toList(),
          ),
        ),
        SafeArea(
          top: false,
          child: Padding(
            padding: const EdgeInsets.all(16),
            child: Row(
              children: [
                Expanded(
                  child: TextField(
                    controller: _controller,
                    decoration: const InputDecoration(
                      hintText: 'Ask about access, payments, or exam issues',
                    ),
                  ),
                ),
                const SizedBox(width: 12),
                ElevatedButton(
                  onPressed: () async {
                    await app.addSupportMessage(SenderRole.student, _controller.text);
                    _controller.clear();
                  },
                  child: const Text('Send'),
                ),
              ],
            ),
          ),
        ),
      ],
    );
  }
}

class ReceiptPage extends StatelessWidget {
  const ReceiptPage({
    super.key,
    required this.purchase,
    required this.course,
    required this.student,
  });

  final Purchase purchase;
  final Course course;
  final StudentProfile student;

  Future<void> _downloadReceipt() async {
    final document = _buildReceiptDocument(
      purchase: purchase,
      course: course,
      student: student,
    );

    await Printing.layoutPdf(onLayout: (format) => document.save());
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Receipt')),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          Card(
            child: Padding(
              padding: const EdgeInsets.all(20),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              'Merit Launchers',
                              style: Theme.of(context).textTheme.headlineSmall,
                            ),
                            const SizedBox(height: 6),
                            Text(
                              'Course access invoice',
                              style: Theme.of(context).textTheme.bodyMedium,
                            ),
                          ],
                        ),
                      ),
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                        decoration: BoxDecoration(
                          color: MeritTheme.primarySoft,
                          borderRadius: BorderRadius.circular(999),
                        ),
                        child: Text(
                          purchase.paymentId == null ? 'DEMO' : 'PAID',
                          style: Theme.of(context).textTheme.labelLarge,
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 20),
                  Container(
                    width: double.infinity,
                    padding: const EdgeInsets.all(16),
                    decoration: BoxDecoration(
                      color: MeritTheme.primarySoft,
                      borderRadius: BorderRadius.circular(18),
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text('Receipt number', style: Theme.of(context).textTheme.labelLarge),
                        const SizedBox(height: 4),
                        Text(purchase.receiptNumber),
                        const SizedBox(height: 14),
                        Text('Course', style: Theme.of(context).textTheme.labelLarge),
                        const SizedBox(height: 4),
                        Text(course.title),
                        const SizedBox(height: 14),
                        Text('Amount paid', style: Theme.of(context).textTheme.labelLarge),
                        const SizedBox(height: 4),
                        Text(
                          'Rs ${purchase.amount.toStringAsFixed(0)}',
                          style: Theme.of(context).textTheme.titleLarge,
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 20),
                  _ReceiptRow(label: 'Student', value: student.name),
                  _ReceiptRow(label: 'Contact', value: student.contact),
                  _ReceiptRow(
                    label: 'Purchased on',
                    value: DateFormat('dd MMM yyyy, hh:mm a').format(purchase.purchasedAt),
                  ),
                  _ReceiptRow(
                    label: 'Validity',
                    value: purchase.validUntil == null
                        ? '1 year from purchase'
                        : DateFormat('dd MMM yyyy').format(purchase.validUntil!),
                  ),
                  _ReceiptRow(
                    label: 'Payment provider',
                    value: purchase.paymentProvider,
                  ),
                  _ReceiptRow(
                    label: 'Payment ID',
                    value: purchase.paymentId ?? 'Demo payment',
                  ),
                  _ReceiptRow(
                    label: 'Order ID',
                    value: purchase.paymentOrderId ?? 'Demo order',
                  ),
                  const SizedBox(height: 20),
                  SizedBox(
                    width: double.infinity,
                    child: ElevatedButton.icon(
                      onPressed: _downloadReceipt,
                      icon: const Icon(Icons.download_rounded),
                      label: const Text('Download PDF receipt'),
                    ),
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class CourseVideoCard extends StatefulWidget {
  const CourseVideoCard({super.key, required this.videoUrl});

  final String? videoUrl;

  @override
  State<CourseVideoCard> createState() => _CourseVideoCardState();
}

class _CourseVideoCardState extends State<CourseVideoCard> {
  VideoPlayerController? _controller;
  bool _initializing = false;
  String? _error;

  @override
  void initState() {
    super.initState();
    _initialize();
  }

  @override
  void didUpdateWidget(covariant CourseVideoCard oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (oldWidget.videoUrl != widget.videoUrl) {
      _disposeController();
      _initialize();
    }
  }

  Future<void> _initialize() async {
    final url = widget.videoUrl;
    if (url == null || url.trim().isEmpty) {
      return;
    }

    setState(() {
      _initializing = true;
      _error = null;
    });

    try {
      final controller = VideoPlayerController.networkUrl(Uri.parse(url));
      await controller.initialize();
      await controller.setLooping(false);
      if (!mounted) {
        await controller.dispose();
        return;
      }
      setState(() {
        _controller = controller;
      });
    } catch (_) {
      if (!mounted) {
        return;
      }
      setState(() {
        _error = 'Video could not be loaded from the configured stream URL.';
      });
    } finally {
      if (mounted) {
        setState(() {
          _initializing = false;
        });
      }
    }
  }

  Future<void> _disposeController() async {
    final controller = _controller;
    _controller = null;
    if (controller != null) {
      await controller.dispose();
    }
  }

  @override
  void dispose() {
    _disposeController();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    if (widget.videoUrl == null || widget.videoUrl!.trim().isEmpty) {
      return _VideoPlaceholder(
        message: 'No course video uploaded yet.',
      );
    }

    if (_initializing) {
      return const _VideoPlaceholder(
        message: 'Loading course video...',
        child: CircularProgressIndicator(),
      );
    }

    if (_error != null || _controller == null || !_controller!.value.isInitialized) {
      return _VideoPlaceholder(
        message: _error ?? 'Video is not available.',
      );
    }

    return ClipRRect(
      borderRadius: BorderRadius.circular(22),
      child: Column(
        children: [
          AspectRatio(
            aspectRatio: _controller!.value.aspectRatio,
            child: VideoPlayer(_controller!),
          ),
          Container(
            color: MeritTheme.secondary,
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
            child: Row(
              children: [
                IconButton(
                  onPressed: () {
                    setState(() {
                      if (_controller!.value.isPlaying) {
                        _controller!.pause();
                      } else {
                        _controller!.play();
                      }
                    });
                  },
                  icon: Icon(
                    _controller!.value.isPlaying
                        ? Icons.pause_circle_filled_rounded
                        : Icons.play_circle_fill_rounded,
                    color: Colors.white,
                  ),
                ),
                Expanded(
                  child: VideoProgressIndicator(
                    _controller!,
                    allowScrubbing: true,
                    colors: const VideoProgressColors(
                      playedColor: MeritTheme.primary,
                      backgroundColor: Colors.white24,
                    ),
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _VideoPlaceholder extends StatelessWidget {
  const _VideoPlaceholder({
    required this.message,
    this.child,
  });

  final String message;
  final Widget? child;

  @override
  Widget build(BuildContext context) {
    return Container(
      height: 210,
      decoration: BoxDecoration(
        color: MeritTheme.primarySoft,
        borderRadius: BorderRadius.circular(22),
      ),
      child: Center(
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              if (child != null) child!,
              if (child != null) const SizedBox(height: 12),
              Text(
                message,
                textAlign: TextAlign.center,
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _ReceiptRow extends StatelessWidget {
  const _ReceiptRow({
    required this.label,
    required this.value,
  });

  final String label;
  final String value;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(label, style: Theme.of(context).textTheme.labelLarge),
          const SizedBox(height: 4),
          Text(value),
        ],
      ),
    );
  }
}

class _ResultStatCard extends StatelessWidget {
  const _ResultStatCard({
    required this.label,
    required this.value,
  });

  final String label;
  final String value;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(18),
        border: Border.all(color: MeritTheme.border),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            value,
            style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                  color: MeritTheme.secondary,
                ),
          ),
          const SizedBox(height: 4),
          Text(label),
        ],
      ),
    );
  }
}

class _SectionScoreTile extends StatelessWidget {
  const _SectionScoreTile({
    required this.label,
    required this.value,
    required this.maxValue,
  });

  final String label;
  final int value;
  final int maxValue;

  @override
  Widget build(BuildContext context) {
    final normalized = maxValue <= 0 ? 0.0 : (value / maxValue).clamp(0.0, 1.0).toDouble();
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(18),
        border: Border.all(color: MeritTheme.border),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Expanded(child: Text(label, style: Theme.of(context).textTheme.titleSmall)),
              Text('$value/$maxValue'),
            ],
          ),
          const SizedBox(height: 10),
          ClipRRect(
            borderRadius: BorderRadius.circular(999),
            child: LinearProgressIndicator(
              value: normalized,
              minHeight: 8,
              backgroundColor: MeritTheme.primarySoft,
              color: value < 0 ? Colors.red.shade400 : MeritTheme.secondary,
            ),
          ),
        ],
      ),
    );
  }
}

class _DashboardStat extends StatelessWidget {
  const _DashboardStat({required this.label, required this.value});

  final String label;
  final String value;

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: Colors.white.withValues(alpha: 0.09),
        borderRadius: BorderRadius.circular(18),
        border: Border.all(color: Colors.white.withValues(alpha: 0.08)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            value,
            style: const TextStyle(
              fontSize: 20,
              fontWeight: FontWeight.w700,
              color: Colors.white,
            ),
          ),
          const SizedBox(height: 4),
          Text(label, style: const TextStyle(color: Colors.white70)),
        ],
      ),
    );
  }
}

class _MetaChip extends StatelessWidget {
  const _MetaChip({required this.label});

  final String label;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
      decoration: BoxDecoration(
        color: MeritTheme.primarySoft,
        borderRadius: BorderRadius.circular(999),
      ),
      child: Text(label, style: Theme.of(context).textTheme.labelLarge),
    );
  }
}

pw.Document _buildReceiptDocument({
  required Purchase purchase,
  required Course course,
  required StudentProfile student,
}) {
  final document = pw.Document();
  document.addPage(
    pw.Page(
      build: (context) {
        return pw.Padding(
          padding: const pw.EdgeInsets.all(24),
          child: pw.Column(
            crossAxisAlignment: pw.CrossAxisAlignment.start,
            children: [
              pw.Text(
                'Merit Launchers',
                style: pw.TextStyle(fontSize: 24, fontWeight: pw.FontWeight.bold),
              ),
              pw.SizedBox(height: 4),
              pw.Text('Course Access Invoice'),
              pw.SizedBox(height: 16),
              pw.Container(
                padding: const pw.EdgeInsets.all(16),
                child: pw.Column(
                  crossAxisAlignment: pw.CrossAxisAlignment.start,
                  children: [
                    pw.Text('Receipt number: ${purchase.receiptNumber}'),
                    pw.SizedBox(height: 8),
                    pw.Text('Course: ${course.title}'),
                    pw.SizedBox(height: 8),
                    pw.Text(
                      'Amount paid: Rs ${purchase.amount.toStringAsFixed(0)}',
                      style: pw.TextStyle(fontWeight: pw.FontWeight.bold),
                    ),
                  ],
                ),
              ),
              pw.SizedBox(height: 18),
              pw.Text('Student: ${student.name}'),
              pw.Text('Contact: ${student.contact}'),
              pw.Text(
                'Purchased on: ${DateFormat('dd MMM yyyy, hh:mm a').format(purchase.purchasedAt)}',
              ),
              pw.Text(
                'Validity until: ${purchase.validUntil == null ? '1 year from purchase' : DateFormat('dd MMM yyyy').format(purchase.validUntil!)}',
              ),
              pw.Text('Payment provider: ${purchase.paymentProvider}'),
              pw.Text('Payment ID: ${purchase.paymentId ?? 'Demo payment'}'),
              pw.Text('Order ID: ${purchase.paymentOrderId ?? 'Demo order'}'),
            ],
          ),
        );
      },
    ),
  );
  return document;
}
