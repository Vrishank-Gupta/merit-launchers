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

// Full Adobe/Windows Symbol font PUA mapping.
// Word encodes Symbol font chars as U+F000 + code_point.
// Only non-ASCII-passthrough code points are listed; digits 0x30-0x39 pass through.
const SYMBOL_FONT_MAP = new Map([
  // Punctuation / operators that differ from ASCII
  ["\uf022", "\u2200"], // \u2200 for all
  ["\uf024", "\u2203"], // \u2203 there exists
  ["\uf027", "\u220b"], // \u220b contains as member
  ["\uf02a", "\u2217"], // \u2217 asterisk operator
  ["\uf02d", "\u2212"], // \u2212 minus sign
  ["\uf040", "\u2245"], // \u2245 approximately equal
  // Uppercase Greek (A-Z range)
  ["\uf041", "\u0391"], ["\uf042", "\u0392"], ["\uf043", "\u03a7"],
  ["\uf044", "\u0394"], ["\uf045", "\u0395"], ["\uf046", "\u03a6"],
  ["\uf047", "\u0393"], ["\uf048", "\u0397"], ["\uf049", "\u0399"],
  ["\uf04a", "\u03d1"], ["\uf04b", "\u039a"], ["\uf04c", "\u039b"],
  ["\uf04d", "\u039c"], ["\uf04e", "\u039d"], ["\uf04f", "\u039f"],
  ["\uf050", "\u03a0"], ["\uf051", "\u0398"], ["\uf052", "\u03a1"],
  ["\uf053", "\u03a3"], ["\uf054", "\u03a4"], ["\uf055", "\u03a5"],
  ["\uf056", "\u03c2"], ["\uf057", "\u03a9"], ["\uf058", "\u039e"],
  ["\uf059", "\u03a8"], ["\uf05a", "\u0396"],
  ["\uf05c", "\u2234"], // \u2234 therefore
  ["\uf05e", "\u22a5"], // \u22a5 perpendicular
  ["\uf060", "\u203e"], // \u203e overline
  // Lowercase Greek (a-z range)
  ["\uf061", "\u03b1"], ["\uf062", "\u03b2"], ["\uf063", "\u03c7"],
  ["\uf064", "\u03b4"], ["\uf065", "\u03b5"], ["\uf066", "\u03c6"],
  ["\uf067", "\u03b3"], ["\uf068", "\u03b7"], ["\uf069", "\u03b9"],
  ["\uf06a", "\u03d5"], ["\uf06b", "\u03ba"], ["\uf06c", "\u03bb"],
  ["\uf06d", "\u03bc"], ["\uf06e", "\u03bd"], ["\uf06f", "\u03bf"],
  ["\uf070", "\u03c0"], ["\uf071", "\u03b8"], ["\uf072", "\u03c1"],
  ["\uf073", "\u03c3"], ["\uf074", "\u03c4"], ["\uf075", "\u03c5"],
  ["\uf076", "\u03c9"], ["\uf077", "\u03d6"], ["\uf078", "\u03be"],
  ["\uf079", "\u03c8"], ["\uf07a", "\u03b6"],
  ["\uf07e", "\u223c"], // \u223c tilde operator
  // Math symbols (high range)
  ["\uf0a1", "\u03d2"], // \u03d2 upsilon hook
  ["\uf0a2", "\u2032"], // \u2032 prime
  ["\uf0a3", "\u2264"], // \u2264
  ["\uf0a4", "\u2044"], // \u2044 fraction slash
  ["\uf0a5", "\u221e"], // \u221e infinity
  ["\uf0a6", "\u0192"], // \u0192 florin
  ["\uf0ab", "\u2194"], // \u2194 left-right arrow
  ["\uf0ac", "\u2190"], // \u2190 left arrow
  ["\uf0ad", "\u2191"], // \u2191 up arrow
  ["\uf0ae", "\u2192"], // \u2192 right arrow
  ["\uf0af", "\u2193"], // \u2193 down arrow
  ["\uf0b0", "\u00b0"], // \u00b0 degree
  ["\uf0b1", "\u00b1"], // \u00b1
  ["\uf0b2", "\u2033"], // \u2033 double prime
  ["\uf0b3", "\u2265"], // \u2265
  ["\uf0b4", "\u00d7"], // \u00d7 multiplication
  ["\uf0b5", "\u221d"], // \u221d proportional
  ["\uf0b6", "\u2202"], // \u2202 partial
  ["\uf0b7", "\u2022"], // \u2022 bullet
  ["\uf0b8", "\u00f7"], // \u00f7 division
  ["\uf0b9", "\u2260"], // \u2260
  ["\uf0ba", "\u2261"], // \u2261
  ["\uf0bb", "\u2248"], // \u2248
  ["\uf0bc", "\u2026"], // \u2026
  ["\uf0bf", "\u2135"], // \u2135
  ["\uf0c0", "\u2111"], // \u2111
  ["\uf0c1", "\u211c"], // \u211c
  ["\uf0c2", "\u2118"], // \u2118
  ["\uf0c3", "\u2297"], // \u2297
  ["\uf0c4", "\u2295"], // \u2295
  ["\uf0c5", "\u2205"], // \u2205
  ["\uf0c6", "\u2229"], // \u2229
  ["\uf0c7", "\u222a"], // \u222a
  ["\uf0c8", "\u2283"], // \u2283
  ["\uf0c9", "\u2287"], // \u2287
  ["\uf0ca", "\u2284"], // \u2284
  ["\uf0cb", "\u2282"], // \u2282
  ["\uf0cc", "\u2286"], // \u2286
  ["\uf0cd", "\u2208"], // \u2208
  ["\uf0ce", "\u2209"], // \u2209
  ["\uf0cf", "\u2220"], // \u2220
  ["\uf0d0", "\u2207"], // \u2207
  ["\uf0d4", "\u220f"], // \u220f
  ["\uf0d5", "\u221a"], // \u221a
  ["\uf0d6", "\u22c5"], // \u22c5 dot product
  ["\uf0d7", "\u00ac"], // \u00ac
  ["\uf0d8", "\u2227"], // \u2227
  ["\uf0d9", "\u2228"], // \u2228
  ["\uf0da", "\u21d4"], // \u21d4
  ["\uf0db", "\u21d0"], // \u21d0
  ["\uf0dc", "\u21d1"], // \u21d1
  ["\uf0dd", "\u21d2"], // \u21d2
  ["\uf0de", "\u21d3"], // \u21d3
  ["\uf0e0", "\u27e8"], // \u27e8 angle bracket
  ["\uf0e4", "\u2211"], // \u2211 summation
  // Large bracket pieces \u2192 nearest single-char equivalent
  ["\uf0e5", "("], ["\uf0e6", "("], ["\uf0e7", "("],
  ["\uf0e8", "["], ["\uf0e9", "["], ["\uf0ea", "["],
  ["\uf0eb", "\u2308"], ["\uf0ec", "\u230a"], // \u2308 \u230a
  ["\uf0ed", "|"], ["\uf0ee", "|"],
  ["\uf0ef", "\u27e9"], // \u27e9 angle bracket
  ["\uf0f0", "\u222b"], ["\uf0f2", "\u222b"], // \u222b integral
  ["\uf0f1", "("], ["\uf0f3", "("],
  ["\uf0f4", "\u222e"], // \u222e contour integral
  ["\uf0f5", "["],
  ["\uf0f6", ")"], ["\uf0f7", ")"], ["\uf0f8", ")"],
  ["\uf0f9", "}"], ["\uf0fa", "\u2309"], ["\uf0fb", "\u230b"], // \u2309 \u230b
  ["\uf0fc", "|"], ["\uf0fd", "|"],
  ["\uf0fe", "\u00b7"], // \u00b7 middle dot
]);

export function normalizeDocxSymbolText(value) {
  return [...String(value || "")]
    .map((char) => SYMBOL_FONT_MAP.get(char) ?? char)
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
