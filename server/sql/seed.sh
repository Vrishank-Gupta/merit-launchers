#!/bin/sh
set -eu

ADMIN_EMAIL="${ADMIN_ALLOWLIST_EMAIL:-info@meritlaunchers.com}"
ADMIN_PHONE="${ADMIN_ALLOWLIST_PHONE:-}"
SEED_SAMPLE_DATA="${SEED_SAMPLE_DATA:-true}"

psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" <<SQL
insert into admin_allowlist (id, label, email, is_active)
values ('${ADMIN_EMAIL}', 'Primary admin', '${ADMIN_EMAIL}', true)
on conflict (id) do update
  set label = excluded.label,
      email = excluded.email,
      is_active = true;
SQL

if [ -n "$ADMIN_PHONE" ]; then
  psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" <<SQL
insert into admin_allowlist (id, label, phone, is_active)
values ('${ADMIN_PHONE}', 'Primary admin phone', '${ADMIN_PHONE}', true)
on conflict (id) do update
  set label = excluded.label,
      phone = excluded.phone,
      is_active = true;
SQL
fi

if [ "$SEED_SAMPLE_DATA" != "true" ]; then
  exit 0
fi

psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" <<'SQL'
insert into affiliates (id, name, code, channel)
values
  ('aff-1', 'North Campus Partner', 'AFF-CAMPUS-11', 'Campus affiliate'),
  ('aff-2', 'Instagram Legal Prep', 'CLAT-BOOST', 'Instagram creator')
on conflict (id) do update
  set name = excluded.name,
      code = excluded.code,
      channel = excluded.channel;

insert into users (id, role, name, email, city, referral_code)
values (
  '11111111-1111-1111-1111-111111111111',
  'student',
  'Aarav Sharma',
  'aarav.sharma@gmail.com',
  'Delhi',
  'AFF-CAMPUS-11'
)
on conflict (id) do update
  set role = excluded.role,
      name = excluded.name,
      email = excluded.email,
      city = excluded.city,
      referral_code = excluded.referral_code,
      updated_at = now();

insert into courses (id, title, subtitle, description, price, validity_days, highlights, intro_video_url, hero_label, is_published)
values
  (
    'cuet',
    'CUET',
    'General Test + domain-style sample papers',
    'Affordable full-length papers with realistic instructions, timed attempts, and result analytics.',
    499,
    365,
    '["2 free papers","Detailed scorecards","Unlock one subject at a time"]'::jsonb,
    null,
    'BESTSELLER',
    true
  ),
  (
    'clat',
    'CLAT',
    'Mock tests for legal aptitude and reading sections',
    'Balanced coverage across legal reasoning, English, GK, logical reasoning, and quantitative techniques.',
    499,
    365,
    '["One free full paper","Section-wise analysis","Exam-day UI with timer"]'::jsonb,
    null,
    'TRENDING',
    true
  ),
  (
    'ctet',
    'CTET',
    'Teacher eligibility sample papers',
    'Child pedagogy, language, mathematics, and EVS papers aligned for CTET practice.',
    499,
    365,
    '["Friendly for first-time learners","Instant result summary","Receipt and payment log"]'::jsonb,
    null,
    'NEW',
    true
  )
on conflict (id) do update
set title = excluded.title,
      subtitle = excluded.subtitle,
      description = excluded.description,
      price = excluded.price,
      validity_days = excluded.validity_days,
      highlights = excluded.highlights,
      intro_video_url = excluded.intro_video_url,
      hero_label = excluded.hero_label,
      is_published = excluded.is_published,
    updated_at = now();

insert into subjects (id, course_id, title, description, sort_order, is_published)
values
  (
    'cuet-general-test',
    'cuet',
    'General Test',
    'Language, reasoning, quantitative aptitude, and general awareness papers.',
    0,
    true
  ),
  (
    'clat-foundation',
    'clat',
    'Foundation',
    'Legal reasoning, English, and quantitative techniques practice sets.',
    0,
    true
  ),
  (
    'ctet-paper-1',
    'ctet',
    'Paper 1 Subjects',
    'Pedagogy, language, mathematics, and EVS-aligned papers.',
    0,
    true
  )
on conflict (id) do update
set title = excluded.title,
    description = excluded.description,
    sort_order = excluded.sort_order,
    is_published = excluded.is_published,
    updated_at = now();

insert into papers (id, course_id, subject_id, title, duration_minutes, instructions, is_free_preview)
values
  (
    'cuet-free-1',
    'cuet',
    'cuet-general-test',
    'CUET Free Paper 1',
    30,
    '["Read each question carefully before answering.","Correct answer: +3, incorrect answer: -1.","Do not close the exam while the timer is running."]'::jsonb,
    true
  ),
  (
    'cuet-pro-1',
    'cuet',
    'cuet-general-test',
    'CUET Premium Paper 1',
    45,
    '["Attempt every section within the allotted duration.","Use the navigator to revisit answered questions.","Submission happens automatically when the timer ends."]'::jsonb,
    false
  ),
  (
    'clat-free-1',
    'clat',
    'clat-foundation',
    'CLAT Free Paper',
    35,
    '["Focus on accuracy and time discipline.","Use the timer strip at the top to track pace."]'::jsonb,
    true
  ),
  (
    'ctet-free-1',
    'ctet',
    'ctet-paper-1',
    'CTET Free Paper',
    25,
    '["All questions are compulsory.","The report includes section-wise performance."]'::jsonb,
    true
  )
on conflict (id) do update
set course_id = excluded.course_id,
    subject_id = excluded.subject_id,
    title = excluded.title,
      duration_minutes = excluded.duration_minutes,
      instructions = excluded.instructions,
      is_free_preview = excluded.is_free_preview,
      updated_at = now();

insert into questions (id, paper_id, section, prompt, options, correct_index, explanation, marks, negative_marks, sort_order)
values
  ('q1', 'cuet-free-1', 'Quantitative Aptitude', '\int_0^1 x^2 \, dx = ?', '["1/2","1/3","2/3","1"]'::jsonb, 1, 'Power rule gives x^3/3 from 0 to 1.', 3, 1, 0),
  ('q2', 'cuet-free-1', 'English', 'Choose the correctly spelled word.', '["Accomodation","Accommodation","Acommodation","Acomodation"]'::jsonb, 1, null, 3, 1, 1),
  ('q3', 'cuet-free-1', 'General Knowledge', 'Which constitutional body conducts the CUET UG exam in India?', '["UGC","NTA","NCERT","CBSE"]'::jsonb, 1, null, 3, 1, 2),
  ('q4', 'cuet-free-1', 'Logical Reasoning', 'If all launchers are mentors and some mentors are teachers, which conclusion is certain?', '["All teachers are launchers","Some launchers are teachers","All launchers are mentors","No mentor is a teacher"]'::jsonb, 2, null, 3, 1, 3),
  ('q5', 'cuet-pro-1', 'Quantitative Aptitude', '\lim_{x \to 0} \frac{\sin x}{x} = ?', '["0","1","Infinity","Undefined"]'::jsonb, 1, null, 3, 1, 0),
  ('q6', 'cuet-pro-1', 'General Test', 'A student buys a course for Rs 499 with 18% GST included. Approximate base price?', '["423","430","460","499"]'::jsonb, 0, null, 3, 1, 1),
  ('q7', 'cuet-pro-1', 'Language', 'Pick the sentence with the best grammar.', '["The faculty have gave the paper.","The faculty has given the paper.","The faculty is gave the paper.","The faculty giving the paper."]'::jsonb, 1, null, 3, 1, 2),
  ('q8', 'cuet-pro-1', 'Reasoning', 'Series: 2, 6, 12, 20, 30, ?', '["40","42","44","46"]'::jsonb, 1, null, 3, 1, 3),
  ('q9', 'clat-free-1', 'Legal Reasoning', 'A contract made under coercion is generally:', '["Void","Voidable","Illegal","Unenforceable forever"]'::jsonb, 1, null, 3, 1, 0),
  ('q10', 'clat-free-1', 'English', 'Choose the best synonym of "prudent".', '["Careless","Wise","Harsh","Quick"]'::jsonb, 1, null, 3, 1, 1),
  ('q11', 'clat-free-1', 'Quantitative Techniques', '\det \begin{bmatrix} 1 & 2 \\ 3 & 4 \end{bmatrix} = ?', '["-2","2","10","7"]'::jsonb, 0, null, 3, 1, 2),
  ('q12', 'ctet-free-1', 'Pedagogy', 'Continuous and comprehensive evaluation mainly focuses on:', '["Punitive testing","Holistic assessment","Only final exams","Attendance"]'::jsonb, 1, null, 3, 1, 0),
  ('q13', 'ctet-free-1', 'Mathematics', '\frac{3}{4} + \frac{1}{8} = ?', '["7/8","1","5/6","3/8"]'::jsonb, 0, null, 3, 1, 1)
on conflict (id) do update
  set paper_id = excluded.paper_id,
      section = excluded.section,
      prompt = excluded.prompt,
      options = excluded.options,
      correct_index = excluded.correct_index,
      explanation = excluded.explanation,
      marks = excluded.marks,
      negative_marks = excluded.negative_marks,
      sort_order = excluded.sort_order;

insert into purchases
  (id, student_id, course_id, subject_id, amount, purchased_at, receipt_number, valid_until, payment_provider, payment_id, payment_order_id, payment_signature, verified_at)
values
  (
    'purchase-1',
    '11111111-1111-1111-1111-111111111111',
    'cuet',
    'cuet-general-test',
    588.82,
    '2026-03-04T10:45:00Z',
    'ML-20260304-001',
    '2027-03-04T23:59:00Z',
    'razorpay',
    'pay_demo_001',
    'order_demo_001',
    null,
    '2026-03-04T10:46:00Z'
  )
on conflict (id) do update
  set student_id = excluded.student_id,
      course_id = excluded.course_id,
      subject_id = excluded.subject_id,
      amount = excluded.amount,
      purchased_at = excluded.purchased_at,
      receipt_number = excluded.receipt_number,
      valid_until = excluded.valid_until,
      payment_provider = excluded.payment_provider,
      payment_id = excluded.payment_id,
      payment_order_id = excluded.payment_order_id,
      payment_signature = excluded.payment_signature,
      verified_at = excluded.verified_at;

insert into attempts
  (id, student_id, course_id, paper_id, answers, section_scores, score, max_score, submitted_at)
values
  (
    'attempt-1',
    '11111111-1111-1111-1111-111111111111',
    'cuet',
    'cuet-free-1',
    '{"q1":1,"q2":1,"q3":0,"q4":2}'::jsonb,
    '{"Quantitative Aptitude":3,"English":3,"General Knowledge":-1,"Logical Reasoning":3}'::jsonb,
    8,
    12,
    '2026-03-06T18:10:00Z'
  )
on conflict (id) do update
  set student_id = excluded.student_id,
      course_id = excluded.course_id,
      paper_id = excluded.paper_id,
      answers = excluded.answers,
      section_scores = excluded.section_scores,
      score = excluded.score,
      max_score = excluded.max_score,
      submitted_at = excluded.submitted_at;

insert into support_messages (id, student_id, sender_role, message, sent_at)
values
  ('msg-1', '11111111-1111-1111-1111-111111111111', 'admin', 'Welcome to Merit Launchers. Reach out here for payment or course access help.', '2026-03-06T09:00:00Z'),
  ('msg-2', '11111111-1111-1111-1111-111111111111', 'student', 'I received my CUET purchase. Where do I find the premium paper?', '2026-03-06T09:30:00Z'),
  ('msg-3', '11111111-1111-1111-1111-111111111111', 'admin', 'It is already unlocked on your home screen. Open CUET and you will see Premium Paper 1.', '2026-03-06T09:40:00Z')
on conflict (id) do update
  set student_id = excluded.student_id,
      sender_role = excluded.sender_role,
      message = excluded.message,
      sent_at = excluded.sent_at;
SQL
