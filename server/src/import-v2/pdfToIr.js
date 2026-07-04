import {createDocumentIr, hasSuspiciousMathArtifact, paragraphBlock, textSpan} from "./documentIr.js";
import {repairPrivateUseMathGlyphs} from "./mathGlyphRepair.js";

export async function pdfToIr(buffer, {fileName = ""} = {}) {
  const warnings = [];
  const pdfjs = await import("pdfjs-dist/legacy/build/pdf.mjs");
  const loadingTask = pdfjs.getDocument({
    data: new Uint8Array(buffer),
    useWorkerFetch: false,
    isEvalSupported: false,
    disableFontFace: true,
  });
  const document = await loadingTask.promise;
  const pages = [];
  const blocks = [];
  const repairStats = {count: 0, samples: []};
  let textItemCount = 0;

  for (let pageNumber = 1; pageNumber <= document.numPages; pageNumber += 1) {
    const page = await document.getPage(pageNumber);
    const viewport = page.getViewport({scale: 1});
    const horizontalSegments = await extractHorizontalSegments(page, pdfjs, viewport);
    const content = await page.getTextContent({disableNormalization: true});
    const items = content.items
      .filter((item) => String(item.str || "").trim())
      .map((item, index) => {
        const transform = item.transform || [1, 0, 0, 1, 0, 0];
        return {
          id: `${pageNumber}:${index}`,
          rawText: item.str,
          text: repairPrivateUseMathGlyphs(item.str),
          x: transform[4],
          y: viewport.height - transform[5],
          rawY: transform[5],
          width: item.width || 0,
          height: Math.abs(transform[3] || item.height || 0),
          fontName: item.fontName,
          hasEOL: item.hasEOL,
        };
      });
    textItemCount += items.length;
    const layout = reconstructLayoutMath(items, horizontalSegments);
    const overbars = horizontalSegments
      .filter((segment) => !layout.consumedSegmentIds.has(segment.id))
      .filter((bar) => {
        const width = Math.abs(bar.x2 - bar.x1);
        const height = Math.abs(bar.y2 - bar.y1);
        return width >= 3.2 && width <= 12 && height <= 1.2;
      })
      .map((bar) => ({
        x1: Math.min(bar.x1, bar.x2),
        x2: Math.max(bar.x1, bar.x2),
        y: (bar.y1 + bar.y2) / 2,
      }));
    pages.push({page: pageNumber, width: viewport.width, height: viewport.height, itemCount: items.length});
    blocks.push(...itemsToParagraphs(layout.items, pageNumber, viewport, repairStats, overbars));
  }

  if (textItemCount < Math.max(6, document.numPages * 3)) {
    warnings.push("PDF appears to have no usable text layer. Please upload the original DOCX or a text-based PDF.");
  }
  if (blocks.some((block) => hasSuspiciousMathArtifact(block.text))) {
    warnings.push("PDF text contains suspicious glyph artifacts; mathematical notation may need review.");
  }
  if (repairStats.count > 0) {
    warnings.push("PDF math glyph repairs were applied; please review repaired notation against the source.");
  }

  await loadingTask.destroy().catch(() => {});

  return createDocumentIr({
    sourceType: "pdf",
    blocks,
    pages,
    warnings,
    metadata: {
      fileName,
      pageCount: document.numPages,
      textItemCount,
      scannedPdfSuspected: textItemCount < Math.max(6, document.numPages * 3),
      pdfGlyphRepairCount: repairStats.count,
      pdfGlyphRepairSamples: repairStats.samples,
    },
  });
}

function itemsToParagraphs(items, pageNumber, viewport, repairStats, overbars) {
  const lines = clusterLines(items);
  const orderedLines = orderColumns(lines, viewport.width);
  return orderedLines.map((line) => {
    const spans = line.items.map((item) => textSpan({
      text: item.text,
      source: "pdf-text",
      page: pageNumber,
      x: item.x,
      y: item.y,
      width: item.width,
      height: item.height,
      fontName: item.fontName,
    }));
    const rawText = buildLineText(line.items, overbars);
    const text = repairPdfMathGlyphs(rawText, repairStats);
    return paragraphBlock({
      text,
      spans,
      page: pageNumber,
      x: Math.min(...line.items.map((item) => item.x)),
      y: line.y,
      width: Math.max(...line.items.map((item) => item.x + item.width)) - Math.min(...line.items.map((item) => item.x)),
      height: Math.max(...line.items.map((item) => item.height || 0)),
    });
  });
}

function clusterLines(items) {
  const sorted = [...items].sort((a, b) => a.y - b.y || a.x - b.x);
  const lines = [];
  for (const item of sorted) {
    const tolerance = Math.max(3, (item.height || 8) * 0.55);
    let line = lines.find((candidate) => Math.abs(candidate.y - item.y) <= tolerance);
    if (!line) {
      line = {y: item.y, items: []};
      lines.push(line);
    }
    line.items.push(item);
    line.y = (line.y * (line.items.length - 1) + item.y) / line.items.length;
  }
  return lines.map((line) => ({
    ...line,
    items: line.items.sort((a, b) => a.x - b.x),
    x: Math.min(...line.items.map((item) => item.x)),
  }));
}

function orderColumns(lines, pageWidth) {
  if (lines.length < 10) {
    return lines.sort((a, b) => a.y - b.y);
  }
  const leftish = lines.filter((line) => line.x < pageWidth * 0.45).length;
  const rightish = lines.filter((line) => line.x > pageWidth * 0.45 && line.x < pageWidth * 0.85).length;
  const looksTwoColumn = leftish >= 4 && rightish >= 4;
  if (!looksTwoColumn) {
    return lines.sort((a, b) => a.y - b.y || a.x - b.x);
  }
  const left = lines.filter((line) => line.x < pageWidth * 0.52).sort((a, b) => a.y - b.y);
  const right = lines.filter((line) => line.x >= pageWidth * 0.52).sort((a, b) => a.y - b.y);
  return [...left, ...right];
}

function buildLineText(items, overbars = []) {
  const baseline = dominantBaseline(items);
  const normalHeight = dominantHeight(items);
  let text = "";
  let previous = null;
  for (let index = 0; index < items.length; index += 1) {
    const item = items[index];
    if (previous) {
      const gap = item.x - (previous.x + previous.width);
      const spaceThreshold = Math.max(1.5, (previous.height || item.height || 8) * 0.18);
      if (gap > spaceThreshold && !/\s$/.test(text) && !/^\s/.test(item.text)) {
        text += " ";
      }
    }
    const scriptKind = scriptKindForItem(item, baseline, normalHeight);
    if (scriptKind) {
      const run = [applyOverbarSegments(item, overbars)];
      let last = item;
      while (index + 1 < items.length) {
        const next = items[index + 1];
        const nextKind = scriptKindForItem(next, baseline, normalHeight);
        const gap = next.x - (last.x + last.width);
        if (nextKind !== scriptKind || gap > Math.max(3, normalHeight * 0.32)) {
          break;
        }
        run.push(applyOverbarSegments(next, overbars));
        last = next;
        index += 1;
      }
      text += `${scriptKind}${wrapScript(run.join("").trim())}`;
      previous = last;
      continue;
    }
    text += applyOverbarSegments(item, overbars);
    previous = item;
  }
  return text.trim();
}

function scriptKindForItem(item, baseline, normalHeight) {
  if (!String(item.text || "").trim() || item.height >= normalHeight * 0.82) {
    return null;
  }
  if (item.y < baseline - Math.max(1.2, normalHeight * 0.16)) {
    return "^";
  }
  if (item.y > baseline + Math.max(1.2, normalHeight * 0.12)) {
    return "_";
  }
  return null;
}

function dominantBaseline(items) {
  const normalItems = items.filter((item) => item.height >= dominantHeight(items) * 0.82);
  const candidates = normalItems.length > 0 ? normalItems : items;
  return median(candidates.map((item) => item.y));
}

function dominantHeight(items) {
  const heights = items
    .map((item) => item.height || 0)
    .filter((height) => height > 0)
    .sort((a, b) => a - b);
  if (heights.length === 0) {
    return 1;
  }
  return heights[Math.floor(heights.length / 2)] || 1;
}

function median(values) {
  const sorted = values.filter((value) => Number.isFinite(value)).sort((a, b) => a - b);
  if (sorted.length === 0) {
    return 0;
  }
  return sorted[Math.floor(sorted.length / 2)];
}

function wrapScript(value) {
  const clean = String(value || "").trim();
  return /^[A-Za-z0-9]$/.test(clean) ? clean : `{${clean}}`;
}

function applyOverbarSegments(item, overbars) {
  if (item.structuralMath) {
    return item.text;
  }
  const glyphs = glyphBoxesForItem(item);
  if (glyphs.length === 0 || overbars.length === 0) {
    return item.text;
  }
  return glyphs.map((glyph) => {
    if (!/[A-Za-z0-9]/.test(glyph.char)) {
      return glyph.char;
    }
    const hasOverbar = overbars.some((bar) =>
      Math.abs(bar.y - (item.y - item.height * 0.92)) <= Math.max(2.2, item.height * 0.24) &&
      rangesOverlap(bar.x1, bar.x2, glyph.x1, glyph.x2, 0.35),
    );
    return hasOverbar ? `\\bar{${glyph.char}}` : glyph.char;
  }).join("");
}

function glyphBoxesForItem(item) {
  const chars = [...String(item.text || "")];
  if (chars.length === 0) {
    return [];
  }
  const weights = chars.map((char) => {
    if (char === " ") return 0.33;
    if (/[ilI.,|]/.test(char)) return 0.45;
    if (/[mwMW]/.test(char)) return 1.25;
    return 1;
  });
  const total = weights.reduce((sum, value) => sum + value, 0) || chars.length;
  let cursor = item.x;
  return chars.map((char, index) => {
    const width = item.width * (weights[index] / total);
    const box = {char, x1: cursor, x2: cursor + width};
    cursor += width;
    return box;
  });
}

function rangesOverlap(a1, a2, b1, b2, minRatio = 0.2) {
  const left = Math.max(a1, b1);
  const right = Math.min(a2, b2);
  const overlap = Math.max(0, right - left);
  const width = Math.max(0.1, Math.min(Math.abs(a2 - a1), Math.abs(b2 - b1)));
  return overlap / width >= minRatio;
}

export function repairPdfMathGlyphs(input, stats = null) {
  const original = String(input || "");
  let text = original;

  text = repairCircleEquationGlyphs(text);

  const xiCount = (text.match(/Ξ/g) || []).length;
  if (xiCount >= 2 && /(?:[<>]|[Ll]og|[A-Za-z0-9]\s*Ξ|Ξ\s*[A-Za-z0-9])/.test(text)) {
    text = text.replace(/Ξ/g, "|");
  }

  text = text
    .replace(/¯\s*([A-Za-z])/g, "\\bar{$1}")
    .replace(/\b[Ll]og_\{([0-9]+\/[0-9]+)\}/g, "\\log_{$1}")
    .replace(/\b[Ll]og\s*([0-9]+\/[0-9]+)\b/g, "\\log_{$1}")
    .replace(/(?<!\\)\blog_\{([0-9]+\/[0-9]+)\}/g, "\\log_{$1}")
    .replace(/\bz([0-9])\b/g, "z_$1")
    .replace(/\bz([0-9])(?=\s*[|,+)])/g, "z_$1")
    .replace(/(?<=[A-Za-z])z([0-9])\b/g, "z_$1")
    .replace(/(?<=[A-Za-z])z([0-9])(?=\s*[|,+)])/g, "z_$1")
    .replace(/e-\|([^|\n]{1,24})\|/g, "e^{-|$1|}")
    .replace(/\|\s+([^|\n]+?)\s*\|/g, "|$1|")
    .replace(/\|([^|\n]+?)\s+\|/g, "|$1|")
    .replace(/(\|[^|\n]{1,32}\|)\s*([2-9])\b/g, "$1^$2")
    .replace(/\\bar\{([0-9]+)\}(?=\s*[A-Za-z])/g, "√{$1}")
    .replace(/([<>]=?)\s*O\b/g, "$1 0")
    .replace(/\bO\s*([<>]=?)/g, "0 $1");

  text = text.replace(
    /\\log_\{([^}]+)\}\s*\|([^|\n]+)\|\s*([<>]=?)\s*\\log_\{\1\}\s*\|([^|\n]+)\|/g,
    "\\( \\log_{$1}|$2| $3 \\log_{$1}|$4| \\)",
  );

  if (stats && text !== original) {
    stats.count += 1;
    if (stats.samples.length < 12) {
      stats.samples.push({
        before: original.slice(0, 180),
        after: text.slice(0, 180),
      });
    }
  }

  return text;
}

function repairCircleEquationGlyphs(input) {
  const text = String(input || "");
  if (!/(?:represents\s+a\s+circle|b\s*∈\s*R)/i.test(text)) {
    return text;
  }
  return text.replace(
    /\bz\s*\\bar\{z\}\s*\+\s*a\s*\\bar\{z\}\s*\+\s*\\bar\{a\}\s*z\s*\+\s*b\s*=\s*0\b/g,
    "\\( z\\bar{z} + a\\bar{z} + \\bar{a}z + b = 0 \\)",
  );
}

function reconstructLayoutMath(items, horizontalSegments) {
  const consumedItemIds = new Set();
  const consumedSegmentIds = new Set();
  const synthetic = [];
  const segments = dedupeHorizontalSegments(horizontalSegments);

  for (const segment of [...segments].sort((a, b) => b.width - a.width)) {
    if (consumedSegmentIds.has(segment.id) || segment.width < 5 || segment.width > 90) {
      continue;
    }
    const above = mathTextNearSegment(items, segment, "above", consumedItemIds);
    const below = mathTextNearSegment(items, segment, "below", consumedItemIds);
    if (above.length === 0 || below.length === 0) {
      continue;
    }
    if (!hasFractionBaselineAnchor(items, segment, consumedItemIds)) {
      continue;
    }

    const nestedRadical = segments.find((candidate) =>
      candidate.id !== segment.id &&
      !consumedSegmentIds.has(candidate.id) &&
      candidate.width >= 5 &&
      candidate.x1 >= segment.x1 + 3 &&
      candidate.x2 <= segment.x2 + 2 &&
      Math.abs(candidate.y - segment.y) <= 3,
    );
    const brackets = bracketPiecesAround(items, segment, consumedItemIds);
    const superscript = superscriptAfterStack(items, segment, brackets, consumedItemIds);
    const numerator = linearMathTextWithRadicals(above, segments, new Set([segment.id]));
    let denominator = linearMathTextWithRadicals(below, segments, new Set([segment.id]));
    if (!isCompactMathStackSide(numerator) || !isCompactMathStackSide(denominator)) {
      continue;
    }
    if (nestedRadical && !/^√\{/.test(denominator)) {
      denominator = `√{${denominator}}`;
      consumeRelatedSegments(consumedSegmentIds, horizontalSegments, nestedRadical);
    }
    let text = `\\frac{${numerator}}{${denominator}}`;
    if (brackets.left.length > 0 && brackets.right.length > 0) {
      text = `(${text})`;
    }
    if (superscript) {
      text += `^${wrapScript(superscript.text)}`;
    }

    for (const item of [...above, ...below, ...brackets.left, ...brackets.right]) {
      consumedItemIds.add(item.id);
    }
    if (superscript) {
      consumedItemIds.add(superscript.id);
    }
    consumeRelatedSegments(consumedSegmentIds, horizontalSegments, segment);
    synthetic.push(structuralItem({
      text,
      x: Math.min(segment.x1, ...brackets.left.map((item) => item.x)),
      y: segment.y + 3,
      width: Math.max(segment.x2, ...brackets.right.map((item) => item.x + item.width)) -
        Math.min(segment.x1, ...brackets.left.map((item) => item.x)),
      height: 12,
      sourceIds: [...above, ...below].map((item) => item.id),
    }));
  }

  for (const segment of segments) {
    if (consumedSegmentIds.has(segment.id) || segment.width < 5 || segment.width > 40) {
      continue;
    }
    const below = mathTextNearSegment(items, segment, "below", consumedItemIds);
    const above = mathTextNearSegment(items, segment, "above", consumedItemIds)
      .filter((item) => isCompactMathStackSide(item.text));
    if (below.length === 0 || (above.length > 0 && hasFractionBaselineAnchor(items, segment, consumedItemIds))) {
      continue;
    }
    const split = splitItemsBySegment(below, segment);
    const radicand = split.selectedText;
    if (!isLikelyRadicand(radicand)) {
      continue;
    }
    for (const item of split.consumedItems) {
      consumedItemIds.add(item.id);
    }
    consumeRelatedSegments(consumedSegmentIds, horizontalSegments, segment);
    synthetic.push(...split.residualItems);
    const text = `√{${radicand}}`;
    synthetic.push(structuralItem({
      text,
      x: split.xMin - 3,
      y: below[0].y,
      width: Math.max(split.xMax - split.xMin, segment.width) + 4,
      height: below[0].height || 12,
      sourceIds: split.consumedItems.map((item) => item.id),
    }));
  }

  for (const matrix of detectMatrices(items, consumedItemIds)) {
    for (const item of matrix.items) {
      consumedItemIds.add(item.id);
    }
    synthetic.push(structuralItem(matrix));
  }

  return {
    items: [
      ...items.filter((item) => !consumedItemIds.has(item.id) && String(item.text || "").trim()),
      ...synthetic,
    ],
    consumedSegmentIds,
  };
}

function structuralItem({text, x, y, width, height, sourceIds = []}) {
  return {
    id: `synthetic:${sourceIds.join(",")}:${x}:${y}`,
    rawText: text,
    text,
    x,
    y,
    rawY: 0,
    width: Math.max(width || text.length * 5, 1),
    height: height || 12,
    fontName: "pdf-layout-math",
    structuralMath: true,
  };
}

function residualItemFromGlyphs(item, glyphs, suffix) {
  const text = glyphs.map((glyph) => glyph.char).join("");
  return {
    ...item,
    id: `${item.id}:residual:${suffix}`,
    rawText: text,
    text,
    x: glyphs[0]?.x1 ?? item.x,
    width: Math.max((glyphs.at(-1)?.x2 ?? item.x + item.width) - (glyphs[0]?.x1 ?? item.x), 1),
    structuralMath: true,
  };
}

function splitItemsBySegment(items, segment) {
  const selectedItems = [];
  const residualItems = [];
  const consumedItems = [];
  let xMin = Number.POSITIVE_INFINITY;
  let xMax = Number.NEGATIVE_INFINITY;

  for (const item of items) {
    const glyphs = glyphBoxesForItem(item);
    const selectedGlyphs = glyphs.filter((glyph) =>
      String(glyph.char || "").trim() &&
      rangesOverlap(segment.x1 - 0.8, segment.x2 + 0.8, glyph.x1, glyph.x2, 0.2),
    );
    if (glyphs.length === 0 || selectedGlyphs.length === 0) {
      continue;
    }

    const selectedIndexes = new Set(selectedGlyphs.map((glyph) => glyphs.indexOf(glyph)));
    selectedItems.push(residualItemFromGlyphs(item, selectedGlyphs, `selected:${selectedItems.length}`));
    xMin = Math.min(xMin, ...selectedGlyphs.map((glyph) => glyph.x1));
    xMax = Math.max(xMax, ...selectedGlyphs.map((glyph) => glyph.x2));
    consumedItems.push(item);

    let residualRun = [];
    glyphs.forEach((glyph, index) => {
      if (!selectedIndexes.has(index)) {
        residualRun.push(glyph);
        return;
      }
      if (residualRun.length > 0 && residualRun.some((entry) => String(entry.char || "").trim())) {
        residualItems.push(residualItemFromGlyphs(item, residualRun, residualItems.length));
      }
      residualRun = [];
    });
    if (residualRun.length > 0 && residualRun.some((entry) => String(entry.char || "").trim())) {
      residualItems.push(residualItemFromGlyphs(item, residualRun, residualItems.length));
    }
  }

  const selectedText = selectedItems.length > 0 ? linearMathText(selectedItems) : "";
  return {
    selectedText: selectedText || linearMathText(items),
    residualItems,
    consumedItems: consumedItems.length > 0 ? consumedItems : items,
    xMin: Number.isFinite(xMin) ? xMin : Math.min(...items.map((item) => item.x)),
    xMax: Number.isFinite(xMax) ? xMax : Math.max(...items.map((item) => item.x + Math.max(item.width, 1))),
  };
}

function dedupeHorizontalSegments(segments) {
  const unique = [];
  for (const segment of segments
    .map((item) => ({
      ...item,
      x1: Math.min(item.x1, item.x2),
      x2: Math.max(item.x1, item.x2),
      y: (item.y1 + item.y2) / 2,
      width: Math.abs(item.x2 - item.x1),
      height: Math.abs(item.y2 - item.y1),
    }))
    .filter((item) => item.width >= 3 && item.height <= 1.5)
    .sort((a, b) => a.y - b.y || a.x1 - b.x1 || b.width - a.width)) {
    const duplicate = unique.find((existing) =>
      Math.abs(existing.y - segment.y) <= 0.8 &&
      Math.abs(existing.x1 - segment.x1) <= 0.8 &&
      Math.abs(existing.x2 - segment.x2) <= 0.8,
    );
    if (!duplicate) {
      unique.push(segment);
    }
  }
  return unique;
}

function consumeRelatedSegments(consumedSegmentIds, allSegments, segment) {
  consumedSegmentIds.add(segment.id);
  for (const candidate of allSegments) {
    const normalized = normalizeHorizontalSegment(candidate);
    if (
      Math.abs(normalized.y - segment.y) <= 1 &&
      Math.abs(normalized.x1 - segment.x1) <= 1 &&
      Math.abs(normalized.x2 - segment.x2) <= 1
    ) {
      consumedSegmentIds.add(candidate.id);
    }
  }
}

function normalizeHorizontalSegment(segment) {
  return {
    ...segment,
    x1: Math.min(segment.x1, segment.x2),
    x2: Math.max(segment.x1, segment.x2),
    y: (segment.y1 + segment.y2) / 2,
    width: Math.abs(segment.x2 - segment.x1),
    height: Math.abs(segment.y2 - segment.y1),
  };
}

function hasFractionBaselineAnchor(items, segment, consumedItemIds) {
  return items.some((item) =>
    !consumedItemIds.has(item.id) &&
    !isBracketPiece(item) &&
    String(item.text || "").trim() &&
    (item.height || 0) >= 7 &&
    item.y >= segment.y - 2 &&
    item.y <= segment.y + 9 &&
    item.x + Math.max(item.width, 1) >= segment.x1 - 44 &&
    item.x <= segment.x2 + 44,
  );
}

function mathTextNearSegment(items, segment, direction, consumedItemIds) {
  const minY = direction === "above" ? segment.y - 18 : segment.y + 0.8;
  const maxY = direction === "above" ? segment.y - 0.8 : segment.y + 19;
  return items
    .filter((item) =>
      !consumedItemIds.has(item.id) &&
      !isBracketPiece(item) &&
      String(item.text || "").trim() &&
      item.y >= minY &&
      item.y <= maxY &&
      rangesOverlap(segment.x1 - 1, segment.x2 + 1, item.x, item.x + Math.max(item.width, 1), 0.15),
    )
    .sort((a, b) => a.x - b.x);
}

function bracketPiecesAround(items, segment, consumedItemIds) {
  const verticalMin = segment.y - 18;
  const verticalMax = segment.y + 20;
  const left = items.filter((item) =>
    !consumedItemIds.has(item.id) &&
    isLeftTallBracketPiece(item) &&
    item.y >= verticalMin &&
    item.y <= verticalMax &&
    item.x <= segment.x1 + 2 &&
    item.x >= segment.x1 - 14,
  );
  const right = items.filter((item) =>
    !consumedItemIds.has(item.id) &&
    isRightTallBracketPiece(item) &&
    item.y >= verticalMin &&
    item.y <= verticalMax &&
    item.x >= segment.x2 - 2 &&
    item.x <= segment.x2 + 14,
  );
  return {left, right};
}

function superscriptAfterStack(items, segment, brackets, consumedItemIds) {
  const rightEdge = Math.max(segment.x2, ...brackets.right.map((item) => item.x + item.width));
  return items.find((item) =>
    !consumedItemIds.has(item.id) &&
    !isBracketPiece(item) &&
    /^[A-Za-z0-9]+$/.test(String(item.text || "").trim()) &&
    item.x >= rightEdge - 1 &&
    item.x <= rightEdge + 14 &&
    item.y >= segment.y - 18 &&
    item.y <= segment.y - 4,
  ) || null;
}

function linearMathText(items) {
  return buildLineText([...items].sort((a, b) => a.x - b.x), []).replace(/\s+/g, " ").trim();
}

function linearMathTextWithRadicals(items, segments, ignoredSegmentIds = new Set()) {
  const ordered = [...items].sort((a, b) => a.x - b.x);
  const consumed = new Set();
  const radicalized = [];
  for (const item of ordered) {
    if (consumed.has(item.id)) {
      continue;
    }
    const radicalBar = radicalBarForItem(item, ordered, segments, ignoredSegmentIds);
    if (!radicalBar) {
      radicalized.push(item);
      continue;
    }
    const radicandItems = ordered.filter((candidate) =>
      !consumed.has(candidate.id) &&
      candidate.y >= radicalBar.y + 4 &&
      candidate.y <= radicalBar.y + 18 &&
      rangesOverlap(radicalBar.x1 - 0.8, radicalBar.x2 + 0.8, candidate.x, candidate.x + Math.max(candidate.width, 1), 0.2),
    );
    const radicand = linearMathText(radicandItems);
    if (!radicand) {
      radicalized.push(item);
      continue;
    }
    for (const candidate of radicandItems) {
      consumed.add(candidate.id);
    }
    radicalized.push({
      ...item,
      text: `√{${radicand}}`,
      width: Math.max(radicalBar.x2 - item.x, item.width || 1),
    });
  }
  return linearMathText(radicalized);
}

function radicalBarForItem(item, lineItems, segments, ignoredSegmentIds) {
  const candidates = segments
    .filter((segment) =>
      !ignoredSegmentIds.has(segment.id) &&
      segment.width >= 4 &&
      segment.width <= 18 &&
      segment.y < item.y &&
      item.y - segment.y >= 6 &&
      item.y - segment.y <= 18 &&
      rangesOverlap(segment.x1 - 0.8, segment.x2 + 0.8, item.x, item.x + Math.max(item.width, 1), 0.25),
    )
    .map((segment) => {
      const run = lineItems.filter((candidate) =>
        candidate.y >= segment.y + 4 &&
        candidate.y <= segment.y + 18 &&
        rangesOverlap(segment.x1 - 0.8, segment.x2 + 0.8, candidate.x, candidate.x + Math.max(candidate.width, 1), 0.2),
      );
      const runWidth = run.length > 0
        ? Math.max(...run.map((candidate) => candidate.x + candidate.width)) - Math.min(...run.map((candidate) => candidate.x))
        : item.width || 1;
      return {segment, runWidth};
    })
    .filter(({segment, runWidth}) => segment.width <= Math.max(18, runWidth + 4))
    .sort((a, b) => Math.abs(a.segment.x1 - item.x) - Math.abs(b.segment.x1 - item.x));
  return candidates[0]?.segment || null;
}

function isCompactMathStackSide(text) {
  const value = String(text || "").trim();
  if (!value || value.length > 36) {
    return false;
  }
  if (/\b(?:answer|like|find|value|then|which|following|these|function|domain)\b/i.test(value)) {
    return false;
  }
  return /[0-9A-Za-zπθαβλϕω∞|+\-*/=(){}\[\]√]/.test(value);
}

function isLikelyRadicand(text) {
  const value = String(text || "").trim();
  if (!isCompactMathStackSide(value)) {
    return false;
  }
  if (/^[A-Za-z\s]+$/.test(value)) {
    return /^(?:sin|cos|tan|cot|sec|cosec|log|ln)\s*[A-Za-z]$/i.test(value);
  }
  return true;
}

function detectMatrices(items, consumedItemIds) {
  const matrices = [];
  const leftTops = items.filter((item) => !consumedItemIds.has(item.id) && hasRawChar(item, "\uF0E9"));
  for (const leftTop of leftTops) {
    const leftColumn = items.filter((item) =>
      !consumedItemIds.has(item.id) &&
      [leftTop.x - 1, leftTop.x + 1].some((x) => Math.abs(item.x - x) <= 1.5) &&
      ["\uF0E9", "\uF0EA", "\uF0EB"].some((char) => hasRawChar(item, char)) &&
      item.y >= leftTop.y - 1 &&
      item.y <= leftTop.y + 30,
    );
    if (leftColumn.length < 2) {
      continue;
    }
    const yMin = Math.min(...leftColumn.map((item) => item.y)) - 4;
    const yMax = Math.max(...leftColumn.map((item) => item.y)) + 8;
    const rightColumn = items.filter((item) =>
      !consumedItemIds.has(item.id) &&
      ["\uF0F9", "\uF0FA", "\uF0FB"].some((char) => hasRawChar(item, char)) &&
      item.y >= yMin &&
      item.y <= yMax &&
      item.x > leftTop.x + 8 &&
      item.x < leftTop.x + 80,
    );
    if (rightColumn.length < 2) {
      continue;
    }
    const xMin = leftTop.x;
    const xMax = Math.max(...rightColumn.map((item) => item.x + item.width));
    const content = items.filter((item) =>
      !consumedItemIds.has(item.id) &&
      !isBracketPiece(item) &&
      String(item.text || "").trim() &&
      item.x > xMin + 2 &&
      item.x < xMax - 2 &&
      item.y >= yMin &&
      item.y <= yMax,
    );
    if (content.length < 2) {
      continue;
    }
    const rows = clusterLines(content)
      .sort((a, b) => a.y - b.y)
      .map((row) => linearMathText(row.items))
      .filter(Boolean);
    if (rows.length < 2) {
      continue;
    }
    const matrixItems = [...leftColumn, ...rightColumn, ...content];
    matrices.push({
      text: `[${rows.join("; ")}]`,
      x: xMin,
      y: median(content.map((item) => item.y)),
      width: xMax - xMin,
      height: yMax - yMin,
      sourceIds: matrixItems.map((item) => item.id),
      items: matrixItems,
    });
  }
  return matrices;
}

function isBracketPiece(item) {
  return isLeftTallBracketPiece(item) || isRightTallBracketPiece(item);
}

function isLeftTallBracketPiece(item) {
  return ["\uF0E6", "\uF0E7", "\uF0E8", "\uF0E9", "\uF0EA", "\uF0EB"].some((char) => hasRawChar(item, char));
}

function isRightTallBracketPiece(item) {
  return ["\uF0F6", "\uF0F7", "\uF0F8", "\uF0F9", "\uF0FA", "\uF0FB"].some((char) => hasRawChar(item, char));
}

function hasRawChar(item, char) {
  return String(item.rawText || "").includes(char);
}

async function extractHorizontalSegments(page, pdfjs, viewport) {
  const ops = await page.getOperatorList();
  const names = Object.fromEntries(Object.entries(pdfjs.OPS).map(([name, code]) => [code, name]));
  const stack = [];
  let matrix = [1, 0, 0, 1, 0, 0];
  const bars = [];

  for (let index = 0; index < ops.fnArray.length; index += 1) {
    const name = names[ops.fnArray[index]];
    const args = ops.argsArray[index];
    if (name === "save") {
      stack.push([...matrix]);
      continue;
    }
    if (name === "restore") {
      matrix = stack.pop() || [1, 0, 0, 1, 0, 0];
      continue;
    }
    if (name === "transform") {
      matrix = multiplyMatrix(matrix, args);
      continue;
    }
    if (name === "constructPath") {
      bars.push(...extractHorizontalLinesFromPath(args, matrix, viewport.height, bars.length));
    }
  }

  return bars;
}

function extractHorizontalLinesFromPath(args, matrix, pageHeight, startIndex = 0) {
  const values = arrayLikeValues(args?.[1]);
  const lines = [];
  let cursor = null;
  for (let index = 0; index < values.length;) {
    const op = values[index++];
    if (op === 0) {
      cursor = transformPoint(matrix, values[index++], values[index++], pageHeight);
      continue;
    }
    if (op === 1 && cursor) {
      const next = transformPoint(matrix, values[index++], values[index++], pageHeight);
      lines.push({id: `path:${startIndex + lines.length}`, x1: cursor.x, y1: cursor.y, x2: next.x, y2: next.y});
      cursor = next;
      continue;
    }
    if (op === 3) {
      continue;
    }
    break;
  }
  return lines;
}

function arrayLikeValues(value) {
  if (!value) {
    return [];
  }
  if (Array.isArray(value) || ArrayBuffer.isView(value)) {
    return Array.from(value).flatMap((item) => ArrayBuffer.isView(item) || Array.isArray(item)
      ? Array.from(item)
      : item);
  }
  return Object.keys(value)
    .filter((key) => /^\d+$/.test(key))
    .sort((a, b) => Number(a) - Number(b))
    .map((key) => value[key]);
}

function multiplyMatrix(left, right) {
  return [
    left[0] * right[0] + left[2] * right[1],
    left[1] * right[0] + left[3] * right[1],
    left[0] * right[2] + left[2] * right[3],
    left[1] * right[2] + left[3] * right[3],
    left[0] * right[4] + left[2] * right[5] + left[4],
    left[1] * right[4] + left[3] * right[5] + left[5],
  ];
}

function transformPoint(matrix, x, y, pageHeight) {
  const px = matrix[0] * x + matrix[2] * y + matrix[4];
  const py = matrix[1] * x + matrix[3] * y + matrix[5];
  return {x: px, y: pageHeight - py};
}
