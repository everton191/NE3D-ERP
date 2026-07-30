create table if not exists public.mercadolivre_oauth_sessions (
  state text primary key,
  code_verifier text not null,
  expires_at timestamptz not null,
  created_at timestamptz not null default now()
);

create table if not exists public.mercadolivre_oauth_tokens (
  singleton boolean primary key default true check (singleton),
  access_token text not null,
  refresh_token text not null,
  expires_at timestamptz not null,
  scope text,
  user_id text,
  updated_at timestamptz not null default now()
);

alter table public.mercadolivre_oauth_sessions enable row level security;
alter table public.mercadolivre_oauth_tokens enable row level security;

revoke all on public.mercadolivre_oauth_sessions from public, anon, authenticated;
revoke all on public.mercadolivre_oauth_tokens from public, anon, authenticated;
grant select, insert, update, delete on public.mercadolivre_oauth_sessions to service_role;
grant select, insert, update, delete on public.mercadolivre_oauth_tokens to service_role;
