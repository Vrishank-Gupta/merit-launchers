import 'dart:convert';
import 'dart:typed_data';

import 'package:archive/archive.dart';
import 'package:xml/xml.dart';

import '../../app/models.dart';
import '../../math/math_content.dart';

class ParsedPaperImport {
  const ParsedPaperImport({
    required this.title,
    required this.instructions,
    required this.questions,
    this.debugLogId,
    this.debugFilePath,
  });

  final String title;
  final List<String> instructions;
  final List<Question> questions;
  final String? debugLogId;
  final String? debugFilePath;
}

class PaperImportParser {
  static const _optionLetters = ['A', 'B', 'C', 'D'];

  static String extractRawText({
    required String fileName,
    required Uint8List bytes,
  }) {
    final lowerName = fileName.toLowerCase();
    if (lowerName.endsWith('.docx')) {
      return _extractDocxText(bytes);
    }
    if (_usesVisionExtraction(lowerName)) {
      return '';
    }
    return utf8.decode(bytes, allowMalformed: true);
  }

  static Future<ParsedPaperImport> parseFile({
    required String fileName,
    required Uint8List bytes,
  }) async {
    final rawText = extractRawText(
      fileName: fileName,
      bytes: bytes,
    );

    return parsePlainText(rawText, fallbackTitle: _fileTitle(fileName));
  }

  static Future<ParsedPaperImport> parsePlainText(
    String input, {
    required String fallbackTitle,
  }) async {
    final normalized = input.replaceAll('\r\n', '\n').replaceAll('\r', '\n');
    final lines = _expandCompoundLines(normalized)
        .split('\n')
        .map(_normalizeImportLine)
        .where((line) => line.isNotEmpty)
        .toList();
    final answerKey = _extractAnswerKey(lines);

    final instructions = <String>[];
    final questions = <Question>[];
    final buffer = <String>[];
    var startedQuestions = false;

    for (final line in lines) {
      if (_isAnswerKeyStart(line)) {
        break;
      }

      if (_isQuestionStart(line)) {
        startedQuestions = true;
        if (buffer.isNotEmpty) {
          final question = await _parseQuestionBlock(
            buffer,
            answerKey: answerKey,
            questionNumber: questions.length + 1,
          );
          if (question != null) {
            questions.add(question);
          }
          buffer.clear();
        }
      }

      if (startedQuestions) {
        buffer.add(line);
      } else {
        instructions.add(line.trim());
      }
    }

    if (buffer.isNotEmpty) {
      final question = await _parseQuestionBlock(
        buffer,
        answerKey: answerKey,
        questionNumber: questions.length + 1,
      );
      if (question != null) {
        questions.add(question);
      }
    }

    if (questions.isEmpty) {
      questions.addAll(await _parseSequentialAnswerBlocks(lines));
    }

    if (questions.isEmpty) {
      throw const FormatException(
        'No questions could be parsed from this document. Supported inputs include numbered questions, option labels like A/B/C/D or (A)/(B)/(C)/(D), and answer keys at the end.',
      );
    }

    return ParsedPaperImport(
      title: fallbackTitle,
      instructions: instructions,
      questions: questions,
    );
  }

  static String _extractDocxText(Uint8List bytes) {
    final archive = ZipDecoder().decodeBytes(bytes);
    final documentFile = archive.files.firstWhere(
      (file) => file.name == 'word/document.xml',
      orElse: () => throw const FormatException('This .docx file is missing word/document.xml.'),
    );

    final xmlString = utf8.decode(documentFile.content as List<int>, allowMalformed: true);
    final document = XmlDocument.parse(xmlString);
    final lines = <String>[];
    final body = document.findAllElements('w:body').firstOrNull;

    if (body == null) {
      return '';
    }

    for (final node in body.childElements) {
      if (node.name.qualified == 'w:p') {
        final text = _extractParagraphText(node);
        if (text.isNotEmpty) {
          lines.add(text);
        }
        continue;
      }

      if (node.name.qualified == 'w:tbl') {
        for (final row in node.findElements('w:tr')) {
          final cells = row
              .findElements('w:tc')
              .map(
                (cell) => cell.findElements('w:p').map(_extractParagraphText).join(' ').trim(),
              )
              .where((text) => text.isNotEmpty)
              .toList();
          if (cells.isNotEmpty) {
            lines.add(cells.join(' | '));
          }
        }
      }
    }

    return lines.join('\n');
  }

  static String _extractParagraphText(XmlElement paragraph) {
    final buffer = StringBuffer();

    for (final node in paragraph.descendants) {
      if (node is! XmlElement) {
        continue;
      }

      switch (node.name.qualified) {
        case 'w:t':
        case 'm:t':
          buffer.write(node.innerText);
          break;
        case 'w:tab':
          buffer.write('\t');
          break;
        case 'w:br':
        case 'w:cr':
          buffer.write('\n');
          break;
      }
    }

    return buffer
        .toString()
        .replaceAll('\u00a0', ' ')
        .replaceAll(RegExp(r'[ \t]+'), ' ')
        .replaceAll(RegExp(r'\n+'), ' ')
        .trim();
  }

  static String _fileTitle(String fileName) {
    final base = fileName.replaceAll(RegExp(r'\.[^.]+$'), '');
    return base.trim().isEmpty ? 'Imported Paper' : base.trim();
  }

  static bool _usesVisionExtraction(String lowerName) {
    return lowerName.endsWith('.pdf') ||
        lowerName.endsWith('.png') ||
        lowerName.endsWith('.jpg') ||
        lowerName.endsWith('.jpeg') ||
        lowerName.endsWith('.webp');
  }

  static String _expandCompoundLines(String input) {
    return input
        .replaceAllMapped(
          RegExp(r'(?<!^)(?<!\|)\s+(\(?[A-D]\)[\s])'),
          (match) => '\n${match.group(1)!}',
        )
        .replaceAllMapped(
          RegExp(r'(?<!^)(?<!\|)\s+([A-D][\).:][\s])'),
          (match) => '\n${match.group(1)!}',
        )
        .replaceAllMapped(
          RegExp(r'(?<!^)\s+((?:answer|correct answer)\s*[:\-])', caseSensitive: false),
          (match) => '\n${match.group(1)!}',
        );
  }

  static String _normalizeImportLine(String line) {
    var normalized = line.trim();
    if (normalized.isEmpty) {
      return '';
    }

    const replacements = <String, String>{
      '\u00a0': ' ',
      '—': '-',
      '–': '-',
      '“': '"',
      '”': '"',
      '’': "'",
      '‘': "'",
      '•': '-',
      '': '-',
    };

    replacements.forEach((from, to) {
      normalized = normalized.replaceAll(from, to);
    });

    return normalized.replaceAll(RegExp(r'\s+'), ' ').trim();
  }

  static bool _isQuestionStart(String line) {
    final trimmed = line.trim();
    if (RegExp(r'^\(?[A-D]\)?[\).:\-]?\s+').hasMatch(trimmed)) {
      return false;
    }

    return RegExp(r'^(q(?:uestion)?\s*\d+[\).:\-]?)', caseSensitive: false).hasMatch(trimmed) ||
        RegExp(r'^\d+\s*[\).]\s+.+$').hasMatch(trimmed) ||
        RegExp(r'^\d+\s*\.\s+.+$').hasMatch(trimmed) ||
        RegExp(r'^\d+\s+\S.+$').hasMatch(trimmed);
  }

  static bool _isAnswerKeyStart(String line) {
    return RegExp(r'^(answer\s*key|solutions?|correct\s*answers?)$', caseSensitive: false)
        .hasMatch(line.trim());
  }

  static Map<int, String> _extractAnswerKey(List<String> lines) {
    final answerKey = <int, String>{};
    final startIndex = lines.indexWhere((line) => _isAnswerKeyStart(line));
    if (startIndex < 0) {
      return answerKey;
    }

    for (var i = startIndex + 1; i < lines.length; i += 1) {
      final line = lines[i].trim();
      if (line.isEmpty) {
        continue;
      }

      final inlineMatch = RegExp(r'^(\d+)\s*[\).:\-]?\s*\(?([A-D])\)?$', caseSensitive: false)
          .firstMatch(line);
      if (inlineMatch != null) {
        answerKey[int.parse(inlineMatch.group(1)!)] = inlineMatch.group(2)!.toUpperCase();
        continue;
      }

      final answerWordMatch =
          RegExp(
            r'^(\d+)\s*[\).:\-]?\s*(answer|correct answer)\s*[:\-]?\s*\(?([A-D])\)?$',
            caseSensitive: false,
          ).firstMatch(line);
      if (answerWordMatch != null) {
        answerKey[int.parse(answerWordMatch.group(1)!)] = answerWordMatch.group(3)!.toUpperCase();
        continue;
      }

      final tableLikeMatch =
          RegExp(r'^(\d+)\s*[|,:-]\s*\(?([A-D])\)?(?:\s*[|,:-].*)?$', caseSensitive: false)
              .firstMatch(line);
      if (tableLikeMatch != null) {
        answerKey[int.parse(tableLikeMatch.group(1)!)] = tableLikeMatch.group(2)!.toUpperCase();
        continue;
      }

      final numberOnly = RegExp(r'^\d+$').firstMatch(line);
      if (numberOnly != null && i + 1 < lines.length) {
        final nextLine = lines[i + 1].trim();
        final nextAnswer = RegExp(r'^\(?([A-D])\)?$', caseSensitive: false).firstMatch(nextLine);
        if (nextAnswer != null) {
          answerKey[int.parse(numberOnly.group(0)!)] = nextAnswer.group(1)!.toUpperCase();
          i += 1;
        }
      }
    }

    return answerKey;
  }

  static Future<Question?> _parseQuestionBlock(
    List<String> blockLines, {
    required Map<int, String> answerKey,
    required int questionNumber,
  }) async {
    final cleanedLines = blockLines
        .map((line) => line.trim())
        .where((line) => line.isNotEmpty)
        .toList();
    if (cleanedLines.isEmpty) {
      return null;
    }

    String section = 'General';
    String? answerLetter;
    final optionMap = <String, List<String>>{};
    final promptLines = <String>[];
    String? activeOption;
    var expectingAnswerLetter = false;
    var questionId = questionNumber;

    for (var i = 0; i < cleanedLines.length; i++) {
      final line = cleanedLines[i];

      final numberedHeaderMatch = RegExp(r'^(\d+)\s*[\).]\s+(.+)$').firstMatch(line) ??
          RegExp(r'^(\d+)\s*\.\s+(.+)$').firstMatch(line) ??
          RegExp(r'^(\d+)\s+(.+)$').firstMatch(line);
      if (i == 0 && numberedHeaderMatch != null) {
        final headerText = numberedHeaderMatch.group(2)!.trim();
        questionId = int.parse(numberedHeaderMatch.group(1)!);
        answerLetter = answerKey[questionId] ?? answerLetter;

        if (_looksLikeSectionTitle(headerText) && cleanedLines.length > 1) {
          section = headerText;
          continue;
        }

        promptLines.add(headerText);
        continue;
      }

      final sectionMatch = RegExp(r'^section\s*[:\-]\s*(.+)$', caseSensitive: false).firstMatch(line);
      if (sectionMatch != null) {
        section = sectionMatch.group(1)!.trim();
        continue;
      }

      final answerMatch = RegExp(
        r'^(answer|correct answer)\s*[:\-]\s*\(?([A-D])\)?$',
        caseSensitive: false,
      ).firstMatch(line);
      if (answerMatch != null) {
        answerLetter = answerMatch.group(2)!.toUpperCase();
        activeOption = null;
        expectingAnswerLetter = false;
        continue;
      }

      final answerOnlyMatch =
          RegExp(r'^(answer|correct answer)\s*[:\-]\s*$', caseSensitive: false).firstMatch(line);
      if (answerOnlyMatch != null) {
        activeOption = null;
        expectingAnswerLetter = true;
        continue;
      }

      if (expectingAnswerLetter) {
        final answerLetterMatch = RegExp(r'^\(?([A-D])\)?$', caseSensitive: false).firstMatch(line);
        if (answerLetterMatch != null) {
          answerLetter = answerLetterMatch.group(1)!.toUpperCase();
          expectingAnswerLetter = false;
          continue;
        }
        expectingAnswerLetter = false;
      }

      final answerWordOptionMatch =
          RegExp(r'^(answer|correct answer)\s*[:\-]\s*\(?([A-D])\)?\s*$', caseSensitive: false)
              .firstMatch(line);
      if (answerWordOptionMatch != null) {
        answerLetter = answerWordOptionMatch.group(2)!.toUpperCase();
        activeOption = null;
        continue;
      }

      final optionMatch =
          RegExp(r'^\(?([A-D])\)?[\).:\-]?\s*(.*)$', caseSensitive: false).firstMatch(line);
      if (optionMatch != null) {
        activeOption = optionMatch.group(1)!.toUpperCase();
        optionMap[activeOption] = [optionMatch.group(2)!.trim()];
        continue;
      }

      final tableLikeOptions = _extractOptionsFromTableLikeLine(line);
      if (tableLikeOptions.isNotEmpty) {
        optionMap.addAll(tableLikeOptions);
        activeOption = null;
        continue;
      }

      if (activeOption != null) {
        optionMap.putIfAbsent(activeOption, () => []).add(line);
        continue;
      }

      var promptLine = line;
      if (promptLines.isEmpty) {
        promptLine = promptLine.replaceFirst(
          RegExp(r'^(q(?:uestion)?\s*\d+[\).:\-]?\s*)', caseSensitive: false),
          '',
        );
        promptLine = promptLine.replaceFirst(RegExp(r'^\d+\s*[\).]\s*'), '');
        promptLine = promptLine.replaceFirst(RegExp(r'^\d+\s*\.\s*'), '');
      }

      if (promptLine.isNotEmpty) {
        if (promptLines.isEmpty && _looksLikeSectionTitle(promptLine) && cleanedLines.length > 1) {
          section = promptLine;
          continue;
        }
        promptLines.add(promptLine);
      }
    }

    final options = _optionLetters
        .map((letter) => (optionMap[letter] ?? const <String>[]).join('\n').trim())
        .toList();
    answerLetter ??= answerKey[questionId];

    if (promptLines.isEmpty || options.any((option) => option.isEmpty)) {
      return null;
    }

    final prompt = promptLines.join('\n').trim();
    final promptSegments = MathContentParser.parse(prompt);
    final optionSegments = <List<MathContentSegment>>[];
    for (final option in options) {
      optionSegments.add(MathContentParser.parse(option));
    }

    return Question(
      id: 'import-${DateTime.now().microsecondsSinceEpoch}-${prompt.hashCode}',
      section: section,
      prompt: prompt,
      options: options,
      correctIndex: answerLetter == null ? -1 : _optionLetters.indexOf(answerLetter),
      promptSegments: promptSegments,
      optionSegments: optionSegments,
    );
  }

  static Future<List<Question>> _parseSequentialAnswerBlocks(List<String> lines) async {
    final questions = <Question>[];
    final buffer = <String>[];

    for (final line in lines) {
      if (_isAnswerKeyStart(line)) {
        break;
      }

      buffer.add(line);
      if (_isInlineAnswerLine(line)) {
        final question = await _parseQuestionBlock(
          buffer,
          answerKey: const {},
          questionNumber: questions.length + 1,
        );
        if (question != null) {
          questions.add(question);
        }
        buffer.clear();
      }
    }

    return questions;
  }

  static bool _isInlineAnswerLine(String line) {
    return RegExp(
      r'^(answer|correct answer)\s*[:\-]\s*\(?[A-D]\)?$',
      caseSensitive: false,
    ).hasMatch(line.trim());
  }

  static Map<String, List<String>> _extractOptionsFromTableLikeLine(String line) {
    final optionMap = <String, List<String>>{};
    if (!line.contains(' | ')) {
      return optionMap;
    }

    final parts = line.split(' | ').map((part) => part.trim()).where((part) => part.isNotEmpty);

    for (final part in parts) {
      final match =
          RegExp(r'^\(?([A-D])\)?[\).:\-]?\s*(.*)$', caseSensitive: false).firstMatch(part);
      if (match != null) {
        optionMap[match.group(1)!.toUpperCase()] = [match.group(2)!.trim()];
      }
    }

    return optionMap;
  }

  static bool _looksLikeSectionTitle(String value) {
    final cleaned = value.trim();
    if (cleaned.isEmpty) {
      return false;
    }

    if (cleaned.length > 80 || cleaned.contains('?')) {
      return false;
    }

    if (RegExp(r'^[A-D][\).:\-]?$').hasMatch(cleaned)) {
      return false;
    }

    if (cleaned.contains(r'$') ||
        cleaned.contains(':') ||
        cleaned.contains('=') ||
        cleaned.contains(r'\') ||
        cleaned.split(RegExp(r'\s+')).length > 5) {
      return false;
    }

    return true;
  }
}
