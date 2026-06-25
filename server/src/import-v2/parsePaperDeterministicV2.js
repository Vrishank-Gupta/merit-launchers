import {fileTitle} from "./documentIr.js";
import {docxToIr} from "./docxToIr.js";
import {pdfToIr} from "./pdfToIr.js";
import {textToIr} from "./textToIr.js";
import {normalizeIr} from "./normalizeIr.js";
import {parseAnswerKey, splitAnswerKeySection} from "./answerKeyParser.js";
import {parseQuestionBlock, segmentQuestions} from "./questionSegmenter.js";
import {collectValidationContext, validateImportedQuestions} from "./importValidator.js";
import {formatForExistingImportSchema} from "./formatForExistingImportSchema.js";
import {buildDebugExport} from "./debugExport.js";
import {parseStructuredImportText} from "../paperImportHybrid.js";

export async function parsePaperDeterministicV2({fileName = "Imported Paper", buffer, rawText = "", mimeType = ""}) {
  const sourceIr = await extractIr({fileName, buffer, rawText, mimeType});
  const ir = normalizeIr(sourceIr);
  const split = splitAnswerKeySection(ir.blocks);
  const answerKey = parseAnswerKey(split.answerBlocks);
  const segmented = segmentQuestions(split.questionBlocks);
  let questions = segmented.questionBlocks.map((block) => parseQuestionBlock(block, answerKey.answers));
  questions = await supplementQuestions({
    questions,
    fileName,
    buffer,
    rawText,
    type: sourceIr.sourceType,
  });
  const context = collectValidationContext(ir, answerKey);
  const validation = validateImportedQuestions(questions, context);
  const result = {
    title: fileTitle(fileName),
    instructions: segmented.instructions,
    questions,
    confidence: validation.confidence,
    warnings: validation.warnings,
    needsReview: validation.needsReview,
    debug: {
      ...validation.debug,
      ...buildDebugExport({ir, segmented, answerKey, validation}),
    },
  };

  return formatForExistingImportSchema(result, {fileName});
}

async function supplementQuestions({questions, fileName, buffer, rawText, type}) {
  const deduped = dedupeQuestions(questions);
  const hasGaps = missingQuestionNumbers(deduped).length > 0;
  if (!hasGaps) {
    return deduped;
  }

  const legacyText = type === "pdf" && buffer
    ? await extractLegacyPdfText(buffer)
    : String(rawText || "");
  if (!legacyText.trim()) {
    return deduped;
  }

  let legacy;
  try {
    legacy = parseStructuredImportText(legacyText, {fallbackTitle: fileName});
  } catch {
    return deduped;
  }

  const byNumber = new Map();
  for (const question of deduped) {
    const number = Number(question.questionNumber);
    if (Number.isInteger(number) && !byNumber.has(number)) {
      byNumber.set(number, question);
    }
  }

  for (const legacyQuestion of legacy.questions || []) {
    const number = Number(legacyQuestion.questionNumber);
    if (!Number.isInteger(number)) {
      continue;
    }
    const existing = byNumber.get(number);
    if (!existing || !isCompleteQuestion(existing)) {
      byNumber.set(number, {
        ...legacyQuestion,
        id: `det-import-${number}-legacy-${Math.abs(String(legacyQuestion.prompt || "").length)}`,
        warnings: [
          ...(legacyQuestion.warnings || []),
          "Recovered with legacy text parser because deterministic v2 missed or malformed this question.",
        ],
      });
    }
  }

  return [...byNumber.entries()]
    .sort(([left], [right]) => left - right)
    .map(([, question]) => question);
}

function dedupeQuestions(questions) {
  const byNumber = new Map();
  const unnumbered = [];
  for (const question of questions || []) {
    const number = Number(question.questionNumber);
    if (!Number.isInteger(number)) {
      unnumbered.push(question);
      continue;
    }
    const existing = byNumber.get(number);
    if (!existing || (!isCompleteQuestion(existing) && isCompleteQuestion(question))) {
      byNumber.set(number, question);
    }
  }
  return [
    ...[...byNumber.entries()].sort(([left], [right]) => left - right).map(([, question]) => question),
    ...unnumbered,
  ];
}

function missingQuestionNumbers(questions) {
  const numbers = questions
    .map((question) => Number(question.questionNumber))
    .filter((number) => Number.isInteger(number) && number > 0)
    .sort((a, b) => a - b);
  if (numbers.length < 3) {
    return [];
  }
  const missing = [];
  for (let number = numbers[0]; number <= numbers[numbers.length - 1]; number += 1) {
    if (!numbers.includes(number)) {
      missing.push(number);
    }
  }
  return missing;
}

function isCompleteQuestion(question) {
  const options = Array.isArray(question?.options) ? question.options : [];
  return Boolean(String(question?.prompt || "").trim()) &&
    options.length === 4 &&
    options.every((option) => String(option || "").trim());
}

async function extractLegacyPdfText(buffer) {
  let parser;
  try {
    const {PDFParse} = await import("pdf-parse");
    parser = new PDFParse({data: buffer});
    const result = await parser.getText({pageJoiner: "\n\n"});
    return String(result?.text || "").trim();
  } catch {
    return "";
  } finally {
    if (parser) {
      await parser.destroy().catch(() => {});
    }
  }
}

async function extractIr({fileName, buffer, rawText, mimeType}) {
  const lowerName = String(fileName || "").toLowerCase();
  const type = detectType({lowerName, mimeType, buffer});
  if (type === "docx") {
    return docxToIr(buffer, {fileName});
  }
  if (type === "pdf") {
    return pdfToIr(buffer, {fileName});
  }
  const text = rawText || (buffer ? Buffer.from(buffer).toString("utf8") : "");
  return textToIr(text, {fileName});
}

function detectType({lowerName, mimeType, buffer}) {
  if (lowerName.endsWith(".docx") || mimeType.includes("wordprocessingml")) {
    return "docx";
  }
  if (lowerName.endsWith(".pdf") || mimeType === "application/pdf" || startsWith(buffer, "%PDF")) {
    return "pdf";
  }
  return "txt";
}

function startsWith(buffer, marker) {
  if (!buffer) {
    return false;
  }
  return Buffer.from(buffer).subarray(0, marker.length).toString("utf8") === marker;
}
