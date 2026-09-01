-- Converte apenas o estado comercial corrente. Pagamentos historicos conservam
-- os nomes antigos para rastreabilidade contabil/auditoria.
do $migration$
declare
  pro_plan_id uuid;
  publication_function text;
begin
  select id
  into pro_plan_id
  from public.plans
  where slug = 'pro'
    and active = true
  limit 1;

  if pro_plan_id is null then
    raise exception 'Plano Pro ativo nao encontrado; migracao abortada';
  end if;

  alter table public.subscriptions drop constraint if exists subscriptions_active_plan_check;
  alter table public.subscriptions drop constraint if exists subscriptions_pending_plan_check;
  alter table public.subscriptions drop constraint if exists subscriptions_plan_code_check;
  alter table public.subscriptions drop constraint if exists subscriptions_billing_variant_check;
  alter table public.clients drop constraint if exists clients_active_plan_check;
  alter table public.clients drop constraint if exists clients_pending_plan_check;

  update public.subscriptions
  set plan_id = pro_plan_id,
      active_plan = 'pro',
      plan_code = case when upper(coalesce(plan_code, '')) in ('PREMIUM', 'PREMIUM_TRIAL') then 'PRO' else plan_code end,
      pending_plan = case when pending_plan in ('premium', 'premium_trial') then 'pro' else pending_plan end,
      billing_variant = case when billing_variant like 'premium%' then 'pro_monthly' else billing_variant end,
      is_trial_active = false,
      trial_started_at = null,
      trial_expires_at = null,
      updated_at = now()
  where active_plan in ('premium', 'premium_trial');

  update public.clients
  set active_plan = 'pro',
      plano_atual = 'pro',
      pending_plan = case when pending_plan in ('premium', 'premium_trial') then 'pro' else pending_plan end,
      is_trial_active = false,
      trial_started_at = null,
      trial_expires_at = null,
      updated_at = now()
  where active_plan in ('premium', 'premium_trial')
     or plano_atual in ('premium', 'premium_trial');

  -- Alinha os campos derivados de todas as assinaturas correntes ao catalogo
  -- Free/Start/Pro. Isto remove rotulos premium que sobraram em contas Free.
  update public.subscriptions
  set plan_code = case active_plan
        when 'free' then 'FREE'
        when 'start' then 'START'
        when 'pro' then 'PRO'
      end,
      billing_variant = case active_plan
        when 'free' then null
        when 'start' then 'start_monthly'
        when 'pro' then 'pro_monthly'
      end,
      updated_at = now()
  where active_plan in ('free', 'start', 'pro');

  select pg_get_functiondef('public.storefront_publication_allowed(uuid)'::regprocedure)
  into publication_function;

  publication_function := replace(
    publication_function,
    $$v_active_plan not in ('start', 'pro', 'premium', 'premium_trial')$$,
    $$v_active_plan not in ('start', 'pro')$$
  );

  if position($$v_active_plan not in ('start', 'pro')$$ in publication_function) = 0 then
    raise exception 'Guard de publicacao nao foi atualizado';
  end if;

  execute publication_function;

  alter table public.subscriptions
    add constraint subscriptions_active_plan_check check (active_plan in ('free', 'start', 'pro')),
    add constraint subscriptions_pending_plan_check check (pending_plan is null or pending_plan in ('free', 'start', 'pro')),
    add constraint subscriptions_plan_code_check check (plan_code in ('FREE', 'START', 'PRO')),
    add constraint subscriptions_billing_variant_check check (billing_variant is null or billing_variant in ('start_monthly', 'pro_monthly'));

  alter table public.clients
    add constraint clients_active_plan_check check (active_plan in ('free', 'start', 'pro')),
    add constraint clients_pending_plan_check check (pending_plan is null or pending_plan in ('free', 'start', 'pro'));
end;
$migration$;
