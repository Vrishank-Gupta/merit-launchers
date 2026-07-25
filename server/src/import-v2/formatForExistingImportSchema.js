import {OPTION_LETTERS, fileTitle} from "./documentIr.js";
import {repairCollapsedMatrixNotation} from "./matrixRepair.js";
import {normalizeEquationLatex} from "../mathSvg.js";

export function formatForExistingImportSchema(result, {fileName = ""} = {}) {
  const questions = (result.questions || [])
    .map((question, index) => {
      const options = repairShiftedOptionMarkers(
        OPTION_LETTERS.map((_, optionIndex) => String(question.options?.[optionIndex] || "").trim()),
      ).map(normalizeRenderableMathText);
      const correctAnswer = String(question.correctAnswer || "").trim().toUpperCase();
      let correctIndex = Number(question.correctIndex);
      if ((!Number.isInteger(correctIndex) || correctIndex < 0 || correctIndex > 3) && OPTION_LETTERS.includes(correctAnswer)) {
        correctIndex = OPTION_LETTERS.indexOf(correctAnswer);
      }
      if (!Number.isInteger(correctIndex) || correctIndex < 0 || correctIndex > 3) {
        correctIndex = -1;
      }
      return {
        id: question.id || `det-import-${Date.now()}-${index + 1}`,
        section: String(question.section || "General").trim() || "General",
        prompt: normalizeImportedMathText(String(question.prompt || "").trim()),
        options,
        correctAnswer: correctIndex >= 0 ? OPTION_LETTERS[correctIndex] : null,
        correctIndex,
        topic: question.topic || null,
        concepts: Array.isArray(question.concepts) ? question.concepts : [],
        difficulty: ["easy", "medium", "hard"].includes(String(question.difficulty || "").toLowerCase())
          ? String(question.difficulty).toLowerCase()
          : "medium",
        explanation: String(question.explanation || "").trim() || null,
      };
    })
    .filter((question) => question.prompt && question.options.some(Boolean));

  return {
    title: result.title || fileTitle(fileName),
    instructions: Array.isArray(result.instructions) ? result.instructions.filter(Boolean) : [],
    questions,
    confidence: result.confidence,
    warnings: result.warnings || [],
    needsReview: Boolean(result.needsReview),
    parserVersion: "deterministic-v2",
    debug: result.debug,
  };
}

function repairShiftedOptionMarkers(options) {
  const repaired = [...options];
  for (let index = 0; index < repaired.length - 1; index += 1) {
    if (String(repaired[index + 1] || "").trim()) {
      continue;
    }
    const nextLetter = OPTION_LETTERS[index + 1].toLowerCase();
    const marker = new RegExp(`\\s*\\(${nextLetter}\\)\\s*`, "i");
    const match = String(repaired[index] || "").match(marker);
    if (!match || match.index == null || match.index <= 0) {
      continue;
    }
    const before = repaired[index].slice(0, match.index).trim();
    const after = repaired[index].slice(match.index + match[0].length).trim();
    if (before && after) {
      repaired[index] = before;
      repaired[index + 1] = after;
    }
  }
  return repaired;
}

function normalizeRenderableMathText(value) {
  const text = normalizeImportedMathText(value);
  if (!text) {
    return text;
  }
  if (hasExplicitMathDelimiters(text)) {
    return normalizeMixedDelimitedMathOption(text) || text;
  }
  // Keep unit words outside math: "(π - 2) sq units" → "\( (π-2) \) sq units"
  const unitSplit = text.match(
    /^(.*?)(\s+(?:sq\.?\s*units?|units?|cm|mm|m|km|degree|degrees|rad|radians))\s*$/i,
  );
  if (unitSplit) {
    const mathPart = unitSplit[1].trim();
    const unitPart = unitSplit[2].trim();
    if (mathPart && looksLikeStandaloneMathText(mathPart)) {
      return `\\( ${normalizeLatexFragment(mathPart)} \\) ${unitPart}`;
    }
    return text;
  }
  if (!looksLikeStandaloneMathText(text)) {
    return text;
  }
  return `\\( ${normalizeLatexFragment(text)} \\)`;
}

function normalizeImportedMathText(value) {
  return postNormalizeIntegralAndLimitWraps(
    wrapBareLatexInProse(
      normalizePlainLatexText(
        normalizeDelimitedLatex(
          repairCollapsedMatrixNotation(
            normalizeLatexUnicode(
              normalizeBrokenLatexShorthand(
                repairPdfProseArtifacts(String(value || "").trim()),
              ),
            ),
          ),
        ),
      ),
    ),
  );
}

function repairPdfProseArtifacts(text) {
  return String(text || "")
    // Encoded commas: a = 39$,$b = 12
    .replace(/(\d)\s*\$,\$\s*/g, "$1, ")
    .replace(/(\d)\s*\$\s*,\s*\$\s*/g, "$1, ")
    .replace(/\$\s*,\s*\$/g, ", ")
    // Stray empty brace groups left by tall brace glyphs.
    .replace(/\{\s*\}/g, " ")
    // Ellipse + line equation collapses from PDF stacked fractions:
    // \frac{x^2}{16}^y + \frac{2}{9} = 1  →  \frac{x^2}{16}+\frac{y^2}{9}=1
    .replace(
      /\\frac\{\s*([a-z])\s*\^\s*\{?\s*2\s*\}?\s*\}\{\s*(\d+)\s*\}\s*\^\s*([a-z])\s*\+\s*\\frac\{\s*2\s*\}\{\s*(\d+)\s*\}/gi,
      "\\frac{$1^{2}}{$2}+\\frac{$3^{2}}{$4}",
    )
    .replace(
      /\\frac\{\s*([a-z])\s*\^\s*\{?\s*2\s*\}?\s*\}\{\s*(\d+)\s*\}\s*\^\s*([a-z])\s*\+\s*\\frac\{\s*([a-z])\s*\^\s*\{?\s*2\s*\}?\s*\}\{\s*(\d+)\s*\}/gi,
      "\\frac{$1^{2}}{$2}+\\frac{$3^{2}}{$5}",
    )
    // \frac{x}{4}^y + =1 √{3} / \sqrt{3}  →  \frac{x}{4}+\frac{y}{\sqrt{3}}=1
    .replace(
      /\\frac\{\s*([a-z])\s*\}\{\s*(\d+)\s*\}\s*\^\s*([a-z])\s*\+\s*=\s*1\.?\s*(?:\\\(\s*)?(?:√\s*\{\s*3\s*\}|\\sqrt\s*\{\s*3\s*\})\s*(?:\\\)\s*)?/gi,
      "\\frac{$1}{$2}+\\frac{$3}{\\sqrt{3}}=1",
    )
    .replace(
      /\\frac\{\s*([a-z])\s*\}\{\s*(\d+)\s*\}\s*\^\s*([a-z])\s*\+\s*\\frac\{\s*([a-z])\s*\}\{\s*(?:√\s*\{\s*3\s*\}|\\sqrt\s*\{\s*3\s*\})\s*\}\s*=\s*1/gi,
      "\\frac{$1}{$2}+\\frac{$3}{\\sqrt{3}}=1",
    )
    // Misplaced vector dots: AB·AC + BC BA· + CB CA· → vectors with proper dots
    .replace(
      /\b([A-Z]{2})\s*(?:·|⋅|\\cdot)\s*([A-Z]{2})\s*\+\s*([A-Z]{2})\s+([A-Z]{2})\s*(?:·|⋅|\\cdot)\s*\+\s*([A-Z]{2})\s+([A-Z]{2})\s*(?:·|⋅|\\cdot)/g,
      (_match, a, b, c, d, e, f) =>
        `\\( \\vec{${a}}\\cdot\\vec{${b}}+\\vec{${c}}\\cdot\\vec{${d}}+\\vec{${e}}\\cdot\\vec{${f}} \\)`,
    )
    // Cleaner pair form already ordered: AB·AC + BC·BA + CB·CA
    .replace(
      /\b([A-Z]{2})\s*(?:·|⋅|\\cdot)\s*([A-Z]{2})\s*\+\s*([A-Z]{2})\s*(?:·|⋅|\\cdot)\s*([A-Z]{2})\s*\+\s*([A-Z]{2})\s*(?:·|⋅|\\cdot)\s*([A-Z]{2})\b/g,
      (_match, a, b, c, d, e, f) =>
        `\\( \\vec{${a}}\\cdot\\vec{${b}}+\\vec{${c}}\\cdot\\vec{${d}}+\\vec{${e}}\\cdot\\vec{${f}} \\)`,
    )
    // lim{f(x)}? ^{x\to\infty}  or  lim{f(x)} _{x\to\infty}  or next-token form
    .replace(
      /\blim\s*\{([^{}]+)\}\s*\??\s*(?:\^\s*)?\{?\s*([A-Za-z])\s*(?:→|\\to)\s*(∞|\\infty|-?\d+)\s*\}?/g,
      (_match, expression, variable, target) =>
        formatLimitExpression(variable, target, expression),
    )
    .replace(
      /\blim\s*(\((?:[^()]|\([^()]*\))+\)|\\frac\{[^{}]+\}\{(?:[^{}]|\{[^{}]*\})+\}|[^\n]+?)\s*\??\s*(?:\^\s*)?\{?\s*([A-Za-z])\s*(?:→|\\to)\s*(∞|\\infty|-?\d+)\s*\}?/g,
      (_match, expression, variable, target) =>
        formatLimitExpression(variable, target, expression),
    )
    // lim ... is x\to0 / lim\frac{...} is x\to\infty (annotation after the sentence)
    .replace(
      /\blim\s*(.+?)\s+is\s+([A-Za-z])\s*(?:→|\\to)\s*(∞|\\infty|-?\d+)\b/g,
      (_match, expression, variable, target) =>
        `${formatLimitExpression(variable, target, expression)} is`,
    )
    .replace(
      /\blim\s*(.+?)\s+([A-Za-z])\s*(?:→|\\to)\s*(∞|\\infty|-?\d+)\b/g,
      (_match, expression, variable, target) => {
        // Avoid swallowing prose like "limit is not"
        if (/\b(?:is equal to|equal to|then|when|where)\b/i.test(expression)) {
          return _match;
        }
        return formatLimitExpression(variable, target, expression);
      },
    )
    // Already-normalized: \lim ... x\to0 trailing annotation
    .replace(
      /\\lim\s*(.+?)\s+([A-Za-z])\\to\s*(∞|\\infty|-?\d+)\b/g,
      (_match, expression, variable, target) =>
        formatLimitExpression(variable, target, expression),
    )
    // Compact "\lim_{x\to0} (..." → "\lim_{x\to0}(..."
    .replace(/(\\lim_\{[^}]+\})\s+(?=[(\\[A-Za-z0-9])/g, "$1")
    // Glued trig: xcos / xsin inside prose or math fragments
    .replace(/(?<![\\A-Za-z])([a-z0-9)\]])(sin|cos|tan|cot|sec|csc)(?![a-z])/gi, "$1\\$2")
    // Keep a readable gap after variables before latex trig: x\cos → x \cos
    .replace(/([a-z0-9)\]])(\\(?:sin|cos|tan|cot|sec|csc)\b)/g, "$1 $2")
    // Ratio spacing: 2 : √{6} :1+ → 2 : √{6} : 1+
    .replace(/:\s*(?=\d)/g, ": ")
    .replace(/[ \t]{2,}/g, " ")
    .trim();
}

function normalizeLimitTarget(target) {
  const value = String(target || "").trim();
  if (value === "∞" || value === "\\infty") {
    return "\\infty";
  }
  return value;
}

function formatLimitExpression(variable, target, expression) {
  const body = String(expression || "").trim();
  const limit = `\\lim_{${variable}\\to${normalizeLimitTarget(target)}}`;
  if (!body) {
    return limit;
  }
  // Keep conventional tight spacing before parenthesized/command bodies.
  if (/^[(\\[A-Za-z0-9]/.test(body)) {
    return `${limit}${body}`;
  }
  return `${limit} ${body}`;
}

const GREEK_OR_VAR = String.raw`(?:\\(?:alpha|beta|gamma|delta|theta|phi|omega|lambda|mu|pi)|[a-z])`;

function normalizeBrokenLatexShorthand(text) {
  return String(text || "")
    // Collapsed product of squares BEFORE space stripping:
    // "a b^2 ^2" / "α β^2 ^2" / "ab^2^2" → a^{2}b^{2} / \alpha^{2}\beta^{2}
    .replace(new RegExp(`(${GREEK_OR_VAR})\\s+(${GREEK_OR_VAR})\\s*\\^2\\s*\\^2\\b`, "gi"), "$1^{2}$2^{2}")
    .replace(new RegExp(`(${GREEK_OR_VAR})\\s+(${GREEK_OR_VAR})\\s*\\^\\{\\s*2\\s*\\}\\s*\\^\\{\\s*2\\s*\\}`, "gi"), "$1^{2}$2^{2}")
    .replace(new RegExp(`\\b([a-z])([a-z])\\^2\\^2\\b`, "gi"), "$1^{2}$2^{2}")
    .replace(new RegExp(`\\b([a-z])([a-z])\\^2\\s*\\^2\\b`, "gi"), "$1^{2}$2^{2}")
    .replace(new RegExp(`\\b([a-z])([a-z])\\^\\{\\s*2\\s*\\}\\^\\{\\s*2\\s*\\}`, "gi"), "$1^{2}$2^{2}")
    // PDF second-derivative collapse: d y^2 / dx^2 → d^{2}y / dx^{2}
    .replace(
      /\\frac\{\s*d\s*([a-z])\s*\^\s*\{?\s*2\s*\}?\s*\}\{\s*d\s*([a-z])\s*\^\s*\{?\s*2\s*\}?\s*\}/gi,
      "\\frac{d^{2}$1}{d$2^{2}}",
    )
    .replace(
      /\\frac\{\s*d\s*([a-z])\s*\^\s*\{?\s*2\s*\}?\s*\}\{\s*d([a-z])\s*\^\s*\{?\s*2\s*\}?\s*\}/gi,
      "\\frac{d^{2}$1}{d$2^{2}}",
    )
    // Unicode root used as \sqrt: √{...}
    .replace(/√\s*\{/g, "\\sqrt{")
    // PDF often inserts spaces inside frac/sqrt bodies: \frac{a}{1- ab}
    .replace(/\\frac\{([^{}]+)\}\{\s*([^{}]+)\s*\}/g, (_match, num, den) =>
      `\\frac{${String(num).trim()}}{${normalizeFracBody(den)}}`)
    .replace(/\\sqrt\s*\{([^{}]+)\}/g, (_match, body) =>
      `\\sqrt{${normalizeFracBody(body)}}`)
    // Bare trig before Greek/commands/args: cos\theta / cos x / cos( → \cos...
    // Use a trailing boundary so "singular"/"Second" are not matched.
    .replace(
      /(?<!\\)\b(sin|cos|tan|cot|sec|csc)\b(?=\s*(?:\\[A-Za-z]+|\^|[0-9(]|[a-z]\b|θ|α|β))/gi,
      "\\$1",
    );
}

function normalizeFracBody(body) {
  return String(body || "")
    .replace(/\b([a-z])\s+([a-z])\s*\^2\s*\^2\b/gi, "$1^{2}$2^{2}")
    .replace(/\b([a-z])([a-z])\^2\^2\b/gi, "$1^{2}$2^{2}")
    // PDF often inserts a space only after unary/binary join in products: 1- ab
    .replace(/(\d)\s*([+\-])\s+(?=[A-Za-z]{1,3}(?:[\^}]|$))/g, "$1$2")
    .replace(/\s{2,}/g, " ")
    .trim();
}

function wrapBareLatexInProse(text) {
  const source = String(text || "");
  if (!source) {
    return source;
  }

  let output = source;

  // Protect already-delimited math from double wrapping.
  // Store INNER bodies so restored chunks never reintroduce nested \( ... \).
  const protectedChunks = [];
  output = output.replace(
    /(\\\([\s\S]*?\\\)|\\\[[\s\S]*?\\\]|\$\$[\s\S]*?\$\$|\$[^$]*?\$)/g,
    (chunk) => {
      protectedChunks.push(splitInlineMathChunk(chunk));
      return `@@MATH${protectedChunks.length - 1}@@`;
    },
  );

  // Auto-wrap matrix environments and bare frac/sqrt so mixed prose prompts
  // (e.g. "HM between \frac{a}{1-ab} and ...") render in MathJax/SVG clients.
  output = output.replace(
    /\\begin\{(bmatrix|pmatrix|vmatrix|Vmatrix|matrix|array|cases|aligned|gathered)\}([\s\S]*?)\\end\{\1\}/g,
    (match, _env, _body, offset, full) =>
      shouldWrapBareLatexFragment(full, offset) ? `\\( ${match} \\)` : match,
  );

  // Brace-aware wrapping so nested args like \frac{\sqrt{3}+1}{2} are kept intact.
  output = wrapLatexCommandsWithBraces(output, "frac", 2);
  output = wrapLatexCommandsWithBraces(output, "sqrt", 1);

  // Restore protected inners. If the placeholder sits inside a newly created
  // \( ... \) wrap, splice the body only; otherwise restore original delimiters.
  output = output.replace(/@@MATH(\d+)@@/g, (_placeholder, index, offset, full) => {
    const chunk = protectedChunks[Number(index)] || {open: "\\(", close: "\\)", body: ""};
    if (isInsideInlineMath(full, offset)) {
      return chunk.body;
    }
    return `${chunk.open} ${chunk.body} ${chunk.close}`;
  });

  return flattenInlineMathDelimiters(output);
}

function splitInlineMathChunk(chunk) {
  const trimmed = String(chunk || "").trim();
  const pairs = [
    ["\\(", "\\)"],
    ["\\[", "\\]"],
    ["$$", "$$"],
    ["$", "$"],
  ];
  for (const [open, close] of pairs) {
    if (
      trimmed.startsWith(open) &&
      trimmed.endsWith(close) &&
      trimmed.length > open.length + close.length
    ) {
      return {
        open,
        close,
        body: trimmed.slice(open.length, trimmed.length - close.length).trim(),
      };
    }
  }
  return {open: "\\(", close: "\\)", body: trimmed};
}

function wrapLatexCommandsWithBraces(text, command, braceGroups) {
  const source = String(text || "");
  const pattern = new RegExp(`\\\\${command}(?![A-Za-z])`, "g");
  let output = "";
  let lastIndex = 0;
  let match;
  while ((match = pattern.exec(source)) !== null) {
    const offset = match.index;
    output += source.slice(lastIndex, offset);
    if (!shouldWrapBareLatexFragment(source, offset)) {
      output += match[0];
      lastIndex = offset + match[0].length;
      continue;
    }
    const consumed = consumeLatexCommandWithBraces(source, offset, braceGroups);
    if (!consumed) {
      output += match[0];
      lastIndex = offset + match[0].length;
      continue;
    }
    output += `\\( ${consumed.text} \\)`;
    lastIndex = consumed.end;
    pattern.lastIndex = consumed.end;
  }
  output += source.slice(lastIndex);
  return output;
}

function consumeLatexCommandWithBraces(text, offset, braceGroups) {
  const source = String(text || "");
  if (offset < 0 || offset >= source.length || source[offset] !== "\\") {
    return null;
  }
  let index = offset + 1;
  while (index < source.length && /[A-Za-z]/.test(source[index])) {
    index += 1;
  }
  let groups = 0;
  while (groups < braceGroups && index < source.length) {
    while (index < source.length && /\s/.test(source[index])) {
      index += 1;
    }
    if (source[index] !== "{") {
      return null;
    }
    let depth = 0;
    for (; index < source.length; index += 1) {
      if (source[index] === "{") {
        depth += 1;
      } else if (source[index] === "}") {
        depth -= 1;
        if (depth === 0) {
          index += 1;
          break;
        }
      }
    }
    if (depth !== 0) {
      return null;
    }
    groups += 1;
  }
  if (groups < braceGroups) {
    return null;
  }
  return {
    text: source.slice(offset, index),
    end: index,
  };
}

function shouldWrapBareLatexFragment(full, offset) {
  const text = String(full || "");
  const start = Number(offset) || 0;
  // Never wrap fragments already inside \( ... \) / \[ ... \]
  // (prevents \frac{1}{\sqrt{x}} → nested wraps after the frac is wrapped).
  if (isInsideInlineMath(text, start) || isInsideDisplayMath(text, start)) {
    return false;
  }
  // Never wrap fragments already inside parentheses of a larger math expression
  // (e.g. lim(...\frac......) or f(\sqrt...)).
  if (plainParenDepth(text, start) > 0) {
    return false;
  }
  // Never wrap commands that are already nested inside another command's braces
  // (e.g. \sqrt inside \frac{...}{...}).
  if (plainBraceDepth(text, start) > 0) {
    return false;
  }
  // Keep integral/sum/lim bodies unwrapped so "\int \frac{...}" stays one expression.
  const before = text.slice(Math.max(0, start - 24), start);
  if (/\\(?:int|sum|prod|lim)(?:_\{[^}]*\})?\s*$/.test(before)) {
    return false;
  }
  return true;
}

function plainBraceDepth(text, offset) {
  let depth = 0;
  const source = String(text || "");
  for (let index = 0; index < offset && index < source.length; index += 1) {
    const char = source[index];
    if (char === "{") {
      depth += 1;
    } else if (char === "}") {
      depth = Math.max(0, depth - 1);
    }
  }
  return depth;
}

function isInsideDisplayMath(text, offset) {
  const source = String(text || "");
  const before = source.slice(0, offset);
  const lastOpen = before.lastIndexOf("\\[");
  const lastClose = before.lastIndexOf("\\]");
  return lastOpen > lastClose;
}

function plainParenDepth(text, offset) {
  let depth = 0;
  const source = String(text || "");
  for (let index = 0; index < offset && index < source.length; index += 1) {
    const char = source[index];
    const prev = index > 0 ? source[index - 1] : "";
    if (char === "(" && prev !== "\\") {
      depth += 1;
    } else if (char === ")" && prev !== "\\") {
      depth = Math.max(0, depth - 1);
    }
  }
  return depth;
}

function isInsideInlineMath(text, offset) {
  const source = String(text || "");
  const before = source.slice(0, offset);
  const lastOpen = before.lastIndexOf("\\(");
  const lastClose = before.lastIndexOf("\\)");
  return lastOpen > lastClose;
}

function flattenInlineMathDelimiters(text) {
  let output = String(text || "");

  // Merge adjacent inline math segments separated only by whitespace.
  output = output.replace(/\\\)\s*\\\(/g, " ");
  // Merge math islands joined only by binary operators/relations so equations
  // like \( \frac{x^2}{16} \)+\( \frac{y^2}{9} \)=1 stay one inline expression.
  output = output.replace(
    /\\\)\s*([+\-−=<>≤≥≠])\s*\\\(/g,
    " $1 ",
  );
  // Pull a trailing "= …" that sits just outside a closing delimiter back inside.
  output = output.replace(
    /\\\)\s*(=\s*(?:-?\d+(?:\.\d+)?|[A-Za-z]|\\[A-Za-z]+(?:\{[^{}]*\})*))/g,
    " $1 \\)",
  );

  // Flatten accidental nested inline math.
  let previous;
  do {
    previous = output;
    output = output.replace(/\\\(([\s\S]*?)\\\)/g, (match, body) => {
      if (!/\\\(|\\\[/.test(body)) {
        return match;
      }
      const flat = body
        .replace(/\\\(/g, " ")
        .replace(/\\\)/g, " ")
        .replace(/\\\[/g, " ")
        .replace(/\\\]/g, " ")
        .replace(/[ \t]{2,}/g, " ")
        .trim();
      return `\\( ${flat} \\)`;
    });
  } while (output !== previous);

  // Unwrap \( frac/sqrt \) when it is the sole content of plain parentheses.
  output = output
    .replace(/\(\s*\\\(\s*(\\frac\{[^{}]+\}\{(?:[^{}]|\{[^{}]*\})+\})\s*\\\)\s*\)/g, "($1)")
    .replace(/\(\s*\\\(\s*(\\sqrt\{[^{}]+\})\s*\\\)\s*\)/g, "($1)")
    .replace(/\\\(\s*\\\(/g, "\\(")
    .replace(/\\\)\s*\\\)/g, "\\)")
    .replace(/\\\(\s*(\\begin\{)/g, "\\( $1")
    .replace(/(\})\s+\)/g, "$1)")
    .replace(/[ \t]{2,}/g, " ")
    .trim();

  return output;
}

function hasExplicitMathDelimiters(text) {
  return /(?:\\\(|\\\[|\$\$|\$)/.test(text);
}

function normalizeMixedDelimitedMathOption(text) {
  if (/\[\[image:/i.test(text)) {
    return "";
  }
  const outsideMath = text
    .replace(/\\\(([\s\S]*?)\\\)/g, " ")
    .replace(/\\\[([\s\S]*?)\\\]/g, " ")
    .replace(/\$\$([\s\S]*?)\$\$/g, " ")
    .replace(/\$([^$]*?)\$/g, " ")
    .trim();
  if (!outsideMath) {
    return "";
  }
  const normalizedOutside = normalizePlainLatexText(outsideMath);
  if (!/\\[A-Za-z]+|[+\-=^_*/<>≤≥≠]/.test(normalizedOutside)) {
    return "";
  }
  if (/\b(?:none of these|none of the above|only|both|either|neither)\b/i.test(normalizedOutside)) {
    return "";
  }

  const merged = text
    .replace(/\\\(([\s\S]*?)\\\)/g, "$1")
    .replace(/\\\[([\s\S]*?)\\\]/g, "$1")
    .replace(/\$\$([\s\S]*?)\$\$/g, "$1")
    .replace(/\$([^$]*?)\$/g, "$1");
  const latex = normalizeLatexFragment(merged);
  if (!/\\[A-Za-z]+/.test(latex)) {
    return "";
  }
  return `\\( ${latex} \\)`;
}

function looksLikeStandaloneMathText(text) {
  if (/\b(?:none of these|none of the above|only|and|or)\b/i.test(text)) {
    return false;
  }
  if (/\\(?:begin\{(?:array|matrix|bmatrix|pmatrix|vmatrix|Vmatrix|cases|aligned|gathered)\}|frac|sqrt|bar|overline|hat|sin|cos|tan|cot|log|lim|sum|int|pi|theta|alpha|beta|gamma|delta|lambda|mu|phi|omega|Delta|Omega|Lambda|le|ge|ne|pm|times|div|in|notin|forall|angle|cup|cap|subset|subseteq|emptyset|perp|Leftrightarrow|ldots|cdot|circ|to)\b/.test(text)) {
    return true;
  }
  if (/^[()[\]{}\s0-9A-Za-zπθαβγδΔΩμλϕω∞∈∉∀∠∪∩⊂⊆∅⊥⇔|+\-*/=,^_<>°'\\]+$/.test(text) && /(?:\^|_|[πθαβγδΔΩμλϕω∞∈∉∀∠∪∩⊂⊆∅⊥⇔]|\\)/.test(text)) {
    return true;
  }
  return false;
}

function normalizeLatexUnicode(text) {
  if (!/[\\^_{}]|[√∫∑πθαβγδΔΩμλϕω∞≤≥≠±×÷∈∉∀∠∪∩⊂⊆∅⊥⇔⋅→…°]/.test(text)) {
    return text;
  }
  return separateLatexCommandRuns(text
    .replace(/ω\s*([0-9]*n)\b/g, (_match, exponent) => `\\omega^{${exponent || "n"}}`)
    .replace(/√\s*\{/g, "\\sqrt{")
    .replace(/∫/g, "\\int")
    .replace(/∑/g, "\\sum")
    .replace(/π/g, "\\pi")
    .replace(/θ/g, "\\theta")
    .replace(/α/g, "\\alpha")
    .replace(/β/g, "\\beta")
    .replace(/γ/g, "\\gamma")
    .replace(/δ/g, "\\delta")
    .replace(/Δ/g, "\\Delta")
    .replace(/Ω/g, "\\Omega")
    .replace(/μ/g, "\\mu")
    .replace(/λ/g, "\\lambda")
    .replace(/ϕ/g, "\\phi")
    .replace(/ω/g, "\\omega")
    .replace(/∞/g, "\\infty")
    .replace(/≤/g, "\\le")
    .replace(/≥/g, "\\ge")
    .replace(/≠/g, "\\ne")
    .replace(/±/g, "\\pm ")
    .replace(/×/g, "\\times")
    .replace(/÷/g, "\\div")
    .replace(/∈/g, "\\in")
    .replace(/∉/g, "\\notin")
    .replace(/∀/g, "\\forall")
    .replace(/∠/g, "\\angle")
    .replace(/∪/g, "\\cup")
    .replace(/∩/g, "\\cap")
    .replace(/⊆/g, "\\subseteq")
    .replace(/⊂/g, "\\subset")
    .replace(/∅/g, "\\emptyset")
    .replace(/⊥/g, "\\perp")
    .replace(/⇔/g, "\\Leftrightarrow")
    .replace(/⋅/g, "\\cdot ")
    .replace(/→/g, "\\to")
    .replace(/…/g, "\\ldots")
    .replace(/[ \t]{2,}/g, " "));
}

function normalizeDelimitedLatex(text) {
  return String(text || "")
    .replace(/\\\(([\s\S]*?)\\\)/g, (_match, body) => `\\( ${normalizeLatexFragment(body)} \\)`)
    .replace(/\\\[([\s\S]*?)\\\]/g, (_match, body) => `\\[ ${normalizeLatexFragment(body)} \\]`)
    .replace(/\$\$([\s\S]*?)\$\$/g, (_match, body) => `$$ ${normalizeLatexFragment(body)} $$`);
}

function normalizeLatexFragment(value) {
  let latex = normalizeEquationLatex(String(value || ""));
  latex = latex
    .replace(/\\sqrt\s+\{/g, "\\sqrt{")
    .replace(/\\sqrt\s+([A-Za-z0-9]+|\([^()]+\))/g, (_match, body) =>
      `\\sqrt{${body.replace(/^\((.*)\)$/, "$1")}}`)
    .replace(/\\(sin|cos|tan|cot|sec|csc|log|ln)\s*\^\s*\{\s*-\s*1\s*\}/g, "\\$1^{-1}")
    // Ensure "\cosx" / "\cos x" become "\cos x" without eating longer words.
    .replace(/\\(sin|cos|tan|cot|sec|csc|log|ln)([A-Za-z])/g, "\\$1 $2")
    .replace(/\\(sin|cos|tan|cot|sec|csc|log|ln)\s+([A-Za-z])\b/g, "\\$1 $2")
    .replace(/\bxtaxx\b/g, "x\\tan x")
    .replace(/\bsim\b/g, "\\sin")
    .replace(/\blxim\b/g, "\\lim_{n\\to\\infty}")
    .replace(/\bLoget\b/g, "\\log_e t")
    .replace(/(?<!\\)\b[Ii]n([A-Za-z])\b/g, "\\ln $1")
    .replace(/([_^])\{([A-Za-z])([0-9]+)\}/g, "$1{$2^{$3}}")
    .replace(/\\frac\{([^{}]+)\}\{\(([^{}()]+)\}\)/g, "\\frac{$1}{$2}")
    .replace(/\\frac\{([^{}]+)\}\{\(([^{}()]+)\}/g, "\\frac{$1}{$2}")
    .replace(/\\sqrt\{\(\}\s*([^)\s]+)\)/g, "\\sqrt{$1}")
    .replace(/\\pi([0-9]+)\b/g, "\\pi^{$1}")
    .replace(/\\pi\s*\/\s*([0-9]+)/g, "\\pi/$1")
    .replace(/\\ln\s+t\b/g, "\\int")
    // Prose glued inside math: forx>0and → for x > 0 and (never split forall)
    .replace(/\bfor(?!all\b)(?=[A-Za-z])/gi, "for ")
    .replace(/([0-9><=])and\b/gi, "$1 and")
    .replace(/\band(?=[A-Za-z])/gi, "and ")
    // Corrupted forall from Symbol font quote: ,"x or ,!x → , \forall x
    .replace(/,\s*[\"'!]\s*([A-Za-z])\b/g, ", \\forall $1")
    .replace(/\\forall\s*([A-Za-z])\b/g, "\\forall $1")
    // Collapse double degree marks: 10^{^{\circ}} → 10^{\circ}
    .replace(/\^\{\s*\^\{\\circ\}\s*\}/g, "^{\\circ}")
    .replace(/\^\{\\circ\}\s*\^\{\\circ\}/g, "^{\\circ}")
    // Drop bare degree marks that are not attached to a number
    .replace(/(?<![0-9])\^\{\\circ\}/g, "")
    // Drop accidental command-doubled backslashes before known commands
    .replace(/\\\\(sin|cos|tan|cot|sec|csc|frac|sqrt|int|sum|pi|forall|circ|times|div|le|ge|ne|pm|cap|cup|alpha|beta|gamma|theta|lambda|mu|omega|Delta|infty|ldots|mathrm|begin|end)\b/g, "\\$1")
    .replace(new RegExp(`(${GREEK_OR_VAR})\\s+(${GREEK_OR_VAR})\\s*\\^2\\s*\\^2\\b`, "gi"), "$1^{2}$2^{2}")
    .replace(/\b([a-z])([a-z])\^2\^2\b/gi, "$1^{2}$2^{2}")
    .replace(
      /\\frac\{\s*d\s*([a-z])\s*\^\s*\{?\s*2\s*\}?\s*\}\{\s*d\s*([a-z])\s*\^\s*\{?\s*2\s*\}?\s*\}/gi,
      "\\frac{d^{2}$1}{d$2^{2}}",
    )
    .replace(
      /\\frac\{\s*d\s*([a-z])\s*\^\s*\{?\s*2\s*\}?\s*\}\{\s*d([a-z])\s*\^\s*\{?\s*2\s*\}?\s*\}/gi,
      "\\frac{d^{2}$1}{d$2^{2}}",
    )
    .replace(/\{\s*-\s*/g, "{-")
    .replace(/\s*\}/g, "}")
    // Compact only operator-adjacent spaces inside frac/sqrt bodies.
    .replace(/\\frac\{([^{}]*)\}\{([^{}]*)\}/g, (_match, num, den) =>
      `\\frac{${normalizeFracBody(num)}}{${normalizeFracBody(den)}}`)
    .replace(/\\sqrt\{([^{}]*)\}/g, (_match, body) =>
      `\\sqrt{${normalizeFracBody(body)}}`)
    // Drop stray spaces before closing parentheses after braces: \sqrt{2} )
    .replace(/(\})\s+\)/g, "$1)")
    .replace(/[ \t]{2,}/g, " ")
    .trim();
  return latex;
}

function normalizePlainLatexText(value) {
  return String(value || "")
    .replace(/\bxtaxx\b/g, "x\\tan x")
    .replace(/\bsim\b/g, "\\sin")
    .replace(
      /(?<!\\)\b(sin|cos|tan|cot|sec|csc)\b(?=\s*(?:\\[A-Za-z]+|\^|[0-9(]|[a-z]\b|θ|α|β))/gi,
      "\\$1",
    )
    .replace(/(?<!\\)\bsin(?=\s*\^\{|\s*[0-9]|\s*x\b|\()/gi, "\\sin")
    .replace(/(?<!\\)\bcos(?=\s*\^\{|\s*[0-9]|\s*x\b|\()/gi, "\\cos")
    .replace(/(?<!\\)\btan(?=\s*\^\{|\s*[0-9]|\s*x\b|\()/gi, "\\tan")
    .replace(/(?<!\\)\bcot(?=\s*\^\{|\s*[0-9]|\s*x\b|\()/gi, "\\cot")
    .replace(/(?<!\\)\bsec(?=\s*\^\{|\s*[0-9]|\s*x\b|\()/gi, "\\sec")
    .replace(/(?<!\\)\bcsc(?=\s*\^\{|\s*[0-9]|\s*x\b|\()/gi, "\\csc")
    .replace(/(?<!\\)\btan\s*\^\s*\{\s*-\s*1\s*\}/gi, "\\tan^{-1}")
    .replace(/(?<!\\)\bLog\b/g, "\\log")
    .replace(/(?<!\\)\blog(?=\s*(?:,|_|\(|[0-9]|e\b))/gi, "\\log")
    .replace(/([0-9])in([A-Za-z])\b/g, "$1\\ln $2")
    .replace(/\bin\s*(?=\\\(|\()/g, "\\ln ")
    .replace(/\(in\s+([A-Za-z])\)/g, "(\\ln $1)")
    .replace(/√\s*([A-Za-z0-9]+|\([^()]+\))/g, (_match, body) =>
      `\\sqrt{${body.replace(/^\((.*)\)$/, "$1")}}`)
    .replace(/√\s*\{/g, "\\sqrt{")
    .replace(/\\sqrt\{\(\}\s*([^)\s]+)\)/g, "\\sqrt{$1}")
    .replace(/\\frac\{([^{}]+)\}\{\(([^{}()]+)\}\)/g, "\\frac{$1}{$2}")
    .replace(/\\frac\{([^{}]+)\}\{\(([^{}()]+)\}/g, "\\frac{$1}{$2}")
    .replace(new RegExp(`(${GREEK_OR_VAR})\\s+(${GREEK_OR_VAR})\\s*\\^2\\s*\\^2\\b`, "gi"), "$1^{2}$2^{2}")
    .replace(/\b([a-z])([a-z])\^2\^2\b/gi, "$1^{2}$2^{2}")
    .replace(
      /\\frac\{\s*d\s*([a-z])\s*\^\s*\{?\s*2\s*\}?\s*\}\{\s*d\s*([a-z])\s*\^\s*\{?\s*2\s*\}?\s*\}/gi,
      "\\frac{d^{2}$1}{d$2^{2}}",
    )
    .replace(
      /\\frac\{\s*d\s*([a-z])\s*\^\s*\{?\s*2\s*\}?\s*\}\{\s*d([a-z])\s*\^\s*\{?\s*2\s*\}?\s*\}/gi,
      "\\frac{d^{2}$1}{d$2^{2}}",
    )
    .replace(/\\pi([0-9]+)\b/g, "\\pi^{$1}")
    .replace(/\\pi\s*\/\s*([0-9]+)/g, "\\pi/$1")
    .replace(/\\ln\s+t\b/g, "\\int")
    .replace(/(\})\s+\)/g, "$1)")
    .replace(/[ \t]{2,}/g, " ")
    .trim();
}

function separateLatexCommandRuns(text) {
  return String(text || "")
    .replace(/\^\{?°\}?/g, "^\\circ")
    .replace(/\\piloge(?=\d)/gi, "\\pi log_e ")
    .replace(/\\pi\s*loge(?=\d)/gi, "\\pi log_e ")
    .replace(/\\pi\s*log\s*e\b/gi, "\\pi log_e")
    .replace(/\\piloge\b/gi, "\\pi log_e")
    .replace(/\\int(?=(?:[A-Za-z]|\\))/g, "\\int ")
    .replace(/\\sum(?=(?:[A-Za-z]|\\))/g, "\\sum ")
    .replace(/\\times(?=(?:[A-Za-z]|\\))/g, "\\times ")
    .replace(/\\cdot(?=(?:[A-Za-z]|\\))/g, "\\cdot ")
    .replace(/\\cap(?=[A-Z])/g, "\\cap ")
    .replace(/\\cup(?=[A-Z])/g, "\\cup ")
    .replace(/\\angle(?=[A-Z])/g, "\\angle ")
    .replace(/\\Delta(?=[A-Z])/g, "\\Delta ")
    .replace(/\\Lambda(?=[A-Z])/g, "\\Lambda ")
    .replace(/\\Omega(?=[A-Z])/g, "\\Omega ")
    .replace(/\\mu(?=[A-Za-z])/g, "\\mu ")
    .replace(/\\lambda(?=[A-Za-z])/g, "\\lambda ")
    .replace(/\\alpha(?=[A-Za-z])/g, "\\alpha ")
    .replace(/\\beta(?=[A-Za-z])/g, "\\beta ")
    .replace(/\\gamma(?=[A-Za-z])/g, "\\gamma ")
    .replace(/\\delta(?=[A-Za-z])/g, "\\delta ")
    .replace(/\\theta(?=[A-Za-z])/g, "\\theta ")
    .replace(/\\phi(?=[A-Za-z])/g, "\\phi ")
    .replace(/\\omega(?=[A-Za-z])/g, "\\omega ")
    .replace(/\blim\s*(.+?)\s+is equal to\s+([A-Za-z]\\to\s*(?:\\infty|[-+]?\d+|[A-Za-z]))\b/g, (_match, expression, target) =>
      `\\lim_{${target.replace(/\s+/g, "")}}${expression.trim()} is equal to`)
    // lim(f(x)) with annotation already glued as x\to0 without braces
    .replace(
      /\blim\s*(\((?:[^()]|\([^()]*\))+\)|\\frac\{[^{}]+\}\{(?:[^{}]|\{[^{}]*\})+\})\s*(?:→|\\to)/g,
      "\\lim$1\\to",
    )
    .replace(/[ \t]{2,}/g, " ")
    .trim();
}

// Merge \int \( \frac{...} \) into one math segment and promote bare lim bodies.
function postNormalizeIntegralAndLimitWraps(text) {
  let output = String(text || "");

  // \int \( \frac{...} \) → \( \int \frac{...} \)
  output = output.replace(
    /\\int\s*\\\(\s*(\\frac\{[\s\S]*?\})\s*\\\)/g,
    "\\( \\int $1 \\)",
  );
  output = output.replace(
    /\\sum\s*\\\(\s*(\\frac\{[\s\S]*?\})\s*\\\)/g,
    "\\( \\sum $1 \\)",
  );
  // Bare integral already partially normalized: \int \( frac
  output = output.replace(/\\int\s*\\\(\s*/g, "\\( \\int ");
  output = output.replace(/\\lim_\{([^}]+)\}\s*\\\(\s*/g, "\\( \\lim_{$1} ");

  // Unwrap prose that was accidentally captured inside limit math delimiters.
  output = output
    .replace(
      /\\\(\s*(\\lim_\{[^}]+\}\s*(?:\\\([^)]*\\\)|\([^)]*\)|\\frac\{[^{}]+\}\{(?:[^{}]|\{[^{}]*\})+\}|[^\n\\]*?))\s+(is(?:\s+equal\s+to)?)\s*\\\)/gi,
      "$1 $2",
    )
    .replace(
      /\\\(\s*(\\lim_\{[^}]+\}\s*[^\n]*?)\s+(is(?:\s+equal\s+to)?)\s*\\\)/gi,
      "$1 $2",
    );

  // Wrap bare integral/limit math still sitting in prose prompts.
  output = output
    .replace(
      /(?<!\\\()\b(\\int\s+(?:\\frac\{[\s\S]*?\}|[^\n?]{1,80}))(?=\s*[?.!]|\s*$)/g,
      (match, body, offset, full) => {
        if (isInsideInlineMath(full, offset) || isInsideDisplayMath(full, offset)) {
          return match;
        }
        return `\\( ${body.trim()} \\)`;
      },
    )
    .replace(
      /(?<!\\\()\b(\\lim_\{[^}]+\}[^\n?]*?)(?=\s*[?.!]|\s*$)/g,
      (match, body, offset, full) => {
        if (isInsideInlineMath(full, offset) || isInsideDisplayMath(full, offset)) {
          return match;
        }
        if (/\bis equal to\b/i.test(body)) {
          return match;
        }
        return `\\( ${body.trim()} \\)`;
      },
    );

  return flattenInlineMathDelimiters(output);
}
