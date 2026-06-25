import {OPTION_LETTERS, hasSuspiciousMathArtifact} from "./documentIr.js";

export function validateImportedQuestions(questions, context = {}) {
  const warnings = [...(context.warnings || [])];
  const questionCount = questions.length;
  const answerCount = questions.filter((question) => Number(question.correctIndex) >= 0).length;
  const missingOptions = [];
  const missingAnswers = [];
  const duplicateQuestionNumbers = [];
  const seen = new Set();
  let malformedOptionCount = 0;
  let missingPromptCount = 0;

  for (const question of questions) {
    const number = String(question.questionNumber || "").trim();
    if (number) {
      if (seen.has(number)) {
        duplicateQuestionNumbers.push(number);
      }
      seen.add(number);
    }
    if (!String(question.prompt || "").trim()) {
      missingPromptCount += 1;
    }
    const options = Array.isArray(question.options) ? question.options : [];
    const filledOptions = options.slice(0, 4).filter((option) => String(option || "").trim()).length;
    if (filledOptions < 4) {
      missingOptions.push(number || String(missingOptions.length + 1));
    }
    if (options.length !== 4 || filledOptions !== 4) {
      malformedOptionCount += 1;
    }
    if (!OPTION_LETTERS.includes(String(question.correctAnswer || "").toUpperCase())) {
      missingAnswers.push(number || String(missingAnswers.length + 1));
    }
  }

  const monotonic = isMonotonic(questions);
  if (!monotonic) {
    warnings.push("Question numbers are not strictly monotonic.");
  }
  if (duplicateQuestionNumbers.length > 0) {
    warnings.push(`Duplicate question numbers detected: ${duplicateQuestionNumbers.join(", ")}.`);
  }
  if (missingOptions.length > 0) {
    warnings.push(`${missingOptions.length} question(s) have fewer than four parsed options.`);
  }
  if (missingAnswers.length > 0) {
    warnings.push(`${missingAnswers.length} question(s) do not have a matched answer.`);
  }
  if (context.answerKeyDetected && context.answerCount > 0 && context.answerCount < questionCount * 0.6) {
    warnings.push("Parsed answer key covers fewer questions than expected.");
  }

  let confidence = 1;
  if (questionCount === 0) confidence -= 0.7;
  if (questionCount > 0) {
    confidence -= Math.min(0.35, malformedOptionCount / questionCount * 0.35);
    confidence -= Math.min(0.2, missingPromptCount / questionCount * 0.2);
    confidence -= Math.min(0.18, missingAnswers.length / questionCount * 0.18);
  }
  if (!monotonic) confidence -= 0.12;
  if (duplicateQuestionNumbers.length > 0) confidence -= 0.2;
  if (context.scannedPdfSuspected) confidence -= 0.35;
  if (context.suspiciousMathBlocks?.length > 0) confidence -= 0.18;
  if (context.unsupportedMathNodes?.length > 0) confidence -= Math.min(0.12, context.unsupportedMathNodes.length * 0.01);
  if (context.pdfGlyphRepairCount > 0) confidence -= 0.05;
  if (context.fallbackUsed) confidence -= 0.2;
  confidence = Math.max(0, Math.min(1, Number(confidence.toFixed(3))));

  const needsReview = confidence < 0.85 ||
    missingOptions.length > 0 ||
    duplicateQuestionNumbers.length > 0 ||
    Boolean(context.scannedPdfSuspected) ||
    Boolean(context.suspiciousMathBlocks?.length) ||
    Number(context.pdfGlyphRepairCount || 0) > 0;

  return {
    confidence,
    warnings,
    needsReview,
    debug: {
      sourceType: context.sourceType,
      questionCount,
      answerCount,
      missingOptions,
      missingAnswers,
      duplicateQuestionNumbers,
      suspiciousMathBlocks: context.suspiciousMathBlocks || [],
      unsupportedMathNodes: context.unsupportedMathNodes || [],
      pdfGlyphRepairCount: context.pdfGlyphRepairCount || 0,
      pdfGlyphRepairSamples: context.pdfGlyphRepairSamples || [],
      parserVersion: "deterministic-v2",
    },
  };
}

function isMonotonic(questions) {
  let previous = 0;
  for (const question of questions) {
    const next = Number(question.questionNumber);
    if (!Number.isInteger(next)) {
      continue;
    }
    if (next <= previous) {
      return false;
    }
    previous = next;
  }
  return true;
}

export function collectValidationContext(ir, answerKeyResult) {
  const unsupportedMathNodes = (ir.warnings || [])
    .map((warning) => String(warning || ""))
    .filter((warning) => warning.includes("Unsupported OMML node"));
  return {
    sourceType: ir.sourceType,
    warnings: [...(ir.warnings || []), ...(answerKeyResult?.warnings || [])],
    answerKeyDetected: Boolean(answerKeyResult),
    answerCount: answerKeyResult?.answers?.size || 0,
    suspiciousMathBlocks: ir.metadata?.suspiciousMathBlocks || [],
    pdfGlyphRepairCount: ir.metadata?.pdfGlyphRepairCount || 0,
    pdfGlyphRepairSamples: ir.metadata?.pdfGlyphRepairSamples || [],
    unsupportedMathNodes,
    scannedPdfSuspected: Boolean(ir.metadata?.scannedPdfSuspected),
    fallbackUsed: Boolean(ir.metadata?.fallbackUsed),
  };
}

export function questionHasSuspiciousArtifacts(question) {
  return hasSuspiciousMathArtifact([
    question.prompt,
    ...(question.options || []),
  ].join("\n"));
}
