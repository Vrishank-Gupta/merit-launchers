alter table public.purchases
  add column if not exists payment_signature text,
  add column if not exists verified_at timestamptz;

create unique index if not exists idx_purchases_payment_id_unique
  on public.purchases(payment_id)
  where payment_id is not null;
