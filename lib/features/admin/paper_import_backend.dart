import '../../app/api_client.dart';
import '../../app/backend_config.dart';
import '../../app/models.dart';
import 'paper_import_parser.dart';
import 'dart:convert';
import 'dart:typed_data';

class PaperImportBackend {
  PaperImportBackend({
    required this.backend,
    required this.token,
  });

  final BackendConfig backend;
  final String? token;

  Future<ParsedPaperImport> importWithAi({
    required String fileName,
    required String rawText,
    required Uint8List fileBytes,
  }) async {
    if (!backend.hasApi || backend.apiBaseUrl == null) {
      throw const ApiException('AI import is unavailable because the API is not configured.');
    }

    final client = ApiClient(baseUrl: backend.apiBaseUrl!);
    client.setToken(token);

    final json = await client.postJson(
      '/v1/admin/import-paper',
      authenticated: true,
      body: {
        'fileName': fileName,
        'rawText': rawText,
        'fileBase64': base64Encode(fileBytes),
      },
    );

    final instructions = (json['instructions'] as List<dynamic>? ?? const [])
        .map((item) => item.toString())
        .toList();
    final questions = (json['questions'] as List<dynamic>? ?? const [])
        .map((item) => Map<String, dynamic>.from(item as Map))
        .map(_questionFromJson)
        .toList();

    return ParsedPaperImport(
      title: (json['title'] as String?)?.trim().isNotEmpty == true
          ? (json['title'] as String).trim()
          : 'Imported Paper',
      instructions: instructions,
      questions: questions,
      debugLogId: (json['debug'] as Map?)?['logId']?.toString(),
      debugFilePath: (json['debug'] as Map?)?['filePath']?.toString(),
    );
  }

  Question _questionFromJson(Map<String, dynamic> json) {
    final prompt = _normalizeSourceText(
      (json['prompt'] as String?)?.trim() ?? '',
    );
    final List<String> options = (json['options'] as List<dynamic>? ?? const [])
        .map((item) => _normalizeSourceText(item.toString()))
        .toList();
    final correctIndex = (json['correctIndex'] as num?)?.toInt() ?? 0;

    return Question(
      id: (json['id'] as String?) ?? 'ai-${DateTime.now().microsecondsSinceEpoch}-${json.hashCode}',
      section: (json['section'] as String?)?.trim().isNotEmpty == true
          ? (json['section'] as String).trim()
          : 'General',
      prompt: prompt,
      options: options,
      correctIndex: correctIndex.clamp(0, options.isEmpty ? 0 : options.length - 1),
      explanation: (json['explanation'] as String?)?.trim(),
      topic: (json['topic'] as String?)?.trim().isNotEmpty == true
          ? (json['topic'] as String).trim()
          : null,
      concepts: (json['concepts'] as List<dynamic>? ?? const [])
          .map((item) => item.toString().trim())
          .where((item) => item.isNotEmpty)
          .toList(),
      difficulty: (json['difficulty'] as String?)?.trim().isNotEmpty == true
          ? (json['difficulty'] as String).trim().toLowerCase()
          : 'medium',
    );
  }

  String _normalizeSourceText(String input) {
    return input
        .replaceAll(r'\$', r'$')
        .replaceAll('\r\n', '\n')
        .replaceAll('\r', '\n');
  }
}
