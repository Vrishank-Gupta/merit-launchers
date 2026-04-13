const fs = require('fs');
const path = require('path');
const {createRequire} = require('module');
const crypto = require('crypto');

const serverRequire = createRequire(path.resolve(__dirname, '..', 'server', 'package.json'));
const {PDFParse} = serverRequire('pdf-parse');
const pg = serverRequire('pg');

const ROOT = String.raw`C:\Users\VRISHANK\Downloads\CUET -20260327T154403Z-3-001\CUET`;
const COURSE_ID = 'cuet';

function loadEnv() {
  const envPath = path.resolve(__dirname, '..', 'server.env');
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

function slugify(value) {
  return String(value)
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

function cleanLine(line) {
  return line
    .replace(/\u0000/g, '')
    .replace(/\t+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function normalizeComparable(value) {
  return String(value || '')
    .toLowerCase()
    .replace(/\u0000/g, '')
    .replace(/[“”"'`]/g, '')
    .replace(/[–—-]/g, ' ')
    .replace(/[^a-z0-9\u0900-\u097f()+/=.,:%\s]/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function shouldDropLine(line, normalizedCourseName) {
  if (!line) return true;
  if (/^-- \d+ of \d+ --$/.test(line)) return true;
  if (/^Page \d+ of \d+$/i.test(line)) return true;
  if (/^Correct:\s*\+\d+/i.test(line)) return true;
  if (/^TEST$/i.test(line)) return true;
  if (/^QUESTIONS$/i.test(line)) return true;
  if (/^ANSWERS$/i.test(line)) return true;
  if (/^SOLUTIONS$/i.test(line)) return true;
  if (/^SECTIONS$/i.test(line)) return true;
  if (/^Section \d+\s*:/i.test(line)) return true;
  if (/^\d+\.\s*MCQ\s*-\s*\d+\s*Questions$/i.test(line)) return true;
  if (normalizedCourseName && line.toLowerCase().includes(normalizedCourseName) && line.toLowerCase().includes('paper')) return true;
  return false;
}

function extractExpectedCount(text) {
  const match = text.match(/MCQ\s*-\s*(\d+)\s*Questions/i) || text.match(/mcq\s*-\s*(\d+)\s*Questions/i);
  return match ? Number(match[1]) : null;
}

function sanitizeQuestionPart(text, subjectName) {
  const beforeAnswers = text.split(/\bANSWERS\b/i)[0].split(/\bSOLUTIONS\b/i)[0];
  const lines = beforeAnswers.split(/\r?\n/).map(cleanLine);
  const normalizedCourseName = subjectName.toLowerCase();
  return lines.filter((line) => !shouldDropLine(line, normalizedCourseName));
}

function sanitizeSolutionPart(text, subjectName) {
  const solutionIndex = text.search(/\bSOLUTIONS\b/i);
  if (solutionIndex < 0) return [];
  const part = text.slice(solutionIndex);
  const lines = part.split(/\r?\n/).map(cleanLine);
  const normalizedCourseName = subjectName.toLowerCase();
  return lines.filter((line) => !shouldDropLine(line, normalizedCourseName));
}

function sanitizeAnswerPart(text, subjectName) {
  const answerIndex = text.search(/\bANSWERS\b/i);
  if (answerIndex < 0) return [];
  const solutionIndex = text.search(/\bSOLUTIONS\b/i);
  const part = solutionIndex > answerIndex ? text.slice(answerIndex, solutionIndex) : text.slice(answerIndex);
  const lines = part.split(/\r?\n/).map(cleanLine);
  const normalizedCourseName = subjectName.toLowerCase();
  return lines.filter((line) => !shouldDropLine(line, normalizedCourseName));
}

function parseSolutions(solutionLines) {
  const map = new Map();
  for (let i = 0; i < solutionLines.length; i += 1) {
    const line = solutionLines[i];
    if (!/^\d+$/.test(line)) continue;
    const qNo = Number(line);
    const next = solutionLines[i + 1] || '';
    const answerMatch = next.match(/^([A-Da-d])$/);
    if (answerMatch) {
      map.set(qNo, answerMatch[1].toUpperCase());
      i += 1;
    }
  }
  return map;
}

function parseTextAnswers(answerLines) {
  const map = new Map();
  let currentNo = null;
  let buffer = [];
  const flush = () => {
    if (currentNo == null) return;
    const value = cleanLine(buffer.join(' '));
    if (value) map.set(currentNo, value);
    currentNo = null;
    buffer = [];
  };
  for (const line of answerLines) {
    const numOnly = line.match(/^(\d+)$/);
    const numText = line.match(/^(\d+)\s+(.*)$/);
    if (numOnly) {
      flush();
      currentNo = Number(numOnly[1]);
      continue;
    }
    if (numText) {
      flush();
      currentNo = Number(numText[1]);
      buffer.push(numText[2]);
      continue;
    }
    if (currentNo != null) {
      buffer.push(line);
    }
  }
  flush();
  return map;
}

function matchAnswerTextToOption(answerText, options) {
  const answerNorm = normalizeComparable(answerText);
  if (!answerNorm) return -1;
  for (let i = 0; i < options.length; i += 1) {
    const optionNorm = normalizeComparable(options[i]);
    if (!optionNorm) continue;
    if (optionNorm === answerNorm) return i;
    if (optionNorm.includes(answerNorm) || answerNorm.includes(optionNorm)) return i;
  }
  return -1;
}

function parseQuestionBlocks(lines) {
  const blocks = [];
  let current = null;
  for (const line of lines) {
    const startMatch = line.match(/^(\d+)\s*(.*)$/);
    if (startMatch && Number(startMatch[1]) > 0) {
      if (current && current.lines.length) blocks.push(current);
      current = {
        number: Number(startMatch[1]),
        lines: startMatch[2] ? [startMatch[2].trim()] : [],
      };
      continue;
    }
    if (!current) continue;
    current.lines.push(line);
  }
  if (current && current.lines.length) blocks.push(current);
  return blocks;
}

function splitPromptAndOptions(lines) {
  const cleaned = lines.map(cleanLine).filter(Boolean);
  if (cleaned.length < 5) return null;
  const options = cleaned.slice(-4);
  const promptLines = cleaned.slice(0, -4);
  const prompt = promptLines.join('\n').trim();
  if (!prompt) return null;
  return {prompt, options};
}

function letterToIndex(letter) {
  return {A: 0, B: 1, C: 2, D: 3}[letter] ?? null;
}

function questionConfidence(question) {
  let score = 0;
  if (question.prompt.length >= 25) score += 2;
  else if (question.prompt.length >= 10) score += 1;
  if (question.options.length === 4) score += 2;
  if (question.options.every((item) => item.length >= 1)) score += 1;
  if (!/^(mcq|questions|page|\d+)$/i.test(question.prompt)) score += 1;
  if (question.correctIndex >= 0 && question.correctIndex <= 3) score += 2;
  if (question.options.some((item) => item.length > 8)) score += 1;
  return score;
}

function parsePaper(text, subjectName, paperTitle, filePath) {
  const relativePath = path.relative(ROOT, filePath);
  const pathHash = shortHash(relativePath);
  const expectedCount = extractExpectedCount(text);
  const questionLines = sanitizeQuestionPart(text, subjectName);
  const answerLines = sanitizeAnswerPart(text, subjectName);
  const solutionLines = sanitizeSolutionPart(text, subjectName);
  const solutions = parseSolutions(solutionLines);
  const textAnswers = parseTextAnswers(answerLines);
  const solutionTexts = parseTextAnswers(solutionLines);
  const blocks = parseQuestionBlocks(questionLines);
  const questions = [];
  let lowPromptCount = 0;

  for (let blockIndex = 0; blockIndex < blocks.length; blockIndex += 1) {
    const block = blocks[blockIndex];
    const split = splitPromptAndOptions(block.lines);
    if (!split) continue;
    const letter = solutions.get(block.number) || null;
    let correctIndex = letter ? letterToIndex(letter) : -1;
    if (correctIndex < 0) {
      const textAnswer = textAnswers.get(block.number) || solutionTexts.get(block.number) || '';
      correctIndex = matchAnswerTextToOption(textAnswer, split.options);
    }
    if (split.prompt.length < 8) lowPromptCount += 1;
    questions.push({
      id: `${slugify(relativePath)}-${pathHash}-q${blockIndex + 1}`,
      section: subjectName,
      prompt: split.prompt,
      options: split.options,
      correctIndex,
      explanation: null,
      topic: subjectName,
      concepts: [],
      difficulty: 'medium',
      marks: 5,
      negativeMarks: 1,
    });
  }

  const resolvedCount = questions.filter((q) => q.correctIndex >= 0).length;
  const avgConfidence = questions.length
    ? questions.reduce((sum, question) => sum + questionConfidence(question), 0) / questions.length
    : 0;
  const adequateCount = expectedCount ? questions.length / expectedCount : 0;
  const promptIntegrity = questions.length ? 1 - (lowPromptCount / questions.length) : 0;
  const resolvedRatio = resolvedCount / Math.max(questions.length, 1);
  const strictImport =
    questions.length >= 20 &&
    adequateCount >= 0.75 &&
    resolvedRatio >= 0.95 &&
    avgConfidence >= 5 &&
    promptIntegrity >= 0.7;
  const relaxedImport = expectedCount
    ? questions.length >= 20 &&
      adequateCount >= 0.84 &&
      adequateCount <= 1.08 &&
      resolvedRatio >= 0.8 &&
      avgConfidence >= 8.2 &&
      promptIntegrity >= 0.9
    : questions.length >= 40 &&
      resolvedRatio >= 0.9 &&
      avgConfidence >= 8.4 &&
      promptIntegrity >= 0.95;
  const status = strictImport || relaxedImport ? 'import' : 'skip';

  return {
    filePath,
    relativePath,
    paperTitle,
    subjectName,
    expectedCount,
    parsedCount: questions.length,
    resolvedCount,
    avgConfidence,
    promptIntegrity,
    status,
    questions,
  };
}

async function extractText(filePath) {
  const parser = new PDFParse({data: fs.readFileSync(filePath)});
  const data = await parser.getText();
  return data.text || '';
}

async function main() {
  loadEnv();
  const pool = new pg.Pool({connectionString: dbUrl()});
  const files = walk(ROOT);
  const analyses = [];

  for (const filePath of files) {
    const subjectName = path.basename(path.dirname(filePath));
    const paperTitle = path.basename(filePath, path.extname(filePath)).replace(/\s+/g, ' ').trim();
    const text = await extractText(filePath);
    analyses.push(parsePaper(text, subjectName, paperTitle, filePath));
  }

  const importable = analyses.filter((item) => item.status === 'import');
  const skipped = analyses.filter((item) => item.status !== 'import');

  console.log(`Found ${files.length} PDFs`);
  console.log(`Importable: ${importable.length}`);
  console.log(`Skipped: ${skipped.length}`);

  const client = await pool.connect();
  try {
    await client.query('begin');
    await client.query('delete from papers');
    await client.query('delete from subjects');

    const subjectNames = [...new Set(importable.map((item) => item.subjectName))];
    for (let index = 0; index < subjectNames.length; index += 1) {
      const subjectName = subjectNames[index];
      const subjectId = `${COURSE_ID}-${slugify(subjectName)}`;
      await client.query(
        `insert into subjects (id, course_id, title, description, sort_order, is_published, created_at, updated_at)
         values ($1, $2, $3, $4, $5, true, now(), now())`,
        [
          subjectId,
          COURSE_ID,
          subjectName,
          `${subjectName} practice papers for CUET preparation with exam-style instructions and timed attempts.`,
          index,
        ],
      );
    }

    for (const item of importable) {
      const subjectId = `${COURSE_ID}-${slugify(item.subjectName)}`;
      const paperId = `${subjectId}-${slugify(item.relativePath)}-${shortHash(item.relativePath)}`;
      await client.query(
        `insert into papers (id, course_id, subject_id, title, duration_minutes, instructions, is_free_preview, created_at, updated_at)
         values ($1, $2, $3, $4, $5, $6::jsonb, false, now(), now())`,
        [
          paperId,
          COURSE_ID,
          subjectId,
          item.paperTitle,
          60,
          JSON.stringify([
            'Read every question carefully before answering.',
            'Correct answer: +5. Incorrect answer: -1.',
            'Submit before the timer ends.',
          ]),
        ],
      );

      for (let index = 0; index < item.questions.length; index += 1) {
        const question = item.questions[index];
        await client.query(
          `insert into questions
            (id, paper_id, section, prompt, options, correct_index, explanation, topic, concepts, difficulty, marks, negative_marks, sort_order, created_at)
           values
            ($1, $2, $3, $4, $5::jsonb, $6, $7, $8, $9::jsonb, $10, $11, $12, $13, now())`,
          [
            question.id,
            // question IDs must be unique even when paper titles repeat in a folder
            paperId,
            question.section,
            question.prompt,
            JSON.stringify(question.options),
            question.correctIndex >= 0 ? question.correctIndex : 0,
            question.explanation,
            question.topic,
            JSON.stringify(question.concepts),
            question.difficulty,
            question.marks,
            question.negativeMarks,
            index,
          ],
        );
      }
    }

    await client.query('commit');
  } catch (error) {
    await client.query('rollback');
    throw error;
  } finally {
    client.release();
    await pool.end();
  }

  const reportPath = path.resolve(__dirname, '..', 'docs', 'cuet_import_report.json');
  fs.mkdirSync(path.dirname(reportPath), {recursive: true});
  fs.writeFileSync(
    reportPath,
    JSON.stringify(
      {
        total: files.length,
        importable: importable.map((item) => ({
          subject: item.subjectName,
          paper: item.paperTitle,
          expectedCount: item.expectedCount,
          parsedCount: item.parsedCount,
          resolvedCount: item.resolvedCount,
          avgConfidence: item.avgConfidence,
          promptIntegrity: item.promptIntegrity,
        })),
        skipped: skipped.map((item) => ({
          subject: item.subjectName,
          paper: item.paperTitle,
          expectedCount: item.expectedCount,
          parsedCount: item.parsedCount,
          resolvedCount: item.resolvedCount,
          avgConfidence: item.avgConfidence,
          promptIntegrity: item.promptIntegrity,
        })),
      },
      null,
      2,
    ),
  );

  console.log(`Report written to ${reportPath}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
