alter table public.purchases
  add column if not exists valid_until timestamptz;
