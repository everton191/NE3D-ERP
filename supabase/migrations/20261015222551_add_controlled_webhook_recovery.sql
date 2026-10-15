begin;
set local lock_timeout = '5s';
set local statement_timeout = '30s';

-- Age alone is NOT proof that a worker stopped. Before calling, an operator
-- must suspend deliveries and verify there are no workers/requests in flight.
-- These arguments record that operational attestation, not an automatic lease.
create or replace function public.recover_billing_webhook_event(
  p_event_key text,
  p_expected_updated_at timestamptz,
  p_reason text,
  p_quiescence_reference text,
  p_workers_stopped boolean
)
returns jsonb
language plpgsql
security invoker
set search_path = pg_catalog
as $function$
declare
  v_event public.billing_webhook_events%rowtype;
  v_now timestamptz;
  v_audit_id uuid;
begin
  if nullif(trim(p_event_key), '') is null or p_expected_updated_at is null
    or length(trim(coalesce(p_reason, ''))) not between 3 and 1000
    or length(trim(coalesce(p_quiescence_reference, ''))) not between 3 and 1000
    or p_workers_stopped is distinct from true then
    raise exception 'Chave, versao, motivo e confirmacao de encerramento obrigatorios'
      using errcode = '22023';
  end if;

  select * into v_event from public.billing_webhook_events
  where provider = 'mercado_pago' and event_key = p_event_key
  for update;
  if not found then
    raise exception 'Evento nao encontrado' using errcode = 'P0002';
  end if;
  if v_event.updated_at is distinct from p_expected_updated_at then
    raise exception 'Evento mudou; reler antes de recuperar' using errcode = '40001';
  end if;
  if v_event.status <> 'received' then
    raise exception 'Somente eventos received podem ser recuperados' using errcode = '55000';
  end if;
  v_now := clock_timestamp();
  if v_event.updated_at > v_now - interval '15 minutes' then
    raise exception 'Evento recente; recuperacao negada' using errcode = '55000';
  end if;

  update public.billing_webhook_events
  set status = 'error', error = 'Recuperacao controlada: ' || trim(p_reason),
      processed_at = null, updated_at = v_now
  where id = v_event.id and status = 'received' and updated_at = p_expected_updated_at;
  if not found then
    raise exception 'Evento mudou durante recuperacao' using errcode = '40001';
  end if;

  -- Atomic with the reset: an audit INSERT failure rolls back the status change.
  insert into public.audit_logs (user_id, client_id, action, details)
  values (null, null, 'billing_webhook_recovered', jsonb_build_object(
    'actor', 'service_role', 'provider', v_event.provider, 'event_key', v_event.event_key,
    'external_id', v_event.external_id, 'previous_status', v_event.status,
    'new_status', 'error', 'previous_updated_at', v_event.updated_at,
    'operated_at', v_now, 'reason', trim(p_reason),
    'quiescence_reference', trim(p_quiescence_reference), 'workers_stopped', true
  )) returning id into v_audit_id;

  return jsonb_build_object('recovered', true, 'event_key', v_event.event_key,
    'previous_status', v_event.status, 'status', 'error',
    'previous_updated_at', v_event.updated_at, 'updated_at', v_now, 'audit_id', v_audit_id);
end;
$function$;

revoke all on function public.recover_billing_webhook_event(text,timestamptz,text,text,boolean)
  from public, anon, authenticated;
grant execute on function public.recover_billing_webhook_event(text,timestamptz,text,text,boolean)
  to service_role;

-- No event/customer rows are changed by installation. Controlled rollback:
-- drop function public.recover_billing_webhook_event(text,timestamptz,text,text,boolean);
notify pgrst, 'reload schema';
commit;
