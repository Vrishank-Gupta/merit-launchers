import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import {fileURLToPath} from 'url';

import {GoogleGenAI, createPartFromText, createPartFromUri} from '@google/genai';
import pg from 'pg';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, '..', '..');

const ROOT = String.raw`C:\Users\VRISHANK\Downloads\CUET -20260327T154403Z-3-001\CUET`;
const COURSE_ID = 'cuet';
const REPORT_PATH = path.join(repoRoot, 'docs', 'cuet_import_report.json');
const OUTPUT_PATH = path.join(repoRoot, 'docs', 'cuet_recovery_report.json');

function loadEnv() {
  const envPath = path.join(repoRoot, 'server.env');
  const env = fs.readFileSync(envPath, 'utf8');
  for (const line of env.split(/\r?\n/)) {
    if (!line || line.trim().startsWith('#') || !line.includes('=')) continue;
    const idx = line.indexOf('=');
    const key = line.slice(0, idx);
    const value = line.slice(idx + 1);
    if (!(key in process.env)) process.env[key] = value;
  }
}

function dbUrl() {
  return String(process.env.DATABASE_URL || '').replace('@postgres:5432/', '@localhost:5432/');
}

function normalizeKey(value) {
  return String(value || '')
    .toLowerCase()
    .replace(/\.pdf$/i, '')
    .replace(/[().]/g, ' ')
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function slugify(value) {
  return String(value || '')
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-+/g, '-');
}

function shortHash(value) {
  return crypto.createHash('md5').update(String(value)).digest('hex').slice(0, 8);
}

function walk(dir, files = []) {
  for (const entry of fs.readdirSync(dir, {withFileTypes: true})) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, files);
    else if (entry.isFile() && path.extname(entry.name).toLowerCase() === '.pdf') files.push(full);
  }
  return files;
}

function buildFileIndex() {
  const index = new Map();
  for (const filePath of walk(ROOT)) {
    const subjectName = path.basename(path.dirname(filePath));
    const paperName = path.basename(filePath, path.extname(filePath));
    index.set(`${normalizeKey(subjectName)}__${normalizeKey(paperName)}`, filePath);
  }
  return index;
}

function toQuestionNumber(value) {
  const match = String(value || '').match(/\d+/);
  return match ? Number(match[0]) : null;
}

function normalizeOption(text) {
  return String(text || '')
    .replace(/^\s*[([]?[A-Da-d][)\].:-]?\s*/u, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function normalizePrompt(text) {
  return String(text || '').replace(/\s+/g, ' ').trim();
}

function matchAnswerTextToOption(answerText, options) {
  const answerNorm = normalizeLoose(answerText);
  if (!answerNorm) return -1;
  for (let i = 0; i < options.length; i += 1) {
    const optionNorm = normalizeLoose(options[i]);
    if (!optionNorm) continue;
    if (optionNorm === answerNorm) return i;
    if (optionNorm.includes(answerNorm) || answerNorm.includes(optionNorm)) return i;
  }
  return -1;
}

function normalizeLoose(text) {
  return String(text || '')
    .toLowerCase()
    .replace(/[αβγδ]/g, ' ')
    .replace(/[^\p{L}\p{N}+\\/=().,%\-\s]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

async function runJson(ai, model, systemInstruction, contents, responseSchema, maxOutputTokens = 8192) {
  let lastError = null;
  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      const response = await ai.models.generateContent({
        model,
        systemInstruction,
        contents,
        config: {
          temperature: 0,
          topP: 0.8,
          maxOutputTokens,
          responseMimeType: 'application/json',
          responseSchema,
        },
      });
      const text = response.text || '{}';
      try {
        return JSON.parse(text);
      } catch {
        const start = text.indexOf('{');
        const end = text.lastIndexOf('}');
        if (start >= 0 && end > start) {
          return JSON.parse(text.slice(start, end + 1));
        }
        throw new Error(`Invalid JSON response: ${text.slice(0, 400)}`);
      }
    } catch (error) {
      lastError = error;
      if (attempt < 2) {
        await new Promise((resolve) => setTimeout(resolve, 1500 * (attempt + 1)));
      }
    }
  }
  throw lastError;
}

async function uploadFile(ai, filePath) {
  return ai.files.upload({
    file: filePath,
    config: {
      mimeType: 'application/pdf',
      displayName: path.basename(filePath),
    },
  });
}

function questionChunkSize(subjectName, expectedCount) {
  const key = normalizeKey(subjectName);
  if (key.includes('mathematics')) return 8;
  if (key.includes('physics') || key.includes('chemistry')) return 10;
  if (key.includes('general aptitude')) return 10;
  if (key.includes('english')) return 8;
  if (expectedCount >= 75) return 12;
  return 12;
}

function answerChunkSize(subjectName, expectedCount) {
  const key = normalizeKey(subjectName);
  if (key.includes('mathematics')) return 20;
  if (key.includes('physics') || key.includes('chemistry')) return 24;
  if (expectedCount >= 75) return 30;
  return 25;
}

async function extractAnswers(ai, model, filePart, item) {
  const schema = {
    type: 'OBJECT',
    required: ['answers'],
    properties: {
      answers: {
        type: 'ARRAY',
        items: {
          type: 'OBJECT',
          required: ['questionNumber', 'correctIndex'],
          properties: {
            questionNumber: {type: 'STRING'},
            correctIndex: {type: 'INTEGER', nullable: true},
          },
        },
      },
    },
  };
  const answerKey = new Map();
  const chunk = answerChunkSize(item.subject, item.expectedCount);
  const systemInstruction =
    'You extract answer keys from exam PDFs. Scan the entire uploaded document, including answer-key or solution pages at the end. Return only confident answers. Preserve numbering exactly.';

  async function fetchRange(start, end, depth = 0) {
    const prompt =
      `Return only answer-key entries for questions ${start} to ${end}. ` +
      'The answer key may appear at the end, in a solutions section, in a table, or inline with each question. ' +
      'Return JSON { "answers": [{ "questionNumber": "1", "correctIndex": 0 }] }. ' +
      'Use correctIndex values 0 for A, 1 for B, 2 for C, 3 for D. ' +
      'If uncertain, omit that answer.';
    try {
      const data = await runJson(ai, model, systemInstruction, [createPartFromText(prompt), filePart], schema, 4096);
      for (const entry of data.answers || []) {
        const qNo = toQuestionNumber(entry?.questionNumber);
        if (!qNo || qNo < 1 || qNo > item.expectedCount) continue;
        let correctIndex = Number(entry?.correctIndex);
        answerKey.set(qNo, {
          correctIndex: Number.isInteger(correctIndex) && correctIndex >= 0 && correctIndex <= 3 ? correctIndex : -1,
        });
      }
    } catch (error) {
      if (start >= end || depth >= 4) {
        throw error;
      }
      const mid = Math.floor((start + end) / 2);
      await fetchRange(start, mid, depth + 1);
      await fetchRange(mid + 1, end, depth + 1);
    }
  }

  for (let start = 1; start <= item.expectedCount; start += chunk) {
    const end = Math.min(item.expectedCount, start + chunk - 1);
    await fetchRange(start, end);
  }
  return answerKey;
}

async function extractQuestions(ai, model, filePart, item) {
  const schema = {
    type: 'OBJECT',
    required: ['questions'],
    properties: {
      questions: {
        type: 'ARRAY',
        items: {
          type: 'OBJECT',
          required: ['questionNumber', 'prompt', 'options'],
          properties: {
            questionNumber: {type: 'STRING'},
            prompt: {type: 'STRING'},
            options: {type: 'ARRAY', items: {type: 'STRING'}},
          },
        },
      },
    },
  };
  const systemInstruction =
    'You extract multiple-choice exam questions from uploaded PDFs. Preserve wording, equations, symbols, superscripts, subscripts, and math meaning exactly as plain text. Return only real MCQs with exactly four options.';
  const chunk = questionChunkSize(item.subject, item.expectedCount);
  const questions = [];

  async function fetchRange(start, end, depth = 0) {
    const prompt =
      `Extract only questions ${start} to ${end} from the uploaded exam PDF. ` +
      'Return JSON { "questions": [{ "questionNumber": "1", "prompt": "...", "options": ["...","...","...","..."] }] }. ' +
      'Do not include answer keys, explanations, or passage headers unless needed to make the question understandable. ' +
      'For passage-based questions, keep the minimum passage text needed inside the prompt. ' +
      'Every returned question must have exactly four options.';
    try {
      const data = await runJson(ai, model, systemInstruction, [createPartFromText(prompt), filePart], schema, 8192);
      for (const entry of data.questions || []) {
        const qNo = toQuestionNumber(entry?.questionNumber);
        const promptText = normalizePrompt(entry?.prompt);
        const options = Array.isArray(entry?.options) ? entry.options.map(normalizeOption).filter(Boolean) : [];
        if (!qNo || qNo < start || qNo > end) continue;
        if (!promptText || options.length !== 4) continue;
        questions.push({questionNumber: qNo, prompt: promptText, options});
      }
    } catch (error) {
      if (start >= end || depth >= 4) {
        throw error;
      }
      const mid = Math.floor((start + end) / 2);
      await fetchRange(start, mid, depth + 1);
      await fetchRange(mid + 1, end, depth + 1);
    }
  }

  for (let start = 1; start <= item.expectedCount; start += chunk) {
    const end = Math.min(item.expectedCount, start + chunk - 1);
    await fetchRange(start, end);
  }

  const seen = new Set(questions.map((item) => item.questionNumber));
  const missing = [];
  for (let qNo = 1; qNo <= item.expectedCount; qNo += 1) {
    if (!seen.has(qNo)) missing.push(qNo);
  }
  for (const qNo of missing.slice(0, 8)) {
    const prompt =
      `Extract only question ${qNo} from the uploaded exam PDF. ` +
      'Return JSON { "questions": [{ "questionNumber": "14", "prompt": "...", "options": ["...","...","...","..."] }] }. ' +
      'Return an empty array if the question is not visible. Exactly four options only.';
    const data = await runJson(ai, model, systemInstruction, [createPartFromText(prompt), filePart], schema, 4096);
    for (const entry of data.questions || []) {
      const parsedNo = toQuestionNumber(entry?.questionNumber);
      const promptText = normalizePrompt(entry?.prompt);
      const options = Array.isArray(entry?.options) ? entry.options.map(normalizeOption).filter(Boolean) : [];
      if (parsedNo !== qNo || !promptText || options.length !== 4) continue;
      questions.push({questionNumber: parsedNo, prompt: promptText, options});
      seen.add(parsedNo);
    }
  }
  return questions;
}

function buildPaperResult(item, extractedQuestions, answerKey) {
  const byNumber = new Map();
  for (const question of extractedQuestions) {
    if (byNumber.has(question.questionNumber)) continue;
    const answer = answerKey.get(question.questionNumber);
    let correctIndex = Number(answer?.correctIndex);
    byNumber.set(question.questionNumber, {
      ...question,
      correctIndex: Number.isInteger(correctIndex) && correctIndex >= 0 && correctIndex <= 3 ? correctIndex : -1,
    });
  }

  const questions = [];
  for (let qNo = 1; qNo <= item.expectedCount; qNo += 1) {
    const question = byNumber.get(qNo);
    if (!question) continue;
    questions.push(question);
  }

  const resolvedCount = questions.filter((question) => question.correctIndex >= 0).length;
  const parsedCount = questions.length;
  const completion = parsedCount / Math.max(item.expectedCount, 1);
  const resolvedRatio = resolvedCount / Math.max(parsedCount, 1);
  const missingCount = item.expectedCount - parsedCount;
  const sequentialCoverage = questions.every((question, index) => question.questionNumber === index + 1);
  const accepted =
    parsedCount >= Math.max(item.expectedCount - 2, Math.floor(item.expectedCount * 0.92)) &&
    parsedCount <= item.expectedCount + 1 &&
    resolvedRatio >= 0.95 &&
    missingCount <= 2;

  return {
    parsedCount,
    resolvedCount,
    completion,
    resolvedRatio,
    accepted,
    sequentialCoverage,
    missingCount,
    questions,
  };
}

async function recoverPaper(ai, item, filePath, defaultModel) {
  const uploaded = await uploadFile(ai, filePath);
  try {
    const filePart = createPartFromUri(uploaded.uri, uploaded.mimeType || 'application/pdf');
    const models = [defaultModel, String(process.env.FALLBACK_MODEL || '').trim()].filter(Boolean);
    let lastFailure = null;

    for (const model of models) {
      try {
        const answers = await extractAnswers(ai, model, filePart, item);
        const questions = await extractQuestions(ai, model, filePart, item);
        const built = buildPaperResult(item, questions, answers);
        if (built.accepted) {
          return {...built, model, filePath};
        }
        lastFailure = {...built, model, filePath};
      } catch (error) {
        lastFailure = {
          accepted: false,
          model,
          filePath,
          error: error instanceof Error ? error.message : String(error),
        };
      }
    }

    return lastFailure || {
      accepted: false,
      model: defaultModel,
      filePath,
      error: 'Unknown recovery failure.',
    };
  } finally {
    await ai.files.delete({name: uploaded.name}).catch(() => {});
  }
}

async function ensureSubject(client, subjectName, sortOrder = 0) {
  const subjectId = `${COURSE_ID}-${slugify(subjectName)}`;
  await client.query(
    `insert into subjects (id, course_id, title, description, sort_order, is_published, created_at, updated_at)
     values ($1, $2, $3, $4, $5, true, now(), now())
     on conflict (id) do update set
       title = excluded.title,
       updated_at = now()`,
    [
      subjectId,
      COURSE_ID,
      subjectName,
      `${subjectName} practice papers for CUET preparation with exam-style instructions and timed attempts.`,
      sortOrder,
    ],
  );
  return subjectId;
}

async function insertPaper(client, item, result) {
  const relativePath = path.relative(ROOT, result.filePath);
  const subjectId = await ensureSubject(client, item.subject, 0);
  const paperId = `${subjectId}-${slugify(relativePath)}-${shortHash(relativePath)}`;
  await client.query('begin');
  try {
    await client.query('delete from papers where id = $1', [paperId]);
    await client.query(
      `insert into papers (id, course_id, subject_id, title, duration_minutes, instructions, is_free_preview, created_at, updated_at)
       values ($1, $2, $3, $4, $5, $6::jsonb, false, now(), now())`,
      [
        paperId,
        COURSE_ID,
        subjectId,
        item.paper,
        60,
        JSON.stringify([
          'Read every question carefully before answering.',
          'Correct answer: +5. Incorrect answer: -1.',
          'Submit before the timer ends.',
        ]),
      ],
    );

    for (let index = 0; index < result.questions.length; index += 1) {
      const question = result.questions[index];
      await client.query(
        `insert into questions
          (id, paper_id, section, prompt, options, correct_index, explanation, topic, concepts, difficulty, marks, negative_marks, sort_order, created_at)
         values
          ($1, $2, $3, $4, $5::jsonb, $6, null, $7, '[]'::jsonb, 'medium', 5, 1, $8, now())`,
        [
          `${paperId}-q${String(question.questionNumber).padStart(3, '0')}`,
          paperId,
          item.subject,
          question.prompt,
          JSON.stringify(question.options),
          question.correctIndex,
          item.subject,
          index,
        ],
      );
    }
    await client.query('commit');
    return {paperId, insertedCount: result.questions.length};
  } catch (error) {
    await client.query('rollback');
    throw error;
  }
}

async function main() {
  loadEnv();
  if (!process.env.GEMINI_API_KEY) {
    throw new Error('GEMINI_API_KEY is not configured in server.env');
  }
  const defaultModel = String(
    process.env.GEMINI_RECOVERY_MODEL || process.env.GEMINI_IMPORT_MODEL || 'gemini-2.5-flash-lite',
  ).trim();

  const ai = new GoogleGenAI({apiKey: process.env.GEMINI_API_KEY});
  const pool = new pg.Pool({connectionString: dbUrl()});
  const report = JSON.parse(fs.readFileSync(REPORT_PATH, 'utf8'));
  let skipped = Array.isArray(report.skipped) ? report.skipped : [];
  const filterSubject = normalizeKey(process.env.FILTER_SUBJECT || '');
  const filterPaper = normalizeKey(process.env.FILTER_PAPER || '');
  const limit = Number(process.env.LIMIT || 0);
  if (filterSubject) {
    skipped = skipped.filter((item) => normalizeKey(item.subject) === filterSubject);
  }
  if (filterPaper) {
    skipped = skipped.filter((item) => normalizeKey(item.paper) === filterPaper);
  }
  if (Number.isFinite(limit) && limit > 0) {
    skipped = skipped.slice(0, limit);
  }
  const fileIndex = buildFileIndex();
  const results = [];

  for (const item of skipped) {
    const lookupKey = `${normalizeKey(item.subject)}__${normalizeKey(item.paper)}`;
    const filePath = fileIndex.get(lookupKey);
    if (!filePath) {
      results.push({...item, status: 'missing-file'});
      console.log(`[missing] ${item.subject} / ${item.paper}`);
      continue;
    }

    console.log(`[recover] ${item.subject} / ${item.paper}`);
    const recovered = await recoverPaper(ai, item, filePath, defaultModel);
    if (!recovered.accepted) {
      results.push({
        ...item,
        status: 'failed',
        filePath,
        model: recovered.model,
        parsedCount: recovered.parsedCount || 0,
        resolvedCount: recovered.resolvedCount || 0,
        completion: recovered.completion || 0,
        resolvedRatio: recovered.resolvedRatio || 0,
        sequentialCoverage: recovered.sequentialCoverage || false,
        missingCount: recovered.missingCount || item.expectedCount,
        error: recovered.error || null,
      });
      console.log(`  -> failed via ${recovered.model}; parsed ${recovered.parsedCount || 0}/${item.expectedCount}`);
      continue;
    }

    const client = await pool.connect();
    try {
      const inserted = await insertPaper(client, item, recovered);
      results.push({
        ...item,
        status: 'imported',
        filePath,
        model: recovered.model,
        parsedCount: recovered.parsedCount,
        resolvedCount: recovered.resolvedCount,
        completion: recovered.completion,
        resolvedRatio: recovered.resolvedRatio,
        sequentialCoverage: recovered.sequentialCoverage,
        missingCount: recovered.missingCount,
        paperId: inserted.paperId,
      });
      console.log(`  -> imported via ${recovered.model}; parsed ${recovered.parsedCount}/${item.expectedCount}`);
    } finally {
      client.release();
    }
  }

  await pool.end();

  const summary = {
    createdAt: new Date().toISOString(),
    totalSkippedInput: skipped.length,
    imported: results.filter((item) => item.status === 'imported').length,
    failed: results.filter((item) => item.status === 'failed').length,
    missingFile: results.filter((item) => item.status === 'missing-file').length,
    results,
  };
  fs.writeFileSync(OUTPUT_PATH, JSON.stringify(summary, null, 2));
  console.log(`Wrote recovery report to ${OUTPUT_PATH}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
