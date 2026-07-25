import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import JSZip from "jszip";
import {parsePaperDeterministicV2} from "../src/import-v2/parsePaperDeterministicV2.js";
import {pdfToIr, repairPdfMathGlyphs} from "../src/import-v2/pdfToIr.js";
import {repairPrivateUseMathGlyphs} from "../src/import-v2/mathGlyphRepair.js";
import {repairCollapsedMatrixNotation} from "../src/import-v2/matrixRepair.js";

test("parses plain text question with answer key", async () => {
  const result = await parseText(`1. What is 2 + 2?
A. 1
B. 2
C. 4
D. 5

Answer Key:
1. C`);

  assert.equal(result.questions.length, 1);
  assert.deepEqual(result.questions[0].options, ["1", "2", "4", "5"]);
  assert.equal(result.questions[0].correctIndex, 2);
  assert.ok(result.confidence >= 0.85);
});

test("parses inline lowercase options and inline answer", async () => {
  const result = await parseText(`Q1. Evaluate \\( x^2 + 2x + 1 \\).
(a) \\( (x+1)^2 \\) (b) \\( x^2+1 \\) (c) \\( x+2 \\) (d) None

Answer: A`);

  assert.equal(result.questions.length, 1);
  assert.equal(result.questions[0].options[0], "\\( (x+1)^2 \\)");
  assert.equal(result.questions[0].correctIndex, 0);
});

test("preserves grouped fraction denominators during LaTeX normalization", async () => {
  const result = await parseText(`1. \\( \\int_{0}^{\\pi} \\frac{\\cos x}{(2 + \\sin x)(1 + \\sin x)} \\) dx equals
(a) \\log \\( \\frac{2}{3} \\) (b) \\log \\( \\frac{3}{2} \\) (c) \\log \\( \\frac{3}{4} \\) (d) \\log \\( \\frac{4}{3} \\)

Answer: B`);

  assert.equal(
    result.questions[0].prompt,
    "\\( \\int_{0}^{\\pi} \\frac{\\cos x}{(2 + \\sin x)(1 + \\sin x)} \\) dx equals",
  );
  assert.equal(result.questions[0].options[1], "\\( \\log \\frac{3}{2} \\)");
});

test("wraps mixed delimited option math as one renderable LaTeX segment", async () => {
  const result = await parseText(`1. Choose the matching value.
(a) \\( \\frac{1}{3} \\) \\tan ^{-1} \\( \\frac{1}{3} \\)
(b) \\sqrt{3} \\tan ^{-1} \\( \\sqrt{3} \\)
(c) \\( \\frac{\\pi}{12} \\) + \\log (2 \\sqrt{2})
(d) None of these

Answer: B`);

  assert.deepEqual(result.questions[0].options, [
    "\\( \\frac{1}{3} \\tan^{-1} \\frac{1}{3} \\)",
    "\\( \\sqrt{3} \\tan^{-1} \\sqrt{3} \\)",
    "\\( \\frac{\\pi}{12} + \\log (2 \\sqrt{2}) \\)",
    "None of these",
  ]);
});

test("preserves integral symbol and parses correct option wording", async () => {
  const result = await parseText(`1) Calculate ∫₀¹ x² dx
(A) 1/2
(B) 1/3
(C) 2/3
(D) 1

Correct option: B`);

  assert.match(result.questions[0].prompt, /\\int₀¹ x²/);
  assert.equal(result.questions[0].correctIndex, 1);
});

test("keeps continuation lines with their option", async () => {
  const result = await parseText(`1. Which is true?
A. Statement one
continues here
B. Statement two
C. Statement three
D. Statement four

Answer: A`);

  assert.match(result.questions[0].options[0], /continues here/);
  assert.equal(result.questions[0].options[1], "Statement two");
});

test("parses answer key table rows", async () => {
  const result = await parseText(`1. First?
A. a
B. b
C. c
D. d

2. Second?
A. a
B. b
C. c
D. d

3. Third?
A. a
B. b
C. c
D. d

4. Fourth?
A. a
B. b
C. c
D. d

Answer key table:
Q.No. 1 2 3 4
Ans   A C D B`);

  assert.deepEqual(result.questions.map((question) => question.correctIndex), [0, 2, 3, 1]);
});

test("repairs collapsed Mathematics-3 matrix equations into LaTeX matrices", () => {
  assert.equal(
    repairCollapsedMatrixNotation(String.raw`If \( A = 13 - 25 \) , then \( adj(A) \) is`),
    String.raw`If \( A = \begin{bmatrix}1 & 2 \\ 3 & -5\end{bmatrix} \) , then \( adj(A) \) is`,
  );
  assert.equal(
    repairCollapsedMatrixNotation(String.raw`If \( 124 - \lambda23 152 \) is singular`),
    String.raw`If \( \begin{bmatrix}1 & -3 & 2 \\ 2 & \lambda & 5 \\ 4 & 2 & 1\end{bmatrix} \) is singular`,
  );
  assert.equal(
    repairCollapsedMatrixNotation(String.raw`Consider \( M = 323 114 k00 \)`),
    String.raw`Consider \( M = \begin{bmatrix}3 & 4 & 0 \\ 2 & 1 & 0 \\ 3 & 1 & k\end{bmatrix} \)`,
  );
  assert.equal(
    repairCollapsedMatrixNotation(String.raw`Statement 2: \( k 0 \)`),
    String.raw`Statement 2: \( k \ne 0 \)`,
  );
  assert.equal(
    repairCollapsedMatrixNotation(String.raw`\( A\alpha = - csoisn\alpha\alpha csoins\alpha\alpha \)`),
    String.raw`\( A_{\alpha}=\begin{bmatrix}\cos\alpha & \sin\alpha \\ -\sin\alpha & \cos\alpha\end{bmatrix} \)`,
  );
});

test("converts Mathematics-2-2 PDF matrix and HM fractions into renderable LaTeX", async (context) => {
  const fixture = firstExistingFixture([
    new URL("../../questions/Mathematics-2-2.pdf", import.meta.url),
  ]);
  if (!fixture) {
    context.skip("local Mathematics-2-2 PDF fixture is not available");
    return;
  }

  const result = await parsePaperDeterministicV2({
    fileName: "Mathematics-2-2.pdf",
    buffer: fs.readFileSync(fixture),
    mimeType: "application/pdf",
  });

  const matrixQuestion = result.questions.find((question) =>
    /type of matrix/i.test(question.prompt || ""),
  );
  const hmQuestion = result.questions.find((question) =>
    /HM between/i.test(question.prompt || ""),
  );
  assert.ok(matrixQuestion, "matrix type question should parse");
  assert.ok(hmQuestion, "HM question should parse");

  assert.match(
    matrixQuestion.prompt,
    /\\begin\{bmatrix\}\\cos\\theta & \\sin\\theta \\\\ -\\sin\\theta & \\cos\\theta\\end\{bmatrix\}/,
  );
  assert.match(hmQuestion.prompt, /\\frac\{a\}\{1-ab\}/);
  assert.match(hmQuestion.prompt, /\\frac\{a\}\{1\+ab\}/);
  assert.match(hmQuestion.options[0], /a\^\{2\}b\^\{2\}/);
  assert.match(hmQuestion.options[1], /a\^\{2\}b\^\{2\}/);
  assert.doesNotMatch(hmQuestion.options.join(" "), /\^2\^2/);
});

test("converts semicolon bracket matrices and PDF inverse collapses into LaTeX", () => {
  assert.equal(
    repairCollapsedMatrixNotation("A = [1 3; 2 1]"),
    String.raw`A = \begin{bmatrix}1 & 3 \\ 2 & 1\end{bmatrix}`,
  );
  assert.equal(
    repairCollapsedMatrixNotation("[-2 -1; 3 / 2 1 / 2]"),
    String.raw`\begin{bmatrix}-2 & -1 \\ \frac{3}{2} & \frac{1}{2}\end{bmatrix}`,
  );
  assert.equal(
    repairCollapsedMatrixNotation(String.raw`\( 04 44 \)`),
    String.raw`\(\begin{bmatrix}0 & 4 \\ 4 & 4\end{bmatrix}\)`,
  );
  assert.equal(
    repairCollapsedMatrixNotation(String.raw`\( 04 1220 \)`),
    String.raw`\(\begin{bmatrix}0 & 4 \\ 12 & 20\end{bmatrix}\)`,
  );
  assert.equal(
    repairCollapsedMatrixNotation(String.raw`- 18 \begin{bmatrix}2 & 3 \\ 4 & 2\end{bmatrix}`),
    String.raw`-\frac{1}{8}\begin{bmatrix}2 & 3 \\ 4 & 2\end{bmatrix}`,
  );
  assert.equal(
    repairCollapsedMatrixNotation("The inverse matrix of is -4 2"),
    String.raw`The inverse matrix of \begin{bmatrix}2 & -3 \\ -4 & 2\end{bmatrix} is`,
  );
  assert.equal(
    repairCollapsedMatrixNotation(String.raw`\( -\frac{1}{8}^2 [3; 4 2] \)`),
    String.raw`\( -\frac{1}{8}\begin{bmatrix}2 & 3 \\ 4 & 2\end{bmatrix} \)`,
  );
  assert.equal(
    repairCollapsedMatrixNotation(String.raw`\cot \begin{bmatrix}B & cotC \\ 2 & 2\end{bmatrix}`),
    String.raw`\cot\frac{B}{2}\cot\frac{C}{2}`,
  );
  assert.equal(
    repairCollapsedMatrixNotation(String.raw`\( 123!!! 234!!!534!!! \)`),
    String.raw`\( \begin{bmatrix}1! & 2! & 3! \\ 2! & 3! & 4! \\ 5! & 3! & 4!\end{bmatrix} \)`,
  );
  // Semicolon matrices outside existing math delimiters must still be repaired.
  assert.equal(
    repairCollapsedMatrixNotation(String.raw`\( \frac{1}{8} \) [2 3; 4 2]`),
    String.raw`\( \frac{1}{8} \) \begin{bmatrix}2 & 3 \\ 4 & 2\end{bmatrix}`,
  );
  assert.equal(
    repairCollapsedMatrixNotation(String.raw`\begin{bmatrix}5 & 7 \\ 1 & 6 \\ 2 & 2\end{bmatrix}° ″ ″″`),
    String.raw`57^\circ 16' 22''`,
  );
  assert.equal(
    repairCollapsedMatrixNotation(String.raw`\( \begin{bmatrix}5 & 7 \\ 1 & 6 \\ 2 & 2\end{bmatrix} \)° ″ ″″`),
    String.raw`57^\circ 16' 22''`,
  );
  // PDF DMS options start as plain digit triples and must not stay as matrices.
  assert.equal(
    repairCollapsedMatrixNotation("57 16 22° ″ ″″"),
    String.raw`57^\circ 16' 22''`,
  );
  assert.equal(
    repairCollapsedMatrixNotation(String.raw`\frac{\cot A2cotB2 - 1}{\cot A2cotB2}`),
    String.raw`\frac{\cot\frac{A}{2}\cot\frac{B}{2}-1}{\cot\frac{A}{2}\cot\frac{B}{2}}`,
  );
});

test("wraps bare frac/sqrt in prose without nesting or breaking lim parentheses", async () => {
  const hm = await parseText(`1. The HM between \\frac{a}{1- ab} and \\frac{a}{1+ ab} is
(a) a (b) b (c) c (d) d
Answer: A`);
  assert.match(hm.questions[0].prompt, /\\frac\{a\}\{1-ab\}/);
  assert.match(hm.questions[0].prompt, /\\\(/);
  assert.doesNotMatch(hm.questions[0].prompt, /\\\(\s*\\\(/);

  const nested = await parseText(`1. Domain of f(x) = \\frac{1}{\\sqrt{x}} is
(a) 1 (b) 2 (c) 3 (d) 4
Answer: A`);
  assert.equal(nested.questions[0].prompt, "Domain of f(x) = \\( \\frac{1}{\\sqrt{x}} \\) is");

  const derivative = await parseText(`1. If \\( \\frac{d y^2}{dx^2} \\) = 0, choose the correct option.
(a) 1 (b) 2 (c) 3 (d) 4
Answer: A`);
  assert.match(derivative.questions[0].prompt, /\\frac\{d\^\{2\}y\}\{dx\^\{2\}\}/);

  const greekSquares = await parseText(`1. Then 2\\alpha \\beta^2 ^2 is
(a) 1 (b) 2 (c) 3 (d) 4
Answer: A`);
  assert.match(greekSquares.questions[0].prompt, /2\\alpha\^\{2\}\\beta\^\{2\}/);
});

test("preserves requested Unicode math symbols", async () => {
  const symbols = "∫ √ ≤ ≥ ≠ ± × ÷ π θ α β γ Δ Ω μ λ ∑ ∞ ∈ ∉ ∠ ∪ ∩ ⊂ ⊆ ∅ ⊥ ⇔";
  const result = await parseText(`1. Symbols: ${symbols}
A. ${symbols}
B. two
C. three
D. four

Answer: A`);

  assert.match(result.questions[0].prompt, /\\int √ \\le \\ge \\ne \\pm \\times \\div \\pi \\theta \\alpha \\beta \\gamma \\Delta \\Omega \\mu \\lambda \\sum \\infty \\in \\notin \\angle \\cup \\cap \\subset \\subseteq \\emptyset \\perp \\Leftrightarrow/);
  assert.match(result.questions[0].options[0], /\\sum \\infty .*\\perp \\Leftrightarrow/);
});

test("repairs private-use Symbol font glyphs before segmentation", async () => {
  assert.equal(
    repairPrivateUseMathGlyphs(" +  =  and A  B  C, a  b, , , , pq, a"),
    "α + β = π and A ∩ B ⊂ C, a ⊥ b, ϕ, μ, ∑, p⇔q, \\hat{a}",
  );

  const result = await parseText(`Q.1Find  and  when A  B =  and a  b.
a) = 1
b) = 2
c) = 3
d)p  q
Ans.D`);

  assert.equal(result.questions.length, 1);
  assert.match(result.questions[0].prompt, /\\alpha and \\beta/);
  assert.match(result.questions[0].prompt, /A \\cap B = \\phi and a \\perp b/);
  assert.equal(result.questions[0].options[2], "\\( \\mu = 3 \\)");
  assert.equal(result.questions[0].options[3], "\\( p \\Leftrightarrow q \\)");
});

test("separates LaTeX commands from adjacent variables after symbol repair", async () => {
  const result = await parseText(`1. In ΔABC, evaluate ∫e^x dx + ∑tan x + μy + a×b + A∩C + ∠A + 30^{°} + πloge2.
A. ωn
B. ω2n
C. λj
D. 30^\\circ

Answer: A`);

  const question = result.questions[0];
  assert.match(question.prompt, /\\Delta ABC/);
  assert.match(question.prompt, /\\int e\^x/);
  assert.match(question.prompt, /\\sum \\tan/);
  assert.match(question.prompt, /\\mu y/);
  assert.match(question.prompt, /a\\times b/);
  assert.match(question.prompt, /A\\cap C/);
  assert.match(question.prompt, /\\angle A/);
  assert.match(question.prompt, /30\^\\circ/);
  assert.match(question.prompt, /\\pi \\log_e 2/);
  assert.equal(question.options[0], "\\( \\omega^{n} \\)");
  assert.equal(question.options[1], "\\( \\omega^{2n} \\)");
  assert.equal(question.options[2], "\\( \\lambda j \\)");
  assert.equal(question.options[3], "\\( 30^\\circ \\)");
});

test("moves stacked PDF limit annotations back onto lim", async () => {
  const result = await parseText(`1. lim(1- ax)^{1/x} is equal to
x→0
A. 1
B. e^{-a}
C. e^a
D. 0

2. lim(\\frac{x + a}{x + b})^x is equal to
x→∞
A. 1
B. e^{b-a}
C. e^{a-b}
D. e^b`);

  assert.equal(result.questions[0].prompt, "\\lim_{x\\to0}(1- ax)^{1/x} is equal to");
  assert.equal(result.questions[1].prompt, "\\lim_{x\\to\\infty}(\\frac{x + a}{x + b})^x is equal to");
});

test("repairs ellipse line equations and vector products from PDF layout collapse", async () => {
  const result = await parseText(`1. Find the area of smaller region bounded by the ellipse \\frac{x^2}{16}^y + \\frac{2}{9} =1 and the straight line
\\frac{x}{4}^y + =1.
√{3}
(a) (π - 2) sq units (b) 3(π - 2) sq units (c) 3π sq units (d) None of these
Answer: b

2. If in a right angle ΔABC, the hypotenuse = AB = p, then the value of
AB⋅AC + BC BA⋅ + CB CA⋅ is equal to
(a) 2p^2 (b) p^2 (c) \\frac{p^2}{2} (d) p
Answer: b`);

  assert.equal(result.questions.length, 2);
  assert.match(result.questions[0].prompt, /\\frac\{x\^\{2\}\}\{16\}/);
  assert.match(result.questions[0].prompt, /\\frac\{y\^\{2\}\}\{9\}/);
  assert.match(result.questions[0].prompt, /\\frac\{x\}\{4\}/);
  assert.match(result.questions[0].prompt, /\\frac\{y\}\{\\sqrt\{3\}\}/);
  assert.doesNotMatch(result.questions[0].prompt, /\^y|\\frac\{2\}\{9\}/);
  // Ellipse and line equations should each be one inline math island, not stacked fracs.
  assert.match(
    result.questions[0].prompt,
    /\\\(\s*\\frac\{x\^\{2\}\}\{16\}\s*\+\s*\\frac\{y\^\{2\}\}\{9\}\s*=\s*1\s*\\\)/,
  );
  assert.match(
    result.questions[0].prompt,
    /\\\(\s*\\frac\{x\}\{4\}\s*\+\s*\\frac\{y\}\{\\sqrt\{3\}\}\s*=\s*1\s*\\\)/,
  );
  assert.doesNotMatch(result.questions[0].prompt, /\\\)\s*\+\s*\\\(/);
  assert.match(result.questions[0].options[0], /sq units/);
  assert.doesNotMatch(result.questions[0].options[0], /\\\([\s\S]*sq units[\s\S]*\\\)/);
  assert.match(result.questions[1].prompt, /\\vec\{AB\}\\cdot\s*\\vec\{AC\}/);
  assert.match(result.questions[1].prompt, /\\vec\{BC\}\\cdot\s*\\vec\{BA\}/);
  assert.match(result.questions[1].prompt, /\\vec\{CB\}\\cdot\s*\\vec\{CA\}/);
});

test("repairs Mathematics-5 style PDF prose, limits, integrals, and coordinates", async () => {
  const result = await parseText(`1. What is the value of ∫\\frac{dx}{sin^2 xcos^2 x} ?
(a) tan x + cot x +C (b) tan x - cot x + C
(c) (tan x + cot x)^2 + C (d) (tan x - cot x)^2 +C
Answer: b

2. If any ΔABC, a = 39$,$b =12 and cos C = -\\frac{5}{13} , then the radius of circumcircle (R) is
(a) 195 (b) 8 (c) \\frac{195}{8} (d) None of these
Answer: c

3. What is the value of lim{x⋅sin(\\frac{2}{x})}?
^{x→∞} { }
(a) 2 (b) 1 (c) \\frac{1}{2} (d) ∞
Answer: a`);

  assert.equal(result.questions.length, 3);
  assert.match(result.questions[0].prompt, /\\int\s+\\frac\{dx\}\{\\sin\^2 x\s*\\cos\^2 x\}/);
  assert.doesNotMatch(result.questions[0].prompt, /xcos|\\int\s*\\\(/);
  assert.match(result.questions[1].prompt, /a = 39,\s*b =12/);
  assert.doesNotMatch(result.questions[1].prompt, /\$\s*,\s*\$|39\$/);
  assert.match(result.questions[2].prompt, /\\lim_\{x\\to\\infty\}/);
  assert.match(result.questions[2].prompt, /x\\cdot\s*\\sin/);
  assert.doesNotMatch(result.questions[2].prompt, /lim\{|\^\s*\{?\s*x\\to/);
});

test("does not split false question starts from decimals ratios dates and ranges", async () => {
  const result = await parseText(`1.5 kg is the mass in this instruction.
2 : 3 is only a ratio.
2024
10-20 is a range.

1. Which line is the actual question?
A. first
B. second
C. third
D. fourth

Answer: A`);

  assert.equal(result.questions.length, 1);
  assert.equal(result.questions[0].prompt, "Which line is the actual question?");
});

test("does not treat prose labels and name initials as options", async () => {
  const result = await parseText(`1. Read the passage.
Vitamin A. is important in normal prose.
Statement B. follows from the passage.
A. P. J. Abdul Kalam is a name, not an option label here.
A. First option
B. Second option
C. Third option
D. Fourth option

Answer: B`);

  assert.equal(result.questions.length, 1);
  assert.equal(result.questions[0].prompt, [
    "Read the passage.",
    "Vitamin A. is important in normal prose.",
    "Statement B. follows from the passage.",
    "A. P. J. Abdul Kalam is a name, not an option label here.",
  ].join("\n"));
  assert.deepEqual(result.questions[0].options, ["First option", "Second option", "Third option", "Fourth option"]);
  assert.equal(result.questions[0].correctIndex, 1);
});

test("parses compact question option and answer markers", async () => {
  const result = await parseText(`Q.1The ship waited till the storm _____ before sailing out to sea.
a)Evaporated
b)Consolidated
c)Abated
d)Normalised
Ans.C

Q.2(a) I courteously asked him (b) where he was going (c) whether you had called. (d) No error
a)I courteously asked him
b)where he was going
c)whether you had called.
d)No error
Ans.B`);

  assert.equal(result.questions.length, 2);
  assert.equal(result.questions[0].prompt, "The ship waited till the storm _____ before sailing out to sea.");
  assert.deepEqual(result.questions[0].options, ["Evaporated", "Consolidated", "Abated", "Normalised"]);
  assert.equal(result.questions[0].correctIndex, 2);
  assert.match(result.questions[1].prompt, /^\(a\) I courteously asked him/);
  assert.deepEqual(result.questions[1].options, [
    "I courteously asked him",
    "where he was going",
    "whether you had called.",
    "No error",
  ]);
  assert.equal(result.questions[1].correctIndex, 1);
});

test("prefers lowercase parenthesized inline options over set notation", async () => {
  const result = await parseText(`1. Which one of the following is correct?
(a) A ∪ (B - C) = A ∩ (B ∩ C) (b) A - (B ∪ C) = (A ∩ B) ∩ C'
(c) A - (B ∩ C) = (A ∩ B) ∩ C (d) A - (B ∩ C) = (A ∩ B) ∩ C
Answer: b
Directions (Q. Nos. 2 and 3) If x = (a + 1)^6 and y = (a - 1)^6, then

2. The number of terms in x - y is
(a) 1 (b) 2 (c) 3 (d) 4
Answer: c`);

  assert.equal(result.questions.length, 2);
  assert.deepEqual(result.questions[0].options, [
    "\\( A \\cup (B - C) = A \\cap (B \\cap C) \\)",
    "\\( A - (B \\cup C) = (A \\cap B) \\cap C' \\)",
    "\\( A - (B \\cap C) = (A \\cap B) \\cap C \\)",
    "\\( A - (B \\cap C) = (A \\cap B) \\cap C \\)",
  ]);
  assert.equal(result.questions[0].correctIndex, 1);
  assert.equal(result.questions[1].prompt, "The number of terms in x - y is");
});

test("repairs common PDF math glyph substitutions from encoded fonts", () => {
  assert.equal(
    repairPdfMathGlyphs("The locus of z satisfying the inequality Log1/3 Ξ z + 1Ξ> log1/3 Ξ z - 1Ξ"),
    "The locus of z satisfying the inequality \\( \\log_{1/3}|z + 1| > \\log_{1/3}|z - 1| \\)",
  );
  assert.equal(repairPdfMathGlyphs("|a|2 > b"), "|a|^2 > b");
  assert.equal(repairPdfMathGlyphs("R (z) < O"), "R (z) < 0");
  assert.equal(
    repairPdfMathGlyphs("The equation z \\bar{z} + a\\bar{z} + \\bar{a}z + b = 0, b∈ R represents a circle, if"),
    "The equation \\( z\\bar{z} + a\\bar{z} + \\bar{a}z + b = 0 \\), b∈ R represents a circle, if",
  );
});

test("parses PDF-glued math option markers", async () => {
  const result = await parseText(`1. The equation is true when?
(a) |a|^2 > b (b)|a|^2 < b (c)|a|^2 = b (d) None of these

Answer: A`);

  assert.deepEqual(result.questions[0].options, [
    "\\( |a|^2 > b \\)",
    "\\( |a|^2 < b \\)",
    "\\( |a|^2 = b \\)",
    "None of these",
  ]);
  assert.equal(result.questions[0].correctIndex, 0);
});

test("keeps numbered statements inside high-numbered PDF questions", async () => {
  const prelude = Array.from({length: 8}, (_, index) => `${index + 1}. Warm up question?
(a) A (b) B (c) C (d) D
Answer: A`).join("\n\n");
  const result = await parseText(`${prelude}

9. Let A and B be two matrices.
1. AB is singular. 2. AB is non-singular.
3. A^{-1} B is singular. 4. A B is non-singular.
Which of the above is/are correct?
(a) 1 and 3 (b) 2 and 4 (c) Only 1 (d) None of these
Answer: A

10. Consider the following statement.
1. A - (B - C) = (A - B) ∪ C
2. A - (B ∪ C) = (A - B) - C
(a) Only 1 (b) Only 2 (c) Both 1 and 2 (d) None of these
Answer: B`);

  assert.equal(result.questions.length, 10);
  assert.match(result.questions[8].prompt, /1\. AB is singular/);
  assert.deepEqual(result.questions[8].options, ["1 and 3", "2 and 4", "Only 1", "None of these"]);
  assert.match(result.questions[9].prompt, /A - \(B - C\)/);
  assert.deepEqual(result.questions[9].options, ["Only 1", "Only 2", "Both 1 and 2", "None of these"]);
});

test("recovers inline PDF option labels by position when labels decode incorrectly", async () => {
  const result = await parseText(`1. If x = cos t, y = sin t, then evaluate.
(a) y^{-3} (d) y^3 (c) -y^{-3} (d) -y^3
Answer: C

2. If (log_3 x)^2 + log_3 x < 2, then which one of the following is correct?
(a) 0 < x < \\frac{1}{9} (b) \\frac{1}{9} < x < 3 (c) 3 < x < 8 (a) \\frac{1}{9} ≤ x < 3
Answer: B`);

  assert.deepEqual(result.questions[0].options, [
    "\\( y^{-3} \\)",
    "\\( y^3 \\)",
    "\\( -y^{-3} \\)",
    "\\( -y^3 \\)",
  ]);
  assert.deepEqual(result.questions[1].options, [
    "\\( 0 < x < \\frac{1}{9} \\)",
    "\\( \\frac{1}{9} < x < 3 \\)",
    "3 < x < 8",
    "\\( \\frac{1}{9} \\le x < 3 \\)",
  ]);
});

test("extracts math symbols from the local CUET PDF font encodings when fixture is available", async (context) => {
  const fixture = new URL("../blog-images/paper-source-1782073876873-03b7b033.pdf", import.meta.url);
  if (!fs.existsSync(fixture)) {
    context.skip("local uploaded PDF fixture is not available");
    return;
  }
  const ir = await pdfToIr(fs.readFileSync(fixture), {fileName: "paper-source-1782073876873-03b7b033.pdf"});
  const pageOneText = ir.blocks
    .filter((block) => block.page === 1)
    .map((block) => block.text)
    .join("\n");

  assert.match(pageOneText, /\\\( z\\bar\{z\} \+ a\\bar\{z\} \+ \\bar\{a\}z \+ b = 0 \\\)/);
  assert.match(pageOneText, /\|a\|\^2 > b/);
  assert.match(pageOneText, /\\\( \\log_\{1\/3\}\|z \+ 1\| > \\log_\{1\/3\}\|z - 1\| \\\)/);
  assert.match(pageOneText, /c, d ∈ R \|cz_1 \+ dz_2\|\^2 \+ \|dz_1 - cz_2\|\^2/);
  assert.match(pageOneText, /f\(x\) = e\^{-\|x\|}/);
});

test("segments the local Mathematics-2-2 PDF through question 120 when fixture is available", async (context) => {
  const fixture = firstExistingFixture([
    new URL("../../questions/Mathematics-2-2.pdf", import.meta.url),
    new URL("../../Mathematics-2-2.pdf", import.meta.url),
  ]);
  if (!fixture) {
    context.skip("local Mathematics-2-2 PDF fixture is not available");
    return;
  }
  const result = await parsePaperDeterministicV2({
    fileName: "Mathematics-2-2.pdf",
    buffer: fs.readFileSync(fixture),
    mimeType: "application/pdf",
  });

  assert.equal(result.debug.questionBlockCount, 120);
  assert.equal(result.questions.length, 120);
  assert.ok(!result.warnings.includes("Question numbers are not strictly monotonic."));
  assert.deepEqual(result.questions[41].options, [
    "\\( \\frac{\\sqrt{3} +1}{2} \\)",
    "\\( \\frac{\\sqrt{3} + \\sqrt{2}}{4} \\)",
    "\\( \\frac{\\sqrt{3} + \\sqrt{2}}{4} \\)",
    "",
  ]);
  assert.deepEqual(result.questions[74].options, [
    String.raw`\( \begin{bmatrix}4 & 4 \\ 0 & 4\end{bmatrix} \)`,
    String.raw`\( \begin{bmatrix}0 & 4 \\ 4 & 4\end{bmatrix} \)`,
    String.raw`\( \begin{bmatrix}4 & -4 \\ 0 & 20\end{bmatrix} \)`,
    String.raw`\( \begin{bmatrix}4 & 12 \\ 0 & 20\end{bmatrix} \)`,
  ]);
  assert.match(result.questions[81].prompt, /1\. AB is singular/);
  assert.deepEqual(result.questions[81].options, ["1 and 3", "2 and 4", "Only 1", "None of these"]);
  assert.match(result.questions[82].prompt, /A - \(B - C\)/);
  assert.deepEqual(result.questions[86].options, [
    "\\( y^{-3} \\)",
    "\\( y^3 \\)",
    "\\( -y^{-3} \\)",
    "\\( -y^3 \\)",
  ]);
  assert.deepEqual(result.questions[95].options, [
    "\\( 0 < x < \\frac{1}{9} \\)",
    "\\( \\frac{1}{9} < x < 3 \\)",
    "3 < x < 8",
    "\\( \\frac{1}{9} \\le x < 3 \\)",
  ]);
  assert.equal(result.questions[119].prompt.startsWith("If X = {4, 5, 6}"), true);
});

test("segments compact DOCX markers from the local NDA paper fixture when available", async (context) => {
  const fixture = new URL("../../question_papers/NDA paper 6.docx", import.meta.url);
  if (!fs.existsSync(fixture)) {
    context.skip("local NDA paper 6 DOCX fixture is not available");
    return;
  }
  const result = await parsePaperDeterministicV2({
    fileName: "NDA paper 6.docx",
    buffer: fs.readFileSync(fixture),
    mimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  });

  assert.equal(result.debug.questionBlockCount, 150);
  assert.equal(result.questions.length, 150);
  assert.deepEqual(result.questions[0].options, [
    "As he had taken only a few sips",
    "there was still little water",
    "left in the glass",
    "No error",
  ]);
  assert.equal(result.questions[0].correctIndex, 1);
  assert.match(result.questions[90].prompt, /^\(a\) I courteously asked him/);
  assert.deepEqual(result.questions[90].options, [
    "I courteously asked him",
    "where he was going",
    "whether you had called.",
    "No error",
  ]);
});

test("converts local Mathematics-3 DOCX WMF equations to math text when available", async (context) => {
  const fixture = firstExistingFixture([
    new URL("../../question_papers/Mathematics-3.docx", import.meta.url),
    new URL("../../Mathematics-3.docx", import.meta.url),
  ]);
  if (!fixture) {
    context.skip("local Mathematics-3 DOCX fixture is not available");
    return;
  }
  if (!hasExecutable("wmf2svg")) {
    context.skip("wmf2svg is not available in this environment");
    return;
  }

  const result = await parsePaperDeterministicV2({
    fileName: "Mathematics-3.docx",
    buffer: fs.readFileSync(fixture),
    mimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  });

  assert.equal(result.questions.length, 120);
  assert.equal(result.confidence, 1);
  assert.doesNotMatch(result.questions[0].prompt, /\[\[image:/);
  assert.doesNotMatch(result.questions[4].prompt, /\[\[image:/);
  assert.doesNotMatch(result.questions[5].prompt, /\[\[image:/);
  assert.equal(result.questions[0].prompt, "Find the value of integral \\( \\int \\frac{x\\,\\mathrm{d}x}{a^{4} + x^{4}} \\)");
  assert.equal(result.questions[4].prompt, "Solve the given equation \\( \\tan\\theta + \\sec\\theta = \\sqrt{3} \\)");
  assert.equal(result.questions[5].prompt, "The inverse function \\( f^{-1} \\) exists only, if f is");
  assert.deepEqual(result.questions[4].options, [
    "\\( \\theta = 2n\\pi + \\pi/6 or 2n\\pi - \\pi/2 \\)",
    "\\( \\theta = 2n\\pi - \\pi/6 or 2n\\pi + \\pi/2 \\)",
    "\\( \\theta = n\\pi + \\pi/3 \\)",
    "None of these",
  ]);
  assert.match(result.questions[7].prompt, /\\begin\{bmatrix\}\\cos\\alpha & \\sin\\alpha \\\\ -\\sin\\alpha & \\cos\\alpha\\end\{bmatrix\}/);
  assert.match(result.questions[9].prompt, /A = \\begin\{bmatrix\}1 & 2 \\\\ 3 & -5\\end\{bmatrix\}/);
  assert.match(result.questions[9].options[0], /\\begin\{bmatrix\}5 & -2 \\\\ -3 & 1\\end\{bmatrix\}/);
  assert.match(result.questions[9].options[1], /\\begin\{bmatrix\}-5 & -2 \\\\ -3 & 1\\end\{bmatrix\}/);
  assert.match(result.questions[9].options[2], /\\begin\{bmatrix\}-5 & -2 \\\\ -3 & -1\\end\{bmatrix\}/);
  assert.match(result.questions[11].prompt, /\\begin\{bmatrix\}1 & -3 & 2 \\\\ 2 & \\lambda & 5 \\\\ 4 & 2 & 1\\end\{bmatrix\}/);
  assert.match(result.questions[74].prompt, /M = \\begin\{bmatrix\}3 & 4 & 0 \\\\ 2 & 1 & 0 \\\\ 3 & 1 & k\\end\{bmatrix\}/);
  assert.match(result.questions[74].prompt, /Statement 2: \\\( k \\ne 0 \\\)/);
});

test("converts local math.docx radical equations to renderable LaTeX when available", async (context) => {
  const fixture = new URL("../../questions/math.docx", import.meta.url);
  if (!fs.existsSync(fixture)) {
    context.skip("local math.docx fixture is not available");
    return;
  }
  if (!hasExecutable("wmf2svg")) {
    context.skip("wmf2svg is not available in this environment");
    return;
  }

  const result = await parsePaperDeterministicV2({
    fileName: "math.docx",
    buffer: fs.readFileSync(fixture),
    mimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  });

  assert.match(
    result.questions[4].prompt,
    /\\frac\{\\sqrt\{\\cos x\}\}\{\\sqrt\{\\cos x\} \+ \\sqrt\{\\sin x\}\}/,
  );
  assert.match(result.questions[7].prompt, /\\pi/);
  assert.deepEqual(result.questions[8].options, [
    "\\( (\\frac{1}{3}) \\tan^{-1} (\\frac{1}{\\sqrt{3}}) \\)",
    "\\( (\\frac{2}{\\sqrt{3}}) \\tan^{-1} (\\frac{1}{\\sqrt{3}}) \\)",
    "\\( \\sqrt{3} \\tan^{-1} \\sqrt{3} \\)",
    "\\( 2 \\sqrt{3} \\tan^{-1} \\sqrt{3} \\)",
  ]);
});

test("recovers symbol font math from the local Mathematics-5 PDF when fixture is available", async (context) => {
  const fixture = firstExistingFixture([
    new URL("../../questions/Mathematics-5.pdf", import.meta.url),
    new URL("../../Mathematics-5.pdf", import.meta.url),
  ]);
  if (!fixture) {
    context.skip("local Mathematics-5 PDF fixture is not available");
    return;
  }
  const result = await parsePaperDeterministicV2({
    fileName: "Mathematics-5.pdf",
    buffer: fs.readFileSync(fixture),
    mimeType: "application/pdf",
  });

  assert.equal(result.questions.length, 120);
  assert.equal(result.questions[2].options[2], "\\( \\pm i \\)");
  assert.match(result.questions[4].prompt, /log\s*(?:\\\(\s*)?\\sqrt\{\\tan x\}/);
  assert.match(result.questions[11].options[2], /\\frac\{2\}\{\\sqrt\{3\}\}/);
  assert.match(result.questions[12].prompt, /\\ldots/);
  assert.match(result.questions[24].prompt, /\\gamma.*\\delta/);
  assert.equal(result.questions[29].options[1], "\\( S \\subset R \\)");
  assert.match(result.questions[39].prompt, /x\\cdot\s*\\sin/);
  assert.match(result.questions[59].prompt, /\(1- x\^2 \)\s*(?:\\\(\s*)?\\frac\{dy\}\{dx\}(?:\s*\\\))?\s*- xy =1/);
  assert.match(result.questions[59].options[2], /\\\(\s*\\sqrt\{1-\s*x\^2\}\s*\\\)/);
});

test("audits uploaded question papers for broken imported math symbols when requested", async (context) => {
  if (process.env.RUN_IMPORT_V2_FIXTURE_AUDIT !== "1") {
    context.skip("set RUN_IMPORT_V2_FIXTURE_AUDIT=1 to run the full uploaded-paper audit");
    return;
  }

  const fixtureDir = new URL("../../question_papers/", import.meta.url);
  if (!fs.existsSync(fixtureDir)) {
    context.skip("local question_papers fixtures are not available");
    return;
  }

  const files = fs.readdirSync(fixtureDir)
    .filter((file) => /\.(docx|pdf)$/i.test(file))
    .sort();
  const failures = [];
  const exportedFields = [];
  for (const file of files) {
    const buffer = fs.readFileSync(new URL(file, fixtureDir));
    const result = await parsePaperDeterministicV2({
      fileName: file,
      buffer,
      mimeType: file.toLowerCase().endsWith(".pdf")
        ? "application/pdf"
        : "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    });

    for (const [questionIndex, question] of (result.questions || []).entries()) {
      const fields = [
        {kind: "prompt", value: question.prompt || ""},
        ...(question.options || []).map((value, optionIndex) => ({kind: `opt${optionIndex + 1}`, value: String(value || "")})),
      ];
      for (const field of fields) {
        const label = `${file} Q${questionIndex + 1} ${field.kind}`;
        exportedFields.push({file, q: questionIndex + 1, kind: field.kind, value: field.value});
        auditImportedMathField(field.value, label, failures);
      }
    }
  }

  fs.writeFileSync("/tmp/import-v2-fields.json", JSON.stringify(exportedFields));
  assert.equal(failures.length, 0, failures.slice(0, 20).join("\n"));
});

test("walks a generated DOCX with paragraphs and a table", async () => {
  const buffer = await buildSimpleDocx();
  const result = await parsePaperDeterministicV2({
    fileName: "fixture.docx",
    buffer,
    mimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  });

  assert.equal(result.questions.length, 1);
  assert.equal(result.questions[0].prompt, "DOCX question?");
  assert.deepEqual(result.questions[0].options, ["One", "Two", "Three", "Four"]);
  assert.equal(result.questions[0].correctIndex, 1);
});

test("preserves embedded DOCX equation previews as inline images", async () => {
  const buffer = await buildImageDocx();
  const result = await parsePaperDeterministicV2({
    fileName: "image-fixture.docx",
    buffer,
    mimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  });

  assert.equal(result.questions.length, 1);
  assert.match(result.questions[0].prompt, /\[\[image:data:image\/png;base64,/);
  assert.deepEqual(result.questions[0].options, ["One", "Two", "Three", "Four"]);
});

test("normalizes embedded DOCX grayscale PNG previews to web-safe RGBA PNG", async () => {
  const buffer = await buildImageDocx({
    imageBase64: GRAYSCALE_16BIT_EQUATION_PNG,
  });
  const result = await parsePaperDeterministicV2({
    fileName: "grayscale-image-fixture.docx",
    buffer,
    mimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  });

  const match = result.questions[0].prompt.match(/\[\[image:data:image\/png;base64,([A-Za-z0-9+/=]+)\]\]/);
  assert.ok(match);
  const bytes = Buffer.from(match[1], "base64");
  assert.equal(bytes.readUInt32BE(16), 91);
  assert.equal(bytes.readUInt32BE(20), 34);
  assert.equal(bytes[24], 8, "PNG bit depth should be 8-bit for browser decoders");
  assert.equal(bytes[25], 6, "PNG color type should be RGBA for browser decoders");
});

test("preserves embedded DOCX SVG equation previews as image markers", async () => {
  const buffer = await buildSvgImageDocx();
  const result = await parsePaperDeterministicV2({
    fileName: "svg-image-fixture.docx",
    buffer,
    mimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  });

  assert.equal(result.questions.length, 1);
  assert.match(result.questions[0].prompt, /\[\[image:data:image\/svg\+xml;base64,/);
  const match = result.questions[0].prompt.match(/base64,([A-Za-z0-9+/=]+)\]\]/);
  assert.ok(match);
  assert.match(Buffer.from(match[1], "base64").toString("utf8"), /<svg\b/);
  assert.deepEqual(result.questions[0].options, ["One", "Two", "Three", "Four"]);
});

async function parseText(text) {
  return parsePaperDeterministicV2({
    fileName: "fixture.txt",
    buffer: Buffer.from(text, "utf8"),
    rawText: text,
    mimeType: "text/plain",
  });
}

function hasExecutable(name) {
  const paths = String(process.env.PATH || "").split(path.delimiter);
  return paths.some((directory) => {
    if (!directory) {
      return false;
    }
    try {
      fs.accessSync(path.join(directory, name), fs.constants.X_OK);
      return true;
    } catch {
      return false;
    }
  });
}

function firstExistingFixture(urls) {
  return urls.find((url) => fs.existsSync(url)) || null;
}

async function buildSimpleDocx() {
  const zip = new JSZip();
  zip.file("[Content_Types].xml", `<?xml version="1.0" encoding="UTF-8"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
</Types>`);
  zip.file("_rels/.rels", `<?xml version="1.0" encoding="UTF-8"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>
</Relationships>`);
  zip.file("word/document.xml", `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:body>
    <w:p><w:r><w:t>1. DOCX question?</w:t></w:r></w:p>
    <w:tbl>
      <w:tr><w:tc><w:p><w:r><w:t>A</w:t></w:r></w:p></w:tc><w:tc><w:p><w:r><w:t>One</w:t></w:r></w:p></w:tc><w:tc><w:p><w:r><w:t>B</w:t></w:r></w:p></w:tc><w:tc><w:p><w:r><w:t>Two</w:t></w:r></w:p></w:tc></w:tr>
      <w:tr><w:tc><w:p><w:r><w:t>C</w:t></w:r></w:p></w:tc><w:tc><w:p><w:r><w:t>Three</w:t></w:r></w:p></w:tc><w:tc><w:p><w:r><w:t>D</w:t></w:r></w:p></w:tc><w:tc><w:p><w:r><w:t>Four</w:t></w:r></w:p></w:tc></w:tr>
    </w:tbl>
    <w:p><w:r><w:t>Answer Key:</w:t></w:r></w:p>
    <w:p><w:r><w:t>1. B</w:t></w:r></w:p>
  </w:body>
</w:document>`);
  return zip.generateAsync({type: "nodebuffer"});
}

const GRAYSCALE_16BIT_EQUATION_PNG =
  "iVBORw0KGgoAAAANSUhEUgAAAFsAAAAiEAAAAABF4CYPAAAAIGNIUk0AAHomAACAhAAA+gAAAIDoAAB1MAAA6mAAADqYAAAXcJy6UTwAAAACYktHRP//FKsxzQAAAAd0SU1FB+oGGA8tCERLjXQAAAPGSURBVFjD1VhfSFNRGP+23bibc816UEYue2gGxgzyHyVCjYmOogJ9UWYZGb70MPBFktGLE0KiO29uuYoedBMZihs+RBGtvyQmm39GQdGfhW5oc2KtVnq3HmztLrfd5bkj+z2d7zvf+X6/e+493zn3cCIR+A/B/dcCtpxsvz+Rd2lpS8u22RILFArN5lCIZdmRiNHIhuj790UimSxRD47X1xsMrMr++PHUKbudDdkPHigUMWtgAMDpnJ6OCt+//8MHFmVLpTYbn48u2uU6cIBuv3xptxNEUVHUViqHhtAYMHSRGzE7W1VFt8+eVSimprDfXDzet29oDBlZku/e5efT7atX9+37/p3uQd0tWJQdqxwUxePF/N3dtbWXLl2/To/l89fWkMgiLOHFi66uaLuzkymaIEIhFDYWvu1nzyKRvXtLSlwu9t4cE1iQffgwm4JmZq5dW15uaysvTxmW7ifgdKb/CvvamSJujv3gJPK/fXviRCDg8cjlqcenuSRNpitXACjKYrl1y+8HeP7c4SBJjydx9GI2U74vb8K/SqBeT/drtSSZkyOVEkTqWoP1uxfeM5E0NFX1cLkAY2N+v1yu1RoMT59OT1+4oNGMjKQeaZ987aPbbcf+jFhejrUp6tWr3bsBAOh7bELZWROiVibZPL1AgGEAR46YTKOjc3MAAOfOlZXhONNIwVFRXL2GOIsggsFHj3S6vLyWFgCAT58KCgAAVlbu3aurSym7rhmamcgBYBgAoL29ubm4WK0GABAK0xgF1SupejUagLW1jo6onZs7N0dRPN7ly4cOMcx2OuQAEkl398mTSmVfH477fD5feqP+FhxOa2tNTV5eRcXx4wyhKEU/GTK/3SStJJ8/P3yYmTllA0ll22zBYPSEvPWQVLZS6XYXFm4uqfAGU8RO4AoyIrura8eOzf6uBs8zRSxBGOnEjQGEw729gcDp03v20Dt6elDSxj1E8M6dhYUzZ7Ky2MoIwAXQ63FcrW5sXKcYHjYav35ljwCAJEWixcXBQTZzcgEqK5uadu0SidijCIfpllz++PGTJ/HrBPEnAbgA5eVud2OjTpeMYhNJaSvGap2c1GrF4oMH6RHBIPPBgEG2w3H7tsVSWpqM4u+xfXtsNrOzJyYuXpyfXz/JRLFtGxoDBmA2e71qNZ/f3x+jQJtvmWx8vLJyva1SqVQbIygKTXZGNvfVVZJM1e92372LxpCRCwcME4vjP4p4OBzV1WgMGbq6bGiwWpNd4dhs8Zc/mwEnU9fyFOV0lpZu9Hu9ABIJavaf7vT38pIVXkwAAAAASUVORK5CYII=";

async function buildImageDocx({
  imageBase64 = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
} = {}) {
  const zip = new JSZip();
  zip.file("[Content_Types].xml", `<?xml version="1.0" encoding="UTF-8"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="xml" ContentType="application/xml"/>
  <Default Extension="png" ContentType="image/png"/>
  <Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
</Types>`);
  zip.file("_rels/.rels", `<?xml version="1.0" encoding="UTF-8"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>
</Relationships>`);
  zip.file("word/_rels/document.xml.rels", `<?xml version="1.0" encoding="UTF-8"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rIdImage1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image" Target="media/equation.png"/>
</Relationships>`);
  zip.file("word/media/equation.png", Buffer.from(imageBase64, "base64"));
  zip.file("word/document.xml", `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" xmlns:v="urn:schemas-microsoft-com:vml">
  <w:body>
    <w:p>
      <w:r><w:t>1. Image equation </w:t></w:r>
      <w:r><w:object><v:shape><v:imagedata r:id="rIdImage1"/></v:shape></w:object></w:r>
    </w:p>
    <w:p><w:r><w:t>A. One</w:t></w:r></w:p>
    <w:p><w:r><w:t>B. Two</w:t></w:r></w:p>
    <w:p><w:r><w:t>C. Three</w:t></w:r></w:p>
    <w:p><w:r><w:t>D. Four</w:t></w:r></w:p>
  </w:body>
</w:document>`);
  return zip.generateAsync({type: "nodebuffer"});
}

async function buildSvgImageDocx() {
  const zip = new JSZip();
  zip.file("[Content_Types].xml", `<?xml version="1.0" encoding="UTF-8"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="xml" ContentType="application/xml"/>
  <Default Extension="svg" ContentType="image/svg+xml"/>
  <Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
</Types>`);
  zip.file("_rels/.rels", `<?xml version="1.0" encoding="UTF-8"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>
</Relationships>`);
  zip.file("word/_rels/document.xml.rels", `<?xml version="1.0" encoding="UTF-8"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rIdSvg1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image" Target="media/equation.svg"/>
</Relationships>`);
  zip.file("word/media/equation.svg", `<svg xmlns="http://www.w3.org/2000/svg" width="80" height="28" viewBox="0 0 80 28"><text x="4" y="20" font-family="Arial" font-size="18">x + 1</text></svg>`);
  zip.file("word/document.xml", `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
  <w:body>
    <w:p>
      <w:r><w:t>1. SVG equation </w:t></w:r>
      <w:r><w:drawing><wp:inline xmlns:wp="http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing"><a:graphic xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main"><a:graphicData><pic:pic xmlns:pic="http://schemas.openxmlformats.org/drawingml/2006/picture"><pic:blipFill><a:blip r:embed="rIdSvg1"/></pic:blipFill></pic:pic></a:graphicData></a:graphic></wp:inline></w:drawing></w:r>
    </w:p>
    <w:p><w:r><w:t>A. One</w:t></w:r></w:p>
    <w:p><w:r><w:t>B. Two</w:t></w:r></w:p>
    <w:p><w:r><w:t>C. Three</w:t></w:r></w:p>
    <w:p><w:r><w:t>D. Four</w:t></w:r></w:p>
  </w:body>
</w:document>`);
  return zip.generateAsync({type: "nodebuffer"});
}

function auditImportedMathField(value, label, failures) {
  const text = String(value || "");
  if (/[\uE000-\uF8FF]|�|□|\(cid:\d+\)/.test(text)) {
    failures.push(`${label}: leaked private-use/replacement glyph`);
  }
  if (/\^\{°\}/.test(text)) {
    failures.push(`${label}: leaked non-renderable degree form`);
  }
  if (/\\(?:Delta[A-Z]|angle[A-Z]|sumtan|inte|times[A-Za-z]|cap[A-Z]|cup[A-Z]|lambda[A-Za-z]|mu[A-Za-z]|omega[A-Za-z0-9]|piloge)/.test(text)) {
    failures.push(`${label}: leaked fused LaTeX command: ${text.slice(0, 180)}`);
  }

  const knownCommands = new Set([
    "frac", "sqrt", "Gamma", "Delta", "Theta", "Lambda", "Xi", "Pi", "Sigma", "Upsilon", "Phi", "Psi", "Omega",
    "alpha", "beta", "gamma", "delta", "epsilon", "varepsilon", "theta", "lambda", "mu", "pi", "sigma", "phi", "varphi", "omega",
    "sin", "cos", "tan", "cot", "sec", "csc", "log", "ln", "det", "operatorname", "sum", "prod", "int", "oint", "lim",
    "times", "cdot", "div", "pm", "mp", "le", "leq", "ge", "geq", "ne", "neq", "approx", "equiv", "in", "notin",
    "forall", "exists", "angle", "cup", "cap", "subset", "subseteq", "emptyset", "varnothing", "perp", "parallel", "circ",
    "to", "rightarrow", "leftarrow", "Rightarrow", "Leftarrow", "Leftrightarrow", "leftrightarrow", "iff", "implies",
    "infty", "ldots", "cdots", "dots", "bar", "overline", "vec", "hat", "widehat", "tilde", "widetilde", "dot", "ddot",
    "left", "right", "displaystyle", "begin", "end", "quad", "qquad", "text", "mathrm", "mathbf", "mathit", "mathbb", "boldsymbol",
  ]);
  for (const match of text.matchAll(/\\([A-Za-z]+)/g)) {
    if (!knownCommands.has(match[1])) {
      failures.push(`${label}: unknown LaTeX command \\${match[1]} in ${text.slice(0, 180)}`);
    }
  }

  for (const match of text.matchAll(/\[\[image:(data:image\/(?:png|svg\+xml);base64,([A-Za-z0-9+/=]+))\]\]/g)) {
    const bytes = Buffer.from(match[2], "base64");
    const isPng = bytes.length >= 8 &&
      bytes[0] === 0x89 &&
      bytes[1] === 0x50 &&
      bytes[2] === 0x4E &&
      bytes[3] === 0x47;
    const isSvg = bytes.toString("utf8").includes("<svg");
    if (!isPng && !isSvg) {
      failures.push(`${label}: image marker payload is not PNG or SVG`);
    }
  }
}
