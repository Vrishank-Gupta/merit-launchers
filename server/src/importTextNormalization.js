const MOJIBAKE_TRIGGER = /[ÃÂâÎÏï]/;
const PRIVATE_USE_CHARS = /[\uE000-\uF8FF]/gu;

const DIRECT_REPLACEMENTS = new Map([
  ["Ã—", "\u00d7"],
  ["âˆ’", "-"],
  ["â€“", "-"],
  ["â€”", "-"],
  ["â‰ ", "\u2260"],
  ["â‰¤", "\u2264"],
  ["â‰¥", "\u2265"],
  ["âˆš", "\u221a"],
  ["âˆ†", "\u2206"],
  ["â†’", "\u2192"],
  ["â†”", "\u2194"],
  ["Â°", "\u00b0"],
  ["Â±", "\u00b1"],
  ["Âµ", "\u00b5"],
  ["Â¹", "\u00b9"],
  ["Â²", "\u00b2"],
  ["Â³", "\u00b3"],
  ["â°", "\u2070"],
  ["â±", "\u2071"],
  ["â´", "\u2074"],
  ["âµ", "\u2075"],
  ["â¶", "\u2076"],
  ["â·", "\u2077"],
  ["â¸", "\u2078"],
  ["â¹", "\u2079"],
  ["âº", "\u207a"],
  ["â»", "\u207b"],
  ["â¼", "\u207c"],
  ["â½", "\u207d"],
  ["â¾", "\u207e"],
  ["â¿", "\u207f"],
  ["â‚€", "\u2080"],
  ["â‚", "\u2081"],
  ["â‚‚", "\u2082"],
  ["â‚ƒ", "\u2083"],
  ["â‚„", "\u2084"],
  ["â‚…", "\u2085"],
  ["â‚†", "\u2086"],
  ["â‚‡", "\u2087"],
  ["â‚ˆ", "\u2088"],
  ["â‚‰", "\u2089"],
  ["â‚Š", "\u208a"],
  ["â‚‹", "\u208b"],
  ["â‚Œ", "\u208c"],
  ["â‚", "\u208d"],
  ["â‚Ž", "\u208e"],
  ["Î”", "\u0394"],
  ["Î²", "\u03b2"],
  ["Ï€", "\u03c0"],
  ["Ï‰", "\u03c9"],
  ["Î±", "\u03b1"],
  ["Î³", "\u03b3"],
  ["Â·", "\u00b7"],
]);

const SUPERSCRIPT_MAP = new Map([
  ["0", "\u2070"],
  ["1", "\u00b9"],
  ["2", "\u00b2"],
  ["3", "\u00b3"],
  ["4", "\u2074"],
  ["5", "\u2075"],
  ["6", "\u2076"],
  ["7", "\u2077"],
  ["8", "\u2078"],
  ["9", "\u2079"],
  ["+", "\u207a"],
  ["-", "\u207b"],
  ["=", "\u207c"],
  ["(", "\u207d"],
  [")", "\u207e"],
  ["n", "\u207f"],
  ["i", "\u2071"],
]);

const SUBSCRIPT_MAP = new Map([
  ["0", "\u2080"],
  ["1", "\u2081"],
  ["2", "\u2082"],
  ["3", "\u2083"],
  ["4", "\u2084"],
  ["5", "\u2085"],
  ["6", "\u2086"],
  ["7", "\u2087"],
  ["8", "\u2088"],
  ["9", "\u2089"],
  ["+", "\u208a"],
  ["-", "\u208b"],
  ["=", "\u208c"],
  ["(", "\u208d"],
  [")", "\u208e"],
]);

export function normalizeImportedText(value, {preserveNewlines = true} = {}) {
  let normalized = replaceKnownMojibake(repairCommonMojibake(String(value || "")))
    .replace(/\u00a0/g, " ")
    .replace(PRIVATE_USE_CHARS, " ")
    .replace(/\r\n?/g, "\n");

  normalized = normalizeObservedImportArtifacts(normalized);

  if (preserveNewlines) {
    return normalized
      .replace(/[ \t\f\v]+/g, " ")
      .replace(/ *\n+ */g, "\n")
      .trim();
  }

  return normalized.replace(/\s+/g, " ").trim();
}

export function repairCommonMojibake(value) {
  const input = String(value || "");
  if (!MOJIBAKE_TRIGGER.test(input)) {
    return input;
  }
  const repaired = Buffer.from(input, "latin1").toString("utf8");
  const score = (sample) => (String(sample || "").match(MOJIBAKE_TRIGGER) || []).length;
  return score(repaired) < score(input) ? repaired : input;
}

export function normalizeDocxSymbolText(value) {
  const symbolFontMap = new Map([
    ["\uf044", "\u0394"],
    ["\uf070", "\u03c0"],
    ["\uf077", "\u03c9"],
    ["\uf076", "\u03c9"],
    ["\uf0b4", "\u00d7"],
    ["\uf02d", "-"],
    ["\uf0d6", "\u221a"],
  ]);

  const legacyMap = new Map([
    ["D", "\u0394"],
    ["b", "\u03b2"],
    ["p", "\u03c0"],
    ["v", "\u03c9"],
    ["w", "\u03c9"],
    ["\u00b9", "\u2260"],
    ["\u00d6", "\u221a"],
    ["\u00d7", "\u00d7"],
  ]);

  return [...String(value || "")]
    .map((char) => symbolFontMap.get(char) || legacyMap.get(char) || char)
    .join("");
}

export function toSuperscript(value) {
  return [...String(value || "")]
    .map((char) => SUPERSCRIPT_MAP.get(char) || char)
    .join("");
}

export function toSubscript(value) {
  return [...String(value || "")]
    .map((char) => SUBSCRIPT_MAP.get(char) || char)
    .join("");
}

function replaceKnownMojibake(value) {
  let output = String(value || "");
  for (const [from, to] of DIRECT_REPLACEMENTS.entries()) {
    output = output.replaceAll(from, to);
  }
  return output;
}

function normalizeObservedImportArtifacts(value) {
  return String(value || "")
    .replace(/(\d)\s*[Oo0]\s*([CFK])\b/g, "$1\u00b0$2")
    .replace(/([=(:,\s])[–−-]\s+(\d)/g, "$1-$2")
    .replace(/([=<>])\s*O\b/g, "$1 0")
    .replace(/([A-Za-z0-9\u2080-\u2089])([<>])([A-Za-z0-9\u2080-\u2089])/g, "$1 $2 $3")
    .replace(/\bratio\s+([A-Za-z])J([A-Za-z])\b/g, "ratio $1/$2")
    .replace(/\b([A-Za-z])J([A-Za-z])(?=\s*(?:ratio|energy|temperature)\b)/g, "$1/$2")
    .replace(/([+\-])\s+([0-9])/g, "$1$2")
    .replace(/\s+([,.;:?])/g, "$1");
}
