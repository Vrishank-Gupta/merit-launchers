import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";

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
}

function signSession(user) {
  return jwt.sign(
    {
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
  if (!trimmed) {
    return "";
  }
  if (trimmed.startsWith("+")) {
    return trimmed;
  }
  const digits = trimmed.replaceAll(/\D/g, "");
  if (digits.length === 10) {
    return `+91${digits}`;
  }
  if (digits.startsWith("91")) {
    return `+${digits}`;
  }
  return `+${digits}`;
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
            "You convert messy exam-paper text into structured JSON for an exam authoring tool. The input comes from DOCX/TXT extraction and may contain broken line wraps, flattened tables, Hindi and English mixed text, raw LaTeX, Unicode math, and separate answer-key sections. Preserve the source wording and symbols exactly as text. Do not solve, simplify, translate, or rewrite the academic content. Extract every valid multiple-choice question you can find. Each valid question must have exactly four options in the original order. If an answer key is present anywhere in the document, map it to the correct question and return the answer label as correctAnswer using only A, B, C, or D. Also return correctIndex only when you can map the option position confidently. For each question, classify the most likely topic and up to 6 concise concepts/skills, and assign difficulty as easy, medium, or hard. Use a visible section heading when present, otherwise use the nearest topical heading, otherwise use General. Ignore branding, page numbers, decorative text, duplicate headers or footers, and explanatory commentary that is not part of the paper.",
        },
      ],
    },
    contents: [
      {
        role: "user",
        parts: [
          {
          text:
              `Return one JSON object only. No markdown fences. No prose.\n\nRequired JSON shape:\n{\n  "title": string,\n  "instructions": string[],\n  "questions": [\n    {\n      "questionNumber": string|null,\n      "section": string,\n      "prompt": string,\n      "options": [string, string, string, string],\n      "topic": string|null,\n      "concepts": string[],\n      "difficulty": "easy"|"medium"|"hard"|null,\n      "explanation": string|null,\n      "correctAnswer": "A"|"B"|"C"|"D"|null,\n      "correctIndex": 0|1|2|3|null\n    }\n  ]\n}\n\nRules:\n- Extract all valid multiple-choice questions from the supplied document package.\n- Do not merge multiple questions into one.\n- Do not invent options or answers.\n- Preserve Hindi, English, equations, LaTeX, braces, symbols, and office-math meaning exactly as text.\n- If OFFICE_MATH_XML_BLOCKS exist, use them as math ground truth when HTML or text drops symbols.\n- Remove only option label markers like A., (A), A).\n- If answers exist inline or in an answer key, map them.\n- If answer is unclear, return null for correctAnswer and correctIndex.\n- topic should be the main chapter or subject focus of the question.\n- concepts should be short mentor-friendly labels like derivative test, matrix determinant, domain of relation, probability conditionality.\n- difficulty should be a best-effort classification.\n- explanation is optional and should only be a very short hint or solution cue if the document clearly provides it.\n- Use section headings when present.\n\n${extracted.llmSourceLabel}:\n${llmSource || "(empty)"}`,
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
    const role = req.body?.role === "admin" ? "admin" : "student";
    if (!idToken) {
      return res.status(400).json({message: "idToken is required."});
    }

    const ticket = await googleClient.verifyIdToken({
      idToken,
      audience: GOOGLE_CLIENT_IDS,
    });
    const payload = ticket.getPayload();
    if (!payload) {
      return res.status(401).json({message: "Google token could not be verified."});
    }

    const email = (payload.email || "").toLowerCase();
    const phone = payload.phone_number || "";

    if (role === "admin") {
      const allowlisted = await findAdminAllowlist({email, phone});
      if (!allowlisted) {
        return res.status(403).json({message: "This account is not allowlisted for admin access."});
      }
    }

    const user = await ensureUser({
      role,
      name: payload.name || "",
      email,
      phone,
      googleSub: payload.sub,
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

  if (OTP_PROVIDER !== "mock") {
    return res.status(501).json({
      message: "OTP provider is not configured yet. Keep Google sign-in primary and wire your SMS vendor next.",
    });
  }

  otpStore.set(phone, {
    code: OTP_TEST_CODE,
    role,
    expiresAt: Date.now() + 10 * 60 * 1000,
  });

  res.json({
    ok: true,
    message: "OTP generated in mock mode.",
    devCode: process.env.NODE_ENV === "production" ? undefined : OTP_TEST_CODE,
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

  if (!stored || stored.role !== role || stored.expiresAt < Date.now() || stored.code !== code) {
    return res.status(401).json({message: "OTP verification failed."});
  }

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
  const {id, name, code, channel = ""} = req.body || {};
  const result = await pool.query(
    `insert into affiliates (id, name, code, channel)
     values ($1, $2, $3, $4)
     returning *`,
    [id, name, code, channel],
  );
  res.status(201).json(result.rows[0]);
});

app.post("/v1/admin/courses", requireAuth, requireAdmin, async (req, res) => {
  const payload = req.body || {};
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
  await pool.query(
    `insert into support_messages (id, student_id, sender_role, message, sent_at)
     values ($1, $2, $3, $4, $5)`,
    [payload.id, req.auth.sub, payload.senderRole, payload.message, payload.sentAt],
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
