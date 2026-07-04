export const PARSER_VERSION = "deterministic-v2";

export const OPTION_LETTERS = ["A", "B", "C", "D"];

export const MATH_SYMBOLS = "∫√≤≥≠±×÷πθαβγΔΩμλ∑∞";

export function createDocumentIr({sourceType, blocks = [], pages = [], warnings = [], metadata = {}}) {
  return {
    sourceType,
    blocks,
    pages,
    warnings,
    metadata,
  };
}

export function paragraphBlock({text, spans = [], page, x, y, width, height, style = {}}) {
  return {
    kind: "paragraph",
    text: String(text || ""),
    spans,
    page,
    x,
    y,
    width,
    height,
    style,
  };
}

export function tableBlock({rows = [], page}) {
  return {
    kind: "table",
    rows,
    page,
  };
}

export function pageBreakBlock({page}) {
  return {
    kind: "pageBreak",
    page,
  };
}

export function imageBlock({alt = "", page, metadata = {}} = {}) {
  return {
    kind: "image",
    alt,
    page,
    metadata,
  };
}

export function textSpan({text, source = "text", ...rest}) {
  return {
    text: String(text || ""),
    source,
    ...rest,
  };
}

export function blockToText(block) {
  if (!block) {
    return "";
  }
  if (block.kind === "paragraph") {
    return String(block.text || "").trim();
  }
  if (block.kind === "table") {
    return block.rows
      .map((row) => row.map((cell) => String(cell?.text || "").trim()).filter(Boolean).join(" | "))
      .filter(Boolean)
      .join("\n");
  }
  return "";
}

export function blocksToText(blocks) {
  return (blocks || [])
    .map(blockToText)
    .filter(Boolean)
    .join("\n");
}

export function normalizeStructuralWhitespace(value) {
  return String(value || "")
    .replace(/\u00a0/g, " ")
    .replace(/[\t\f\v]+/g, " ")
    .replace(/ {2,}/g, " ")
    .replace(/ *\n+ */g, "\n")
    .trim();
}

export function fileTitle(fileName) {
  return String(fileName || "Imported Paper").replace(/\.[^.]+$/, "").trim() || "Imported Paper";
}

export function answerLetterFromValue(value) {
  const raw = String(value || "").trim().toUpperCase();
  if (/^[A-D]$/.test(raw)) {
    return raw;
  }
  if (/^[1-4]$/.test(raw)) {
    return OPTION_LETTERS[Number(raw) - 1];
  }
  const match = raw.match(/\b([A-D])\b/);
  if (match) {
    return match[1];
  }
  return null;
}

export function hasSuspiciousMathArtifact(value) {
  return /�|□|\(cid:\d+\)/i.test(String(value || ""));
}
