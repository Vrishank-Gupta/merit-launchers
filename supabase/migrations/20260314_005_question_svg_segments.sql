alter table public.questions
  add column if not exists prompt_segments jsonb,
  add column if not exists option_segments jsonb;
