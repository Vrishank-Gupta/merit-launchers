import 'package:file_picker/file_picker.dart';
import 'package:flutter/material.dart';
import 'package:intl/intl.dart';

import '../../app/app.dart';
import '../../app/app_controller.dart';
import '../../app/api_client.dart';
import '../../app/models.dart';
import '../../math/math_content.dart';
import '../../math/math_svg_renderer.dart';
import '../../app/theme.dart';
import '../../widgets/rich_math_content.dart';
import 'bunny_upload_backend.dart';
import 'bunny_upload_service.dart';
import 'paper_import_backend.dart';
import 'paper_import_parser.dart';

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
    final estimate = _PlatformQuotaEstimate.fromController(controller);
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
                Row(
                  children: [
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text('VM quota and cost watch', style: Theme.of(context).textTheme.titleLarge),
                          const SizedBox(height: 6),
                          Text(
                            'Estimated from app activity and your low-egress VM deployment assumptions. This panel is intentionally local and lightweight, not a live billing API.',
                            style: Theme.of(context).textTheme.bodyMedium,
                          ),
                        ],
                      ),
                    ),
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
                      decoration: BoxDecoration(
                        color: estimate.projectedBillableMetrics == 0
                            ? MeritTheme.success.withValues(alpha: 0.12)
                            : const Color(0xFFFFF3E0),
                        borderRadius: BorderRadius.circular(16),
                      ),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.end,
                        children: [
                          Text(
                            estimate.projectedBillableMetrics == 0 ? 'Projected cost' : 'Attention needed',
                            style: Theme.of(context).textTheme.labelLarge,
                          ),
                          const SizedBox(height: 4),
                          Text(
                            estimate.projectedBillableMetrics == 0
                                ? 'Rs 0 at current run-rate'
                                : '${estimate.projectedBillableMetrics} quota${estimate.projectedBillableMetrics == 1 ? '' : 's'} above free tier',
                            style: Theme.of(context).textTheme.titleMedium,
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 18),
                Wrap(
                  spacing: 16,
                  runSpacing: 16,
                  children: estimate.items
                      .map((item) => _QuotaCard(item: item))
                      .toList(),
                ),
                const SizedBox(height: 16),
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
                      Text('How this stays cheap', style: Theme.of(context).textTheme.titleSmall),
                      const SizedBox(height: 8),
                      const Text(
                        'Attempts, receipts, and support history are local-first. Videos are hosted outside the VM. The VM handles metadata and secure payment actions only.',
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
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

  Future<void> _setCourseVideoUrl(BuildContext context, Course course) async {
    final controller = AppScope.of(context);
    final backend = AppScope.backendOf(context);
    final videoUrl = TextEditingController(text: course.introVideoUrl ?? '');

    if (backend.isDemo) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Course video URLs can be saved only in dev or prod mode.')),
      );
      return;
    }

    await showDialog<void>(
      context: context,
      builder: (dialogContext) => AlertDialog(
        title: Text(course.introVideoUrl == null ? 'Attach course video' : 'Replace course video'),
        content: SizedBox(
          width: 520,
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Text(
                'Paste a direct MP4/HLS playback URL from your external video host. This keeps VM network cost low.',
              ),
              const SizedBox(height: 12),
              TextField(
                controller: videoUrl,
                maxLines: 3,
                decoration: const InputDecoration(
                  labelText: 'Video URL',
                  hintText: 'https://your-video-host.example.com/course-intro.mp4',
                ),
              ),
              const SizedBox(height: 8),
              Text(
                'Recommended low-cost hosts: Bunny Stream or Cloudflare Stream.',
                style: Theme.of(dialogContext).textTheme.bodySmall,
              ),
            ],
          ),
        ),
        actions: [
          if (course.introVideoUrl != null)
            TextButton(
              onPressed: () async {
                await controller.updateCourseVideo(courseId: course.id, videoUrl: null);
                if (dialogContext.mounted) {
                  Navigator.pop(dialogContext);
                }
              },
              child: const Text('Remove video'),
            ),
          TextButton(
            onPressed: () => Navigator.pop(dialogContext),
            child: const Text('Cancel'),
          ),
          ElevatedButton(
            onPressed: () async {
              final value = videoUrl.text.trim();
              await controller.updateCourseVideo(
                courseId: course.id,
                videoUrl: value.isEmpty ? null : value,
              );
              if (dialogContext.mounted) {
                Navigator.pop(dialogContext);
              }
            },
            child: const Text('Save URL'),
          ),
        ],
      ),
    );
  }

  Future<void> _uploadCourseVideo(BuildContext context, Course course) async {
    final controller = AppScope.of(context);
    final backend = AppScope.backendOf(context);
    final uploadService = createBunnyUploadService();

    if (backend.isDemo || backend.apiBaseUrl == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Bunny upload is available only in dev or prod mode.')),
      );
      return;
    }
    if (!uploadService.supported) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Direct Bunny upload is available only in the admin web dashboard.')),
      );
      return;
    }

    final messenger = ScaffoldMessenger.of(context);
    messenger.showSnackBar(
      const SnackBar(content: Text('Preparing Bunny upload...')),
    );

    try {
      final ticket = await BunnyUploadBackend(backend).createUpload(
        courseId: course.id,
        title: '${course.title} intro video',
      );
      final result = await uploadService.pickAndUpload(ticket);
      if (result == null) {
        messenger.showSnackBar(
          const SnackBar(content: Text('Video upload cancelled.')),
        );
        return;
      }
      await controller.updateCourseVideo(
        courseId: course.id,
        videoUrl: result.hlsUrl,
      );
      messenger.showSnackBar(
        const SnackBar(content: Text('Video uploaded to Bunny and linked to the course.')),
      );
    } catch (error) {
      messenger.showSnackBar(
        SnackBar(content: Text('Bunny upload failed. $error')),
      );
    }
  }

  Future<void> _openPaperDialog(BuildContext context, Course course, {Paper? existingPaper}) async {
    final controller = AppScope.of(context);
    final title = TextEditingController(text: existingPaper?.title ?? '${course.title} New Paper');
    final duration = TextEditingController(text: '${existingPaper?.durationMinutes ?? 30}');
    final instructions = TextEditingController(
      text: existingPaper?.instructions.join('\n') ?? 'Read questions carefully.\nCorrect +3.\nIncorrect -1.',
    );
    final questionText = TextEditingController(text: r'\frac{1}{2} + \frac{1}{2} = ?');
    final section = TextEditingController(text: 'Quantitative Aptitude');
    final optionA = TextEditingController(text: '0');
    final optionB = TextEditingController(text: '1');
    final optionC = TextEditingController(text: '2');
    final optionD = TextEditingController(text: '4');
    final draftQuestions = <Question>[...?existingPaper?.questions];
    var activeField = 'question';
    int answerIndex = 1;
    bool isFreePreview = existingPaper?.isFreePreview ?? false;
    bool importing = false;
    int? selectedDraftIndex;

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
            selectedDraftIndex = null;
          }

          void loadDraftQuestion(int index) {
            final draft = draftQuestions[index];
            section.text = draft.section;
            questionText.text = MathContentParser.normalizeSourceText(draft.prompt);
            optionA.text = MathContentParser.normalizeSourceText(draft.options[0]);
            optionB.text = MathContentParser.normalizeSourceText(draft.options[1]);
            optionC.text = MathContentParser.normalizeSourceText(draft.options[2]);
            optionD.text = MathContentParser.normalizeSourceText(draft.options[3]);
            answerIndex = draft.correctIndex;
            activeField = 'question';
            selectedDraftIndex = index;
          }

          Future<Question?> buildDraftQuestion() async {
            final normalizedPrompt = MathContentParser.normalizeSourceText(questionText.text.trim());
            final options = [
              MathContentParser.normalizeSourceText(optionA.text.trim()),
              MathContentParser.normalizeSourceText(optionB.text.trim()),
              MathContentParser.normalizeSourceText(optionC.text.trim()),
              MathContentParser.normalizeSourceText(optionD.text.trim()),
            ];

            if (section.text.trim().isEmpty ||
                normalizedPrompt.isEmpty ||
                options.any((option) => option.isEmpty)) {
              return null;
            }

            final promptSegments = await renderMathSegments(normalizedPrompt);
            final optionSegments = <List<MathContentSegment>>[];
            for (final option in options) {
              optionSegments.add(await renderMathSegments(option));
            }

            return Question(
              id: selectedDraftIndex == null
                  ? 'admin-${DateTime.now().microsecondsSinceEpoch}'
                  : draftQuestions[selectedDraftIndex!].id,
              section: section.text.trim(),
              prompt: normalizedPrompt,
              options: options,
              correctIndex: answerIndex,
              promptSegments: promptSegments,
              optionSegments: optionSegments,
            );
          }

          Future<void> upsertDraftQuestion() async {
            final draft = await buildDraftQuestion();
            if (draft == null) {
              if (!context.mounted) {
                return;
              }
              ScaffoldMessenger.of(context).showSnackBar(
                const SnackBar(
                  content: Text('Complete the section, question, and all four options before saving this question.'),
                ),
              );
              return;
            }

            setState(() {
              if (selectedDraftIndex == null) {
                draftQuestions.add(draft);
              } else {
                draftQuestions[selectedDraftIndex!] = draft;
              }
              resetQuestionComposer();
            });
          }

          Future<List<Question>> enrichImportedQuestions(List<Question> questions) async {
            final enriched = <Question>[];
            for (final question in questions) {
              final promptSegments = await renderMathSegments(question.prompt);
              final optionSegments = <List<MathContentSegment>>[];
              for (final option in question.options) {
                optionSegments.add(await renderMathSegments(option));
              }
              enriched.add(
                Question(
                  id: question.id,
                  section: question.section,
                  prompt: question.prompt,
                  options: question.options,
                  correctIndex: question.correctIndex,
                  promptSegments: promptSegments,
                  optionSegments: optionSegments,
                  explanation: question.explanation,
                  marks: question.marks,
                  negativeMarks: question.negativeMarks,
                ),
              );
            }
            return enriched;
          }

          Future<void> importPaperFromFile() async {
            final backend = AppScope.backendOf(context);
            final result = await FilePicker.platform.pickFiles(
              type: FileType.custom,
              allowedExtensions: const ['docx', 'txt'],
              withData: true,
            );
            if (result == null || result.files.isEmpty) {
              return;
            }

            final file = result.files.single;
            final bytes = file.bytes;
            if (bytes == null || bytes.isEmpty) {
              if (!context.mounted) {
                return;
              }
              ScaffoldMessenger.of(context).showSnackBar(
                const SnackBar(content: Text('Selected file could not be read.')),
              );
              return;
              }

              setState(() => importing = true);
              try {
                final rawText = PaperImportParser.extractRawText(
                  fileName: file.name,
                  bytes: bytes,
                );
                final importBackend = PaperImportBackend(
                  backend: backend,
                  token: controller.apiAccessToken,
                );
                final imported = await importBackend.importWithAi(
                  fileName: file.name,
                  rawText: rawText,
                  fileBytes: bytes,
                );
                final renderedQuestions = await enrichImportedQuestions(imported.questions);
                title.text = imported.title;
                if (imported.instructions.isNotEmpty) {
                  instructions.text = imported.instructions.join('\n');
                }
              draftQuestions
                ..clear()
                ..addAll(renderedQuestions);
              resetQuestionComposer();

              if (!context.mounted) {
                return;
              }
                ScaffoldMessenger.of(context).showSnackBar(
                  SnackBar(
                    content: Text(
                      imported.debugLogId == null
                          ? 'Imported ${renderedQuestions.length} question${renderedQuestions.length == 1 ? '' : 's'} from ${file.name}.'
                          : 'Imported ${renderedQuestions.length} question${renderedQuestions.length == 1 ? '' : 's'} from ${file.name}. Trace: ${imported.debugLogId}',
                    ),
                  ),
                );
              } catch (error) {
                if (!context.mounted) {
                  return;
                }
                debugPrint('Paper import failed: $error');
                final message = error is ApiException
                    ? error.message
                    : error.toString();
                final debug = error is ApiException
                    ? (error.data?['debug'] as Map?)?.cast<String, dynamic>()
                    : null;
                final traceId = debug?['logId']?.toString();
                await showDialog<void>(
                  context: context,
                  builder: (dialogContext) => AlertDialog(
                    title: const Text('Import failed'),
                    content: SingleChildScrollView(
                      child: SelectableText(
                        traceId == null ? message : '$message\n\nTrace: $traceId',
                        style: Theme.of(dialogContext).textTheme.bodyMedium,
                      ),
                    ),
                    actions: [
                      TextButton(
                        onPressed: () => Navigator.of(dialogContext).pop(),
                        child: const Text('Close'),
                      ),
                    ],
                  ),
                );
              } finally {
                if (context.mounted) {
                  setState(() => importing = false);
                }
            }
          }

          return AlertDialog(
            title: Text(existingPaper == null ? 'Add paper to ${course.title}' : 'Edit paper in ${course.title}'),
            content: SizedBox(
              width: 1120,
              height: 760,
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Wrap(
                    spacing: 12,
                    runSpacing: 12,
                    children: [
                      _EditorStatCard(
                        label: 'Questions in draft',
                        value: '${draftQuestions.length}',
                        hint: selectedDraftIndex == null
                            ? 'Creating a new question'
                            : 'Editing question ${selectedDraftIndex! + 1}',
                        accent: MeritTheme.secondary,
                      ),
                      _EditorStatCard(
                        label: 'Paper duration',
                        value: '${int.tryParse(duration.text.trim()) ?? 30} mins',
                        hint: 'Student timer',
                        accent: MeritTheme.primary,
                      ),
                      _EditorStatCard(
                        label: 'Preview access',
                        value: isFreePreview ? 'Free paper' : 'Paid paper',
                        hint: isFreePreview ? 'Visible before purchase' : 'Unlock after payment',
                        accent: MeritTheme.accent,
                      ),
                    ],
                  ),
                  const SizedBox(height: 16),
                  Expanded(
                    child: Row(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Expanded(
                          flex: 7,
                          child: SingleChildScrollView(
                            padding: const EdgeInsets.only(right: 12),
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                _PaperSetupCard(
                                  titleController: title,
                                  durationController: duration,
                                  instructionsController: instructions,
                                  isFreePreview: isFreePreview,
                                  importing: importing,
                                  onTogglePreview: (value) => setState(() => isFreePreview = value),
                                  onImport: importPaperFromFile,
                                ),
                                const SizedBox(height: 16),
                                _QuestionComposerCard(
                                  sectionController: section,
                                  questionController: questionText,
                                  optionAController: optionA,
                                  optionBController: optionB,
                                  optionCController: optionC,
                                  optionDController: optionD,
                                  activeField: activeField,
                                  answerIndex: answerIndex,
                                  isEditing: selectedDraftIndex != null,
                                  editingLabel: selectedDraftIndex == null
                                      ? null
                                      : 'Editing question ${selectedDraftIndex! + 1}',
                                  onActiveFieldChanged: (value) => setState(() => activeField = value),
                                  onSectionChanged: () => setState(() {}),
                                  onQuestionChanged: () => setState(() {}),
                                  onOptionChanged: () => setState(() {}),
                                  onAnswerChanged: (value) => setState(() => answerIndex = value),
                                  snippets: _mathSnippets,
                                  onSnippetTap: insertSnippet,
                                  onSaveQuestion: upsertDraftQuestion,
                                  onResetComposer: () => setState(resetQuestionComposer),
                                ),
                                const SizedBox(height: 16),
                                const _MathAuthoringGuide(),
                              ],
                            ),
                          ),
                        ),
                        Expanded(
                          flex: 4,
                          child: _DraftNavigatorCard(
                            draftQuestions: draftQuestions,
                            selectedDraftIndex: selectedDraftIndex,
                            onSelect: (index) => setState(() => loadDraftQuestion(index)),
                            onRemove: (index) => setState(() {
                              draftQuestions.removeAt(index);
                              if (selectedDraftIndex == index) {
                                resetQuestionComposer();
                              } else if (selectedDraftIndex != null && selectedDraftIndex! > index) {
                                selectedDraftIndex = selectedDraftIndex! - 1;
                              }
                            }),
                            onPrevious: selectedDraftIndex != null && selectedDraftIndex! > 0
                                ? () => setState(() => loadDraftQuestion(selectedDraftIndex! - 1))
                                : null,
                            onNext: selectedDraftIndex != null && selectedDraftIndex! < draftQuestions.length - 1
                                ? () => setState(() => loadDraftQuestion(selectedDraftIndex! + 1))
                                : null,
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
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
                    if (selectedDraftIndex == null) {
                      stagedQuestions.add(currentDraft);
                    } else {
                      stagedQuestions[selectedDraftIndex!] = currentDraft;
                    }
                  }
                  if (stagedQuestions.isEmpty) {
                    ScaffoldMessenger.of(context).showSnackBar(
                      const SnackBar(content: Text('Add at least one question before saving the paper.')),
                    );
                    return;
                  }
                  final normalizedInstructions = instructions.text
                      .split('\n')
                      .map((line) => line.trim())
                      .where((line) => line.isNotEmpty)
                      .toList();
                  if (existingPaper == null) {
                    await controller.addPaper(
                      courseId: course.id,
                      title: title.text.trim(),
                      durationMinutes: int.tryParse(duration.text.trim()) ?? 30,
                      isFreePreview: isFreePreview,
                      instructions: normalizedInstructions,
                      questions: stagedQuestions,
                    );
                  } else {
                    await controller.updatePaper(
                      paperId: existingPaper.id,
                      courseId: course.id,
                      title: title.text.trim(),
                      durationMinutes: int.tryParse(duration.text.trim()) ?? 30,
                      isFreePreview: isFreePreview,
                      instructions: normalizedInstructions,
                      questions: stagedQuestions,
                    );
                  }
                  if (!context.mounted) {
                    return;
                  }
                  Navigator.pop(context);
                },
                child: Text(existingPaper == null ? 'Add paper' : 'Save changes'),
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
                        icon: const Icon(Icons.cloud_upload_outlined),
                        label: const Text('Upload to Bunny'),
                      ),
                      const SizedBox(width: 12),
                      OutlinedButton.icon(
                        onPressed: () => _setCourseVideoUrl(context, course),
                        icon: const Icon(Icons.link_outlined),
                        label: const Text('Set URL manually'),
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
                    (paper) => Container(
                      margin: const EdgeInsets.only(bottom: 12),
                      padding: const EdgeInsets.all(16),
                      decoration: BoxDecoration(
                        color: MeritTheme.background,
                        borderRadius: BorderRadius.circular(18),
                        border: Border.all(color: MeritTheme.border),
                      ),
                      child: Row(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Row(
                                  children: [
                                    Expanded(
                                      child: Text(
                                        paper.title,
                                        style: Theme.of(context).textTheme.titleMedium,
                                      ),
                                    ),
                                    if (paper.isFreePreview)
                                      Container(
                                        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                                        decoration: BoxDecoration(
                                          color: MeritTheme.accent.withValues(alpha: 0.14),
                                          borderRadius: BorderRadius.circular(999),
                                        ),
                                        child: const Text('Free'),
                                      ),
                                  ],
                                ),
                                const SizedBox(height: 8),
                                Wrap(
                                  spacing: 8,
                                  runSpacing: 8,
                                  children: [
                                    _PaperMetaChip(label: '${paper.durationMinutes} mins'),
                                    _PaperMetaChip(label: '${paper.questions.length} questions'),
                                    if (paper.instructions.isNotEmpty)
                                      _PaperMetaChip(label: '${paper.instructions.length} instructions'),
                                  ],
                                ),
                              ],
                            ),
                          ),
                          const SizedBox(width: 16),
                          OutlinedButton.icon(
                            onPressed: () => _openPaperDialog(context, course, existingPaper: paper),
                            icon: const Icon(Icons.edit_outlined),
                            label: const Text('Edit'),
                          ),
                        ],
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

class _EditorStatCard extends StatelessWidget {
  const _EditorStatCard({
    required this.label,
    required this.value,
    required this.hint,
    required this.accent,
  });

  final String label;
  final String value;
  final String hint;
  final Color accent;

  @override
  Widget build(BuildContext context) {
    return Container(
      width: 220,
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(22),
        border: Border.all(color: MeritTheme.border),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(label, style: Theme.of(context).textTheme.bodyMedium),
          const SizedBox(height: 8),
          Text(
            value,
            style: Theme.of(context).textTheme.titleLarge?.copyWith(color: accent),
          ),
          const SizedBox(height: 4),
          Text(hint, style: Theme.of(context).textTheme.bodySmall),
        ],
      ),
    );
  }
}

class _PaperMetaChip extends StatelessWidget {
  const _PaperMetaChip({required this.label});

  final String label;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(999),
        border: Border.all(color: MeritTheme.border),
      ),
      child: Text(label, style: Theme.of(context).textTheme.bodySmall),
    );
  }
}

class _PaperSetupCard extends StatelessWidget {
  const _PaperSetupCard({
    required this.titleController,
    required this.durationController,
    required this.instructionsController,
    required this.isFreePreview,
    required this.importing,
    required this.onTogglePreview,
    required this.onImport,
  });

  final TextEditingController titleController;
  final TextEditingController durationController;
  final TextEditingController instructionsController;
  final bool isFreePreview;
  final bool importing;
  final ValueChanged<bool> onTogglePreview;
  final Future<void> Function() onImport;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(24),
        border: Border.all(color: MeritTheme.border),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text('Paper setup', style: Theme.of(context).textTheme.titleLarge),
          const SizedBox(height: 14),
          Row(
            children: [
              Expanded(
                flex: 3,
                child: TextField(
                  controller: titleController,
                  decoration: const InputDecoration(labelText: 'Paper title'),
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: TextField(
                  controller: durationController,
                  decoration: const InputDecoration(labelText: 'Duration (minutes)'),
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          TextField(
            controller: instructionsController,
            maxLines: 3,
            decoration: const InputDecoration(labelText: 'Instructions (one per line)'),
          ),
          const SizedBox(height: 12),
          Row(
            children: [
              Expanded(
                child: SwitchListTile.adaptive(
                  contentPadding: EdgeInsets.zero,
                  value: isFreePreview,
                  onChanged: onTogglePreview,
                  title: const Text('Free preview paper'),
                  subtitle: const Text('Mark this paper as available before purchase.'),
                ),
              ),
              const SizedBox(width: 16),
              OutlinedButton.icon(
                onPressed: importing ? null : onImport,
                icon: const Icon(Icons.upload_file_outlined),
                label: Text(importing ? 'Importing...' : 'Import Word/TXT'),
              ),
            ],
          ),
          const SizedBox(height: 8),
          Text(
            'Import fills the draft panel on the right. Review or edit imported questions before saving the paper.',
            style: Theme.of(context).textTheme.bodySmall,
          ),
        ],
      ),
    );
  }
}

class _QuestionComposerCard extends StatelessWidget {
  const _QuestionComposerCard({
    required this.sectionController,
    required this.questionController,
    required this.optionAController,
    required this.optionBController,
    required this.optionCController,
    required this.optionDController,
    required this.activeField,
    required this.answerIndex,
    required this.isEditing,
    required this.editingLabel,
    required this.onActiveFieldChanged,
    required this.onSectionChanged,
    required this.onQuestionChanged,
    required this.onOptionChanged,
    required this.onAnswerChanged,
    required this.snippets,
    required this.onSnippetTap,
    required this.onSaveQuestion,
    required this.onResetComposer,
  });

  final TextEditingController sectionController;
  final TextEditingController questionController;
  final TextEditingController optionAController;
  final TextEditingController optionBController;
  final TextEditingController optionCController;
  final TextEditingController optionDController;
  final String activeField;
  final int answerIndex;
  final bool isEditing;
  final String? editingLabel;
  final ValueChanged<String> onActiveFieldChanged;
  final VoidCallback onSectionChanged;
  final VoidCallback onQuestionChanged;
  final VoidCallback onOptionChanged;
  final ValueChanged<int> onAnswerChanged;
  final List<_MathSnippet> snippets;
  final ValueChanged<String> onSnippetTap;
  final Future<void> Function() onSaveQuestion;
  final VoidCallback onResetComposer;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(24),
        border: Border.all(color: MeritTheme.border),
      ),
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
                      isEditing ? editingLabel ?? 'Edit question' : 'Compose question',
                      style: Theme.of(context).textTheme.titleLarge,
                    ),
                    const SizedBox(height: 4),
                    Text(
                      isEditing
                          ? 'Update the selected draft question or clear the form to create a new one.'
                          : 'Build one question at a time and push it into the draft navigator.',
                      style: Theme.of(context).textTheme.bodyMedium,
                    ),
                  ],
                ),
              ),
              if (isEditing)
                TextButton.icon(
                  onPressed: onResetComposer,
                  icon: const Icon(Icons.add_circle_outline),
                  label: const Text('New question'),
                ),
            ],
          ),
          const SizedBox(height: 16),
          TextField(
            controller: sectionController,
            onChanged: (_) => onSectionChanged(),
            decoration: const InputDecoration(labelText: 'Question section'),
          ),
          const SizedBox(height: 16),
          _SnippetPanel(
            activeField: activeField,
            snippets: snippets,
            onSnippetTap: onSnippetTap,
          ),
          const SizedBox(height: 12),
          TextField(
            controller: questionController,
            onTap: () => onActiveFieldChanged('question'),
            onChanged: (_) => onQuestionChanged(),
            maxLines: 4,
            decoration: const InputDecoration(
              labelText: 'Question text',
              helperText: 'Paste LaTeX-style text or Unicode math directly. The preview below matches the student app.',
            ),
          ),
          const SizedBox(height: 16),
          Row(
            children: [
              Expanded(
                child: TextField(
                  controller: optionAController,
                  onTap: () => onActiveFieldChanged('a'),
                  onChanged: (_) => onOptionChanged(),
                  decoration: const InputDecoration(labelText: 'Option A'),
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: TextField(
                  controller: optionBController,
                  onTap: () => onActiveFieldChanged('b'),
                  onChanged: (_) => onOptionChanged(),
                  decoration: const InputDecoration(labelText: 'Option B'),
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          Row(
            children: [
              Expanded(
                child: TextField(
                  controller: optionCController,
                  onTap: () => onActiveFieldChanged('c'),
                  onChanged: (_) => onOptionChanged(),
                  decoration: const InputDecoration(labelText: 'Option C'),
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: TextField(
                  controller: optionDController,
                  onTap: () => onActiveFieldChanged('d'),
                  onChanged: (_) => onOptionChanged(),
                  decoration: const InputDecoration(labelText: 'Option D'),
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          Row(
            children: [
              Expanded(
                child: DropdownButtonFormField<int>(
                  value: answerIndex,
                  decoration: const InputDecoration(labelText: 'Correct option'),
                  items: const [
                    DropdownMenuItem(value: 0, child: Text('A')),
                    DropdownMenuItem(value: 1, child: Text('B')),
                    DropdownMenuItem(value: 2, child: Text('C')),
                    DropdownMenuItem(value: 3, child: Text('D')),
                  ],
                  onChanged: (value) => onAnswerChanged(value ?? 0),
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Container(
                  padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
                  decoration: BoxDecoration(
                    color: MeritTheme.primarySoft,
                    borderRadius: BorderRadius.circular(18),
                    border: Border.all(color: MeritTheme.border),
                  ),
                  child: Text(
                    'Current answer: ${String.fromCharCode(65 + answerIndex)}',
                    style: Theme.of(context).textTheme.titleMedium,
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 16),
          _StudentQuestionPreviewCard(
            section: sectionController.text,
            prompt: questionController.text,
            options: [
              optionAController.text,
              optionBController.text,
              optionCController.text,
              optionDController.text,
            ],
            correctIndex: answerIndex,
          ),
          const SizedBox(height: 16),
          Row(
            children: [
              ElevatedButton.icon(
                onPressed: onSaveQuestion,
                icon: Icon(isEditing ? Icons.save_outlined : Icons.playlist_add_rounded),
                label: Text(isEditing ? 'Update question' : 'Add question'),
              ),
              const SizedBox(width: 12),
              OutlinedButton.icon(
                onPressed: onResetComposer,
                icon: const Icon(Icons.refresh_rounded),
                label: const Text('Clear form'),
              ),
            ],
          ),
        ],
      ),
    );
  }
}

class _DraftNavigatorCard extends StatelessWidget {
  const _DraftNavigatorCard({
    required this.draftQuestions,
    required this.selectedDraftIndex,
    required this.onSelect,
    required this.onRemove,
    required this.onPrevious,
    required this.onNext,
  });

  final List<Question> draftQuestions;
  final int? selectedDraftIndex;
  final ValueChanged<int> onSelect;
  final ValueChanged<int> onRemove;
  final VoidCallback? onPrevious;
  final VoidCallback? onNext;

  @override
  Widget build(BuildContext context) {
    return Container(
      height: double.infinity,
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(24),
        border: Border.all(color: MeritTheme.border),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text('Paper draft', style: Theme.of(context).textTheme.titleLarge),
                    const SizedBox(height: 4),
                    Text(
                      '${draftQuestions.length} question${draftQuestions.length == 1 ? '' : 's'} added. Select any question to edit it.',
                      style: Theme.of(context).textTheme.bodyMedium,
                    ),
                  ],
                ),
              ),
              Row(
                children: [
                  IconButton(onPressed: onPrevious, icon: const Icon(Icons.chevron_left_rounded)),
                  IconButton(onPressed: onNext, icon: const Icon(Icons.chevron_right_rounded)),
                ],
              ),
            ],
          ),
          const SizedBox(height: 16),
          if (draftQuestions.isEmpty)
            Expanded(
              child: Container(
                width: double.infinity,
                padding: const EdgeInsets.all(20),
                decoration: BoxDecoration(
                  color: MeritTheme.background,
                  borderRadius: BorderRadius.circular(20),
                  border: Border.all(color: MeritTheme.border),
                ),
                child: const Text(
                  'No questions added yet. Import a paper or compose one question at a time from the editor.',
                ),
              ),
            )
          else
            Expanded(
              child: ListView.separated(
                itemCount: draftQuestions.length,
                separatorBuilder: (_, __) => const SizedBox(height: 12),
                itemBuilder: (context, index) => _DraftQuestionCard(
                  index: index,
                  question: draftQuestions[index],
                  selected: selectedDraftIndex == index,
                  onSelect: () => onSelect(index),
                  onRemove: () => onRemove(index),
                ),
              ),
            ),
        ],
      ),
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

class _QuotaCard extends StatelessWidget {
  const _QuotaCard({required this.item});

  final _QuotaItem item;

  @override
  Widget build(BuildContext context) {
    final numberFormat = NumberFormat.compact();
    final left = item.freeTier - item.estimatedUsage;
    final ratio = item.freeTier <= 0 ? 0.0 : (item.estimatedUsage / item.freeTier).clamp(0.0, 1.0);
    final safe = left >= 0;

    return SizedBox(
      width: 320,
      child: Container(
        padding: const EdgeInsets.all(18),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(20),
          border: Border.all(color: MeritTheme.border),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Expanded(
                  child: Text(
                    item.title,
                    style: Theme.of(context).textTheme.titleMedium,
                  ),
                ),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                  decoration: BoxDecoration(
                    color: safe
                        ? MeritTheme.success.withValues(alpha: 0.12)
                        : const Color(0xFFFFF3E0),
                    borderRadius: BorderRadius.circular(999),
                  ),
                  child: Text(
                    safe ? 'Within free tier' : 'Billable soon',
                    style: Theme.of(context).textTheme.labelMedium,
                  ),
                ),
              ],
            ),
            const SizedBox(height: 12),
            Text(
              '${numberFormat.format(item.estimatedUsage)} ${item.unit}',
              style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                    color: MeritTheme.secondary,
                  ),
            ),
            const SizedBox(height: 4),
            Text('Estimated monthly usage'),
            const SizedBox(height: 12),
            ClipRRect(
              borderRadius: BorderRadius.circular(999),
              child: LinearProgressIndicator(
                value: ratio,
                minHeight: 8,
                backgroundColor: MeritTheme.primarySoft,
                color: safe ? MeritTheme.primary : Colors.orange.shade700,
              ),
            ),
            const SizedBox(height: 12),
            Text('Free tier: ${numberFormat.format(item.freeTier)} ${item.unit}'),
            const SizedBox(height: 4),
            Text(
              safe
                  ? 'Left before billing: ${numberFormat.format(left)} ${item.unit}'
                  : 'Above free tier by ${numberFormat.format(left.abs())} ${item.unit}',
            ),
            if (item.note != null) ...[
              const SizedBox(height: 10),
              Text(
                item.note!,
                style: Theme.of(context).textTheme.bodySmall,
              ),
            ],
          ],
        ),
      ),
    );
  }
}

class _PlatformQuotaEstimate {
  const _PlatformQuotaEstimate({
    required this.items,
    required this.projectedBillableMetrics,
  });

  final List<_QuotaItem> items;
  final int projectedBillableMetrics;

  factory _PlatformQuotaEstimate.fromController(AppController controller) {
    final totalQuestions = controller.papers.fold<int>(
      0,
      (sum, paper) => sum + paper.questions.length,
    );
    final totalDocuments = controller.students.length +
        controller.affiliates.length +
        controller.courses.length +
        controller.papers.length +
        totalQuestions +
        controller.purchases.length +
        controller.attempts.length +
        controller.supportMessages.length;

    final firestoreStorageGiB = totalDocuments * 0.0000025;
    final firestoreReads = (controller.activeUsers * (controller.courses.length + controller.papers.length + 12)) +
        (controller.attempts.length * 18) +
        (controller.purchases.length * 12) +
        (totalQuestions * 2) +
        400;
    final firestoreWrites = controller.students.length +
        controller.affiliates.length +
        controller.courses.length +
        controller.papers.length +
        totalQuestions +
        (controller.purchases.length * 2) +
        (controller.attempts.length * 2) +
        controller.supportMessages.length;
    final firestoreDeletes = 0;
    final authMaus = controller.activeUsers;
    final functionInvocations = controller.purchases.length * 2;
    final functionGbSeconds = functionInvocations * 0.08;
    final functionNetworkingGb = functionInvocations * 0.00015;
    final hostingTransferGb = (controller.activeUsers * 0.012).clamp(0, 10 << 20).toDouble();

    final items = <_QuotaItem>[
      _QuotaItem(
        title: 'Firestore storage',
        estimatedUsage: firestoreStorageGiB,
        freeTier: 1,
        unit: 'GiB',
        note: 'Question banks are cheap to store. External video hosting keeps this near zero.',
      ),
      _QuotaItem(
        title: 'Firestore reads',
        estimatedUsage: firestoreReads.toDouble(),
        freeTier: 1500000,
        unit: 'reads',
      ),
      _QuotaItem(
        title: 'Firestore writes',
        estimatedUsage: firestoreWrites.toDouble(),
        freeTier: 600000,
        unit: 'writes',
      ),
      _QuotaItem(
        title: 'Firestore deletes',
        estimatedUsage: firestoreDeletes.toDouble(),
        freeTier: 600000,
        unit: 'deletes',
      ),
      _QuotaItem(
        title: 'Authentication MAUs',
        estimatedUsage: authMaus.toDouble(),
        freeTier: 50000,
        unit: 'MAUs',
        note: 'Google sign-in is the cheapest path. Phone OTP still adds SMS cost separately.',
      ),
      _QuotaItem(
        title: 'Cloud Functions invocations',
        estimatedUsage: functionInvocations.toDouble(),
        freeTier: 2000000,
        unit: 'calls',
      ),
      _QuotaItem(
        title: 'Cloud Functions GB-seconds',
        estimatedUsage: functionGbSeconds,
        freeTier: 400000,
        unit: 'GB-s',
      ),
      _QuotaItem(
        title: 'Functions networking egress',
        estimatedUsage: functionNetworkingGb,
        freeTier: 5,
        unit: 'GB',
      ),
      _QuotaItem(
        title: 'Hosting transfer',
        estimatedUsage: hostingTransferGb,
        freeTier: 10,
        unit: 'GB',
        note: 'Relevant if you host the admin dashboard from the VM or a static host behind the same domain.',
      ),
    ];

    return _PlatformQuotaEstimate(
      items: items,
      projectedBillableMetrics: items.where((item) => item.estimatedUsage > item.freeTier).length,
    );
  }
}

class _QuotaItem {
  const _QuotaItem({
    required this.title,
    required this.estimatedUsage,
    required this.freeTier,
    required this.unit,
    this.note,
  });

  final String title;
  final double estimatedUsage;
  final double freeTier;
  final String unit;
  final String? note;
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
                      const Text('Paste raw LaTeX-style text from Gemini output directly.'),
          const SizedBox(height: 6),
          const Text(
            r'Examples: \frac{a}{b}, \int_0^1 x^2 \, dx, \lim_{x \to 0}, \det \begin{bmatrix} ... \end{bmatrix}',
          ),
          const SizedBox(height: 6),
          const Text(
            'Unicode math also works well, for example: Where matrix A is:\n┌  2/3   x/4  ┐\n└  1/2   5/6  ┘',
          ),
            const SizedBox(height: 6),
            const Text(
              'Best-effort import supports common exam paper formats such as:\n'
              '1. Matrices\n'
              'Question text...\n'
              '(A) ...\n'
              '(B) ...\n'
              '(C) ...\n'
              '(D) ...\n'
              '...\n'
              'Answer Key\n'
              '1 (B)\n'
              '2 (A)',
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
    required this.selected,
    required this.onSelect,
    required this.onRemove,
  });

  final int index;
  final Question question;
  final bool selected;
  final VoidCallback onSelect;
  final VoidCallback onRemove;

  @override
  Widget build(BuildContext context) {
    final normalizedPrompt = MathContentParser.normalizeSourceText(question.prompt);
    final normalizedOptions = question.options
        .map(MathContentParser.normalizeSourceText)
        .toList(growable: false);

    return InkWell(
      onTap: onSelect,
      borderRadius: BorderRadius.circular(18),
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 180),
        width: double.infinity,
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: selected ? MeritTheme.primarySoft : Colors.white,
          borderRadius: BorderRadius.circular(18),
          border: Border.all(color: selected ? MeritTheme.primary : MeritTheme.border),
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
                if (selected)
                  Container(
                    margin: const EdgeInsets.only(right: 8),
                    padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                    decoration: BoxDecoration(
                      color: Colors.white,
                      borderRadius: BorderRadius.circular(999),
                    ),
                    child: const Text('Editing'),
                  ),
                IconButton(
                  onPressed: onRemove,
                  icon: const Icon(Icons.delete_outline_rounded),
                ),
              ],
            ),
            FutureBuilder<List<MathContentSegment>>(
              future: renderMathSegments(normalizedPrompt),
              builder: (context, snapshot) => RichMathContentView(
                rawText: normalizedPrompt,
                segments: snapshot.data,
                compact: !selected,
              ),
            ),
            const SizedBox(height: 10),
            ...List.generate(normalizedOptions.length, (optionIndex) {
              final option = normalizedOptions[optionIndex];
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
                      child: FutureBuilder<List<MathContentSegment>>(
                        future: renderMathSegments(option),
                        builder: (context, snapshot) => RichMathContentView(
                          rawText: option,
                          segments: snapshot.data,
                          compact: !selected,
                          style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                                fontWeight: correct ? FontWeight.w700 : FontWeight.w400,
                                color: correct ? MeritTheme.secondary : null,
                              ),
                        ),
                      ),
                    ),
                  ],
                ),
              );
            }),
          ],
        ),
      ),
    );
  }
}

class _StudentQuestionPreviewCard extends StatelessWidget {
  const _StudentQuestionPreviewCard({
    required this.section,
    required this.prompt,
    required this.options,
    required this.correctIndex,
  });

  final String section;
  final String prompt;
  final List<String> options;
  final int correctIndex;

  @override
  Widget build(BuildContext context) {
    final normalizedPrompt = MathContentParser.normalizeSourceText(prompt);
    final normalizedOptions = options
        .map(MathContentParser.normalizeSourceText)
        .toList(growable: false);
    final safeOptions = normalizedOptions.length >= 4
        ? normalizedOptions
        : [...normalizedOptions, ...List.filled(4 - normalizedOptions.length, '')];

    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(18),
      decoration: BoxDecoration(
        color: MeritTheme.background,
        borderRadius: BorderRadius.circular(22),
        border: Border.all(color: MeritTheme.border),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Text(
                'Student preview',
                style: Theme.of(context).textTheme.titleMedium?.copyWith(
                      color: MeritTheme.secondary,
                    ),
              ),
              const Spacer(),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                decoration: BoxDecoration(
                  color: MeritTheme.primarySoft,
                  borderRadius: BorderRadius.circular(999),
                ),
                child: Text(
                  section.trim().isEmpty ? 'No section' : section.trim(),
                  style: Theme.of(context).textTheme.labelLarge,
                ),
              ),
            ],
          ),
          const SizedBox(height: 14),
          Card(
            child: Padding(
              padding: const EdgeInsets.all(20),
              child: FutureBuilder<List<MathContentSegment>>(
                future: renderMathSegments(normalizedPrompt),
                builder: (context, snapshot) {
                  return RichMathContentView(
                    rawText: normalizedPrompt,
                    segments: snapshot.data,
                  );
                },
              ),
            ),
          ),
          const SizedBox(height: 12),
          ...List.generate(4, (index) {
            final option = safeOptions[index];
            final selected = index == correctIndex;

            return Padding(
              padding: const EdgeInsets.only(bottom: 12),
              child: Material(
                color: selected ? MeritTheme.primarySoft : Colors.white,
                borderRadius: BorderRadius.circular(22),
                child: InkWell(
                  borderRadius: BorderRadius.circular(22),
                  onTap: null,
                  child: Container(
                    padding: const EdgeInsets.all(18),
                    decoration: BoxDecoration(
                      borderRadius: BorderRadius.circular(22),
                      border: Border.all(
                        color: selected ? MeritTheme.primary : MeritTheme.border,
                      ),
                    ),
                    child: Row(
                      children: [
                        Container(
                          width: 40,
                          height: 40,
                          decoration: BoxDecoration(
                            color: selected ? MeritTheme.primary : MeritTheme.primarySoft,
                            shape: BoxShape.circle,
                          ),
                          alignment: Alignment.center,
                          child: Text(
                            String.fromCharCode(65 + index),
                            style: Theme.of(context).textTheme.titleMedium?.copyWith(
                                  color: selected ? Colors.white : MeritTheme.secondary,
                                  fontWeight: FontWeight.w700,
                                ),
                          ),
                        ),
                        const SizedBox(width: 14),
                        Expanded(
                          child: FutureBuilder<List<MathContentSegment>>(
                            future: renderMathSegments(option),
                            builder: (context, snapshot) {
                              return RichMathContentView(
                                rawText: option,
                                segments: snapshot.data,
                              );
                            },
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
              ),
            );
          }),
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
