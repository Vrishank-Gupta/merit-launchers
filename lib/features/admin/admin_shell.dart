import 'dart:typed_data';

import 'package:file_picker/file_picker.dart';
import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

import '../../app/app.dart';
import '../../app/models.dart';
import '../../math/math_content.dart';
import '../../math/math_svg_renderer.dart';
import '../../app/theme.dart';
import '../../widgets/rich_math_content.dart';

class AdminShell extends StatelessWidget {
  const AdminShell({super.key});

  @override
  Widget build(BuildContext context) {
    final controller = AppScope.of(context);
    final destinations = const [
      NavigationRailDestination(icon: Icon(Icons.dashboard_outlined), label: Text('Overview')),
      NavigationRailDestination(icon: Icon(Icons.edit_note_outlined), label: Text('Content')),
      NavigationRailDestination(icon: Icon(Icons.groups_outlined), label: Text('Students')),
      NavigationRailDestination(icon: Icon(Icons.diversity_3_outlined), label: Text('Affiliates')),
      NavigationRailDestination(icon: Icon(Icons.support_agent_outlined), label: Text('Support')),
    ];

    final pages = [
      const AdminOverviewPage(),
      const AdminContentPage(),
      const AdminStudentsPage(),
      const AdminAffiliatesPage(),
      const AdminSupportPage(),
    ];

    return Scaffold(
      body: SafeArea(
        child: Row(
          children: [
            NavigationRail(
              selectedIndex: controller.adminTabIndex,
              onDestinationSelected: controller.setAdminTab,
              labelType: NavigationRailLabelType.all,
              leading: Padding(
                padding: const EdgeInsets.symmetric(vertical: 16),
                child: Column(
                  children: [
                    Image.asset('assets/branding/logo.png', width: 42, height: 42),
                    const SizedBox(height: 8),
                    const Text('Admin'),
                  ],
                ),
              ),
              trailing: Expanded(
                child: Align(
                  alignment: Alignment.bottomCenter,
                  child: Padding(
                    padding: const EdgeInsets.all(16),
                    child: OutlinedButton(
                      onPressed: controller.logout,
                      child: const Text('Exit'),
                    ),
                  ),
                ),
              ),
              destinations: destinations,
            ),
            const VerticalDivider(width: 1),
            Expanded(child: pages[controller.adminTabIndex]),
          ],
        ),
      ),
    );
  }
}

class AdminOverviewPage extends StatelessWidget {
  const AdminOverviewPage({super.key});

  @override
  Widget build(BuildContext context) {
    final controller = AppScope.of(context);
    return ListView(
      padding: const EdgeInsets.all(24),
      children: [
        Text('Dashboard overview', style: Theme.of(context).textTheme.headlineMedium),
        const SizedBox(height: 20),
        Wrap(
          spacing: 16,
          runSpacing: 16,
          children: [
            _MetricCard(title: 'Revenue', value: 'Rs ${controller.totalRevenue.toStringAsFixed(0)}'),
            _MetricCard(title: 'Paid users', value: controller.paidUsers.toString()),
            _MetricCard(title: 'Active users', value: controller.activeUsers.toString()),
            _MetricCard(title: 'Attempts logged', value: controller.attempts.length.toString()),
          ],
        ),
        const SizedBox(height: 24),
        Card(
          child: Padding(
            padding: const EdgeInsets.all(24),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text('Course enrollment snapshot', style: Theme.of(context).textTheme.titleLarge),
                const SizedBox(height: 16),
                ...controller.courses.map((course) {
                  final count = controller.courseEnrollments[course.id] ?? 0;
                  return Padding(
                    padding: const EdgeInsets.only(bottom: 12),
                    child: Row(
                      children: [
                        Expanded(child: Text(course.title)),
                        Text('$count enrolled'),
                      ],
                    ),
                  );
                }),
              ],
            ),
          ),
        ),
      ],
    );
  }
}

class AdminContentPage extends StatelessWidget {
  const AdminContentPage({super.key});

  static const _mathSnippets = <_MathSnippet>[
    _MathSnippet('Fraction', r'\frac{a}{b}'),
    _MathSnippet('Integral', r'\int_0^1 x^2 \, dx'),
    _MathSnippet('Limit', r'\lim_{x \to 0} \frac{\sin x}{x}'),
    _MathSnippet('Root', r'\sqrt{x^2 + y^2}'),
    _MathSnippet('Determinant', r'\det \begin{bmatrix} 1 & 2 \\ 3 & 4 \end{bmatrix}'),
    _MathSnippet('Power', r'x^2 + y^3'),
  ];

  Future<void> _openCourseDialog(BuildContext context) async {
    final controller = AppScope.of(context);
    final title = TextEditingController();
    final subtitle = TextEditingController();
    final description = TextEditingController();
    final price = TextEditingController(text: '499');
    final label = TextEditingController(text: 'NEW');

    await showDialog<void>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Create course'),
        content: SizedBox(
          width: 440,
          child: SingleChildScrollView(
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                TextField(controller: title, decoration: const InputDecoration(labelText: 'Title')),
                const SizedBox(height: 12),
                TextField(controller: subtitle, decoration: const InputDecoration(labelText: 'Subtitle')),
                const SizedBox(height: 12),
                TextField(
                  controller: description,
                  maxLines: 3,
                  decoration: const InputDecoration(labelText: 'Description'),
                ),
                const SizedBox(height: 12),
                TextField(controller: price, decoration: const InputDecoration(labelText: 'Price')),
                const SizedBox(height: 12),
                TextField(controller: label, decoration: const InputDecoration(labelText: 'Hero label')),
              ],
            ),
          ),
        ),
        actions: [
          TextButton(onPressed: () => Navigator.pop(context), child: const Text('Cancel')),
          ElevatedButton(
            onPressed: () async {
              await controller.addCourse(
                title: title.text.trim(),
                subtitle: subtitle.text.trim(),
                description: description.text.trim(),
                price: double.tryParse(price.text.trim()) ?? 0,
                heroLabel: label.text.trim().isEmpty ? 'NEW' : label.text.trim().toUpperCase(),
                introVideoUrl: null,
              );
              if (!context.mounted) {
                return;
              }
              Navigator.pop(context);
            },
            child: const Text('Save'),
          ),
        ],
      ),
    );
  }

  Future<void> _uploadCourseVideo(BuildContext context, Course course) async {
    final controller = AppScope.of(context);
    final backend = AppScope.backendOf(context);
    final messenger = ScaffoldMessenger.of(context);

    if (backend.isDemo) {
      messenger.showSnackBar(
        const SnackBar(
          content: Text('Video upload requires the app to run in dev or prod mode with Supabase enabled.'),
        ),
      );
      return;
    }

    final result = await FilePicker.platform.pickFiles(
      type: FileType.video,
      withData: true,
    );

    if (result == null || result.files.isEmpty) {
      return;
    }

    final file = result.files.single;
    final bytes = file.bytes;
    if (bytes == null || bytes.isEmpty) {
      messenger.showSnackBar(
        const SnackBar(content: Text('Selected video file could not be read.')),
      );
      return;
    }

    messenger.showSnackBar(
      SnackBar(content: Text('Uploading ${file.name}...')),
    );

    try {
      final publicUrl = await _uploadVideoBytes(
        courseId: course.id,
        fileName: file.name,
        bytes: bytes,
        mimeType: file.extension == null ? null : 'video/${file.extension}',
      );

      await controller.updateCourseVideo(
        courseId: course.id,
        videoUrl: publicUrl,
      );

      if (!context.mounted) {
        return;
      }

      messenger.showSnackBar(
        const SnackBar(content: Text('Course video uploaded successfully.')),
      );
    } catch (error) {
      if (!context.mounted) {
        return;
      }
      messenger.showSnackBar(
        SnackBar(content: Text('Video upload failed: $error')),
      );
    }
  }

  Future<String> _uploadVideoBytes({
    required String courseId,
    required String fileName,
    required Uint8List bytes,
    String? mimeType,
  }) async {
    final storage = Supabase.instance.client.storage.from('course-videos');
    final extension = fileName.contains('.') ? fileName.split('.').last : 'mp4';
    final path = 'courses/$courseId/intro-${DateTime.now().millisecondsSinceEpoch}.$extension';

    await storage.uploadBinary(
      path,
      bytes,
      fileOptions: FileOptions(
        upsert: true,
        contentType: mimeType,
      ),
    );

    return storage.getPublicUrl(path);
  }

  Future<void> _openPaperDialog(BuildContext context, Course course) async {
    final controller = AppScope.of(context);
    final title = TextEditingController(text: '${course.title} New Paper');
    final duration = TextEditingController(text: '30');
    final instructions = TextEditingController(
      text: 'Read questions carefully.\nCorrect +3.\nIncorrect -1.',
    );
    final questionText = TextEditingController(text: r'\frac{1}{2} + \frac{1}{2} = ?');
    final section = TextEditingController(text: 'Quantitative Aptitude');
    final optionA = TextEditingController(text: '0');
    final optionB = TextEditingController(text: '1');
    final optionC = TextEditingController(text: '2');
    final optionD = TextEditingController(text: '4');
    final draftQuestions = <Question>[];
    var activeField = 'question';
    int answerIndex = 1;
    bool isFreePreview = false;

    await showDialog<void>(
      context: context,
      builder: (context) => StatefulBuilder(
        builder: (context, setState) {
          TextEditingController activeController() {
            switch (activeField) {
              case 'a':
                return optionA;
              case 'b':
                return optionB;
              case 'c':
                return optionC;
              case 'd':
                return optionD;
              default:
                return questionText;
            }
          }

          void insertSnippet(String snippet) {
            final controller = activeController();
            final current = controller.text;
            final needsSpacer = current.isNotEmpty && !current.endsWith(' ');
            controller.text = '$current${needsSpacer ? ' ' : ''}$snippet';
            controller.selection = TextSelection.collapsed(offset: controller.text.length);
            setState(() {});
          }

          void resetQuestionComposer() {
            section.text = 'Quantitative Aptitude';
            questionText.clear();
            optionA.clear();
            optionB.clear();
            optionC.clear();
            optionD.clear();
            answerIndex = 0;
            activeField = 'question';
          }

          Future<Question?> buildDraftQuestion() async {
            final options = [
              optionA.text.trim(),
              optionB.text.trim(),
              optionC.text.trim(),
              optionD.text.trim(),
            ];

            if (section.text.trim().isEmpty ||
                questionText.text.trim().isEmpty ||
                options.any((option) => option.isEmpty)) {
              return null;
            }

            final promptSegments = await renderMathSegments(questionText.text.trim());
            final optionSegments = <List<MathContentSegment>>[];
            for (final option in options) {
              optionSegments.add(await renderMathSegments(option));
            }

            return Question(
              id: 'admin-${DateTime.now().microsecondsSinceEpoch}',
              section: section.text.trim(),
              prompt: questionText.text.trim(),
              options: options,
              correctIndex: answerIndex,
              promptSegments: promptSegments,
              optionSegments: optionSegments,
            );
          }

          return AlertDialog(
            title: Text('Add paper to ${course.title}'),
            content: SizedBox(
              width: 760,
              child: SingleChildScrollView(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    TextField(controller: title, decoration: const InputDecoration(labelText: 'Paper title')),
                    const SizedBox(height: 12),
                    TextField(controller: duration, decoration: const InputDecoration(labelText: 'Duration (minutes)')),
                    const SizedBox(height: 12),
                    TextField(
                      controller: instructions,
                      maxLines: 3,
                      decoration: const InputDecoration(labelText: 'Instructions (one per line)'),
                    ),
                    const SizedBox(height: 12),
                    SwitchListTile(
                      value: isFreePreview,
                      onChanged: (value) => setState(() => isFreePreview = value),
                      title: const Text('Free preview paper'),
                    ),
                    const SizedBox(height: 12),
                    TextField(
                      controller: section,
                      onChanged: (_) => setState(() {}),
                      decoration: const InputDecoration(labelText: 'Question section'),
                    ),
                    const SizedBox(height: 16),
                    _SnippetPanel(
                      activeField: activeField,
                      snippets: _mathSnippets,
                      onSnippetTap: insertSnippet,
                    ),
                    const SizedBox(height: 12),
                    TextField(
                      controller: questionText,
                      onTap: () => setState(() => activeField = 'question'),
                      onChanged: (_) => setState(() {}),
                      maxLines: 3,
                      decoration: const InputDecoration(
                        labelText: 'Question text',
                        helperText: 'Paste LaTeX-style text or Unicode math directly. The preview below matches the Android and iOS student app.',
                      ),
                    ),
                    const SizedBox(height: 12),
                    _MathPreviewCard(
                      title: 'Question preview',
                      value: questionText.text,
                    ),
                    const SizedBox(height: 12),
                    TextField(
                      controller: optionA,
                      onTap: () => setState(() => activeField = 'a'),
                      onChanged: (_) => setState(() {}),
                      decoration: const InputDecoration(labelText: 'Option A'),
                    ),
                    const SizedBox(height: 12),
                    TextField(
                      controller: optionB,
                      onTap: () => setState(() => activeField = 'b'),
                      onChanged: (_) => setState(() {}),
                      decoration: const InputDecoration(labelText: 'Option B'),
                    ),
                    const SizedBox(height: 12),
                    TextField(
                      controller: optionC,
                      onTap: () => setState(() => activeField = 'c'),
                      onChanged: (_) => setState(() {}),
                      decoration: const InputDecoration(labelText: 'Option C'),
                    ),
                    const SizedBox(height: 12),
                    TextField(
                      controller: optionD,
                      onTap: () => setState(() => activeField = 'd'),
                      onChanged: (_) => setState(() {}),
                      decoration: const InputDecoration(labelText: 'Option D'),
                    ),
                    const SizedBox(height: 12),
                    _MathPreviewCard(
                      title: 'Option preview',
                      value:
                          'A: ${optionA.text}\nB: ${optionB.text}\nC: ${optionC.text}\nD: ${optionD.text}',
                    ),
                    const SizedBox(height: 12),
                    DropdownButtonFormField<int>(
                      value: answerIndex,
                      decoration: const InputDecoration(labelText: 'Correct option'),
                      items: const [
                        DropdownMenuItem(value: 0, child: Text('A')),
                        DropdownMenuItem(value: 1, child: Text('B')),
                        DropdownMenuItem(value: 2, child: Text('C')),
                        DropdownMenuItem(value: 3, child: Text('D')),
                      ],
                      onChanged: (value) => setState(() => answerIndex = value ?? 1),
                    ),
                    const SizedBox(height: 16),
                    Row(
                      children: [
                        OutlinedButton.icon(
                          onPressed: () async {
                            final draft = await buildDraftQuestion();
                            if (draft == null) {
                              if (!context.mounted) {
                                return;
                              }
                              ScaffoldMessenger.of(context).showSnackBar(
                                const SnackBar(
                                  content: Text('Complete the section, question, and all four options before adding.'),
                                ),
                              );
                              return;
                            }
                            setState(() {
                              draftQuestions.add(draft);
                              resetQuestionComposer();
                            });
                          },
                          icon: const Icon(Icons.playlist_add_rounded),
                          label: const Text('Add question to paper'),
                        ),
                        const SizedBox(width: 12),
                        Text(
                          '${draftQuestions.length} question${draftQuestions.length == 1 ? '' : 's'} added',
                          style: Theme.of(context).textTheme.bodyMedium,
                        ),
                      ],
                    ),
                    if (draftQuestions.isNotEmpty) ...[
                      const SizedBox(height: 16),
                      Text('Paper draft', style: Theme.of(context).textTheme.titleMedium),
                      const SizedBox(height: 8),
                      ...List.generate(draftQuestions.length, (index) {
                        final draft = draftQuestions[index];
                        return Padding(
                          padding: const EdgeInsets.only(bottom: 12),
                          child: _DraftQuestionCard(
                            index: index,
                            question: draft,
                            onRemove: () => setState(() {
                              draftQuestions.removeAt(index);
                            }),
                          ),
                        );
                      }),
                    ],
                    const SizedBox(height: 16),
                    const _MathAuthoringGuide(),
                  ],
                ),
              ),
            ),
            actions: [
              TextButton(onPressed: () => Navigator.pop(context), child: const Text('Cancel')),
              ElevatedButton(
                onPressed: () async {
                  final stagedQuestions = List<Question>.of(draftQuestions);
                  final currentDraft = await buildDraftQuestion();
                  if (!context.mounted) {
                    return;
                  }
                  if (currentDraft != null) {
                    stagedQuestions.add(currentDraft);
                  }
                  if (stagedQuestions.isEmpty) {
                    ScaffoldMessenger.of(context).showSnackBar(
                      const SnackBar(content: Text('Add at least one question before saving the paper.')),
                    );
                    return;
                  }
                  await controller.addPaper(
                    courseId: course.id,
                    title: title.text.trim(),
                    durationMinutes: int.tryParse(duration.text.trim()) ?? 30,
                    isFreePreview: isFreePreview,
                    instructions: instructions.text
                        .split('\n')
                        .map((line) => line.trim())
                        .where((line) => line.isNotEmpty)
                        .toList(),
                    questions: stagedQuestions,
                  );
                  if (!context.mounted) {
                    return;
                  }
                  Navigator.pop(context);
                },
                child: const Text('Add paper'),
              ),
            ],
          );
        },
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final controller = AppScope.of(context);
    return ListView(
      padding: const EdgeInsets.all(24),
      children: [
        Row(
          children: [
            Text('Content management', style: Theme.of(context).textTheme.headlineMedium),
            const Spacer(),
            ElevatedButton.icon(
              onPressed: () => _openCourseDialog(context),
              icon: const Icon(Icons.add),
              label: const Text('New course'),
            ),
          ],
        ),
        const SizedBox(height: 20),
        ...controller.courses.map((course) {
          final papers = controller.papersForCourse(course.id);
          return Card(
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
                            Text(course.title, style: Theme.of(context).textTheme.titleLarge),
                            const SizedBox(height: 6),
                            Text(course.subtitle),
                          ],
                        ),
                      ),
                      OutlinedButton.icon(
                        onPressed: () => _openPaperDialog(context, course),
                        icon: const Icon(Icons.note_add_outlined),
                        label: const Text('Add paper'),
                      ),
                      const SizedBox(width: 12),
                      OutlinedButton.icon(
                        onPressed: () => _uploadCourseVideo(context, course),
                        icon: const Icon(Icons.video_file_outlined),
                        label: Text(course.introVideoUrl == null ? 'Upload video' : 'Replace video'),
                      ),
                    ],
                  ),
                  const SizedBox(height: 16),
                  if (course.introVideoUrl != null)
                    Padding(
                      padding: const EdgeInsets.only(bottom: 12),
                      child: Text(
                        'Video attached to this course.',
                        style: Theme.of(context).textTheme.bodyMedium,
                      ),
                    ),
                  ...papers.map(
                    (paper) => ListTile(
                      contentPadding: EdgeInsets.zero,
                      title: Text(paper.title),
                      subtitle: Text(
                        '${paper.durationMinutes} mins - ${paper.questions.length} questions'
                        '${paper.isFreePreview ? ' - Free' : ''}',
                      ),
                    ),
                  ),
                ],
              ),
            ),
          );
        }),
      ],
    );
  }
}

class AdminStudentsPage extends StatelessWidget {
  const AdminStudentsPage({super.key});

  @override
  Widget build(BuildContext context) {
    final controller = AppScope.of(context);
    return ListView(
      padding: const EdgeInsets.all(24),
      children: [
        Text('Students', style: Theme.of(context).textTheme.headlineMedium),
        const SizedBox(height: 20),
        ...controller.students.map((student) {
          final purchases = controller.purchasesForStudent(student.id);
          final attempts = controller.attemptsForStudent(student.id);
          return Card(
            child: Padding(
              padding: const EdgeInsets.all(20),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(student.name, style: Theme.of(context).textTheme.titleLarge),
                  const SizedBox(height: 8),
                  Text('${student.contact} - ${student.city}'),
                  const SizedBox(height: 8),
                  Text('Referral code: ${student.referralCode ?? 'None'}'),
                  const SizedBox(height: 8),
                  Text('Purchases: ${purchases.length} - Attempts: ${attempts.length}'),
                ],
              ),
            ),
          );
        }),
      ],
    );
  }
}

class AdminAffiliatesPage extends StatefulWidget {
  const AdminAffiliatesPage({super.key});

  @override
  State<AdminAffiliatesPage> createState() => _AdminAffiliatesPageState();
}

class _AdminAffiliatesPageState extends State<AdminAffiliatesPage> {
  final _name = TextEditingController();
  final _code = TextEditingController();
  final _channel = TextEditingController();

  @override
  void dispose() {
    _name.dispose();
    _code.dispose();
    _channel.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final controller = AppScope.of(context);
    return ListView(
      padding: const EdgeInsets.all(24),
      children: [
        Text('Affiliates', style: Theme.of(context).textTheme.headlineMedium),
        const SizedBox(height: 20),
        Card(
          child: Padding(
            padding: const EdgeInsets.all(20),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text('Create affiliate code', style: Theme.of(context).textTheme.titleLarge),
                const SizedBox(height: 12),
                TextField(controller: _name, decoration: const InputDecoration(labelText: 'Affiliate name')),
                const SizedBox(height: 12),
                TextField(controller: _code, decoration: const InputDecoration(labelText: 'Referral code')),
                const SizedBox(height: 12),
                TextField(controller: _channel, decoration: const InputDecoration(labelText: 'Channel/source')),
                const SizedBox(height: 16),
                ElevatedButton(
                  onPressed: () async {
                    await controller.addAffiliate(
                      name: _name.text.trim(),
                      code: _code.text.trim(),
                      channel: _channel.text.trim(),
                    );
                    _name.clear();
                    _code.clear();
                    _channel.clear();
                  },
                  child: const Text('Add affiliate'),
                ),
              ],
            ),
          ),
        ),
        const SizedBox(height: 20),
        ...controller.affiliates.map((affiliate) {
          final referrals = controller.affiliateReferrals(affiliate.code);
          return Card(
            child: ListTile(
              title: Text('${affiliate.name} - ${affiliate.code}'),
              subtitle: Text('${affiliate.channel} - $referrals students referred'),
            ),
          );
        }),
      ],
    );
  }
}

class AdminSupportPage extends StatefulWidget {
  const AdminSupportPage({super.key});

  @override
  State<AdminSupportPage> createState() => _AdminSupportPageState();
}

class _AdminSupportPageState extends State<AdminSupportPage> {
  final _reply = TextEditingController();

  @override
  void dispose() {
    _reply.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final controller = AppScope.of(context);
    return Column(
      children: [
        Padding(
          padding: const EdgeInsets.all(24),
          child: Align(
            alignment: Alignment.centerLeft,
            child: Text('Support inbox', style: Theme.of(context).textTheme.headlineMedium),
          ),
        ),
        Expanded(
          child: ListView(
            padding: const EdgeInsets.symmetric(horizontal: 24),
            children: controller.supportMessages.map((message) {
              final isAdmin = message.sender == SenderRole.admin;
              return Align(
                alignment: isAdmin ? Alignment.centerRight : Alignment.centerLeft,
                child: Container(
                  margin: const EdgeInsets.only(bottom: 12),
                  padding: const EdgeInsets.all(16),
                  constraints: const BoxConstraints(maxWidth: 460),
                  decoration: BoxDecoration(
                    color: isAdmin ? MeritTheme.secondary : Colors.white,
                    borderRadius: BorderRadius.circular(20),
                    border: Border.all(color: MeritTheme.border),
                  ),
                  child: Column(
                    crossAxisAlignment:
                        isAdmin ? CrossAxisAlignment.end : CrossAxisAlignment.start,
                    children: [
                      Text(
                        isAdmin ? 'Admin reply' : 'Student',
                        style: TextStyle(
                          color: isAdmin ? Colors.white70 : MeritTheme.secondary,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                      const SizedBox(height: 6),
                      Text(
                        message.message,
                        style: TextStyle(color: isAdmin ? Colors.white : MeritTheme.secondary),
                      ),
                      const SizedBox(height: 8),
                      Text(
                        DateFormat('dd MMM, hh:mm a').format(message.sentAt),
                        style: TextStyle(color: isAdmin ? Colors.white70 : Colors.black54),
                      ),
                    ],
                  ),
                ),
              );
            }).toList(),
          ),
        ),
        SafeArea(
          top: false,
          child: Padding(
            padding: const EdgeInsets.all(24),
            child: Row(
              children: [
                Expanded(
                  child: TextField(
                    controller: _reply,
                    decoration: const InputDecoration(
                      hintText: 'Reply to student',
                    ),
                  ),
                ),
                const SizedBox(width: 12),
                ElevatedButton(
                  onPressed: () async {
                    await controller.addSupportMessage(SenderRole.admin, _reply.text);
                    _reply.clear();
                  },
                  child: const Text('Send reply'),
                ),
              ],
            ),
          ),
        ),
      ],
    );
  }
}

class _MetricCard extends StatelessWidget {
  const _MetricCard({required this.title, required this.value});

  final String title;
  final String value;

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      width: 220,
      child: Card(
        child: Padding(
          padding: const EdgeInsets.all(20),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(title),
              const SizedBox(height: 10),
              Text(
                value,
                style: Theme.of(context).textTheme.headlineMedium?.copyWith(
                      color: MeritTheme.secondary,
                    ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _SnippetPanel extends StatelessWidget {
  const _SnippetPanel({
    required this.activeField,
    required this.snippets,
    required this.onSnippetTap,
  });

  final String activeField;
  final List<_MathSnippet> snippets;
  final ValueChanged<String> onSnippetTap;

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: MeritTheme.primarySoft,
        borderRadius: BorderRadius.circular(20),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'Math helper',
            style: Theme.of(context).textTheme.titleMedium?.copyWith(
                  color: MeritTheme.secondary,
                ),
          ),
          const SizedBox(height: 6),
          Text(
            'Active field: ${_fieldLabel(activeField)}. Tap a snippet to insert it into the selected field.',
            style: Theme.of(context).textTheme.bodyMedium,
          ),
          const SizedBox(height: 12),
          Wrap(
            spacing: 8,
            runSpacing: 8,
            children: snippets
                .map(
                  (snippet) => ActionChip(
                    label: Text(snippet.label),
                    onPressed: () => onSnippetTap(snippet.value),
                  ),
                )
                .toList(),
          ),
        ],
      ),
    );
  }

  String _fieldLabel(String key) {
    switch (key) {
      case 'a':
        return 'Option A';
      case 'b':
        return 'Option B';
      case 'c':
        return 'Option C';
      case 'd':
        return 'Option D';
      default:
        return 'Question text';
    }
  }
}

class _MathAuthoringGuide extends StatelessWidget {
  const _MathAuthoringGuide();

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(18),
        border: Border.all(color: MeritTheme.border),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'Authoring tips',
            style: Theme.of(context).textTheme.titleMedium?.copyWith(
                  color: MeritTheme.secondary,
                ),
          ),
          const SizedBox(height: 10),
          const Text('Paste raw LaTeX-style text from Gemini or other LLM output directly.'),
          const SizedBox(height: 6),
          const Text(
            r'Examples: \frac{a}{b}, \int_0^1 x^2 \, dx, \lim_{x \to 0}, \det \begin{bmatrix} ... \end{bmatrix}',
          ),
          const SizedBox(height: 6),
          const Text(
            'Unicode math also works well, for example: Where matrix A is:\n┌  2/3   x/4  ┐\n└  1/2   5/6  ┘',
          ),
          const SizedBox(height: 6),
          const Text('Best result: copy the text version, not a rendered screenshot or image.'),
          const SizedBox(height: 6),
          const Text(
            'The preview shown here matches the same formatting used in the Android and iOS student apps.',
          ),
        ],
      ),
    );
  }
}

class _DraftQuestionCard extends StatelessWidget {
  const _DraftQuestionCard({
    required this.index,
    required this.question,
    required this.onRemove,
  });

  final int index;
  final Question question;
  final VoidCallback onRemove;

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(16),
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
              Expanded(
                child: Text(
                  'Question ${index + 1} - ${question.section}',
                  style: Theme.of(context).textTheme.titleMedium?.copyWith(
                        color: MeritTheme.secondary,
                      ),
                ),
              ),
              IconButton(
                onPressed: onRemove,
                icon: const Icon(Icons.delete_outline_rounded),
              ),
            ],
          ),
          RichMathContentView(
            rawText: question.prompt,
            segments: question.promptSegments,
          ),
          const SizedBox(height: 10),
          ...List.generate(question.options.length, (optionIndex) {
            final option = question.options[optionIndex];
            final marker = String.fromCharCode(65 + optionIndex);
            final correct = optionIndex == question.correctIndex;
            return Padding(
              padding: const EdgeInsets.only(bottom: 6),
              child: Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    '$marker. ',
                    style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                          fontWeight: correct ? FontWeight.w700 : FontWeight.w500,
                          color: correct ? MeritTheme.secondary : null,
                        ),
                  ),
                  Expanded(
                    child: RichMathContentView(
                      rawText: option,
                      segments: question.optionSegments?[optionIndex],
                      style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                            fontWeight: correct ? FontWeight.w700 : FontWeight.w400,
                            color: correct ? MeritTheme.secondary : null,
                          ),
                    ),
                  ),
                ],
              ),
            );
          }),
        ],
      ),
    );
  }
}

class _MathPreviewCard extends StatelessWidget {
  const _MathPreviewCard({
    required this.title,
    required this.value,
  });

  final String title;
  final String value;

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(18),
        border: Border.all(color: MeritTheme.border),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            title,
            style: Theme.of(context).textTheme.titleMedium?.copyWith(
                  color: MeritTheme.secondary,
                ),
          ),
          const SizedBox(height: 10),
          FutureBuilder<List<MathContentSegment>>(
            future: renderMathSegments(value),
            builder: (context, snapshot) {
              return RichMathContentView(
                rawText: value,
                segments: snapshot.data,
              );
            },
          ),
        ],
      ),
    );
  }
}

class _MathSnippet {
  const _MathSnippet(this.label, this.value);

  final String label;
  final String value;
}
