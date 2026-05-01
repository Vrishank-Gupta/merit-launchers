import pg from "pg";

const {Pool} = pg;

const pool = new Pool({connectionString: process.env.DATABASE_URL});

const sql = `
select
  s.title as subject,
  p.id as paper_id,
  p.title as paper_title,
  q.id as question_id,
  q.sort_order,
  q.section,
  q.prompt,
  q.options,
  q.correct_index,
  q.explanation,
  q.topic,
  q.concepts,
  q.difficulty
from questions q
join papers p on p.id = q.paper_id
join subjects s on s.id = p.subject_id
where p.course_id = 'cuet'
  and lower(s.title) <> 'mathematics'
order by s.title, p.title, q.sort_order, q.id
`;

try {
  const result = await pool.query(sql);
  process.stdout.write(JSON.stringify({
    exportedAt: new Date().toISOString(),
    count: result.rows.length,
    questions: result.rows,
  }, null, 2));
} finally {
  await pool.end();
}
