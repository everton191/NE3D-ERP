-- ERP cash, payments and fiscal-ready foundation.
-- Additive only: keeps the current simple UX and legacy erp_records sync intact.

create extension if not exists pgcrypto;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table if not exists public.payment_methods (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references public.companies(id) on delete cascade,
  owner_id uuid references auth.users(id) on delete set null,
  name text not null,
  type text not null default 'other',
  active boolean not null default true,
  fiscal_code text,
  metadata_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint payment_methods_type_check check (
    type in ('cash', 'pix', 'credit', 'debit', 'boleto', 'store_credit', 'other')
  ),
  constraint payment_methods_metadata_object check (jsonb_typeof(metadata_json) = 'object')
);

create unique index if not exists payment_methods_empresa_name_unique_idx
  on public.payment_methods (empresa_id, lower(name));
create index if not exists payment_methods_empresa_active_idx
  on public.payment_methods (empresa_id, active, name);

create table if not exists public.cash_sessions (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references public.companies(id) on delete cascade,
  usuario_id uuid references auth.users(id) on delete set null,
  opened_at timestamptz not null default now(),
  closed_at timestamptz,
  opening_balance numeric(14,2) not null default 0,
  closing_balance numeric(14,2),
  expected_balance numeric(14,2) not null default 0,
  difference_amount numeric(14,2) not null default 0,
  status text not null default 'open',
  mode text not null default 'auto',
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint cash_sessions_status_check check (status in ('open', 'closed', 'cancelled')),
  constraint cash_sessions_mode_check check (mode in ('auto', 'manual')),
  constraint cash_sessions_amounts_check check (
    opening_balance >= 0
    and (closing_balance is null or closing_balance >= 0)
    and expected_balance >= 0
  ),
  constraint cash_sessions_close_after_open_check check (closed_at is null or closed_at >= opened_at)
);

create unique index if not exists cash_sessions_open_operator_unique_idx
  on public.cash_sessions (empresa_id, usuario_id)
  where status = 'open';
create index if not exists cash_sessions_empresa_status_idx
  on public.cash_sessions (empresa_id, status, opened_at desc);

create table if not exists public.cash_movements (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.cash_sessions(id) on delete restrict,
  empresa_id uuid not null references public.companies(id) on delete cascade,
  type text not null,
  amount numeric(14,2) not null,
  payment_method_id uuid references public.payment_methods(id) on delete set null,
  description text,
  reference_collection text,
  reference_id text,
  created_by uuid references auth.users(id) on delete set null default auth.uid(),
  metadata_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  constraint cash_movements_type_check check (
    type in ('sale', 'sangria', 'suprimento', 'retirada', 'estorno', 'adjustment', 'opening', 'closing')
  ),
  constraint cash_movements_amount_nonnegative check (amount >= 0),
  constraint cash_movements_metadata_object check (jsonb_typeof(metadata_json) = 'object')
);

create index if not exists cash_movements_session_created_idx
  on public.cash_movements (session_id, created_at desc);
create index if not exists cash_movements_empresa_type_created_idx
  on public.cash_movements (empresa_id, type, created_at desc);
create index if not exists cash_movements_reference_idx
  on public.cash_movements (reference_collection, reference_id);

create table if not exists public.sale_payments (
  id uuid primary key default gen_random_uuid(),
  sale_id text not null,
  empresa_id uuid not null references public.companies(id) on delete cascade,
  session_id uuid references public.cash_sessions(id) on delete set null,
  payment_method_id uuid references public.payment_methods(id) on delete set null,
  amount numeric(14,2) not null,
  created_by uuid references auth.users(id) on delete set null default auth.uid(),
  metadata_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  constraint sale_payments_amount_positive check (amount > 0),
  constraint sale_payments_metadata_object check (jsonb_typeof(metadata_json) = 'object')
);

create index if not exists sale_payments_sale_idx
  on public.sale_payments (empresa_id, sale_id, created_at desc);
create index if not exists sale_payments_session_idx
  on public.sale_payments (session_id, created_at desc);

create table if not exists public.fiscal_documents (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references public.companies(id) on delete cascade,
  sale_id text,
  document_type text not null default 'none',
  status text not null default 'draft',
  number text,
  series text,
  access_key text,
  xml_url text,
  pdf_url text,
  fiscal_payload jsonb not null default '{}'::jsonb,
  issued_at timestamptz,
  cancelled_at timestamptz,
  created_by uuid references auth.users(id) on delete set null default auth.uid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint fiscal_documents_type_check check (document_type in ('none', 'nfce', 'nfe')),
  constraint fiscal_documents_status_check check (
    status in ('draft', 'authorized', 'cancelled', 'rejected', 'contingency')
  ),
  constraint fiscal_documents_payload_object check (jsonb_typeof(fiscal_payload) = 'object')
);

create index if not exists fiscal_documents_empresa_sale_idx
  on public.fiscal_documents (empresa_id, sale_id, created_at desc);
create unique index if not exists fiscal_documents_access_key_unique_idx
  on public.fiscal_documents (access_key)
  where access_key is not null and access_key <> '';

create table if not exists public.erp_customer_fiscal_profiles (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references public.companies(id) on delete cascade,
  customer_record_id text not null,
  cpf_cnpj text,
  ie text,
  ind_ie text,
  razao_social text,
  nome_fantasia text,
  endereco_fiscal jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint erp_customer_fiscal_profiles_address_object check (jsonb_typeof(endereco_fiscal) = 'object')
);

create unique index if not exists erp_customer_fiscal_profiles_customer_unique_idx
  on public.erp_customer_fiscal_profiles (empresa_id, customer_record_id);

create table if not exists public.erp_audit_events (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references public.companies(id) on delete cascade,
  user_id uuid references auth.users(id) on delete set null default auth.uid(),
  entity_type text not null,
  entity_id text,
  action text not null,
  before_json jsonb,
  after_json jsonb,
  metadata_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  constraint erp_audit_events_metadata_object check (jsonb_typeof(metadata_json) = 'object')
);

create index if not exists erp_audit_events_empresa_created_idx
  on public.erp_audit_events (empresa_id, created_at desc);
create index if not exists erp_audit_events_entity_idx
  on public.erp_audit_events (empresa_id, entity_type, entity_id, created_at desc);

alter table public.erp_records
  add column if not exists empresa_id uuid references public.companies(id) on delete set null,
  add column if not exists cash_session_id uuid references public.cash_sessions(id) on delete set null,
  add column if not exists fiscal_document_id uuid references public.fiscal_documents(id) on delete set null,
  add column if not exists payment_summary_json jsonb not null default '{}'::jsonb,
  add column if not exists fiscal_ready_json jsonb not null default '{}'::jsonb;

create index if not exists erp_records_empresa_collection_idx
  on public.erp_records (empresa_id, collection, updated_at desc)
  where empresa_id is not null;
create index if not exists erp_records_cash_session_idx
  on public.erp_records (cash_session_id)
  where cash_session_id is not null;

alter table public.store_products
  add column if not exists ncm text,
  add column if not exists cfop_padrao text,
  add column if not exists cest text,
  add column if not exists origem text,
  add column if not exists unidade_comercial text,
  add column if not exists ean text,
  add column if not exists tributacao jsonb not null default '{}'::jsonb;

alter table public.clients
  add column if not exists cpf_cnpj text,
  add column if not exists ie text,
  add column if not exists ind_ie text,
  add column if not exists razao_social text,
  add column if not exists nome_fantasia text,
  add column if not exists endereco_fiscal jsonb not null default '{}'::jsonb;

drop trigger if exists set_payment_methods_updated_at on public.payment_methods;
create trigger set_payment_methods_updated_at
before update on public.payment_methods
for each row execute function public.set_updated_at();

drop trigger if exists set_cash_sessions_updated_at on public.cash_sessions;
create trigger set_cash_sessions_updated_at
before update on public.cash_sessions
for each row execute function public.set_updated_at();

drop trigger if exists set_fiscal_documents_updated_at on public.fiscal_documents;
create trigger set_fiscal_documents_updated_at
before update on public.fiscal_documents
for each row execute function public.set_updated_at();

drop trigger if exists set_erp_customer_fiscal_profiles_updated_at on public.erp_customer_fiscal_profiles;
create trigger set_erp_customer_fiscal_profiles_updated_at
before update on public.erp_customer_fiscal_profiles
for each row execute function public.set_updated_at();

alter table public.payment_methods enable row level security;
alter table public.cash_sessions enable row level security;
alter table public.cash_movements enable row level security;
alter table public.sale_payments enable row level security;
alter table public.fiscal_documents enable row level security;
alter table public.erp_customer_fiscal_profiles enable row level security;
alter table public.erp_audit_events enable row level security;

drop policy if exists "company members read payment methods" on public.payment_methods;
create policy "company members read payment methods"
on public.payment_methods for select
to authenticated
using (public.erp_is_superadmin() or public.s3d_is_company_member(empresa_id));

drop policy if exists "company members manage payment methods" on public.payment_methods;
create policy "company members manage payment methods"
on public.payment_methods for all
to authenticated
using (public.erp_is_superadmin() or public.s3d_is_company_member(empresa_id))
with check (public.erp_is_superadmin() or public.s3d_is_company_member(empresa_id));

drop policy if exists "company members read cash sessions" on public.cash_sessions;
create policy "company members read cash sessions"
on public.cash_sessions for select
to authenticated
using (public.erp_is_superadmin() or public.s3d_is_company_member(empresa_id));

drop policy if exists "company members manage cash sessions" on public.cash_sessions;
create policy "company members manage cash sessions"
on public.cash_sessions for all
to authenticated
using (public.erp_is_superadmin() or public.s3d_is_company_member(empresa_id))
with check (public.erp_is_superadmin() or public.s3d_is_company_member(empresa_id));

drop policy if exists "company members read cash movements" on public.cash_movements;
create policy "company members read cash movements"
on public.cash_movements for select
to authenticated
using (public.erp_is_superadmin() or public.s3d_is_company_member(empresa_id));

drop policy if exists "company members insert cash movements" on public.cash_movements;
create policy "company members insert cash movements"
on public.cash_movements for insert
to authenticated
with check (
  public.erp_is_superadmin()
  or (public.s3d_is_company_member(empresa_id) and (created_by is null or created_by = auth.uid()))
);

drop policy if exists "superadmins update cash movements" on public.cash_movements;
create policy "superadmins update cash movements"
on public.cash_movements for update
to authenticated
using (public.erp_is_superadmin())
with check (public.erp_is_superadmin());

drop policy if exists "company members read sale payments" on public.sale_payments;
create policy "company members read sale payments"
on public.sale_payments for select
to authenticated
using (public.erp_is_superadmin() or public.s3d_is_company_member(empresa_id));

drop policy if exists "company members manage sale payments" on public.sale_payments;
create policy "company members manage sale payments"
on public.sale_payments for all
to authenticated
using (public.erp_is_superadmin() or public.s3d_is_company_member(empresa_id))
with check (public.erp_is_superadmin() or public.s3d_is_company_member(empresa_id));

drop policy if exists "company members read fiscal documents" on public.fiscal_documents;
create policy "company members read fiscal documents"
on public.fiscal_documents for select
to authenticated
using (public.erp_is_superadmin() or public.s3d_is_company_member(empresa_id));

drop policy if exists "company members manage fiscal documents" on public.fiscal_documents;
create policy "company members manage fiscal documents"
on public.fiscal_documents for all
to authenticated
using (public.erp_is_superadmin() or public.s3d_is_company_member(empresa_id))
with check (public.erp_is_superadmin() or public.s3d_is_company_member(empresa_id));

drop policy if exists "company members read customer fiscal profiles" on public.erp_customer_fiscal_profiles;
create policy "company members read customer fiscal profiles"
on public.erp_customer_fiscal_profiles for select
to authenticated
using (public.erp_is_superadmin() or public.s3d_is_company_member(empresa_id));

drop policy if exists "company members manage customer fiscal profiles" on public.erp_customer_fiscal_profiles;
create policy "company members manage customer fiscal profiles"
on public.erp_customer_fiscal_profiles for all
to authenticated
using (public.erp_is_superadmin() or public.s3d_is_company_member(empresa_id))
with check (public.erp_is_superadmin() or public.s3d_is_company_member(empresa_id));

drop policy if exists "company members read audit events" on public.erp_audit_events;
create policy "company members read audit events"
on public.erp_audit_events for select
to authenticated
using (public.erp_is_superadmin() or public.s3d_is_company_member(empresa_id));

drop policy if exists "company members insert audit events" on public.erp_audit_events;
create policy "company members insert audit events"
on public.erp_audit_events for insert
to authenticated
with check (
  public.erp_is_superadmin()
  or (public.s3d_is_company_member(empresa_id) and (user_id is null or user_id = auth.uid()))
);

create or replace function public.get_or_create_cash_session(
  p_empresa_id uuid,
  p_usuario_id uuid default auth.uid(),
  p_opening_balance numeric default 0,
  p_mode text default 'auto'
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_session_id uuid;
begin
  if p_empresa_id is null then
    raise exception 'empresa_id is required';
  end if;

  if not (public.erp_is_superadmin() or public.s3d_is_company_member(p_empresa_id)) then
    raise exception 'not allowed for this company';
  end if;

  select id
    into v_session_id
  from public.cash_sessions
  where empresa_id = p_empresa_id
    and usuario_id is not distinct from p_usuario_id
    and status = 'open'
  order by opened_at desc
  limit 1;

  if v_session_id is not null then
    return v_session_id;
  end if;

  insert into public.cash_sessions (
    empresa_id,
    usuario_id,
    opening_balance,
    expected_balance,
    mode
  )
  values (
    p_empresa_id,
    p_usuario_id,
    coalesce(p_opening_balance, 0),
    coalesce(p_opening_balance, 0),
    coalesce(nullif(p_mode, ''), 'auto')
  )
  returning id into v_session_id;

  return v_session_id;
end;
$$;

create or replace function public.ensure_default_payment_methods(p_empresa_id uuid)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_inserted integer := 0;
begin
  if p_empresa_id is null then
    raise exception 'empresa_id is required';
  end if;

  if not (public.erp_is_superadmin() or public.s3d_is_company_member(p_empresa_id)) then
    raise exception 'not allowed for this company';
  end if;

  insert into public.payment_methods (empresa_id, owner_id, name, type, fiscal_code)
  values
    (p_empresa_id, auth.uid(), 'Dinheiro', 'cash', '01'),
    (p_empresa_id, auth.uid(), 'PIX', 'pix', '17'),
    (p_empresa_id, auth.uid(), 'Credito', 'credit', '03'),
    (p_empresa_id, auth.uid(), 'Debito', 'debit', '04'),
    (p_empresa_id, auth.uid(), 'Boleto', 'boleto', '15'),
    (p_empresa_id, auth.uid(), 'Crediario', 'store_credit', '05')
  on conflict do nothing;

  get diagnostics v_inserted = row_count;
  return v_inserted;
end;
$$;

create or replace function public.register_erp_audit_event(
  p_empresa_id uuid,
  p_entity_type text,
  p_entity_id text,
  p_action text,
  p_before_json jsonb default null,
  p_after_json jsonb default null,
  p_metadata_json jsonb default '{}'::jsonb
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_event_id uuid;
begin
  if p_empresa_id is null or nullif(p_action, '') is null or nullif(p_entity_type, '') is null then
    raise exception 'empresa_id, entity_type and action are required';
  end if;

  if not (public.erp_is_superadmin() or public.s3d_is_company_member(p_empresa_id)) then
    raise exception 'not allowed for this company';
  end if;

  insert into public.erp_audit_events (
    empresa_id,
    user_id,
    entity_type,
    entity_id,
    action,
    before_json,
    after_json,
    metadata_json
  )
  values (
    p_empresa_id,
    auth.uid(),
    p_entity_type,
    p_entity_id,
    p_action,
    p_before_json,
    p_after_json,
    coalesce(p_metadata_json, '{}'::jsonb)
  )
  returning id into v_event_id;

  return v_event_id;
end;
$$;

grant select, insert, update on public.payment_methods to authenticated;
grant select, insert, update on public.cash_sessions to authenticated;
grant select, insert on public.cash_movements to authenticated;
grant select, insert, update on public.sale_payments to authenticated;
grant select, insert, update on public.fiscal_documents to authenticated;
grant select, insert, update on public.erp_customer_fiscal_profiles to authenticated;
grant select, insert on public.erp_audit_events to authenticated;
grant execute on function public.get_or_create_cash_session(uuid, uuid, numeric, text) to authenticated;
grant execute on function public.ensure_default_payment_methods(uuid) to authenticated;
grant execute on function public.register_erp_audit_event(uuid, text, text, text, jsonb, jsonb, jsonb) to authenticated;

comment on table public.cash_sessions is 'Cash register sessions. Phase 1 foundation; simple mode can auto-open sessions without changing current UX.';
comment on table public.cash_movements is 'Immutable cash movements for sales, sangria, suprimento, retirada, estorno and adjustments.';
comment on table public.sale_payments is 'Payment split per sale, allowing multiple payment methods for the same sale.';
comment on table public.fiscal_documents is 'Fiscal document shell for future NFC-e/NFe integration; no emission logic yet.';
comment on column public.erp_records.payment_summary_json is 'Compatibility bridge for legacy synced orders/cash records until normalized payments are adopted.';
comment on column public.erp_records.fiscal_ready_json is 'Compatibility bridge for fiscal metadata on legacy synced records.';
