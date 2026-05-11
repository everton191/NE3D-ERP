create or replace function private.s3d_backup_payload_has_operational_data(p_payload jsonb)
returns boolean
language sql
immutable
as $$
  with data as (
    select coalesce(p_payload -> 'data', p_payload, '{}'::jsonb) as body
  )
  select (
    coalesce(jsonb_array_length(case when jsonb_typeof(body -> 'pedidos') = 'array' then body -> 'pedidos' else '[]'::jsonb end), 0)
    + coalesce(jsonb_array_length(case when jsonb_typeof(body -> 'estoque') = 'array' then body -> 'estoque' else '[]'::jsonb end), 0)
    + coalesce(jsonb_array_length(case when jsonb_typeof(body -> 'caixa') = 'array' then body -> 'caixa' else '[]'::jsonb end), 0)
    + coalesce(jsonb_array_length(case when jsonb_typeof(body -> 'orcamentos') = 'array' then body -> 'orcamentos' else '[]'::jsonb end), 0)
  ) > 0
  from data;
$$;

create or replace function private.s3d_guard_empty_erp_backup_overwrite()
returns trigger
language plpgsql
security definer
set search_path = public, private
as $$
declare
  v_remote_records integer := 0;
begin
  if private.s3d_backup_payload_has_operational_data(new.payload) then
    return new;
  end if;

  if tg_op = 'UPDATE' and private.s3d_backup_payload_has_operational_data(old.payload) then
    raise exception 'EMPTY_BACKUP_OVERWRITE_BLOCKED';
  end if;

  select count(*)
    into v_remote_records
  from public.erp_records
  where user_id = new.user_id
    and deleted_at is null
    and collection in ('pedidos', 'estoque', 'caixa', 'orcamentos');

  if v_remote_records > 0 then
    raise exception 'EMPTY_BACKUP_WITH_REMOTE_RECORDS_BLOCKED';
  end if;

  return new;
end;
$$;

drop trigger if exists s3d_guard_empty_erp_backup_overwrite on public.erp_backups;

create trigger s3d_guard_empty_erp_backup_overwrite
before insert or update of payload on public.erp_backups
for each row
execute function private.s3d_guard_empty_erp_backup_overwrite();
