-- Simplifica 3D: online-authoritative sync queue support.
-- Keeps user data writes tied to auth.uid() and resolves conflicts by updated_at.

grant select, insert, update, delete on public.erp_records to authenticated, service_role;

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
