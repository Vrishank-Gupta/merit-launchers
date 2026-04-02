create extension if not exists "pgcrypto";

create table if not exists users (
  id uuid primary key default gen_random_uuid(),
  role text not null check (role in ('student', 'admin')),
  name text not null default '',
  email text unique,
  password_hash text,
  email_verified_at timestamptz,
  phone text unique,
  city text not null default '',
  referral_code text,
  google_sub text unique,
  signup_source text check (signup_source in ('android', 'web', 'ios')),
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

create table if not exists admin_accounts (
  id text primary key,
  name text not null,
  email text not null unique,
  role_type text not null check (role_type in ('admin', 'marketing_admin')),
  password_hash text not null,
  is_active boolean not null default true,
  created_by text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists subjects (
  id text primary key,
  course_id text not null references courses(id) on delete cascade,
  title text not null,
  description text not null default '',
  sort_order integer not null default 0,
  is_published boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists papers (
  id text primary key,
  course_id text not null references courses(id) on delete cascade,
  subject_id text references subjects(id) on delete set null,
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
  topic text,
  concepts jsonb not null default '[]'::jsonb,
  difficulty text not null default 'medium',
  marks integer not null default 3,
  negative_marks integer not null default 1,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists purchases (
  id text primary key,
  student_id uuid not null references users(id) on delete cascade,
  course_id text not null references courses(id) on delete cascade,
  subject_id text references subjects(id) on delete set null,
  amount numeric(10,2) not null,
  purchased_at timestamptz not null,
  receipt_number text not null,
  valid_until timestamptz,
  payment_provider text not null default 'razorpay',
  payment_id text,
  payment_order_id text,
  payment_signature text,
  verified_at timestamptz,
  purchase_source text check (purchase_source in ('android', 'web', 'ios'))
);

create table if not exists login_events (
  id bigserial primary key,
  user_id uuid not null references users(id) on delete cascade,
  platform text not null check (platform in ('android', 'web', 'ios')),
  logged_at timestamptz not null default now()
);

create index if not exists idx_login_events_user_id on login_events(user_id);
create index if not exists idx_login_events_logged_at on login_events(logged_at);

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
);

create table if not exists support_messages (
    id text primary key,
    student_id uuid references users(id) on delete cascade,
    sender_role text not null check (sender_role in ('student', 'admin')),
    message text not null,
  sent_at timestamptz not null
);

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
  status text not null default 'draft' check (status in ('draft', 'published')),
  publish_date timestamptz,
  views integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_blogs_slug on blogs(slug);
create index if not exists idx_blogs_status on blogs(status);
create index if not exists idx_papers_course_id on papers(course_id);
create index if not exists idx_papers_subject_id on papers(subject_id);
create index if not exists idx_subjects_course_id on subjects(course_id);
create index if not exists idx_questions_paper_id on questions(paper_id);
create index if not exists idx_purchases_student_id on purchases(student_id);
create index if not exists idx_purchases_subject_id on purchases(subject_id);
create index if not exists idx_attempts_student_id on attempts(student_id);
create index if not exists idx_exam_sessions_student_id on exam_sessions(student_id);
create index if not exists idx_exam_sessions_paper_id on exam_sessions(paper_id);

-- Partner Dashboard additions
ALTER TABLE affiliates ADD COLUMN IF NOT EXISTS associate_id text unique;
ALTER TABLE affiliates ADD COLUMN IF NOT EXISTS partner_type text not null default 'Education Associate';
ALTER TABLE affiliates ADD COLUMN IF NOT EXISTS login_email text unique;
ALTER TABLE affiliates ADD COLUMN IF NOT EXISTS login_password_hash text;
ALTER TABLE affiliates ADD COLUMN IF NOT EXISTS bank_details jsonb default '{}'::jsonb;

CREATE TABLE IF NOT EXISTS commission_slab_history (
  id text primary key,
  affiliate_id text references affiliates(id) on delete cascade,
  slab numeric(5,2) not null,
  effective_from date not null,
  effective_to date,
  created_at timestamptz not null default now()
);

CREATE TABLE IF NOT EXISTS referral_clicks (
  id text primary key,
  affiliate_code text not null,
  channel text not null default 'direct',
  ip_hash text not null,
  clicked_at timestamptz not null default now(),
  converted_to_signup boolean not null default false,
  converted_to_paid boolean not null default false
);
CREATE UNIQUE INDEX IF NOT EXISTS referral_clicks_unique ON referral_clicks(affiliate_code, channel, ip_hash, date(clicked_at));

CREATE TABLE IF NOT EXISTS commission_payouts (
  id text primary key,
  affiliate_id text references affiliates(id),
  month text not null,
  gross_revenue numeric not null,
  weighted_commission_rate numeric not null,
  commission_amount numeric not null,
  status text not null default 'pending',
  paid_amount numeric,
  paid_at timestamptz,
  paid_by text,
  notes text,
  created_at timestamptz not null default now()
);

CREATE TABLE IF NOT EXISTS partner_toolkit_files (
  id text primary key,
  title text not null,
  category text not null default 'other',
  file_url text not null,
  file_name text not null,
  uploaded_by text,
  created_at timestamptz not null default now()
);
create index if not exists idx_support_messages_student_id on support_messages(student_id);
