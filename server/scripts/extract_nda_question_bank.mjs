import fs from "fs";
import path from "path";
import dotenv from "dotenv";
import {GoogleGenAI} from "@google/genai";
import {fileURLToPath} from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, "..", "..");
dotenv.config({path: path.join(ROOT, "server.env")});

const TEXT_MANIFEST = path.join(ROOT, "tmp", "nda_texts", "manifest.json");
const OUT_DIR = path.join(ROOT, "tmp", "nda_bank");
fs.mkdirSync(OUT_DIR, {recursive: true});

const MODEL = process.env.GEMINI_IMPORT_MODEL || "gemini-2.5-flash-lite";
if (!process.env.GEMINI_API_KEY) {
  throw new Error("GEMINI_API_KEY missing in server.env");
}

const genAI = new GoogleGenAI({apiKey: process.env.GEMINI_API_KEY});
let manifest = JSON.parse(fs.readFileSync(TEXT_MANIFEST, "utf8"));
const limitArg = process.argv.find((item) => item.startsWith("--limit="));
const fileArg = process.argv.find((item) => item.startsWith("--file="));
if (fileArg) {
  const needle = fileArg.split("=")[1].toLowerCase();
  manifest = manifest.filter((entry) => path.basename(entry.pdf).toLowerCase().includes(needle));
}
if (limitArg) {
  const limit = Number(limitArg.split("=")[1]);
  if (Number.isFinite(limit) && limit > 0) {
    manifest = manifest.slice(0, limit);
  }
}

const SECTION_SPECS = [
  {
    key: "mathematics",
    title: "Mathematics",
    expectedCount: 120,
    ranges: [[1, 40], [41, 80], [81, 120]],
    prompt: `Extract only the MATHEMATICS section from this NDA/NA solved paper.
- Use the question-paper portion for prompt and options.
- Use the solved-answer / explanation portion only to infer the correct answer.
- Return the questions in Mathematics order.
- Each question must have exactly 4 options.
- Keep formulas/symbols as plain text.
- Do not include Paper II / English / General Knowledge questions.
- If a question is unreadable, skip it rather than inventing content.`,
  },
  {
    key: "english",
    title: "English",
    expectedCount: 50,
    ranges: [[1, 25], [26, 50]],
    prompt: `Extract only the ENGLISH section from PAPER II / GENERAL ABILITY TEST of this NDA/NA solved paper.
- This is the language section, usually the first 50 questions of Paper II.
- Use the question-paper portion for prompt and options.
- Use the solved-answer / explanation portion only to infer the correct answer.
- Return the questions in English-section order.
- Each question must have exactly 4 options.
- Do not include Mathematics questions.
- Do not include the General Knowledge / General Studies questions that follow the English part.
- If a question is unreadable, skip it rather than inventing content.`,
  },
  {
    key: "general_knowledge",
    title: "General Knowledge",
    expectedCount: 100,
    ranges: [[51, 100], [101, 150]],
    prompt: `Extract only the GENERAL KNOWLEDGE / GENERAL STUDIES section from PAPER II / GENERAL ABILITY TEST of this NDA/NA solved paper.
- This is the non-English knowledge section that follows the first 50 English questions of Paper II.
- Use the question-paper portion for prompt and options.
- Use the solved-answer / explanation portion only to infer the correct answer.
- Return the questions in General Knowledge section order.
- Each question must have exactly 4 options.
- Do not include Mathematics questions.
- Do not include the English language section from Paper II.
- If a question is unreadable, skip it rather than inventing content.`,
  },
];

const RESPONSE_SCHEMA = {
  type: "OBJECT",
  properties: {
    questions: {
      type: "ARRAY",
      items: {
        type: "OBJECT",
        required: ["questionNumber", "prompt", "options", "correctAnswer", "correctIndex"],
        properties: {
          questionNumber: {type: "STRING"},
          prompt: {type: "STRING"},
          options: {type: "ARRAY", items: {type: "STRING"}},
          correctAnswer: {type: "STRING", nullable: true},
          correctIndex: {type: "INTEGER", nullable: true},
          topic: {type: "STRING", nullable: true},
          difficulty: {type: "STRING", nullable: true},
        },
      },
    },
  },
  required: ["questions"],
};

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function normalizeQuestion(question, index, sectionTitle) {
  const options = Array.isArray(question.options)
    ? question.options.map((item) => String(item || "").trim()).filter(Boolean).slice(0, 4)
    : [];
  if (!question?.prompt || options.length !== 4) {
    return null;
  }
  let correctIndex = Number.isInteger(question.correctIndex) ? question.correctIndex : -1;
  const answerLetter = String(question.correctAnswer || "").trim().toUpperCase();
  if ((correctIndex < 0 || correctIndex > 3) && ["A", "B", "C", "D"].includes(answerLetter)) {
    correctIndex = ["A", "B", "C", "D"].indexOf(answerLetter);
  }
  if (correctIndex < 0 || correctIndex > 3) {
    return null;
  }
  return {
    questionNumber: String(question.questionNumber || index + 1),
    section: sectionTitle,
    prompt: String(question.prompt || "").trim(),
    options,
    correctIndex,
    topic: String(question.topic || "").trim() || null,
    difficulty: String(question.difficulty || "").trim().toLowerCase() || "medium",
  };
}

function normalizeForSearch(value) {
  return String(value || "")
    .replace(/[^\x20-\x7E\n]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

function splitSourceText(rawText) {
  const normalized = normalizeForSearch(rawText);
  const paper2Needles = [
    "general ability part - a english",
    "general ability part-a english",
    "general ability",
    "paper ii english language and general studies",
    "paper ii english language and general knowledge",
    "paper ii",
  ];
  let paper2Index = -1;
  for (const needle of paper2Needles) {
    const index = normalized.indexOf(needle);
    if (index >= 0 && (paper2Index < 0 || index < paper2Index)) {
      paper2Index = index;
    }
  }

  if (paper2Index < 0) {
    return {
      fullText: rawText,
      mathematicsText: rawText,
      paper2Text: rawText,
    };
  }

  // Map the normalized index back approximately into the original text by ratio.
  const ratio = paper2Index / Math.max(1, normalized.length);
  const originalIndex = Math.max(0, Math.min(rawText.length - 1, Math.floor(rawText.length * ratio)));
  const probeStart = Math.max(0, originalIndex - 2500);
  const probe = rawText.slice(probeStart, Math.min(rawText.length, originalIndex + 2500));
  const originalNeedles = [
    /GENERAL\s+ABILITY[\s\S]{0,80}?PART\s*-\s*A[:\s]+ENGLISH/i,
    /GENERAL\s+ABILITY/i,
    /PAPER\s*II/i,
  ];
  let refinedIndex = originalIndex;
  for (const regex of originalNeedles) {
    const match = probe.match(regex);
    if (match && typeof match.index === "number") {
      refinedIndex = probeStart + match.index;
      break;
    }
  }

  return {
    fullText: rawText,
    mathematicsText: rawText.slice(0, refinedIndex),
    paper2Text: rawText.slice(refinedIndex),
  };
}

async function extractSection(source, spec) {
  const outPath = path.join(OUT_DIR, `${path.basename(source.text, ".txt")}__${spec.key}.json`);
  if (fs.existsSync(outPath)) {
    return JSON.parse(fs.readFileSync(outPath, "utf8"));
  }
  const text = fs.readFileSync(source.text, "utf8");
  const split = splitSourceText(text);
  const sectionText = spec.key === "mathematics" ? split.mathematicsText : split.paper2Text;
  const allQuestions = [];
  for (const [start, end] of spec.ranges) {
    const prompt = `${spec.prompt}

Return JSON only.
Extract only question numbers ${start} to ${end} for this section.
Do not include any question outside that range.
Do not include reasoning.
Do not include explanation text; focus on prompt, four options, and correct answer only.
If a question is unreadable, skip it rather than inventing content.

SOURCE TEXT:
${sectionText.slice(0, 900000)}`;

    const response = await genAI.models.generateContent({
      model: MODEL,
      contents: prompt,
      config: {
        temperature: 0.1,
        topP: 0.8,
        maxOutputTokens: 24576,
        responseMimeType: "application/json",
        responseSchema: RESPONSE_SCHEMA,
      },
    });

    const parsed = JSON.parse(response.text || "{}");
    const normalized = (Array.isArray(parsed.questions) ? parsed.questions : [])
      .map((question, index) => normalizeQuestion(question, index, spec.title))
      .filter(Boolean)
      .filter((question) => {
        const num = Number(question.questionNumber);
        return Number.isFinite(num) && num >= start && num <= end;
      });
    allQuestions.push(...normalized);
    await sleep(800);
  }

  const deduped = [];
  const seenNumbers = new Set();
  for (const question of allQuestions.sort((a, b) => Number(a.questionNumber) - Number(b.questionNumber))) {
    const key = String(question.questionNumber);
    if (!seenNumbers.has(key)) {
      deduped.push(question);
      seenNumbers.add(key);
    }
  }

  const result = {
    sourcePdf: source.pdf,
    sourceText: source.text,
    pages: source.pages,
    chars: source.chars,
    section: spec.title,
    expectedCount: spec.expectedCount,
    extractedCount: deduped.length,
    questions: deduped,
  };
  fs.writeFileSync(outPath, JSON.stringify(result, null, 2), "utf8");
  return result;
}

const summary = [];
for (const source of manifest) {
  const sourceSummary = {
    pdf: source.pdf,
    pages: source.pages,
    chars: source.chars,
    sections: {},
  };
  for (const spec of SECTION_SPECS) {
    const result = await extractSection(source, spec);
    sourceSummary.sections[spec.key] = {
      expectedCount: result.expectedCount,
      extractedCount: result.extractedCount,
      output: path.join(OUT_DIR, `${path.basename(source.text, ".txt")}__${spec.key}.json`),
    };
    await sleep(1200);
  }
  summary.push(sourceSummary);
  fs.writeFileSync(path.join(OUT_DIR, "summary.json"), JSON.stringify(summary, null, 2), "utf8");
  console.log(`done ${path.basename(source.pdf)}`);
}

console.log(path.join(OUT_DIR, "summary.json"));
