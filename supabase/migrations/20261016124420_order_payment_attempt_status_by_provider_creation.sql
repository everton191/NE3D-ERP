begin;
set local lock_timeout = '5s';
set local statement_timeout = '60s';
lock table public.payments in share row exclusive mode;

alter table private.payment_license_effects
  add column source_created_at timestamptz,
  add column attempt_review_at timestamptz,
  add column attempt_review_reason text check (attempt_review_reason in ('ambiguous_attempt_time', 'historical_attempt_unknown')),
  add constraint payment_attempt_review_pair check ((attempt_review_at is null) = (attempt_review_reason is null));
create index payment_effects_attempt_source_idx on private.payment_license_effects(client_id, subscription_id, source_created_at);

create function private.s3d_provider_timestamp(p_raw text) returns timestamptz
language plpgsql immutable security invoker set search_path = pg_catalog as $$
begin
  if p_raw is null or p_raw !~ '^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?(Z|[+-]\d{2}:\d{2})$' then return null; end if;
  return p_raw::timestamptz;
exception when invalid_datetime_format or datetime_field_overflow then return null;
end;
$$;
alter function private.s3d_provider_timestamp(text) owner to postgres;
revoke all on function private.s3d_provider_timestamp(text) from public, anon, authenticated, service_role;

-- Freeze only provider creation dates actually present in existing snapshots.
-- Missing/invalid dates remain unknown. No financial/customer/license rewrite.
do $integrity$
begin
  if exists(select 1 from private.payment_license_effects e join public.payments p on p.id = e.payment_id
    left join public.subscriptions s on s.id = e.subscription_id
    where e.client_id <> p.client_id or (e.subscription_id is not null and s.client_id is distinct from e.client_id)) then
    raise exception 'Vinculo historico de pagamento exige revisao antes da migracao' using errcode = '23503';
  end if;
end;
$integrity$;
insert into private.payment_license_effects(payment_id, client_id, subscription_id, source_created_at)
select p.id, p.client_id, s.id, private.s3d_provider_timestamp(p.metadata->>'date_created')
from public.payments p left join public.subscriptions s on s.client_id = p.client_id
on conflict(payment_id) do update set source_created_at = excluded.source_created_at,
  subscription_id = coalesce(private.payment_license_effects.subscription_id, excluded.subscription_id);

create function private.s3d_project_payment_attempt(p_payment public.payments, p_subscription uuid) returns boolean
language plpgsql security invoker set search_path = pg_catalog as $$
declare
  v_raw text := p_payment.metadata->>'date_created';
  v_created timestamptz := private.s3d_provider_timestamp(v_raw);
  v_effect uuid;
  v_latest timestamptz;
  v_unknown boolean;
  v_reason text;
begin
  if v_raw is not null and v_created is null then
    raise exception 'Data de criacao do pagamento invalida' using errcode = '22023';
  end if;
  insert into private.payment_license_effects as target(payment_id, client_id, subscription_id, source_created_at)
  values(p_payment.id, p_payment.client_id, p_subscription, v_created)
  on conflict(payment_id) do update set source_created_at = coalesce(target.source_created_at, excluded.source_created_at),
    subscription_id = coalesce(target.subscription_id, excluded.subscription_id)
  where target.client_id = excluded.client_id
    and (target.subscription_id is null or target.subscription_id = excluded.subscription_id)
    and (target.source_created_at is null or excluded.source_created_at is null or target.source_created_at = excluded.source_created_at)
  returning payment_id into v_effect;
  if v_effect is null then raise exception 'Identidade ou criacao imutavel do pagamento conflitante' using errcode = '22023'; end if;
  -- Explicit privileged legacy writes keep their previous contract. The public
  -- provider-ingestion RPC below requires source dates and cannot use this path.
  if v_created is null then return true; end if;
  -- A confirmed recurring checkout can exist before its first payment. Only a
  -- payment from that contract may resolve its intention; an unrelated older
  -- payment still records its financial state and earns any independent credit.
  -- checkout is server-persisted metadata (ordinary sessions cannot write it).
  if exists(select 1 from public.subscriptions s where s.id = p_subscription
    and s.pending_plan is not null
    and nullif(s.metadata->'checkout'->>'provider_id', '') is not null
    and s.metadata->'checkout'->>'provider_id' = s.mercado_pago_subscription_id
    and nullif(p_payment.mercado_pago_subscription_id, '') is distinct from s.mercado_pago_subscription_id) then
    return false;
  end if;
  select max(e.source_created_at), bool_or(e.source_created_at is null) into v_latest, v_unknown
  from private.payment_license_effects e where e.client_id = p_payment.client_id
    and e.subscription_id = p_subscription and e.payment_id <> p_payment.id;
  if v_latest > v_created then return false; end if;
  if v_latest = v_created then v_reason := 'ambiguous_attempt_time';
  elsif coalesce(v_unknown, false) then v_reason := 'historical_attempt_unknown';
  else return true;
  end if;
  update private.payment_license_effects set attempt_review_at = now(), attempt_review_reason = v_reason
  where payment_id = p_payment.id and attempt_review_at is null;
  if found then
    insert into public.audit_logs(client_id, action, details)
    values(p_payment.client_id, 'billing_payment_attempt_review_required', jsonb_build_object(
      'payment_id', p_payment.id, 'mercado_pago_payment_id', p_payment.mercado_pago_payment_id,
      'reason', v_reason, 'source_created_at', v_created, 'latest_source_created_at', v_latest,
      'policy', 'preserve_current_attempt_projection', 'operated_at', now()));
  end if;
  return false;
end;
$$;
alter function private.s3d_project_payment_attempt(public.payments,uuid) owner to postgres;
revoke all on function private.s3d_project_payment_attempt(public.payments,uuid) from public, anon, authenticated, service_role;

do $trigger$
declare
  v_definition text := replace(pg_get_functiondef('private.s3d_apply_payment_to_subscription()'::regprocedure), E'\r\n', E'\n');
  v_create text;
  v_start constant text := E'  -- Duplicate notifications must not extend the period a second time.';
  v_pending constant text := E'  if v_status = ''pending'' then\n';
  v_negative constant text := E'    update public.subscriptions\n    set pending_plan = null,\n';
  v_anchor text;
begin
  v_create := substring(v_definition from $pattern$  if v_subscription.id is null and new.client_id is not null then[\s\S]*?  if v_subscription.id is null then return new; end if;\n$pattern$);
  if v_create is null or position('s3d_project_payment_attempt' in v_definition) > 0 then
    raise exception 'Contrato do trigger inesperado';
  end if;
  foreach v_anchor in array array[v_create, v_start, v_pending, v_negative,
    E'  v_review_reason text;\n', E'      if v_preserve_projection or v_keep_pending then\n',
    'and not exists (', E'      v_keep_pending := v_subscription.payment_status = ''pending'' and exists (',
    'pending_started_at = coalesce(pending_started_at, new.created_at, now()),'] loop
    if (length(v_definition) - length(replace(v_definition, v_anchor, ''))) / length(v_anchor) <> 1 then
      raise exception 'Ancora do trigger inesperada: %', left(v_anchor, 90);
    end if;
  end loop;
  v_definition := replace(v_definition, E'  v_review_reason text;\n', E'  v_review_reason text;\n  v_project_attempt boolean := true;\n  v_has_attempt_source boolean := false;\n');
  v_definition := replace(v_definition, v_create, '');
  v_definition := replace(v_definition, v_start, v_create || E'\n  v_has_attempt_source := new.metadata->>''date_created'' is not null;\n  v_project_attempt := private.s3d_project_payment_attempt(new, v_subscription.id);\n\n' || v_start);
  v_definition := replace(v_definition, v_pending, v_pending || E'    if not v_project_attempt then return new; end if;\n');
  v_definition := replace(v_definition, v_negative, E'    if not v_project_attempt then return new; end if;\n' || v_negative);
  v_definition := replace(v_definition, E'      if v_preserve_projection or v_keep_pending then\n', E'      if v_preserve_projection or v_keep_pending or not v_project_attempt then\n');
  v_definition := replace(v_definition, 'and not exists (', 'and (v_has_attempt_source or not exists (');
  v_definition := replace(v_definition, E'and p.created_at >= now() - interval ''24 hours'');', E'and p.created_at >= now() - interval ''24 hours''));');
  v_definition := replace(v_definition, E'      v_keep_pending := v_subscription.payment_status = ''pending'' and exists (',
    E'      v_keep_pending := v_subscription.payment_status = ''pending'' and (not v_project_attempt or exists (');
  v_definition := replace(v_definition, E'and p.criado_em > coalesce(new.criado_em, new.created_at));', E'and p.criado_em > coalesce(new.criado_em, new.created_at)));');
  v_definition := replace(v_definition, 'case when v_keep_pending then v_subscription.', 'case when not v_project_attempt or v_keep_pending then v_subscription.');
  v_definition := replace(v_definition, 'if v_review_reason is null and not v_keep_pending and v_subscription.payment_status = ''pending'' then',
    'if v_review_reason is null and v_project_attempt and not v_keep_pending and v_subscription.payment_status = ''pending'' then');
  v_definition := replace(v_definition, 'pending_started_at = coalesce(pending_started_at, new.created_at, now()),',
    'pending_started_at = case when v_has_attempt_source then new.criado_em else coalesce(pending_started_at, new.created_at, now()) end,');
  execute v_definition;
end;
$trigger$;

do $rpc$
declare
  v_definition text := replace(pg_get_functiondef('public.apply_mercadopago_payment(uuid,uuid,text,text,jsonb)'::regprocedure), E'\r\n', E'\n');
  v_anchor constant text := E'    if v_version = v_previous_version then\n';
begin
  if position('v_created := coalesce((p_payment->>''date_created'')::timestamptz, v_version);' in v_definition) = 0
    or position(v_anchor in v_definition) = 0 then raise exception 'Contrato da ingestao inesperado'; end if;
  v_definition := replace(v_definition, 'v_created := coalesce((p_payment->>''date_created'')::timestamptz, v_version);',
    'v_created := (p_payment->>''date_created'')::timestamptz;');
  v_definition := replace(v_definition, 'if v_version is null then', 'if v_version is null or v_created is null then');
  v_definition := replace(v_definition, 'date_last_updated do provedor obrigatoria', 'date_last_updated e date_created do provedor obrigatorias');
  v_definition := replace(v_definition, v_anchor, E'    if v_existing.metadata->>''date_created'' is not null\n      and (v_existing.metadata->>''date_created'')::timestamptz is distinct from v_created then\n      raise exception ''Data de criacao imutavel do pagamento conflitante'' using errcode = ''22023'';\n    end if;\n' || v_anchor);
  execute v_definition;
end;
$rpc$;

-- All effect rows retain their original credit/review state. Only new private
-- attempt facts were added; paid validity and refund policy are unchanged.
-- Rollback: restore the trigger/RPC before removing helpers/new columns.
notify pgrst, 'reload schema';
commit;
