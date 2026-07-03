import {OPTION_LETTERS, blockToText} from "./documentIr.js";

const LETTER_LABEL_RE = /^(?:\(([A-Da-d])\)\s*|([A-Da-d])[\).:\-]\s*)(\S.*)$/;
const NUMERIC_LABEL_RE = /^\(?([1-4])\)?[\).:\-]\s*(\S.*)$/;

export function parseOptionsFromQuestionBlocks(blocks) {
  const tableCandidate = parseOptionsFromTables(blocks);
  const text = blocks.map(blockToText).filter(Boolean).join("\n");
  const nonTableText = blocks
    .filter((block) => block.kind !== "table")
    .map(blockToText)
    .filter(Boolean)
    .join("\n")
    .trim();
  if (tableCandidate && !tableCandidate.promptText) {
    tableCandidate.promptText = nonTableText;
  }
  const textCandidate = parseOptionsFromText(text);
  const best = chooseBestCandidate([tableCandidate, textCandidate]);
  return repairPromptTailOption(best) || {
    options: [],
    promptText: text.trim(),
    warnings: ["No complete option set was detected."],
  };
}

export function parseOptionsFromTables(blocks) {
  for (const block of blocks || []) {
    if (block.kind !== "table") {
      continue;
    }
    const ordered = [];
    for (const row of block.rows || []) {
      const cells = row.map((cell) => String(cell?.text || "").trim()).filter(Boolean);
      for (let index = 0; index < cells.length; index += 1) {
        const current = cells[index];
        const labelOnly = current.match(/^\(?([A-Da-d])\)?[\).:\-]?$/);
        const labelWithText = current.match(LETTER_LABEL_RE);
        if (labelWithText) {
          ordered.push({label: (labelWithText[1] || labelWithText[2]).toUpperCase(), text: labelWithText[3].trim()});
        } else if (labelOnly && index + 1 < cells.length) {
          ordered.push({label: labelOnly[1].toUpperCase(), text: cells[index + 1]});
          index += 1;
        }
      }
    }
    const mapped = mapOrderedOptions(ordered);
    if (mapped) {
      return {
        options: mapped,
        promptText: "",
        warnings: [],
        score: 0.9,
      };
    }
  }
  return null;
}

export function parseOptionsFromText(text) {
  const lines = String(text || "").replace(/\r\n/g, "\n").replace(/\r/g, "\n").split("\n");
  const repeatedPromptCandidate = parseLeadingInlinePromptWithRepeatedOptions(lines);
  const lineCandidate = parseLineOptions(lines);
  const inlineCandidate = parseInlineOptions(String(text || ""));
  return chooseBestCandidate([repeatedPromptCandidate, lineCandidate, inlineCandidate]);
}

function parseLeadingInlinePromptWithRepeatedOptions(lines) {
  const normalizedLines = (lines || []).map((line) => String(line || "").trim()).filter(Boolean);
  const firstLine = normalizedLines[0] || "";
  if (!hasInlineOptionSequence(firstLine)) {
    return null;
  }

  const repeatedOptions = parseLineOptions(normalizedLines.slice(1));
  if (!repeatedOptions || repeatedOptions.options.filter(Boolean).length < 4) {
    return null;
  }

  return {
    ...repeatedOptions,
    promptText: firstLine,
    score: Math.max(repeatedOptions.score || 0, 0.96),
  };
}

function hasInlineOptionSequence(line) {
  const markers = collectInlineMarkers(
    String(line || "").replace(/\s+/g, " ").trim(),
    /(?:^|[\s|])(\([A-Da-d]\)|[A-Da-d][\).:\-])/g,
  );
  return markers.slice(0, 4).map((marker) => marker.label).join("") === "ABCD";
}

function parseLineOptions(lines) {
  const promptLines = [];
  const optionMap = new Map();
  let current = null;
  let started = false;
  let expectedIndex = 0;
  let labelKind = null;

  for (const rawLine of lines) {
    const line = String(rawLine || "").trim();
    if (!line) {
      continue;
    }

    const parsed = parseLineLabel(line, labelKind);
    if (parsed && isExpectedLabel(parsed.label, expectedIndex)) {
      started = true;
      current = parsed.label;
      expectedIndex += 1;
      labelKind = parsed.kind;
      optionMap.set(current, [parsed.text].filter(Boolean));
      continue;
    }

    if (started && current) {
      const nextOutOfOrder = parseLineLabel(line, labelKind);
      if (nextOutOfOrder && !isExpectedLabel(nextOutOfOrder.label, expectedIndex)) {
        return null;
      }
      optionMap.set(current, [...(optionMap.get(current) || []), line]);
    } else {
      promptLines.push(line);
    }
  }

  const options = OPTION_LETTERS.map((letter) => (optionMap.get(letter) || []).join("\n").trim());
  if (options.filter(Boolean).length < 3) {
    return null;
  }

  return {
    options,
    promptText: promptLines.join("\n").trim(),
    warnings: options.some((option) => !option) ? ["One or more options are empty."] : [],
    score: options.filter(Boolean).length / 4,
  };
}

function parseInlineOptions(text) {
  const source = String(text || "").replace(/\s+/g, " ").trim();
  const lowercaseMarkers = collectInlineMarkers(source, /(?:^|[\s|])(\([a-d]\))/g);
  if (lowercaseMarkers.length >= 3) {
    return buildInlineCandidate(source, lowercaseMarkers);
  }

  const markers = [];
  const letterMarkerRe = /(?:^|[\s|])(\([A-Da-d]\)|[A-Da-d][\).:\-])/g;
  let match;
  while ((match = letterMarkerRe.exec(source)) !== null) {
    const marker = match[1];
    const label = marker.replace(/[^A-Da-d]/g, "").toUpperCase();
    let start = match.index + match[0].length;
    while (/\s/.test(source[start] || "")) {
      start += 1;
    }
    markers.push({
      label,
      start,
      markerStart: match.index + match[0].search(/\([A-Da-d]\)|[A-Da-d][\).:\-]/),
    });
  }

  if (markers.length < 3) {
    const numericMarkers = [];
    const numericMarkerRe = /(?:^|[\s|])([1-4][\).:\-])\s+/g;
    while ((match = numericMarkerRe.exec(source)) !== null) {
      const number = Number(match[1].replace(/\D/g, ""));
      numericMarkers.push({
        label: OPTION_LETTERS[number - 1],
        start: match.index + match[0].length,
        markerStart: match.index + match[0].indexOf(match[1]),
      });
    }
    return buildInlineCandidate(source, numericMarkers);
  }

  return buildInlineCandidate(source, markers);
}

function collectInlineMarkers(source, markerRe) {
  const markers = [];
  let match;
  while ((match = markerRe.exec(source)) !== null) {
    const marker = match[1];
    const label = marker.replace(/[^A-Da-d]/g, "").toUpperCase();
    let start = match.index + match[0].length;
    while (/\s/.test(source[start] || "")) {
      start += 1;
    }
    markers.push({
      label,
      start,
      markerStart: match.index + match[0].indexOf(marker),
    });
  }
  return markers;
}

function buildInlineCandidate(source, markers) {
  const normalized = normalizeInlineMarkerLabels(markers);
  const sequence = OPTION_LETTERS.slice(0, normalized.markers.length).join("");
  if (normalized.markers.map((marker) => marker.label).join("") !== sequence || normalized.markers.length < 3) {
    return null;
  }

  const options = OPTION_LETTERS.map((letter) => {
    const index = normalized.markers.findIndex((marker) => marker.label === letter);
    if (index < 0) {
      return "";
    }
    const end = normalized.markers[index + 1]?.markerStart ?? source.length;
    return source.slice(normalized.markers[index].start, end).trim();
  });

  return {
    options,
    promptText: source.slice(0, normalized.markers[0].markerStart).trim(),
    warnings: [
      ...normalized.warnings,
      ...(options.some((option) => !option) ? ["One or more inline options are empty."] : []),
    ],
    score: options.filter(Boolean).length / 4,
  };
}

function normalizeInlineMarkerLabels(markers) {
  const startIndex = markers.findIndex((marker, index) =>
    marker.label === "A" &&
    markers.slice(index, index + 4).map((candidate) => candidate.label).join("") === "ABCD"
  );
  const usable = (startIndex >= 0 ? markers.slice(startIndex) : markers).slice(0, 4);
  const expected = OPTION_LETTERS.slice(0, usable.length);
  const labels = usable.map((marker) => marker.label);
  if (labels.join("") === expected.join("")) {
    return {markers: usable, warnings: []};
  }
  const positionalMatches = labels.filter((label, index) => label === expected[index]).length;
  const hasDuplicateLabels = new Set(labels).size !== labels.length;
  const isOutOfOrder = labels.some((label, index) => OPTION_LETTERS.indexOf(label) < index - 1);
  if (usable.length === 4 && labels[0] === "A" && (positionalMatches >= 2 || hasDuplicateLabels || isOutOfOrder)) {
    return {
      markers: usable.map((marker, index) => ({...marker, label: OPTION_LETTERS[index]})),
      warnings: ["Recovered option labels by position because PDF text decoded one or more labels incorrectly."],
    };
  }
  return {markers, warnings: []};
}

function parseLineLabel(line, expectedKind) {
  const letterMatch = line.match(LETTER_LABEL_RE);
  if (letterMatch && (!expectedKind || expectedKind === "letter")) {
    const content = letterMatch[3].trim();
    if (looksLikeNameInitials(content)) {
      return null;
    }
    return {
      label: (letterMatch[1] || letterMatch[2]).toUpperCase(),
      text: content,
      kind: "letter",
    };
  }
  const numericMatch = line.match(NUMERIC_LABEL_RE);
  if (numericMatch && (!expectedKind || expectedKind === "numeric")) {
    return {
      label: OPTION_LETTERS[Number(numericMatch[1]) - 1],
      text: numericMatch[2].trim(),
      kind: "numeric",
    };
  }
  return null;
}

function isExpectedLabel(label, expectedIndex) {
  return OPTION_LETTERS[expectedIndex] === label;
}

function looksLikeNameInitials(content) {
  return /^[A-Z]\.\s*[A-Z]\./.test(String(content || "").trim());
}

function mapOrderedOptions(items) {
  if (items.length < 3) {
    return null;
  }
  const optionMap = new Map();
  for (const item of items) {
    if (!OPTION_LETTERS.includes(item.label) || optionMap.has(item.label)) {
      continue;
    }
    optionMap.set(item.label, item.text);
  }
  const options = OPTION_LETTERS.map((letter) => String(optionMap.get(letter) || "").trim());
  return options.filter(Boolean).length >= 3 ? options : null;
}

function chooseBestCandidate(candidates) {
  return candidates
    .filter(Boolean)
    .sort((a, b) => {
      const countDelta = b.options.filter(Boolean).length - a.options.filter(Boolean).length;
      if (countDelta !== 0) {
        return countDelta;
      }
      return (b.score || 0) - (a.score || 0);
    })[0] || null;
}

function repairPromptTailOption(candidate) {
  if (!candidate) {
    return null;
  }
  const options = [...(candidate.options || [])];
  const promptText = String(candidate.promptText || "").trim();
  if (options.filter((option) => String(option || "").trim()).length !== 3 || !promptText) {
    return candidate;
  }
  const emptyIndex = options.findIndex((option) => !String(option || "").trim());
  if (emptyIndex < 0) {
    return candidate;
  }
  const matrixMatch = promptText.match(/\s*(\[[^\]\n]+;[^\]\n]+\])\s*$/);
  if (!matrixMatch) {
    return candidate;
  }
  options[emptyIndex] = matrixMatch[1].trim();
  return {
    ...candidate,
    options,
    promptText: promptText.slice(0, matrixMatch.index).trim(),
    warnings: (candidate.warnings || []).filter((warning) => warning !== "One or more inline options are empty."),
  };
}
