import {mathjax} from "mathjax-full/js/mathjax.js";
import {TeX} from "mathjax-full/js/input/tex.js";
import {SVG} from "mathjax-full/js/output/svg.js";
import {liteAdaptor} from "mathjax-full/js/adaptors/liteAdaptor.js";
import {RegisterHTMLHandler} from "mathjax-full/js/handlers/html.js";
import {AllPackages} from "mathjax-full/js/input/tex/AllPackages.js";

const adaptor = liteAdaptor();
RegisterHTMLHandler(adaptor);

const texInput = new TeX({
  packages: AllPackages,
  inlineMath: [["$", "$"], ["\\(", "\\)"]],
  displayMath: [["$$", "$$"], ["\\[", "\\]"]],
});

const svgOutput = new SVG({fontCache: "none"});
const mathDocument = mathjax.document("", {
  InputJax: texInput,
  OutputJax: svgOutput,
});

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
      {open: "$$", close: "$$", display: true, start: source.indexOf("$$", cursor)},
      {open: "\\[", close: "\\]", display: true, start: source.indexOf("\\[", cursor)},
      {open: "\\(", close: "\\)", display: false, start: source.indexOf("\\(", cursor)},
      {open: "$", close: "$", display: false, start: source.indexOf("$", cursor)},
    ].filter((item) => item.start >= 0).sort((a, b) => a.start - b.start);

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
      segments.push({type: "math", value: math, display: next.display});
    }
    cursor = end + next.close.length;
  }

  if (
    !segments.length &&
    (rawMathEnvironmentStart(source) >= 0 || /\\[A-Za-z]+/.test(source)) &&
    !/[.!?]\s/.test(source)
  ) {
    return [{type: "math", value: source, display: true}];
  }

  return segments.length ? segments : [{type: "text", value: source}];
}

function appendText(segments, value) {
  if (!value) return;
  segments.push({type: "text", value});
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
      segments.push({type: "math", value: math, display: match.display});
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
      candidates.push({start: envStart, end, display: true});
    }
  }

  const determinantStart = source.indexOf("\\left|", cursor);
  if (determinantStart >= 0) {
    const end = source.indexOf("\\right|", determinantStart + 6);
    if (end > determinantStart) {
      candidates.push({start: determinantStart, end: end + 7, display: true});
    }
  }

  const commandPattern =
    /\\(?:frac|sqrt|Delta|alpha|beta|gamma|theta|pi|omega|sin|cos|tan|cot|sec|csc|log|ln|det|operatorname|sum|int|lim|times|cdot|bar|overline|vec|hat|angle)/;
  const directCommand = source.slice(cursor).match(commandPattern);
  if (directCommand && directCommand.index === 0) {
    const start = cursor;
    const end = rawCommandEnd(source, start);
    if (end > start) {
      candidates.push({start, end, display: false});
    }
  }

  if (!candidates.length) {
    const laterCommand = source.slice(cursor).match(commandPattern);
    if (laterCommand && typeof laterCommand.index === "number") {
      const start = cursor + laterCommand.index;
      const end = rawCommandEnd(source, start);
      if (end > start) {
        return {start, end, display: false};
      }
    }
    return null;
  }

  candidates.sort((a, b) => a.start - b.start);
  return candidates[0];
}

function rawMathEnvironmentStart(source, cursor = 0) {
  const match = source
    .slice(cursor)
    .match(/\\begin\{(?:array|matrix|bmatrix|pmatrix|vmatrix|Vmatrix|cases|aligned|gathered)\}/);
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
          /^(?:and|or|then|where|equal|equals|is|are|if|what|which|whose|that|than|of|to|in|on|at|for|with|from|the|a|an)\b/i.test(
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
  const normalized = normalizeMathSource(latex);
  if (!normalized) return null;
  try {
    const node = mathDocument.convert(normalized, {display: !!display});
    return adaptor.outerHTML(node);
  } catch {
    return null;
  }
}

export function buildRenderedSegments(input, {forceInlineMath = false} = {}) {
  return parseMathSegments(input).map((segment) => {
    if (segment.type !== "math") {
      return {
        ...segment,
        value: normalizeDisplayText(segment.value),
      };
    }
    const display = forceInlineMath ? false : !!segment.display;
    return {
      ...segment,
      display,
      svg: renderLatexToSvg(segment.value, display),
    };
  });
}
