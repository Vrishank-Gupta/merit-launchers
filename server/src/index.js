import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";

import bcrypt from "bcryptjs";
import compression from "compression";
import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import jwt from "jsonwebtoken";
import JSZip from "jszip";
import mammoth from "mammoth";
import pg from "pg";
import Razorpay from "razorpay";
import {OAuth2Client} from "google-auth-library";

const envCandidates = [
  path.resolve(process.cwd(), "server.env"),
  path.resolve(process.cwd(), ".env"),
  path.resolve(process.cwd(), "..", "server.env"),
];
const envPath = envCandidates.find((candidate) => fs.existsSync(candidate));
dotenv.config(envPath ? {path: envPath} : undefined);

const app = express();
const {Pool} = pg;
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

const PORT = Number(process.env.PORT || 8080);
const APP_ORIGIN = process.env.APP_ORIGIN || "*";
const JWT_SECRET = process.env.JWT_SECRET || "replace-me";
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "14d";
const OTP_PROVIDER = (process.env.OTP_PROVIDER || "mock").trim().toLowerCase();
const OTP_TEST_CODE = process.env.OTP_TEST_CODE || "123456";
const FAST2SMS_API_KEY = (process.env.FAST2SMS_API_KEY || "").trim();
const GEMINI_API_KEY = (process.env.GEMINI_API_KEY || "").trim();
const GEMINI_IMPORT_MODEL = (process.env.GEMINI_IMPORT_MODEL || "gemini-2.5-flash-lite").trim();
const IMPORT_DEBUG_ENABLED = (
  process.env.LLM_IMPORT_DEBUG ||
  process.env.GEMINI_IMPORT_DEBUG ||
  "false"
).trim().toLowerCase() === "true";
const GOOGLE_CLIENT_IDS = [
  process.env.GOOGLE_CLIENT_ID_WEB,
  process.env.GOOGLE_CLIENT_ID_ANDROID,
  process.env.GOOGLE_CLIENT_ID_IOS,
].filter(Boolean);

const ADMIN_ALLOWLIST_EMAIL = (process.env.ADMIN_ALLOWLIST_EMAIL || "info@meritlaunchers.com").trim().toLowerCase();
const CMS_ADMIN_EMAIL = (process.env.CMS_ADMIN_EMAIL || "").trim().toLowerCase();
const CMS_ADMIN_PASSWORD = (process.env.CMS_ADMIN_PASSWORD || "").trim();
const BLOG_IMAGES_DIR = path.resolve(process.cwd(), "blog-images");
if (!fs.existsSync(BLOG_IMAGES_DIR)) fs.mkdirSync(BLOG_IMAGES_DIR, {recursive: true});
const MARKETING_ADMIN_EMAIL = process.env.MARKETING_ADMIN_EMAIL || "marketing@meritlaunchers.com";
const MARKETING_ADMIN_PASSWORD = process.env.MARKETING_ADMIN_PASSWORD || "marketing123";
const TOOLKIT_FILES_DIR = path.resolve(process.cwd(), process.env.TOOLKIT_FILES_DIR || "toolkit-files");
if (!fs.existsSync(TOOLKIT_FILES_DIR)) fs.mkdirSync(TOOLKIT_FILES_DIR, {recursive: true});
const PLAYSTORE_URL = (process.env.PLAYSTORE_URL || "").trim();
const IS_PRODUCTION = process.env.NODE_ENV === "production";
const importDebugDir = path.resolve(process.cwd(), "import-logs");

const googleClient = GOOGLE_CLIENT_IDS.length > 0 ? new OAuth2Client() : null;
const razorpayClient = process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET
  ? new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    })
  : null;

const otpStore = new Map();
const otpAttempts = new Map(); // phone → {count, resetAt}
const revokedTokens = new Set(); // jti values of revoked tokens

process.on("unhandledRejection", (reason) => {
  console.error("[unhandledRejection]", reason);
});

process.on("uncaughtException", (error) => {
  console.error("[uncaughtException]", error);
});

app.use(cors({origin: APP_ORIGIN === "*" ? true : APP_ORIGIN.split(",").map((item) => item.trim())}));
app.use(compression());
app.use(express.json({limit: "8mb"}));

app.get("/health", async (_req, res) => {
  try {
    await pool.query("select 1");
    res.json({status: "ok"});
  } catch (error) {
    res.status(500).json({status: "error", message: error.message});
  }
});

async function ensureRuntimeSchema() {
  await pool.query(`
    create table if not exists blogs (
      id text primary key,
      title text not null,
      slug text not null unique,
      content text not null default '',
      featured_image text,
      author text not null default 'Merit Launchers',
      category text not null default 'General',
      tags jsonb not null default '[]'::jsonb,
      meta_description text,
      status text not null default 'draft',
      publish_date timestamptz,
      views integer not null default 0,
      created_at timestamptz not null default now(),
      updated_at timestamptz not null default now()
    )
  `);
  await pool.query("create index if not exists idx_blogs_slug on blogs(slug)");
  await pool.query("create index if not exists idx_blogs_status on blogs(status)");
  await pool.query("alter table questions add column if not exists topic text");
  await pool.query("alter table questions add column if not exists concepts jsonb not null default '[]'::jsonb");
  await pool.query("alter table questions add column if not exists difficulty text not null default 'medium'");
  await pool.query(`
    create table if not exists exam_sessions (
      id text primary key,
      student_id uuid not null references users(id) on delete cascade,
      course_id text not null references courses(id) on delete cascade,
      paper_id text not null references papers(id) on delete cascade,
      answers jsonb not null default '{}'::jsonb,
      remaining_seconds integer not null,
      current_question_index integer not null default 0,
      started_at timestamptz not null,
      updated_at timestamptz not null default now()
    )
  `);
  await pool.query("create index if not exists idx_exam_sessions_student_id on exam_sessions(student_id)");
  await pool.query("create index if not exists idx_exam_sessions_paper_id on exam_sessions(paper_id)");

  // Partner Dashboard schema
  await pool.query(`
    ALTER TABLE affiliates ADD COLUMN IF NOT EXISTS associate_id text;
    ALTER TABLE affiliates ADD COLUMN IF NOT EXISTS partner_type text DEFAULT 'Education Associate';
    ALTER TABLE affiliates ADD COLUMN IF NOT EXISTS login_email text;
    ALTER TABLE affiliates ADD COLUMN IF NOT EXISTS login_password_hash text;
    ALTER TABLE affiliates ADD COLUMN IF NOT EXISTS bank_details jsonb DEFAULT '{}'::jsonb;
  `);
  await pool.query(`CREATE TABLE IF NOT EXISTS commission_slab_history (
    id text primary key, affiliate_id text references affiliates(id) on delete cascade,
    slab numeric(5,2) not null, effective_from date not null, effective_to date,
    created_at timestamptz not null default now()
  )`);
  await pool.query(`CREATE TABLE IF NOT EXISTS referral_clicks (
    id text primary key, affiliate_code text not null, channel text not null default 'direct',
    ip_hash text not null, clicked_at timestamptz not null default now(),
    click_date date not null default current_date,
    converted_to_signup boolean not null default false, converted_to_paid boolean not null default false
  )`);
  await pool.query(`ALTER TABLE referral_clicks ADD COLUMN IF NOT EXISTS click_date date not null default current_date`).catch(() => {});
  await pool.query(`CREATE UNIQUE INDEX IF NOT EXISTS referral_clicks_dedup ON referral_clicks(affiliate_code, channel, ip_hash, click_date)`).catch(() => {});
  await pool.query(`CREATE TABLE IF NOT EXISTS commission_payouts (
    id text primary key, affiliate_id text references affiliates(id),
    month text not null, gross_revenue numeric not null, weighted_commission_rate numeric not null,
    commission_amount numeric not null, status text not null default 'pending',
    paid_amount numeric, paid_at timestamptz, paid_by text, notes text,
    created_at timestamptz not null default now()
  )`);
  await pool.query(`CREATE TABLE IF NOT EXISTS partner_toolkit_files (
    id text primary key, title text not null, category text not null default 'other',
    file_url text not null, file_name text not null, uploaded_by text,
    created_at timestamptz not null default now()
  )`);
  await pool.query(`
    ALTER TABLE affiliates ADD COLUMN IF NOT EXISTS referred_by_affiliate_id text REFERENCES affiliates(id);
  `).catch(() => {});
  await pool.query(`
    ALTER TABLE affiliates ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'active';
  `).catch(() => {});
  await pool.query(`
    ALTER TABLE affiliates ADD COLUMN IF NOT EXISTS phone text;
  `).catch(() => {});
  await pool.query(`
    CREATE TABLE IF NOT EXISTS partner_type_commissions (
      partner_type text PRIMARY KEY,
      rate numeric(5,2) NOT NULL DEFAULT 0,
      updated_at timestamptz NOT NULL DEFAULT now()
    )
  `);
  await pool.query(`
    INSERT INTO partner_type_commissions (partner_type, rate) VALUES
      ('Campus Ambassador', 0),
      ('Education Associate', 0),
      ('Institutional Partner', 0)
    ON CONFLICT (partner_type) DO NOTHING
  `);
}

function signSession(user) {
  return jwt.sign(
    {
      jti: crypto.randomUUID(),
      sub: user.id,
      role: user.role,
      email: user.email,
      phone: user.phone,
      name: user.name,
    },
    JWT_SECRET,
    {expiresIn: JWT_EXPIRES_IN},
  );
}

function normalizePhone(phone) {
  const trimmed = (phone || "").trim();
  if (!trimmed) return "";
  if (trimmed.startsWith("+")) {
    const digits = trimmed.slice(1).replaceAll(/\D/g, "");
    return digits.length >= 7 && digits.length <= 15 ? `+${digits}` : "";
  }
  const digits = trimmed.replaceAll(/\D/g, "");
  if (digits.length === 10) return `+91${digits}`;
  if (digits.length === 12 && digits.startsWith("91")) return `+${digits}`;
  if (digits.length >= 7 && digits.length <= 15) return `+${digits}`;
  return "";
}

function generateOtp() {
  if (OTP_PROVIDER === "mock") return OTP_TEST_CODE;
  return String(Math.floor(100000 + Math.random() * 900000));
}

async function sendOtp(phone, code) {
  if (OTP_PROVIDER === "fast2sms") {
    if (!FAST2SMS_API_KEY) throw new Error("FAST2SMS_API_KEY is not configured.");
    const digits = phone.replace(/^\+91/, "").replace(/\D/g, "");
    const response = await fetch("https://www.fast2sms.com/dev/bulkV2", {
      method: "POST",
      headers: {
        authorization: FAST2SMS_API_KEY,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({route: "otp", variables_values: code, numbers: digits}),
    });
    if (!response.ok) {
      throw new Error("SMS delivery failed. Please try again.");
    }
    return;
  }
  // mock: nothing to send — code already stored in otpStore
}

function extractGeminiResponseText(responseJson) {
  const candidates = Array.isArray(responseJson?.candidates) ? responseJson.candidates : [];
  for (const candidate of candidates) {
    const parts = Array.isArray(candidate?.content?.parts) ? candidate.content.parts : [];
    for (const part of parts) {
      if (typeof part?.text === "string" && part.text.trim()) {
        return part.text;
      }
    }
  }

  throw new Error("Gemini did not return structured output text.");
}

function extractJsonObjectFromText(text) {
  const trimmed = String(text || "").trim();
  if (!trimmed) {
    throw new Error("LLM returned empty output.");
  }

  try {
    return JSON.parse(trimmed);
  } catch {}

  const fencedMatch = trimmed.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
  if (fencedMatch) {
    return JSON.parse(fencedMatch[1]);
  }

  const firstBrace = trimmed.indexOf("{");
  const lastBrace = trimmed.lastIndexOf("}");
  if (firstBrace >= 0 && lastBrace > firstBrace) {
    return JSON.parse(trimmed.slice(firstBrace, lastBrace + 1));
  }

  throw new Error("LLM output did not contain valid JSON.");
}

function compactWhitespace(value) {
  return String(value || "").replaceAll(/\r\n/g, "\n").replaceAll(/\s+/g, " ").trim();
}

async function extractDocxSupplementalData(bytes) {
  const zip = await JSZip.loadAsync(bytes);
  const xmlFile = zip.file("word/document.xml");
  if (!xmlFile) {
    return {
      ommlCount: 0,
      ommlSamples: [],
      documentXmlSnippet: "",
    };
  }

  const xml = await xmlFile.async("string");
  const ommlParaMatches = [...xml.matchAll(/<m:oMathPara\b[\s\S]*?<\/m:oMathPara>/g)].map((match) => compactWhitespace(match[0]));
  const bareOmmlMatches = [...xml.matchAll(/<m:oMath\b[\s\S]*?<\/m:oMath>/g)]
    .map((match) => compactWhitespace(match[0]))
    .filter((candidate) => !ommlParaMatches.some((block) => block.includes(candidate)));
  const ommlSamples = [...ommlParaMatches, ...bareOmmlMatches].filter(Boolean).slice(0, 24);

  return {
    ommlCount: ommlParaMatches.length + bareOmmlMatches.length,
    ommlSamples,
    documentXmlSnippet: compactWhitespace(xml).slice(0, 12000),
  };
}

function buildGeminiSource({
  fileName,
  sourceKind,
  rawText,
  htmlText,
  ommlCount,
  ommlSamples,
}) {
  const parts = [
    `FILENAME: ${fileName}`,
    `SOURCE_KIND: ${sourceKind}`,
  ];

  if (htmlText) {
    parts.push(`DOCUMENT_HTML:\n${htmlText}`);
  }

  if (rawText) {
    parts.push(`DOCUMENT_TEXT:\n${rawText}`);
  }

  if (ommlCount > 0) {
    parts.push(`OFFICE_MATH_XML_COUNT: ${ommlCount}`);
    parts.push(`OFFICE_MATH_XML_BLOCKS:\n${ommlSamples.join("\n\n")}`);
  } else {
    parts.push("OFFICE_MATH_XML_COUNT: 0");
  }

  return parts.join("\n\n");
}

async function extractImportSource({fileName, fileBase64, rawText}) {
  const trimmedRawText = String(rawText || "").trim();
  if (fileBase64) {
    const bytes = Buffer.from(String(fileBase64), "base64");
    const lowerName = String(fileName || "").toLowerCase();
    if (lowerName.endsWith(".docx")) {
      const [textResult, htmlResult] = await Promise.all([
        mammoth.extractRawText({buffer: bytes}),
        mammoth.convertToHtml({buffer: bytes}),
      ]);
      const supplemental = await extractDocxSupplementalData(bytes);

      const docText = String(textResult.value || "").replaceAll("\r\n", "\n").trim();
      const docHtml = String(htmlResult.value || "").trim();
      if (!docText && !docHtml) {
        throw new Error("No extractable text was found in this file.");
      }

      return {
        sourceKind: "server-docx",
        rawText: docText,
        htmlText: docHtml,
        ommlCount: supplemental.ommlCount,
        ommlSamples: supplemental.ommlSamples,
        documentXmlSnippet: supplemental.documentXmlSnippet,
        llmSource: buildGeminiSource({
          fileName,
          sourceKind: "server-docx",
          rawText: docText,
          htmlText: docHtml,
          ommlCount: supplemental.ommlCount,
          ommlSamples: supplemental.ommlSamples,
        }),
        llmSourceLabel: "SERVER DOCX EXTRACTION PACKAGE",
      };
    }

    const decodedText = bytes.toString("utf8").trim();
    if (decodedText) {
      return {
        sourceKind: "server-text",
        rawText: decodedText,
        htmlText: "",
        ommlCount: 0,
        ommlSamples: [],
        documentXmlSnippet: "",
        llmSource: decodedText,
        llmSourceLabel: "DOCUMENT TEXT VIEW",
      };
    }
  }

  if (!trimmedRawText) {
    throw new Error("No extractable text was found in this file.");
  }

  return {
    sourceKind: "client-raw-text",
    rawText: trimmedRawText,
    htmlText: "",
    ommlCount: 0,
    ommlSamples: [],
    documentXmlSnippet: "",
    llmSource: trimmedRawText,
    llmSourceLabel: "DOCUMENT TEXT VIEW",
  };
}

async function writeImportDebugLog(logId, payload) {
  if (!IMPORT_DEBUG_ENABLED) {
    return null;
  }

  await fs.promises.mkdir(importDebugDir, {recursive: true});
  const filePath = path.join(importDebugDir, `${logId}.json`);
  await fs.promises.writeFile(filePath, JSON.stringify(payload, null, 2), "utf8");
  console.log(`[import-debug] wrote ${filePath}`);
  return filePath;
}

function createImportError(message, {logId} = {}) {
  const error = new Error(message);
  if (logId) {
    error.debug = {
      logId,
      filePath: path.join("server", "import-logs", `${logId}.json`),
    };
  }
  return error;
}

function normalizeImportedPaper(payload, fallbackTitle) {
  const questions = Array.isArray(payload?.questions) ? payload.questions : [];
  const normalizedQuestions = questions
    .map((question, index) => {
      const options = Array.isArray(question?.options)
        ? question.options.map((item) => String(item || "").trim()).filter(Boolean)
        : [];
      let correctIndex = Number(question?.correctIndex);
      const correctAnswer = String(question?.correctAnswer || "").trim().toUpperCase();

      if ((!Number.isInteger(correctIndex) || correctIndex < 0 || correctIndex > 3) && correctAnswer) {
        const answerMatch = correctAnswer.match(/[ABCD]/);
        if (answerMatch) {
          correctIndex = answerMatch[0].charCodeAt(0) - 65;
        }
      }

      if (!question?.prompt || options.length !== 4 || !Number.isInteger(correctIndex) || correctIndex < 0 || correctIndex > 3) {
        return null;
      }

      return {
        id: `ai-import-${Date.now()}-${index + 1}`,
        section: String(question.section || "General").trim() || "General",
        prompt: String(question.prompt || "").trim(),
        options,
        correctIndex,
        topic: String(question.topic || "").trim() || null,
        concepts: Array.isArray(question.concepts)
          ? question.concepts.map((item) => String(item || "").trim()).filter(Boolean).slice(0, 6)
          : [],
        difficulty: ["easy", "medium", "hard"].includes(String(question.difficulty || "").trim().toLowerCase())
          ? String(question.difficulty).trim().toLowerCase()
          : "medium",
        explanation: String(question.explanation || "").trim() || null,
      };
    })
    .filter(Boolean);

  if (normalizedQuestions.length === 0) {
    throw new Error("AI import did not return any valid questions.");
  }

  return {
    title: String(payload?.title || fallbackTitle || "Imported Paper").trim() || "Imported Paper",
    instructions: Array.isArray(payload?.instructions)
      ? payload.instructions.map((item) => String(item || "").trim()).filter(Boolean)
      : [],
    questions: normalizedQuestions,
  };
}

async function parsePaperWithGemini({fileName, rawText, fileBase64}) {
  if (!GEMINI_API_KEY) {
    throw new Error("GEMINI_API_KEY is not configured on the server.");
  }

  const extracted = await extractImportSource({fileName, fileBase64, rawText});
  const truncatedText = extracted.rawText.slice(0, 120000);
  const truncatedHtml = extracted.htmlText.slice(0, 120000);
  const truncatedXml = extracted.documentXmlSnippet.slice(0, 12000);
  const llmSource = extracted.llmSource.slice(0, 90000);
  const logId = `import-${Date.now()}-${crypto.randomUUID()}`;
  const responseSchema = {
    type: "OBJECT",
    required: ["title", "instructions", "questions"],
    properties: {
      title: {
        type: "STRING",
      },
      instructions: {
        type: "ARRAY",
        items: {
          type: "STRING",
        },
      },
      questions: {
        type: "ARRAY",
        items: {
          type: "OBJECT",
          required: ["questionNumber", "section", "prompt", "options", "correctAnswer", "correctIndex"],
          properties: {
            questionNumber: {
              type: "STRING",
              nullable: true,
            },
            section: {
              type: "STRING",
            },
            prompt: {
              type: "STRING",
            },
            options: {
              type: "ARRAY",
              items: {
                type: "STRING",
              },
            },
            topic: {
              type: "STRING",
              nullable: true,
            },
            concepts: {
              type: "ARRAY",
              items: {
                type: "STRING",
              },
            },
            difficulty: {
              type: "STRING",
              nullable: true,
            },
            explanation: {
              type: "STRING",
              nullable: true,
            },
            correctAnswer: {
              type: "STRING",
              nullable: true,
            },
            correctIndex: {
              type: "INTEGER",
              nullable: true,
            },
          },
        },
      },
    },
  };
  const requestPayload = {
    systemInstruction: {
      parts: [
        {
          text:
            "You convert messy exam-paper text into structured JSON for an exam authoring tool. The input comes from DOCX/TXT extraction and may contain broken line wraps, flattened tables, Hindi and English mixed text, raw LaTeX, Unicode math, and separate answer-key sections. Preserve the source wording and symbols exactly as text. Do not solve, simplify, translate, or rewrite the academic content. Extract every valid multiple-choice question you can find. Each valid question must have exactly four options in the original order. ANSWER KEY EXTRACTION IS CRITICAL: The document may contain (1) per-question inline answers immediately after each question, (2) a cumulative answer key section at the end of the document listing answers for all questions (e.g. '1.A 2.C 3.B ...' or a table with question numbers and answer letters), or (3) both. Scan the ENTIRE document, including the very end, for any answer key section. Map every answer you find to its question by number and return correctAnswer as A, B, C, or D. Also return correctIndex (0 for A, 1 for B, 2 for C, 3 for D). If the answer key uses a different numbering scheme, reconcile it with the question order. For each question, classify the most likely topic and up to 6 concise concepts/skills, and assign difficulty as easy, medium, or hard. Use a visible section heading when present, otherwise use the nearest topical heading, otherwise use General. Ignore branding, page numbers, decorative text, duplicate headers or footers, and explanatory commentary that is not part of the paper.",
        },
      ],
    },
    contents: [
      {
        role: "user",
        parts: [
          {
          text:
              `Return one JSON object only. No markdown fences. No prose.\n\nRequired JSON shape:\n{\n  "title": string,\n  "instructions": string[],\n  "questions": [\n    {\n      "questionNumber": string|null,\n      "section": string,\n      "prompt": string,\n      "options": [string, string, string, string],\n      "topic": string|null,\n      "concepts": string[],\n      "difficulty": "easy"|"medium"|"hard"|null,\n      "explanation": string|null,\n      "correctAnswer": "A"|"B"|"C"|"D"|null,\n      "correctIndex": 0|1|2|3|null\n    }\n  ]\n}\n\nRules:\n- Extract all valid multiple-choice questions from the supplied document package.\n- Do not merge multiple questions into one.\n- Do not invent options or answers.\n- Preserve Hindi, English, equations, LaTeX, braces, symbols, and office-math meaning exactly as text.\n- If OFFICE_MATH_XML_BLOCKS exist, use them as math ground truth when HTML or text drops symbols.\n- Remove only option label markers like A., (A), A).\n- ANSWER KEY (high priority): Scan the full document, including the end, for a cumulative answer key section (e.g. \"1.A 2.B 3.C\" or a table of question numbers and letters). Map every keyed answer to its question by question number. Also accept per-question inline answers immediately after each option block.\n- If answer is unclear after scanning the full document, return null for correctAnswer and correctIndex.\n- topic should be the main chapter or subject focus of the question.\n- concepts should be short mentor-friendly labels like derivative test, matrix determinant, domain of relation, probability conditionality.\n- difficulty should be a best-effort classification.\n- explanation is optional and should only be a very short hint or solution cue if the document clearly provides it.\n- Use section headings when present.\n\n${extracted.llmSourceLabel}:\n${llmSource || "(empty)"}`,
          },
        ],
      },
    ],
    generationConfig: {
      temperature: 0.1,
      topP: 0.8,
      maxOutputTokens: 8192,
      responseMimeType: "application/json",
      responseSchema,
    },
  };
  let responseJson = null;
  let fetchError = null;
  let response = null;
  try {
    response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(GEMINI_IMPORT_MODEL)}:generateContent?key=${encodeURIComponent(GEMINI_API_KEY)}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestPayload),
    });
    responseJson = await response.json();
  } catch (error) {
    fetchError = error instanceof Error ? (error.stack || error.message) : String(error);
  }

  let parsedOutput = null;
  let outputText = null;
  let normalizedResult = null;
  let normalizationError = null;
  let parseError = null;
  if (response?.ok) {
    try {
      outputText = extractGeminiResponseText(responseJson);
      parsedOutput = extractJsonObjectFromText(outputText);
      normalizedResult = normalizeImportedPaper(parsedOutput, fileName.replace(/\.[^.]+$/, ""));
    } catch (error) {
      parseError = error instanceof Error ? error.message : String(error);
    }
  }

  await writeImportDebugLog(logId, {
    logId,
    createdAt: new Date().toISOString(),
    fileName,
    provider: "gemini",
    model: GEMINI_IMPORT_MODEL,
    extraction: {
      sourceKind: extracted.sourceKind,
      rawTextLength: extracted.rawText.length,
      htmlTextLength: extracted.htmlText.length,
      ommlCount: extracted.ommlCount,
    },
    request: requestPayload,
    requestPreview: {
      llmSourceLabel: extracted.llmSourceLabel,
      llmSource: llmSource,
      documentTextView: truncatedText,
      documentHtmlView: truncatedHtml,
      documentXmlView: truncatedXml,
      ommlBlocks: extracted.ommlSamples,
    },
    fetchError,
    response: responseJson,
    extractedOutputText: outputText,
    parsedOutput,
    normalizedResult,
    parseError,
    normalizationError,
  });

  if (fetchError) {
    throw createImportError(`Gemini import request failed before a response was received. ${fetchError}`, {logId});
  }

  if (!response?.ok) {
    throw createImportError(responseJson?.error?.message || "Gemini import request failed.", {logId});
  }

  if (!normalizedResult) {
    throw createImportError(parseError || normalizationError || "AI import normalization failed.", {logId});
  }

  const normalized = normalizedResult;
  return {
    ...normalized,
    debug: IMPORT_DEBUG_ENABLED
      ? {
          logId,
          filePath: path.join("server", "import-logs", `${logId}.json`),
        }
      : undefined,
  };
}

async function findAdminAllowlist({email, phone}) {
  if (email) {
    const emailRow = await pool.query(
      "select * from admin_allowlist where id = $1 and is_active = true limit 1",
      [email.toLowerCase()],
    );
    if (emailRow.rowCount > 0) {
      return emailRow.rows[0];
    }
  }

  if (phone) {
    const phoneRow = await pool.query(
      "select * from admin_allowlist where id = $1 and is_active = true limit 1",
      [phone],
    );
    if (phoneRow.rowCount > 0) {
      return phoneRow.rows[0];
    }
  }

  return null;
}

async function ensureUser({
  role,
  name,
  email,
  phone,
  googleSub,
}) {
  const normalizedEmail = email ? email.toLowerCase() : null;
  const normalizedPhone = phone ? normalizePhone(phone) : null;

  const existing = await pool.query(
    `select * from users
      where ($1::text is not null and email = $1)
         or ($2::text is not null and phone = $2)
         or ($3::text is not null and google_sub = $3)
      limit 1`,
    [normalizedEmail, normalizedPhone, googleSub || null],
  );

  if (existing.rowCount > 0) {
    const user = existing.rows[0];
    const updated = await pool.query(
      `update users
          set role = $2,
              name = coalesce(nullif($3, ''), name),
              email = coalesce($4, email),
              phone = coalesce($5, phone),
              google_sub = coalesce($6, google_sub),
              updated_at = now()
        where id = $1
        returning *`,
      [user.id, role, name || "", normalizedEmail, normalizedPhone, googleSub || null],
    );
    return updated.rows[0];
  }

  const created = await pool.query(
    `insert into users (role, name, email, phone, google_sub)
     values ($1, $2, $3, $4, $5)
     returning *`,
    [role, name || "", normalizedEmail, normalizedPhone, googleSub || null],
  );
  return created.rows[0];
}

async function ensureAllowlistedAdminUser() {
  const allowlisted = await findAdminAllowlist({email: ADMIN_ALLOWLIST_EMAIL});
  if (!allowlisted) {
    throw new Error("Admin allowlist entry is missing. Set ADMIN_ALLOWLIST_EMAIL and restart the stack.");
  }

  return ensureUser({
    role: "admin",
    name: allowlisted.label || "Admin User",
    email: allowlisted.email || ADMIN_ALLOWLIST_EMAIL,
    phone: allowlisted.phone || null,
  });
}

function requireAuth(req, res, next) {
  const header = req.headers.authorization || "";
  if (!header.startsWith("Bearer ")) {
    return res.status(401).json({message: "Authentication required."});
  }

  try {
    const payload = jwt.verify(header.slice(7), JWT_SECRET);
    if (payload.jti && revokedTokens.has(payload.jti)) {
      return res.status(401).json({message: "Session has been revoked."});
    }
    req.auth = payload;
    next();
  } catch (error) {
    return res.status(401).json({message: "Session expired or invalid."});
  }
}

async function requireAdmin(req, res, next) {
  if (!req.auth) {
    return res.status(401).json({message: "Authentication required."});
  }

  if (req.auth.role === "admin") {
    return next();
  }

  return res.status(403).json({message: "Admin access required."});
}

async function buildSeed(auth) {
  const isAdmin = auth?.role === "admin";
  const isStudent = auth?.role === "student";
  const studentId = isStudent ? auth.sub : null;

  const [courses, papers, questions, affiliates, students, purchases, attempts, examSessions, supportMessages] = await Promise.all([
      pool.query("select * from courses where is_published = true order by title asc"),
      pool.query("select * from papers order by created_at desc"),
      pool.query("select * from questions order by sort_order asc, created_at asc"),
    isAdmin
      ? pool.query("select * from affiliates order by created_at desc")
      : Promise.resolve({rows: []}),
    isAdmin
      ? pool.query("select * from users where role = 'student' order by joined_at desc")
      : isStudent
          ? pool.query("select * from users where id = $1 limit 1", [studentId])
          : Promise.resolve({rows: []}),
    isAdmin
      ? pool.query("select * from purchases order by purchased_at desc")
      : isStudent
          ? pool.query("select * from purchases where student_id = $1 order by purchased_at desc", [studentId])
          : Promise.resolve({rows: []}),
      isAdmin
        ? pool.query("select * from attempts order by submitted_at desc")
        : isStudent
            ? pool.query("select * from attempts where student_id = $1 order by submitted_at desc", [studentId])
            : Promise.resolve({rows: []}),
      isAdmin
        ? pool.query("select * from exam_sessions order by updated_at desc")
        : isStudent
            ? pool.query("select * from exam_sessions where student_id = $1 order by updated_at desc", [studentId])
            : Promise.resolve({rows: []}),
      isAdmin
        ? pool.query("select * from support_messages order by sent_at asc")
        : isStudent
            ? pool.query("select * from support_messages where student_id = $1 order by sent_at asc", [studentId])
            : Promise.resolve({rows: []}),
  ]);

  const questionsByPaperId = new Map();
  for (const row of questions.rows) {
    const list = questionsByPaperId.get(row.paper_id) || [];
      list.push({
        id: row.id,
        section: row.section,
        prompt: row.prompt,
        promptSegments: row.prompt_segments,
        options: row.options,
        optionSegments: row.option_segments,
        correctIndex: row.correct_index,
        explanation: row.explanation,
        topic: row.topic,
        concepts: row.concepts,
        difficulty: row.difficulty,
        marks: row.marks,
        negativeMarks: row.negative_marks,
      });
    questionsByPaperId.set(row.paper_id, list);
  }

  const currentStudent = isStudent
    ? students.rows.find((item) => item.id === auth.sub) || null
    : null;

  return {
    courses: courses.rows.map((row) => ({
      id: row.id,
      title: row.title,
      subtitle: row.subtitle,
      description: row.description,
      price: Number(row.price),
      validityDays: row.validity_days,
      highlights: row.highlights || [],
      introVideoUrl: row.intro_video_url,
      heroLabel: row.hero_label,
    })),
    papers: papers.rows.map((row) => ({
      id: row.id,
      courseId: row.course_id,
      title: row.title,
      durationMinutes: row.duration_minutes,
      instructions: row.instructions || [],
      questions: questionsByPaperId.get(row.id) || [],
      isFreePreview: row.is_free_preview,
    })),
    affiliates: affiliates.rows.map((row) => ({
      id: row.id,
      name: row.name,
      code: row.code,
      channel: row.channel,
    })),
    currentStudent: currentStudent ? {
      id: currentStudent.id,
      name: currentStudent.name,
      contact: currentStudent.phone || currentStudent.email || "",
      city: currentStudent.city,
      joinedAt: currentStudent.joined_at,
      referralCode: currentStudent.referral_code,
    } : {
      id: "",
      name: "",
      contact: "",
      city: "",
      joinedAt: new Date().toISOString(),
      referralCode: null,
    },
    students: students.rows.map((row) => ({
      id: row.id,
      name: row.name,
      contact: row.phone || row.email || "",
      city: row.city,
      joinedAt: row.joined_at,
      referralCode: row.referral_code,
    })),
    purchases: purchases.rows.map((row) => ({
      id: row.id,
      student_id: row.student_id,
      course_id: row.course_id,
      amount: Number(row.amount),
      purchased_at: row.purchased_at,
      receipt_number: row.receipt_number,
      valid_until: row.valid_until,
      payment_provider: row.payment_provider,
      payment_id: row.payment_id,
      payment_order_id: row.payment_order_id,
      payment_signature: row.payment_signature,
      verified_at: row.verified_at,
    })),
    attempts: attempts.rows.map((row) => ({
      id: row.id,
      student_id: row.student_id,
      course_id: row.course_id,
      paper_id: row.paper_id,
      answers: row.answers,
      section_scores: row.section_scores,
      score: row.score,
      max_score: row.max_score,
      submitted_at: row.submitted_at,
    })),
    examSessions: examSessions.rows.map((row) => ({
      id: row.id,
      student_id: row.student_id,
      course_id: row.course_id,
      paper_id: row.paper_id,
      answers: row.answers,
      remaining_seconds: row.remaining_seconds,
      current_question_index: row.current_question_index,
      started_at: row.started_at,
      updated_at: row.updated_at,
    })),
    supportMessages: supportMessages.rows.map((row) => ({
      id: row.id,
      student_id: row.student_id,
      sender_role: row.sender_role,
      message: row.message,
      sent_at: row.sent_at,
    })),
  };
}

app.get("/v1/bootstrap", async (req, res) => {
  try {
    let auth = null;
    const header = req.headers.authorization || "";
    if (header.startsWith("Bearer ")) {
      auth = jwt.verify(header.slice(7), JWT_SECRET);
    }

    res.json(await buildSeed(auth));
  } catch (error) {
    res.status(500).json({
      message: error.message,
      debug: error?.debug || null,
    });
  }
});

app.post("/v1/auth/google", async (req, res) => {
  try {
    if (!googleClient || GOOGLE_CLIENT_IDS.length === 0) {
      return res.status(501).json({message: "Google login is not configured on the server."});
    }

    const idToken = typeof req.body?.idToken === "string" ? req.body.idToken.trim() : "";
    const accessToken = typeof req.body?.accessToken === "string" ? req.body.accessToken.trim() : "";
    const role = req.body?.role === "admin" ? "admin" : "student";
    if (!idToken && !accessToken) {
      return res.status(400).json({message: "idToken or accessToken is required."});
    }

    let email, phone, name, googleSub;

    if (idToken) {
      const ticket = await googleClient.verifyIdToken({
        idToken,
        audience: GOOGLE_CLIENT_IDS,
      });
      const payload = ticket.getPayload();
      if (!payload) {
        return res.status(401).json({message: "Google token could not be verified."});
      }
      email = (payload.email || "").toLowerCase();
      phone = payload.phone_number || "";
      name = payload.name || "";
      googleSub = payload.sub;
    } else {
      const [tokenInfoRes, userInfoRes] = await Promise.all([
        fetch(`https://oauth2.googleapis.com/tokeninfo?access_token=${encodeURIComponent(accessToken)}`),
        fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
          headers: {Authorization: `Bearer ${accessToken}`},
        }),
      ]);
      const tokenInfo = await tokenInfoRes.json();
      const userInfo = await userInfoRes.json();
      if (!tokenInfoRes.ok || tokenInfo.error) {
        return res.status(401).json({message: "Google access token could not be verified."});
      }
      const validAudience = GOOGLE_CLIENT_IDS.some((id) => id === tokenInfo.aud || id === tokenInfo.azp);
      if (!validAudience) {
        return res.status(401).json({message: "Google access token audience mismatch."});
      }
      email = (userInfo.email || "").toLowerCase();
      phone = "";
      name = userInfo.name || "";
      googleSub = userInfo.sub;
    }

    if (role === "admin") {
      const allowlisted = await findAdminAllowlist({email, phone});
      if (!allowlisted) {
        return res.status(403).json({message: "This account is not allowlisted for admin access."});
      }
    }

    const user = await ensureUser({
      role,
      name,
      email,
      phone,
      googleSub,
    });

    res.json({
      token: signSession(user),
      user: {
        id: user.id,
        role: user.role,
        name: user.name,
        email: user.email,
        phone: user.phone,
        city: user.city,
        referralCode: user.referral_code,
      },
    });
  } catch (error) {
    res.status(401).json({message: error.message});
  }
});

app.post("/v1/auth/dev-login", async (req, res) => {
  if (IS_PRODUCTION) {
    return res.status(404).json({message: "Not found."});
  }

  try {
    const role = req.body?.role === "admin" ? "admin" : "student";
    const user = role === "admin"
      ? await ensureAllowlistedAdminUser()
      : await ensureUser({
          role: "student",
          name: "Aarav Sharma",
          email: "aarav.sharma@gmail.com",
          phone: null,
          googleSub: null,
        });

    return res.json({
      token: signSession(user),
      user: {
        id: user.id,
        role: user.role,
        name: user.name,
        email: user.email,
        phone: user.phone,
        city: user.city,
        referralCode: user.referral_code,
      },
    });
  } catch (error) {
    return res.status(500).json({message: error.message});
  }
});

app.post("/v1/auth/otp/request", async (req, res) => {
  const phone = normalizePhone(req.body?.phone || "");
  const role = req.body?.role === "admin" ? "admin" : "student";
  if (!phone) {
    return res.status(400).json({message: "phone is required."});
  }

  if (role === "admin") {
    const allowlisted = await findAdminAllowlist({phone});
    if (!allowlisted) {
      return res.status(403).json({message: "This phone number is not allowlisted for admin access."});
    }
  }

  if (OTP_PROVIDER !== "mock" && OTP_PROVIDER !== "fast2sms") {
    return res.status(501).json({message: "OTP provider is not configured."});
  }

  const code = generateOtp();
  otpStore.set(phone, {code, role, expiresAt: Date.now() + 10 * 60 * 1000});

  try {
    await sendOtp(phone, code);
  } catch (error) {
    otpStore.delete(phone);
    return res.status(500).json({message: error.message});
  }

  res.json({
    ok: true,
    message: OTP_PROVIDER === "mock" ? "OTP generated in mock mode." : "OTP sent.",
    devCode: !IS_PRODUCTION ? code : undefined,
  });
});

app.post("/v1/auth/otp/verify", async (req, res) => {
  const phone = normalizePhone(req.body?.phone || "");
  const role = req.body?.role === "admin" ? "admin" : "student";
  const code = String(req.body?.code || "").trim();
  const stored = otpStore.get(phone);

  if (!phone || !code) {
    return res.status(400).json({message: "phone and code are required."});
  }

  // Rate-limit failed attempts: max 5 per 15 minutes
  const now = Date.now();
  const attempts = otpAttempts.get(phone) || {count: 0, resetAt: now + 15 * 60 * 1000};
  if (now > attempts.resetAt) { attempts.count = 0; attempts.resetAt = now + 15 * 60 * 1000; }
  if (attempts.count >= 5) {
    return res.status(429).json({message: "Too many attempts. Please request a new OTP."});
  }

  if (!stored || stored.role !== role || stored.expiresAt < Date.now() || stored.code !== code) {
    attempts.count += 1;
    otpAttempts.set(phone, attempts);
    return res.status(401).json({message: "OTP verification failed."});
  }
  otpAttempts.delete(phone);

  const user = await ensureUser({
    role,
    name: "",
    phone,
  });
  otpStore.delete(phone);

  res.json({
    token: signSession(user),
    user: {
      id: user.id,
      role: user.role,
      name: user.name,
      email: user.email,
      phone: user.phone,
      city: user.city,
      referralCode: user.referral_code,
    },
  });
});

// Logout — revoke the current token so it can no longer be used
app.post("/v1/auth/logout", requireAuth, (req, res) => {
  if (req.auth.jti) {
    revokedTokens.add(req.auth.jti);
    // Auto-cleanup after token would naturally expire (max 30 days)
    setTimeout(() => revokedTokens.delete(req.auth.jti), 30 * 24 * 60 * 60 * 1000);
  }
  res.json({ok: true});
});

// Post-login phone verification for Google-authenticated users
app.post("/v1/me/phone/request-otp", requireAuth, async (req, res) => {
  const phone = normalizePhone(req.body?.phone || "");
  if (!phone) return res.status(400).json({message: "phone is required."});

  if (OTP_PROVIDER !== "mock" && OTP_PROVIDER !== "fast2sms") {
    return res.status(501).json({message: "OTP provider is not configured."});
  }

  const existing = await pool.query(
    "select id from users where phone = $1 and id != $2",
    [phone, req.auth.sub],
  );
  if (existing.rows.length > 0) {
    return res.status(409).json({message: "This phone number is already registered to another account."});
  }

  const code = generateOtp();
  const key = `profile:${req.auth.sub}:${phone}`;
  otpStore.set(key, {code, expiresAt: Date.now() + 10 * 60 * 1000});

  try {
    await sendOtp(phone, code);
  } catch (error) {
    otpStore.delete(key);
    return res.status(500).json({message: error.message});
  }

  res.json({
    ok: true,
    message: OTP_PROVIDER === "mock" ? "OTP generated in mock mode." : "OTP sent.",
    devCode: !IS_PRODUCTION ? code : undefined,
  });
});

app.post("/v1/me/phone/verify-otp", requireAuth, async (req, res) => {
  const phone = normalizePhone(req.body?.phone || "");
  const code = String(req.body?.code || "").trim();
  if (!phone || !code) return res.status(400).json({message: "phone and code are required."});

  const key = `profile:${req.auth.sub}:${phone}`;
  const stored = otpStore.get(key);
  if (!stored || stored.expiresAt < Date.now() || stored.code !== code) {
    return res.status(401).json({message: "OTP verification failed."});
  }
  otpStore.delete(key);

  const updated = await pool.query(
    "update users set phone = $2, updated_at = now() where id = $1 returning *",
    [req.auth.sub, phone],
  );
  const user = updated.rows[0];
  res.json({
    token: signSession(user),
    user: {id: user.id, role: user.role, name: user.name, email: user.email, phone: user.phone, city: user.city, referralCode: user.referral_code},
  });
});

app.put("/v1/me/email", requireAuth, async (req, res) => {
  const email = String(req.body?.email || "").trim().toLowerCase();
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({message: "A valid email is required."});
  }

  const existing = await pool.query(
    "select id from users where email = $1 and id != $2",
    [email, req.auth.sub],
  );
  if (existing.rows.length > 0) {
    return res.status(409).json({message: "This email is already registered to another account."});
  }

  const updated = await pool.query(
    "update users set email = $2, updated_at = now() where id = $1 returning *",
    [req.auth.sub, email],
  );
  const user = updated.rows[0];
  res.json({
    token: signSession(user),
    user: {id: user.id, role: user.role, name: user.name, email: user.email, phone: user.phone, city: user.city, referralCode: user.referral_code},
  });
});

app.put("/v1/me/profile", requireAuth, async (req, res) => {
  const {name = "", city = "", referralCode = null} = req.body || {};
  const updated = await pool.query(
    `update users
        set name = $2,
            city = $3,
            referral_code = $4,
            updated_at = now()
      where id = $1
      returning *`,
    [req.auth.sub, String(name).trim(), String(city).trim(), referralCode ? String(referralCode).trim().toUpperCase() : null],
  );
  const user = updated.rows[0];
  res.json({
    id: user.id,
    name: user.name,
    contact: user.phone || user.email || "",
    city: user.city,
    joinedAt: user.joined_at,
    referralCode: user.referral_code,
  });
});

app.post("/v1/admin/affiliates", requireAuth, requireAdmin, async (req, res) => {
  try {
    const {name, code, channel = ""} = req.body || {};
    const normalizedCode = String(code || "").trim().toUpperCase();
    const normalizedName = String(name || "").trim();
    const affiliateId = crypto.randomUUID();

    if (!normalizedName || !normalizedCode) {
      return res.status(400).json({message: "name and code are required."});
    }

    const result = await pool.query(
      `insert into affiliates (id, name, code, channel)
       values ($1, $2, $3, $4)
       returning *`,
      [affiliateId, normalizedName, normalizedCode, String(channel || "").trim()],
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    if (error?.code === "23505") {
      return res.status(409).json({message: "That referral code already exists. Generate a different code."});
    }
    res.status(500).json({message: error.message});
  }
});

app.post("/v1/admin/courses", requireAuth, requireAdmin, async (req, res) => {
  const payload = req.body || {};
  if (!payload.title || String(payload.title).trim() === "") {
    return res.status(400).json({message: "title is required."});
  }
  const price = Number(payload.price ?? 0);
  if (isNaN(price) || price < 0) {
    return res.status(400).json({message: "price must be a non-negative number."});
  }
  const result = await pool.query(
    `insert into courses
      (id, title, subtitle, description, price, validity_days, highlights, intro_video_url, hero_label, is_published, created_at, updated_at)
     values
      ($1, $2, $3, $4, $5, $6, $7::jsonb, $8, $9, true, now(), now())
     returning *`,
    [
      payload.id,
      payload.title,
      payload.subtitle || "",
      payload.description || "",
      Number(payload.price || 0),
      Number(payload.validityDays || 365),
      JSON.stringify(payload.highlights || []),
      payload.introVideoUrl || null,
      payload.heroLabel || "POPULAR",
    ],
  );
  res.status(201).json(result.rows[0]);
});

app.put("/v1/admin/courses/:courseId/video", requireAuth, requireAdmin, async (req, res) => {
  const {courseId} = req.params;
  const {videoUrl = null} = req.body || {};
  const result = await pool.query(
    `update courses
        set intro_video_url = $2,
            updated_at = now()
      where id = $1
      returning *`,
    [courseId, videoUrl],
  );
  res.json(result.rows[0]);
});

app.post("/v1/admin/import-paper", requireAuth, requireAdmin, async (req, res) => {
  try {
    const fileName = String(req.body?.fileName || "Imported Paper").trim();
    const rawText = String(req.body?.rawText || "").trim();
    const fileBase64 = typeof req.body?.fileBase64 === "string" ? req.body.fileBase64.trim() : "";
    if (!rawText && !fileBase64) {
      return res.status(400).json({message: "rawText or fileBase64 is required."});
    }

    const parsed = await parsePaperWithGemini({fileName, rawText, fileBase64});
    res.json(parsed);
  } catch (error) {
    res.status(500).json({message: error.message});
  }
});

app.post("/v1/admin/papers", requireAuth, requireAdmin, async (req, res) => {
  const {paper, questions} = req.body || {};
  const client = await pool.connect();
  try {
    await client.query("begin");
    await client.query(
      `insert into papers (id, course_id, title, duration_minutes, instructions, is_free_preview, created_at, updated_at)
       values ($1, $2, $3, $4, $5::jsonb, $6, now(), now())`,
      [
        paper.id,
        paper.courseId,
        paper.title,
        paper.durationMinutes,
        JSON.stringify(paper.instructions || []),
        !!paper.isFreePreview,
      ],
    );

    for (let index = 0; index < questions.length; index += 1) {
      const question = questions[index];
      const opts = question.options || [];
      const ci = Number(question.correctIndex);
      if (!Number.isInteger(ci) || ci < 0 || ci >= opts.length) {
        throw new Error(`Question ${index + 1}: correctIndex ${question.correctIndex} is out of range (${opts.length} options).`);
      }
      await client.query(
        `insert into questions
          (id, paper_id, section, prompt, prompt_segments, options, option_segments, correct_index, explanation, topic, concepts, difficulty, marks, negative_marks, sort_order, created_at)
         values
          ($1, $2, $3, $4, $5::jsonb, $6::jsonb, $7::jsonb, $8, $9, $10, $11::jsonb, $12, $13, $14, $15, now())`,
        [
          question.id,
          paper.id,
          question.section,
          question.prompt,
          JSON.stringify(question.promptSegments || []),
          JSON.stringify(opts),
          JSON.stringify(question.optionSegments || []),
          ci,
          question.explanation || null,
          question.topic || null,
          JSON.stringify(question.concepts || []),
          question.difficulty || "medium",
          Number(question.marks || 3),
          Number(question.negativeMarks || 1),
          index,
        ],
      );
    }

    await client.query("commit");
    res.status(201).json({ok: true});
  } catch (error) {
    await client.query("rollback");
    res.status(500).json({message: error.message});
  } finally {
    client.release();
  }
});

app.put("/v1/admin/papers/:paperId", requireAuth, requireAdmin, async (req, res) => {
  const {paperId} = req.params;
  const {paper, questions} = req.body || {};
  const client = await pool.connect();
  try {
    await client.query("begin");
    await client.query(
      `update papers
          set course_id = $2,
              title = $3,
              duration_minutes = $4,
              instructions = $5::jsonb,
              is_free_preview = $6,
              updated_at = now()
        where id = $1`,
      [
        paperId,
        paper.courseId,
        paper.title,
        paper.durationMinutes,
        JSON.stringify(paper.instructions || []),
        !!paper.isFreePreview,
      ],
    );

    await client.query("delete from questions where paper_id = $1", [paperId]);

    for (let index = 0; index < questions.length; index += 1) {
      const question = questions[index];
      await client.query(
        `insert into questions
          (id, paper_id, section, prompt, prompt_segments, options, option_segments, correct_index, explanation, topic, concepts, difficulty, marks, negative_marks, sort_order, created_at)
         values
          ($1, $2, $3, $4, $5::jsonb, $6::jsonb, $7::jsonb, $8, $9, $10, $11::jsonb, $12, $13, $14, $15, now())`,
        [
          question.id,
          paperId,
          question.section,
          question.prompt,
          JSON.stringify(question.promptSegments || []),
          JSON.stringify(question.options || []),
          JSON.stringify(question.optionSegments || []),
          question.correctIndex,
          question.explanation || null,
          question.topic || null,
          JSON.stringify(question.concepts || []),
          question.difficulty || "medium",
          Number(question.marks || 3),
          Number(question.negativeMarks || 1),
          index,
        ],
      );
    }

    await client.query("commit");
    res.json({ok: true});
  } catch (error) {
    await client.query("rollback");
    res.status(500).json({message: error.message});
  } finally {
    client.release();
  }
});

app.get("/v1/admin/allowlist", requireAuth, requireAdmin, async (req, res) => {
  try {
    const result = await pool.query("select * from admin_allowlist order by created_at asc");
    res.json({
      entries: result.rows.map((row) => ({
        id: row.id,
        label: row.label,
        email: row.email || null,
        phone: row.phone || null,
        isActive: row.is_active,
        createdAt: row.created_at,
      })),
    });
  } catch (error) {
    res.status(500).json({message: error.message});
  }
});

app.post("/v1/admin/allowlist", requireAuth, requireAdmin, async (req, res) => {
  try {
    const {label = "", email, phone} = req.body || {};
    const normalizedEmail = email ? String(email).trim().toLowerCase() : null;
    const normalizedPhone = phone ? normalizePhone(String(phone).trim()) : null;

    if (!normalizedEmail && !normalizedPhone) {
      return res.status(400).json({message: "Provide at least one of email or phone."});
    }

    const id = normalizedEmail || normalizedPhone;
    const normalizedLabel = String(label || "").trim() || id;

    const result = await pool.query(
      `insert into admin_allowlist (id, label, email, phone, is_active)
       values ($1, $2, $3, $4, true)
       on conflict (id) do update
         set label = excluded.label,
             email = coalesce(excluded.email, admin_allowlist.email),
             phone = coalesce(excluded.phone, admin_allowlist.phone),
             is_active = true
       returning *`,
      [id, normalizedLabel, normalizedEmail, normalizedPhone],
    );

    const row = result.rows[0];
    res.status(201).json({
      id: row.id,
      label: row.label,
      email: row.email || null,
      phone: row.phone || null,
      isActive: row.is_active,
      createdAt: row.created_at,
    });
  } catch (error) {
    res.status(500).json({message: error.message});
  }
});

app.delete("/v1/admin/allowlist/:entryId", requireAuth, requireAdmin, async (req, res) => {
  try {
    const {entryId} = req.params;
    await pool.query("delete from admin_allowlist where id = $1", [entryId]);
    res.json({});
  } catch (error) {
    res.status(500).json({message: error.message});
  }
});

app.post("/v1/attempts", requireAuth, async (req, res) => {
  const payload = req.body || {};
  await pool.query(
    `insert into attempts
      (id, student_id, course_id, paper_id, answers, section_scores, score, max_score, submitted_at)
     values ($1, $2, $3, $4, $5::jsonb, $6::jsonb, $7, $8, $9)`,
    [
      payload.id,
      req.auth.sub,
      payload.courseId,
      payload.paperId,
      JSON.stringify(payload.answers || {}),
      JSON.stringify(payload.sectionScores || {}),
      Number(payload.score || 0),
      Number(payload.maxScore || 0),
      payload.submittedAt,
    ],
  );
  res.status(201).json({ok: true});
});

app.post("/v1/exam-sessions", requireAuth, async (req, res) => {
  const payload = req.body || {};
  await pool.query(
    `insert into exam_sessions
      (id, student_id, course_id, paper_id, answers, remaining_seconds, current_question_index, started_at, updated_at)
     values ($1, $2, $3, $4, $5::jsonb, $6, $7, $8, $9)
     on conflict (id) do update
       set answers = excluded.answers,
           remaining_seconds = excluded.remaining_seconds,
           current_question_index = excluded.current_question_index,
           started_at = excluded.started_at,
           updated_at = excluded.updated_at`,
    [
      payload.id,
      req.auth.sub,
      payload.courseId,
      payload.paperId,
      JSON.stringify(payload.answers || {}),
      Number(payload.remainingSeconds || 0),
      Number(payload.currentQuestionIndex || 0),
      payload.startedAt,
      payload.updatedAt,
    ],
  );
  res.status(201).json({ok: true});
});

app.delete("/v1/exam-sessions/:sessionId", requireAuth, async (req, res) => {
  const {sessionId} = req.params;
  await pool.query(
    "delete from exam_sessions where id = $1 and student_id = $2",
    [sessionId, req.auth.sub],
  );
  res.json({ok: true});
});

app.post("/v1/support-messages", requireAuth, async (req, res) => {
  const payload = req.body || {};
  // Role is derived from the verified JWT, not from client payload.
  const isAdmin = req.auth.role === "admin";
  const senderRole = isAdmin ? "admin" : "student";
  const studentId = isAdmin
    ? (payload.studentId || req.auth.sub)
    : req.auth.sub;
  if (!payload.message || String(payload.message).trim() === "") {
    return res.status(400).json({message: "message is required."});
  }
  await pool.query(
    `insert into support_messages (id, student_id, sender_role, message, sent_at)
     values ($1, $2, $3, $4, $5)`,
    [payload.id, studentId, senderRole, String(payload.message).trim(), payload.sentAt],
  );
  res.status(201).json({ok: true});
});

app.post("/v1/payments/razorpay/order", requireAuth, async (req, res) => {
  if (!razorpayClient) {
    return res.status(501).json({message: "Razorpay is not configured on the server."});
  }

  const courseId = String(req.body?.courseId || "").trim();
  const course = await pool.query("select * from courses where id = $1 limit 1", [courseId]);
  if (course.rowCount === 0) {
    return res.status(404).json({message: "Course not found."});
  }

  const row = course.rows[0];
  const amount = Math.round(Number(row.price) * 100);
  const order = await razorpayClient.orders.create({
    amount,
    currency: "INR",
    receipt: `ml_${req.auth.sub}_${Date.now()}`,
    notes: {
      courseId,
      studentId: req.auth.sub,
      validityDays: String(row.validity_days),
    },
  });

  res.json({
    orderId: order.id,
    amount: order.amount,
    currency: order.currency,
    keyId: process.env.RAZORPAY_KEY_ID,
    name: "Merit Launchers",
    description: `${row.title} paper access`,
    contact: req.auth.phone || "",
    email: req.auth.email || "",
  });
});

app.post("/v1/payments/razorpay/verify", requireAuth, async (req, res) => {
  if (!razorpayClient) {
    return res.status(501).json({message: "Razorpay is not configured on the server."});
  }

  const courseId = String(req.body?.courseId || "").trim();
  const orderId = String(req.body?.orderId || "").trim();
  const paymentId = String(req.body?.paymentId || "").trim();
  const signature = String(req.body?.signature || "").trim();

  const expectedSignature = crypto
    .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
    .update(`${orderId}|${paymentId}`)
    .digest("hex");

  if (expectedSignature !== signature) {
    return res.status(403).json({message: "Payment signature verification failed."});
  }

  const course = await pool.query("select * from courses where id = $1 limit 1", [courseId]);
  if (course.rowCount === 0) {
    return res.status(404).json({message: "Course not found."});
  }

  const row = course.rows[0];
  const payment = await razorpayClient.payments.fetch(paymentId);
  if (!payment || payment.order_id !== orderId) {
    return res.status(400).json({message: "Payment order mismatch."});
  }

  const amount = Math.round(Number(row.price) * 100);
  if (Number(payment.amount) !== amount || payment.currency !== "INR") {
    return res.status(400).json({message: "Payment amount mismatch."});
  }

  const purchaseId = `razorpay_${paymentId}`;
  const verifiedAt = new Date();
  const validUntil = new Date(verifiedAt.getTime() + Number(row.validity_days) * 86400000);

  await pool.query(
    `insert into purchases
      (id, student_id, course_id, amount, purchased_at, receipt_number, valid_until, payment_provider, payment_id, payment_order_id, payment_signature, verified_at)
     values ($1, $2, $3, $4, $5, $6, $7, 'razorpay', $8, $9, $10, $11)
     on conflict (id) do update
       set payment_signature = excluded.payment_signature,
           verified_at = excluded.verified_at`,
    [
      purchaseId,
      req.auth.sub,
      courseId,
      Number(row.price),
      verifiedAt.toISOString(),
      `ML-${paymentId.slice(0, 10).toUpperCase()}`,
      validUntil.toISOString(),
      paymentId,
      orderId,
      signature,
      verifiedAt.toISOString(),
    ],
  );

  res.json({
    purchase: {
      id: purchaseId,
      student_id: req.auth.sub,
      course_id: courseId,
      amount: Number(row.price),
      purchased_at: verifiedAt.toISOString(),
      receipt_number: `ML-${paymentId.slice(0, 10).toUpperCase()}`,
      valid_until: validUntil.toISOString(),
      payment_provider: "razorpay",
      payment_id: paymentId,
      payment_order_id: orderId,
      payment_signature: signature,
      verified_at: verifiedAt.toISOString(),
    },
  });
});

// ── CMS (Blog) ────────────────────────────────────────────────────────────────

function requireCmsAuth(req, res, next) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;
  if (!token) return res.status(401).json({message: "Unauthorized"});
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    if (payload.role !== "cms_admin" && payload.role !== "admin") return res.status(403).json({message: "Forbidden"});
    req.cmsAuth = payload;
    next();
  } catch {
    res.status(401).json({message: "Invalid or expired token."});
  }
}

app.post("/v1/auth/password-login", (req, res) => {
  const {email = "", password = ""} = req.body || {};
  if (!CMS_ADMIN_EMAIL || !CMS_ADMIN_PASSWORD) {
    return res.status(503).json({message: "Admin credentials not configured on server."});
  }
  if (email.trim().toLowerCase() !== CMS_ADMIN_EMAIL || password !== CMS_ADMIN_PASSWORD) {
    return res.status(401).json({message: "Invalid email or password."});
  }
  const token = jwt.sign({role: "admin", email: CMS_ADMIN_EMAIL}, JWT_SECRET, {expiresIn: "30d"});
  res.json({
    token,
    user: {id: "admin", role: "admin", name: "Admin", email: CMS_ADMIN_EMAIL},
  });
});

app.post("/v1/cms/auth/login", (req, res) => {
  const {email = "", password = ""} = req.body || {};
  if (!CMS_ADMIN_EMAIL || !CMS_ADMIN_PASSWORD) {
    return res.status(503).json({message: "CMS admin credentials not configured on server."});
  }
  if (email.trim().toLowerCase() !== CMS_ADMIN_EMAIL || password !== CMS_ADMIN_PASSWORD) {
    return res.status(401).json({message: "Invalid email or password."});
  }
  const token = jwt.sign({role: "cms_admin", email: CMS_ADMIN_EMAIL}, JWT_SECRET, {expiresIn: "30d"});
  res.json({token});
});

// Public blog endpoints
app.get("/v1/cms/blogs", async (_req, res) => {
  const result = await pool.query(
    `select * from blogs where status = 'published' order by publish_date desc nulls last`,
  );
  res.json(result.rows);
});

app.get("/v1/cms/blogs/:slug", async (req, res) => {
  const result = await pool.query(
    `select * from blogs where slug = $1 and status = 'published'`,
    [req.params.slug],
  );
  if (!result.rows[0]) return res.status(404).json({message: "Not found."});
  res.json(result.rows[0]);
});

app.post("/v1/cms/blogs/:id/view", async (req, res) => {
  await pool.query("update blogs set views = views + 1 where id = $1", [req.params.id]);
  res.json({ok: true});
});

// Admin-only blog endpoints
app.get("/v1/cms/admin/blogs", requireCmsAuth, async (_req, res) => {
  const result = await pool.query("select * from blogs order by created_at desc");
  res.json(result.rows);
});

app.post("/v1/cms/admin/blogs", requireCmsAuth, async (req, res) => {
  const {title, slug, content, featured_image, author, category, tags, meta_description, status, publish_date} = req.body || {};
  const id = crypto.randomUUID();
  const result = await pool.query(
    `insert into blogs (id, title, slug, content, featured_image, author, category, tags, meta_description, status, publish_date)
     values ($1,$2,$3,$4,$5,$6,$7,$8::jsonb,$9,$10,$11) returning *`,
    [id, title, slug, content || "", featured_image || null, author || "Merit Launchers",
     category || "General", JSON.stringify(tags || []), meta_description || null,
     status || "draft", publish_date || null],
  );
  res.status(201).json(result.rows[0]);
});

app.put("/v1/cms/admin/blogs/:id", requireCmsAuth, async (req, res) => {
  const {title, slug, content, featured_image, author, category, tags, meta_description, status, publish_date} = req.body || {};
  const result = await pool.query(
    `update blogs set title=$1, slug=$2, content=$3, featured_image=$4, author=$5, category=$6,
       tags=$7::jsonb, meta_description=$8, status=$9, publish_date=$10, updated_at=now()
     where id=$11 returning *`,
    [title, slug, content || "", featured_image || null, author || "Merit Launchers",
     category || "General", JSON.stringify(tags || []), meta_description || null,
     status || "draft", publish_date || null, req.params.id],
  );
  if (!result.rows[0]) return res.status(404).json({message: "Not found."});
  res.json(result.rows[0]);
});

app.delete("/v1/cms/admin/blogs/:id", requireCmsAuth, async (req, res) => {
  await pool.query("delete from blogs where id = $1", [req.params.id]);
  res.json({ok: true});
});

// Image upload — receives JSON { data: base64, ext: "jpg" }
app.post("/v1/cms/admin/upload", requireCmsAuth, async (req, res) => {
  const {data, ext = "jpg"} = req.body || {};
  if (!data) return res.status(400).json({message: "No image data provided."});
  const allowedExts = new Set(["jpg", "jpeg", "png", "webp", "gif"]);
  const rawExt = String(ext).replace(/[^a-z0-9]/gi, "").toLowerCase().slice(0, 5);
  const safeExt = allowedExts.has(rawExt) ? rawExt : "jpg";
  // Check decoded size: base64 string length * 0.75 ≈ bytes
  if (data.length > 7 * 1024 * 1024 * 1.37) {
    return res.status(413).json({message: "Image too large. Maximum size is 7 MB."});
  }
  const filename = `${Date.now()}-${crypto.randomBytes(4).toString("hex")}.${safeExt}`;
  const filepath = path.join(BLOG_IMAGES_DIR, filename);
  fs.writeFileSync(filepath, Buffer.from(data, "base64"));
  res.json({url: `/uploads/${filename}`});
});

// ── Partner Dashboard Auth Middleware ────────────────────────────────────────

function requireMarketingAdminAuth(req, res, next) {
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith("Bearer ")) return res.status(401).json({message: "Unauthorized"});
  try {
    const payload = jwt.verify(auth.slice(7), JWT_SECRET);
    if (payload.role !== "marketing_admin") return res.status(403).json({message: "Forbidden"});
    req.marketingAdmin = payload;
    next();
  } catch { res.status(401).json({message: "Invalid token"}); }
}

function requirePartnerAuth(req, res, next) {
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith("Bearer ")) return res.status(401).json({message: "Unauthorized"});
  try {
    const payload = jwt.verify(auth.slice(7), JWT_SECRET);
    if (payload.role !== "partner") return res.status(403).json({message: "Forbidden"});
    req.partner = payload;
    next();
  } catch { res.status(401).json({message: "Invalid token"}); }
}

// ── Marketing Admin Endpoints ────────────────────────────────────────────────

app.post("/v1/marketing-admin/auth/login", async (req, res) => {
  const email = String(req.body?.email || "").trim().toLowerCase();
  const password = String(req.body?.password || "");
  if (!email || !password || email !== MARKETING_ADMIN_EMAIL.toLowerCase() || password !== MARKETING_ADMIN_PASSWORD) {
    return res.status(401).json({message: "Invalid credentials"});
  }
  const token = jwt.sign({role: "marketing_admin", email}, JWT_SECRET, {expiresIn: "30d"});
  res.json({token});
});

app.get("/v1/marketing-admin/overview", requireMarketingAdminAuth, async (req, res) => {
  const [affiliates, payouts, revenue] = await Promise.all([
    pool.query("SELECT COUNT(*) as count FROM affiliates WHERE login_email IS NOT NULL"),
    pool.query("SELECT COALESCE(SUM(commission_amount),0) as pending FROM commission_payouts WHERE status='pending'"),
    pool.query("SELECT COALESCE(SUM(amount),0) as total FROM purchases"),
  ]);
  res.json({
    totalPartners: parseInt(affiliates.rows[0].count),
    pendingPayouts: parseFloat(payouts.rows[0].pending),
    totalRevenue: parseFloat(revenue.rows[0].total),
  });
});

app.get("/v1/marketing-admin/commission-rates", requireMarketingAdminAuth, async (req, res) => {
  const result = await pool.query("SELECT * FROM partner_type_commissions ORDER BY partner_type");
  res.json({rates: result.rows});
});

app.put("/v1/marketing-admin/commission-rates", requireMarketingAdminAuth, async (req, res) => {
  const {rates} = req.body; // [{ partner_type, rate }]
  if (!Array.isArray(rates)) return res.status(400).json({message: "rates must be an array"});
  for (const {partner_type, rate} of rates) {
    await pool.query(
      "INSERT INTO partner_type_commissions (partner_type, rate, updated_at) VALUES ($1,$2,now()) ON CONFLICT (partner_type) DO UPDATE SET rate=$2, updated_at=now()",
      [partner_type, parseFloat(rate)],
    );
  }
  res.json({success: true});
});

app.get("/v1/marketing-admin/partners", requireMarketingAdminAuth, async (req, res) => {
  const result = await pool.query(`
    SELECT a.*,
      COALESCE(ptc.rate, 0) as current_slab,
      (SELECT COUNT(*) FROM users WHERE referral_code=a.code AND role='student') as total_referred,
      (SELECT COUNT(*) FROM purchases p JOIN users u ON p.student_id=u.id WHERE u.referral_code=a.code) as total_paid,
      (SELECT COALESCE(SUM(p.amount),0) FROM purchases p JOIN users u ON p.student_id=u.id WHERE u.referral_code=a.code) as total_revenue
    FROM affiliates a
    LEFT JOIN partner_type_commissions ptc ON a.partner_type = ptc.partner_type
    ORDER BY a.created_at DESC
  `);
  res.json({partners: result.rows});
});

app.get("/v1/marketing-admin/partners/:id", requireMarketingAdminAuth, async (req, res) => {
  const {id} = req.params;
  const [partner, students, payouts, clicks] = await Promise.all([
    pool.query(`SELECT a.*, COALESCE(ptc.rate, 0) as commission_rate FROM affiliates a LEFT JOIN partner_type_commissions ptc ON a.partner_type=ptc.partner_type WHERE a.id=$1`, [id]),
    pool.query(`SELECT u.*,
      (SELECT COUNT(*) FROM purchases WHERE student_id=u.id) as purchase_count,
      (SELECT COALESCE(SUM(amount),0) FROM purchases WHERE student_id=u.id) as total_spent,
      (SELECT COUNT(*) FROM attempts WHERE student_id=u.id) as attempt_count
      FROM users u WHERE u.referral_code=(SELECT code FROM affiliates WHERE id=$1) ORDER BY u.joined_at DESC`, [id]),
    pool.query("SELECT * FROM commission_payouts WHERE affiliate_id=$1 ORDER BY month DESC", [id]),
    pool.query("SELECT channel, COUNT(*) as clicks FROM referral_clicks WHERE affiliate_code=(SELECT code FROM affiliates WHERE id=$1) GROUP BY channel ORDER BY clicks DESC", [id]),
  ]);
  if (!partner.rows[0]) return res.status(404).json({message: "Not found"});
  const totalClicks = clicks.rows.reduce((s, r) => s + parseInt(r.clicks), 0);
  res.json({partner: partner.rows[0], students: students.rows, payouts: payouts.rows, clicks: clicks.rows, totalClicks});
});

app.post("/v1/marketing-admin/partners", requireMarketingAdminAuth, async (req, res) => {
  const {name, associate_id, partner_type, login_email, bank_details} = req.body;
  if (!name) return res.status(400).json({message: "Name is required"});
  if (!login_email) return res.status(400).json({message: "Login email is required"});
  const id = `aff_${Date.now()}`;
  // Auto-generate referral code from name
  const slug = name.replace(/\s+/g, "").toUpperCase().slice(0, 6);
  const code = `${slug}${Math.floor(1000 + Math.random() * 9000)}`;
  // Auto-generate a temporary password
  const tempPassword = Math.random().toString(36).slice(2, 8).toUpperCase() + Math.floor(10 + Math.random() * 90);
  const passwordHash = await bcrypt.hash(tempPassword, 10);
  await pool.query(
    `INSERT INTO affiliates (id, name, code, channel, associate_id, partner_type, login_email, login_password_hash, bank_details, created_at)
     VALUES ($1,$2,$3,'direct',$4,$5,$6,$7,$8,now())`,
    [id, name.trim(), code, associate_id || null, partner_type || "Education Associate", login_email.toLowerCase().trim(), passwordHash, JSON.stringify(bank_details || {})],
  );
  res.json({id, name: name.trim(), code, loginEmail: login_email.toLowerCase().trim(), tempPassword});
});

app.put("/v1/marketing-admin/partners/:id", requireMarketingAdminAuth, async (req, res) => {
  const {id} = req.params;
  const {name, code, channel, associate_id, partner_type, login_email, password, bank_details} = req.body;
  if (password) {
    const passwordHash = await bcrypt.hash(password, 10);
    await pool.query(
      `UPDATE affiliates SET name=$1, code=$2, channel=$3, associate_id=$4, partner_type=$5, login_email=$6, bank_details=$7, login_password_hash=$9 WHERE id=$8`,
      [name, code, channel, associate_id, partner_type, login_email, JSON.stringify(bank_details || {}), id, passwordHash],
    );
  } else {
    await pool.query(
      `UPDATE affiliates SET name=$1, code=$2, channel=$3, associate_id=$4, partner_type=$5, login_email=$6, bank_details=$7 WHERE id=$8`,
      [name, code, channel, associate_id, partner_type, login_email, JSON.stringify(bank_details || {}), id],
    );
  }
  res.json({success: true});
});


app.get("/v1/marketing-admin/payouts", requireMarketingAdminAuth, async (req, res) => {
  const result = await pool.query(`
    SELECT cp.*, a.name as affiliate_name, a.code as affiliate_code
    FROM commission_payouts cp JOIN affiliates a ON cp.affiliate_id=a.id
    ORDER BY cp.month DESC, a.name ASC
  `);
  res.json({payouts: result.rows});
});

app.post("/v1/marketing-admin/payouts/generate", requireMarketingAdminAuth, async (req, res) => {
  const {month} = req.body;
  const [year, mon] = month.split("-").map(Number);
  const monthStart = new Date(year, mon - 1, 1);
  const monthEnd = new Date(year, mon, 0);

  const affiliates = await pool.query("SELECT * FROM affiliates");
  const generated = [];

  for (const aff of affiliates.rows) {
    const existing = await pool.query("SELECT id FROM commission_payouts WHERE affiliate_id=$1 AND month=$2", [aff.id, month]);
    if (existing.rows.length > 0) continue;

    const revenue = await pool.query(`
      SELECT COALESCE(SUM(p.amount), 0) as total
      FROM purchases p JOIN users u ON p.student_id=u.id
      WHERE u.referral_code=$1
      AND date_trunc('month', p.purchased_at) = date_trunc('month', $2::date)
    `, [aff.code, `${month}-01`]);

    const grossRevenue = parseFloat(revenue.rows[0].total);
    if (grossRevenue === 0) continue;

    const typeRate = await pool.query(
      "SELECT rate FROM partner_type_commissions WHERE partner_type=$1",
      [aff.partner_type],
    );
    const rate = typeRate.rows[0] ? parseFloat(typeRate.rows[0].rate) : 0;
    if (rate === 0) continue;

    const commissionAmount = grossRevenue * (rate / 100);

    await pool.query(`
      INSERT INTO commission_payouts (id, affiliate_id, month, gross_revenue, weighted_commission_rate, commission_amount, status)
      VALUES ($1,$2,$3,$4,$5,$6,'pending')
    `, [`pay_${Date.now()}_${aff.id}`, aff.id, month, grossRevenue, rate, parseFloat(commissionAmount.toFixed(2))]);

    generated.push({affiliate: aff.name, amount: commissionAmount});
  }
  res.json({generated});
});

app.put("/v1/marketing-admin/payouts/:id/pay", requireMarketingAdminAuth, async (req, res) => {
  const {id} = req.params;
  const {paid_amount, notes} = req.body;
  await pool.query(
    "UPDATE commission_payouts SET status='paid', paid_amount=$1, paid_at=now(), paid_by=$2, notes=$3 WHERE id=$4",
    [paid_amount, req.marketingAdmin.email, notes, id],
  );
  res.json({success: true});
});

app.get("/v1/marketing-admin/toolkit", requireMarketingAdminAuth, async (req, res) => {
  const result = await pool.query("SELECT * FROM partner_toolkit_files ORDER BY created_at DESC");
  res.json({files: result.rows});
});

app.post("/v1/marketing-admin/toolkit", requireMarketingAdminAuth, async (req, res) => {
  const {title, category, data, ext, file_name} = req.body;
  if (!fs.existsSync(TOOLKIT_FILES_DIR)) fs.mkdirSync(TOOLKIT_FILES_DIR, {recursive: true});
  const filename = `${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`;
  const buffer = Buffer.from(data, "base64");
  fs.writeFileSync(path.join(TOOLKIT_FILES_DIR, filename), buffer);
  const id = `tkf_${Date.now()}`;
  await pool.query(
    "INSERT INTO partner_toolkit_files (id, title, category, file_url, file_name, uploaded_by) VALUES ($1,$2,$3,$4,$5,$6)",
    [id, title, category, `/toolkit-files/${filename}`, file_name, req.marketingAdmin.email],
  );
  const result = await pool.query("SELECT * FROM partner_toolkit_files WHERE id=$1", [id]);
  res.json(result.rows[0]);
});

app.delete("/v1/marketing-admin/toolkit/:id", requireMarketingAdminAuth, async (req, res) => {
  const result = await pool.query("SELECT * FROM partner_toolkit_files WHERE id=$1", [req.params.id]);
  if (result.rows[0]) {
    const filePath = path.join(TOOLKIT_FILES_DIR, path.basename(result.rows[0].file_url));
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    await pool.query("DELETE FROM partner_toolkit_files WHERE id=$1", [req.params.id]);
  }
  res.json({success: true});
});

// ── Partner Endpoints ────────────────────────────────────────────────────────

app.post("/v1/partner/auth/login", async (req, res) => {
  const {email, password} = req.body || {};
  const result = await pool.query("SELECT * FROM affiliates WHERE login_email=$1", [email]);
  if (!result.rows[0] || !result.rows[0].login_password_hash) return res.status(401).json({message: "Invalid credentials"});
  if (result.rows[0].status === "pending") return res.status(403).json({message: "Account pending approval. You'll receive login credentials by email once approved."});
  const valid = await bcrypt.compare(password, result.rows[0].login_password_hash);
  if (!valid) return res.status(401).json({message: "Invalid credentials"});
  const token = jwt.sign({role: "partner", affiliateId: result.rows[0].id, code: result.rows[0].code, email}, JWT_SECRET, {expiresIn: "30d"});
  res.json({token, affiliate: {id: result.rows[0].id, name: result.rows[0].name, code: result.rows[0].code}});
});

app.post("/v1/partner/change-password", requirePartnerAuth, async (req, res) => {
  const {current_password, new_password} = req.body || {};
  if (!current_password || !new_password) return res.status(400).json({message: "Both current and new password are required"});
  if (new_password.length < 6) return res.status(400).json({message: "New password must be at least 6 characters"});
  const result = await pool.query("SELECT login_password_hash FROM affiliates WHERE id=$1", [req.partner.affiliateId]);
  const hash = result.rows[0]?.login_password_hash;
  if (!hash || !(await bcrypt.compare(current_password, hash))) {
    return res.status(401).json({message: "Current password is incorrect"});
  }
  const newHash = await bcrypt.hash(new_password, 10);
  await pool.query("UPDATE affiliates SET login_password_hash=$1 WHERE id=$2", [newHash, req.partner.affiliateId]);
  res.json({success: true});
});

app.get("/v1/partner/me", requirePartnerAuth, async (req, res) => {
  const result = await pool.query(`
    SELECT a.*, COALESCE(ptc.rate, 0) as current_slab
    FROM affiliates a LEFT JOIN partner_type_commissions ptc ON a.partner_type=ptc.partner_type
    WHERE a.id=$1`, [req.partner.affiliateId]);
  if (!result.rows[0]) return res.status(404).json({message: "Not found"});
  const {login_password_hash, ...safe} = result.rows[0];
  res.json(safe);
});

app.get("/v1/partner/stats", requirePartnerAuth, async (req, res) => {
  const code = req.partner.code;
  const [clicks, students, paid, revenue, attempts, currentSlab] = await Promise.all([
    pool.query("SELECT channel, COUNT(*) as count FROM referral_clicks WHERE affiliate_code=$1 GROUP BY channel", [code]),
    pool.query("SELECT COUNT(*) as count FROM users WHERE referral_code=$1 AND role='student'", [code]),
    pool.query("SELECT COUNT(DISTINCT p.student_id) as count FROM purchases p JOIN users u ON p.student_id=u.id WHERE u.referral_code=$1", [code]),
    pool.query("SELECT COALESCE(SUM(p.amount),0) as total FROM purchases p JOIN users u ON p.student_id=u.id WHERE u.referral_code=$1", [code]),
    pool.query("SELECT COUNT(DISTINCT a.student_id) as count FROM attempts a JOIN users u ON a.student_id=u.id WHERE u.referral_code=$1", [code]),
    pool.query("SELECT ptc.rate FROM partner_type_commissions ptc JOIN affiliates a ON a.partner_type=ptc.partner_type WHERE a.id=$1", [req.partner.affiliateId]),
  ]);
  const totalClicks = clicks.rows.reduce((s, r) => s + parseInt(r.count), 0);
  const channelBreakdown = clicks.rows;
  const totalStudents = parseInt(students.rows[0].count);
  const paidStudents = parseInt(paid.rows[0].count);
  const totalRevenue = parseFloat(revenue.rows[0].total);
  const currentSlabRate = currentSlab.rows[0] ? parseFloat(currentSlab.rows[0].rate) : 0;
  const [paidComm, pendingComm] = await Promise.all([
    pool.query("SELECT COALESCE(SUM(paid_amount),0) as total FROM commission_payouts WHERE affiliate_id=$1 AND status='paid'", [req.partner.affiliateId]),
    pool.query("SELECT COALESCE(SUM(commission_amount),0) as total FROM commission_payouts WHERE affiliate_id=$1 AND status='pending'", [req.partner.affiliateId]),
  ]);
  res.json({
    totalClicks,
    channelBreakdown,
    totalStudents, paidStudents,
    freeStudents: totalStudents - paidStudents,
    totalRevenue,
    currentSlabRate,
    totalCommission: totalRevenue * (currentSlabRate / 100),
    paidCommission: parseFloat(paidComm.rows[0].total),
    pendingCommission: parseFloat(pendingComm.rows[0].total),
    totalAttempts: parseInt(attempts.rows[0].count),
  });
});

app.get("/v1/partner/students", requirePartnerAuth, async (req, res) => {
  const code = req.partner.code;
  const limit = Math.min(parseInt(req.query.limit) || 50, 200);
  const offset = parseInt(req.query.offset) || 0;
  const totalCount = await pool.query("SELECT COUNT(*) FROM users WHERE referral_code=$1 AND role='student'", [code]);
  const students = await pool.query(`
    SELECT u.id, u.name, u.email, u.phone, u.city, u.joined_at,
      (SELECT COUNT(*) FROM purchases WHERE student_id=u.id) as purchase_count,
      (SELECT COALESCE(SUM(amount),0) FROM purchases WHERE student_id=u.id) as total_spent,
      (SELECT COUNT(*) FROM attempts WHERE student_id=u.id) as attempt_count,
      (SELECT COUNT(*) FROM attempts WHERE student_id=u.id AND submitted_at > now() - interval '7 days') as recent_attempts
    FROM users u WHERE u.referral_code=$1 ORDER BY u.joined_at DESC LIMIT $2 OFFSET $3`, [code, limit, offset]);

  const cities = await pool.query(
    "SELECT city, COUNT(*) as count FROM users WHERE referral_code=$1 AND role='student' GROUP BY city ORDER BY count DESC",
    [code],
  );

  const examInterest = await pool.query(`
    SELECT c.title, COUNT(DISTINCT p.student_id) as count
    FROM purchases p JOIN users u ON p.student_id=u.id JOIN courses c ON p.course_id=c.id
    WHERE u.referral_code=$1 GROUP BY c.title ORDER BY count DESC`, [code]);

  res.json({students: students.rows, total: parseInt(totalCount.rows[0].count), limit, offset, cityBreakdown: cities.rows, examInterest: examInterest.rows});
});

app.get("/v1/partner/monthly", requirePartnerAuth, async (req, res) => {
  const code = req.partner.code;
  const monthly = await pool.query(`
    SELECT
      to_char(date_trunc('month', p.purchased_at), 'YYYY-MM') as month,
      to_char(date_trunc('month', p.purchased_at), 'Mon YYYY') as month_label,
      COUNT(DISTINCT p.student_id) as students,
      COALESCE(SUM(p.amount), 0) as revenue
    FROM purchases p JOIN users u ON p.student_id=u.id
    WHERE u.referral_code=$1
    GROUP BY date_trunc('month', p.purchased_at)
    ORDER BY date_trunc('month', p.purchased_at) ASC`, [code]);

  const rows = monthly.rows.map((row, i) => {
    const prev = monthly.rows[i - 1];
    const growth = prev && parseFloat(prev.revenue) > 0
      ? (((parseFloat(row.revenue) - parseFloat(prev.revenue)) / parseFloat(prev.revenue)) * 100).toFixed(1)
      : null;
    return {...row, growth};
  });

  res.json({monthly: rows});
});

app.get("/v1/partner/courses", requirePartnerAuth, async (req, res) => {
  const code = req.partner.code;
  const result = await pool.query(`
    SELECT c.title, c.price, COUNT(DISTINCT p.student_id) as students, COALESCE(SUM(p.amount),0) as revenue
    FROM purchases p JOIN users u ON p.student_id=u.id JOIN courses c ON p.course_id=c.id
    WHERE u.referral_code=$1 GROUP BY c.title, c.price ORDER BY revenue DESC`, [code]);
  res.json({courses: result.rows});
});

app.get("/v1/partner/payouts", requirePartnerAuth, async (req, res) => {
  const result = await pool.query("SELECT * FROM commission_payouts WHERE affiliate_id=$1 ORDER BY month DESC", [req.partner.affiliateId]);
  res.json({payouts: result.rows});
});

app.get("/v1/partner/leaderboard", requirePartnerAuth, async (req, res) => {
  const result = await pool.query(`
    SELECT a.name, a.id,
      COUNT(DISTINCT u.id) as students_this_month,
      COALESCE(SUM(p.amount), 0) as revenue_this_month
    FROM affiliates a
    LEFT JOIN users u ON u.referral_code=a.code AND u.joined_at >= date_trunc('month', now())
    LEFT JOIN purchases p ON p.student_id=u.id AND p.purchased_at >= date_trunc('month', now())
    WHERE a.login_email IS NOT NULL
    GROUP BY a.id, a.name
    ORDER BY revenue_this_month DESC, students_this_month DESC
    LIMIT 20`);

  const rows = result.rows.map((r, i) => ({
    rank: i + 1,
    name: r.name,
    isMe: r.id === req.partner.affiliateId,
    studentsThisMonth: parseInt(r.students_this_month),
    revenueThisMonth: parseFloat(r.revenue_this_month),
  }));

  res.json({leaderboard: rows});
});

app.get("/v1/partner/milestones", requirePartnerAuth, async (req, res) => {
  const code = req.partner.code;
  const result = await pool.query("SELECT COUNT(*) as count FROM users WHERE referral_code=$1 AND role='student'", [code]);
  const totalStudents = parseInt(result.rows[0].count);

  const milestones = [
    {target: 50, reward: "Certificate", label: "50 Students"},
    {target: 100, reward: "₹5,000 Bonus", label: "100 Students"},
    {target: 300, reward: "₹20,000 Bonus", label: "300 Students"},
    {target: 1000, reward: "Elite Partner Status", label: "1000 Students"},
  ];

  const enriched = milestones.map((m) => ({
    ...m,
    achieved: totalStudents >= m.target,
    progress: Math.min((totalStudents / m.target) * 100, 100),
  }));

  res.json({totalStudents, milestones: enriched});
});

app.get("/v1/partner/toolkit", requirePartnerAuth, async (req, res) => {
  const result = await pool.query("SELECT id, title, category, file_url, file_name, created_at FROM partner_toolkit_files ORDER BY category, created_at DESC");
  res.json({files: result.rows});
});

// Public: self-register as partner via referral link
app.post("/v1/partner/join", async (req, res) => {
  const {name, phone, email, city, partner_type, password, referrer_code} = req.body || {};
  if (!name || !phone || !referrer_code) return res.status(400).json({message: "Name, phone, and referrer code are required"});
  if (!email) return res.status(400).json({message: "Email is required to create your login"});
  if (!password || password.length < 6) return res.status(400).json({message: "Password must be at least 6 characters"});
  const referrer = await pool.query("SELECT id FROM affiliates WHERE code=$1 AND status='active'", [referrer_code.toUpperCase()]);
  if (!referrer.rows[0]) return res.status(404).json({message: "Invalid referral code"});
  const slug = name.replace(/\s+/g, "").toUpperCase().slice(0, 6);
  const code = `${slug}${Math.floor(1000 + Math.random() * 9000)}`;
  const id = `aff_${Date.now()}`;
  const passwordHash = await bcrypt.hash(password, 10);
  await pool.query(
    `INSERT INTO affiliates (id, name, code, channel, partner_type, login_email, login_password_hash, phone, referred_by_affiliate_id, status, created_at)
     VALUES ($1,$2,$3,'direct',$4,$5,$6,$7,$8,'pending',now())`,
    [id, name.trim(), code, partner_type || "Education Associate", email.toLowerCase().trim(), passwordHash, phone, referrer.rows[0].id],
  );
  res.json({success: true, message: "Application submitted! You can log in once the person who referred you approves your application."});
});

// Partner network: sub-partners + upline
app.get("/v1/partner/network", requirePartnerAuth, async (req, res) => {
  const affiliateId = req.partner.affiliateId;
  const [subPartners, me] = await Promise.all([
    pool.query(`
      SELECT a.id, a.name, a.code, a.associate_id, a.partner_type, a.status, a.created_at,
        COALESCE(ptc.rate, 0) as current_slab,
        (SELECT COUNT(*) FROM users WHERE referral_code=a.code AND role='student') as total_students,
        (SELECT COALESCE(SUM(p.amount),0) FROM purchases p JOIN users u ON p.student_id=u.id WHERE u.referral_code=a.code) as total_revenue,
        (SELECT COUNT(*) FROM affiliates WHERE referred_by_affiliate_id=a.id) as sub_partner_count
      FROM affiliates a
      LEFT JOIN partner_type_commissions ptc ON a.partner_type=ptc.partner_type
      WHERE a.referred_by_affiliate_id=$1 ORDER BY a.created_at DESC
    `, [affiliateId]),
    pool.query("SELECT referred_by_affiliate_id FROM affiliates WHERE id=$1", [affiliateId]),
  ]);
  let upline = null;
  if (me.rows[0]?.referred_by_affiliate_id) {
    const u = await pool.query(
      "SELECT id, name, code, associate_id, partner_type, created_at FROM affiliates WHERE id=$1",
      [me.rows[0].referred_by_affiliate_id],
    );
    upline = u.rows[0] || null;
  }
  res.json({subPartners: subPartners.rows, upline});
});

// Partner: list pending applications from people who used their onboarding link
app.get("/v1/partner/pending", requirePartnerAuth, async (req, res) => {
  const result = await pool.query(
    `SELECT id, name, code, partner_type, login_email, phone, created_at
     FROM affiliates WHERE referred_by_affiliate_id=$1 AND status='pending' ORDER BY created_at DESC`,
    [req.partner.affiliateId],
  );
  res.json({pending: result.rows});
});

// Partner: approve a pending application
app.post("/v1/partner/pending/:id/approve", requirePartnerAuth, async (req, res) => {
  const {id} = req.params;
  const check = await pool.query(
    "SELECT * FROM affiliates WHERE id=$1 AND referred_by_affiliate_id=$2 AND status='pending'",
    [id, req.partner.affiliateId],
  );
  if (!check.rows[0]) return res.status(403).json({message: "Not found or already approved"});
  const aff = check.rows[0];
  await pool.query("UPDATE affiliates SET status='active' WHERE id=$1", [id]);
  res.json({success: true, name: aff.name, loginEmail: aff.login_email});
});

// View a specific sub-partner's performance
app.get("/v1/partner/sub-partners/:id", requirePartnerAuth, async (req, res) => {
  const {id} = req.params;
  const check = await pool.query("SELECT * FROM affiliates WHERE id=$1 AND referred_by_affiliate_id=$2", [id, req.partner.affiliateId]);
  if (!check.rows[0]) return res.status(403).json({message: "Not your sub-partner"});
  const aff = check.rows[0];
  const [students, payouts, clicks, monthly, typeRate] = await Promise.all([
    pool.query(`
      SELECT u.id, u.name, u.city, u.joined_at,
        (SELECT COUNT(*) FROM purchases WHERE student_id=u.id) as purchase_count,
        (SELECT COALESCE(SUM(amount),0) FROM purchases WHERE student_id=u.id) as total_spent
      FROM users u WHERE u.referral_code=$1 ORDER BY u.joined_at DESC LIMIT 50`, [aff.code]),
    pool.query("SELECT month, commission_amount, status, paid_amount, paid_at FROM commission_payouts WHERE affiliate_id=$1 ORDER BY month DESC", [id]),
    pool.query("SELECT channel, COUNT(*) as clicks FROM referral_clicks WHERE affiliate_code=$1 GROUP BY channel ORDER BY clicks DESC", [aff.code]),
    pool.query(`
      SELECT to_char(date_trunc('month', p.purchased_at), 'Mon YYYY') as month_label,
        COUNT(DISTINCT p.student_id) as students, COALESCE(SUM(p.amount),0) as revenue
      FROM purchases p JOIN users u ON p.student_id=u.id WHERE u.referral_code=$1
      GROUP BY date_trunc('month', p.purchased_at)
      ORDER BY date_trunc('month', p.purchased_at) ASC`, [aff.code]),
    pool.query("SELECT rate FROM partner_type_commissions WHERE partner_type=$1", [aff.partner_type]),
  ]);
  const totalStudents = parseInt((await pool.query("SELECT COUNT(*) as c FROM users WHERE referral_code=$1 AND role='student'", [aff.code])).rows[0].c);
  const totalRevenue = parseFloat((await pool.query("SELECT COALESCE(SUM(p.amount),0) as t FROM purchases p JOIN users u ON p.student_id=u.id WHERE u.referral_code=$1", [aff.code])).rows[0].t);
  const currentSlab = typeRate.rows[0] ? parseFloat(typeRate.rows[0].rate) : 0;
  const {login_password_hash, login_email, ...safeParter} = aff;
  const totalClicks = clicks.rows.reduce((s, r) => s + parseInt(r.clicks), 0);
  res.json({partner: safeParter, students: students.rows, payouts: payouts.rows, clicks: clicks.rows, totalClicks, monthly: monthly.rows, totalStudents, totalRevenue, currentSlab});
});

// MA: list pending (self-registered) partners
app.get("/v1/marketing-admin/pending", requireMarketingAdminAuth, async (req, res) => {
  const result = await pool.query(`
    SELECT a.id, a.name, a.code, a.partner_type, a.status, a.created_at,
      b.name as referred_by_name, b.code as referred_by_code
    FROM affiliates a LEFT JOIN affiliates b ON a.referred_by_affiliate_id=b.id
    WHERE a.status='pending' ORDER BY a.created_at DESC
  `);
  res.json({pending: result.rows});
});


app.get("/v1/marketing-admin/network", requireMarketingAdminAuth, async (req, res) => {
  const result = await pool.query(`
    SELECT
      a.id, a.name, a.code, a.partner_type, a.status,
      a.referred_by_affiliate_id, a.created_at,
      COALESCE(ptc.rate, 0) as commission_rate,
      (SELECT COUNT(*) FROM users WHERE referral_code=a.code AND role='student') as total_students,
      (SELECT COALESCE(SUM(p.amount),0) FROM purchases p JOIN users u ON p.student_id=u.id WHERE u.referral_code=a.code) as total_revenue,
      (SELECT COUNT(*) FROM referral_clicks WHERE affiliate_code=a.code) as total_clicks
    FROM affiliates a
    LEFT JOIN partner_type_commissions ptc ON a.partner_type=ptc.partner_type
    ORDER BY a.created_at ASC
  `);

  // Build nested tree in JS — O(n) with a map
  const map = {};
  result.rows.forEach((p) => { map[p.id] = { ...p, children: [] }; });
  const roots = [];
  result.rows.forEach((p) => {
    if (p.referred_by_affiliate_id && map[p.referred_by_affiliate_id]) {
      map[p.referred_by_affiliate_id].children.push(map[p.id]);
    } else {
      roots.push(map[p.id]);
    }
  });

  res.json({ tree: roots });
});

// ── Referral tracking ────────────────────────────────────────────────────────

app.get("/v1/referral/:code/:channel?", async (req, res) => {
  const {code, channel = "direct"} = req.params;
  const ip = req.headers["x-forwarded-for"]?.split(",")[0] || req.socket.remoteAddress || "unknown";
  const ipHash = crypto.createHash("sha256").update(ip).digest("hex").slice(0, 16);

  try {
    await pool.query(
      `INSERT INTO referral_clicks (id, affiliate_code, channel, ip_hash, click_date)
       VALUES ($1,$2,$3,$4,CURRENT_DATE)
       ON CONFLICT (affiliate_code, channel, ip_hash, click_date) DO NOTHING`,
      [`rc_${Date.now()}`, code.toUpperCase(), channel, ipHash],
    );
  } catch (e) {
    console.error("[referral-click]", e.message);
  }

  // Redirect to Play Store with referrer param so the app can read it on first install
  const referrer = encodeURIComponent(`${code.toUpperCase()}:${channel}`);
  const destination = PLAYSTORE_URL
    ? `${PLAYSTORE_URL}&referrer=${referrer}`
    : "/";
  res.redirect(destination);
});

app.use((err, req, res, _next) => {
  console.error("[express-error]", err);
  res.status(500).json({message: err.message || "Internal server error."});
});

async function start() {
  await ensureRuntimeSchema();
  app.listen(PORT, () => {
    console.log(`Merit Launchers API listening on port ${PORT}`);
  });
}

start().catch((error) => {
  console.error("Failed to start Merit Launchers API", error);
  process.exit(1);
});
