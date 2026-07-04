import {answerLetterFromValue, blockToText} from "./documentIr.js";

const ANSWER_KEY_HEADING_RE = /^(?:answer\s*key(?:\s*table)?|answers?|correct\s*(?:answers?|options?)|key|solutions?)\s*:?$/i;
const INLINE_ANSWER_RE = /^(?:ans(?:wer)?|correct\s*(?:answer|option))\s*[\.:;\-]?\s*\(?([A-Da-d1-4])\)?\s*$/i;

export function isAnswerKeyHeading(text) {
  return ANSWER_KEY_HEADING_RE.test(String(text || "").trim());
}

export function splitAnswerKeySection(blocks) {
  const index = (blocks || []).findIndex((block) => {
    const text = blockToText(block).trim();
    const firstLine = text.split("\n")[0]?.trim() || text;
    return isAnswerKeyHeading(firstLine) || /^answer\s*key\b/i.test(firstLine);
  });
  if (index < 0) {
    return {
      questionBlocks: blocks || [],
      answerBlocks: [],
    };
  }
  return {
    questionBlocks: blocks.slice(0, index),
    answerBlocks: blocks.slice(index),
  };
}

export function parseAnswerKey(blocks) {
  const answers = new Map();
  const warnings = [];
  const lines = [];

  for (const block of blocks || []) {
    if (block.kind === "table") {
      parseAnswerTable(block, answers);
    }
    const text = blockToText(block);
    if (text) {
      lines.push(...text.split("\n").map((line) => line.trim()).filter(Boolean));
    }
  }

  let pendingHeaderNumbers = [];
  for (const line of lines) {
    const headerNumbers = parseQuestionNumberHeader(line);
    if (headerNumbers.length > 0) {
      pendingHeaderNumbers = headerNumbers;
      continue;
    }
    if (pendingHeaderNumbers.length > 0 && /^ans(?:wer)?\b/i.test(line)) {
      const values = line.replace(/^ans(?:wer)?\s*:?\s*/i, "").trim().split(/\s+/).filter(Boolean);
      values.forEach((value, index) => {
        const letter = answerLetterFromValue(value);
        if (letter && pendingHeaderNumbers[index]) {
          answers.set(pendingHeaderNumbers[index], letter);
        }
      });
      pendingHeaderNumbers = [];
      continue;
    }
    parseAnswerLine(line, answers);
  }

  if ((blocks || []).length > 0 && answers.size === 0) {
    warnings.push("Answer key section was detected, but no answer pairs could be parsed.");
  }

  return {
    answers,
    warnings,
  };
}

function parseQuestionNumberHeader(line) {
  const trimmed = String(line || "").trim();
  if (!/^q\.?\s*no\.?|^question/i.test(trimmed)) {
    return [];
  }
  return [...trimmed.matchAll(/\b(\d{1,3})\b/g)].map((match) => Number(match[1]));
}

export function extractInlineAnswer(lines) {
  let answer = null;
  const remaining = [];
  let consumedAnswer = false;
  for (const line of lines) {
    const trimmed = String(line || "").trim();
    const match = trimmed.match(INLINE_ANSWER_RE);
    if (match) {
      answer = answerLetterFromValue(match[1]) || answer;
      consumedAnswer = true;
      continue;
    }
    if (consumedAnswer) {
      continue;
    }
    remaining.push(line);
  }
  return {answer, lines: remaining};
}

function parseAnswerTable(block, answers) {
  const rows = block.rows || [];
  if (rows.length < 1) {
    return;
  }

  for (const row of rows) {
    const cells = row.map((cell) => String(cell?.text || "").trim()).filter(Boolean);
    if (cells.length >= 2 && /^\d{1,3}$/.test(cells[0])) {
      const letter = answerLetterFromValue(cells[1]);
      if (letter) {
        answers.set(Number(cells[0]), letter);
      }
    }
  }

  for (let index = 0; index < rows.length - 1; index += 1) {
    const labels = rows[index].map((cell) => String(cell?.text || "").trim());
    const values = rows[index + 1].map((cell) => String(cell?.text || "").trim());
    if (!/^q(?:\.?\s*no\.?|uestion)?/i.test(labels[0] || "") || !/^ans/i.test(values[0] || "")) {
      continue;
    }
    for (let cellIndex = 1; cellIndex < Math.min(labels.length, values.length); cellIndex += 1) {
      if (/^\d{1,3}$/.test(labels[cellIndex])) {
        const letter = answerLetterFromValue(values[cellIndex]);
        if (letter) {
          answers.set(Number(labels[cellIndex]), letter);
        }
      }
    }
  }
}

function parseAnswerLine(line, answers) {
  const trimmed = String(line || "").trim();
  if (!trimmed || isAnswerKeyHeading(trimmed)) {
    return;
  }

  const tableHeader = trimmed.match(/^q\.?\s*no\.?\s+(.+)$/i);
  if (tableHeader) {
    return;
  }

  const ansRow = trimmed.match(/^ans(?:wer)?\s+(.+)$/i);
  if (ansRow) {
    const parts = ansRow[1].split(/\s+/).filter(Boolean);
    const previousNumbers = [...answers.keys()].sort((a, b) => a - b);
    if (previousNumbers.length >= parts.length) {
      parts.forEach((part, index) => {
        const letter = answerLetterFromValue(part);
        if (letter) {
          answers.set(previousNumbers[index], letter);
        }
      });
    }
  }

  const compactPairs = [...trimmed.matchAll(/(?:Q\s*)?(\d{1,3})\s*(?:[\).:\-]|->)\s*\(?([A-Da-d1-4])\)?/g)];
  for (const match of compactPairs) {
    const letter = answerLetterFromValue(match[2]);
    if (letter) {
      answers.set(Number(match[1]), letter);
    }
  }

  const qPairs = [...trimmed.matchAll(/\bQ\.?\s*(\d{1,3})\s+\(?([A-Da-d1-4])\)?/g)];
  for (const match of qPairs) {
    const letter = answerLetterFromValue(match[2]);
    if (letter) {
      answers.set(Number(match[1]), letter);
    }
  }

  const tableParts = trimmed.split(/\s*\|\s*/).filter(Boolean);
  if (tableParts.length === 2 && /^\d{1,3}$/.test(tableParts[0])) {
    const letter = answerLetterFromValue(tableParts[1]);
    if (letter) {
      answers.set(Number(tableParts[0]), letter);
    }
  }
}
