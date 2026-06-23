-- Relé mínimo de notificações de mensageria entre o APK Android e as demais sessões do usuário.
-- Não armazena conteúdo da mensagem, anexos, telefone ou identificadores de conversa.

create table if not exists public.user_message_notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  device_id text not null,
  source text not null,
  sender_name text,
  event_key text not null,
  received_at timestamptz not null default now(),
  read_at timestamptz,
  expires_at timestamptz not null default (now() + interval '7 days'),
  created_at timestamptz not null default now(),
  constraint user_message_notifications_source_check
    check (source in ('whatsapp', 'instagram', 'tiktok')),
  constraint user_message_notifications_device_length
    check (char_length(device_id) between 1 and 160),
  constraint user_message_notifications_sender_length
    check (sender_name is null or char_length(sender_name) <= 120),
  constraint user_message_notifications_event_key_length
    check (char_length(event_key) between 16 and 128),
  constraint user_message_notifications_owner_event_unique
    unique (user_id, device_id, event_key)
);

create index if not exists user_message_notifications_user_received_idx
  on public.user_message_notifications (user_id, received_at desc);

create index if not exists user_message_notifications_expiry_idx
  on public.user_message_notifications (expires_at);

create table if not exists public.user_message_notification_devices (
  user_id uuid not null references auth.users(id) on delete cascade,
  device_id text not null,
  token_hash text not null,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (user_id, device_id),
  constraint user_message_notification_devices_device_length
    check (char_length(device_id) between 1 and 160),
  constraint user_message_notification_devices_token_hash_length
    check (char_length(token_hash) = 64)
);

alter table public.user_message_notifications enable row level security;
alter table public.user_message_notifications replica identity full;
alter table public.user_message_notification_devices enable row level security;

revoke all on table public.user_message_notifications from public, anon;
grant select, insert, update, delete on table public.user_message_notifications to authenticated;
revoke all on table public.user_message_notification_devices from public, anon;
grant select, delete on table public.user_message_notification_devices to authenticated;

drop policy if exists "message_notifications_select_own" on public.user_message_notifications;
create policy "message_notifications_select_own"
on public.user_message_notifications for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists "message_notifications_insert_own" on public.user_message_notifications;
create policy "message_notifications_insert_own"
on public.user_message_notifications for insert
to authenticated
with check (
  auth.uid() = user_id
  and received_at <= now() + interval '5 minutes'
  and expires_at <= now() + interval '8 days'
);

drop policy if exists "message_notifications_update_own" on public.user_message_notifications;
create policy "message_notifications_update_own"
on public.user_message_notifications for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "message_notifications_delete_own" on public.user_message_notifications;
create policy "message_notifications_delete_own"
on public.user_message_notifications for delete
to authenticated
using (auth.uid() = user_id);

drop policy if exists "message_notification_devices_select_own" on public.user_message_notification_devices;
create policy "message_notification_devices_select_own"
on public.user_message_notification_devices for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists "message_notification_devices_delete_own" on public.user_message_notification_devices;
create policy "message_notification_devices_delete_own"
on public.user_message_notification_devices for delete
to authenticated
using (auth.uid() = user_id);

create or replace function public.register_message_notification_device(p_device_id text)
returns table(device_token text)
language plpgsql
security definer
set search_path = public, extensions, pg_temp
as $$
declare
  v_user_id uuid := auth.uid();
  v_token text;
begin
  if v_user_id is null then
    raise exception 'AUTH_REQUIRED';
  end if;
  if p_device_id is null or char_length(trim(p_device_id)) < 1 or char_length(trim(p_device_id)) > 160 then
    raise exception 'INVALID_DEVICE_ID';
  end if;
  v_token := encode(gen_random_bytes(32), 'hex');
  insert into public.user_message_notification_devices(user_id, device_id, token_hash, active, updated_at)
  values (v_user_id, trim(p_device_id), encode(digest(v_token, 'sha256'), 'hex'), true, now())
  on conflict (user_id, device_id) do update
    set token_hash = excluded.token_hash,
        active = true,
        updated_at = now();
  return query select v_token;
end;
$$;

revoke all on function public.register_message_notification_device(text) from public, anon;
grant execute on function public.register_message_notification_device(text) to authenticated;

do $$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime')
     and not exists (
       select 1
       from pg_publication_tables
       where pubname = 'supabase_realtime'
         and schemaname = 'public'
         and tablename = 'user_message_notifications'
     ) then
    alter publication supabase_realtime add table public.user_message_notifications;
  end if;
end;
$$;
