begin;
set local lock_timeout = '5s';
set local statement_timeout = '30s';
do $gate$
declare
  v_definition text := replace(pg_get_functiondef('public.storefront_publication_allowed(uuid)'::regprocedure), E'\r\n', E'\n');
  v_old constant text := '  if v_active_plan not in (''start'', ''pro'') or v_payment_status = ''pending'' then';
  v_new constant text := $guard$
  if v_license_blocked or (v_client_id is not null and exists (
    select 1 from public.clients c where c.id = v_client_id
      and (c.status = 'blocked' or c.blocked_at is not null))) then
    return false;
  end if;
  if v_active_plan not in ('start', 'pro') then
    return false;
  end if;
  -- A pending renewal cannot withdraw a confirmed, still-valid paid period.
  -- A first payment, Free, trial/pending state or unconfirmed expiry is not enough.
  if v_payment_status = 'pending' and not (
    v_active_plan in ('start', 'pro') and v_subscription_status = 'active'
    and v_period_end is not null and v_period_end > now()) then$guard$;
begin
  if (length(v_definition) - length(replace(v_definition, v_old, ''))) / length(v_old) <> 1
    or position('  v_period_end timestamptz;' in v_definition) = 0
    or position('    coalesce(sub.cancel_at_period_end, false),' in v_definition) = 0
    or position('v_payment_status, v_cancel_at_period_end, v_period_end' in v_definition) = 0 then
    raise exception 'Contrato de publicacao inesperado';
  end if;
  v_definition := replace(v_definition, '  v_period_end timestamptz;', E'  v_period_end timestamptz;\n  v_license_blocked boolean;');
  v_definition := replace(v_definition, '    coalesce(sub.cancel_at_period_end, false),',
    E'    coalesce(sub.cancel_at_period_end, false),\n    (coalesce(sub.plan_status, '''') = ''BLOCKED'' or sub.blocked_at is not null),');
  v_definition := replace(v_definition, 'v_payment_status, v_cancel_at_period_end, v_period_end',
    'v_payment_status, v_cancel_at_period_end, v_license_blocked, v_period_end');
  execute replace(v_definition, v_old, v_new);
end;
$gate$;
-- Data, RLS policies, grants and installed signature remain unchanged.
notify pgrst, 'reload schema';
commit;
