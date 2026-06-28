import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import {
  normalizeEquationLatex,
  parseMathSegments,
  renderEquationSvgBatch,
  renderLatexToSvg,
} from "../src/mathSvg.js";

test("normalizes integral differential without keeping trailing punctuation", () => {
  assert.equal(
    normalizeEquationLatex(String.raw`\(\int \frac{xdx}{a^{4} + x^{4}}.\)`),
    String.raw`\int \frac{x\,\mathrm{d}x}{a^{4} + x^{4}}`,
  );
});

test("renders standalone sanitized SVG for fractions and integrals", () => {
  const svg = renderLatexToSvg(
    String.raw`\int \frac{x\,\mathrm{d}x}{a^{4} + x^{4}}`,
    true,
  );

  assert.match(svg, /^<svg\b/);
  assert.match(svg, /viewBox="/);
  assert.doesNotMatch(svg, /<mjx-container/i);
  assert.doesNotMatch(svg, /<script/i);
  assert.doesNotMatch(svg, /\son[a-z]+=/i);
});

test("repairs extracted fractional exponents that would create MathJax error SVGs", () => {
  const latex = String.raw`\int \frac{dx}{x^{2}(x^{4} + 1)^{3}^{/}^{4}}`;
  const normalized = normalizeEquationLatex(latex);
  const svg = renderLatexToSvg(latex, true);

  assert.equal(normalized, String.raw`\int \frac{dx}{x^{2}(x^{4} + 1)^{3/4}}`);
  assert.match(svg, /^<svg\b/);
  assert.doesNotMatch(svg, /data-mjx-error/i);
  assert.doesNotMatch(svg, /data-background/i);
});

test("segments PDF-style raw math expressions without mixing SVG and text", () => {
  const samples = [
    {
      source: String.raw`The differential equation y \frac{dx}{dy} = y -1, y(0) =1 has`,
      math: [String.raw`y \frac{dx}{dy} = y -1, y(0) =1`],
    },
    {
      source: String.raw`Solution of the differential equation sec^2 x tan y dx + sec^2 y tan x dy = 0 is`,
      math: [String.raw`sec^2 x tan y dx + sec^2 y tan x dy = 0`],
    },
    {
      source: String.raw`x - y + C =log (3x - 4y + 1)`,
      math: [String.raw`x - y + C =log (3x - 4y + 1)`],
    },
    {
      source: String.raw`|z_1|+|z^2|is`,
      math: [String.raw`|z_1|+|z^2|`],
    },
    {
      source: String.raw`The point on the line 3x + 4y = 5, which is equidistant`,
      math: [String.raw`3x + 4y = 5`],
    },
  ];

  for (const sample of samples) {
    const math = parseMathSegments(sample.source)
      .filter((segment) => segment.type === "math")
      .map((segment) => segment.value);
    assert.deepEqual(math, sample.math, sample.source);
  }
});

test("treats matching PDF option expressions consistently", () => {
  const optionSets = [
    ["tan x + tan y = C", "tan x tan y = C", "tan x - tan y = C", "tan x sec y = C"],
    [String.raw`a \ge 1`, "a > 1", String.raw`0 < a \le 1`, "0 < a < 1"],
    ["2 sin A cos B", "sin 2A", "cos 2A", "2 cos A sin B"],
    ["A = 0", String.raw`A \ne 0`, "|A|= 0", String.raw`|A| \ne 0`],
  ];

  for (const options of optionSets) {
    for (const option of options) {
      const segments = parseMathSegments(option);
      assert.equal(segments.length, 1, option);
      assert.equal(segments[0].type, "math", option);
    }
  }

  assert.equal(parseMathSegments("-1")[0].type, "text");
  assert.equal(parseMathSegments("unique solution")[0].type, "text");
});

test("normalizes bare PDF function names and unicode operators for MathJax", () => {
  assert.equal(
    normalizeEquationLatex("tan x + tan y = C"),
    String.raw`\tan x + \tan y = C`,
  );
  assert.equal(
    normalizeEquationLatex("−2 < x ≤ −1"),
    String.raw`-2 < x \le -1`,
  );
  assert.equal(
    normalizeEquationLatex("x - y + C =log (3x - 4y + 1)"),
    String.raw`x - y + C =\log (3x - 4y + 1)`,
  );
});

test("repairs collapsed rotation matrix text into a real matrix", () => {
  const samples = [
    String.raw`A\alpha = -csoisn\alpha\alpha ccsoiinns\alpha\alpha^1`,
    String.raw`A\alpha = - csoisn\alpha\alpha csoins\alpha\alpha`,
  ];

  for (const sample of samples) {
    const normalized = normalizeEquationLatex(sample);
    const svg = renderLatexToSvg(normalized, true);

    assert.equal(
      normalized,
      String.raw`A_{\alpha}=\begin{bmatrix}\cos\alpha & \sin\alpha \\ -\sin\alpha & \cos\alpha\end{bmatrix}`,
    );
    assert.match(svg, /^<svg\b/);
    assert.doesNotMatch(svg, /csoisn|ccsoiinns|csoins/);
  }
});

test("renders Mathematics-3 integral and matrix repairs without raw fallback", async () => {
  const cacheDir = await fs.mkdtemp(path.join(os.tmpdir(), "ml-equations-"));
  try {
    const result = await renderEquationSvgBatch({
      cacheDir,
      equations: [
        {
          id: "mathematics-3-q2",
          original: String.raw`\int \frac{dx}{x^{2}(x^{4} + 1)^{3}^{/}^{4}}`,
          display: true,
        },
        {
          id: "mathematics-3-q8",
          original: String.raw`A\alpha = - csoisn\alpha\alpha csoins\alpha\alpha`,
          display: true,
        },
        {
          id: "mathematics-3-q10",
          original: String.raw`A = 13 - 25`,
          display: true,
        },
        {
          id: "mathematics-3-q12",
          original: String.raw`124 - \lambda23 152`,
          display: true,
        },
        {
          id: "mathematics-3-q75",
          original: String.raw`M = 323 114 k00`,
          display: true,
        },
      ],
    });

    assert.equal(result.summary.failed, 0);
    assert.equal(
      result.equations[0].latex,
      String.raw`\int \frac{dx}{x^{2}(x^{4} + 1)^{3/4}}`,
    );
    assert.equal(
      result.equations[1].latex,
      String.raw`A_{\alpha}=\begin{bmatrix}\cos\alpha & \sin\alpha \\ -\sin\alpha & \cos\alpha\end{bmatrix}`,
    );
    assert.equal(
      result.equations[2].latex,
      String.raw`A = \begin{bmatrix}1 & 2 \\ 3 & -5\end{bmatrix}`,
    );
    assert.equal(
      result.equations[3].latex,
      String.raw`\begin{bmatrix}1 & -3 & 2 \\ 2 & \lambda & 5 \\ 4 & 2 & 1\end{bmatrix}`,
    );
    assert.equal(
      result.equations[4].latex,
      String.raw`M = \begin{bmatrix}3 & 4 & 0 \\ 2 & 1 & 0 \\ 3 & 1 & k\end{bmatrix}`,
    );
    for (const equation of result.equations) {
      assert.match(equation.svg, /^<svg\b/);
      assert.doesNotMatch(equation.svg, /data-mjx-error|csoisn|csoins/i);
      assert.equal(
        equation.svg.match(/<svg\b/gi)?.length,
        1,
        `${equation.id} should not contain nested SVG viewports`,
      );
    }
  } finally {
    await fs.rm(cacheDir, { recursive: true, force: true });
  }
});

test("does not return MathJax error SVGs as rendered equations", async () => {
  const cacheDir = await fs.mkdtemp(path.join(os.tmpdir(), "ml-equations-"));
  const originalConsoleError = console.error;
  try {
    console.error = () => {};
    const result = await renderEquationSvgBatch({
      cacheDir,
      equations: [
        {
          id: "bad",
          original: String.raw`x^{2}^{3}`,
          display: false,
        },
      ],
    });

    assert.equal(result.summary.created, 0);
    assert.equal(result.summary.failed, 1);
    assert.equal(result.equations[0].status, "failed");
    assert.equal(result.equations[0].svg, null);
  } finally {
    console.error = originalConsoleError;
    await fs.rm(cacheDir, { recursive: true, force: true });
  }
});

test("caches rendered equations by normalized LaTeX hash", async () => {
  const cacheDir = await fs.mkdtemp(path.join(os.tmpdir(), "ml-equations-"));
  try {
    const first = await renderEquationSvgBatch({
      cacheDir,
      equations: [
        {
          id: "integral",
          original: String.raw`\int \frac{xdx}{a^{4} + x^{4}}.`,
          display: true,
        },
      ],
    });
    assert.equal(first.summary.created, 1);
    assert.equal(first.summary.reused, 0);
    assert.equal(first.summary.failed, 0);
    assert.equal(
      first.equations[0].latex,
      String.raw`\int \frac{x\,\mathrm{d}x}{a^{4} + x^{4}}`,
    );
    assert.match(
      first.equations[0].svgPath,
      /^\/toolkit-files\/equations\/[a-f0-9]{64}\.svg$/,
    );

    const second = await renderEquationSvgBatch({
      cacheDir,
      equations: [
        {
          id: "same-integral",
          original: String.raw`\int \frac{x\,\mathrm{d}x}{a^{4} + x^{4}}`,
          display: true,
        },
      ],
    });
    assert.equal(second.summary.created, 0);
    assert.equal(second.summary.reused, 1);
    assert.equal(second.summary.failed, 0);
    assert.equal(second.equations[0].svgPath, first.equations[0].svgPath);
  } finally {
    await fs.rm(cacheDir, { recursive: true, force: true });
  }
});
