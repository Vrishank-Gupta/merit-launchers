import '../../app/api_client.dart';
import '../../app/backend_config.dart';

class PaperImportDraftQuestionDto {
  const PaperImportDraftQuestionDto({
    required this.id,
    required this.sortOrder,
    required this.questionNumber,
    required this.section,
    required this.prompt,
    required this.promptSegments,
    required this.attachments,
    required this.options,
    required this.optionSegments,
    required this.correctIndex,
    required this.explanation,
    required this.topic,
    required this.concepts,
    required this.difficulty,
    required this.reviewState,
    required this.confidence,
    required this.parserNotes,
  });

  final String id;
  final int sortOrder;
  final String? questionNumber;
  final String section;
  final String prompt;
  final List<dynamic> promptSegments;
  final List<dynamic> attachments;
  final List<String> options;
  final List<dynamic> optionSegments;
  final int correctIndex;
  final String? explanation;
  final String? topic;
  final List<String> concepts;
  final String difficulty;
  final String reviewState;
  final double? confidence;
  final List<String> parserNotes;

  factory PaperImportDraftQuestionDto.fromJson(Map<String, dynamic> json) {
    return PaperImportDraftQuestionDto(
      id: (json['id'] as String?) ?? '',
      sortOrder: (json['sortOrder'] as num?)?.toInt() ?? 0,
      questionNumber: json['questionNumber']?.toString(),
      section: (json['section'] as String?) ?? 'General',
      prompt: (json['prompt'] as String?) ?? '',
      promptSegments: (json['promptSegments'] as List<dynamic>? ?? const []),
      attachments: (json['attachments'] as List<dynamic>? ?? const []),
      options: (json['options'] as List<dynamic>? ?? const []).map((item) => item.toString()).toList(),
      optionSegments: (json['optionSegments'] as List<dynamic>? ?? const []),
      correctIndex: (json['correctIndex'] as num?)?.toInt() ?? -1,
      explanation: json['explanation'] as String?,
      topic: json['topic'] as String?,
      concepts: (json['concepts'] as List<dynamic>? ?? const []).map((item) => item.toString()).toList(),
      difficulty: (json['difficulty'] as String?) ?? 'medium',
      reviewState: (json['reviewState'] as String?) ?? 'parsed',
      confidence: (json['confidence'] as num?)?.toDouble(),
      parserNotes: (json['parserNotes'] as List<dynamic>? ?? const []).map((item) => item.toString()).toList(),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'sortOrder': sortOrder,
      'questionNumber': questionNumber,
      'section': section,
      'prompt': prompt,
      'promptSegments': promptSegments,
      'attachments': attachments,
      'options': options,
      'optionSegments': optionSegments,
      'correctIndex': correctIndex,
      'explanation': explanation,
      'topic': topic,
      'concepts': concepts,
      'difficulty': difficulty,
      'reviewState': reviewState,
      'confidence': confidence,
      'parserNotes': parserNotes,
    };
  }
}

class PaperImportDraftDto {
  const PaperImportDraftDto({
    required this.id,
    required this.fileName,
    required this.fileType,
    required this.importMode,
    required this.title,
    required this.courseId,
    required this.subjectId,
    required this.sourceKind,
    required this.parseStatus,
    required this.confidenceSummary,
    required this.instructions,
    required this.meta,
    required this.questionCount,
    required this.questions,
    required this.createdAt,
    required this.updatedAt,
    this.debugLogId,
    this.debugFilePath,
  });

  final String id;
  final String fileName;
  final String fileType;
  final String importMode;
  final String title;
  final String? courseId;
  final String? subjectId;
  final String sourceKind;
  final String parseStatus;
  final Map<String, dynamic> confidenceSummary;
  final List<String> instructions;
  final Map<String, dynamic> meta;
  final int questionCount;
  final List<PaperImportDraftQuestionDto> questions;
  final DateTime? createdAt;
  final DateTime? updatedAt;
  final String? debugLogId;
  final String? debugFilePath;

  factory PaperImportDraftDto.fromJson(Map<String, dynamic> json) {
    final debug = (json['debug'] as Map?)?.cast<String, dynamic>() ?? const <String, dynamic>{};
    final questions = (json['questions'] as List<dynamic>? ?? const [])
        .map((item) => PaperImportDraftQuestionDto.fromJson(Map<String, dynamic>.from(item as Map)))
        .toList();
    return PaperImportDraftDto(
      id: (json['id'] as String?) ?? '',
      fileName: (json['fileName'] as String?) ?? '',
      fileType: (json['fileType'] as String?) ?? '',
      importMode: (json['importMode'] as String?) ?? 'auto',
      title: (json['title'] as String?) ?? 'Imported Paper',
      courseId: json['courseId'] as String?,
      subjectId: json['subjectId'] as String?,
      sourceKind: (json['sourceKind'] as String?) ?? 'upload',
      parseStatus: (json['parseStatus'] as String?) ?? 'draft',
      confidenceSummary: (json['confidenceSummary'] as Map?)?.cast<String, dynamic>() ?? const <String, dynamic>{},
      instructions: (json['instructions'] as List<dynamic>? ?? const []).map((item) => item.toString()).toList(),
      meta: (json['meta'] as Map?)?.cast<String, dynamic>() ?? const <String, dynamic>{},
      questionCount: (json['questionCount'] as num?)?.toInt() ?? questions.length,
      questions: questions,
      createdAt: DateTime.tryParse((json['createdAt'] as String?) ?? ''),
      updatedAt: DateTime.tryParse((json['updatedAt'] as String?) ?? ''),
      debugLogId: debug['logId']?.toString(),
      debugFilePath: debug['filePath']?.toString(),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'fileName': fileName,
      'fileType': fileType,
      'importMode': importMode,
      'title': title,
      'courseId': courseId,
      'subjectId': subjectId,
      'sourceKind': sourceKind,
      'parseStatus': parseStatus,
      'confidenceSummary': confidenceSummary,
      'instructions': instructions,
      'meta': meta,
      'questionCount': questionCount,
      'questions': questions.map((item) => item.toJson()).toList(),
      'debug': {
        'logId': debugLogId,
        'filePath': debugFilePath,
      },
    };
  }
}

class PaperImportDraftsBackend {
  PaperImportDraftsBackend({
    required this.backend,
    required this.token,
  });

  final BackendConfig backend;
  final String? token;

  ApiClient _client() {
    if (!backend.hasApi || backend.apiBaseUrl == null) {
      throw const ApiException('Import drafts are unavailable because the API is not configured.');
    }
    final client = ApiClient(baseUrl: backend.apiBaseUrl!);
    client.setToken(token);
    return client;
  }

  Future<List<PaperImportDraftDto>> listDrafts() async {
    final json = await _client().getJson('/v1/admin/import-drafts', authenticated: true);
    final rows = (json as List<dynamic>? ?? const []);
    return rows
        .map((item) => PaperImportDraftDto.fromJson(Map<String, dynamic>.from(item as Map)))
        .toList();
  }

  Future<PaperImportDraftDto> getDraft(String draftId) async {
    final json = await _client().getJson('/v1/admin/import-drafts/$draftId', authenticated: true);
    return PaperImportDraftDto.fromJson(Map<String, dynamic>.from(json as Map));
  }

  Future<PaperImportDraftDto> createDraft(Map<String, dynamic> payload) async {
    final json = await _client().postJson('/v1/admin/import-drafts', authenticated: true, body: payload);
    return PaperImportDraftDto.fromJson(Map<String, dynamic>.from(json as Map));
  }

  Future<PaperImportDraftDto> updateDraft(String draftId, Map<String, dynamic> payload) async {
    final json = await _client().putJson('/v1/admin/import-drafts/$draftId', authenticated: true, body: payload);
    return PaperImportDraftDto.fromJson(Map<String, dynamic>.from(json as Map));
  }
}
