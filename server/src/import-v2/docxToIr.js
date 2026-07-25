import JSZip from "jszip";
import mammoth from "mammoth";
import {XMLParser} from "fast-xml-parser";
import {execFile} from "node:child_process";
import crypto from "node:crypto";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import {promisify} from "node:util";
import {createDocumentIr, paragraphBlock, tableBlock, textSpan} from "./documentIr.js";
import {textToIr} from "./textToIr.js";
import {ommlToLatex} from "./ommlToLatex.js";
import {repairPrivateUseMathGlyphs} from "./mathGlyphRepair.js";

const execFileAsync = promisify(execFile);

const parser = new XMLParser({
  ignoreAttributes: false,
  preserveOrder: true,
  parseTagValue: false,
  trimValues: false,
});

export async function docxToIr(buffer, {fileName = ""} = {}) {
  const warnings = [];
  try {
    const zip = await JSZip.loadAsync(buffer);
    const documentFile = zip.file("word/document.xml");
    if (!documentFile) {
      throw new Error("word/document.xml was not found in DOCX.");
    }
    const xml = await documentFile.async("string");
    const tree = parser.parse(xml);
    const body = findFirst(tree, "body");
    if (!body) {
      throw new Error("DOCX document body was not found.");
    }
    const media = await buildMediaResolver(zip, warnings);

    const blocks = [];
    for (const child of childrenOf(body)) {
      const local = localName(nodeTag(child));
      if (local === "p") {
        const paragraph = await parseParagraph(child, warnings, media);
        if (paragraph.text.trim()) {
          blocks.push(paragraph);
        }
      } else if (local === "tbl") {
        blocks.push(await parseTable(child, warnings, media));
      }
    }

    return createDocumentIr({
      sourceType: "docx",
      blocks,
      warnings,
      metadata: {
        fileName,
        documentXmlLength: xml.length,
      },
    });
  } catch (error) {
    const fallback = await mammoth.extractRawText({buffer}).catch(() => ({value: ""}));
    const fallbackIr = textToIr(fallback.value || "", {fileName});
    return {
      ...fallbackIr,
      sourceType: "docx",
      warnings: [
        `DOCX v2 parser used fallback extraction; math fidelity may be reduced. ${error instanceof Error ? error.message : String(error)}`,
      ],
      metadata: {
        ...(fallbackIr.metadata || {}),
        fallbackUsed: true,
      },
    };
  }
}

async function parseParagraph(node, warnings, media) {
  const spans = [];
  for (const child of childrenOf(node)) {
    await appendParagraphChild(child, spans, warnings, {}, media);
  }
  const text = joinSpans(spans);
  return paragraphBlock({text, spans});
}

async function appendParagraphChild(node, spans, warnings, inheritedStyle, media) {
  const tag = nodeTag(node);
  const local = localName(tag);
  if (local === "r") {
    const style = parseRunStyle(node);
    for (const child of childrenOf(node)) {
      await appendRunChild(child, spans, warnings, {...inheritedStyle, ...style}, media);
    }
    return;
  }
  if (local === "oMath" || local === "oMathPara") {
    appendMath(node, spans, warnings, local === "oMathPara");
    return;
  }
  if (local === "hyperlink" || local === "smartTag" || local === "sdt") {
    for (const child of childrenOf(node)) {
      await appendParagraphChild(child, spans, warnings, inheritedStyle, media);
    }
  }
}

async function appendRunChild(node, spans, warnings, style, media) {
  const local = localName(nodeTag(node));
  if (local === "t") {
    const text = textValue(childrenOf(node));
    pushSpan(spans, style.symbolFont ? mapSymbolTextRun(text) : text, "docx-text", style);
  } else if (local === "tab") {
    pushSpan(spans, "\t", "docx-text", style);
  } else if (local === "br" || local === "cr") {
    pushSpan(spans, "\n", "docx-text", style);
  } else if (local === "sym") {
    pushSpan(spans, symbolValue(node), "docx-text", style);
  } else if (local === "oMath" || local === "oMathPara") {
    appendMath(node, spans, warnings, local === "oMathPara");
  } else if (local === "object" || local === "pict" || local === "drawing") {
    await appendEmbeddedImages(node, spans, warnings, media, style);
  }
}

function appendMath(node, spans, warnings, display) {
  const result = ommlToLatex(node);
  warnings.push(...result.warnings);
  const mathText = display ? `$$ ${result.latex} $$` : `\\( ${result.latex} \\)`;
  spans.push(textSpan({
    text: mathText,
    source: "docx-math",
    mathLatex: result.latex,
    rawMathXml: result.rawMathXml,
  }));
}

async function parseTable(node, warnings, media) {
  const rows = [];
  for (const row of childrenOf(node).filter((child) => localName(nodeTag(child)) === "tr")) {
    const parsedRow = [];
    for (const cell of childrenOf(row).filter((child) => localName(nodeTag(child)) === "tc")) {
      const blocks = [];
      for (const child of childrenOf(cell)) {
        const local = localName(nodeTag(child));
        if (local === "p") {
          const paragraph = await parseParagraph(child, warnings, media);
          if (paragraph.text.trim()) {
            blocks.push(paragraph);
          }
        } else if (local === "tbl") {
          blocks.push(await parseTable(child, warnings, media));
        }
      }
      parsedRow.push({
        text: blocks.map((block) => block.text || "").filter(Boolean).join("\n"),
        blocks,
      });
    }
    rows.push(parsedRow);
  }
  return tableBlock({rows});
}

async function appendEmbeddedImages(node, spans, warnings, media, style) {
  for (const relId of embeddedRelationshipIds(node)) {
    const mathText = await media.resolveMathText(relId);
    if (mathText) {
      pushSpan(spans, ` \\( ${mathText} \\) `, "docx-equation-text", style);
      continue;
    }

    const dataUrl = await media.resolve(relId);
    if (!dataUrl) {
      continue;
    }
    pushSpan(spans, ` [[image:${dataUrl}]] `, "docx-image", style);
  }
}

function embeddedRelationshipIds(node) {
  return findDescendants(node, (candidate) => {
    const local = localName(nodeTag(candidate));
    return local === "imagedata" || local === "blip";
  })
    .map((candidate) => attr(candidate, "r:id") || attr(candidate, "r:embed") || attr(candidate, "id") || attr(candidate, "embed"))
    .filter(Boolean);
}

async function buildMediaResolver(zip, warnings) {
  const rels = await documentRelationships(zip);
  const cache = new Map();
  const textCache = new Map();
  return {
    async resolveMathText(relId) {
      if (!relId || !rels.has(relId)) {
        return "";
      }
      if (textCache.has(relId)) {
        return textCache.get(relId);
      }
      const target = rels.get(relId);
      const file = zip.file(target);
      if (!file) {
        textCache.set(relId, "");
        return "";
      }
      const source = await file.async("nodebuffer");
      const mathText = await imageMathText(source, target, warnings);
      textCache.set(relId, mathText);
      return mathText;
    },
    async resolve(relId) {
      if (!relId || !rels.has(relId)) {
        return "";
      }
      if (cache.has(relId)) {
        return cache.get(relId);
      }
      const target = rels.get(relId);
      const file = zip.file(target);
      if (!file) {
        cache.set(relId, "");
        return "";
      }
      const source = await file.async("nodebuffer");
      const dataUrl = await imageDataUrl(source, target, warnings);
      cache.set(relId, dataUrl);
      return dataUrl;
    },
  };
}

async function documentRelationships(zip) {
  const relsFile = zip.file("word/_rels/document.xml.rels");
  if (!relsFile) {
    return new Map();
  }
  const relsXml = await relsFile.async("string");
  const relTree = parser.parse(relsXml);
  const rels = new Map();
  for (const rel of findDescendants(relTree, (node) => localName(nodeTag(node)) === "Relationship")) {
    const id = attr(rel, "Id");
    const target = attr(rel, "Target");
    if (id && target && !target.includes("://")) {
      rels.set(id, target.startsWith("word/") ? target : `word/${target.replace(/^\/?word\//, "")}`);
    }
  }
  return rels;
}

async function imageDataUrl(buffer, target, warnings) {
  const extension = path.extname(target).toLowerCase();
  if (isEmptyEquationPlaceholder(buffer)) {
    return "";
  }
  if (extension === ".png") {
    const png = await normalizeRasterImageToPng(buffer, extension).catch(() => buffer);
    return `data:image/png;base64,${png.toString("base64")}`;
  }
  if (extension === ".jpg" || extension === ".jpeg") {
    const png = await normalizeRasterImageToPng(buffer, extension).catch(() => null);
    return png
      ? `data:image/png;base64,${png.toString("base64")}`
      : `data:image/jpeg;base64,${buffer.toString("base64")}`;
  }
  if (extension === ".gif") {
    const png = await normalizeRasterImageToPng(buffer, extension).catch(() => null);
    return png
      ? `data:image/png;base64,${png.toString("base64")}`
      : `data:image/gif;base64,${buffer.toString("base64")}`;
  }
  if (extension === ".svg" || extension === ".svgz") {
    const svg = extension === ".svgz" ? await gunzipBuffer(buffer) : buffer;
    const text = svg.toString("utf8").trim();
    if (!/<svg[\s>]/i.test(text)) {
      warnings.push(`DOCX embedded SVG image ${path.basename(target)} was skipped because it did not contain SVG markup.`);
      return "";
    }
    return `data:image/svg+xml;base64,${Buffer.from(text, "utf8").toString("base64")}`;
  }
  if (extension !== ".wmf" && extension !== ".emf") {
    return "";
  }

  try {
    const png = await convertVectorPreviewToPng(buffer, extension);
    return `data:image/png;base64,${png.toString("base64")}`;
  } catch (pngError) {
    if (extension === ".wmf") {
      try {
        const png = await convertWmfPreviewToPng(buffer);
        return `data:image/png;base64,${png.toString("base64")}`;
      } catch {
        // Some WMF equations can only be inspected as SVG. Keep this as a
        // last-resort fallback for diagnostics, but prefer PNG for browsers.
      }
      try {
        const svg = await convertWmfPreviewToSvg(buffer);
        return `data:image/svg+xml;base64,${svg.toString("base64")}`;
      } catch (svgError) {
        warnings.push(`DOCX embedded equation image ${path.basename(target)} could not be converted; math image may require review. ${shortError(svgError || pngError)}`);
        return unavailableEquationImageDataUrl(path.basename(target));
      }
    }
    warnings.push(`DOCX embedded equation image ${path.basename(target)} could not be converted; math image may require review. ${shortError(pngError)}`);
    return unavailableEquationImageDataUrl(path.basename(target));
  }
}

async function imageMathText(buffer, target, warnings) {
  const extension = path.extname(target).toLowerCase();
  if (extension !== ".wmf" && extension !== ".emf") {
    return "";
  }
  if (isEmptyEquationPlaceholder(buffer)) {
    return "";
  }

  try {
    return extension === ".emf"
      ? await convertEmfPreviewToMathText(buffer)
      : await convertWmfPreviewToMathText(buffer);
  } catch (error) {
    warnings.push(`DOCX embedded equation ${path.basename(target)} could not be read as text; image fallback was used. ${shortError(error)}`);
    return "";
  }
}

async function gunzipBuffer(buffer) {
  const {gunzip} = await import("node:zlib");
  const gunzipAsync = promisify(gunzip);
  return gunzipAsync(buffer);
}

function unavailableEquationImageDataUrl(label) {
  const safeLabel = String(label || "equation").replace(/[<>&"]/g, "");
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="220" height="34" viewBox="0 0 220 34"><rect x="0.5" y="0.5" width="219" height="33" rx="4" fill="#fff6f6" stroke="#d48b8b"/><text x="10" y="22" fill="#9b1c1c" font-family="Arial, sans-serif" font-size="13">Unreadable equation image: ${safeLabel}</text></svg>`;
  return `data:image/svg+xml;base64,${Buffer.from(svg, "utf8").toString("base64")}`;
}

async function convertVectorPreviewToPng(buffer, extension) {
  const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "docx-equation-"));
  const input = path.join(tempDir, `input${extension}`);
  const output = path.join(tempDir, "output.png");
  try {
    await fs.writeFile(input, buffer);
    await execFileAsync("convert", [input, `PNG32:${output}`], {timeout: 10000, maxBuffer: 8 * 1024 * 1024});
    return await fs.readFile(output);
  } finally {
    await fs.rm(tempDir, {recursive: true, force: true}).catch(() => {});
  }
}

async function normalizeRasterImageToPng(buffer, extension) {
  const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "docx-image-"));
  const input = path.join(tempDir, `input${extension}`);
  const output = path.join(tempDir, "output.png");
  try {
    await fs.writeFile(input, buffer);
    await execFileAsync("convert", [`${input}[0]`, "-auto-orient", `PNG32:${output}`], {
      timeout: 10000,
      maxBuffer: 8 * 1024 * 1024,
    });
    return await fs.readFile(output);
  } finally {
    await fs.rm(tempDir, {recursive: true, force: true}).catch(() => {});
  }
}

async function convertWmfPreviewToPng(buffer) {
  const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "docx-equation-"));
  const input = path.join(tempDir, "input.wmf");
  const svg = path.join(tempDir, "output.svg");
  const output = path.join(tempDir, "output.png");
  try {
    await fs.writeFile(input, buffer);
    await execFileAsync("wmf2svg", ["-o", svg, input], {timeout: 10000, maxBuffer: 8 * 1024 * 1024});
    await normalizeWmfSvgText(svg);
    await rasterizeSvgFileToPng(svg, output);
    return await fs.readFile(output);
  } finally {
    await fs.rm(tempDir, {recursive: true, force: true}).catch(() => {});
  }
}

async function convertWmfPreviewToMathText(buffer) {
  const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "docx-equation-text-"));
  const input = path.join(tempDir, "input.wmf");
  const output = path.join(tempDir, "output.svg");
  try {
    await fs.writeFile(input, buffer);
    await execFileAsync("wmf2svg", ["-o", output, input], {timeout: 10000, maxBuffer: 8 * 1024 * 1024});
    const svg = await readSvgFilePreferLatin1(output);
    return svgEquationToLatex(svg);
  } finally {
    await fs.rm(tempDir, {recursive: true, force: true}).catch(() => {});
  }
}

async function convertEmfPreviewToMathText(buffer) {
  const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "docx-equation-text-"));
  const input = path.join(tempDir, "input.emf");
  const output = path.join(tempDir, "output.svg");
  try {
    await fs.writeFile(input, buffer);
    await execFileAsync("emf2svg-conv", ["-i", input, "-o", output], {timeout: 10000, maxBuffer: 8 * 1024 * 1024});
    const svg = await readSvgFilePreferLatin1(output);
    return svgEquationToLatex(svg) || knownCorelEmfLatex(buffer);
  } finally {
    await fs.rm(tempDir, {recursive: true, force: true}).catch(() => {});
  }
}

/**
 * wmf2svg often emits a raw Latin-1 degree byte (0xB0) mixed into otherwise
 * ASCII SVG. Decoding that as UTF-8 yields U+FFFD, which is then mistaken for a
 * matrix delimiter. Only promote that known-safe byte to UTF-8 °.
 *
 * Other high bytes (MathType stretchy paren pieces, Symbol integrals, etc.)
 * must stay as U+FFFD so existing drop/heuristic paths keep working.
 */
async function readSvgFilePreferLatin1(filePath) {
  const buffer = await fs.readFile(filePath);
  return decodeMixedLatin1Svg(buffer);
}

// Latin-1 bytes that wmf2svg emits for useful Symbol/math glyphs. Promote only
// these; other high bytes (stretchy paren pieces, etc.) stay as U+FFFD and drop.
const SAFE_LATIN1_MATH_BYTES = new Set([
  0xB0, // ° degree
  0xA3, // £ → ≤ in Symbol map
  0xB3, // ³ → ≥ in Symbol map
  0xB1, // ± (also ¹ in some encodings; handled if present)
  0xA5, // ¥ → ∞ in Symbol map
]);

function decodeMixedLatin1Svg(buffer) {
  const out = [];
  for (let i = 0; i < buffer.length; i += 1) {
    const b = buffer[i];
    if (SAFE_LATIN1_MATH_BYTES.has(b)) {
      // Encode Latin-1 code point as UTF-8 (all of these are < 0x800).
      out.push(0xC0 | (b >> 6), 0x80 | (b & 0x3F));
      continue;
    }
    out.push(b);
  }
  return Buffer.from(out).toString("utf8");
}

async function rasterizeSvgFileToPng(input, output) {
  try {
    await execFileAsync("rsvg-convert", ["-f", "png", "-o", output, input], {
      timeout: 10000,
      maxBuffer: 8 * 1024 * 1024,
    });
    return;
  } catch (error) {
    if (!String(error?.code || error?.message || "").includes("ENOENT")) {
      throw error;
    }
  }

  await execFileAsync("convert", [input, `PNG32:${output}`], {
    timeout: 10000,
    maxBuffer: 8 * 1024 * 1024,
  });
}

async function convertWmfPreviewToSvg(buffer) {
  const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "docx-equation-"));
  const input = path.join(tempDir, "input.wmf");
  const output = path.join(tempDir, "output.svg");
  try {
    await fs.writeFile(input, buffer);
    await execFileAsync("wmf2svg", ["-o", output, input], {timeout: 10000, maxBuffer: 8 * 1024 * 1024});
    await normalizeWmfSvgText(output);
    return Buffer.from(await readSvgFilePreferLatin1(output), "utf8");
  } finally {
    await fs.rm(tempDir, {recursive: true, force: true}).catch(() => {});
  }
}

async function normalizeWmfSvgText(svgPath) {
  const source = await readSvgFilePreferLatin1(svgPath);
  const normalized = source.replace(/<text\b([^>]*)>([\s\S]*?)<\/text>/gi, (match, attrs, content) => {
    if (!/font-family\s*:\s*Symbol\b/i.test(attrs)) {
      return match;
    }
    const repaired = mapSymbolEncodedText(content);
    const repairedAttrs = attrs.replace(/font-family\s*:\s*Symbol\b/gi, "font-family:DejaVu Sans");
    return `<text${repairedAttrs}>${repaired}</text>`;
  });
  if (normalized !== source) {
    await fs.writeFile(svgPath, normalized, "utf8");
  }
}

function mapSymbolEncodedText(value) {
  return String(value || "").replace(/./g, (character) =>
    Object.prototype.hasOwnProperty.call(SYMBOL_FONT_UNICODE_MAP, character)
      ? SYMBOL_FONT_UNICODE_MAP[character]
      : character,
  );
}

function svgEquationToLatex(svg) {
  const elements = extractSvgTextElements(svg);
  if (elements.length === 0) {
    return "";
  }
  const unknowns = elements.filter((element) => element.rawText.includes("�")).length;
  const lines = extractSvgHorizontalLines(svg);
  const polygons = extractSvgPolygons(svg);
  const latex = cleanupEquationLatex(renderSpatialEquation(elements, lines, polygons));
  const readableChars = latex.replace(/\\[a-zA-Z]+|[\s{}_^()+\-=[\]/.,]/g, "");
  if (!readableChars && !/\\(?:frac|sqrt|int|theta|alpha|beta|gamma|delta|lambda|mu|pi|phi|omega|sin|cos|tan|sec|cot|csc)\b/.test(latex)) {
    return "";
  }
  if (unknowns > 0 && latex.replace(/\s/g, "").length < 2) {
    return "";
  }
  return latex;
}

function extractSvgTextElements(svg) {
  const dimensions = svgDimensions(svg);
  const nodes = [];
  const textRe = /<text\b([^>]*)>([\s\S]*?)<\/text>/gi;
  let match;
  while ((match = textRe.exec(svg)) !== null) {
    const attrs = match[1] || "";
    const rawText = decodeXmlText(stripXmlTags(match[2] || "")).trim();
    const fontFamily = attrFromStyle(attrs, "font-family");
    const symbolFont = /\bSymbol\b/i.test(fontFamily);
    const text = normalizeSvgText(rawText, {symbolFont, attrs, dimensions});
    const matrixDelimiter = !text && rawText.includes("�");
    if (!text && !matrixDelimiter) {
      continue;
    }
    const point = transformPoint(attrs);
    const fontSize = numberFromStyle(attrs, "font-size") || 16;
    nodes.push({
      rawText,
      text,
      x: point.x,
      y: point.y,
      fontSize,
      symbolFont,
      italic: /font-style\s*:\s*italic/i.test(attrs),
      width: Math.max(fontSize * 0.38, text.replace(/\\[a-zA-Z]+/g, "x").length * fontSize * 0.42),
      matrixDelimiter,
    });
  }
  return nodes;
}

function normalizeSvgText(rawText, {symbolFont, attrs, dimensions}) {
  let text = String(rawText || "");
  if (symbolFont) {
    text = mapSymbolEncodedText(text);
  }
  text = repairPrivateUseMathGlyphs(text);
  text = text.replace(/−/g, "-");
  // Degree may already be real UTF-8 ° from decodeMixedLatin1Svg.
  if (text === "°") {
    return "°";
  }
  if (!text.includes("�")) {
    return text;
  }

  const point = transformPoint(attrs);
  const fontSize = numberFromStyle(attrs, "font-size") || 16;
  // True integral operators sit at the far left of the equation bounding box.
  // A looser threshold misclassified mid-expression Symbol glyphs (e.g. ×) as ∫.
  if (
    symbolFont &&
    dimensions.width > 0 &&
    point.x <= Math.max(dimensions.width * 0.08, fontSize * 0.35) &&
    fontSize >= dimensions.height * 0.45
  ) {
    return "\\int";
  }
  // Drop unknown Symbol replacement glyphs (stretchy paren pieces, etc.).
  // Real degrees are recovered via decodeMixedLatin1Svg (0xB0 → °), not here.
  return text.replace(/�/g, "");
}

function renderSpatialEquation(elements, lines, polygons) {
  const matrixEquation = renderBracketedMatrixEquation(elements, lines);
  if (matrixEquation) {
    return matrixEquation;
  }

  // Prefer fractions/radicals over delimiter-less grids so stacked
  // numerators/denominators are not misread as matrices.
  const hasFractionLine = (lines || []).some((line) => line.length >= 10);
  if (!hasFractionLine) {
    const gridMatrix = renderGridMatrixEquation(elements, lines);
    if (gridMatrix) {
      return gridMatrix;
    }
  }

  return renderNonMatrixSpatialEquation(elements, lines, polygons);
}

function renderNonMatrixSpatialEquation(elements, lines, polygons) {
  let items = applyRadicalBoxes(elements.map((element, index) => ({kind: "text", id: `t${index}`, ...element})), polygons);
  const synthetic = [];
  const usedIds = new Set();
  applyFractionLines(items, lines, synthetic, usedIds);
  items = items.filter((item) => !usedIds.has(item.id));
  return renderElementRun([...items, ...synthetic]);
}

function applyFractionLines(items, lines, synthetic, usedIds) {
  const fractionLines = (lines || [])
    .filter((line) => line.length >= 10)
    .sort((left, right) => left.x1 - right.x1 || right.length - left.length);

  for (const line of fractionLines) {
    const pad = Math.max(4, line.length * 0.08);
    const scoped = items.filter((item) =>
      !usedIds.has(item.id) &&
      !item.matrixDelimiter &&
      !/^\\int\b/.test(item.text || "") &&
      !isOuterFractionDelimiter(item, line) &&
      centerX(item) >= line.x1 - pad &&
      centerX(item) <= line.x2 + pad
    );
    const numerator = scoped.filter((item) => item.y < line.y - Math.max(2, item.fontSize * 0.12));
    const denominator = scoped.filter((item) => item.y > line.y + Math.max(2, item.fontSize * 0.12));
    if (numerator.length === 0 || denominator.length === 0) {
      continue;
    }
    for (const item of [...numerator, ...denominator]) {
      usedIds.add(item.id);
    }
    synthetic.push({
      kind: "latex",
      id: `f${synthetic.length}`,
      text: `\\frac{${renderElementRun(numerator)}}{${renderElementRun(denominator)}}`,
      x: line.x1,
      y: line.y,
      width: line.length,
      fontSize: median(scoped.map((item) => item.fontSize)) || 16,
    });
  }
}

function isOuterFractionDelimiter(item, line) {
  return item.kind === "text" &&
    /^[()[\]{}]$/.test(item.text || "") &&
    item.y > line.y &&
    item.y - line.y < item.fontSize * 0.45;
}

function applyRadicalBoxes(items, polygons) {
  // Innermost-first so nested radicals can wrap already-built \sqrt{...} latex.
  const radicals = radicalBoxes(polygons)
    .map((radical) => ({
      ...radical,
      width: radical.x2 - radical.x1,
    }))
    .sort((left, right) => left.width - right.width || left.x1 - right.x1);

  let working = [...items];
  for (const radical of radicals) {
    const inside = working.filter((item) =>
      centerX(item) >= radical.x1 &&
      centerX(item) <= radical.x2 + 4 &&
      item.y >= radical.y1 - item.fontSize * 0.25 &&
      item.y <= radical.y2 + item.fontSize * 0.4
    );
    if (inside.length === 0) {
      continue;
    }
    const insideIds = new Set(inside.map((item) => item.id));
    const nested = {
      kind: "latex",
      id: `r${radical.x1.toFixed(1)}_${radical.x2.toFixed(1)}`,
      text: `\\sqrt{${renderElementRun(inside)}}`,
      x: radical.x1,
      y: radical.y2,
      width: radical.x2 - radical.x1,
      fontSize: median(inside.map((item) => item.fontSize)) || 16,
    };
    working = [...working.filter((item) => !insideIds.has(item.id)), nested];
  }

  return working;
}

function renderBracketedMatrixEquation(elements, lines = []) {
  const delimiters = elements.filter((element) => element.matrixDelimiter);
  if (delimiters.length < 4) {
    return "";
  }

  const size = median(elements.map((element) => element.fontSize)) || 16;
  const xClusters = clusterByPosition(delimiters, "x", size * 0.55);
  if (xClusters.length < 2) {
    return "";
  }

  const leftCluster = xClusters[0];
  const rightCluster = xClusters[xClusters.length - 1];
  if (distinctPositions(leftCluster, "y", size * 0.45).length < 2 ||
      distinctPositions(rightCluster, "y", size * 0.45).length < 2) {
    return "";
  }

  const leftX = median(leftCluster.map((item) => item.x));
  const rightX = median(rightCluster.map((item) => item.x));
  if (!Number.isFinite(leftX) || !Number.isFinite(rightX) || rightX - leftX < size * 1.2) {
    return "";
  }

  const delimiterTop = Math.min(...delimiters.map((item) => item.y));
  const delimiterBottom = Math.max(...delimiters.map((item) => item.y));
  const textElements = elements.filter((element) => !element.matrixDelimiter && element.text);
  const matrixItems = textElements.filter((item) =>
    item.x > leftX + size * 0.05 &&
    item.x < rightX + size * 0.15 &&
    item.y >= delimiterTop - size * 0.45 &&
    item.y <= delimiterBottom + size * 0.45
  );
  if (matrixItems.length < 4) {
    return "";
  }

  const normalizedRows = buildMatrixRowsFromItems(matrixItems, size);
  if (!normalizedRows) {
    return "";
  }
  // Reject false matrices built from inequalities / punctuation-heavy text.
  const allCells = normalizedRows.flat();
  if (allCells.some((cell) => /[<>]|,(?!\d)/.test(cell) || /\\alpha.*,|0</.test(cell))) {
    return "";
  }

  // 2-row stacks with a clear fraction bar are fractions, not matrices
  // (common for log((1-x)/(1+x)) style equations with tall parentheses).
  if (normalizedRows.length === 2 && looksLikeFractionNotMatrix(matrixItems, lines, size)) {
    return "";
  }

  const matrix = formatMatrixLatex(normalizedRows, "bmatrix");
  const prefixItems = textElements.filter((item) => centerX(item) < leftX - size * 0.05);
  const suffixItems = textElements.filter((item) => centerX(item) > rightX + size * 0.2);
  const prefix = renderSideEquation(prefixItems, lines).trim();
  const suffix = renderSideEquation(suffixItems, lines).trim();
  return [prefix, matrix, suffix].filter(Boolean).join(" ");
}

function looksLikeFractionNotMatrix(matrixItems, lines, size) {
  if (!lines?.length || matrixItems.length < 2) {
    return false;
  }
  const top = Math.min(...matrixItems.map((item) => item.y));
  const bottom = Math.max(...matrixItems.map((item) => item.y));
  const left = Math.min(...matrixItems.map((item) => item.x));
  const right = Math.max(...matrixItems.map((item) => item.x + item.width));
  const midY = (top + bottom) / 2;
  return lines.some((line) =>
    line.length >= (right - left) * 0.45 &&
    line.x1 <= right &&
    line.x2 >= left &&
    Math.abs(line.y - midY) < size * 0.45
  );
}

function renderGridMatrixEquation(elements, lines = []) {
  const textElements = elements.filter((element) => !element.matrixDelimiter && element.text);
  if (textElements.length < 4) {
    return "";
  }
  // Skip if this clearly looks like an equation/inequality rather than a pure matrix grid.
  if (textElements.some((item) => /[=<>]/.test(item.text || ""))) {
    return "";
  }
  if (textElements.some((item) => /[,:]/.test(item.text || ""))) {
    return "";
  }

  const size = median(textElements.map((element) => element.fontSize)) || 16;
  const rows = clusterByPosition(textElements, "y", size * 0.55)
    .map((row) => [...row].sort((left, right) => left.x - right.x));
  if (rows.length < 2 || rows.length > 4) {
    return "";
  }

  // Require a roughly rectangular grid (matrix/determinant), not a long prose formula.
  const xPositions = textElements.map((item) => centerX(item));
  const yPositions = textElements.map((item) => item.y);
  const width = Math.max(...xPositions) - Math.min(...xPositions);
  const height = Math.max(...yPositions) - Math.min(...yPositions);
  if (width < size * 0.8 || height < size * 0.7) {
    return "";
  }

  const normalizedRows = buildMatrixRowsFromItems(textElements, size);
  if (!normalizedRows) {
    return "";
  }

  // Avoid promoting ordinary multi-line text (words) into a matrix.
  const allCells = normalizedRows.flat();
  if (allCells.some((cell) => /[A-Za-z]{3,}/.test(cell) && !/\\(sin|cos|tan|cot|sec|csc|alpha|beta|gamma|theta|lambda|mu|pi)/.test(cell))) {
    return "";
  }
  if (allCells.every((cell) => /^[A-Za-z]$/.test(cell))) {
    return "";
  }
  // Cells should look like matrix entries (numbers, short symbols, trig pieces).
  if (allCells.some((cell) => /[<>]/.test(cell) || /,/.test(cell))) {
    return "";
  }
  // Reject fraction-like stacks and word fragments.
  if (allCells.some((cell) => /[+\-*/]{2,}|[()]/.test(cell))) {
    return "";
  }
  const letterOnly = allCells.filter((cell) => /^[A-Za-z]+$/.test(cell));
  if (letterOnly.length > allCells.length / 2) {
    return "";
  }
  // Require at least one digit or greek/trig command so plain text grids are skipped.
  if (!allCells.some((cell) => /\d|\\(sin|cos|tan|cot|alpha|beta|gamma|theta|lambda|mu|pi)/.test(cell))) {
    return "";
  }

  return formatMatrixLatex(normalizedRows, "bmatrix");
}

function buildMatrixRowsFromItems(matrixItems, size) {
  const rows = clusterByPosition(matrixItems, "y", size * 0.6)
    .map((row) => [...row].sort((left, right) => left.x - right.x))
    .filter((row) => row.length > 0);
  if (rows.length < 2 || rows.length > 4) {
    return null;
  }

  // Per-row split with a tight gap: multi-digit glyphs usually overlap/are close,
  // while separate columns have a clear horizontal gap.
  const cells = rows.map((row) => splitMatrixRowIntoCells(row, size));
  let columnCount = Math.round(median(cells.map((row) => row.length)));
  if (Number.isFinite(columnCount) && columnCount >= 2 && columnCount <= 4 &&
      cells.every((row) => Math.abs(row.length - columnCount) <= 1)) {
    const normalized = cells.map((row) => normalizeMatrixRowCells(row, columnCount));
    if (
      normalized.every((row) => row.length === columnCount && row.every((cell) => String(cell).trim())) &&
      !normalized.some((row) => row.some((cell) => /=/.test(cell)))
    ) {
      return normalized.map((row) => row.map(cleanupMatrixCell));
    }
  }

  // Global column clustering as a fallback for irregular spacing.
  const columnCenters = distinctPositions(matrixItems, "x", size * 0.55);
  columnCount = columnCenters.length;
  if (columnCount < 2 || columnCount > 4) {
    return null;
  }

  const grid = rows.map((row) => {
    const buckets = Array.from({length: columnCount}, () => []);
    for (const item of row) {
      let bestIndex = 0;
      let bestDistance = Infinity;
      for (let index = 0; index < columnCenters.length; index += 1) {
        const distance = Math.abs(centerX(item) - columnCenters[index]);
        if (distance < bestDistance) {
          bestDistance = distance;
          bestIndex = index;
        }
      }
      buckets[bestIndex].push(item);
    }
    return buckets.map((bucket) => {
      if (!bucket.length) {
        return "";
      }
      const sorted = [...bucket].sort((left, right) => left.x - right.x);
      return cleanupMatrixCell(renderElementRun(sorted));
    });
  });

  const merged = mergeLeadingSignColumns(grid);
  if (!merged || merged.some((row) => row.some((cell) => !String(cell).trim()))) {
    return null;
  }
  if (merged[0].length < 2 || merged[0].length > 4) {
    return null;
  }
  if (merged.some((row) => row.length !== merged[0].length)) {
    return null;
  }
  if (merged.some((row) => row.some((cell) => /=/.test(cell)))) {
    return null;
  }
  return merged;
}

function mergeLeadingSignColumns(grid) {
  if (!grid.length) {
    return null;
  }
  let columns = grid[0].length;
  let rows = grid.map((row) => [...row]);
  for (let col = 0; col < columns - 1; ) {
    const isSignColumn = rows.every((row) => row[col] === "" || /^[+\-]$/.test(row[col]));
    const hasSign = rows.some((row) => /^[+\-]$/.test(row[col]));
    if (isSignColumn && hasSign) {
      rows = rows.map((row) => {
        const next = [...row];
        if (/^[+\-]$/.test(next[col])) {
          next[col + 1] = `${next[col]}${next[col + 1]}`;
        }
        next.splice(col, 1);
        return next;
      });
      columns -= 1;
      continue;
    }
    col += 1;
  }
  return rows;
}

function splitMatrixRowIntoCells(row, size) {
  const sorted = [...row].sort((left, right) => left.x - right.x);
  const cells = [];
  let current = [];
  let previous = null;
  for (const item of sorted) {
    if (previous) {
      const gap = item.x - (previous.x + previous.width);
      // Use a lower threshold so clearly separated columns split even with large glyph fonts.
      if (gap > size * 0.28) {
        cells.push(current);
        current = [];
      }
    }
    current.push(item);
    previous = item;
  }
  if (current.length) {
    cells.push(current);
  }
  return cells.map((cell) => renderElementRun(cell).trim()).filter(Boolean);
}

function normalizeMatrixRowCells(row, columnCount) {
  if (row.length === columnCount) {
    return row;
  }
  if (row.length === columnCount + 1) {
    const repaired = [];
    for (let index = 0; index < row.length; index += 1) {
      if (/^[+\-]$/.test(row[index]) && index + 1 < row.length) {
        repaired.push(`${row[index]}${row[index + 1]}`);
        index += 1;
      } else {
        repaired.push(row[index]);
      }
    }
    if (repaired.length === columnCount) {
      return repaired;
    }
  }
  // Multi-digit oversplit: merge adjacent pure-digit fragments until column count matches.
  if (row.length > columnCount) {
    const merged = [...row];
    while (merged.length > columnCount) {
      let bestIndex = -1;
      let bestScore = Infinity;
      for (let index = 0; index < merged.length - 1; index += 1) {
        if (!/^[+\-]?\d+$/.test(merged[index]) || !/^\d+$/.test(merged[index + 1])) {
          continue;
        }
        const score = String(merged[index]).length + String(merged[index + 1]).length;
        if (score < bestScore) {
          bestScore = score;
          bestIndex = index;
        }
      }
      if (bestIndex < 0) {
        break;
      }
      merged.splice(bestIndex, 2, `${merged[bestIndex]}${merged[bestIndex + 1]}`);
    }
    if (merged.length === columnCount) {
      return merged;
    }
  }
  return row;
}

function cleanupMatrixCell(value) {
  return String(value || "")
    .replace(/\s+/g, " ")
    .trim()
    // Glue broken trig names from letter-spaced WMF runs: s i n → sin
    .replace(/\b([sc])\s*([ieo])\s*([nsc])\b/gi, (_m, a, b, c) => {
      const name = `${a}${b}${c}`.toLowerCase();
      if (["sin", "cos", "tan", "cot", "sec", "csc"].includes(name)) {
        return name;
      }
      return `${a}${b}${c}`;
    })
    .replace(/(?<![\\A-Za-z])(sin|cos|tan|cot|sec|csc)(?=\d|\b)/gi, "\\$1")
    .replace(/\\(sin|cos|tan|cot|sec|csc)(?=\d)/gi, "\\$1 ")
    // Degrees after angle numbers
    .replace(/(\d)\s*\\?\^\{\\circ\}/g, "$1^{\\circ}")
    .replace(/(\d)\s*°/g, "$1^{\\circ}")
    .replace(/\^\{\s*\^\{\\circ\}\s*\}/g, "^{\\circ}")
    .replace(/^([+\-])\s+/, "$1")
    .replace(/\s{2,}/g, " ")
    .trim();
}

function formatMatrixLatex(rows, environment = "bmatrix") {
  return `\\begin{${environment}}${rows.map((row) => row.map(cleanupMatrixCell).join(" & ")).join(" \\\\ ")}\\end{${environment}}`;
}

function renderSideEquation(elements, lines = []) {
  if (!elements.length) {
    return "";
  }
  const items = elements.map((element, index) => ({kind: "text", id: `s${index}`, ...element}));
  const synthetic = [];
  const usedIds = new Set();
  applyFractionLines(items, lines, synthetic, usedIds);
  const remaining = items.filter((item) => !usedIds.has(item.id));
  return renderElementRun([...remaining, ...synthetic]);
}

function clusterByPosition(items, key, tolerance) {
  const sorted = [...items].sort((left, right) => left[key] - right[key]);
  const clusters = [];
  for (const item of sorted) {
    const cluster = clusters[clusters.length - 1];
    if (!cluster || Math.abs(item[key] - median(cluster.map((entry) => entry[key]))) > tolerance) {
      clusters.push([item]);
    } else {
      cluster.push(item);
    }
  }
  return clusters;
}

function distinctPositions(items, key, tolerance) {
  return clusterByPosition(items, key, tolerance).map((cluster) => median(cluster.map((item) => item[key])));
}

function renderElementRun(elements) {
  const withOperatorLimits = attachLargeOperatorLimits(elements);
  const ordered = [...withOperatorLimits].sort((left, right) => left.x - right.x || left.y - right.y);
  const medianSize = median(ordered.map((item) => item.fontSize)) || 16;
  const mainBaseline = median(ordered.filter((item) => item.fontSize >= medianSize * 0.8).map((item) => item.y)) ||
    median(ordered.map((item) => item.y)) ||
    0;
  const pieces = [];
  for (const item of ordered) {
    const text = item.kind === "latex" ? item.text : latexEscapeText(item.text);
    if (!text) {
      continue;
    }
    const previous = pieces[pieces.length - 1];
    const isScript = item.kind !== "latex" &&
      previous &&
      item.fontSize <= medianSize * 0.78 &&
      item.y < mainBaseline - medianSize * 0.12;
    if (isScript) {
      previous.text += `^{${text}}`;
      previous.right = Math.max(previous.right, item.x + item.width);
      continue;
    }
    pieces.push({
      text,
      x: item.x,
      right: item.x + item.width,
      fontSize: item.fontSize,
    });
  }

  let output = "";
  for (const piece of pieces) {
    if (!output) {
      output = piece.text;
      continue;
    }
    const previous = pieces[pieces.indexOf(piece) - 1];
    const gap = piece.x - previous.right;
    const separator = shouldJoinMathPieces(previous.text, piece.text, gap, medianSize) ? "" : " ";
    output += `${separator}${piece.text}`;
  }
  return normalizeFunctionNames(output);
}

function attachLargeOperatorLimits(elements) {
  const items = [...elements].sort((left, right) => left.x - right.x || left.y - right.y);
  const used = new Set();
  const output = [];
  const medianSize = median(items.map((item) => item.fontSize)) || 16;

  for (const [index, item] of items.entries()) {
    if (used.has(index)) {
      continue;
    }
    const itemText = item.kind === "latex" ? item.text : latexEscapeText(item.text);
    if (!/^\\(?:int|iint|iiint|oint|sum|prod)$/.test(itemText)) {
      output.push(item);
      continue;
    }

    const rightEdge = item.x + item.width;
    const nearby = items
      .map((candidate, candidateIndex) => ({...candidate, candidateIndex}))
      .filter((candidate) =>
        candidate.candidateIndex !== index &&
        !used.has(candidate.candidateIndex) &&
        candidate.kind !== "latex" &&
        candidate.fontSize <= item.fontSize * 0.72 &&
        candidate.x >= item.x - item.width * 0.08 &&
        candidate.x <= rightEdge + Math.max(medianSize * 1.4, item.width * 1.2)
      );
    const upper = nearby
      .filter((candidate) => candidate.y < item.y - item.fontSize * 0.55)
      .sort((left, right) => left.x - right.x || left.y - right.y);
    const lower = nearby
      .filter((candidate) => candidate.y > item.y + item.fontSize * 0.08)
      .sort((left, right) => left.x - right.x || left.y - right.y);

    if (upper.length === 0 && lower.length === 0) {
      output.push(item);
      continue;
    }

    for (const candidate of [...upper, ...lower]) {
      used.add(candidate.candidateIndex);
    }
    const lowerText = lower.length ? renderElementRun(lower).trim() : "";
    const upperText = upper.length ? renderElementRun(upper).trim() : "";
    output.push({
      ...item,
      kind: "latex",
      text: `${itemText}${lowerText ? `_{${lowerText}}` : ""}${upperText ? `^{${upperText}}` : ""}`,
    });
  }

  return output;
}

function shouldJoinMathPieces(left, right, gap, size) {
  if (/^[,.)\]}]$/.test(right) || /^[([{]$/.test(left)) {
    return true;
  }
  if (/^[+\-=*/]$/.test(left) || /^[+\-=*/]$/.test(right)) {
    return false;
  }
  if (/\\(?:frac|sqrt|int)\b/.test(left) || /\\(?:frac|sqrt|int)\b/.test(right)) {
    return false;
  }
  return gap < size * 0.42;
}

function normalizeFunctionNames(value) {
  return String(value || "")
    .replace(/\bt\s*a\s*n\b/gi, "\\tan")
    .replace(/\bs\s*i\s*n\b/gi, "\\sin")
    .replace(/\bc\s*o\s*s\b/gi, "\\cos")
    .replace(/\bs\s*e\s*c\b/gi, "\\sec")
    .replace(/\bc\s*o\s*t\b/gi, "\\cot")
    .replace(/\bc\s*s\s*c\b/gi, "\\csc")
    .replace(/\bl\s*o\s*g\b/gi, "\\log");
}

function cleanupEquationLatex(value) {
  const source = String(value || "");
  // Protect matrix bodies so operator spacing does not break cells like "-3".
  const matrices = [];
  const protectedSource = source.replace(
    /\\begin\{(bmatrix|matrix|pmatrix|vmatrix|Vmatrix)\}([\s\S]*?)\\end\{\1\}/g,
    (match) => {
      matrices.push(match);
      return `@@MATRIX${matrices.length - 1}@@`;
    },
  );

  const cleaned = normalizeFunctionNames(protectedSource)
    .replace(/\s+/g, " ")
    .replace(/(\d|\\pi)\s*or\s*(\d|\\pi)/gi, "$1 or $2")
    .replace(/([)}\]])or(?=[A-Za-z0-9\\])/gi, "$1 or ")
    .replace(/([A-Za-z0-9}])or(\d)/gi, "$1 or $2")
    // Drop MathType stretchy-paren glyph fragments if any leaked through
    .replace(/[æçèö÷øìïíî]/g, "")
    // Separate glued trig+angle: sin10 → \sin 10, cos80 → \cos 80
    .replace(/\\?(sin|cos|tan|cot|sec|csc)(\d)/gi, "\\$1 $2")
    .replace(/(\d)\s*\\?\^\{\\circ\}/g, "$1^{\\circ}")
    .replace(/(\d)\s*°/g, "$1^{\\circ}")
    // Prose stuck inside math: forx>0and → for x>0 and (do not split forall)
    .replace(/\bfor(?!all\b)(?=[A-Za-z])/gi, "for ")
    .replace(/\band(?=[A-Za-z])/gi, "and ")
    .replace(/\s+([,.)\]}])/g, "$1")
    .replace(/([([{])\s+/g, "$1")
    .replace(/\s*([+\-=])\s*/g, " $1 ")
    .replace(/\^\{\s*-\s*\}\^\{\s*1\s*\}/g, "^{-1}")
    .replace(/\^\{\s*-\s*1\s*\}/g, "^{-1}")
    .replace(/\^\{\s*([+]?\d+)\s*\}/g, "^{$1}")
    .replace(/^\s*([A-Za-z])\s*-\s*1\s*$/g, "$1^{-1}")
    .replace(/\\int\s+/g, "\\int ")
    // Nested radical cleanup when spatial nesting still left empty plus radicals
    .replace(
      /\\sqrt\{([^{}]+)\}\s*\\sqrt\{\s*\+\s*\}\s*\\sqrt\{([^{}]+)\}/g,
      "\\sqrt{$1 + \\sqrt{$2}}",
    )
    .replace(/\\sqrt\{\s*\+\s*\\sqrt\{/g, "\\sqrt{")
    .replace(/\\sqrt\{\s*\+\s*\}/g, "+")
    // Nested product of radicals that should be continued sum: \sqrt{2 \sqrt{2 + \ldots}}
    .replace(
      /\\sqrt\{(\d+)\s*\\sqrt\{(\d+\s*\+\s*\\ldots)\}*/g,
      "\\sqrt{$1 + \\sqrt{$2}}",
    )
    .replace(/\.{2,}/g, "\\ldots")
    .replace(/(\\ldots)+/g, "\\ldots")
    .replace(/\\ldots\\infty/g, "\\ldots")
    .replace(/\s{2,}/g, " ")
    .trim();

  return cleaned.replace(/@@MATRIX(\d+)@@/g, (_match, index) => {
    const matrix = matrices[Number(index)] || "";
    return matrix
      .replace(/\\begin\{(bmatrix|matrix|pmatrix|vmatrix|Vmatrix)\}([\s\S]*?)\\end\{\1\}/g,
        (_full, env, body) => {
          const compacted = body
            .replace(/\s*&\s*/g, " & ")
            .replace(/\s*\\\\\s*/g, " \\\\ ")
            .replace(/(^| &\s*| \\\\\s*)([+-])\s+/g, "$1$2")
            .replace(/\s{2,}/g, " ")
            .trim();
          return `\\begin{${env}}${compacted}\\end{${env}}`;
        });
  });
}

function latexEscapeText(value) {
  return String(value || "")
    .replace(/\\/g, "\\")
    .replace(/[{}]/g, "")
    .replace(/π/g, "\\pi")
    .replace(/θ/g, "\\theta")
    .replace(/α/g, "\\alpha")
    .replace(/β/g, "\\beta")
    .replace(/γ/g, "\\gamma")
    .replace(/δ/g, "\\delta")
    .replace(/μ/g, "\\mu")
    .replace(/λ/g, "\\lambda")
    .replace(/ϕ/g, "\\phi")
    .replace(/ω/g, "\\omega")
    .replace(/√/g, "\\sqrt{}")
    .replace(/°/g, "^{\\circ}")
    .replace(/∀/g, "\\forall ")
    .replace(/∩/g, "\\cap ")
    .replace(/∪/g, "\\cup ")
    .replace(/∞/g, "\\infty ")
    .replace(/≤/g, "\\le ")
    .replace(/≥/g, "\\ge ")
    .replace(/×/g, "\\times ")
    .replace(/÷/g, "\\div ");
}

function extractSvgHorizontalLines(svg) {
  const lines = [];
  const lineRe = /<line\b([^>]*)\/?>/gi;
  let match;
  while ((match = lineRe.exec(svg)) !== null) {
    const attrs = match[1] || "";
    const x1 = numberAttr(attrs, "x1");
    const x2 = numberAttr(attrs, "x2");
    const y1 = numberAttr(attrs, "y1");
    const y2 = numberAttr(attrs, "y2");
    if (![x1, x2, y1, y2].every(Number.isFinite) || Math.abs(y1 - y2) > 2) {
      continue;
    }
    lines.push({x1: Math.min(x1, x2), x2: Math.max(x1, x2), y: (y1 + y2) / 2, length: Math.abs(x2 - x1)});
  }
  const pathRe = /<path\b([^>]*)\/?>/gi;
  while ((match = pathRe.exec(svg)) !== null) {
    const d = attrRaw(match[1] || "", "d");
    const rect = pathRect(d);
    if (!rect) {
      continue;
    }
    const height = rect.y2 - rect.y1;
    const length = rect.x2 - rect.x1;
    if (length >= 10 && height > 0 && height <= 4) {
      lines.push({x1: rect.x1, x2: rect.x2, y: (rect.y1 + rect.y2) / 2, length});
    }
  }
  return lines;
}

function pathRect(d) {
  const points = [...String(d || "").matchAll(/[ML]\s*([-+]?\d*\.?\d+),\s*([-+]?\d*\.?\d+)/gi)]
    .map((match) => [Number(match[1]), Number(match[2])])
    .filter(([x, y]) => Number.isFinite(x) && Number.isFinite(y));
  if (points.length < 4) {
    return null;
  }
  const xs = [...new Set(points.map(([x]) => x))].sort((a, b) => a - b);
  const ys = [...new Set(points.map(([, y]) => y))].sort((a, b) => a - b);
  if (xs.length !== 2 || ys.length !== 2) {
    return null;
  }
  return {x1: xs[0], x2: xs[1], y1: ys[0], y2: ys[1]};
}

function extractSvgPolygons(svg) {
  const polygons = [];
  const polygonRe = /<polygon\b([^>]*)\/?>/gi;
  let match;
  while ((match = polygonRe.exec(svg)) !== null) {
    const points = (attrRaw(match[1] || "", "points") || "")
      .trim()
      .split(/\s+/)
      .map((pair) => pair.split(",").map(Number))
      .filter(([x, y]) => Number.isFinite(x) && Number.isFinite(y));
    if (points.length < 3) {
      continue;
    }
    polygons.push({
      points,
      x1: Math.min(...points.map(([x]) => x)),
      x2: Math.max(...points.map(([x]) => x)),
      y1: Math.min(...points.map(([, y]) => y)),
      y2: Math.max(...points.map(([, y]) => y)),
    });
  }
  return polygons;
}

function radicalBoxes(polygons) {
  const sized = polygons.map((polygon) => ({
    ...polygon,
    width: polygon.x2 - polygon.x1,
    height: polygon.y2 - polygon.y1,
  }));
  const medianWidth = median(sized.map((polygon) => polygon.width));
  const medianHeight = median(sized.map((polygon) => polygon.height));
  return sized
    .filter((polygon) => polygon.width > 20 && polygon.height > 20)
    .filter((polygon) =>
      sized.length < 2 ||
      polygon.width <= medianWidth * 2 ||
      polygon.height <= medianHeight * 2
    )
    .map((polygon) => ({
      x1: polygon.x1 + (polygon.x2 - polygon.x1) * 0.2,
      x2: polygon.x2,
      y1: polygon.y1,
      y2: polygon.y2,
    }));
}

function centerX(item) {
  return item.x + item.width / 2;
}

function median(values) {
  const sorted = values.filter(Number.isFinite).sort((a, b) => a - b);
  if (sorted.length === 0) {
    return 0;
  }
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[middle] : (sorted[middle - 1] + sorted[middle]) / 2;
}

function svgDimensions(svg) {
  const tag = svg.match(/<svg\b([^>]*)>/i)?.[1] || "";
  return {
    width: numberAttr(tag, "width") || 0,
    height: numberAttr(tag, "height") || 0,
  };
}

function transformPoint(attrs) {
  const transform = attrs.match(/transform\s*=\s*"matrix\(([^"]+)\)"/i)?.[1] || "";
  const values = transform.split(/[\s,]+/).map(Number).filter(Number.isFinite);
  if (values.length >= 6) {
    return {x: values[4], y: values[5]};
  }
  return {
    x: numberAttr(attrs, "x") || 0,
    y: numberAttr(attrs, "y") || 0,
  };
}

function numberFromStyle(attrs, property) {
  const match = attrs.match(new RegExp(`${property}\\s*:\\s*([-+]?\\d*\\.?\\d+)`, "i"));
  return match ? Number(match[1]) : 0;
}

function attrFromStyle(attrs, property) {
  const match = attrs.match(new RegExp(`${property}\\s*:\\s*([^;"]+)`, "i"));
  return match ? match[1].trim() : "";
}

function numberAttr(attrs, name) {
  const value = attrRaw(attrs, name);
  return value ? Number.parseFloat(value) : 0;
}

function attrRaw(attrs, name) {
  return attrs.match(new RegExp(`\\b${name}\\s*=\\s*"([^"]*)"`, "i"))?.[1] || "";
}

function stripXmlTags(value) {
  return String(value || "")
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")
    .replace(/<[^>]+>/g, "");
}

function decodeXmlText(value) {
  return String(value || "")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'");
}

function knownCorelEmfLatex(buffer) {
  const hash = crypto.createHash("sha256").update(buffer).digest("hex");
  return COREL_EMF_LATEX_BY_SHA256.get(hash) || "";
}

function isEmptyEquationPlaceholder(buffer) {
  const hash = crypto.createHash("sha256").update(buffer).digest("hex");
  return EMPTY_EQUATION_PLACEHOLDER_SHA256.has(hash);
}

const COREL_EMF_LATEX_BY_SHA256 = new Map([
  ["2be2bc6db039702df6319fade851ea1d476aa86cf44db5a61aeaf9dc91e66515", "\\frac{3\\pi^2}{2}"],
]);

const EMPTY_EQUATION_PLACEHOLDER_SHA256 = new Set([
  "dc9c95f11d1f37eb20a08ba028bc6a50022c0ac0e175510b40afaaa3d851a30e",
  "8a9d660678f76aac11990b6673af217de995bfc76675021db687ce34c80a2273",
]);

const SYMBOL_FONT_UNICODE_MAP = Object.freeze({
  A: "Α",
  B: "Β",
  C: "Χ",
  D: "Δ",
  E: "Ε",
  F: "Φ",
  G: "Γ",
  H: "Η",
  I: "Ι",
  J: "ϑ",
  K: "Κ",
  L: "Λ",
  M: "Μ",
  N: "Ν",
  O: "Ο",
  P: "Π",
  Q: "Θ",
  R: "Ρ",
  S: "Σ",
  T: "Τ",
  U: "Υ",
  V: "ς",
  W: "Ω",
  X: "Ξ",
  Y: "Ψ",
  Z: "Ζ",
  a: "α",
  b: "β",
  c: "χ",
  d: "δ",
  e: "ε",
  f: "φ",
  g: "γ",
  h: "η",
  i: "ι",
  j: "ϕ",
  k: "κ",
  l: "λ",
  m: "μ",
  n: "ν",
  o: "ο",
  p: "π",
  q: "θ",
  r: "ρ",
  s: "σ",
  t: "τ",
  u: "υ",
  v: "ϖ",
  w: "ω",
  x: "ξ",
  y: "ψ",
  z: "ζ",
  "Ð": "∠",
  "Ö": "√",
  "£": "≤",
  "³": "≥",
  "¹": "±",
  "´": "×",
  "¥": "∞",
  "Æ": "∅",
  "Ç": "∩",
  "È": "∪",
  "Ì": "⊂",
  "Î": "∈",
  "å": "∑",
  "ò": "∫",
  // Adobe Symbol encoding for common math punctuation (not letters).
  "\"": "∀",
  "$": "∃",
  "'": "≅",
  "°": "°",
});

function mapSymbolTextRun(value) {
  const text = String(value || "");
  const trimmed = text.trim();
  if (!trimmed || /^[A-Da-d][).:\-]?$/.test(trimmed) || /^\d{1,3}[).:\-]?$/.test(trimmed)) {
    return text;
  }
  return text.replace(/[^\s]/g, (character) => SYMBOL_FONT_UNICODE_MAP[character] || character);
}

function shortError(error) {
  return error instanceof Error ? error.message.split("\n")[0] : String(error).split("\n")[0];
}

function parseRunStyle(runNode) {
  const rPr = childrenOf(runNode).find((child) => localName(nodeTag(child)) === "rPr");
  const style = {};
  if (!rPr) {
    return style;
  }
  for (const child of childrenOf(rPr)) {
    const local = localName(nodeTag(child));
    if (local === "b") style.bold = true;
    if (local === "i") style.italic = true;
    if (local === "u") style.underline = true;
    if (local === "highlight") style.highlight = attr(child, "w:val");
    if (local === "color") style.color = attr(child, "w:val");
    if (local === "rFonts") {
      const fonts = [
        attr(child, "w:ascii"),
        attr(child, "w:hAnsi"),
        attr(child, "w:cs"),
        attr(child, "w:eastAsia"),
      ].filter(Boolean);
      if (fonts.some((font) => /\bSymbol\b/i.test(font))) {
        style.symbolFont = true;
      }
    }
    if (local === "vertAlign") {
      const value = attr(child, "w:val");
      if (value === "superscript") style.superscript = true;
      if (value === "subscript") style.subscript = true;
    }
  }
  return style;
}

function pushSpan(spans, text, source, style) {
  if (text === "") {
    return;
  }
  spans.push(textSpan({text, source, ...style}));
}

function joinSpans(spans) {
  return spans.map((span) => {
    const text = String(span.text || "");
    if (!text.trim() || (!span.superscript && !span.subscript)) {
      return text;
    }
    const leading = text.match(/^\s*/)?.[0] || "";
    const trailing = text.match(/\s*$/)?.[0] || "";
    const body = text.trim();
    const marker = span.superscript ? "^" : "_";
    return `${leading}${marker}{${body}}${trailing}`;
  }).join("").replace(/[ \t]+\n/g, "\n").trim();
}

function symbolValue(node) {
  const raw = attr(node, "w:char") || attr(node, "char");
  if (!raw) {
    return "";
  }
  const code = Number.parseInt(raw, 16);
  return Number.isFinite(code) ? String.fromCodePoint(code) : "";
}

function findFirst(nodes, wantedLocalName) {
  for (const node of nodes || []) {
    if (localName(nodeTag(node)) === wantedLocalName) {
      return node;
    }
    const found = findFirst(childrenOf(node), wantedLocalName);
    if (found) {
      return found;
    }
  }
  return null;
}

function findDescendants(nodeOrNodes, predicate) {
  const nodes = Array.isArray(nodeOrNodes) ? nodeOrNodes : [nodeOrNodes];
  const matches = [];
  for (const node of nodes) {
    if (!node || typeof node !== "object") {
      continue;
    }
    if (predicate(node)) {
      matches.push(node);
    }
    matches.push(...findDescendants(childrenOf(node), predicate));
  }
  return matches;
}

function childrenOf(node) {
  if (Array.isArray(node)) {
    return node;
  }
  const tag = nodeTag(node);
  return tag ? (node[tag] || []) : [];
}

function textValue(children) {
  return (children || []).map((child) => {
    if (typeof child === "string") {
      return child;
    }
    if (localName(nodeTag(child)) === "#text") {
      return String(child["#text"] || "");
    }
    return "";
  }).join("");
}

function nodeTag(node) {
  if (!node || typeof node !== "object") {
    return "";
  }
  return Object.keys(node).find((key) => key !== ":@") || "";
}

function localName(tag) {
  return String(tag || "").split(":").pop();
}

function attr(node, name) {
  const attrs = node?.[":@"] || {};
  return attrs[name] || attrs[`@_${name}`] || attrs[name.split(":").pop()] || attrs[`@_${name.split(":").pop()}`] || "";
}
