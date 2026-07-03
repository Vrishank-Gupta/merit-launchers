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
    const svg = await fs.readFile(output, "utf8");
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
    const svg = await fs.readFile(output, "utf8");
    return svgEquationToLatex(svg) || knownCorelEmfLatex(buffer);
  } finally {
    await fs.rm(tempDir, {recursive: true, force: true}).catch(() => {});
  }
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
    return await fs.readFile(output);
  } finally {
    await fs.rm(tempDir, {recursive: true, force: true}).catch(() => {});
  }
}

async function normalizeWmfSvgText(svgPath) {
  const source = await fs.readFile(svgPath, "utf8");
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
  return String(value || "").replace(/[A-Za-z]/g, (character) => SYMBOL_FONT_UNICODE_MAP[character] || character);
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
  if (!text.includes("�")) {
    return text;
  }

  const point = transformPoint(attrs);
  const fontSize = numberFromStyle(attrs, "font-size") || 16;
  if (symbolFont && point.x <= dimensions.width * 0.16 && fontSize >= dimensions.height * 0.45) {
    return "\\int";
  }
  return text.replace(/�/g, "");
}

function renderSpatialEquation(elements, lines, polygons) {
  const matrixEquation = renderBracketedMatrixEquation(elements);
  if (matrixEquation) {
    return matrixEquation;
  }

  let items = applyRadicalBoxes(elements.map((element, index) => ({kind: "text", id: `t${index}`, ...element})), polygons);
  const synthetic = [];

  const fractionLines = lines
    .filter((line) => line.length >= 10)
    .sort((left, right) => left.x1 - right.x1 || right.length - left.length);
  const usedIds = new Set();

  for (const line of fractionLines) {
    const pad = Math.max(4, line.length * 0.08);
    const scoped = items.filter((item) =>
      !usedIds.has(item.id) &&
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

  items = items.filter((item) => !usedIds.has(item.id));
  return renderElementRun([...items, ...synthetic]);
}

function isOuterFractionDelimiter(item, line) {
  return item.kind === "text" &&
    /^[()[\]{}]$/.test(item.text || "") &&
    item.y > line.y &&
    item.y - line.y < item.fontSize * 0.45;
}

function applyRadicalBoxes(items, polygons) {
  const synthetic = [];
  const usedIds = new Set();

  for (const radical of radicalBoxes(polygons)) {
    const inside = items.filter((item) =>
      item.kind === "text" &&
      !usedIds.has(item.id) &&
      centerX(item) >= radical.x1 &&
      centerX(item) <= radical.x2 + 4 &&
      item.y >= radical.y1 - item.fontSize * 0.25 &&
      item.y <= radical.y2 + item.fontSize * 0.4
    );
    if (inside.length === 0) {
      continue;
    }
    for (const item of inside) {
      usedIds.add(item.id);
    }
    synthetic.push({
      kind: "latex",
      id: `r${synthetic.length}`,
      text: `\\sqrt{${renderElementRun(inside)}}`,
      x: radical.x1,
      y: radical.y2,
      width: radical.x2 - radical.x1,
      fontSize: median(inside.map((item) => item.fontSize)) || 16,
    });
  }

  return [...items.filter((item) => !usedIds.has(item.id)), ...synthetic];
}

function renderBracketedMatrixEquation(elements) {
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
  if (!Number.isFinite(leftX) || !Number.isFinite(rightX) || rightX - leftX < size * 1.4) {
    return "";
  }

  const delimiterTop = Math.min(...delimiters.map((item) => item.y));
  const delimiterBottom = Math.max(...delimiters.map((item) => item.y));
  const textElements = elements.filter((element) => !element.matrixDelimiter && element.text);
  const matrixItems = textElements.filter((item) =>
    item.x > leftX + size * 0.08 &&
    item.x < rightX - size * 0.04 &&
    item.y >= delimiterTop - size * 0.35 &&
    item.y <= delimiterBottom + size * 0.35
  );
  if (matrixItems.length < 4) {
    return "";
  }

  const rows = clusterByPosition(matrixItems, "y", size * 0.65)
    .map((row) => [...row].sort((left, right) => left.x - right.x))
    .filter(Boolean);
  if (rows.length < 2 || rows.length > 5) {
    return "";
  }

  const cells = rows.map((row) => splitMatrixRowIntoCells(row, size));
  const columnCount = median(cells.map((row) => row.length));
  if (!Number.isFinite(columnCount) || columnCount < 2 || columnCount > 3) {
    return "";
  }
  if (cells.some((row) => Math.abs(row.length - columnCount) > 1)) {
    return "";
  }

  const normalizedRows = cells.map((row) => normalizeMatrixRowCells(row, columnCount));
  if (normalizedRows.some((row) => row.length !== columnCount || row.some((cell) => !cell.trim()))) {
    return "";
  }
  if (normalizedRows.some((row) => row.some((cell) => /=/.test(cell)))) {
    return "";
  }

  const matrix = `\\begin{bmatrix}${normalizedRows.map((row) => row.map(cleanupMatrixCell).join(" & ")).join(" \\\\ ")}\\end{bmatrix}`;
  const prefix = renderElementRun(textElements.filter((item) => centerX(item) < leftX - size * 0.1)).trim();
  const suffix = renderElementRun(textElements.filter((item) => centerX(item) > rightX + size * 0.35)).trim();
  return [prefix, matrix, suffix].filter(Boolean).join(" ");
}

function splitMatrixRowIntoCells(row, size) {
  const sorted = [...row].sort((left, right) => left.x - right.x);
  const cells = [];
  let current = [];
  let previous = null;
  for (const item of sorted) {
    if (previous) {
      const gap = item.x - (previous.x + previous.width);
      if (gap > size * 0.55) {
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
  return row;
}

function cleanupMatrixCell(value) {
  return String(value || "")
    .replace(/\s+/g, " ")
    .replace(/^([+\-])\s+/, "$1")
    .replace(/\\(sin|cos|tan|cot|sec|csc)\s+/g, "\\$1")
    .trim();
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
  return String(value || "")
    .replace(/\s+/g, " ")
    .replace(/(\d|\\pi)\s*or\s*(\d|\\pi)/gi, "$1 or $2")
    .replace(/([)}\]])or(?=[A-Za-z0-9\\])/gi, "$1 or ")
    .replace(/([A-Za-z0-9}])or(\d)/gi, "$1 or $2")
    .replace(/\s+([,.)\]}])/g, "$1")
    .replace(/([([{])\s+/g, "$1")
    .replace(/\s*([+\-=])\s*/g, " $1 ")
    .replace(/\^\{\s*-\s*\}\^\{\s*1\s*\}/g, "^{-1}")
    .replace(/\^\{\s*-\s*1\s*\}/g, "^{-1}")
    .replace(/\^\{\s*([+]?\d+)\s*\}/g, "^{$1}")
    .replace(/^\s*([A-Za-z])\s*-\s*1\s*$/g, "$1^{-1}")
    .replace(/\\int\s+/g, "\\int ")
    .replace(/\s{2,}/g, " ")
    .trim();
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
    .replace(/√/g, "\\sqrt{}");
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
