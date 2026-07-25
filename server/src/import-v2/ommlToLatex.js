import { XMLBuilder } from "fast-xml-parser";

const builder = new XMLBuilder({
  ignoreAttributes: false,
  preserveOrder: true,
  suppressEmptyNode: false,
});

const NARY_MAP = new Map([
  ["∫", "\\int"],
  ["∑", "\\sum"],
  ["∏", "\\prod"],
  ["∮", "\\oint"],
]);

export function ommlToLatex(node) {
  const warnings = [];
  const latex = convertNode(node, warnings).replace(/\s+/g, " ").trim();
  return {
    latex,
    rawMathXml: safeBuildXml(node),
    warnings,
  };
}

function convertNode(node, warnings) {
  if (typeof node === "string") {
    return node;
  }
  if (!node || typeof node !== "object") {
    return "";
  }
  if (Array.isArray(node)) {
    return node.map((item) => convertNode(item, warnings)).join("");
  }

  const tag = nodeTag(node);
  const children = tag ? childList(node[tag]) : [];
  const local = localName(tag);

  switch (local) {
    case "oMathPara":
    case "oMath":
    case "e":
    case "num":
    case "den":
    case "deg":
    case "r":
      return convertChildren(children, warnings);
    case "t":
      return textValue(children);
    case "sSup":
      return `${group(getFirstChildLatex(children, "e", warnings))}^{${getFirstChildLatex(children, "sup", warnings)}}`;
    case "sSub":
      return `${group(getFirstChildLatex(children, "e", warnings))}_{${getFirstChildLatex(children, "sub", warnings)}}`;
    case "sSubSup":
      return `${group(getFirstChildLatex(children, "e", warnings))}_{${getFirstChildLatex(children, "sub", warnings)}}^{${getFirstChildLatex(children, "sup", warnings)}}`;
    case "sup":
    case "sub":
      return convertChildren(children, warnings);
    case "f":
      return `\\frac{${getFirstChildLatex(children, "num", warnings)}}{${getFirstChildLatex(children, "den", warnings)}}`;
    case "rad": {
      const degree = getFirstChildLatex(children, "deg", warnings);
      const body = getFirstChildLatex(children, "e", warnings);
      return degree ? `\\sqrt[${degree}]{${body}}` : `\\sqrt{${body}}`;
    }
    case "nary": {
      const chr = findPropertyValue(children, "chr") || "";
      const op = NARY_MAP.get(chr) || chr || "\\sum";
      const sub = getFirstChildLatex(children, "sub", warnings);
      const sup = getFirstChildLatex(children, "sup", warnings);
      const body = getFirstChildLatex(children, "e", warnings);
      return `${op}${sub ? `_{${sub}}` : ""}${sup ? `^{${sup}}` : ""} ${body}`.trim();
    }
    case "bar":
      return `\\overline{${getFirstChildLatex(children, "e", warnings)}}`;
    case "d": {
      const open = findPropertyValue(children, "begChr") || "(";
      const close = findPropertyValue(children, "endChr") || ")";
      return `${open}${getFirstChildLatex(children, "e", warnings)}${close}`;
    }
    case "func": {
      const name = getFirstChildLatex(children, "fName", warnings);
      const body = getFirstChildLatex(children, "e", warnings);
      return `\\${name || ""}${body ? ` ${body}` : ""}`.trim();
    }
    case "fName":
    case "eqArr":
      return convertChildren(children, warnings);
    case "m":
      return matrixLatex(children, warnings);
    case "mr":
      return matrixRowLatex(children, warnings);
    case "mPr":
    case "mcs":
    case "mc":
    case "mcPr":
    case "count":
      return "";
    case "limLow":
    case "limUpp":
    case "groupChr":
      warnings.push(`Unsupported OMML node: ${local}`);
      return convertChildren(children, warnings);
    default:
      if (local === "#text") {
        return String(node["#text"] || "").trim();
      }
      if (tag && tag.startsWith(":")) {
        return "";
      }
      if (local) {
        warnings.push(`Unsupported OMML node: ${local}`);
      }
      return convertChildren(children, warnings);
  }
}

function getFirstChildLatex(children, wantedLocalName, warnings) {
  const child = childList(children).find(
    (item) => localName(nodeTag(item)) === wantedLocalName,
  );
  return child ? convertNode(child, warnings) : "";
}

function matrixLatex(children, warnings) {
  const rows = childList(children)
    .filter((item) => localName(nodeTag(item)) === "mr")
    .map((row) => matrixRowLatex(childrenOf(row), warnings))
    .filter(Boolean);
  if (!rows.length) {
    return convertChildren(children, warnings);
  }
  // Word OMML matrices are almost always square-bracket style in exam papers.
  return `\\begin{bmatrix}${rows.join(" \\\\ ")}\\end{bmatrix}`;
}

function matrixRowLatex(children, warnings) {
  return childList(children)
    .filter((item) => localName(nodeTag(item)) === "e")
    .map((cell) => convertNode(cell, warnings).trim())
    .join(" & ");
}

function convertChildren(children, warnings) {
  return childList(children)
    .map((child) => convertNode(child, warnings))
    .join("");
}

function childrenOf(node) {
  const tag = nodeTag(node);
  return tag ? childList(node[tag]) : [];
}

function childList(value) {
  if (Array.isArray(value)) {
    return value;
  }
  if (value === null || value === undefined) {
    return [];
  }
  return [value];
}

function findPropertyValue(children, propertyLocalName) {
  const propertyNode = findDescendant(children, propertyLocalName);
  const attrs = propertyNode?.[":@"] || {};
  return attrs["m:val"] || attrs["w:val"] || attrs.val || "";
}

function findDescendant(children, wantedLocalName) {
  for (const child of childList(children)) {
    if (!child || typeof child !== "object") {
      continue;
    }
    if (localName(nodeTag(child)) === wantedLocalName) {
      return child;
    }
    const nested = findDescendant(child[nodeTag(child)] || [], wantedLocalName);
    if (nested) {
      return nested;
    }
  }
  return null;
}

function group(value) {
  const text = String(value || "").trim();
  return /\s|[+\-=]/.test(text) ? `{${text}}` : text;
}

function textValue(children) {
  return childList(children)
    .map((child) => {
      if (typeof child === "string") {
        return child;
      }
      if (localName(nodeTag(child)) === "#text") {
        return String(child["#text"] || "");
      }
      return "";
    })
    .join("");
}

function nodeTag(node) {
  if (!node || typeof node !== "object") {
    return "";
  }
  return Object.keys(node).find((key) => key !== ":@") || "";
}

function localName(tag) {
  return String(tag || "")
    .split(":")
    .pop();
}

function safeBuildXml(node) {
  try {
    return builder.build([node]);
  } catch (_error) {
    return JSON.stringify(node);
  }
}
