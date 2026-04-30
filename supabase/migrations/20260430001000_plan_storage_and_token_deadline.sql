-- Simplifica 3D: storage limits and launch token deadline.

alter table public.plans
  add column if not exists max_storage_mb integer;

update public.plans
set
  price = 0,
  max_users = 1,
  max_orders = 10,
  max_clients = 10,
  max_calculator_uses = 30,
  max_storage_mb = 25,
  allow_pdf = false,
  allow_reports = false,
  allow_permissions = false
where slug = 'free';

update public.plans
set
  price = 29.90,
  max_users = 2,
  max_orders = null,
  max_clients = null,
  max_calculator_uses = null,
  max_storage_mb = 250,
  allow_pdf = true,
  allow_reports = false,
  allow_permissions = false
where slug = 'pro';

update public.plans
set
  price = 54.90,
  max_users = 5,
  max_orders = null,
  max_clients = null,
  max_calculator_uses = null,
  max_storage_mb = null,
  allow_pdf = true,
  allow_reports = true,
  allow_permissions = true
where slug = 'premium';

update public.plans
set max_storage_mb = 250
where slug = 'pro_token';

update public.plans
set max_storage_mb = null
where slug = 'premium_trial';

update public.promotional_tokens
set expira_em = least(coalesce(expira_em, timestamptz '2026-06-30 23:59:59-03'), timestamptz '2026-06-30 23:59:59-03')
where usado = false;
