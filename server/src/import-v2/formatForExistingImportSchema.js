import {OPTION_LETTERS, fileTitle} from "./documentIr.js";

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
        prompt: normalizeLatexUnicode(String(question.prompt || "").trim()),
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
  const text = normalizeLatexUnicode(String(value || "").trim());
  if (!text || hasExplicitMathDelimiters(text) || !looksLikeStandaloneMathText(text)) {
    return text;
  }
  return `\\( ${text} \\)`;
}

function hasExplicitMathDelimiters(text) {
  return /(?:\\\(|\\\[|\$\$|\$)/.test(text);
}

function looksLikeStandaloneMathText(text) {
  if (/\b(?:none of these|none of the above|only|and|or)\b/i.test(text)) {
    return false;
  }
  if (/\\(?:frac|sqrt|bar|overline|hat|sin|cos|tan|cot|log|lim|sum|int|pi|theta|alpha|beta|gamma|delta|lambda|mu|phi|omega|Delta|Omega|Lambda|le|ge|ne|pm|times|div|in|notin|forall|angle|cup|cap|subset|subseteq|emptyset|perp|Leftrightarrow|ldots|cdot|circ|to)\b/.test(text)) {
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
