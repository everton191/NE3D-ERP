do $$
begin
  if to_regclass('public.inventory') is null then
    raise notice 'public.inventory does not exist; inventory owner RLS skipped.';
    return;
  end if;

  if not exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'inventory'
      and column_name = 'user_id'
  ) then
    raise exception 'public.inventory.user_id is required for owner RLS policies.';
  end if;

  execute 'alter table public.inventory enable row level security';
  execute 'grant select, insert, update, delete on public.inventory to authenticated';
  execute 'create index if not exists inventory_user_id_idx on public.inventory(user_id)';

  execute 'drop policy if exists "Users can read own rows" on public.inventory';
  execute 'drop policy if exists "Users can insert own rows" on public.inventory';
  execute 'drop policy if exists "Users can update own rows" on public.inventory';
  execute 'drop policy if exists "Users can delete own rows" on public.inventory';

  execute 'create policy "Users can read own rows"
    on public.inventory
    for select
    to authenticated
    using ((select auth.uid()) = user_id)';

  execute 'create policy "Users can insert own rows"
    on public.inventory
    for insert
    to authenticated
    with check ((select auth.uid()) = user_id)';

  execute 'create policy "Users can update own rows"
    on public.inventory
    for update
    to authenticated
    using ((select auth.uid()) = user_id)
    with check ((select auth.uid()) = user_id)';

  execute 'create policy "Users can delete own rows"
    on public.inventory
    for delete
    to authenticated
    using ((select auth.uid()) = user_id)';
end;
$$;
