-- Fase 5A.1: Mercado Pago webhook hardening.
-- Additive and idempotent. Keeps the existing billing authority intact.

alter table public.subscriptions
  add column if not exists cancel_at_period_end boolean not null default false;

alter table public.clients
  add column if not exists cancel_at_period_end boolean not null default false;

create table if not exists public.billing_webhook_events (
  id uuid primary key default gen_random_uuid(),
  provider text not null default 'mercado_pago',
  event_key text not null,
  event_type text,
  external_id text,
  request_id text,
  signature_ts text,
  status text not null default 'received',
  payload jsonb not null default '{}'::jsonb,
  error text,
  processed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint billing_webhook_events_provider_check check (provider in ('mercado_pago')),
  constraint billing_webhook_events_status_check check (status in ('received', 'processed', 'ignored', 'error'))
);

create unique index if not exists billing_webhook_events_provider_key_unique_idx
  on public.billing_webhook_events(provider, event_key);

create index if not exists billing_webhook_events_created_idx
  on public.billing_webhook_events(created_at desc);

create index if not exists billing_webhook_events_external_idx
  on public.billing_webhook_events(provider, external_id, created_at desc);

alter table public.billing_webhook_events enable row level security;

revoke all on public.billing_webhook_events from public, anon, authenticated;
grant select, insert, update, delete on public.billing_webhook_events to service_role;

create or replace function private.s3d_clear_cancel_at_period_end_on_free()
returns trigger
language plpgsql
security definer
set search_path = public, private
as $$
begin
  if lower(coalesce(new.active_plan, 'free')) = 'free' then
    new.cancel_at_period_end := false;
  end if;
  return new;
end;
$$;

drop trigger if exists s3d_clear_cancel_at_period_end_on_free on public.subscriptions;
create trigger s3d_clear_cancel_at_period_end_on_free
before insert or update of active_plan
on public.subscriptions
for each row execute function private.s3d_clear_cancel_at_period_end_on_free();
