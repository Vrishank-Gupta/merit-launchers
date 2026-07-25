const MATH_SEGMENT_PATTERN =
  /(\\\([\s\S]*?\\\)|\\\[[\s\S]*?\\\]|\$\$[\s\S]*?\$\$|\$[\s\S]*?\$)/g;

export function repairCollapsedMatrixNotation(input) {
  const source = String(input || "");
  if (!source.trim()) {
    return source;
  }

  const withMatrixStatementRepairs = repairMatrixQuestionStatements(source);
  let repaired;
  if (!MATH_SEGMENT_PATTERN.test(withMatrixStatementRepairs)) {
    MATH_SEGMENT_PATTERN.lastIndex = 0;
    repaired = repairCollapsedMatrixLatex(withMatrixStatementRepairs);
  } else {
    MATH_SEGMENT_PATTERN.lastIndex = 0;
    // Repair both delimited math segments AND the non-math gaps between them.
    // Semicolon matrices often sit outside \(...\) next to an already-wrapped scalar.
    repaired = withMatrixStatementRepairs.replace(
      /(\\\([\s\S]*?\\\)|\\\[[\s\S]*?\\\]|\$\$[\s\S]*?\$\$|\$[^$]*?\$)|((?:(?!\\\(|\\\[|\$\$|\$)[\s\S])+)/g,
      (match, mathSegment, plainSegment) => {
        if (mathSegment) {
          const stripped = stripDelimiters(mathSegment);
          return `${stripped.open}${repairCollapsedMatrixLatex(stripped.body)}${stripped.close}`;
        }
        return repairCollapsedMatrixLatex(plainSegment || match);
      },
    );
  }

  // Always run cross-boundary cleanup (DMS primes outside matrices, etc.).
  return repairCrossBoundaryFalseMatrices(repaired);
}

export function repairCollapsedMatrixLatex(input) {
  let output = String(input || "");

  output = repairFalseMatrixFractions(output);
  output = repairCollapsedRotationMatrixLatex(output);
  output = repairMatrixIndexNotation(output);
  output = repairKnownInverseMatrixPdfCollapse(output);
  output = repairSemicolonBracketMatrices(output);
  output = repairScalarFractionBeforeMatrix(output);

  output = output.replace(
    /\bA\s*=\s*13\s*-\s*25\b/g,
    () => `A = ${bmatrix([["1", "2"], ["3", "-5"]])}`,
  );

  output = output.replace(
    /\b124\s*-\s*(?:\\lambda|lambda|λ)\s*23\s+152\b/g,
    () => bmatrix([["1", "-3", "2"], ["2", "\\lambda", "5"], ["4", "2", "1"]]),
  );

  output = output.replace(
    /\bM\s*=\s*323\s+114\s+k00\b/g,
    () => `M = ${bmatrix([["3", "4", "0"], ["2", "1", "0"], ["3", "1", "k"]])}`,
  );

  output = output.replace(
    /^\s*-\s*-\s*53\s*-\s*-\s*21\s*$/g,
    () => bmatrix([["-5", "-2"], ["-3", "-1"]]),
  );

  output = output.replace(
    /^\s*-\s*-\s*53\s*-\s*12\s*$/g,
    () => bmatrix([["-5", "-2"], ["-3", "1"]]),
  );

  output = output.replace(
    /^\s*-\s*53\s*-\s*12\s*$/g,
    () => bmatrix([["5", "-2"], ["-3", "1"]]),
  );

  output = output.replace(
    /\b([A-Z])\s*=\s*([0-9])([0-9])\s*-\s*([0-9])([0-9])\b/g,
    (_match, name, a, b, c, d) =>
      `${name} = ${bmatrix([[a, b], [`-${c}`, d]])}`,
  );

  output = output.replace(
    /\b([0-9])([0-9])([0-9])\s+(-\s*(?:\\lambda|lambda|λ)|(?:\\lambda|lambda|λ)|[A-Za-z0-9])([0-9])([0-9])\s+([0-9])([0-9])([0-9])\b/g,
    (_match, a, b, c, d, e, f, g, h, i) =>
      bmatrix([
        [a, b, c],
        [matrixCell(d), e, f],
        [g, h, i],
      ]),
  );

  output = output.replace(
    /\b([A-Z])\s*=\s*([0-9])([0-9])([0-9])\s+([0-9])([0-9])([0-9])\s+([A-Za-z]|\\[A-Za-z]+|[0-9])([0-9])([0-9])\b/g,
    (_match, name, a, b, c, d, e, f, g, h, i) =>
      `${name} = ${bmatrix([
        [a, b, c],
        [d, e, f],
        [matrixCell(g), h, i],
      ])}`,
  );

  output = output.replace(
    /^\s*([+-])?\s*([+-])?\s*([0-9])([0-9])\s*([+-])\s*([+-])?\s*([0-9])([0-9])\s*$/g,
    (_match, firstSignA, firstSignB, a, b, secondSignA, secondSignB, c, d) =>
      bmatrix([
        [signedMatrixCell([firstSignA, firstSignB], a), b],
        [signedMatrixCell([secondSignA, secondSignB], c), d],
      ]),
  );

  // Collapsed 2x2 option matrices like "04 44", "04 1220", "04 - 204"
  output = output.replace(
    /^\s*([+-]?\d+)\s+([+-]?\d+)\s*$/g,
    (match, top, bottom) => {
      const rows = [splitDigitRow(top), splitDigitRow(bottom)];
      if (!rows[0] || !rows[1] || rows[0].length !== rows[1].length || rows[0].length < 2) {
        return match;
      }
      return bmatrix(rows);
    },
  );

  // Factorial determinant rows: "123!!! 234!!! 345!!!" or glued "234!!!534!!!"
  // Note: do not require a trailing \b — "!" is non-word so \b fails after !!!.
  output = output.replace(
    /(?<![\w!])((?:\d+!+)(?:\s*(?:\d+!+)){1,3})(?![\w!])/g,
    (match) => {
      const tokens = match.match(/\d+!+/g) || [];
      if (tokens.length < 2 || tokens.length > 4) {
        return match;
      }
      const rows = tokens.map((token) => {
        const digits = token.replace(/!+/g, "").split("");
        const bangs = (token.match(/!/g) || []).length;
        if (bangs === digits.length && digits.length >= 2 && digits.length <= 4) {
          return digits.map((digit) => `${digit}!`);
        }
        return null;
      });
      if (rows.some((row) => !row) || rows.some((row) => row.length !== rows[0].length)) {
        return match;
      }
      return bmatrix(rows);
    },
  );

  // Packed algebraic determinant tokens with digits: "x13 001 1x4" (must include a digit)
  output = output.replace(
    /\b((?:[A-Za-z0-9]*\d[A-Za-z0-9]*)(?:\s+[A-Za-z0-9]*\d[A-Za-z0-9]*){1,3})\b/g,
    (match) => {
      if (/\\begin\{/.test(match) || /[=+\-*/]/.test(match)) {
        return match;
      }
      const tokens = match.trim().split(/\s+/);
      if (tokens.length < 2 || tokens.length > 4) {
        return match;
      }
      if (!tokens.every((token) => /^[A-Za-z0-9]+$/.test(token))) {
        return match;
      }
      const lengths = tokens.map((token) => token.length);
      if (lengths.some((length) => length !== lengths[0] || length < 2 || length > 4)) {
        return match;
      }
      // Avoid converting ordinary multi-digit numbers like years or counts.
      if (tokens.every((token) => /^\d+$/.test(token)) && lengths[0] > 2) {
        return match;
      }
      const rows = tokens.map((token) => token.split(""));
      return bmatrix(rows);
    },
  );

  return compactMatrixCellSigns(output);
}

function repairCrossBoundaryFalseMatrices(input) {
  return String(input || "")
    // \( [[5,7],[1,6],[2,2]] \)° ″ ″″ → 57° 16' 22''
    // Also covers plain matrices created from "57 16 22°" digit triples.
    .replace(
      /(?:\\\(\s*)?\\begin\{bmatrix\}\s*(\d+)\s*&\s*(\d+)\s*\\\\\s*(\d+)\s*&\s*(\d+)\s*\\\\\s*(\d+)\s*&\s*(\d+)\s*\\end\{bmatrix\}(?:\s*\\\))?\s*°[\s″"'′]*/g,
      (_match, a, b, c, d, e, f) => `${a}${b}^\\circ ${c}${d}' ${e}${f}''`,
    );
}

function repairFalseMatrixFractions(input) {
  return String(input || "")
    // cot(B/2) cot(C/2) misread as a matrix (several SVG collapse shapes)
    .replace(
      /\\cot\s*\\begin\{bmatrix\}[\s\S]*?\\end\{bmatrix\}/gi,
      (match) => {
        if (!/\bB\b/.test(match) || !/(?:\bC\b|cotC|\\cot\s*C)/i.test(match) || !/\b2\b/.test(match)) {
          return match;
        }
        return String.raw`\cot\frac{B}{2}\cot\frac{C}{2}`;
      },
    )
    .replace(
      /\\begin\{bmatrix\}\s*B\s*&\s*C\s*\\\\\s*\\cot\s*&\s*\\cot\s*\\\\\s*2\s*&\s*2\s*\\end\{bmatrix\}/gi,
      String.raw`\cot\frac{B}{2}\cot\frac{C}{2}`,
    )
    // Collapsed half-angle products from DOCX/SVG: cot A2cotB2 → cot(A/2)cot(B/2)
    .replace(
      /\\cot\s*([A-Z])\s*2\s*\\cot\s*([A-Z])\s*2\b/g,
      (_match, a, b) => `\\cot\\frac{${a}}{2}\\cot\\frac{${b}}{2}`,
    )
    .replace(
      /(?<!\\)\bcot\s*([A-Z])2cot([A-Z])2\b/gi,
      (_match, a, b) => `\\cot\\frac{${a}}{2}\\cot\\frac{${b}}{2}`,
    )
    .replace(
      /\\cot\s*([A-Z])2cot([A-Z])2\b/g,
      (_match, a, b) => `\\cot\\frac{${a}}{2}\\cot\\frac{${b}}{2}`,
    )
    .replace(
      /\\frac\{\\cot\\frac\{([A-Z])\}\{2\}\\cot\\frac\{([A-Z])\}\{2\}\s*-\s*1\}\{\\cot\\frac\{([A-Z])\}\{2\}\\cot\\frac\{([A-Z])\}\{2\}\}/g,
      (_match, a1, b1, a2, b2) =>
        `\\frac{\\cot\\frac{${a1}}{2}\\cot\\frac{${b1}}{2}-1}{\\cot\\frac{${a2}}{2}\\cot\\frac{${b2}}{2}}`,
    )
    // tan(β + γ)/2 etc misread as matrix
    .replace(
      /\\tan\s*\\begin\{bmatrix\}\s*\\?beta\s*&\s*\\?gamma\s*\\\\\s*\+?\s*&\s*3tan\s*\\\\\s*2\s*&\s*4\s*\\end\{bmatrix\}/gi,
      String.raw`\tan\frac{\beta+\gamma}{2}+3\tan\frac{\beta-\gamma}{4}`,
    )
    // tan^{-1}(2/3), 0<α,β<π/2 misread as a matrix (several SVG collapse shapes)
    .replace(
      /\\tan\^\{-1\}\s*\\begin\{bmatrix\}[\s\S]*?\\end\{bmatrix\}/gi,
      (match) => {
        if (!/2/.test(match) || !/3/.test(match) || !/\\pi|pi/.test(match)) {
          return match;
        }
        if (!/alpha|\\alpha/.test(match)) {
          return match;
        }
        return String.raw`\tan^{-1}\frac{2}{3},0<\alpha,\beta<\frac{\pi}{2}`;
      },
    )
    // log((1±x)/(1∓x)) misread as a matrix
    .replace(
      /\\log\s*\\begin\{bmatrix\}\s*1\s*&\s*([+-])\s*x\s*\\\\\s*1\s*&\s*([+-])\s*x\s*\\end\{bmatrix\}/gi,
      (_match, s1, s2) => `\\log\\frac{1${s1}x}{1${s2}x}`,
    )
    // bare fraction (a±b)/(1±ab) misread as matrix
    .replace(
      /\\begin\{bmatrix\}\s*([a-z])\s*&\s*([+-])\s*([a-z])\s*\\\\\s*1\s*([+-])\s*&\s*([a-z]{2})\s*\\end\{bmatrix\}/gi,
      (_match, a, s1, b, s2, ab) => `\\frac{${a}${s1}${b}}{1${s2}${ab}}`,
    )
    // Nested \( frac \) cells left inside a matrix from partial wraps
    .replace(
      /\\begin\{(bmatrix|pmatrix|vmatrix|Vmatrix|matrix)\}([\s\S]*?)\\end\{\1\}/g,
      (_match, env, body) => {
        const cleaned = body
          .replace(/\\\(\s*/g, "")
          .replace(/\s*\\\)/g, "")
          .replace(/[ \t]{2,}/g, " ")
          .trim();
        return `\\begin{${env}}${cleaned}\\end{${env}}`;
      },
    )
    // DMS degree options misread as matrices: [[5,7],[1,6],[2,2]]° or with prime marks
    .replace(
      /\\begin\{bmatrix\}\s*(\d+)\s*&\s*(\d+)\s*\\\\\s*(\d+)\s*&\s*(\d+)\s*\\\\\s*(\d+)\s*&\s*(\d+)\s*\\end\{bmatrix\}\s*°[\s″"'′]*/g,
      (_match, a, b, c, d, e, f) => `${a}${b}^\\circ ${c}${d}' ${e}${f}''`,
    );
}

function repairKnownInverseMatrixPdfCollapse(input) {
  return String(input || "")
    // "The inverse matrix of is -4 2" from PDF glyph collapse of [[2,-3],[-4,2]]
    .replace(
      /inverse matrix of\s+is\s*-?\s*4\s*2\b/gi,
      () => `inverse matrix of ${bmatrix([["2", "-3"], ["-4", "2"]])} is`,
    )
    // Options like -1/8^2 [3; 4 2] → -1/8 [[2,3],[4,2]]
    .replace(
      /([+-]?)\\frac\{1\}\{8\}\^?2\s*\[\s*(\d)\s*;\s*(\d)\s+(\d)\s*\]/g,
      (_match, sign, a, b, c) =>
        `${sign || ""}\\frac{1}{8}${bmatrix([["2", a], [b, c]])}`,
    )
    .replace(
      /([+-]?)\\frac\{1\}\{8\}\s*\^\s*\{\s*2\s*\}\s*\[\s*(\d)\s*;\s*(\d)\s+(\d)\s*\]/g,
      (_match, sign, a, b, c) =>
        `${sign || ""}\\frac{1}{8}${bmatrix([["2", a], [b, c]])}`,
    );
}

function repairMatrixIndexNotation(input) {
  return String(input || "")
    .replace(/\bA\s*(?:\\alpha|α)\b/g, "A_{\\alpha}")
    .replace(/\bA\s*_\s*\{\s*\\alpha\s*\}\s*A\s*-\s*(?:\\alpha|α)\b/g, "A_{\\alpha}A_{-\\alpha}")
    .replace(/\bA\s*_\s*\{\s*\\alpha\s*\}\s*A\s*(?:\\alpha|α)\b/g, "A_{\\alpha}A_{\\alpha}")
    .replace(
      /A_\{\\alpha\}\s*=\s*\\begin\{bmatrix\}/g,
      "A_{\\alpha}=\\begin{bmatrix}",
    );
}

function repairScalarFractionBeforeMatrix(input) {
  // SVG often collapses 1/8 into "18" immediately before a matrix.
  return String(input || "")
    .replace(
      /([+-]?)\s*18\s*(\\begin\{(?:b|p|v|V)?matrix\})/g,
      (_match, sign, begin) => `${sign || ""}\\frac{1}{8}${begin}`,
    )
    .replace(
      /([+-]?)\s*1\s*8\s*(\\begin\{(?:b|p|v|V)?matrix\})/g,
      (_match, sign, begin) => `${sign || ""}\\frac{1}{8}${begin}`,
    );
}

function repairSemicolonBracketMatrices(input) {
  return String(input || "").replace(
    /\[\s*([^\[\];]+?)\s*;\s*([^\[\];]+?)(?:\s*;\s*([^\[\];]+?))?\s*\]/g,
    (match, row1, row2, row3) => {
      const rows = [row1, row2, row3].filter((row) => row != null).map(parseBracketMatrixRow);
      if (rows.some((row) => row.length < 1) || rows.some((row) => row.length !== rows[0].length)) {
        return match;
      }
      if (rows[0].length < 2 || rows[0].length > 4 || rows.length < 2) {
        return match;
      }
      // Avoid converting interval-like or option markers.
      if (rows.flat().some((cell) => /^(?:none|or|and)$/i.test(cell))) {
        return match;
      }
      return bmatrix(rows);
    },
  );
}

function parseBracketMatrixRow(row) {
  return String(row || "")
    .replace(/\s*\/\s*/g, "/")
    .trim()
    .split(/\s+/)
    .map((cell) => cell.trim())
    .filter(Boolean)
    .map((cell) => {
      // Normalize "3/2" style fractions for LaTeX cells.
      if (/^[+-]?\d+\/[+-]?\d+$/.test(cell)) {
        const [numerator, denominator] = cell.split("/");
        return `\\frac{${numerator}}{${denominator}}`;
      }
      return normalizeMatrixTrigCell(matrixCell(cell));
    });
}

function normalizeMatrixTrigCell(value) {
  return String(value || "")
    .replace(
      /(?<!\\)\b(sin|cos|tan|cot|sec|csc)\b(?=\s*(?:\\[A-Za-z]+|\^|[0-9(]|[a-z]\b|θ|α|β)|$)/gi,
      "\\$1",
    );
}

function splitDigitRow(token) {
  const raw = String(token || "").trim();
  if (!raw) {
    return null;
  }
  const sign = raw.startsWith("-") ? "-" : raw.startsWith("+") ? "+" : "";
  const digits = raw.replace(/^[+-]/, "");
  if (!/^\d+$/.test(digits) || digits.length < 2 || digits.length > 4) {
    return null;
  }
  // Prefer equal 1-digit cells, then 2-digit pairs for even lengths.
  if (digits.length === 2) {
    return [`${sign}${digits[0]}`, digits[1]].map((cell, index) =>
      index === 0 ? cell : matrixCell(cell),
    );
  }
  if (digits.length === 3) {
    // Ambiguous; treat as 1+2 only when first digit is 0 (leading column zero).
    if (digits[0] === "0") {
      return ["0", digits.slice(1)];
    }
    return digits.split("");
  }
  if (digits.length === 4) {
    return [digits.slice(0, 2), digits.slice(2)].map((cell, index) =>
      index === 0 && sign ? `${sign}${cell}` : cell,
    );
  }
  return null;
}

function repairCollapsedRotationMatrixLatex(input) {
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

function stripDelimiters(segment) {
  const trimmed = String(segment || "");
  const pairs = [
    { open: "\\(", close: "\\)" },
    { open: "\\[", close: "\\]" },
    { open: "$$", close: "$$" },
    { open: "$", close: "$" },
  ];
  for (const pair of pairs) {
    if (
      trimmed.startsWith(pair.open) &&
      trimmed.endsWith(pair.close) &&
      trimmed.length > pair.open.length + pair.close.length
    ) {
      return {
        open: pair.open,
        close: pair.close,
        body: trimmed.slice(pair.open.length, trimmed.length - pair.close.length),
      };
    }
  }
  return { open: "", close: "", body: trimmed };
}

function repairMatrixQuestionStatements(input) {
  return String(input || "").replace(
    /(Statement\s*2:\s*\\\(\s*)k\s+0(\s*\\\))/gi,
    (_match, prefix, suffix) => `${prefix}k \\ne 0${suffix}`,
  );
}

function bmatrix(rows) {
  return `\\begin{bmatrix}${rows.map((row) => row.map(matrixCell).join(" & ")).join(" \\\\ ")}\\end{bmatrix}`;
}

function vmatrix(rows) {
  return `\\begin{vmatrix}${rows.map((row) => row.map(matrixCell).join(" & ")).join(" \\\\ ")}\\end{vmatrix}`;
}

function matrixCell(value) {
  return normalizeMatrixTrigCell(
    String(value || "")
      .replace(/λ/g, "\\lambda")
      .replace(/θ/g, "\\theta")
      .replace(/(?<!\\)\blambda\b/g, "\\lambda")
      .replace(/\\{2,}(?=lambda\b)/g, "\\")
      .replace(/-\s*\\+/g, () => "-\\")
      .replace(/\s+/g, "")
      .trim(),
  );
}

function signedMatrixCell(signs, value) {
  const minusCount = signs.filter((sign) => sign === "-").length;
  return `${minusCount % 2 === 1 ? "-" : ""}${value}`;
}

function compactMatrixCellSigns(input) {
  return String(input || "").replace(
    /\\begin\{(bmatrix|matrix|pmatrix|vmatrix|Vmatrix)\}([\s\S]*?)\\end\{\1\}/g,
    (_match, env, body) => {
      const compacted = body
        .replace(/(^|&|\\\\)\s*([+-])\s+([A-Za-z0-9\\])/g, (_cell, prefix, sign, next) => `${prefix} ${sign}${next}`)
        .replace(/\s{2,}/g, " ")
        .trim();
      return `\\begin{${env}}${compacted}\\end{${env}}`;
    },
  );
}
