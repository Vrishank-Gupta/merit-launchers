import {createDocumentIr, paragraphBlock, textSpan} from "./documentIr.js";

export function textToIr(textOrBuffer, {fileName = ""} = {}) {
  const text = Buffer.isBuffer(textOrBuffer)
    ? textOrBuffer.toString("utf8")
    : String(textOrBuffer || "");
  const normalized = text.replace(/\r\n/g, "\n").replace(/\r/g, "\n");
  const blocks = normalized
    .split(/\n{2,}|\n(?=\s*(?:Q(?:uestion)?\.?\s*)?\d{1,3}[\).:\]-]\s+\S|\s*(?:\(?[A-Da-d]\)?|[1-4])[\).:\-]\s+\S|Answer\s*:|Answer\s+Key)/)
    .map((part) => part.trim())
    .filter(Boolean)
    .map((part) => paragraphBlock({
      text: part,
      spans: [textSpan({text: part, source: "text"})],
    }));

  return createDocumentIr({
    sourceType: "txt",
    blocks,
    warnings: [],
    metadata: {
      fileName,
      textLength: normalized.length,
    },
  });
}
