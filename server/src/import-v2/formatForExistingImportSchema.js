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
  if (!looksLikeStandaloneMathText(text)) {
    return text;
  }
  return `\\( ${normalizeLatexFragment(text)} \\)`;
}

function normalizeImportedMathText(value) {
  return normalizePlainLatexText(
    normalizeDelimitedLatex(
      repairCollapsedMatrixNotation(normalizeLatexUnicode(String(value || "").trim())),
    ),
  );
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
  if (!/\\[A-Za-z]+|[+\-=^_*/]/.test(normalizedOutside)) {
    return "";
  }
  if (/\b(?:none of these|none of the above|only|both|either|neither)\b/i.test(normalizedOutside)) {
    return "";
  }

  const merged = text
    .replace(/\\\(([\s\S]*?)\\\)/g, " $1 ")
    .replace(/\\\[([\s\S]*?)\\\]/g, " $1 ")
    .replace(/\$\$([\s\S]*?)\$\$/g, " $1 ")
    .replace(/\$([^$]*?)\$/g, " $1 ");
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
    .replace(/\\sqrt\s+([A-Za-z0-9]+|\([^()]+\))/g, (_match, body) =>
      `\\sqrt{${body.replace(/^\((.*)\)$/, "$1")}}`)
    .replace(/\\(sin|cos|tan|cot|sec|csc|log|ln)\s*\^\s*\{\s*-\s*1\s*\}/g, "\\$1^{-1}")
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
    .replace(/\{\s*-\s*/g, "{-")
    .replace(/\s*\}/g, "}")
    .replace(/[ \t]{2,}/g, " ")
    .trim();
  return latex;
}

function normalizePlainLatexText(value) {
  return String(value || "")
    .replace(/\bxtaxx\b/g, "x\\tan x")
    .replace(/\bsim\b/g, "\\sin")
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
    .replace(/\\sqrt\{\(\}\s*([^)\s]+)\)/g, "\\sqrt{$1}")
    .replace(/\\frac\{([^{}]+)\}\{\(([^{}()]+)\}\)/g, "\\frac{$1}{$2}")
    .replace(/\\frac\{([^{}]+)\}\{\(([^{}()]+)\}/g, "\\frac{$1}{$2}")
    .replace(/\\pi([0-9]+)\b/g, "\\pi^{$1}")
    .replace(/\\pi\s*\/\s*([0-9]+)/g, "\\pi/$1")
    .replace(/\\ln\s+t\b/g, "\\int")
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
    .replace(/[ \t]{2,}/g, " ")
    .trim();
}
