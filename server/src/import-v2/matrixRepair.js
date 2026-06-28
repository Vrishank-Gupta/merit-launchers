const MATH_SEGMENT_PATTERN =
  /(\\\([\s\S]*?\\\)|\\\[[\s\S]*?\\\]|\$\$[\s\S]*?\$\$|\$[\s\S]*?\$)/g;

export function repairCollapsedMatrixNotation(input) {
  const source = String(input || "");
  if (!source.trim()) {
    return source;
  }

  const withMatrixStatementRepairs = repairMatrixQuestionStatements(source);
  if (!MATH_SEGMENT_PATTERN.test(source)) {
    MATH_SEGMENT_PATTERN.lastIndex = 0;
    return repairCollapsedMatrixLatex(withMatrixStatementRepairs);
  }
  MATH_SEGMENT_PATTERN.lastIndex = 0;

  return withMatrixStatementRepairs.replace(MATH_SEGMENT_PATTERN, (segment) => {
    const stripped = stripDelimiters(segment);
    return `${stripped.open}${repairCollapsedMatrixLatex(stripped.body)}${stripped.close}`;
  });
}

export function repairCollapsedMatrixLatex(input) {
  let output = String(input || "");

  output = repairCollapsedRotationMatrixLatex(output);

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

  return compactMatrixCellSigns(output);
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

function matrixCell(value) {
  return String(value || "")
    .replace(/λ/g, "\\lambda")
    .replace(/(?<!\\)\blambda\b/g, "\\lambda")
    .replace(/\\{2,}(?=lambda\b)/g, "\\")
    .replace(/-\s*\\+/g, () => "-\\")
    .replace(/\s+/g, "")
    .trim();
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
