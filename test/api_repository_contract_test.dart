import 'dart:convert';

import 'package:flutter_test/flutter_test.dart';
import 'package:http/http.dart' as http;
import 'package:merit_launchers/app/api_client.dart';
import 'package:merit_launchers/app/data/api_app_repository.dart';
import 'package:merit_launchers/app/models.dart';
import 'package:merit_launchers/math/math_content.dart';

class _RecordingHttpClient extends http.BaseClient {
  _RecordingHttpClient(this.handler);

  final Future<http.Response> Function(http.BaseRequest request) handler;
  final requests = <http.BaseRequest>[];
  final requestBodies = <String>[];

  @override
  Future<http.StreamedResponse> send(http.BaseRequest request) async {
    requests.add(request);
    if (request is http.Request) {
      requestBodies.add(request.body);
    } else {
      requestBodies.add('');
    }
    final response = await handler(request);
    return http.StreamedResponse(
      Stream.value(response.bodyBytes),
      response.statusCode,
      headers: response.headers,
      request: request,
      reasonPhrase: response.reasonPhrase,
    );
  }
}

void main() {
  group('ApiAppRepository contract', () {
    test('fetchPaper preserves question count, math segments, and images', () async {
      final httpClient = _RecordingHttpClient((request) async {
        expect(request.url.path, '/v1/papers/paper-1');
        return http.Response(
          jsonEncode({
            'id': 'paper-1',
            'courseId': 'cuet',
            'subjectId': 'cuet-accountancy',
            'title': 'Paper 1',
            'durationMinutes': 60,
            'instructions': ['Read carefully'],
            'isFreePreview': true,
            'questionCount': 50,
            'sourceFileUrl': '/toolkit-files/source/paper-1.pdf',
            'sourceFileName': 'paper-1.pdf',
            'questions': [
              {
                'id': 'q1',
                'section': 'Maths',
                'prompt': r'The value of \$x^2\$ is?',
                'promptSegments': [
                  {'type': 'text', 'value': 'The value of ', 'display': false},
                  {'type': 'math', 'value': r'x^2', 'display': false},
                  {'type': 'text', 'value': ' is?', 'display': false},
                ],
                'attachments': [
                  {
                    'url': '/uploads/question.png',
                    'mimeType': 'image/png',
                    'label': 'Question diagram',
                  },
                ],
                'options': [r'\frac{1}{2}', r'\sqrt{x}', '2', '4'],
                'optionSegments': [
                  [
                    {
                      'type': 'math',
                      'value': r'\frac{1}{2}',
                      'display': false,
                    },
                  ],
                  [
                    {
                      'type': 'math',
                      'value': r'\sqrt{x}',
                      'display': false,
                    },
                  ],
                  [
                    {'type': 'text', 'value': '2', 'display': false},
                  ],
                  [
                    {'type': 'text', 'value': '4', 'display': false},
                  ],
                ],
                'optionAttachments': [
                  [
                    {
                      'url': '/uploads/option-a.png',
                      'mimeType': 'image/png',
                      'label': 'Option diagram',
                    },
                  ],
                  [],
                  [],
                  [],
                ],
                'correctIndex': 0,
              },
            ],
          }),
          200,
        );
      });
      final api = ApiClient(baseUrl: 'https://api.test', client: httpClient);
      final repository = ApiAppRepository(api);

      final paper = await repository.fetchPaper('paper-1');

      expect(paper.displayQuestionCount, 1);
      expect(paper.questionCount, 50);
      expect(paper.sourceFileUrl, '/toolkit-files/source/paper-1.pdf');
      expect(paper.questions.single.prompt, r'The value of $x^2$ is?');
      expect(paper.questions.single.promptSegments?[1].isMath, isTrue);
      expect(paper.questions.single.attachments.single.url, '/uploads/question.png');
      expect(
        paper.questions.single.optionAttachments.first.single.url,
        '/uploads/option-a.png',
      );
    });

    test('updatePaper sends source file metadata, math segments, and images', () async {
      final httpClient = _RecordingHttpClient((request) async {
        expect(request.method, 'PUT');
        expect(request.url.path, '/v1/admin/papers/paper-2');
        return http.Response('{"ok":true}', 200);
      });
      final api = ApiClient(baseUrl: 'https://api.test', client: httpClient)
        ..setToken('admin-token');
      final repository = ApiAppRepository(api);

      await repository.updatePaper(
        const Paper(
          id: 'paper-2',
          courseId: 'nda',
          title: 'NDA Paper',
          durationMinutes: 150,
          instructions: ['Instruction'],
          isFreePreview: false,
          sourceFileUrl: '/toolkit-files/source/nda.pdf',
          sourceFileName: 'nda.pdf',
          questions: [
            Question(
              id: 'q1',
              section: 'Mathematics',
              prompt: r'\begin{bmatrix}a&b\\c&d\end{bmatrix}',
              promptSegments: [
                MathContentSegment(
                  type: 'math',
                  value: r'\begin{bmatrix}a&b\\c&d\end{bmatrix}',
                  display: true,
                ),
              ],
              attachments: [
                QuestionAttachment(
                  url: '/uploads/matrix.png',
                  mimeType: 'image/png',
                  label: 'Matrix image',
                ),
              ],
              options: ['0', '1', '2', '3'],
              optionAttachments: [
                [],
                [
                  QuestionAttachment(
                    url: '/uploads/option.png',
                    mimeType: 'image/png',
                    label: 'Option image',
                  ),
                ],
                [],
                [],
              ],
              correctIndex: 1,
            ),
          ],
        ),
      );

      final body = jsonDecode(httpClient.requestBodies.single) as Map<String, dynamic>;
      final paper = body['paper'] as Map<String, dynamic>;
      final question = (body['questions'] as List<dynamic>).single as Map<String, dynamic>;

      expect(paper['sourceFileUrl'], '/toolkit-files/source/nda.pdf');
      expect(paper['sourceFileName'], 'nda.pdf');
      expect(question['promptSegments'], isNotEmpty);
      expect(question['attachments'], isNotEmpty);
      expect(question['optionAttachments'], isNotEmpty);
    });

    test('admin and student workflow endpoints keep their API contracts', () async {
      final seen = <String>[];
      final httpClient = _RecordingHttpClient((request) async {
        seen.add('${request.method} ${request.url.path}');
        final body = request is http.Request && request.body.isNotEmpty
            ? jsonDecode(request.body) as Map<String, dynamic>
            : <String, dynamic>{};

        switch ('${request.method} ${request.url.path}') {
          case 'POST /v1/admin/courses':
            expect(body['id'], 'qa-course');
            return http.Response(jsonEncode(body), 201);
          case 'POST /v1/admin/subjects':
            expect(body['courseId'], 'qa-course');
            return http.Response(jsonEncode(body), 201);
          case 'PUT /v1/admin/subjects/qa-subject':
            expect(body['isPublished'], isFalse);
            return http.Response(jsonEncode({'id': 'qa-subject', ...body}), 200);
          case 'DELETE /v1/admin/subjects/qa-subject':
            return http.Response('{"ok":true}', 200);
          case 'POST /v1/admin/affiliates':
            expect(body['code'], 'QA');
            return http.Response(jsonEncode({...body, 'status': 'active'}), 201);
          case 'PUT /v1/admin/courses/qa-course/video':
            expect(body['videoUrl'], 'https://video.example/intro');
            return http.Response('{"ok":true}', 200);
          case 'GET /v1/admin/allowlist':
            return http.Response(
              jsonEncode({
                'entries': [
                  {
                    'id': 'allow-1',
                    'label': 'QA Admin',
                    'email': 'qa@example.com',
                    'isActive': true,
                    'createdAt': DateTime(2026, 1, 1).toIso8601String(),
                  },
                ],
              }),
              200,
            );
          case 'POST /v1/admin/allowlist':
            expect(body['email'], 'qa@example.com');
            return http.Response(
              jsonEncode({
                'id': 'allow-1',
                'label': body['label'],
                'email': body['email'],
                'isActive': true,
                'createdAt': DateTime(2026, 1, 1).toIso8601String(),
              }),
              201,
            );
          case 'DELETE /v1/admin/allowlist/allow-1':
            return http.Response('{"ok":true}', 200);
          case 'POST /v1/attempts':
            expect(body['score'], 3);
            return http.Response('{"ok":true}', 201);
          case 'POST /v1/exam-sessions':
            expect(body['currentQuestionIndex'], 2);
            return http.Response('{"ok":true}', 201);
          case 'DELETE /v1/exam-sessions/session-1':
            return http.Response('{"ok":true}', 200);
          case 'POST /v1/support-messages':
            expect(body['senderRole'], 'student');
            return http.Response('{"ok":true}', 201);
          case 'PUT /v1/me/profile':
            expect(body['name'], 'QA Student');
            return http.Response(
              jsonEncode({
                'id': 'student-1',
                'name': body['name'],
                'contact': '',
                'city': body['city'],
                'joinedAt': DateTime(2026, 1, 1).toIso8601String(),
                'referralCode': body['referralCode'],
              }),
              200,
            );
        }
        fail('Unexpected request: ${request.method} ${request.url.path}');
      });
      final api = ApiClient(baseUrl: 'https://api.test', client: httpClient)
        ..setToken('admin-token');
      final repository = ApiAppRepository(api);

      await repository.addCourse(
        const Course(
          id: 'qa-course',
          title: 'QA Course',
          subtitle: 'Subtitle',
          description: 'Description',
          price: 499,
          validityDays: 365,
          highlights: ['One'],
        ),
      );
      await repository.addSubject(
        const Subject(id: 'qa-subject', courseId: 'qa-course', title: 'QA Subject'),
      );
      await repository.updateSubject(
        const Subject(
          id: 'qa-subject',
          courseId: 'qa-course',
          title: 'QA Subject Updated',
          isPublished: false,
        ),
      );
      await repository.deleteSubject('qa-subject');
      await repository.addAffiliate(
        const Affiliate(id: 'aff-1', name: 'Affiliate', code: 'QA', channel: 'College'),
      );
      await repository.updateCourseVideo(
        courseId: 'qa-course',
        videoUrl: 'https://video.example/intro',
      );
      expect(await repository.getAdminAllowlist(), hasLength(1));
      await repository.addAdminAllowlistEntry(label: 'QA Admin', email: 'qa@example.com');
      await repository.removeAdminAllowlistEntry('allow-1');
      await repository.saveAttempt(
        ExamAttempt(
          id: 'attempt-1',
          studentId: 'student-1',
          courseId: 'qa-course',
          paperId: 'paper-1',
          answers: const {'q1': 0},
          sectionScores: const {'QA': 3},
          score: 3,
          maxScore: 3,
          submittedAt: DateTime(2026, 1, 1),
        ),
      );
      await repository.saveExamSession(
        ExamSession(
          id: 'session-1',
          studentId: 'student-1',
          courseId: 'qa-course',
          paperId: 'paper-1',
          answers: const {'q1': 0},
          remainingSeconds: 60,
          currentQuestionIndex: 2,
          startedAt: DateTime(2026, 1, 1),
          updatedAt: DateTime(2026, 1, 1),
        ),
      );
      await repository.deleteExamSession('session-1');
      await repository.addSupportMessage(
        SupportMessage(
          id: 'msg-1',
          sender: SenderRole.student,
          message: 'Need help',
          sentAt: DateTime(2026, 1, 1),
          studentId: 'student-1',
        ),
      );
      await repository.saveStudentProfile(
        StudentProfile(
          id: 'student-1',
          name: 'QA Student',
          contact: '',
          city: 'Delhi',
          joinedAt: DateTime(2026, 1, 1),
          referralCode: 'QA',
        ),
      );

      expect(
        seen,
        containsAllInOrder([
          'POST /v1/admin/courses',
          'POST /v1/admin/subjects',
          'PUT /v1/admin/subjects/qa-subject',
          'DELETE /v1/admin/subjects/qa-subject',
          'POST /v1/admin/affiliates',
          'PUT /v1/admin/courses/qa-course/video',
          'GET /v1/admin/allowlist',
          'POST /v1/admin/allowlist',
          'DELETE /v1/admin/allowlist/allow-1',
          'POST /v1/attempts',
          'POST /v1/exam-sessions',
          'DELETE /v1/exam-sessions/session-1',
          'POST /v1/support-messages',
          'PUT /v1/me/profile',
        ]),
      );
    });
  });
}
