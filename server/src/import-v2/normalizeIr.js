import {blockToText, createDocumentIr, hasSuspiciousMathArtifact, normalizeStructuralWhitespace, paragraphBlock, textSpan} from "./documentIr.js";
import {repairPrivateUseMathGlyphs} from "./mathGlyphRepair.js";

const HEADER_FOOTER_PAGE_RATIO = 0.6;

export function normalizeIr(ir) {
  const warnings = [...(ir.warnings || [])];
  const suspiciousMathBlocks = [];
  const repeated = findRepeatedPageChrome(ir.blocks || []);
  const blocks = [];

  for (const block of ir.blocks || []) {
    if (!block || block.kind === "pageBreak") {
      continue;
    }
    if (isRepeatedChrome(block, repeated)) {
      continue;
    }
    if (block.kind === "paragraph") {
      const text = normalizeQuestionMarkers(normalizeStructuralWhitespace(repairPrivateUseMathGlyphs(block.text)));
      if (!text) {
        continue;
      }
      const splitTexts = splitEmbeddedQuestionStarts(text);
      for (const splitText of splitTexts) {
        if (hasSuspiciousMathArtifact(splitText)) {
          suspiciousMathBlocks.push(splitText.slice(0, 160));
        }
        blocks.push({
          ...block,
          text: splitText,
          spans: [textSpan({text: splitText, source: "text"})],
        });
      }
      continue;
    }
    if (block.kind === "table") {
      const rows = (block.rows || [])
        .map((row) => row.map((cell) => ({
          ...cell,
          text: normalizeStructuralWhitespace(repairPrivateUseMathGlyphs(cell?.text || "")),
        })))
        .filter((row) => row.some((cell) => cell.text));
      if (rows.length > 0) {
        blocks.push({...block, rows});
      }
      continue;
    }
    const text = normalizeStructuralWhitespace(repairPrivateUseMathGlyphs(blockToText(block)));
    if (text) {
      blocks.push(paragraphBlock({text, spans: [textSpan({text, source: "text"})]}));
    }
  }

  if (suspiciousMathBlocks.length > 0) {
    warnings.push("Suspicious PDF/text glyph artifacts were detected; math may require review.");
  }

  return createDocumentIr({
    ...ir,
    blocks,
    warnings,
    metadata: {
      ...(ir.metadata || {}),
      suspiciousMathBlocks,
    },
  });
}

function normalizeQuestionMarkers(value) {
  return String(value || "")
    .replace(/\^\{\(([A-Da-d])\)\}/g, "($1)")
    .replace(/\^\{([A-Da-d][\).:\-])\}/g, "$1")
    .replace(/\^\{(\d{1,3})\.\s*([^}]*)\}/g, (_match, number, rest) => {
      const normalizedRest = String(rest || "")
        .replace(/([a-z])([A-Z])/g, "$1 $2")
        .replace(/([a-z])and([a-z])/gi, "$1 and $2")
        .replace(/([a-z])then([a-z])/gi, "$1 then $2")
        .trim();
      return `${number}. ${normalizedRest}`.trim();
    })
    .replace(/\^\{(\d{1,3})\.\s*/g, "$1. ");
}

function splitEmbeddedQuestionStarts(text) {
  const normalized = String(text || "").trim();
  if (!normalized) {
    return [];
  }

  const markerRe = /(?:^|\n)(\d{1,3})\.\s+\S/g;
  const starts = [];
  let match;
  while ((match = markerRe.exec(normalized)) !== null) {
    const markerIndex = match.index + (normalized[match.index] === "\n" ? 1 : 0);
    const questionNumber = Number(match[1]);
    if (Number.isInteger(questionNumber) && questionNumber > 0 && questionNumber <= 400) {
      starts.push(markerIndex);
    }
  }

  if (starts.length <= 1 || starts[0] !== 0) {
    return [normalized];
  }

  const parts = [];
  for (let index = 0; index < starts.length; index += 1) {
    const start = starts[index];
    const end = starts[index + 1] ?? normalized.length;
    const part = normalized.slice(start, end).trim();
    if (part) {
      parts.push(part);
    }
  }
  return parts.length > 0 ? parts : [normalized];
}

function findRepeatedPageChrome(blocks) {
  const pageCount = Math.max(0, ...blocks.map((block) => Number(block.page) || 0));
  if (pageCount < 3) {
    return new Set();
  }
  const counts = new Map();
  for (const block of blocks) {
    if (block.kind !== "paragraph" || !block.page) {
      continue;
    }
    const y = Number(block.y);
    const nearPageEdge = Number.isFinite(y) && (y < 90 || y > 720);
    if (!nearPageEdge) {
      continue;
    }
    const text = normalizeStructuralWhitespace(block.text).toLowerCase();
    if (text.length < 3 || /^\d{1,3}$/.test(text)) {
      continue;
    }
    counts.set(text, (counts.get(text) || 0) + 1);
  }
  return new Set(
    [...counts.entries()]
      .filter(([, count]) => count / pageCount >= HEADER_FOOTER_PAGE_RATIO)
      .map(([text]) => text),
  );
}

function isRepeatedChrome(block, repeated) {
  if (block.kind !== "paragraph" || repeated.size === 0) {
    return false;
  }
  return repeated.has(normalizeStructuralWhitespace(block.text).toLowerCase());
}
