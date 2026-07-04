import {blockToText, blocksToText} from "./documentIr.js";
import {extractInlineAnswer} from "./answerKeyParser.js";
import {parseOptionsFromQuestionBlocks} from "./optionParser.js";

const BARE_QUESTION_START_RE = /^(\d{1,3})(?:[\).\]:-]\s*|\s{1,3})(\S.*)$/i;
const PREFIXED_QUESTION_START_RE = /^Q(?:uestion)?\.?\s*(\d{1,3})(?:[\).\]:-]?\s*)?(\S.*)$/i;
const BAD_NUMBER_CONTEXT_RE = /^\d{4}$|^\d+(?:\.\d+|-\d+)\b|^\d+\s*:\s*\d+/;

export function segmentQuestions(blocks) {
  const questions = [];
  const instructions = [];
  let current = null;
  let expectedNext = 1;

  for (const block of blocks || []) {
    const start = detectQuestionStart(block, expectedNext);
    if (start) {
      if (current) {
        questions.push(current);
      }
      current = {
        questionNumber: start.questionNumber,
        blocks: [stripQuestionMarker(block, start)],
        warnings: start.warnings,
      };
      expectedNext = start.questionNumber + 1;
      continue;
    }

    if (current) {
      current.blocks.push(block);
    } else {
      const text = blockToText(block);
      if (text) {
        instructions.push(text);
      }
    }
  }

  if (current) {
    questions.push(current);
  }

  return {
    instructions,
    questionBlocks: questions,
  };
}

export function parseQuestionBlock(questionBlock, answerKey = new Map()) {
  const rawText = blocksToText(questionBlock.blocks);
  const lines = rawText.split("\n").map((line) => line.trim()).filter(Boolean);
  const inlineAnswer = extractInlineAnswer(lines);
  const blocksWithoutAnswer = inlineAnswer.lines.length === lines.length
    ? questionBlock.blocks
    : [{kind: "paragraph", text: inlineAnswer.lines.join("\n"), spans: []}];
  const optionResult = parseOptionsFromQuestionBlocks(blocksWithoutAnswer);
  const prompt = String(optionResult.promptText || "").trim();
  const options = optionResult.options || [];
  const correctAnswer = inlineAnswer.answer || answerKey.get(questionBlock.questionNumber) || null;

  return {
    id: `det-import-${questionBlock.questionNumber}-${Math.abs(rawText.length)}`,
    questionNumber: String(questionBlock.questionNumber),
    section: "General",
    prompt,
    options,
    correctAnswer,
    correctIndex: correctAnswer ? correctAnswer.charCodeAt(0) - 65 : -1,
    topic: null,
    concepts: [],
    difficulty: "medium",
    explanation: null,
    raw: rawText,
    warnings: [...(questionBlock.warnings || []), ...(optionResult.warnings || [])],
  };
}

function detectQuestionStart(block, expectedNext) {
  if (block.kind !== "paragraph") {
    return null;
  }
  const text = String(block.text || "").trim();
  const [firstLine, ...restLines] = text.split("\n");
  const candidate = String(firstLine || "").trim();
  if (!candidate || BAD_NUMBER_CONTEXT_RE.test(candidate)) {
    return null;
  }
  if (/^\(?[A-Da-d]\)?[\).:\-]?\s+/.test(candidate)) {
    return null;
  }

  const match = candidate.match(PREFIXED_QUESTION_START_RE) || candidate.match(BARE_QUESTION_START_RE);
  if (!match) {
    return null;
  }

  const questionNumber = Number(match[1]);
  const rest = [String(match[2] || "").trim(), ...restLines].filter(Boolean).join("\n").trim();
  if (!Number.isInteger(questionNumber) || questionNumber <= 0 || questionNumber > 400) {
    return null;
  }
  if (expectedNext > 8 && questionNumber < expectedNext - 3) {
    return null;
  }
  if (!rest || /^\d+(?:\.\d+)?\s*(?:kg|cm|m|km|%)?\b/i.test(rest)) {
    return null;
  }
  if (Math.abs(questionNumber - expectedNext) > 20 && questionNumber !== 1) {
    return null;
  }

  const warnings = [];
  if (questionNumber !== expectedNext && !(expectedNext === 1 && questionNumber > 1)) {
    warnings.push(`Question number ${questionNumber} is not the expected ${expectedNext}.`);
  }

  return {
    questionNumber,
    replacementText: rest,
    warnings,
  };
}

function stripQuestionMarker(block, start) {
  if (block.kind !== "paragraph") {
    return block;
  }
  return {
    ...block,
    text: start.replacementText || String(block.text || "").trim(),
  };
}
