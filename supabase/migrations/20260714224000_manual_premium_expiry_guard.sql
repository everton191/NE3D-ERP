begin;

create or replace function public.superadmin_update_subscription(
  target_user_id text,
  action text,
  plan_code text default null,
  premium_until timestamptz default null,
  reason text default null
)
returns jsonb
language plpgsql
security invoker
set search_path = public, private
as $$
begin
  if upper(trim(coalesce(action, ''))) = 'ACTIVATE_PREMIUM_MANUAL'
     and (premium_until is null or premium_until <= now()) then
    raise exception 'A liberação manual exige uma data de vencimento futura.'
      using errcode = '22023';
  end if;

  return private.superadmin_update_subscription_impl(
    target_user_id,
    action,
    plan_code,
    premium_until,
    reason
  );
end;
$$;

revoke execute on function public.superadmin_update_subscription(text, text, text, timestamptz, text) from public, anon;
grant execute on function public.superadmin_update_subscription(text, text, text, timestamptz, text) to authenticated, service_role;

commit;
