import crypto from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";

import { mathjax } from "mathjax-full/js/mathjax.js";
import { TeX } from "mathjax-full/js/input/tex.js";
import { SVG } from "mathjax-full/js/output/svg.js";
import { liteAdaptor } from "mathjax-full/js/adaptors/liteAdaptor.js";
import { RegisterHTMLHandler } from "mathjax-full/js/handlers/html.js";
import { AllPackages } from "mathjax-full/js/input/tex/AllPackages.js";

import {repairCollapsedMatrixLatex} from "./import-v2/matrixRepair.js";

const adaptor = liteAdaptor();
RegisterHTMLHandler(adaptor);

const texInput = new TeX({
  packages: AllPackages,
  inlineMath: [
    ["$", "$"],
    ["\\(", "\\)"],
  ],
  displayMath: [
    ["$$", "$$"],
    ["\\[", "\\]"],
  ],
});

const svgOutput = new SVG({ fontCache: "none" });
const mathDocument = mathjax.document("", {
  InputJax: texInput,
  OutputJax: svgOutput,
});

// Only true display constructs force block layout. Simple \frac / \sqrt stay
// inline so they do not dominate surrounding prose.
const DISPLAY_MATH_PATTERN =
  /\\(?:sum|prod|int|iint|iiint|oint|lim|begin\{(?:array|matrix|bmatrix|pmatrix|vmatrix|Vmatrix|cases|aligned|gathered)\}|left|right)|\\\\|&/;
const TRAILING_PUNCTUATION_PATTERN = /[\s.,;:!?]+$/;

function normalizeMathSource(input) {
  return String(input || "")
    .replaceAll("\r\n", "\n")
    .replaceAll("\r", "\n")
    .replaceAll("\\%", "%")
    .replaceAll("\\&", "&")
    .replaceAll("\\#", "#")
    .replace(/\$\s*([0-9]+(?:\.[0-9]+)?)\s*%\s*\$/g, "$1%")
    .trim();
}

export function normalizeEquationLatex(input) {
  let output = stripMathDelimiters(normalizeMathSource(input))
    .replace(TRAILING_PUNCTUATION_PATTERN, "")
    .replace(/[ \t]{2,}/g, " ")
    .trim();

  output = normalizeCollapsedRotationMatrices(output);
  output = repairCollapsedMatrixLatex(output);
  output = normalizeUnicodeOperators(output);
  output = normalizeUnicodeScripts(output);
  output = normalizeLatexCommandEscapes(output);
  output = normalizeFractionalExponents(output);
  output = normalizeIntegralLimits(output);
  output = normalizeBareFunctionNames(output);
  output = normalizePdfMathArtifacts(output);
  output = normalizeDifferentials(output);
  return output.replace(/[ \t]{2,}/g, " ").trim();
}

/** Light repairs for common PDF OCR/layout collapses that break MathJax. */
function normalizePdfMathArtifacts(input) {
  return String(input || "")
    // "co sec" / "co \sec" → \csc
    .replace(/(?<![A-Za-z\\])co\s*\\?sec\b/gi, "\\csc")
    // Double degree marks from stacked PDF glyphs: 17^\circ ^\circ → 17^\circ
    .replace(/(\\circ|\^\\circ)\s*\^\\circ/g, "^\\circ")
    .replace(/\^\{\\circ\}\s*\^\{\\circ\}/g, "^{\\circ}")
    // Inverse trig mis-extracted as tan^2 ^{-1} → \tan^{-1}
    .replace(
      /\\?(sin|cos|tan|cot|sec|csc)\s*\^\s*2\s*\^\s*\{\s*-1\s*\}/gi,
      "\\$1^{-1}",
    )
    .replace(
      /\\?(sin|cos|tan|cot|sec|csc)\s*\^\s*\{\s*2\s*\}\s*\^\s*\{\s*-1\s*\}/gi,
      "\\$1^{-1}",
    )
    // Unicode minus in inverse powers: tan^{−}^{1} → tan^{-1}
    .replace(
      /\\?(sin|cos|tan|cot|sec|csc)\s*\^\s*\{\s*[−-]\s*\}\s*\^\s*\{\s*1\s*\}/gi,
      "\\$1^{-1}",
    )
    // Adjacent powers that should be product of powers: x y^4 ^4 → x^{4} y^{4}
    .replace(
      /\b([a-z])\s+([a-z])\s*\^\s*\{\s*([0-9]+)\s*\}\s*\^\s*\{\s*([0-9]+)\s*\}/gi,
      "$1^{$3}$2^{$4}",
    )
    .replace(
      /\b([a-z])\s+([a-z])\s*\^\s*([0-9]+)\s*\^\s*([0-9]+)/gi,
      "$1^{$3}$2^{$4}",
    )
    // Set intersection misread as integral: A \int B → A \cap B
    .replace(
      /\b([A-Z])\s*\\int\s*([A-Z])\b/g,
      "$1 \\cap $2",
    )
    // Closed/open interval misread with integral: 0 \int x 2 → 0 \le x \le 2
    .replace(
      /\b([0-9]+)\s*\\int\s*([A-Za-z])\s*([0-9]+)\b/g,
      "$1 \\le $2 \\le $3",
    )
    // Broken nested radical: \sqrt{2} \sqrt{+} \sqrt{2 + ....} → \sqrt{2 + \sqrt{2 + \ldots}}
    .replace(
      /\\sqrt\{([^{}]+)\}\s*\\sqrt\{\s*\+\s*\}\s*\\sqrt\{([^{}]+)\}/g,
      (_match, left, right) => {
        const cleanedRight = String(right)
          .replace(/\.{2,}/g, "\\ldots")
          .replace(/(\\ldots)+/g, "\\ldots")
          .replace(/\s*\\infty\s*$/g, "")
          .replace(/\s+/g, " ")
          .trim();
        return `\\sqrt{${left} + \\sqrt{${cleanedRight}}}`;
      },
    )
    // Nested form that still has a lonely plus radical: \sqrt{2 \sqrt{ + \sqrt{...}}}
    .replace(
      /\\sqrt\{([^{}]*?)\s*\\sqrt\{\s*\+\s*\\sqrt\{([^{}]+)\}\s*\}/g,
      (_match, left, right) => {
        const cleanedRight = String(right)
          .replace(/(\\ldots)+/g, "\\ldots")
          .replace(/\s*\\infty\s*$/g, "")
          .trim();
        const leftPart = String(left || "").trim();
        return leftPart
          ? `\\sqrt{${leftPart} + \\sqrt{${cleanedRight}}}`
          : `\\sqrt{${cleanedRight}}`;
      },
    )
    // \sqrt{2 \sqrt{2 + \ldots}} → \sqrt{2 + \sqrt{2 + \ldots}} (continued nested radical)
    // Accept missing/extra trailing braces from spatial nested-radical rebuilds.
    .replace(
      /\\sqrt\{(\d+)\s*\\sqrt\{(\d+\s*\+\s*\\ldots)\}*/g,
      "\\sqrt{$1 + \\sqrt{$2}}",
    )
    // Empty radical that only holds a plus: leftover from nested-radical splits
    .replace(/\\sqrt\{\s*\+\s*\}/g, "+")
    // Doubled trig stems from stacked WMF glyphs: ssiinn → sin, ccooss → cos
    .replace(/(?<![A-Za-z])([sc])\1([ieo])\2([nsc])\3(?![A-Za-z])/gi, "$1$2$3")
    .replace(/(?<![A-Za-z\\])(sin|cos|tan|cot|sec|csc)\1(?![A-Za-z])/gi, "$1")
    // Glue bare trig + angle number: sin10 → \sin 10 when degree present nearby
    .replace(/(?<![\\A-Za-z])(sin|cos|tan|cot|sec|csc)\s*(\d{1,3})(?=\s*\^?\{?\\circ|\s*°|\b)/gi, "\\$1 $2")
    // Collapse double degree wrappers: ^{^{\circ}} → ^{\circ}
    .replace(/\^\{\s*\^\{\\circ\}\s*\}/g, "^{\\circ}")
    // Drop bare degree marks not attached to a number
    .replace(/(?<![0-9])\^\{\\circ\}/g, "")
    // Adjacent power scripts meant as single exponent: 2^{n}^{-1} → 2^{n-1}
    .replace(
      /([A-Za-z0-9]|\}|\))\s*\^\s*\{([^{}]+)\}\s*\^\s*\{\s*-\s*1\s*\}/g,
      "$1^{$2-1}",
    )
    // n2^{n} → n 2^{n} (coefficient glued to power base)
    .replace(/\b([A-Za-z])(\d)\s*\^\s*\{/g, "$1 $2^{")
    // Trailing continuation dots / infinity inside radicals
    .replace(/(\+?\s*)\.{2,}(\s*\\infty)?/g, "$1\\ldots")
    .replace(/(\\ldots){2,}/g, "\\ldots")
    .replace(/\\sqrt\{([^{}]*?)\s*\\infty\s*\}/g, "\\sqrt{$1\\ldots}");
}

function stripMathDelimiters(input) {
  const trimmed = String(input || "").trim();
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
      return trimmed.slice(open.length, trimmed.length - close.length).trim();
    }
  }
  return trimmed;
}

function normalizeDifferentials(input) {
  if (!/\\(?:int|iint|iiint)(?=\b|[_^{\s])/.test(input)) {
    return input;
  }
  let output = String(input || "");
  // Pull a trailing "d" that landed inside the last fraction denominator out as dx.
  // e.g. \frac{sec^2(...)}{1 + x^{2} d} x → \frac{sec^2(...)}{1 + x^{2}} dx
  // Only match a bare "d" token at the end of the denominator (not "dx" / "dy").
  output = output.replace(
    /(\\frac\{(?:[^{}]|\{[^{}]*\})+\}\{(?:[^{}]|\{[^{}]*\})*?)\s+d\s*\}(\s*)([A-Za-z])\b/g,
    "$1}$2\\,\\mathrm{d}$3",
  );
  return output.replace(
    /(^|[^\\A-Za-z])([A-Za-z0-9}\]])\s*d([A-Za-z])\b/g,
    (_match, prefix, integrand, variable) =>
      `${prefix}${integrand}\\,\\mathrm{d}${variable}`,
  );
}

function normalizeCollapsedRotationMatrices(input) {
  const matrix = String.raw`\begin{bmatrix}\cos\alpha & \sin\alpha \\ -\sin\alpha & \cos\alpha\end{bmatrix}`;
  return String(input || "")
    .replace(
      /A\s*(?:\\alpha|α)\s*=\s*[-−]?\s*csoisn\s*(?:\\alpha|α)\s*(?:\\alpha|α)\s*(?:ccsoiinns|csoins)\s*(?:\\alpha|α)\s*(?:\\alpha|α)(?:\^?\{?1\}?|¹)?/gi,
      String.raw`A_{\alpha}=${matrix}`,
    )
    .replace(
      /[-−]?\s*csoisn\s*(?:\\alpha|α)\s*(?:\\alpha|α)\s*(?:ccsoiinns|csoins)\s*(?:\\alpha|α)\s*(?:\\alpha|α)(?:\^?\{?1\}?|¹)?/gi,
      matrix,
    );
}

function normalizeFractionalExponents(input) {
  return String(input || "")
    // Only collapse true fractional exponents like ^{1}^{/}^{2} or ^1^/^2.
    // Do NOT treat "b^2 ^2" (adjacent powers) as a fraction.
    .replace(
      /\^\{([^{}]+)\}\s*\^\{?\s*\/\s*\}?\s*\^\{([^{}]+)\}/g,
      (_match, numerator, denominator) => `^{${numerator}/${denominator}}`,
    )
    .replace(
      /\^([A-Za-z0-9]+)\s*\^\s*\/\s*\^([A-Za-z0-9]+)/g,
      (_match, numerator, denominator) => `^{${numerator}/${denominator}}`,
    )
    .replace(
      /\^\{([0-9]+)\}\s*\/\s*\^\{([0-9]+)\}/g,
      (_match, numerator, denominator) => `^{${numerator}/${denominator}}`,
    );
}

function normalizeLatexCommandEscapes(input) {
  return String(input || "").replace(/\\\\(?=[A-Za-z])/g, "\\");
}

function normalizeIntegralLimits(input) {
  const integral = String.raw`\\(int|iint|iiint|oint)`;
  return String(input || "")
    .replace(
      new RegExp(`${integral}\\s+0\\s*\\^\\{([2-9])\\}\\s*\\^\\{\\\\pi\\}`, "g"),
      (_match, op, denominator) => `\\${op}_{0}^{\\pi/${denominator}}`,
    )
    .replace(
      new RegExp(`${integral}\\s+0\\\\pi\\s*\\/\\s*2(?=\\s|\\\\|[A-Za-z({]|$)`, "g"),
      (_match, op) => `\\${op}_{0}^{\\pi/2} `,
    )
    .replace(
      new RegExp(`${integral}\\s+0\\\\pi\\s*\\^\\{([0-9]+)\\/([0-9]+)\\}`, "g"),
      (_match, op, numerator, denominator) => `\\${op}_{0}^{\\pi^{${numerator}}/${denominator}}`,
    )
    .replace(
      new RegExp(`${integral}\\s+\\\\pi\\\\pi\\s*\\/\\s*\\/\\s*63`, "g"),
      (_match, op) => `\\${op}_{\\pi/6}^{\\pi/3}`,
    )
    .replace(
      new RegExp(`${integral}\\s+-\\s*\\\\pi\\\\pi\\s*\\/\\s*2\\s*\\/\\s*2`, "g"),
      (_match, op) => `\\${op}_{-\\pi/2}^{\\pi/2}`,
    )
    .replace(
      new RegExp(`${integral}\\s+-\\s*\\\\pi\\\\pi(?=\\s|$|\\\\|[A-Za-z({])`, "g"),
      (_match, op) => `\\${op}_{-\\pi}^{\\pi}`,
    )
    .replace(
      new RegExp(`${integral}\\s+-\\s*([0-9])([0-9])(?=\\s|$|\\\\|[A-Za-z({])`, "g"),
      (match, op, lower, upper) =>
        lower === upper ? `\\${op}_{-${lower}}^{${upper}}` : match,
    )
    .replace(
      new RegExp(`${integral}\\s+([0-9])\\s+(\\\\sqrt\\{[^{}]+\\})(?=\\s|$|\\\\|[A-Za-z({])`, "g"),
      (_match, op, lower, upper) => `\\${op}_{${lower}}^{${upper}}`,
    )
    .replace(
      new RegExp(`${integral}\\s+xx([0-9])([0-9])\\b`, "g"),
      (_match, op, lowerPower, upperPower) => `\\${op}_{x^${lowerPower}}^{x^${upperPower}}`,
    )
    .replace(
      new RegExp(`${integral}\\s+([0-9])([0-9]|e)\\b`, "g"),
      (_match, op, lower, upper) => `\\${op}_{${lower}}^{${upper}}`,
    )
    // Only promote numeric / pi / infty bases written as a^{b} after \int into limits.
    // Letter bases like e^{x} or x^{2} are integrands, not bounds.
    .replace(
      new RegExp(
        `${integral}\\s+([+-]?(?:[0-9]+|\\\\pi|\\\\infty))\\s*\\^\\{([^{}]+)\\}`,
        "g",
      ),
      (_match, op, lower, upper) => `\\${op}_{${lower}}^{${upper}}`,
    );
}

function normalizeUnicodeOperators(input) {
  return String(input || "")
    .replace(/∫/g, "\\int ")
    .replace(/∑/g, "\\sum ")
    // Prefer braced roots first so √{3} → \sqrt{3} (not "\sqrt {3}").
    .replace(/√\s*\{/g, "\\sqrt{")
    .replace(/√\s*/g, "\\sqrt ")
    .replace(/−/g, "-")
    .replace(/≤/g, "\\le ")
    .replace(/≥/g, "\\ge ")
    .replace(/≠/g, "\\ne ")
    .replace(/×/g, "\\times ")
    .replace(/÷/g, "\\div ")
    .replace(/∀/g, "\\forall ")
    .replace(/°/g, "^{\\circ}")
    .replace(/∩/g, "\\cap ")
    .replace(/∪/g, "\\cup ");
}

const UNICODE_SUPERSCRIPT_MAP = new Map(Object.entries({
  "⁰": "0",
  "¹": "1",
  "²": "2",
  "³": "3",
  "⁴": "4",
  "⁵": "5",
  "⁶": "6",
  "⁷": "7",
  "⁸": "8",
  "⁹": "9",
  "⁺": "+",
  "⁻": "-",
  "⁼": "=",
  "⁽": "(",
  "⁾": ")",
  "ⁿ": "n",
  "ᵃ": "a",
  "ᵇ": "b",
  "ᶜ": "c",
  "ᵈ": "d",
  "ᵉ": "e",
  "ᶠ": "f",
  "ᵍ": "g",
  "ʰ": "h",
  "ⁱ": "i",
  "ʲ": "j",
  "ᵏ": "k",
  "ˡ": "l",
  "ᵐ": "m",
  "ᵒ": "o",
  "ᵖ": "p",
  "ʳ": "r",
  "ˢ": "s",
  "ᵗ": "t",
  "ᵘ": "u",
  "ᵛ": "v",
  "ʷ": "w",
  "ˣ": "x",
  "ʸ": "y",
  "ᶻ": "z",
}));

const UNICODE_SUBSCRIPT_MAP = new Map(Object.entries({
  "₀": "0",
  "₁": "1",
  "₂": "2",
  "₃": "3",
  "₄": "4",
  "₅": "5",
  "₆": "6",
  "₇": "7",
  "₈": "8",
  "₉": "9",
  "₊": "+",
  "₋": "-",
  "₌": "=",
  "₍": "(",
  "₎": ")",
  "ₐ": "a",
  "ₑ": "e",
  "ₕ": "h",
  "ᵢ": "i",
  "ⱼ": "j",
  "ₖ": "k",
  "ₗ": "l",
  "ₘ": "m",
  "ₙ": "n",
  "ₒ": "o",
  "ₚ": "p",
  "ᵣ": "r",
  "ₛ": "s",
  "ₜ": "t",
  "ₓ": "x",
}));

const UNICODE_SUPERSCRIPT_RUN = /[⁰¹²³⁴⁵⁶⁷⁸⁹⁺⁻⁼⁽⁾ⁿᵃᵇᶜᵈᵉᶠᵍʰⁱʲᵏˡᵐᵒᵖʳˢᵗᵘᵛʷˣʸᶻ]+/g;
const UNICODE_SUBSCRIPT_RUN = /[₀₁₂₃₄₅₆₇₈₉₊₋₌₍₎ₐₑₕᵢⱼₖₗₘₙₒₚᵣₛₜₓ]+/g;

function normalizeUnicodeScripts(input) {
  return String(input || "")
    .replace(UNICODE_SUBSCRIPT_RUN, (value) => `_{${translateUnicodeScript(value, UNICODE_SUBSCRIPT_MAP)}}`)
    .replace(UNICODE_SUPERSCRIPT_RUN, (value) => `^{${translateUnicodeScript(value, UNICODE_SUPERSCRIPT_MAP)}}`)
    .replace(/_\s*_\{([^{}]+)\}/g, "_{$1}")
    .replace(/\^\s*\^\{([^{}]+)\}/g, "^{$1}")
    .replace(/\\(int|iint|iiint|oint|sum|prod)\s+(?=[_^])/g, "\\$1");
}

function translateUnicodeScript(value, map) {
  return [...String(value || "")]
    .map((char) => map.get(char) || char)
    .join("");
}

function normalizeBareFunctionNames(input) {
  return String(input || "")
    // Only promote bare function names that look applied (arg, power, paren),
    // never isolated words that happened to match the function list.
    .replace(
      /(?<!\\)\b(sin|cos|tan|cot|sec|csc|log|ln|lim)\b(?=\s*(?:[\^_(0-9A-Za-z\\]|[αβγδθλμπω]))/g,
      "\\$1",
    )
    .replace(
      /(?<!\\)\b(sin|cos|tan|cot|sec|csc|log|ln)(?=[A-Za-z])/g,
      "\\$1 ",
    );
}

function normalizeDisplayText(input) {
  return String(input || "")
    .replace(/\\\\\s*/g, "\n")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .replace(/[ \t]{2,}/g, " ")
    .replace(/\s+([,.;:?])/g, "$1")
    .trim();
}

export function parseMathSegments(input) {
  const source = normalizeMathSource(input);
  if (!source) return [];

  const segments = [];
  let cursor = 0;

  while (cursor < source.length) {
    const candidates = [
      {
        open: "$$",
        close: "$$",
        display: true,
        start: source.indexOf("$$", cursor),
      },
      {
        open: "\\[",
        close: "\\]",
        display: true,
        start: source.indexOf("\\[", cursor),
      },
      {
        open: "\\(",
        close: "\\)",
        display: false,
        start: source.indexOf("\\(", cursor),
      },
      {
        open: "$",
        close: "$",
        display: false,
        start: source.indexOf("$", cursor),
      },
    ]
      .filter((item) => item.start >= 0)
      .sort((a, b) => a.start - b.start);

    if (!candidates.length) {
      appendMixedContent(segments, source.slice(cursor));
      break;
    }

    const next = candidates[0];
    if (next.start > cursor) {
      appendMixedContent(segments, source.slice(cursor, next.start));
    }

    const contentStart = next.start + next.open.length;
    const end = source.indexOf(next.close, contentStart);
    if (end === -1) {
      appendMixedContent(segments, source.slice(next.start));
      break;
    }

    const math = source.slice(contentStart, end).trim();
    if (math) {
      // Single $...$ is also used for currency/prose. Only treat as math when
      // the body is actually mathematical (not "$50$" or "$50 and profit is$").
      if (next.open === "$" && !isValidInlineDollarMath(math)) {
        appendText(segments, "$");
        cursor = contentStart;
        continue;
      }
      segments.push({ type: "math", value: math, display: next.display });
    }
    cursor = end + next.close.length;
  }

  // Only promote the full source to a single math segment when it genuinely
  // looks like standalone math. A lone command like \cdot inside English prose
  // must NOT swallow the whole sentence (that renders as one giant italic SVG
  // with spaces collapsed by TeX).
  if (
    !segments.some((segment) => segment.type === "math" || segment.type === "image") &&
    (rawMathEnvironmentStart(source) >= 0 ||
      looksLikeStandaloneMathExpression(source)) &&
    !/[.!?]\s/.test(source)
  ) {
    return [{
      type: "math",
      value: source,
      display: rawMathEnvironmentStart(source) >= 0 || shouldDisplayRawExpression(source),
    }];
  }

  return mergeAdjacentTextSegments(segments.length ? segments : [{ type: "text", value: source }]);
}

function mergeAdjacentTextSegments(segments) {
  const merged = [];
  for (const segment of segments) {
    const previous = merged[merged.length - 1];
    if (
      segment?.type === "text" &&
      previous?.type === "text"
    ) {
      previous.value = `${previous.value}${segment.value}`;
      continue;
    }
    merged.push({ ...segment });
  }
  return merged;
}

function isValidInlineDollarMath(math) {
  const value = String(math || "").trim();
  if (!value) {
    return false;
  }
  // Currency-like pure amounts: $50$, $12.99$, $50%$
  if (/^[+\-−]?\d+(?:[.,]\d+)?%?$/.test(value)) {
    return false;
  }
  // Single-letter variables are common: $x$, $a$
  if (/^[A-Za-z]$/.test(value)) {
    return true;
  }
  // Simple scripted variables: $x_1$, $a^{2}$
  if (/^[A-Za-z](?:_[A-Za-z0-9]+|\^[A-Za-z0-9]+|_{[^{}]+}|\^{[^{}]+})$/.test(value)) {
    return true;
  }
  return looksLikeMathExpression(value);
}

function appendText(segments, value) {
  if (!value) return;
  segments.push({ type: "text", value });
}

function appendMixedContent(segments, value) {
  if (!value) return;
  let cursor = 0;
  while (cursor < value.length) {
    const match = nextRawMathMatch(value, cursor);
    if (!match) {
      appendText(segments, value.slice(cursor));
      return;
    }
    if (match.start > cursor) {
      appendText(segments, value.slice(cursor, match.start));
    }
    const math = value.slice(match.start, match.end).trim();
    if (math) {
      segments.push({ type: "math", value: math, display: match.display });
    }
    cursor = match.end;
  }
}

function nextRawMathMatch(source, cursor) {
  const candidates = [];

  const envStart = rawMathEnvironmentStart(source, cursor);
  if (envStart >= 0) {
    const end = rawMathEnvironmentEnd(source, envStart);
    if (end > envStart) {
      candidates.push({ start: envStart, end, display: true });
    }
  }

  const determinantStart = source.indexOf("\\left|", cursor);
  if (determinantStart >= 0) {
    const end = source.indexOf("\\right|", determinantStart + 6);
    if (end > determinantStart) {
      candidates.push({ start: determinantStart, end: end + 7, display: true });
    }
  }

  if (!candidates.length) {
    return nextRawExpressionMatch(source, cursor);
  }

  candidates.sort((a, b) => a.start - b.start);
  return candidates[0];
}

const RAW_MATH_COMMAND_PATTERN =
  /\\(?:frac|sqrt|Gamma|Delta|Theta|Lambda|Xi|Pi|Sigma|Upsilon|Phi|Psi|Omega|alpha|beta|gamma|delta|epsilon|varepsilon|theta|lambda|mu|pi|sigma|phi|varphi|omega|sin|cos|tan|cot|sec|csc|log|ln|det|operatorname|sum|prod|int|oint|lim|times|cdot|div|pm|mp|le|leq|ge|geq|ne|neq|approx|equiv|notin|in|forall|exists|angle|cup|cap|subset|subseteq|supset|supseteq|emptyset|varnothing|perp|parallel|circ|to|rightarrow|leftarrow|Rightarrow|Leftarrow|Leftrightarrow|leftrightarrow|iff|implies|ldots|cdots|dots|bar|overline|vec|overrightarrow|hat|widehat|tilde|dot|ddot)/;
// Scripts must look like math indices (x_1, a^{2}), not snake_case identifiers (file_name).
const RAW_SCRIPT_PATTERN =
  /(?<!\w)(?:[A-Za-z0-9)\]}]|\\[A-Za-z]+)(?:\^\{[^{}\s]+\}|_\{[^{}\s]+\}|\^[A-Za-z0-9\\.+\-−]+|_(?:[A-Za-z0-9]{1,3}|\{[^{}\s]+\}))+(?![A-Za-z])/;
const RAW_UNICODE_SCRIPT_PATTERN =
  /(?<!\w)[A-Za-z0-9)\]}]+(?:[₀₁₂₃₄₅₆₇₈₉₊₋₌₍₎ₐₑₕᵢⱼₖₗₘₙₒₚᵣₛₜₓ⁰¹²³⁴⁵⁶⁷⁸⁹⁺⁻⁼⁽⁾ⁿᵃᵇᶜᵈᵉᶠᵍʰⁱʲᵏˡᵐᵒᵖʳˢᵗᵘᵛʷˣʸᶻ]+)+/;
const UNICODE_MATH_PATTERN =
  /[∑∫√αβγδλμπωθ≤≥≈≠∞∂∇∈∉∀∠∪∩⊂⊆∅⊥⇔₀₁₂₃₄₅₆₇₈₉₊₋₌₍₎ₐₑₕᵢⱼₖₗₘₙₒₚᵣₛₜₓ⁰¹²³⁴⁵⁶⁷⁸⁹⁺⁻⁼⁽⁾ⁿᵃᵇᶜᵈᵉᶠᵍʰⁱʲᵏˡᵐᵒᵖʳˢᵗᵘᵛʷˣʸᶻ]/;
// Left side is a short math token (x, dy, AB, 3x-style digit/bracket), with a
// true token boundary so "hypotenuse = AB" does not match the trailing "e =".
const RAW_RELATION_PATTERN =
  /(?<![A-Za-z])(?:[A-Za-z]{1,3}|[0-9)\]}|])\s*(?:=|<|>|≤|≥|≠)\s*(?:\\[A-Za-z]+|[A-Za-z]+|[0-9]+|[({\[|+\-−])/;
const BARE_FUNCTION_NAME_PATTERN =
  /^(?:sin|cos|tan|cot|sec|csc|cosec|log|ln|lim)$/i;
const PLAIN_RANGE_OR_CODE_PATTERN =
  /^(?:[A-Za-z]{1,3}\.?)?\d+(?:\.\d+)?(?:\s*[-–—]\s*\d+(?:\.\d+)?)+$|^(?:[A-Za-z]{1,3}\d+\s*[-–—]\s*[A-Za-z]{1,3}\d+)$|^(?:[A-Za-z](?:\s*[-–—]\s*[A-Za-z])+)$/;

function nextRawExpressionMatch(source, cursor) {
  const remainder = source.slice(cursor);
  const matches = [
    RAW_MATH_COMMAND_PATTERN,
    RAW_SCRIPT_PATTERN,
    RAW_UNICODE_SCRIPT_PATTERN,
    UNICODE_MATH_PATTERN,
    RAW_RELATION_PATTERN,
  ]
    .map((pattern) => remainder.match(pattern))
    .filter((match) => match && typeof match.index === "number")
    .sort((a, b) => a.index - b.index);
  if (!matches.length) {
    return null;
  }

  const trigger = matches[0];
  return expandRawMathExpression(
    source,
    cursor + trigger.index,
    cursor + trigger.index + trigger[0].length,
    cursor,
  );
}

function expandRawMathExpression(source, triggerStart, triggerEnd, floor) {
  let start = triggerStart;
  let end = triggerEnd;

  while (start > floor) {
    const previous = previousMathToken(source, start, floor);
    if (!previous) break;
    start = previous.start;
  }

  while (end < source.length) {
    const next = nextMathToken(source, end);
    if (!next) break;
    end = next.end;
  }

  while (start < end && !source[start].trim()) start += 1;
  while (start < end && /[,.;:!?]/.test(source[start])) {
    start += 1;
    while (start < end && !source[start].trim()) start += 1;
  }
  // Don't let expansion leave a bare leading operator ("= AB = p" from
  // "hypotenuse = AB = p"). Drop leading binary ops until a real atom remains.
  while (start < end && /[=<>≤≥≠+\-−*/]/.test(source[start])) {
    start += 1;
    while (start < end && !source[start].trim()) start += 1;
  }
  while (end > start && !source[end - 1].trim()) end -= 1;
  while (end > start && /[,.;:!?]/.test(source[end - 1])) {
    end -= 1;
    while (end > start && !source[end - 1].trim()) end -= 1;
  }

  if (end <= start) {
    return null;
  }

  const value = source.slice(start, end);
  if (!looksLikeMathExpression(value)) {
    return null;
  }
  // Reject operator-led leftovers that are still not real expressions.
  if (/^[=<>≤≥≠+\-−*/]/.test(value)) {
    return null;
  }
  return { start, end, display: shouldDisplayRawExpression(value) };
}

function previousMathToken(source, index, floor) {
  let cursor = index;
  while (cursor > floor && !source[cursor - 1].trim()) cursor -= 1;
  if (cursor <= floor) return null;

  const char = source[cursor - 1];
  if (isMathPunctuation(char)) {
    return { start: cursor - 1, end: cursor };
  }
  if (/[0-9.]/.test(char)) {
    let start = cursor - 1;
    while (start > floor && /[0-9.]/.test(source[start - 1])) start -= 1;
    return { start, end: cursor };
  }
  if (/[A-Za-z]/.test(char)) {
    let start = cursor - 1;
    while (start > floor && /[A-Za-z]/.test(source[start - 1])) start -= 1;
    const word = source.slice(start, cursor);
    return isMathWord(word) ? { start, end: cursor } : null;
  }
  if (isUnicodeMathChar(char)) {
    return { start: cursor - 1, end: cursor };
  }
  if (char === "}") {
    const start = matchingOpenBrace(source, cursor - 1, floor);
    if (start != null) {
      return { start, end: cursor };
    }
  }
  if (char === "\\") {
    return { start: cursor - 1, end: cursor };
  }
  return null;
}

function nextMathToken(source, index) {
  let cursor = index;
  while (cursor < source.length && !source[cursor].trim()) cursor += 1;
  if (cursor >= source.length) return null;

  const char = source[cursor];
  // Consume balanced brace groups as one token so \frac{a}{1- ab} keeps the full denominator.
  if (char === "{") {
    const close = matchingCloseBrace(source, cursor);
    if (close != null) {
      return { start: cursor, end: close + 1 };
    }
  }
  if (isMathPunctuation(char)) {
    return { start: cursor, end: cursor + 1 };
  }
  if (char === "\\") {
    let end = cursor + 1;
    while (end < source.length && /[A-Za-z]/.test(source[end])) end += 1;
    // Include one following brace group for commands like \sqrt{...} / \frac{...}
    if (end < source.length && source[end] === "{") {
      const close = matchingCloseBrace(source, end);
      if (close != null) {
        end = close + 1;
        // \frac has two brace groups.
        if (source.slice(cursor, end).startsWith("\\frac") && end < source.length && source[end] === "{") {
          const secondClose = matchingCloseBrace(source, end);
          if (secondClose != null) {
            end = secondClose + 1;
          }
        }
      }
    }
    return end > cursor + 1 ? { start: cursor, end } : null;
  }
  if (/[0-9.]/.test(char)) {
    let end = cursor + 1;
    while (end < source.length && /[0-9.]/.test(source[end])) end += 1;
    return { start: cursor, end };
  }
  if (/[A-Za-z]/.test(char)) {
    let end = cursor + 1;
    while (end < source.length && /[A-Za-z]/.test(source[end])) end += 1;
    const word = source.slice(cursor, end);
    return isMathWord(word) ? { start: cursor, end } : null;
  }
  if (isUnicodeMathChar(char)) {
    return { start: cursor, end: cursor + 1 };
  }
  return null;
}

function matchingCloseBrace(source, openIndex) {
  if (source[openIndex] !== "{") {
    return null;
  }
  let depth = 0;
  for (let index = openIndex; index < source.length; index += 1) {
    if (source[index] === "{") {
      depth += 1;
    } else if (source[index] === "}") {
      depth -= 1;
      if (depth === 0) {
        return index;
      }
    }
  }
  return null;
}

function looksLikeStandaloneMathExpression(source) {
  const value = String(source || "").trim();
  if (
    value.length > 140 ||
    /\b(?:none|only|cannot|solution|solutions|matrix|vertices|circle|ellipse|parabola|hyperbola|units?|above|these|following)\b/i.test(value)
  ) {
    return false;
  }
  return looksLikeMathExpression(value);
}

function looksLikeMathExpression(source) {
  const value = String(source || "").trim();
  if (!value) return false;

  // Pure numeric literals stay plain text (options like "-1", "2.5").
  if (/^[+\-−]?\s*\d+(?:\.\d+)?$/.test(value)) {
    return false;
  }

  // Bare function names with no arguments are ordinary words, not equations.
  if (BARE_FUNCTION_NAME_PATTERN.test(value)) {
    return false;
  }

  // Number/letter ranges and codes: 1-2, 2020-21, Q.1-5, A-B, a-b-c.
  if (PLAIN_RANGE_OR_CODE_PATTERN.test(value.replace(/\s+/g, ""))) {
    // Spaced binary minus "a - b" is real math; unspaced ranges are not.
    if (!/(?:[A-Za-z0-9)\]])\s+[-–—]\s+(?:[A-Za-z0-9(\\[])/.test(value)) {
      return false;
    }
  }

  // snake_case identifiers (file_name, max_value) are not math subscripts.
  if (/^[A-Za-z]{2,}(?:_[A-Za-z]{2,})+$/.test(value)) {
    return false;
  }

  const hasLatexCommand = /\\[A-Za-z]+/.test(value);
  const hasUnicodeMath =
    /[∑∫√αβγδλμπωθ≤≥≈≠∞∂∇∈∉∀∠∪∩⊂⊆∅⊥⇔₀₁₂₃₄₅₆₇₈₉₊₋₌₍₎ₐₑₕᵢⱼₖₗₘₙₒₚᵣₛₜₓ⁰¹²³⁴⁵⁶⁷⁸⁹⁺⁻⁼⁽⁾ⁿᵃᵇᶜᵈᵉᶠᵍʰⁱʲᵏˡᵐᵒᵖʳˢᵗᵘᵛʷˣʸᶻ]/.test(value);
  const hasFunctionCall =
    /\b(?:sin|cos|tan|cot|sec|csc|cosec|log|ln|lim)\b(?=\s*(?:[\^_(0-9A-Za-z\\]|[αβγδθλμπω]))/i.test(value) ||
    /\b(?:sin|cos|tan|cot|sec|csc|cosec|log|ln|lim)\s+[A-Za-z0-9(]/i.test(value);
  const hasStrongOperator = /[\^=<>*/|]/.test(value) || /_(?:[A-Za-z0-9]|\{)/.test(value);
  const hasBinaryArithmetic =
    /(?:[A-Za-z0-9)\]]\s*[+\-−]\s*[A-Za-z0-9(\\[]|[A-Za-z0-9)\]]\s*\+\s*[A-Za-z0-9(\\[]|[A-Za-z]\s*-\s*[A-Za-z0-9]|[0-9]\s*-\s*[A-Za-z])/.test(value) ||
    /[A-Za-z0-9]\s*[+\-−]\s*[A-Za-z0-9]/.test(value);
  // Unspaced letter-digit minus like x-1 is math; pure digit ranges already rejected.
  const hasCompactDifference =
    /(?:[A-Za-z]-\d|\d-[A-Za-z]|[A-Za-z]-[A-Za-z](?![A-Za-z-]*$))/.test(value);

  const hasMathSignal =
    hasLatexCommand ||
    hasUnicodeMath ||
    hasFunctionCall ||
    hasStrongOperator ||
    hasBinaryArithmetic ||
    hasCompactDifference;

  if (!hasMathSignal) {
    return false;
  }

  // Alphabetic runs of length >= 2 (split on underscores so file_name fails).
  // Ignore content inside {...} so x_{max} still counts as math.
  const proseProbe = value
    .replace(/\\[A-Za-z]+/g, " ")
    .replace(/\{[^{}]*\}/g, " ");
  const words = proseProbe.matchAll(/(?<![A-Za-z])[A-Za-z]{2,}(?![A-Za-z])/g);
  for (const match of words) {
    if (!isMathWord(match[0])) {
      return false;
    }
  }
  return true;
}

function shouldDisplayRawExpression(value) {
  return value.length > 96 || /\\(?:sum|prod|int|lim|begin\{)/.test(value);
}

const ENGLISH_TWO_LETTER_WORDS = new Set([
  "is",
  "of",
  "to",
  "or",
  "an",
  "if",
  "be",
  "as",
  "at",
  "by",
  "on",
  "in",
  "no",
  "so",
  "we",
  "me",
  "my",
  "do",
  "up",
  "it",
  "he",
  "am",
  "us",
  "ok",
  "re",
]);

function isMathWord(word) {
  const clean = String(word || "").trim();
  if (clean.length <= 1) return true;
  // Point/side/vector labels: AB, AC, BA, OAB, etc.
  if (/^[A-Z]{2,3}$/.test(clean)) {
    return true;
  }
  if (/^(?:sin|cos|tan|cot|sec|csc|cosec|log|ln)[A-Za-z]$/.test(clean)) {
    return true;
  }
  // Algebraic products/coefficients: ax, px, qx, by, xy, ab, ...
  // Exclude common English two-letter words so prose stays text.
  if (/^[a-z]{2}$/.test(clean) && !ENGLISH_TWO_LETTER_WORDS.has(clean)) {
    return true;
  }
  return new Set([
    "sin",
    "cos",
    "cox",
    "tan",
    "cot",
    "sec",
    "csc",
    "cosec",
    "log",
    "ln",
    "lim",
    "amp",
    "arg",
    "det",
    "mod",
    "dx",
    "dy",
    "dz",
    "dt",
    "Re",
    "Im",
    "vec",
    "to",
    "sq",
  ]).has(clean);
}

function isMathPunctuation(char) {
  return /[+\-−*/=<>^_(){}\[\]|,°]/.test(char);
}

function isUnicodeMathChar(char) {
  return /[∑∫√αβγδλμπωθ≤≥≈≠∞∂∇∈∉∀∠∪∩⊂⊆∅⊥⇔₀₁₂₃₄₅₆₇₈₉₊₋₌₍₎ₐₑₕᵢⱼₖₗₘₙₒₚᵣₛₜₓ⁰¹²³⁴⁵⁶⁷⁸⁹⁺⁻⁼⁽⁾ⁿᵃᵇᶜᵈᵉᶠᵍʰⁱʲᵏˡᵐᵒᵖʳˢᵗᵘᵛʷˣʸᶻ]/.test(char);
}

function matchingOpenBrace(source, closeIndex, floor) {
  let depth = 0;
  for (let index = closeIndex; index >= floor; index -= 1) {
    if (source[index] === "}") {
      depth += 1;
    } else if (source[index] === "{") {
      depth -= 1;
      if (depth === 0) {
        if (index > floor && source[index - 1] === "\\") {
          let commandStart = index - 1;
          while (commandStart > floor && /[A-Za-z]/.test(source[commandStart - 1])) {
            commandStart -= 1;
          }
          return commandStart;
        }
        return index;
      }
    }
  }
  return null;
}

function rawMathEnvironmentStart(source, cursor = 0) {
  const match = source
    .slice(cursor)
    .match(
      /\\begin\{(?:array|matrix|bmatrix|pmatrix|vmatrix|Vmatrix|cases|aligned|gathered)\}/,
    );
  if (!match || typeof match.index !== "number") {
    return -1;
  }
  return cursor + match.index;
}

function rawMathEnvironmentEnd(source, start) {
  const prefix = source.slice(start);
  const match = prefix.match(
    /^\\begin\{(array|matrix|bmatrix|pmatrix|vmatrix|Vmatrix|cases|aligned|gathered)\}/,
  );
  if (!match) {
    return start;
  }
  const env = match[1];
  const endToken = `\\end{${env}}`;
  const end = source.indexOf(endToken, start + match[0].length);
  if (end === -1) {
    return start;
  }
  return end + endToken.length;
}

function rawCommandEnd(source, start) {
  let index = start;
  let braceDepth = 0;
  let parenDepth = 0;
  let bracketDepth = 0;

  while (index < source.length) {
    const char = source[index];

    if (char === "\\") {
      index += 1;
      while (index < source.length && /[A-Za-z]/.test(source[index])) {
        index += 1;
      }
      continue;
    }

    if (char === "{") braceDepth += 1;
    if (char === "}") braceDepth = braceDepth > 0 ? braceDepth - 1 : 0;
    if (char === "(") parenDepth += 1;
    if (char === ")") parenDepth = parenDepth > 0 ? parenDepth - 1 : 0;
    if (char === "[") bracketDepth += 1;
    if (char === "]") bracketDepth = bracketDepth > 0 ? bracketDepth - 1 : 0;

    if (braceDepth === 0 && parenDepth === 0 && bracketDepth === 0) {
      if (char === "\n") {
        break;
      }
      if (char === " ") {
        const remainder = source.slice(index + 1);
        if (
          /^(?:and|or|then|where|equal|equals|is|are|has|have|if|what|which|whose|that|than|of|to|in|on|at|for|with|from|the|a|an)\b/i.test(
            remainder,
          )
        ) {
          break;
        }
      }
    }

    index += 1;
  }

  return index;
}

export function renderLatexToSvg(latex, display = false) {
  const normalized = normalizeEquationLatex(latex);
  if (!normalized) return null;
  try {
    const node = mathDocument.convert(normalized, { display: !!display });
    const rendered = adaptor.outerHTML(node);
    if (/data-mjx-error=/i.test(rendered)) {
      return null;
    }
    return sanitizeMathJaxSvg(rendered) || null;
  } catch {
    return null;
  }
}

export function equationDisplayType(latex, requestedDisplay = false) {
  const normalized = normalizeEquationLatex(latex);
  if (requestedDisplay || DISPLAY_MATH_PATTERN.test(normalized)) {
    return "block";
  }
  // Long multi-token expressions can still prefer block, but keep everyday
  // fractions/powers inline so SVG height tracks body text.
  if (normalized.length > 96) {
    return "block";
  }
  return "inline";
}

export function sanitizeMathJaxSvg(input) {
  if (/data-mjx-error=/i.test(String(input || ""))) {
    return "";
  }
  const match = String(input || "").match(/<svg[\s\S]*<\/svg>/i);
  if (!match) return "";
  let svg = match[0]
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<foreignObject[\s\S]*?<\/foreignObject>/gi, "")
    .replace(/\s+on[a-z]+\s*=\s*"[^"]*"/gi, "")
    .replace(/\s+on[a-z]+\s*=\s*'[^']*'/gi, "")
    .replace(/\s+style\s*=\s*"[^"]*"/gi, "")
    .replace(/\s+style\s*=\s*'[^']*'/gi, "")
    .replace(/\s+(?:href|xlink:href)\s*=\s*"javascript:[^"]*"/gi, "")
    .replace(/\s+(?:href|xlink:href)\s*=\s*'javascript:[^']*'/gi, "")
    .replace(/\s+data-mml-node\s*=\s*"[^"]*"/gi, "")
    .replace(/>\s+</g, "><")
    .trim();

  svg = flattenNestedMathJaxSvgs(svg);

  svg = svg.replace(/^<svg\b([^>]*)>/i, (_match, attrs = "") => {
    let cleanAttrs = attrs
      .replace(/\s+xmlns\s*=\s*"[^"]*"/i, "")
      .replace(/\s+preserveAspectRatio\s*=\s*"[^"]*"/i, "")
      .replace(/\s{2,}/g, " ")
      .trim();
    cleanAttrs = cleanAttrs ? ` ${cleanAttrs}` : "";
    return `<svg xmlns="http://www.w3.org/2000/svg"${cleanAttrs} preserveAspectRatio="xMidYMid meet">`;
  });

  return svg;
}

function flattenNestedMathJaxSvgs(svg) {
  const source = String(svg || "");
  const rootMatch = source.match(/^<svg\b[^>]*>/i);
  const rootCloseIndex = source.toLowerCase().lastIndexOf("</svg>");
  if (!rootMatch || rootCloseIndex <= rootMatch[0].length) {
    return source;
  }
  const rootOpen = rootMatch[0];
  const rootClose = source.slice(rootCloseIndex);
  let output = source.slice(rootOpen.length, rootCloseIndex);
  const nestedSvgPattern = /<svg\b([^>]*\s(?:x|y|viewBox|width|height)\s*=\s*"[^"]*"[^>]*)>([\s\S]*?)<\/svg>/gi;
  for (let pass = 0; pass < 4; pass += 1) {
    let changed = false;
    output = output.replace(nestedSvgPattern, (_match, attrs = "", body = "") => {
      const x = numberSvgAttr(attrs, "x") || 0;
      const y = numberSvgAttr(attrs, "y") || 0;
      const width = numberSvgAttr(attrs, "width");
      const height = numberSvgAttr(attrs, "height");
      const viewBox = svgViewBox(attrs);
      const transforms = [];
      if (x || y) {
        transforms.push(`translate(${formatSvgNumber(x)},${formatSvgNumber(y)})`);
      }
      if (viewBox) {
        if (
          Number.isFinite(width) &&
          Number.isFinite(height) &&
          viewBox.width > 0 &&
          viewBox.height > 0 &&
          (Math.abs(width - viewBox.width) > 0.001 || Math.abs(height - viewBox.height) > 0.001)
        ) {
          transforms.push(`scale(${formatSvgNumber(width / viewBox.width)},${formatSvgNumber(height / viewBox.height)})`);
        }
        if (viewBox.x || viewBox.y) {
          transforms.push(`translate(${formatSvgNumber(-viewBox.x)},${formatSvgNumber(-viewBox.y)})`);
        }
      }
      changed = true;
      const transform = transforms.length ? ` transform="${transforms.join(" ")}"` : "";
      return `<g${transform}>${body}</g>`;
    });
    if (!changed || !/<svg\b[^>]*\s(?:x|y|viewBox|width|height)\s*=/i.test(output)) {
      break;
    }
  }
  return `${rootOpen}${output}${rootClose}`;
}

function numberSvgAttr(attrs, name) {
  const match = String(attrs || "").match(new RegExp(`\\b${name}\\s*=\\s*"(-?[0-9.]+)`, "i"));
  return match ? Number(match[1]) : null;
}

function svgViewBox(attrs) {
  const match = String(attrs || "").match(/\bviewBox\s*=\s*"(-?[0-9.]+)\s+(-?[0-9.]+)\s+([0-9.]+)\s+([0-9.]+)"/i);
  if (!match) {
    return null;
  }
  return {
    x: Number(match[1]),
    y: Number(match[2]),
    width: Number(match[3]),
    height: Number(match[4]),
  };
}

function formatSvgNumber(value) {
  return Number(value).toFixed(4).replace(/\.?0+$/, "");
}

export async function renderEquationSvgBatch({
  equations,
  cacheDir,
  publicPathPrefix = "/toolkit-files/equations",
} = {}) {
  const items = Array.isArray(equations) ? equations : [];
  await fs.mkdir(cacheDir, { recursive: true });

  const results = [];
  const summary = {
    total: items.length,
    created: 0,
    reused: 0,
    failed: 0,
  };

  for (const item of items) {
    const id = String(item?.id || "");
    const original = String(item?.original ?? item?.latex ?? item?.value ?? "");
    const latex = normalizeEquationLatex(original);
    const display = equationDisplayType(latex, item?.display === true);
    const result = {
      id,
      original,
      latex,
      svg: null,
      svgPath: null,
      display,
      status: "failed",
      error: null,
    };

    if (!latex) {
      result.error = "Equation is empty after normalization.";
      summary.failed += 1;
      results.push(result);
      console.error("MathJax SVG skipped: empty normalized LaTeX", {
        id,
        original,
      });
      continue;
    }

    const hash = crypto.createHash("sha256").update(latex).digest("hex");
    const filename = `${hash}.svg`;
    const cachePath = path.join(cacheDir, filename);
    result.svgPath = `${publicPathPrefix.replace(/\/+$/, "")}/${filename}`;

    try {
      try {
        const cachedSvg = await fs.readFile(cachePath, "utf8");
        result.svg = sanitizeMathJaxSvg(cachedSvg);
        if (!result.svg) {
          throw new Error("Cached SVG is invalid after sanitization.");
        }
        if (result.svg !== cachedSvg) {
          await fs.writeFile(cachePath, result.svg, "utf8");
        }
        result.status = "cached";
        summary.reused += 1;
      } catch (readError) {
        if (readError?.code !== "ENOENT") {
          console.error("MathJax SVG cache read failed", {
            id,
            cachePath,
            error: readError.message,
          });
        }
        const svg = renderLatexToSvg(latex, display === "block");
        if (!svg) {
          throw new Error("MathJax render returned no SVG.");
        }
        await fs.writeFile(cachePath, svg, "utf8");
        result.svg = svg;
        result.status = "rendered";
        summary.created += 1;
      }
    } catch (error) {
      result.svg = null;
      result.status = "failed";
      result.error = error?.message || "MathJax render failed.";
      result.svgPath = null;
      summary.failed += 1;
      console.error("MathJax SVG render failed", {
        id,
        latex,
        error: result.error,
      });
    }

    results.push(result);
  }

  return { summary, equations: results };
}

export function buildRenderedSegments(input, { forceInlineMath = false } = {}) {
  return parseMathSegments(input).map((segment) => {
    if (segment.type !== "math") {
      return {
        ...segment,
        value: normalizeDisplayText(segment.value),
      };
    }
    const display = forceInlineMath ? false : !!segment.display;
    const latex = normalizeEquationLatex(segment.value);
    return {
      ...segment,
      display,
      original: segment.value,
      latex,
      svg: renderLatexToSvg(latex, display),
      svgPath: null,
      renderStatus: "rendered",
      error: null,
    };
  });
}
