import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import {spawn} from "node:child_process";

import JSZip from "jszip";

import {
  normalizeDocxSymbolText,
  normalizeImportedText,
  repairCommonMojibake,
  toSubscript,
  toSuperscript,
} from "./importTextNormalization.js";

const OPTION_LETTERS = ["A", "B", "C", "D"];
const TEMPLATE_MARKER = "MERIT_QUESTION_IMPORT_TEMPLATE_V1";

/**
 * Extracts plain text from a DOCX buffer including OMML math equations.
 * Mammoth silently drops <m:oMath> blocks; this uses our XML parser so math
 * expressions survive as readable Unicode text.
 */
export async function extractDocxRawTextWithMath(bytes) {
  const zip = await JSZip.loadAsync(bytes);
  const documentFile = zip.file("word/document.xml");
  if (!documentFile) return "";
  const documentXml = await documentFile.async("string");
  const blocks = extractDocumentBlocks(documentXml);
  return blocks
    .map((block) => normalizeImportedText(decodeXmlEntities(String(block.text || ""))))
    .filter(Boolean)
    .join("\n");
}

export async function parseStructuredDocxImport({
  fileName,
  bytes,
  uploadsDir,
  publicBaseUrl = "",
  publicPathPrefix = "/uploads/",
}) {
  const zip = await JSZip.loadAsync(bytes);
  const documentFile = zip.file("word/document.xml");
  if (!documentFile) {
    return null;
  }

  const documentXml = await documentFile.async("string");
  const blocks = extractDocumentBlocks(documentXml);
  const visibleText = blocks
    .map((block) => block.text)
    .map((value) => normalizeText(value))
    .filter(Boolean);

  if (!visibleText.some((line) => line.toUpperCase().includes(TEMPLATE_MARKER))) {
    return null;
  }

  const relationshipMap = await extractRelationshipMap(zip);
  const {resolveBlock: resolveAttachmentsForBlock} = createAttachmentResolver({
    blocks,
    zip,
    relationshipMap,
    uploadsDir,
    publicBaseUrl,
    publicPathPrefix,
  });
  const titleFallback = fallbackTitleFromFileName(fileName);
  const instructions = [];
  const questions = [];
  const ignoredPrefixes = ["NOTE:", "NOTES:", "GUIDE:", "HELP:"];
  let title = titleFallback;
  let activeSection = "General";
  let currentQuestion = null;
  let activeOptionIndex = -1;
  let pendingImageTarget = null;
  let markerSeen = false;

  for (const block of blocks) {
    const text = normalizeText(block.text);
    const attachmentsFromBlock = await resolveAttachmentsForBlock(block);

    if (!markerSeen) {
      if (text.toUpperCase().includes(TEMPLATE_MARKER)) {
        markerSeen = true;
      }
      continue;
    }

    const fallbackImageTarget = inferFallbackImageTarget({
      currentQuestion,
      activeOptionIndex,
      pendingImageTarget,
    });

    if (fallbackImageTarget && attachmentsFromBlock.length > 0 && !text) {
      appendAttachments(currentQuestion, fallbackImageTarget, attachmentsFromBlock);
      continue;
    }

    if (!text) {
      if (fallbackImageTarget && attachmentsFromBlock.length > 0) {
        appendAttachments(currentQuestion, fallbackImageTarget, attachmentsFromBlock);
      }
      continue;
    }

    if (ignoredPrefixes.some((prefix) => text.toUpperCase().startsWith(prefix))) {
      pendingImageTarget = null;
      continue;
    }

    const questionMatch = text.match(/^Q(?:UESTION)?\s*(\d+)\s*[:.\-]\s*(.*)$/i);
    if (questionMatch) {
      commitQuestion(questions, currentQuestion);
      currentQuestion = createEmptyQuestion(activeSection);
      currentQuestion.questionNumber = questionMatch[1];
      currentQuestion.prompt = questionMatch[2].trim();
      activeOptionIndex = -1;
      pendingImageTarget = null;
      continue;
    }

    const controlMatch = text.match(/^([A-Z_]+(?:\s+[A-Z_]+)?)\s*:\s*(.*)$/);
    if (controlMatch) {
      const control = controlMatch[1].trim().toUpperCase().replaceAll(" ", "_");
      const value = controlMatch[2].trim();

      switch (control) {
        case "TITLE":
          title = value || titleFallback;
          currentQuestion = currentQuestion;
          activeOptionIndex = -1;
          pendingImageTarget = null;
          continue;
        case "INSTRUCTION":
        case "INSTRUCTIONS":
          if (value) {
            instructions.push(value);
          }
          pendingImageTarget = null;
          continue;
        case "SECTION":
          activeSection = value || "General";
          if (currentQuestion) {
            currentQuestion.section = activeSection;
          }
          activeOptionIndex = -1;
          pendingImageTarget = null;
          continue;
        case "QUESTION_IMAGE":
          ensureQuestion(currentQuestion, text);
          pendingImageTarget = {kind: "question"};
          if (attachmentsFromBlock.length > 0) {
            appendAttachments(currentQuestion, pendingImageTarget, attachmentsFromBlock);
          }
          activeOptionIndex = -1;
          continue;
        case "OPTION_A_IMAGE":
        case "OPTION_B_IMAGE":
        case "OPTION_C_IMAGE":
        case "OPTION_D_IMAGE": {
          ensureQuestion(currentQuestion, text);
          const optionLetter = control.replace("OPTION_", "").replace("_IMAGE", "");
          pendingImageTarget = {
            kind: "option",
            index: OPTION_LETTERS.indexOf(optionLetter),
          };
          if (attachmentsFromBlock.length > 0) {
            appendAttachments(currentQuestion, pendingImageTarget, attachmentsFromBlock);
          }
          activeOptionIndex = pendingImageTarget.index;
          continue;
        }
        case "ANSWER":
          ensureQuestion(currentQuestion, text);
          currentQuestion.correctIndex = parseAnswerIndex(value);
          activeOptionIndex = -1;
          pendingImageTarget = null;
          continue;
        case "EXPLANATION":
          ensureQuestion(currentQuestion, text);
          currentQuestion.explanation = value || null;
          activeOptionIndex = -1;
          pendingImageTarget = null;
          continue;
        case "TOPIC":
          ensureQuestion(currentQuestion, text);
          currentQuestion.topic = value || null;
          activeOptionIndex = -1;
          pendingImageTarget = null;
          continue;
        case "DIFFICULTY":
          ensureQuestion(currentQuestion, text);
          currentQuestion.difficulty = normalizeDifficulty(value);
          activeOptionIndex = -1;
          pendingImageTarget = null;
          continue;
        default:
          break;
      }
    }

    const inlineOptionSegments = extractInlineOptionSegments(text);
    if (inlineOptionSegments.length > 0) {
      ensureQuestion(currentQuestion, text);
      for (const segment of inlineOptionSegments) {
        currentQuestion.options[segment.index] = segment.text;
        activeOptionIndex = segment.index;
      }
      pendingImageTarget = null;
      continue;
    }

    if (!currentQuestion) {
      if (text && text !== titleFallback) {
        instructions.push(text);
      }
      pendingImageTarget = null;
      continue;
    }

    if (fallbackImageTarget && attachmentsFromBlock.length > 0) {
      appendAttachments(currentQuestion, fallbackImageTarget, attachmentsFromBlock);
      continue;
    }

    if (activeOptionIndex >= 0) {
      currentQuestion.options[activeOptionIndex] = appendText(
        currentQuestion.options[activeOptionIndex],
        text,
      );
    } else {
      currentQuestion.prompt = appendText(currentQuestion.prompt, text);
    }
    pendingImageTarget = null;
  }

  commitQuestion(questions, currentQuestion);

  if (questions.length === 0) {
    throw new Error("The DOCX template marker was found, but no questions were detected.");
  }

  return {
    title: title || titleFallback,
    instructions,
    questions: questions.map((question) => ({
      questionNumber: question.questionNumber || null,
      section: question.section || "General",
      prompt: question.prompt,
      options: question.options,
      correctIndex: question.correctIndex,
      correctAnswer:
        question.correctIndex >= 0 && question.correctIndex < OPTION_LETTERS.length
          ? OPTION_LETTERS[question.correctIndex]
          : null,
      topic: question.topic || null,
      concepts: [],
      difficulty: question.difficulty || "medium",
      explanation: question.explanation || null,
      attachments: question.attachments,
      optionAttachments: question.optionAttachments,
    })),
  };
}

export async function parseGenericDocxImport({
  fileName,
  bytes,
  uploadsDir,
  publicBaseUrl = "",
  publicPathPrefix = "/uploads/",
}) {
  const zip = await JSZip.loadAsync(bytes);
  const documentFile = zip.file("word/document.xml");
  if (!documentFile) {
    return null;
  }

  const documentXml = await documentFile.async("string");
  const blocks = extractDocumentBlocks(documentXml);
  const relationshipMap = await extractRelationshipMap(zip);
  const {resolveBlock: resolveAttachmentsForBlock, resolveRef} = createAttachmentResolver({
    blocks,
    zip,
    relationshipMap,
    uploadsDir,
    publicBaseUrl,
    publicPathPrefix,
  });
  const titleFallback = fallbackTitleFromFileName(fileName);
  const lines = blocks
    .map((block) => normalizeText(block.text))
    .filter(Boolean);
  const answerKey = extractAnswerKey(lines);

  const instructions = [];
  const questions = [];
  let currentQuestion = null;
  let currentOptionIndex = -1;
  let startedQuestions = false;
  let activeSection = "General";

  for (const block of blocks) {
    const rawText = normalizeText(block.text);
    // Inline images: blocks where images appear alongside text already have
    // [[image:refId]] placeholders embedded in rawText.  Resolve them to real
    // URLs so the Flutter renderer can display them inline.  Image-only blocks
    // (rawText is empty or contains no placeholder) fall through to the old
    // attachment path so they are still associated with the right slot.
    const hasInlinePlaceholders = /\[\[image:[^\]]+\]\]/.test(rawText);
    const text = hasInlinePlaceholders
      ? await resolveInlineImagePlaceholders(rawText, resolveRef)
      : rawText;
    const attachments = hasInlinePlaceholders ? [] : await resolveAttachmentsForBlock(block);

    if (!text) {
      if (currentQuestion && attachments.length > 0) {
        appendAttachments(currentQuestion, inferGenericAttachmentTarget(currentQuestion, currentOptionIndex), attachments);
      }
      continue;
    }

    const questionStart = parseGenericQuestionStart(text);
    if (
      questionStart &&
      !shouldTreatAsQuestionStart({
        currentQuestion,
        questionStart,
      })
    ) {
      if (attachments.length > 0) {
        appendAttachments(currentQuestion, {kind: "question"}, attachments);
      }
    } else if (questionStart) {
      commitQuestion(questions, currentQuestion);
      currentQuestion = createEmptyQuestion(activeSection);
      currentQuestion.questionNumber = String(questionStart.number);
      currentQuestion.prompt = questionStart.text;
      currentQuestion.correctIndex = answerKey.get(questionStart.number) ?? -1;
      currentOptionIndex = -1;
      startedQuestions = true;
      if (attachments.length > 0) {
        appendAttachments(currentQuestion, {kind: "question"}, attachments);
      }
      continue;
    }

    if (!startedQuestions) {
      if (looksLikeSectionHeading(text)) {
        activeSection = text;
        continue;
      }
      instructions.push(text);
      continue;
    }

    if (!currentQuestion) {
      continue;
    }

    if (looksLikeSectionHeading(text)) {
      activeSection = text;
      continue;
    }

    if (/^(answer\s*key|solutions?|correct\s*answers?)$/i.test(text)) {
      break;
    }

    const inlineOptionSegments = extractInlineOptionSegments(text);
    if (inlineOptionSegments.length > 0) {
      for (const segment of inlineOptionSegments) {
        currentOptionIndex = segment.index;
        currentQuestion.options[currentOptionIndex] = segment.text;
      }
      if (attachments.length > 0) {
        const byOption = distributeAttachmentsByLastSeenMarker(block, inlineOptionSegments, attachments);
        for (const [optionIndex, optionAttachments] of byOption) {
          if (optionAttachments.length > 0) {
            currentOptionIndex = optionIndex;
            appendAttachments(currentQuestion, {kind: "option", index: optionIndex}, optionAttachments);
          }
        }
      }
      continue;
    }

    const answerMatch = text.match(
      /^(?:ans(?:wer)?|correct answer)\.?\s*[:\-]?\s*\(?([A-D]|[1-4])\)?$/i,
    );
    if (answerMatch) {
      currentQuestion.correctIndex = parseAnswerIndex(answerMatch[1]);
      currentOptionIndex = -1;
      continue;
    }

    if (currentOptionIndex >= 0) {
      currentQuestion.options[currentOptionIndex] = appendText(currentQuestion.options[currentOptionIndex], text);
      if (attachments.length > 0) {
        appendAttachments(currentQuestion, {kind: "option", index: currentOptionIndex}, attachments);
      }
    } else {
      currentQuestion.prompt = appendText(currentQuestion.prompt, text);
      if (attachments.length > 0) {
        appendAttachments(currentQuestion, {kind: "question"}, attachments);
      }
    }
  }

  commitQuestion(questions, currentQuestion);
  if (questions.length === 0) {
    return null;
  }

  return {
    title: titleFallback,
    instructions,
    questions: questions.map((question) => ({
      questionNumber: question.questionNumber || null,
      section: question.section || "General",
      prompt: question.prompt,
      options: question.options,
      correctIndex: question.correctIndex,
      correctAnswer:
        question.correctIndex >= 0 && question.correctIndex < OPTION_LETTERS.length
          ? OPTION_LETTERS[question.correctIndex]
          : null,
      topic: question.topic || null,
      concepts: [],
      difficulty: question.difficulty || "medium",
      explanation: question.explanation || null,
      attachments: question.attachments,
      optionAttachments: question.optionAttachments,
    })),
  };
}

function createEmptyQuestion(section) {
  return {
    questionNumber: null,
    section: section || "General",
    prompt: "",
    options: ["", "", "", ""],
    correctIndex: -1,
    explanation: null,
    topic: null,
    difficulty: "medium",
    attachments: [],
    optionAttachments: [[], [], [], []],
  };
}

function commitQuestion(questions, question) {
  if (!question) {
    return;
  }
  if (!question.prompt.trim()) {
    return;
  }
  questions.push({
    ...question,
    prompt: question.prompt.trim(),
    options: question.options.map((option) => option.trim()),
  });
}

function ensureQuestion(question, contextLabel) {
  if (!question) {
    throw new Error(`Found "${contextLabel}" before any question header. Start each question with "Q1:", "Q2:", etc.`);
  }
}

function parseAnswerIndex(value) {
  const normalized = String(value || "").trim().toUpperCase();
  if (!normalized) {
    return -1;
  }
  const match = normalized.match(/[A-D]/);
  if (match) {
    return OPTION_LETTERS.indexOf(match[0]);
  }
  const numeric = Number.parseInt(normalized, 10);
  if (Number.isInteger(numeric) && numeric >= 1 && numeric <= 4) {
    return numeric - 1;
  }
  return -1;
}

function normalizeDifficulty(value) {
  const normalized = String(value || "").trim().toLowerCase();
  if (normalized === "easy" || normalized === "medium" || normalized === "hard") {
    return normalized;
  }
  return "medium";
}

function appendText(existing, addition) {
  const base = String(existing || "").trim();
  const next = String(addition || "").trim();
  if (!base) {
    return next;
  }
  if (!next) {
    return base;
  }
  return `${base}\n${next}`;
}

function extractInlineOptionSegments(text) {
  const normalized = String(text || "").trim();
  if (!normalized || !/^[A-D]\s*[:.)-]\s*/i.test(normalized)) {
    return [];
  }

  // Require that the option letter is NOT preceded by another letter so we
  // match both "A) text B) text" (spaced) and "A)textB)text" (no space between
  // options, common in scanned/legacy DOCX math papers).
  const markerRegex = /(?<![A-Za-z])([A-D])\s*[:.)-]\s*/gi;
  const markers = [];
  let match;
  while ((match = markerRegex.exec(normalized)) !== null) {
    const letter = String(match[1] || "").toUpperCase();
    const markerIndex = match.index;
    const textStart = markerRegex.lastIndex;
    const optionIndex = OPTION_LETTERS.indexOf(letter);
    if (optionIndex >= 0) {
      markers.push({ optionIndex, markerIndex, textStart });
    }
  }

  if (markers.length === 0) {
    return [];
  }

  return markers.map((marker, index) => {
    const nextMarker = markers[index + 1];
    const end = nextMarker ? nextMarker.markerIndex : normalized.length;
    return {
      index: marker.optionIndex,
      text: normalized.slice(marker.textStart, end).trim(),
    };
  });
}

// Distribute a paragraph's attachments across its option slots using the
// interleaved token stream.  We walk the tokens and track which option letter
// was last seen before each image token; that image belongs to that option.
// This correctly handles both "A) text B) text" and "A)[img] B)[img]" layouts
// as well as the edge case where an image appears AFTER the last marker.
function distributeAttachmentsByLastSeenMarker(block, inlineOptionSegments, attachments) {
  const byOption = new Map(inlineOptionSegments.map((s) => [s.index, []]));

  if (!Array.isArray(block.tokens) || attachments.length === 0) {
    // No positional info available: fall back to assigning everything to the
    // last detected option (the previous behaviour).
    const lastIndex = inlineOptionSegments[inlineOptionSegments.length - 1].index;
    for (const att of attachments) {
      (byOption.get(lastIndex) || []).push(att);
    }
    return byOption;
  }

  let currentIndex = inlineOptionSegments[0].index;
  let runningText = "";
  let attachmentCursor = 0;

  for (const token of block.tokens) {
    if (token.kind === "text") {
      runningText += token.value;
      // After appending this chunk, find the last option marker that now
      // appears in the accumulated text and advance currentIndex to it.
      for (const segment of inlineOptionSegments) {
        const letter = OPTION_LETTERS[segment.index];
        if (new RegExp(`(?<![A-Za-z])${letter}\\s*[:.)-]`, "i").test(runningText)) {
          currentIndex = segment.index;
        }
      }
    } else if (token.kind === "image") {
      if (attachmentCursor < attachments.length) {
        const slot = byOption.get(currentIndex);
        if (slot) slot.push(attachments[attachmentCursor]);
        attachmentCursor++;
      }
    }
  }

  // Assign any attachments the token walk didn't reach to the last option.
  const lastIndex = inlineOptionSegments[inlineOptionSegments.length - 1].index;
  while (attachmentCursor < attachments.length) {
    const slot = byOption.get(lastIndex);
    if (slot) slot.push(attachments[attachmentCursor]);
    attachmentCursor++;
  }

  return byOption;
}

function appendAttachments(question, target, attachments) {
  if (!question || !target || attachments.length === 0) {
    return;
  }
  if (target.kind === "question") {
    question.attachments.push(...attachments);
    return;
  }
  if (target.kind === "option" && target.index >= 0 && target.index < question.optionAttachments.length) {
    question.optionAttachments[target.index].push(...attachments);
  }
}

function inferFallbackImageTarget({currentQuestion, activeOptionIndex, pendingImageTarget}) {
  if (!currentQuestion) {
    return null;
  }
  if (pendingImageTarget) {
    return pendingImageTarget;
  }
  if (activeOptionIndex >= 0 && activeOptionIndex < currentQuestion.optionAttachments.length) {
    return {
      kind: "option",
      index: activeOptionIndex,
    };
  }
  return currentQuestion.prompt.trim()
    ? {kind: "question"}
    : null;
}

function fallbackTitleFromFileName(fileName) {
  return String(fileName || "Imported Paper").replace(/\.[^.]+$/, "").trim() || "Imported Paper";
}

function normalizeText(value) {
  return normalizeImportedText(decodeXmlEntities(String(value || "")));
}

function decodeXmlEntities(value) {
  return String(value || "")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, "\"")
    .replace(/&apos;/g, "'")
    .replace(/&#(\d+);/g, (_match, code) => String.fromCodePoint(Number(code)))
    .replace(/&#x([0-9a-f]+);/gi, (_match, code) => String.fromCodePoint(Number.parseInt(code, 16)));
}

function extractDocumentBlocks(documentXml) {
  const bodyMatch = documentXml.match(/<w:body\b[\s\S]*?>([\s\S]*?)<\/w:body>/);
  const bodyXml = bodyMatch ? bodyMatch[1] : documentXml;
  const blocks = [];
  const childMatches = bodyXml.match(/<w:p\b[\s\S]*?<\/w:p>|<w:tbl\b[\s\S]*?<\/w:tbl>/g) || [];
  for (const blockXml of childMatches) {
    if (blockXml.startsWith("<w:tbl")) {
      const rowMatches = blockXml.match(/<w:tr\b[\s\S]*?<\/w:tr>/g) || [];
      for (const rowXml of rowMatches) {
        blocks.push(parseTableRowBlock(rowXml));
      }
      continue;
    }
    blocks.push(parseParagraphBlock(blockXml));
  }
  return blocks;
}

function parseParagraphBlock(paragraphXml) {
  return parseTextBlock(paragraphXml);
}

function parseTableRowBlock(rowXml) {
  const cellMatches = rowXml.match(/<w:tc\b[\s\S]*?<\/w:tc>/g) || [];
  const cellTexts = [];
  const imageRefs = [];
  for (const cellXml of cellMatches) {
    const block = parseTextBlock(cellXml);
    if (block.text.trim()) {
      cellTexts.push(block.text.trim());
    }
    imageRefs.push(...block.imageRefs);
  }
  return {
    text: cellTexts.join(" | "),
    imageRefs,
  };
}

function extractOmmlText(ommlXml) {
  const parts = [];
  for (const match of ommlXml.matchAll(/<m:t\b[^>]*>([\s\S]*?)<\/m:t>/g)) {
    const t = decodeXmlEntities(match[1]);
    if (t) parts.push(t);
  }
  return parts.join("");
}

function parseTextBlock(blockXml) {
  const xmlTokens = blockXml.match(
    /<m:oMathPara\b[\s\S]*?<\/m:oMathPara>|<m:oMath\b[\s\S]*?<\/m:oMath>|<w:r\b[\s\S]*?<\/w:r>|<w:tab\b[^>]*\/>|<w:br\b[^>]*\/>|<w:cr\b[^>]*\/>/g,
  ) || [];

  // Build interleaved tokens so callers know the document-order position of
  // each image relative to the surrounding text.  This is essential for
  // correctly distributing inline images to their option slots when a single
  // paragraph holds multiple options (e.g. "A)[img] B)[img]").
  const interleavedTokens = [];
  const imageRefs = [];
  let text = "";

  for (const xmlToken of xmlTokens) {
    if (xmlToken.startsWith("<m:o")) {
      const mathText = extractOmmlText(xmlToken).trim();
      if (mathText) {
        text += mathText;
        interleavedTokens.push({kind: "text", value: mathText});
      }
      continue;
    }
    if (xmlToken.startsWith("<w:r")) {
      // Collect any image references embedded in this run.  Image runs
      // (drawings / VML shapes) contain r:embed / r:link or v:imagedata r:id
      // attributes but no <w:t> text, so text and image emissions are
      // mutually exclusive in practice.
      const runRefs = [
        ...xmlToken.matchAll(/(?:r:embed|r:link)="([^"]+)"/g),
        ...xmlToken.matchAll(/<v:imagedata\b[^>]*r:id="([^"]+)"/g),
      ].map((m) => m[1]).filter(Boolean);

      const runText = renderWordRun(xmlToken);
      if (runText) {
        text += runText;
        interleavedTokens.push({kind: "text", value: runText});
      }
      for (const refId of runRefs) {
        imageRefs.push(refId);
        interleavedTokens.push({kind: "image", refId});
      }
      continue;
    }
    if (xmlToken.startsWith("<w:tab")) {
      text += "\t";
      interleavedTokens.push({kind: "text", value: "\t"});
      continue;
    }
    text += "\n";
    interleavedTokens.push({kind: "text", value: "\n"});
  }

  text = normalizeDocxInlineFormatting(text);

  // When a paragraph mixes text and image tokens, rebuild the text string with
  // [[image:refId]] placeholders so callers can render the images inline at the
  // correct position rather than appending them as separate block attachments.
  const hasTextTokens = interleavedTokens.some((t) => t.kind === "text" && t.value.trim());
  const hasImageTokens = interleavedTokens.some((t) => t.kind === "image");
  if (hasTextTokens && hasImageTokens) {
    const inlineText = interleavedTokens
      .map((t) => (t.kind === "text" ? t.value : `[[image:${t.refId}]]`))
      .join("");
    text = normalizeDocxInlineFormatting(inlineText);
  }

  return {text, imageRefs, tokens: interleavedTokens};
}

function renderWordRun(runXml) {
  const symbolFont = /<w:rFonts\b[^>]*(?:w:ascii|w:hAnsi)="Symbol"[^>]*\/?>/i.test(
    runXml,
  );
  const superscript = /<w:vertAlign\b[^>]*w:val="superscript"[^>]*\/>/i.test(runXml);
  const subscript = /<w:vertAlign\b[^>]*w:val="subscript"[^>]*\/>/i.test(runXml);
  let text = runXml
    .replace(/<w:tab\b[^>]*\/>/g, "\t")
    .replace(/<w:br\b[^>]*\/>/g, "\n")
    .replace(/<w:cr\b[^>]*\/>/g, "\n")
    .replace(/<w:t\b[^>]*>([\s\S]*?)<\/w:t>/g, (_match, content) => decodeXmlEntities(content))
    .replace(/<[^>]+>/g, "");
  text = repairCommonMojibake(text);
  if (symbolFont) {
    text = normalizeDocxSymbolText(text);
  }
  if (superscript) {
    return toSuperscript(text);
  }
  if (subscript) {
    return toSubscript(text);
  }
  return text;
}

function normalizeDocxInlineFormatting(value) {
  return String(value || "")
    .replace(/([+\-]?\d+(?:\.\d+)?)\s*⁰(?=\s*[CFK])/g, "$1°")
    .replace(/\b0\s*⁰(?=\s*[CFK])/g, "0°");
}

function parseGenericQuestionStart(text) {
  const explicitMatch = text.match(/^Q(?:UESTION)?\s*[.: -]?\s*(\d+)\s*[:.\-]?\s*(.*)$/i);
  if (explicitMatch) {
    return {
      kind: "explicit",
      number: Number.parseInt(explicitMatch[1], 10),
      text: String(explicitMatch[2] || "").trim(),
    };
  }
  const match = text.match(/^(\d+)\s*[\).]\s+(.+)$/)
    || text.match(/^(\d+)\s*\.\s+(.+)$/);
  if (!match) {
    return null;
  }
  return {
    kind: "numeric",
    number: Number.parseInt(match[1], 10),
    text: String(match[2] || "").trim(),
  };
}

function shouldTreatAsQuestionStart({currentQuestion, questionStart}) {
  if (!questionStart) {
    return false;
  }
  if (questionStart.kind === "explicit") {
    return true;
  }
  if (!currentQuestion) {
    return true;
  }
  const currentNumber = Number.parseInt(String(currentQuestion.questionNumber || ""), 10);
  if (!Number.isFinite(currentNumber)) {
    return true;
  }
  return questionStart.number > currentNumber;
}

function looksLikeSectionHeading(text) {
  const normalized = String(text || "").trim();
  if (!normalized) {
    return false;
  }
  if (normalized.length > 40) {
    return false;
  }
  if (/\p{N}/u.test(normalized)) {
    return false;
  }
  if (/^(ans?|answer|correct answer|solutions?)\.?$/i.test(normalized)) {
    return false;
  }
  if (/[=+*/\\()[\]{}<>|]/.test(normalized)) {
    return false;
  }
  if (/[^\p{L}\s&/.,'-]/u.test(normalized)) {
    return false;
  }
  const letterCount = (normalized.match(/\p{L}/gu) || []).length;
  if (letterCount < 3) {
    return false;
  }
  const tokens = normalized
    .split(/\s+/)
    .map((token) => token.replace(/[^A-Z]/g, ""))
    .filter(Boolean);
  if (!tokens.some((token) => token.length >= 4)) {
    return false;
  }
  return normalized === normalized.toUpperCase();
}

function extractAnswerKey(lines) {
  const answerKey = new Map();
  const startIndex = lines.findIndex((line) => /^(answer\s*key|solutions?|correct\s*answers?)$/i.test(String(line || "").trim()));
  if (startIndex < 0) {
    return answerKey;
  }
  for (let index = startIndex + 1; index < lines.length; index += 1) {
    const line = String(lines[index] || "").trim();
    if (!line) {
      continue;
    }
    const match = line.match(/^(\d+)\s*[\).:\-]?\s*(?:answer|correct answer)?\s*[:\-]?\s*\(?([A-D])\)?$/i)
      || line.match(/^(\d+)\s*[|,:-]\s*\(?([A-D])\)?(?:\s*[|,:-].*)?$/i);
    if (match) {
      answerKey.set(Number.parseInt(match[1], 10), OPTION_LETTERS.indexOf(match[2].toUpperCase()));
    }
  }
  return answerKey;
}

function inferGenericAttachmentTarget(currentQuestion, currentOptionIndex) {
  if (currentOptionIndex >= 0 && currentOptionIndex < currentQuestion.optionAttachments.length) {
    return {
      kind: "option",
      index: currentOptionIndex,
    };
  }
  return {kind: "question"};
}

async function extractRelationshipMap(zip) {
  const relsFile = zip.file("word/_rels/document.xml.rels");
  if (!relsFile) {
    return new Map();
  }
  const relsXml = await relsFile.async("string");
  const matches = [...relsXml.matchAll(/<Relationship\b[^>]*Id="([^"]+)"[^>]*Target="([^"]+)"[^>]*\/?>/g)];
  const relationshipMap = new Map();
  for (const match of matches) {
    const target = match[2].replace(/\\/g, "/");
    relationshipMap.set(match[1], normalizeDocxTarget(target));
  }
  return relationshipMap;
}

function normalizeDocxTarget(target) {
  const normalized = path.posix.normalize(path.posix.join("word", target));
  return normalized.startsWith("word/") ? normalized : path.posix.join("word", normalized);
}

async function resolveInlineImagePlaceholders(text, resolveRef) {
  const pattern = /\[\[image:([^\]]+)\]\]/g;
  const matches = [...String(text || "").matchAll(pattern)];
  if (matches.length === 0) return text;
  const resolutions = await Promise.all(matches.map((m) => resolveRef(m[1])));
  let i = 0;
  return String(text).replace(pattern, () => {
    const attachments = resolutions[i++] || [];
    return attachments.length > 0 ? `[[image:${attachments[0].url}]]` : "";
  });
}

async function materializeAttachmentsForBlock({
  block,
  resolveAttachment,
}) {
  if (!Array.isArray(block?.imageRefs) || block.imageRefs.length === 0) {
    return [];
  }
  const resolved = await Promise.all(block.imageRefs.map((refId) => resolveAttachment(refId)));
  return resolved.flat().filter(Boolean);
}

function createAttachmentResolver({
  blocks,
  zip,
  relationshipMap,
  uploadsDir,
  publicBaseUrl,
  publicPathPrefix,
}) {
  const uniqueRefIds = [
    ...new Set(
      (Array.isArray(blocks) ? blocks : [])
        .flatMap((block) => (Array.isArray(block?.imageRefs) ? block.imageRefs : []))
        .filter(Boolean),
    ),
  ];
  const normalizedPrefix = String(publicPathPrefix || "/uploads/").replace(/\/+$/, "");
  const limit = createConcurrencyLimiter(3);
  const attachmentPromises = new Map();

  const resolveAttachment = (refId) => {
    if (!attachmentPromises.has(refId)) {
      attachmentPromises.set(
        refId,
        limit(async () => {
          const zipPath = relationshipMap.get(refId);
          if (!zipPath) {
            return [];
          }
          const file = zip.file(zipPath);
          if (!file) {
            return [];
          }
          const buffer = await file.async("nodebuffer");
          const extension =
            path.extname(zipPath).replace(/^\./, "").toLowerCase() || "png";
          const converted = await maybeConvertOfficeVectorAttachment({
            buffer,
            extension,
            label: path.basename(zipPath),
          });
          const attachmentBuffer = converted?.buffer || buffer;
          const safeExt = normalizeImageExtension(converted?.extension || extension);
          const filename = `question-import-${Date.now()}-${crypto.randomBytes(4).toString("hex")}.${safeExt}`;
          await fs.promises.writeFile(path.join(uploadsDir, filename), attachmentBuffer);
          const relativeUrl = `${normalizedPrefix}/${filename}`;
          return [
            {
              url: joinPublicUrl(publicBaseUrl, relativeUrl),
              mimeType: mimeTypeForExtension(safeExt),
              label: path.basename(zipPath),
            },
          ];
        }),
      );
    }
    return attachmentPromises.get(refId);
  };

  for (const refId of uniqueRefIds) {
    resolveAttachment(refId);
  }

  const resolveBlock = (block) =>
    materializeAttachmentsForBlock({
      block,
      resolveAttachment,
    });

  return {resolveBlock, resolveRef: resolveAttachment};
}

function createConcurrencyLimiter(limit) {
  let activeCount = 0;
  const queue = [];

  const runNext = () => {
    if (activeCount >= limit || queue.length === 0) {
      return;
    }
    activeCount += 1;
    const task = queue.shift();
    Promise.resolve()
      .then(task.work)
      .then(task.resolve, task.reject)
      .finally(() => {
        activeCount -= 1;
        runNext();
      });
  };

  return (work) =>
    new Promise((resolve, reject) => {
      queue.push({work, resolve, reject});
      runNext();
    });
}

function normalizeImageExtension(extension) {
  const allowed = new Set([
    "png",
    "jpg",
    "jpeg",
    "webp",
    "gif",
    "bmp",
    "tif",
    "tiff",
    "svg",
    "emf",
    "wmf",
  ]);
  return allowed.has(extension) ? extension : "png";
}

function mimeTypeForExtension(extension) {
  switch (extension) {
    case "jpg":
    case "jpeg":
      return "image/jpeg";
    case "webp":
      return "image/webp";
    case "gif":
      return "image/gif";
    case "bmp":
      return "image/bmp";
    case "svg":
      return "image/svg+xml";
    case "emf":
      return "image/emf";
    case "wmf":
      return "image/wmf";
    case "tif":
    case "tiff":
      return "image/tiff";
    default:
      return "image/png";
  }
}

async function maybeConvertOfficeVectorAttachment({buffer, extension, label}) {
  const normalizedExt = String(extension || "").trim().toLowerCase();
  if (!["emf", "wmf"].includes(normalizedExt)) {
    return null;
  }

  try {
    return await convertWithLibreOffice({buffer, extension: normalizedExt, label});
  } catch (error) {
    console.warn(
      `[docx-import] Failed to convert ${label || `attachment.${normalizedExt}`} with LibreOffice:`,
      error instanceof Error ? error.message : error,
    );
    return null;
  }
}

export async function convertOfficeVectorAttachmentToPng({
  buffer,
  extension,
  label,
}) {
  return maybeConvertOfficeVectorAttachment({buffer, extension, label});
}

async function convertWithLibreOffice({buffer, extension, label}) {
  const tempRoot = await fs.promises.mkdtemp(path.join(os.tmpdir(), "ml-docx-import-"));
  const inputName = `${label || "attachment"}`.replace(/[^\w.-]+/g, "_");
  const sourcePath = path.join(
    tempRoot,
    inputName.toLowerCase().endsWith(`.${extension}`) ? inputName : `${inputName}.${extension}`,
  );
  await fs.promises.writeFile(sourcePath, buffer);

  try {
    const convertedPath = await convertOfficeVectorToPng({
      sourcePath,
      tempRoot,
    });

    await optimizeConvertedPng(convertedPath);
    const convertedBuffer = await fs.promises.readFile(convertedPath);
    return {
      buffer: convertedBuffer,
      extension: "png",
    };
  } finally {
    await fs.promises.rm(tempRoot, {recursive: true, force: true}).catch(() => {});
  }
}

async function convertOfficeVectorToPng({sourcePath, tempRoot}) {
  const baseName = path.basename(sourcePath, path.extname(sourcePath));
  const directPngPath = path.join(tempRoot, `${baseName}.png`);
  const directResult = await tryConvertOfficeVectorDirect({
    sourcePath,
    tempRoot,
    directPngPath,
  });
  if (directResult?.useDirect) {
    return directPngPath;
  }

  const pdfPath = path.join(tempRoot, `${baseName}.pdf`);
  try {
    await runProcess(
      "soffice",
      [
        "--headless",
        "--convert-to",
        "pdf",
        "--outdir",
        tempRoot,
        sourcePath,
      ],
      {cwd: tempRoot, timeoutMs: 45000},
    );
    await runProcess(
      "pdftocairo",
      [
        "-png",
        "-singlefile",
        "-r",
        "600",
        pdfPath,
        path.join(tempRoot, baseName),
      ],
      {cwd: tempRoot, timeoutMs: 45000},
    );
    return path.join(tempRoot, `${baseName}.png`);
  } catch (error) {
    if (await fileExists(directPngPath)) {
      return directPngPath;
    }
    throw error;
  }
}

async function tryConvertOfficeVectorDirect({sourcePath, tempRoot, directPngPath}) {
  try {
    await runProcess(
      "soffice",
      [
        "--headless",
        "--convert-to",
        "png",
        "--outdir",
        tempRoot,
        sourcePath,
      ],
      {cwd: tempRoot, timeoutMs: 25000},
    );
  } catch (_error) {
    return null;
  }

  if (!(await fileExists(directPngPath))) {
    return null;
  }

  const analysis = await analyzeRasterForDirectUse(directPngPath);
  if (!analysis) {
    return null;
  }
  return {
    useDirect: analysis.maxDim >= 900 || analysis.inkCoverage >= 0.08,
    analysis,
  };
}

async function analyzeRasterForDirectUse(filePath) {
  const script = `
from PIL import Image
import json

path = ${JSON.stringify(filePath)}
with Image.open(path) as image:
    source = image.convert("L")
    mask = source.point(lambda value: 255 if value < 245 else 0)
    bbox = mask.getbbox()
    if bbox is None:
        print(json.dumps({"maxDim": 0, "inkCoverage": 0}))
    else:
        width = max(1, bbox[2] - bbox[0])
        height = max(1, bbox[3] - bbox[1])
        mask_crop = mask.crop(bbox)
        non_white = sum(1 for value in mask_crop.getdata() if value)
        ink_coverage = non_white / max(1, width * height)
        print(json.dumps({"maxDim": max(width, height), "inkCoverage": ink_coverage}))
`;
  const {stdout} = await runProcess("python3", ["-c", script], {timeoutMs: 10000});
  try {
    return JSON.parse(stdout.trim());
  } catch (_error) {
    return null;
  }
}

/**
 * Convert a DOCX buffer to a PDF buffer using LibreOffice.
 * This is the only reliable way to handle DOCX files that use legacy OLE
 * Equation Editor objects (WMF/EMF images) — mammoth and OMML extraction
 * cannot read them, but LibreOffice renders them correctly into the PDF.
 */
export async function convertDocxToPdfBuffer(bytes) {
  const tempRoot = await fs.promises.mkdtemp(path.join(os.tmpdir(), "ml-docx-pdf-"));
  const sourcePath = path.join(tempRoot, "document.docx");
  await fs.promises.writeFile(sourcePath, Buffer.from(bytes));
  try {
    await runProcess(
      "soffice",
      ["--headless", "--convert-to", "pdf", "--outdir", tempRoot, sourcePath],
      {cwd: tempRoot, timeoutMs: 90000},
    );
    const pdfPath = path.join(tempRoot, "document.pdf");
    if (!(await fileExists(pdfPath))) {
      throw new Error("LibreOffice did not produce a PDF output.");
    }
    return await fs.promises.readFile(pdfPath);
  } finally {
    await fs.promises.rm(tempRoot, {recursive: true, force: true}).catch(() => {});
  }
}

/**
 * Returns true when the DOCX zip contains WMF/EMF media files that signal
 * legacy OLE Equation Editor content (i.e. math that cannot be read as text).
 */
export async function docxHasOleEquations(bytes) {
  try {
    const zip = await JSZip.loadAsync(bytes);
    return Object.keys(zip.files).some(
      (name) => /^word\/media\/.+\.(wmf|emf)$/i.test(name),
    );
  } catch (_error) {
    return false;
  }
}

async function fileExists(filePath) {
  try {
    await fs.promises.access(filePath, fs.constants.F_OK);
    return true;
  } catch (_error) {
    return false;
  }
}

async function optimizeConvertedPng(filePath) {
  const script = `
from PIL import Image, ImageFilter

path = ${JSON.stringify(filePath)}
with Image.open(path) as image:
    source = image.convert("RGBA")
    grayscale = source.convert("L")
    mask = grayscale.point(lambda value: 255 if value < 245 else 0)
    bbox = mask.getbbox()
    if bbox is None:
        source.save(path)
    else:
        padding = 32
        left = max(0, bbox[0] - padding)
        top = max(0, bbox[1] - padding)
        right = min(source.width, bbox[2] + padding)
        bottom = min(source.height, bbox[3] + padding)
        cropped = source.crop((left, top, right, bottom))
        width, height = cropped.size
        max_dim = max(width, height)
        min_dim = min(width, height)
        if max_dim < 1400:
            scale = max(1.0, 1400 / max_dim)
            resized = cropped.resize(
                (max(1, int(round(width * scale))), max(1, int(round(height * scale)))),
                Image.Resampling.LANCZOS,
            )
            cropped = resized.filter(ImageFilter.UnsharpMask(radius=1.6, percent=180, threshold=2))
        elif min_dim < 220:
            scale = 220 / max(1, min_dim)
            resized = cropped.resize(
                (max(1, int(round(width * scale))), max(1, int(round(height * scale)))),
                Image.Resampling.LANCZOS,
            )
            cropped = resized.filter(ImageFilter.UnsharpMask(radius=1.3, percent=160, threshold=2))
        cropped.save(path)
`;
  await runProcess("python3", ["-c", script], {timeoutMs: 15000});
}

function runProcess(command, args, {cwd, timeoutMs} = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      cwd,
      stdio: ["ignore", "pipe", "pipe"],
    });
    let settled = false;
    let stderr = "";
    let stdout = "";
    const timeoutId =
      timeoutMs && timeoutMs > 0
        ? setTimeout(() => {
            if (settled) {
              return;
            }
            settled = true;
            child.kill("SIGKILL");
            reject(
              new Error(
                `${command} ${args.join(" ")} timed out after ${timeoutMs}ms.`,
              ),
            );
          }, timeoutMs)
        : null;

    child.stdout.on("data", (chunk) => {
      stdout += chunk.toString();
    });
    child.stderr.on("data", (chunk) => {
      stderr += chunk.toString();
    });
    child.on("error", (error) => {
      if (settled) {
        return;
      }
      settled = true;
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      reject(error);
    });
    child.on("close", (code) => {
      if (settled) {
        return;
      }
      settled = true;
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      if (code === 0) {
        resolve({stdout, stderr});
        return;
      }
      reject(
        new Error(
          `${command} exited with code ${code}.${stderr ? ` stderr: ${stderr.trim()}` : ""}${stdout ? ` stdout: ${stdout.trim()}` : ""}`,
        ),
      );
    });
  });
}

function joinPublicUrl(base, relativePath) {
  const normalizedRelative = relativePath.startsWith("/") ? relativePath : `/${relativePath}`;
  const trimmedBase = String(base || "").trim().replace(/\/+$/, "");
  if (!trimmedBase) {
    return normalizedRelative;
  }
  return `${trimmedBase}${normalizedRelative}`;
}
