import JSZip from "jszip";
import mammoth from "mammoth";
import {XMLParser} from "fast-xml-parser";
import {execFile} from "node:child_process";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import {promisify} from "node:util";
import {createDocumentIr, paragraphBlock, tableBlock, textSpan} from "./documentIr.js";
import {textToIr} from "./textToIr.js";
import {ommlToLatex} from "./ommlToLatex.js";

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
    pushSpan(spans, textValue(childrenOf(node)), "docx-text", style);
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
  if (extension !== ".wmf") {
    return "";
  }

  try {
    return await convertWmfPreviewToMathText(buffer);
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
  if (!readableChars && !/\\(?:frac|sqrt|int|theta|pi|sin|cos|tan|sec|cot|csc)\b/.test(latex)) {
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
    if (!text) {
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
    });
  }
  return nodes;
}

function normalizeSvgText(rawText, {symbolFont, attrs, dimensions}) {
  let text = String(rawText || "");
  if (symbolFont) {
    text = mapSymbolEncodedText(text);
  }
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
  let items = elements.map((element, index) => ({kind: "text", index, ...element}));
  const synthetic = [];

  const fractionLines = lines
    .filter((line) => line.length >= 10)
    .sort((left, right) => left.x1 - right.x1 || right.length - left.length);
  const usedIndexes = new Set();

  for (const line of fractionLines) {
    const pad = Math.max(4, line.length * 0.08);
    const scoped = items.filter((item) =>
      item.kind === "text" &&
      !usedIndexes.has(item.index) &&
      item.text !== "\\int" &&
      centerX(item) >= line.x1 - pad &&
      centerX(item) <= line.x2 + pad
    );
    const numerator = scoped.filter((item) => item.y < line.y - Math.max(2, item.fontSize * 0.12));
    const denominator = scoped.filter((item) => item.y > line.y + Math.max(2, item.fontSize * 0.12));
    if (numerator.length === 0 || denominator.length === 0) {
      continue;
    }
    for (const item of [...numerator, ...denominator]) {
      usedIndexes.add(item.index);
    }
    synthetic.push({
      kind: "latex",
      text: `\\frac{${renderElementRun(numerator)}}{${renderElementRun(denominator)}}`,
      x: line.x1,
      y: line.y,
      width: line.length,
      fontSize: median(scoped.map((item) => item.fontSize)) || 16,
    });
  }

  items = items.filter((item) => item.kind !== "text" || !usedIndexes.has(item.index));
  for (const radical of radicalBoxes(polygons)) {
    const inside = items.filter((item) =>
      item.kind === "text" &&
      centerX(item) >= radical.x1 &&
      centerX(item) <= radical.x2 + 4 &&
      item.y >= radical.y1 - item.fontSize * 0.25 &&
      item.y <= radical.y2 + item.fontSize * 0.4
    );
    if (inside.length === 0) {
      continue;
    }
    for (const item of inside) {
      usedIndexes.add(item.index);
    }
    synthetic.push({
      kind: "latex",
      text: `\\sqrt{${renderElementRun(inside)}}`,
      x: radical.x1,
      y: radical.y2,
      width: radical.x2 - radical.x1,
      fontSize: median(inside.map((item) => item.fontSize)) || 16,
    });
  }

  items = items.filter((item) => item.kind !== "text" || !usedIndexes.has(item.index));
  return renderElementRun([...items, ...synthetic]);
}

function renderElementRun(elements) {
  const ordered = [...elements].sort((left, right) => left.x - right.x || left.y - right.y);
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
  return lines;
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
  return polygons
    .filter((polygon) => polygon.x2 - polygon.x1 > 20 && polygon.y2 - polygon.y1 > 20)
    .map((polygon) => ({
      x1: polygon.x1 + (polygon.x2 - polygon.x1) * 0.32,
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
  return String(value || "").replace(/<[^>]+>/g, "");
}

function decodeXmlText(value) {
  return String(value || "")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'");
}

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
});

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
  return spans.map((span) => span.text).join("").replace(/[ \t]+\n/g, "\n").trim();
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
