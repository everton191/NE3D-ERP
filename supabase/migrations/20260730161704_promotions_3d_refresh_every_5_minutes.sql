-- Atualiza o agregador de promoções do próprio Simplifica a cada cinco minutos,
-- mesmo quando nenhum usuário está com a PWA/APK aberta. O endpoint continua sendo a fonte
-- da busca; o Supabase atua somente como agendador gratuito.
create extension if not exists pg_net with schema extensions;
create extension if not exists pg_cron;

create table if not exists public.promotion_offer_state (
  offer_id text primary key,
  store text not null,
  host text not null,
  title text not null,
  category text not null,
  current_price numeric(12,2) not null check (current_price > 0),
  previous_price numeric(12,2),
  old_price numeric(12,2),
  discount integer not null default 0 check (discount between 0 and 99),
  image_url text,
  offer_url text not null,
  unchanged_scans integer not null default 0 check (unchanged_scans >= 0),
  is_stable boolean not null default false,
  first_seen_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now(),
  price_changed_at timestamptz not null default now(),
  source_updated_at timestamptz,
  updated_at timestamptz not null default now()
);

create index if not exists promotion_offer_state_active_idx
  on public.promotion_offer_state (last_seen_at desc, is_stable, price_changed_at desc);

alter table public.promotion_offer_state enable row level security;

drop policy if exists promotion_offer_state_public_read on public.promotion_offer_state;
create policy promotion_offer_state_public_read
  on public.promotion_offer_state
  for select
  to anon, authenticated
  using (last_seen_at >= now() - interval '2 hours');

grant select on public.promotion_offer_state to anon, authenticated, service_role;
grant insert, update, delete on public.promotion_offer_state to service_role;

create table if not exists public.promotion_bot_state (
  singleton boolean primary key default true check (singleton),
  last_started_at timestamptz,
  last_finished_at timestamptz,
  last_status text not null default 'idle',
  last_offer_count integer not null default 0,
  last_changed_count integer not null default 0,
  last_error text,
  updated_at timestamptz not null default now()
);

alter table public.promotion_bot_state enable row level security;
revoke all on public.promotion_bot_state from public, anon, authenticated;
grant select, insert, update, delete on public.promotion_bot_state to service_role;

insert into public.promotion_bot_state (singleton)
values (true)
on conflict (singleton) do nothing;

do $$
declare
  v_job_id bigint;
begin
  select jobid
    into v_job_id
    from cron.job
   where jobname in ('simplifica-promotions-refresh-10m', 'simplifica-promotions-refresh-5m')
   limit 1;

  if v_job_id is not null then
    perform cron.unschedule(v_job_id);
  end if;

  perform cron.schedule(
    'simplifica-promotions-refresh-5m',
    '*/5 * * * *',
    $cron$
      select net.http_post(
        url := 'https://qsufnnivlgdidmjuaprb.supabase.co/functions/v1/promotions-refresh',
        headers := jsonb_build_object(
          'Content-Type', 'application/json',
          'User-Agent', 'Simplifica3D-Promotions-Cron/1.0'
        ),
        body := '{}'::jsonb,
        timeout_milliseconds := 45000
      );
    $cron$
  );
end
$$;
