const fs = require("fs");

const source = JSON.parse(fs.readFileSync("docs/cuet_non_math_questions_prod.json", "utf8"));

function norm(value) {
  return String(value || "").toLowerCase().replace(/\s+/g, " ").trim();
}

const buckets = new Map();
for (const row of source.questions) {
  const options = Array.isArray(row.options) ? row.options : [];
  const key = [row.subject, norm(row.prompt), ...options.map(norm)].join("||");
  const bucket = buckets.get(key) || {
    subject: row.subject,
    prompt: row.prompt,
    options,
    marked: new Map(),
    occurrences: [],
  };
  const marked = Number(row.correct_index);
  bucket.marked.set(marked, (bucket.marked.get(marked) || 0) + 1);
  bucket.occurrences.push({
    paper_id: row.paper_id,
    paper_title: row.paper_title,
    question_id: row.question_id,
    marked_correct_index: row.correct_index,
  });
  buckets.set(key, bucket);
}

const conflicts = [...buckets.values()]
  .filter((item) => item.marked.size > 1)
  .map((item, index) => ({
    conflict_id: `cf-${String(index + 1).padStart(3, "0")}`,
    subject: item.subject,
    prompt: item.prompt,
    options: item.options,
    marked_distribution: Object.fromEntries([...item.marked.entries()].sort((a, b) => a[0] - b[0])),
    occurrences: item.occurrences,
  }))
  .sort((a, b) => a.subject.localeCompare(b.subject) || a.prompt.localeCompare(b.prompt));

fs.writeFileSync("docs/cuet_conflicting_answer_marks.json", JSON.stringify({
  generatedAt: new Date().toISOString(),
  total: conflicts.length,
  conflicts,
}, null, 2));

console.log(`wrote ${conflicts.length} conflicts`);
