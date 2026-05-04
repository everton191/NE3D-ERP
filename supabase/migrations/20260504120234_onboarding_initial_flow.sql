-- Etapa 8: onboarding inicial simples e idempotente.
-- Mantem compatibilidade com bancos que ja receberam parte dos campos.

alter table if exists public.profiles
  add column if not exists onboarding_completed boolean not null default false,
  add column if not exists onboarding_step integer not null default 0;

alter table if exists public.erp_profiles
  add column if not exists onboarding_completed boolean not null default false,
  add column if not exists onboarding_step integer not null default 0;

alter table if exists public.companies
  add column if not exists setup_completed boolean not null default false,
  add column if not exists print_type text,
  add column if not exists default_material text;

update public.profiles
set onboarding_completed = coalesce(onboarding_completed, false),
    onboarding_step = coalesce(onboarding_step, 0)
where onboarding_completed is null
   or onboarding_step is null;

update public.erp_profiles
set onboarding_completed = coalesce(onboarding_completed, false),
    onboarding_step = coalesce(onboarding_step, 0)
where onboarding_completed is null
   or onboarding_step is null;

update public.companies
set setup_completed = coalesce(setup_completed, false)
where setup_completed is null;
