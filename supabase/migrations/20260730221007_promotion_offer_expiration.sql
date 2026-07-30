alter table public.promotion_offer_state
  add column if not exists expires_at timestamptz;

create index if not exists promotion_offer_state_expiration_idx
  on public.promotion_offer_state (expires_at)
  where expires_at is not null;
