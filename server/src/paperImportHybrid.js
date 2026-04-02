const OPTION_LETTERS = ["A", "B", "C", "D"];

export function parseStructuredImportText(input, {fallbackTitle} = {}) {
  const normalized = String(input || "").replaceAll("\r\n", "\n").replaceAll("\r", "\n");
  const lines = expandCompoundLines(normalized)
    .split("\n")
    .map(normalizeImportLine)
    .filter(Boolean);
  const answerKey = extractAnswerKey(lines);

  const instructions = [];
  const questions = [];
  const buffer = [];
  let startedQuestions = false;

  for (const line of lines) {
    if (isAnswerKeyStart(line)) {
      break;
    }

    if (isQuestionStart(line)) {
      startedQuestions = true;
      if (buffer.length > 0) {
        const question = parseQuestionBlock(buffer, {
          answerKey,
          questionNumber: questions.length + 1,
        });
        if (question) {
          questions.push(question);
        }
        buffer.length = 0;
      }
    }

    if (startedQuestions) {
      buffer.push(line);
    } else {
      instructions.push(line.trim());
    }
  }

  if (buffer.length > 0) {
    const question = parseQuestionBlock(buffer, {
      answerKey,
      questionNumber: questions.length + 1,
    });
    if (question) {
      questions.push(question);
    }
  }

  if (questions.length === 0) {
    questions.push(...parseSequentialAnswerBlocks(lines));
  }

  if (questions.length === 0) {
    throw new Error("No questions could be parsed from the extracted text.");
  }

  return {
    title: fileTitle(fallbackTitle || "Imported Paper"),
    instructions,
    questions,
  };
}

export function localImportConfidence(result) {
  const questions = Array.isArray(result?.questions) ? result.questions : [];
  if (questions.length === 0) {
    return {
      total: 0,
      resolved: 0,
      unresolved: 0,
      resolvedRatio: 0,
      isStrong: false,
    };
  }

  const resolved = questions.filter((question) => question.correctIndex >= 0 && question.correctIndex < 4).length;
  const unresolved = questions.length - resolved;
  const resolvedRatio = resolved / questions.length;
  const isStrong = questions.length >= 8
    ? resolvedRatio >= 0.55
    : resolvedRatio >= 0.75;

  return {
    total: questions.length,
    resolved,
    unresolved,
    resolvedRatio,
    isStrong,
  };
}

function fileTitle(fileName) {
  const base = String(fileName || "").replace(/\.[^.]+$/, "").trim();
  return base || "Imported Paper";
}

function expandCompoundLines(input) {
  return String(input || "")
    .replace(/(?<!^)(?<!\|)\s+(\(?[A-D]\)[\s])/g, "\n$1")
    .replace(/(?<!^)(?<!\|)\s+([A-D][\).:][\s])/g, "\n$1")
    .replace(/(?<!^)\s+((?:answer|correct answer)\s*[:\-])/gi, "\n$1");
}

function normalizeImportLine(line) {
  let normalized = String(line || "").trim();
  if (!normalized) {
    return "";
  }

  const replacements = {
    "\u00a0": " ",
    "â€”": "-",
    "â€“": "-",
    "â€œ": "\"",
    "â€\u009d": "\"",
    "â€™": "'",
    "â€˜": "'",
    "â€¢": "-",
    "ï‚§": "-",
  };

  for (const [from, to] of Object.entries(replacements)) {
    normalized = normalized.replaceAll(from, to);
  }

  return normalized.replace(/[ \t\f\v]+/g, " ").trim();
}

function isQuestionStart(line) {
  const trimmed = String(line || "").trim();
  if (/^\(?[A-D]\)?[\).:\-]?\s+/.test(trimmed)) {
    return false;
  }

  return /^(q(?:uestion)?\s*\d+[\).:\-]?)/i.test(trimmed) ||
    /^\d+\s*[\).]\s+.+$/.test(trimmed) ||
    /^\d+\s*\.\s+.+$/.test(trimmed) ||
    /^\d+\s+\S.+$/.test(trimmed);
}

function isAnswerKeyStart(line) {
  return /^(answer\s*key|solutions?|correct\s*answers?)$/i.test(String(line || "").trim());
}

function extractAnswerKey(lines) {
  const answerKey = new Map();
  const startIndex = lines.findIndex((line) => isAnswerKeyStart(line));
  if (startIndex < 0) {
    return answerKey;
  }

  for (let index = startIndex + 1; index < lines.length; index += 1) {
    const line = String(lines[index] || "").trim();
    if (!line) {
      continue;
    }

    let match = line.match(/^(\d+)\s*[\).:\-]?\s*\(?([A-D])\)?$/i);
    if (match) {
      answerKey.set(Number(match[1]), match[2].toUpperCase());
      continue;
    }

    match = line.match(/^(\d+)\s*[\).:\-]?\s*(answer|correct answer)\s*[:\-]?\s*\(?([A-D])\)?$/i);
    if (match) {
      answerKey.set(Number(match[1]), match[3].toUpperCase());
      continue;
    }

    match = line.match(/^(\d+)\s*[|,:-]\s*\(?([A-D])\)?(?:\s*[|,:-].*)?$/i);
    if (match) {
      answerKey.set(Number(match[1]), match[2].toUpperCase());
      continue;
    }

    const numberOnly = line.match(/^\d+$/);
    if (numberOnly && index + 1 < lines.length) {
      const nextAnswer = String(lines[index + 1] || "").trim().match(/^\(?([A-D])\)?$/i);
      if (nextAnswer) {
        answerKey.set(Number(numberOnly[0]), nextAnswer[1].toUpperCase());
        index += 1;
      }
    }
  }

  return answerKey;
}

function parseQuestionBlock(blockLines, {answerKey, questionNumber}) {
  const cleanedLines = blockLines.map((line) => String(line || "").trim()).filter(Boolean);
  if (cleanedLines.length === 0) {
    return null;
  }

  let section = "General";
  let answerLetter = null;
  let questionId = questionNumber;
  const promptLines = [];
  const bodyLines = [];

  for (let index = 0; index < cleanedLines.length; index += 1) {
    const line = cleanedLines[index];

    const numberedHeaderMatch = line.match(/^(\d+)\s*[\).]\s+(.+)$/) ||
      line.match(/^(\d+)\s*\.\s+(.+)$/) ||
      line.match(/^(\d+)\s+(.+)$/);
    if (index === 0 && numberedHeaderMatch) {
      const headerText = numberedHeaderMatch[2].trim();
      questionId = Number(numberedHeaderMatch[1]);
      answerLetter = answerKey.get(questionId) || answerLetter;

      if (looksLikeSectionTitle(headerText) && cleanedLines.length > 1) {
        section = headerText;
        continue;
      }

      promptLines.push(headerText);
      continue;
    }

    const sectionMatch = line.match(/^section\s*[:\-]\s*(.+)$/i);
    if (sectionMatch) {
      section = sectionMatch[1].trim();
      continue;
    }

    const answerMatch = line.match(/^(answer|correct answer)\s*[:\-]\s*\(?([A-D])\)?$/i);
    if (answerMatch) {
      answerLetter = answerMatch[2].toUpperCase();
      continue;
    }

    if (/^(answer|correct answer)\s*[:\-]\s*$/i.test(line)) {
      continue;
    }

    const bareAnswerMatch = line.match(/^\(?([A-D])\)?$/i);
    if (bareAnswerMatch) {
      const prev = cleanedLines[index - 1] || "";
      if (/^(answer|correct answer)\s*[:\-]?\s*$/i.test(prev)) {
        answerLetter = bareAnswerMatch[1].toUpperCase();
        continue;
      }
    }

    let promptLine = line;
    if (promptLines.length === 0 && bodyLines.length === 0) {
      promptLine = promptLine
        .replace(/^(q(?:uestion)?\s*\d+[\).:\-]?\s*)/i, "")
        .replace(/^\d+\s*[\).]\s*/, "")
        .replace(/^\d+\s*\.\s*/, "");
    }

    if (promptLine) {
      if (promptLines.length === 0 && bodyLines.length === 0 && looksLikeSectionTitle(promptLine) && cleanedLines.length > 1) {
        section = promptLine;
        continue;
      }
      bodyLines.push(promptLine);
    }
  }

  const extracted = extractTrailingOptionBlocks(bodyLines);
  if (extracted) {
    promptLines.push(...bodyLines.slice(0, extracted.startIndex));
  } else {
    promptLines.push(...bodyLines);
  }

  const optionMap = extracted?.optionMap || new Map();

  const options = OPTION_LETTERS.map((letter) => (optionMap.get(letter) || []).join("\n").trim());
  answerLetter = answerLetter || answerKey.get(questionId) || null;

  if (promptLines.length === 0 || options.some((option) => !option)) {
    return null;
  }

  return {
    id: `local-import-${Date.now()}-${questionId}-${Math.abs(promptLines.join(" ").length)}`,
    questionNumber: String(questionId),
    section,
    prompt: promptLines.join("\n").trim(),
    options,
    correctAnswer: answerLetter,
    correctIndex: answerLetter ? OPTION_LETTERS.indexOf(answerLetter) : -1,
    topic: null,
    concepts: [],
    difficulty: "medium",
    explanation: null,
  };
}

function parseSequentialAnswerBlocks(lines) {
  const questions = [];
  const buffer = [];

  for (const line of lines) {
    if (isAnswerKeyStart(line)) {
      break;
    }

    buffer.push(line);
    if (isInlineAnswerLine(line)) {
      const question = parseQuestionBlock(buffer, {
        answerKey: new Map(),
        questionNumber: questions.length + 1,
      });
      if (question) {
        questions.push(question);
      }
      buffer.length = 0;
    }
  }

  return questions;
}

function isInlineAnswerLine(line) {
  return /^(answer|correct answer)\s*[:\-]\s*\(?[A-D]\)?$/i.test(String(line || "").trim());
}

function extractOptionsFromTableLikeLine(line) {
  const optionMap = new Map();
  if (!String(line || "").includes(" | ")) {
    return optionMap;
  }

  const parts = String(line || "")
    .split(" | ")
    .map((part) => part.trim())
    .filter(Boolean);

  for (const part of parts) {
    const match = part.match(/^\(?([A-D])\)?[\).:\-]?\s*(.*)$/i);
    if (match) {
      optionMap.set(match[1].toUpperCase(), [match[2].trim()]);
    }
  }

  return optionMap;
}

function parseOptionLabel(line) {
  const trimmed = String(line || "").trim();
  const match = trimmed.match(/^\(?([A-Da-d])\)?[\).:\-]?\s*(.*)$/);
  if (!match) {
    return null;
  }
  return {
    label: match[1].toUpperCase(),
    content: String(match[2] || "").trim(),
  };
}

function extractTrailingOptionBlocks(lines) {
  const normalizedLines = lines.map((line) => String(line || "").trim()).filter(Boolean);
  if (normalizedLines.length === 0) {
    return null;
  }

  let bestCandidate = null;

  for (let startIndex = 0; startIndex < normalizedLines.length; startIndex += 1) {
    const firstLabel = parseOptionLabel(normalizedLines[startIndex]);
    if (!firstLabel || firstLabel.label !== "A") {
      continue;
    }

    const optionMap = new Map();
    let currentLabel = null;
    let expectedIndex = 0;
    let valid = true;

    for (let index = startIndex; index < normalizedLines.length; index += 1) {
      const line = normalizedLines[index];
      const tableLikeOptions = extractOptionsFromTableLikeLine(line);
      if (tableLikeOptions.size === 4 && expectedIndex === 0) {
        for (const [letter, values] of tableLikeOptions.entries()) {
          optionMap.set(letter, values.map((item) => String(item || "").trim()).filter(Boolean));
        }
        expectedIndex = 4;
        currentLabel = "D";
        continue;
      }

      const labelMatch = parseOptionLabel(line);
      if (labelMatch) {
        const expectedLabel = OPTION_LETTERS[expectedIndex];
        if (!expectedLabel || labelMatch.label !== expectedLabel) {
          valid = false;
          break;
        }
        optionMap.set(labelMatch.label, labelMatch.content ? [labelMatch.content] : []);
        currentLabel = labelMatch.label;
        expectedIndex += 1;
        continue;
      }

      if (!currentLabel) {
        valid = false;
        break;
      }

      optionMap.set(currentLabel, [...(optionMap.get(currentLabel) || []), line]);
    }

    if (!valid || expectedIndex !== 4) {
      continue;
    }

    const normalizedOptions = OPTION_LETTERS.map((letter) =>
      (optionMap.get(letter) || []).join("\n").trim(),
    );
    if (normalizedOptions.some((option) => !option)) {
      continue;
    }

    bestCandidate = {
      startIndex,
      optionMap,
    };
  }

  return bestCandidate;
}

function looksLikeSectionTitle(value) {
  const cleaned = String(value || "").trim();
  if (!cleaned) {
    return false;
  }
  if (cleaned.length > 80 || cleaned.includes("?")) {
    return false;
  }
  if (/^[A-D][\).:\-]?$/.test(cleaned)) {
    return false;
  }
  if (
    cleaned.includes("$") ||
    cleaned.includes(":") ||
    cleaned.includes("=") ||
    cleaned.includes("\\") ||
    cleaned.split(/\s+/).length > 5
  ) {
    return false;
  }
  return true;
}
