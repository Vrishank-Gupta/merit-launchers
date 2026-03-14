create extension if not exists "pgcrypto";

create table if not exists users (
  id uuid primary key default gen_random_uuid(),
  role text not null check (role in ('student', 'admin')),
  name text not null default '',
  email text unique,
  phone text unique,
  city text not null default '',
  referral_code text,
  google_sub text unique,
  joined_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists admin_allowlist (
  id text primary key,
  label text not null default '',
  email text,
  phone text,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists affiliates (
  id text primary key,
  name text not null,
  code text not null unique,
  channel text not null default '',
  created_at timestamptz not null default now()
);

create table if not exists courses (
  id text primary key,
  title text not null,
  subtitle text not null default '',
  description text not null default '',
  price numeric(10,2) not null default 0,
  validity_days integer not null default 365,
  highlights jsonb not null default '[]'::jsonb,
  intro_video_url text,
  hero_label text not null default 'POPULAR',
  is_published boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists papers (
  id text primary key,
  course_id text not null references courses(id) on delete cascade,
  title text not null,
  duration_minutes integer not null,
  instructions jsonb not null default '[]'::jsonb,
  is_free_preview boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists questions (
  id text primary key,
  paper_id text not null references papers(id) on delete cascade,
  section text not null default '',
  prompt text not null,
  prompt_segments jsonb,
  options jsonb not null,
  option_segments jsonb,
  correct_index integer not null,
  explanation text,
  marks integer not null default 3,
  negative_marks integer not null default 1,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists purchases (
  id text primary key,
  student_id uuid not null references users(id) on delete cascade,
  course_id text not null references courses(id) on delete cascade,
  amount numeric(10,2) not null,
  purchased_at timestamptz not null,
  receipt_number text not null,
  valid_until timestamptz,
  payment_provider text not null default 'razorpay',
  payment_id text,
  payment_order_id text,
  payment_signature text,
  verified_at timestamptz
);

create table if not exists attempts (
  id text primary key,
  student_id uuid not null references users(id) on delete cascade,
  course_id text not null references courses(id) on delete cascade,
  paper_id text not null references papers(id) on delete cascade,
  answers jsonb not null,
  section_scores jsonb not null,
  score integer not null,
  max_score integer not null,
  submitted_at timestamptz not null
);

create table if not exists support_messages (
  id text primary key,
  student_id uuid references users(id) on delete cascade,
  sender_role text not null check (sender_role in ('student', 'admin')),
  message text not null,
  sent_at timestamptz not null
);

create index if not exists idx_papers_course_id on papers(course_id);
create index if not exists idx_questions_paper_id on questions(paper_id);
create index if not exists idx_purchases_student_id on purchases(student_id);
create index if not exists idx_attempts_student_id on attempts(student_id);
create index if not exists idx_support_messages_student_id on support_messages(student_id);
