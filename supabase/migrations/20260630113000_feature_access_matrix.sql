-- Simplifica 3D: central feature access matrix.
-- Keeps frontend and backend aligned for plan, interface mode and user role checks.

create table if not exists public.app_feature_access_rules (
  feature_key text primary key,
  visible_name text not null,
  required_plan text not null default 'free',
  partial_plan text,
  allowed_modes text[] not null default array['simplifica', 'profissional'],
  allowed_roles text[] not null default array['owner', 'admin'],
  requires_active_plan boolean not null default true,
  requires_strong_confirmation boolean not null default false,
  future_only boolean not null default false,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint app_feature_access_rules_plan_check check (required_plan in ('free', 'start', 'pro')),
  constraint app_feature_access_rules_partial_plan_check check (partial_plan is null or partial_plan in ('free', 'start', 'pro')),
  constraint app_feature_access_rules_modes_check check (allowed_modes <@ array['simplifica', 'profissional']::text[]),
  constraint app_feature_access_rules_roles_check check (allowed_roles <@ array['owner', 'admin', 'manager', 'cashier', 'production', 'sales', 'viewer']::text[]),
  constraint app_feature_access_rules_metadata_object_check check (jsonb_typeof(metadata) = 'object')
);

drop trigger if exists app_feature_access_rules_set_updated_at on public.app_feature_access_rules;
create trigger app_feature_access_rules_set_updated_at
before update on public.app_feature_access_rules
for each row execute function public.set_updated_at();

alter table public.app_feature_access_rules enable row level security;

drop policy if exists "feature access rules read authenticated" on public.app_feature_access_rules;
create policy "feature access rules read authenticated"
on public.app_feature_access_rules for select
to authenticated
using (auth.uid() is not null or public.erp_is_superadmin());

drop policy if exists "feature access rules superadmin manage" on public.app_feature_access_rules;
create policy "feature access rules superadmin manage"
on public.app_feature_access_rules for all
using (public.erp_is_superadmin())
with check (public.erp_is_superadmin());

revoke all on public.app_feature_access_rules from public, anon, authenticated;
grant select on public.app_feature_access_rules to authenticated, service_role;
grant insert, update, delete on public.app_feature_access_rules to service_role;

insert into public.app_feature_access_rules (
  feature_key, visible_name, required_plan, partial_plan, allowed_modes, allowed_roles, requires_active_plan, requires_strong_confirmation, future_only
) values
  ('basic_dashboard', 'Dashboard simples', 'free', null, array['simplifica','profissional'], array['owner','admin','manager','cashier','production','sales','viewer'], false, false, false),
  ('advanced_dashboard', 'Dashboard avançado', 'pro', 'start', array['profissional'], array['owner','admin','manager','viewer'], true, false, false),
  ('basic_calculator', 'Calculadora básica', 'free', null, array['simplifica','profissional'], array['owner','admin','manager','production','sales'], false, false, false),
  ('professional_calculator', 'Calculadora profissional', 'pro', 'start', array['profissional'], array['owner','admin','manager','production','sales'], true, false, false),
  ('calculator_settings', 'Configurações da calculadora', 'free', null, array['simplifica','profissional'], array['owner','admin','manager'], true, false, false),
  ('basic_orders', 'Pedidos básicos', 'free', null, array['simplifica','profissional'], array['owner','admin','manager','cashier','production','sales','viewer'], false, false, false),
  ('advanced_orders', 'Pedidos avançados', 'pro', 'start', array['profissional'], array['owner','admin','manager','production','sales','viewer'], true, false, false),
  ('basic_products', 'Produtos básicos', 'free', null, array['simplifica','profissional'], array['owner','admin','manager','sales','production','viewer'], false, false, false),
  ('advanced_products', 'Produtos avançados', 'pro', 'start', array['profissional'], array['owner','admin','manager','sales'], true, false, false),
  ('basic_stock', 'Estoque básico', 'free', null, array['simplifica','profissional'], array['owner','admin','manager','production','sales','viewer'], false, false, false),
  ('spool_stock', 'Estoque por rolo', 'pro', 'start', array['simplifica','profissional'], array['owner','admin','manager','production','sales','viewer'], true, false, false),
  ('stock_settings', 'Configurações de estoque', 'free', null, array['simplifica','profissional'], array['owner','admin','manager'], true, false, false),
  ('simple_cashier', 'Caixa simples', 'free', null, array['simplifica','profissional'], array['owner','admin','manager','cashier','sales'], false, false, false),
  ('advanced_cashier', 'Caixa avançado', 'pro', 'start', array['profissional'], array['owner','admin','manager','cashier'], true, false, false),
  ('basic_store', 'Loja simples', 'start', null, array['simplifica','profissional'], array['owner','admin','manager','sales','viewer'], true, false, false),
  ('advanced_store', 'Loja avançada', 'pro', 'start', array['profissional'], array['owner','admin','manager','sales'], true, false, false),
  ('simple_production', 'Produção simples', 'free', null, array['simplifica','profissional'], array['owner','admin','manager','production','sales','viewer'], false, false, false),
  ('advanced_production', 'Produção avançada', 'pro', 'start', array['profissional'], array['owner','admin','manager','production'], true, false, false),
  ('machines_assets', 'Máquinas e ativos', 'pro', 'start', array['profissional'], array['owner','admin','manager','production'], true, false, false),
  ('printer_monitoring', 'Monitoramento de impressoras', 'pro', null, array['profissional'], array['owner','admin','manager','production'], true, false, false),
  ('printer_remote_control', 'Controle remoto de impressoras', 'pro', null, array['profissional'], array['owner','admin'], true, true, true),
  ('simple_reports', 'Relatórios simples', 'start', null, array['simplifica','profissional'], array['owner','admin','manager','cashier','production','sales','viewer'], true, false, false),
  ('advanced_reports', 'Relatórios avançados', 'pro', 'start', array['profissional'], array['owner','admin','manager','cashier','production','sales','viewer'], true, false, false),
  ('employees_management', 'Funcionários e permissões', 'pro', null, array['profissional'], array['owner','admin'], true, false, false),
  ('basic_account_security', 'Conta e segurança básica', 'free', null, array['simplifica','profissional'], array['owner','admin','manager','cashier','production','sales','viewer'], false, false, false),
  ('advanced_account_security', 'Segurança avançada', 'pro', 'start', array['simplifica','profissional'], array['owner','admin','manager','cashier','production','sales','viewer'], true, false, false),
  ('account_deletion', 'Exclusão de conta', 'free', null, array['simplifica','profissional'], array['owner'], true, true, false),
  ('theme_settings', 'Configurações de tema', 'free', null, array['simplifica','profissional'], array['owner','admin','manager'], true, false, false)
on conflict (feature_key) do update
set visible_name = excluded.visible_name,
    required_plan = excluded.required_plan,
    partial_plan = excluded.partial_plan,
    allowed_modes = excluded.allowed_modes,
    allowed_roles = excluded.allowed_roles,
    requires_active_plan = excluded.requires_active_plan,
    requires_strong_confirmation = excluded.requires_strong_confirmation,
    future_only = excluded.future_only,
    updated_at = now();

create or replace function public.can_access_app_feature(
  p_feature_key text,
  p_plan_slug text default 'free',
  p_interface_mode text default 'simplifica',
  p_user_role text default 'owner',
  p_plan_active boolean default true
)
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_rule public.app_feature_access_rules%rowtype;
  v_plan_rank integer;
  v_required_rank integer;
  v_role text := lower(coalesce(nullif(trim(p_user_role), ''), 'owner'));
  v_mode text := lower(coalesce(nullif(trim(p_interface_mode), ''), 'simplifica'));
  v_plan text := lower(coalesce(nullif(trim(p_plan_slug), ''), 'free'));
  v_state text := 'enabled';
begin
  select * into v_rule
  from public.app_feature_access_rules
  where feature_key = p_feature_key;

  if not found then
    return jsonb_build_object('allowed', true, 'state', 'enabled', 'feature', p_feature_key, 'message', 'Recurso liberado.');
  end if;

  v_plan_rank := case v_plan when 'pro' then 2 when 'start' then 1 else 0 end;
  v_required_rank := case v_rule.required_plan when 'pro' then 2 when 'start' then 1 else 0 end;

  if v_rule.requires_active_plan and p_plan_active is false then
    v_state := 'disabled_by_status';
  elsif not (v_mode = any(v_rule.allowed_modes)) then
    v_state := 'hidden_by_mode';
  elsif v_plan_rank < v_required_rank then
    v_state := 'locked_by_plan';
  elsif not (v_role = any(v_rule.allowed_roles)) then
    v_state := 'blocked_by_role';
  end if;

  return jsonb_build_object(
    'allowed', v_state = 'enabled',
    'state', v_state,
    'feature', v_rule.feature_key,
    'label', v_rule.visible_name,
    'requiredPlan', v_rule.required_plan,
    'partialPlan', coalesce(v_rule.partial_plan, ''),
    'mode', v_mode,
    'role', v_role,
    'strongConfirmation', v_rule.requires_strong_confirmation,
    'future', v_rule.future_only,
    'message',
      case v_state
        when 'locked_by_plan' then v_rule.visible_name || ' está disponível no plano ' || upper(v_rule.required_plan) || '.'
        when 'hidden_by_mode' then v_rule.visible_name || ' está disponível no Modo Profissional.'
        when 'blocked_by_role' then 'Seu usuário não tem permissão para acessar essa função.'
        when 'disabled_by_status' then 'Regularize seu plano para continuar usando este recurso.'
        else 'Recurso liberado.'
      end
  );
end;
$$;

revoke all on function public.can_access_app_feature(text, text, text, text, boolean) from public, anon;
grant execute on function public.can_access_app_feature(text, text, text, text, boolean) to authenticated, service_role;
