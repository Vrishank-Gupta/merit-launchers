create extension if not exists "pgcrypto";

create table if not exists public.profiles (
  id text primary key,
  name text not null,
  contact text not null,
  city text not null,
  referral_code text,
  joined_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.affiliates (
  id text primary key,
  name text not null,
  code text not null unique,
  channel text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.courses (
  id text primary key,
  title text not null,
  subtitle text not null,
  description text not null,
  price numeric(10,2) not null default 0,
  validity_days integer not null default 365,
  highlights jsonb not null default '[]'::jsonb,
  intro_video_url text,
  hero_label text not null default 'POPULAR',
  is_published boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.papers (
  id text primary key,
  course_id text not null references public.courses(id) on delete cascade,
  title text not null,
  duration_minutes integer not null,
  instructions jsonb not null default '[]'::jsonb,
  is_free_preview boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.questions (
  id text primary key,
  paper_id text not null references public.papers(id) on delete cascade,
  section text not null,
  prompt text not null,
  options jsonb not null,
  correct_index integer not null,
  explanation text,
  marks integer not null default 3,
  negative_marks integer not null default 1,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.purchases (
  id text primary key,
  student_id text not null references public.profiles(id) on delete cascade,
  course_id text not null references public.courses(id) on delete cascade,
  amount numeric(10,2) not null,
  receipt_number text not null unique,
  payment_provider text not null default 'razorpay',
  payment_id text,
  payment_order_id text,
  purchased_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create table if not exists public.attempts (
  id text primary key,
  student_id text not null references public.profiles(id) on delete cascade,
  course_id text not null references public.courses(id) on delete cascade,
  paper_id text not null references public.papers(id) on delete cascade,
  answers jsonb not null default '{}'::jsonb,
  section_scores jsonb not null default '{}'::jsonb,
  score integer not null,
  max_score integer not null,
  submitted_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create table if not exists public.support_messages (
  id text primary key,
  sender_role text not null check (sender_role in ('student', 'admin')),
  student_id text references public.profiles(id) on delete set null,
  message text not null,
  sent_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create index if not exists idx_papers_course_id on public.papers(course_id);
create index if not exists idx_questions_paper_id on public.questions(paper_id, sort_order);
create index if not exists idx_purchases_student_id on public.purchases(student_id, purchased_at desc);
create index if not exists idx_attempts_student_id on public.attempts(student_id, submitted_at desc);
create index if not exists idx_support_messages_student_id on public.support_messages(student_id, sent_at desc);

alter table public.profiles enable row level security;
alter table public.affiliates enable row level security;
alter table public.courses enable row level security;
alter table public.papers enable row level security;
alter table public.questions enable row level security;
alter table public.purchases enable row level security;
alter table public.attempts enable row level security;
alter table public.support_messages enable row level security;

drop policy if exists "dev public read profiles" on public.profiles;
create policy "dev public read profiles" on public.profiles
for select to anon, authenticated using (true);

drop policy if exists "dev public write profiles" on public.profiles;
create policy "dev public write profiles" on public.profiles
for all to anon, authenticated using (true) with check (true);

drop policy if exists "dev public read affiliates" on public.affiliates;
create policy "dev public read affiliates" on public.affiliates
for select to anon, authenticated using (true);

drop policy if exists "dev public write affiliates" on public.affiliates;
create policy "dev public write affiliates" on public.affiliates
for all to anon, authenticated using (true) with check (true);

drop policy if exists "dev public read courses" on public.courses;
create policy "dev public read courses" on public.courses
for select to anon, authenticated using (true);

drop policy if exists "dev public write courses" on public.courses;
create policy "dev public write courses" on public.courses
for all to anon, authenticated using (true) with check (true);

drop policy if exists "dev public read papers" on public.papers;
create policy "dev public read papers" on public.papers
for select to anon, authenticated using (true);

drop policy if exists "dev public write papers" on public.papers;
create policy "dev public write papers" on public.papers
for all to anon, authenticated using (true) with check (true);

drop policy if exists "dev public read questions" on public.questions;
create policy "dev public read questions" on public.questions
for select to anon, authenticated using (true);

drop policy if exists "dev public write questions" on public.questions;
create policy "dev public write questions" on public.questions
for all to anon, authenticated using (true) with check (true);

drop policy if exists "dev public read purchases" on public.purchases;
create policy "dev public read purchases" on public.purchases
for select to anon, authenticated using (true);

drop policy if exists "dev public write purchases" on public.purchases;
create policy "dev public write purchases" on public.purchases
for all to anon, authenticated using (true) with check (true);

drop policy if exists "dev public read attempts" on public.attempts;
create policy "dev public read attempts" on public.attempts
for select to anon, authenticated using (true);

drop policy if exists "dev public write attempts" on public.attempts;
create policy "dev public write attempts" on public.attempts
for all to anon, authenticated using (true) with check (true);

drop policy if exists "dev public read support_messages" on public.support_messages;
create policy "dev public read support_messages" on public.support_messages
for select to anon, authenticated using (true);

drop policy if exists "dev public write support_messages" on public.support_messages;
create policy "dev public write support_messages" on public.support_messages
for all to anon, authenticated using (true) with check (true);
