-- Simplifica 3D: Mercado Pago hybrid billing hardening.
-- Applied manually with supabase db query; do not rely on db push for this change.

grant select, insert, update on public.payments to authenticated, service_role;
grant select, insert, update on public.subscriptions to authenticated, service_role;
grant select, insert, update, delete on public.erp_records to authenticated, service_role;

create or replace function private.s3d_guard_trial_consumption()
returns trigger
language plpgsql
security definer
set search_path = public, private
as $$
declare
  v_client_consumed_at timestamptz;
  v_is_trial boolean;
  v_was_trial boolean := false;
begin
  v_is_trial := (
    lower(coalesce(new.active_plan, 'free')) = 'premium_trial'
    or coalesce(new.subscription_status, '') = 'trialing'
    or coalesce(new.status, '') = 'trialing'
    or (
      coalesce(new.is_trial_active, false) is true
      and lower(coalesce(new.active_plan, 'free')) <> 'premium'
      and coalesce(new.subscription_status, '') <> 'active'
    )
  );

  if tg_op = 'UPDATE' then
    v_was_trial := (
      lower(coalesce(old.active_plan, 'free')) = 'premium_trial'
      or coalesce(old.subscription_status, '') = 'trialing'
      or coalesce(old.status, '') = 'trialing'
      or coalesce(old.is_trial_active, false) is true
    );
  end if;

  if not v_is_trial then
    return new;
  end if;

  select c.trial_consumed_at
  into v_client_consumed_at
  from public.clients c
  where c.id = new.client_id
  for update;

  if v_client_consumed_at is not null and not v_was_trial then
    new.plan_code := 'FREE';
    new.plan_status := 'FREE';
    new.subscription_active := false;
    new.active_plan := 'free';
    new.plan_id := (select id from public.plans where slug = 'free' limit 1);
    new.status := 'active';
    new.status_assinatura := 'active';
    new.subscription_status := 'free';
    new.trial_started_at := null;
    new.trial_expires_at := null;
    new.is_trial_active := false;
    new.current_period_start := null;
    new.current_period_end := null;
    new.expires_at := null;
    new.next_billing_at := null;
    new.proximo_vencimento := null;
    new.plan_expires_at := null;
    return new;
  end if;

  new.trial_consumed_at := coalesce(new.trial_consumed_at, v_client_consumed_at, new.trial_started_at, now());
  new.trial_started_at := coalesce(new.trial_started_at, new.current_period_start, new.trial_consumed_at, now());
  new.trial_expires_at := coalesce(new.trial_expires_at, new.current_period_end, new.expires_at, new.trial_started_at + interval '7 days');
  new.plan_code := 'PREMIUM';
  new.plan_status := 'TRIAL';
  new.subscription_active := false;
  new.is_trial_active := true;

  update public.clients c
  set trial_consumed_at = coalesce(c.trial_consumed_at, new.trial_consumed_at),
      updated_at = now()
  where c.id = new.client_id;

  return new;
end;
$$;

drop trigger if exists s3d_guard_trial_consumption on public.subscriptions;
create trigger s3d_guard_trial_consumption
before insert or update of active_plan, status, subscription_status, is_trial_active, trial_started_at, trial_expires_at
on public.subscriptions
for each row execute function private.s3d_guard_trial_consumption();

create or replace function public.upsert_erp_record_if_newer(
  p_collection text,
  p_record_id text,
  p_data jsonb,
  p_deleted_at timestamptz default null
)
returns jsonb
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_collection text := lower(trim(coalesce(p_collection, '')));
  v_record_id text := trim(coalesce(p_record_id, ''));
  v_data jsonb;
  v_owner_id text;
  v_local_updated_at timestamptz := now();
  v_remote public.erp_records%rowtype;
  v_remote_updated_at timestamptz;
begin
  if v_user_id is null then
    raise exception 'AUTH_REQUIRED' using errcode = '28000';
  end if;

  if v_collection not in ('pedidos', 'estoque', 'caixa', 'clientes', 'configuracoes', 'usuarios', 'planos', 'orcamentos') then
    raise exception 'INVALID_COLLECTION %', v_collection using errcode = '22023';
  end if;

  if v_record_id = '' then
    raise exception 'RECORD_ID_REQUIRED' using errcode = '22023';
  end if;

  v_owner_id := v_user_id::text;
  v_data := (coalesce(p_data, '{}'::jsonb) - 'owner_id' - 'ownerId' - 'user_id' - 'userId')
    || jsonb_build_object('owner_id', v_owner_id, 'user_id', v_owner_id);

  begin
    v_local_updated_at := coalesce(
      nullif(v_data->>'updated_at', '')::timestamptz,
      nullif(v_data->>'updatedAt', '')::timestamptz,
      nullif(v_data->>'atualizadoEm', '')::timestamptz,
      now()
    );
  exception when others then
    v_local_updated_at := now();
  end;

  select *
    into v_remote
  from public.erp_records
  where user_id = v_user_id
    and collection = v_collection
    and record_id = v_record_id
  limit 1;

  if found then
    begin
      v_remote_updated_at := coalesce(
        nullif(v_remote.data->>'updated_at', '')::timestamptz,
        nullif(v_remote.data->>'updatedAt', '')::timestamptz,
        v_remote.updated_at
      );
    exception when others then
      v_remote_updated_at := v_remote.updated_at;
    end;

    if v_remote_updated_at > v_local_updated_at then
      return jsonb_build_object(
        'ok', true,
        'action', 'skipped_remote_newer',
        'remote_id', v_remote.id,
        'collection', v_collection,
        'record_id', v_record_id,
        'remote_updated_at', v_remote_updated_at
      );
    end if;

    update public.erp_records
       set owner_id = v_owner_id,
           data = v_data || jsonb_build_object('sync_status', 'synced', 'remote_id', v_remote.id),
           deleted_at = p_deleted_at,
           updated_at = now()
     where id = v_remote.id
     returning * into v_remote;

    return jsonb_build_object(
      'ok', true,
      'action', 'updated',
      'remote_id', v_remote.id,
      'collection', v_collection,
      'record_id', v_record_id,
      'remote_updated_at', v_remote.updated_at
    );
  end if;

  insert into public.erp_records (user_id, owner_id, collection, record_id, data, deleted_at)
  values (
    v_user_id,
    v_owner_id,
    v_collection,
    v_record_id,
    v_data || jsonb_build_object('sync_status', 'synced'),
    p_deleted_at
  )
  returning * into v_remote;

  update public.erp_records
     set data = data || jsonb_build_object('remote_id', v_remote.id, 'owner_id', v_owner_id, 'user_id', v_owner_id)
   where id = v_remote.id
   returning * into v_remote;

  return jsonb_build_object(
    'ok', true,
    'action', 'inserted',
    'remote_id', v_remote.id,
    'collection', v_collection,
    'record_id', v_record_id,
    'remote_updated_at', v_remote.updated_at
  );
end;
$$;

revoke execute on function public.upsert_erp_record_if_newer(text, text, jsonb, timestamptz) from public, anon;
grant execute on function public.upsert_erp_record_if_newer(text, text, jsonb, timestamptz) to authenticated, service_role;

update public.erp_records
   set owner_id = user_id::text,
       data = (coalesce(data, '{}'::jsonb) - 'owner_id' - 'ownerId' - 'user_id' - 'userId')
         || jsonb_build_object(
           'owner_id', user_id::text,
           'user_id', user_id::text,
           'sync_status', coalesce(nullif(data->>'sync_status', ''), 'synced'),
           'remote_id', coalesce(nullif(data->>'remote_id', ''), id::text)
         ),
       updated_at = now()
 where owner_id is distinct from user_id::text
    or data->>'owner_id' is distinct from user_id::text
    or data->>'user_id' is distinct from user_id::text;

create or replace function private.s3d_apply_payment_to_subscription()
returns trigger
language plpgsql
security definer
set search_path = public, private
as $$
declare
  v_status text := lower(coalesce(new.status, ''));
  v_old_status text := '';
  v_plan text := case
    when lower(coalesce(new.plan_slug, 'premium')) in ('premium', 'pro', 'paid', 'pago') then 'premium'
    when lower(coalesce(new.plan_slug, '')) in ('premium_trial', 'trial') then 'premium_trial'
    else 'premium'
  end;
  v_subscription public.subscriptions%rowtype;
  v_price numeric(10,2);
  v_paid_at timestamptz := coalesce(new.paid_at, now());
  v_current_end timestamptz;
  v_base timestamptz;
  v_expires timestamptz;
  v_plan_status text;
  v_subscription_status text;
begin
  if TG_OP = 'UPDATE' then
    v_old_status := lower(coalesce(old.status, ''));
  end if;

  if TG_OP = 'UPDATE' and v_old_status = 'approved' and v_status = 'approved' then
    return new;
  end if;

  if new.subscription_id is not null then
    select * into v_subscription
    from public.subscriptions
    where id = new.subscription_id
    for update;
  end if;

  if v_subscription.id is null and new.client_id is not null then
    select * into v_subscription
    from public.subscriptions
    where client_id = new.client_id
    order by created_at desc
    limit 1
    for update;
  end if;

  if v_subscription.id is null and new.client_id is not null then
    insert into public.subscriptions (
      client_id, user_id, plan_id, active_plan, plan_code, plan_status, status, status_assinatura, subscription_status
    )
    values (
      new.client_id,
      new.user_id,
      (select id from public.plans where slug = 'free' limit 1),
      'free',
      'FREE',
      'FREE',
      'active',
      'active',
      'free'
    )
    returning * into v_subscription;
  end if;

  if v_subscription.id is null then
    return new;
  end if;

  if v_status = 'pending' then
    update public.subscriptions
    set user_id = coalesce(user_id, new.user_id),
        pending_plan = v_plan,
        payment_status = 'pending',
        plan_status = case
          when plan_status = 'BLOCKED' then 'BLOCKED'
          when active_plan = 'premium_trial'
            and coalesce(trial_expires_at, plan_expires_at, current_period_end, expires_at) > now() then 'TRIAL'
          when active_plan = 'premium'
            and coalesce(subscription_status, status) = 'active' then 'ACTIVE'
          else 'PENDING'
        end,
        pending_started_at = coalesce(pending_started_at, new.created_at, now()),
        updated_at = now()
    where id = v_subscription.id
    returning * into v_subscription;

    update public.clients
       set pending_plan = v_plan,
           payment_status = 'pending',
           updated_at = now()
     where id = v_subscription.client_id;
  elsif v_status = 'approved' then
    v_price := coalesce(new.plan_price, new.amount, v_subscription.plan_price, public.s3d_current_paid_price());
    v_current_end := coalesce(
      v_subscription.premium_until,
      v_subscription.plan_expires_at,
      v_subscription.current_period_end,
      v_subscription.expires_at
    );
    v_base := greatest(
      now(),
      v_paid_at,
      coalesce(v_current_end, '-infinity'::timestamptz)
    );
    v_expires := v_base + interval '30 days';

    update public.subscriptions
    set user_id = coalesce(user_id, new.user_id),
        plan_id = (select id from public.plans where slug = v_plan limit 1),
        plan_code = 'PREMIUM',
        plan_status = case when v_plan = 'premium_trial' then 'TRIAL' else 'ACTIVE' end,
        subscription_active = case when v_plan = 'premium' then true else false end,
        manual_override = false,
        manual_override_reason = null,
        active_plan = v_plan,
        pending_plan = null,
        payment_status = 'approved',
        subscription_status = case when v_plan = 'premium_trial' then 'trialing' else 'active' end,
        status = case when v_plan = 'premium_trial' then 'trialing' else 'active' end,
        status_assinatura = case when v_plan = 'premium_trial' then 'trialing' else 'active' end,
        is_trial_active = case when v_plan = 'premium_trial' then true else false end,
        plan_price = case when v_plan = 'premium' then v_price else null end,
        price_locked = case when v_plan = 'premium' then true else false end,
        premium_until = case when v_plan = 'premium' then v_expires else null end,
        plan_expires_at = v_expires,
        current_period_start = case when v_current_end is null or v_current_end <= now() then v_paid_at else coalesce(current_period_start, now()) end,
        current_period_end = v_expires,
        expires_at = v_expires,
        next_billing_at = v_expires,
        proximo_vencimento = v_expires,
        pending_started_at = null,
        promo_used = case when v_plan = 'premium' then true else promo_used end,
        billing_variant = case when v_plan = 'premium' then 'premium_monthly' else billing_variant end,
        blocked_at = null,
        blocked_reason = null,
        updated_at = now()
    where id = v_subscription.id
    returning * into v_subscription;

    update public.clients
       set status = case when status = 'anonymized' then status else 'active' end,
           active_plan = v_plan,
           plano_atual = v_plan,
           pending_plan = null,
           payment_status = 'approved',
           subscription_status = case when v_plan = 'premium_trial' then 'trialing' else 'active' end,
           status_assinatura = case when v_plan = 'premium_trial' then 'trialing' else 'active' end,
           plan_price = case when v_plan = 'premium' then v_price else null end,
           price_locked = case when v_plan = 'premium' then true else false end,
           plan_expires_at = v_expires,
           blocked_at = null,
           blocked_reason = null,
           updated_at = now()
     where id = v_subscription.client_id;
  elsif v_status in ('rejected', 'cancelled', 'refunded', 'charged_back') then
    update public.subscriptions
    set pending_plan = null,
        payment_status = case when v_status in ('refunded', 'charged_back') then 'cancelled' else v_status end,
        pending_started_at = null,
        plan_status = case
          when plan_status = 'BLOCKED' then 'BLOCKED'
          when active_plan = 'premium_trial'
            and coalesce(trial_expires_at, plan_expires_at, current_period_end, expires_at) > now() then 'TRIAL'
          when active_plan = 'premium'
            and coalesce(subscription_status, status) = 'active'
            and (plan_expires_at is null or plan_expires_at > now()) then 'ACTIVE'
          else 'FREE'
        end,
        updated_at = now()
    where id = v_subscription.id
    returning * into v_subscription;

    v_plan_status := coalesce(v_subscription.plan_status, 'FREE');
    v_subscription_status := case
      when v_plan_status = 'TRIAL' then 'trialing'
      when v_plan_status = 'ACTIVE' then 'active'
      when v_plan_status = 'BLOCKED' then 'blocked'
      else 'free'
    end;

    update public.clients
       set pending_plan = null,
           payment_status = case when v_status in ('refunded', 'charged_back') then 'cancelled' else v_status end,
           subscription_status = v_subscription_status,
           status_assinatura = v_subscription_status,
           updated_at = now()
     where id = v_subscription.client_id;
  end if;

  perform public.s3d_cleanup_subscription_state();
  return new;
end;
$$;

update public.subscriptions
   set plan_status = 'ACTIVE',
       subscription_active = true,
       is_trial_active = false,
       updated_at = now()
 where active_plan = 'premium'
   and coalesce(subscription_status, status) = 'active'
   and coalesce(premium_until, plan_expires_at, current_period_end, expires_at) > now()
   and (plan_status is distinct from 'ACTIVE' or coalesce(is_trial_active, false) is true or coalesce(subscription_active, false) is false);

drop trigger if exists s3d_apply_payment_to_subscription on public.payments;
create trigger s3d_apply_payment_to_subscription
after insert or update of status, amount, plan_slug, plan_price on public.payments
for each row execute function private.s3d_apply_payment_to_subscription();

do $$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    alter table public.erp_backups replica identity full;
    alter table public.erp_records replica identity full;
    alter table public.subscriptions replica identity full;
    alter table public.payments replica identity full;

    begin
      alter publication supabase_realtime add table public.erp_backups;
    exception when duplicate_object then
      null;
    end;

    begin
      alter publication supabase_realtime add table public.erp_records;
    exception when duplicate_object then
      null;
    end;

    begin
      alter publication supabase_realtime add table public.subscriptions;
    exception when duplicate_object then
      null;
    end;

    begin
      alter publication supabase_realtime add table public.payments;
    exception when duplicate_object then
      null;
    end;
  end if;
end;
$$;
