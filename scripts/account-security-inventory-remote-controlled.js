const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");

const {
  ROOT,
  assertControlledProductionConfirm,
  assertLinkedToMain,
  getCurrentLinkedProjectRef,
  run,
  supabaseArgs,
} = require("./storefront-production-utils");

const FOUNDATION_MIGRATION = "supabase/migrations/20260630103000_account_security_inventory_foundation_disabled.sql";
const FOUNDATION_VERSION = "20260630103000";
const FOUNDATION_TABLES = [
  "app_account_feature_flags",
  "inventory_rolls",
  "inventory_roll_events",
  "account_security_settings",
  "account_devices",
  "account_login_events",
  "account_deletion_requests",
];

function readMigration() {
  return fs.readFileSync(path.join(ROOT, FOUNDATION_MIGRATION), "utf8");
}

function sqlArray(items) {
  return items.map((item) => `'${item}'`).join(", ");
}

function getValidationSql() {
  return `
begin;

do $$
declare
  v_missing text[];
  v_without_rls text[];
  v_open_policies text[];
  v_write_grants integer;
  v_enabled_flags integer;
  v_bad_security_settings integer;
begin
  select array_agg(table_name)
    into v_missing
  from unnest(array[${sqlArray(FOUNDATION_TABLES)}]::text[]) as table_name
  where to_regclass('public.' || table_name) is null;

  if v_missing is not null then
    raise exception 'Account/inventory foundation validation failed. Missing tables: %', v_missing;
  end if;

  select array_agg(c.relname)
    into v_without_rls
  from pg_class c
  join pg_namespace n on n.oid = c.relnamespace
  where n.nspname = 'public'
    and c.relname = any(array[${sqlArray(FOUNDATION_TABLES)}]::text[])
    and not c.relrowsecurity;

  if v_without_rls is not null then
    raise exception 'Account/inventory foundation validation failed. Tables without RLS: %', v_without_rls;
  end if;

  select array_agg(tablename || ':' || policyname)
    into v_open_policies
  from pg_policies
  where schemaname = 'public'
    and tablename = any(array[${sqlArray(FOUNDATION_TABLES)}]::text[])
    and (
      coalesce(qual, '') ~* '^\\s*true\\s*$'
      or coalesce(with_check, '') ~* '^\\s*true\\s*$'
    );

  if v_open_policies is not null then
    raise exception 'Account/inventory foundation validation failed. Open policies: %', v_open_policies;
  end if;

  select count(*)
    into v_write_grants
  from information_schema.role_table_grants
  where table_schema = 'public'
    and table_name = any(array[${sqlArray(FOUNDATION_TABLES)}]::text[])
    and grantee in ('anon', 'authenticated')
    and privilege_type in ('INSERT', 'UPDATE', 'DELETE');

  if v_write_grants <> 0 then
    raise exception 'Account/inventory foundation validation failed. Frontend write grants found: %', v_write_grants;
  end if;

  select count(*)
    into v_enabled_flags
  from public.app_account_feature_flags
  where feature_key in (
    'automatic_roll_consumption_enabled',
    'account_2fa_enabled',
    'google_login_enabled',
    'account_devices_enabled',
    'account_deletion_enabled'
  )
    and enabled is true;

  if v_enabled_flags <> 0 then
    raise exception 'Account/inventory foundation validation failed. Enabled guarded flags found: %', v_enabled_flags;
  end if;

  select count(*)
    into v_bad_security_settings
  from public.account_security_settings
  where status = 'disabled'
    and (
      two_factor_enabled is true
      or google_login_enabled is true
      or web_pin_enabled is true
      or two_factor_channel <> 'disabled'
      or deletion_grace_days <> 15
    );

  if v_bad_security_settings <> 0 then
    raise exception 'Account/inventory foundation validation failed. Disabled security settings are not guarded: %', v_bad_security_settings;
  end if;
end $$;

do $$
declare
  v_common uuid := '10000000-0000-0000-0000-000000000811';
  v_other uuid := '10000000-0000-0000-0000-000000000812';
  v_super uuid := '10000000-0000-0000-0000-000000000813';
begin
  insert into auth.users (id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
  values
    (v_common, 'authenticated', 'authenticated', 'account-inventory-common@example.invalid', 'validation', now(), '{}'::jsonb, '{}'::jsonb, now(), now()),
    (v_other, 'authenticated', 'authenticated', 'account-inventory-other@example.invalid', 'validation', now(), '{}'::jsonb, '{}'::jsonb, now(), now()),
    (v_super, 'authenticated', 'authenticated', 'account-inventory-super@example.invalid', 'validation', now(), '{}'::jsonb, '{}'::jsonb, now(), now())
  on conflict (id) do nothing;

  insert into public.erp_profiles (id, email, display_name, role)
  values
    (v_common, 'account-inventory-common@example.invalid', 'Account Inventory Common', 'user'),
    (v_other, 'account-inventory-other@example.invalid', 'Account Inventory Other', 'user'),
    (v_super, 'account-inventory-super@example.invalid', 'Account Inventory Super', 'superadmin')
  on conflict (id) do update
  set role = excluded.role,
      email = excluded.email,
      updated_at = now();

  insert into public.inventory_rolls (owner_id, material_id, material_name, color, capacity_grams, remaining_grams, status)
  values
    (v_common, 'mat-common', 'PLA Preto', 'Preto', 1000, 500, 'prepared'),
    (v_other, 'mat-other', 'PLA Branco', 'Branco', 1000, 1000, 'prepared');

  insert into public.account_security_settings (owner_id)
  values (v_common)
  on conflict (owner_id) do nothing;
end $$;

set local role authenticated;
select set_config('request.jwt.claim.sub', '10000000-0000-0000-0000-000000000811', true);

do $$
declare
  v_count integer;
begin
  select count(*) into v_count from public.inventory_rolls where owner_id = auth.uid();
  if v_count <> 1 then
    raise exception 'Common user cannot read own inventory roll. Count: %', v_count;
  end if;

  select count(*) into v_count from public.inventory_rolls where owner_id = '10000000-0000-0000-0000-000000000812';
  if v_count <> 0 then
    raise exception 'Common user can read another owner inventory roll. Count: %', v_count;
  end if;

  begin
    insert into public.inventory_rolls (owner_id, material_name, remaining_grams)
    values (auth.uid(), 'PLA Teste', 100);
    raise exception 'Common user inserted inventory roll unexpectedly.';
  exception
    when insufficient_privilege or check_violation or with_check_option_violation then
      null;
  end;

  begin
    update public.account_security_settings
    set two_factor_enabled = true
    where owner_id = auth.uid();
    raise exception 'Common user updated account security settings unexpectedly.';
  exception
    when insufficient_privilege or check_violation or with_check_option_violation then
      null;
  end;
end $$;

reset role;
set local role authenticated;
select set_config('request.jwt.claim.sub', '10000000-0000-0000-0000-000000000813', true);

do $$
declare
  v_count integer;
begin
  if not public.erp_is_superadmin() then
    raise exception 'Superadmin test user was not recognized by erp_is_superadmin().';
  end if;

  select count(*) into v_count from public.inventory_rolls where material_id in ('mat-common', 'mat-other');
  if v_count <> 2 then
    raise exception 'Superadmin cannot read prepared inventory rolls. Count: %', v_count;
  end if;
end $$;

reset role;
rollback;

select 'account_security_inventory_remote_validation_ok' as status;
`;
}

async function runSql(sql, prefix = "simplifica-account-inventory") {
  const file = path.join(os.tmpdir(), `${prefix}-${Date.now()}.sql`);
  fs.writeFileSync(file, sql, "utf8");
  try {
    await run("npx.cmd", supabaseArgs(["db", "query", "--linked", "-f", file]));
  } finally {
    fs.rmSync(file, { force: true });
  }
}

async function main() {
  const command = process.argv[2] || "status";
  assertLinkedToMain();

  if (command === "status") {
    console.log(`Projeto Supabase linkado: ${getCurrentLinkedProjectRef()}`);
    console.log(`${fs.existsSync(path.join(ROOT, FOUNDATION_MIGRATION)) ? "OK" : "MISSING"} ${FOUNDATION_MIGRATION}`);
    console.log(`Migration version: ${FOUNDATION_VERSION}`);
    FOUNDATION_TABLES.forEach((table) => console.log(`TABLE ${table}`));
    return;
  }

  if (command === "dry-run") {
    await runSql(`begin;\n${readMigration()}\nrollback;\nselect 'account_security_inventory_dry_run_ok' as status;`, "simplifica-account-inventory-dry-run");
    return;
  }

  if (command === "apply") {
    assertControlledProductionConfirm();
    await run("npx.cmd", supabaseArgs(["db", "query", "--linked", "-f", FOUNDATION_MIGRATION]));
    await run("npx.cmd", supabaseArgs(["migration", "repair", FOUNDATION_VERSION, "--status", "applied", "--linked", "--yes"]));
    return;
  }

  if (command === "validate") {
    await runSql(getValidationSql());
    return;
  }

  throw new Error(`Comando invalido: ${command}. Use status, dry-run, apply ou validate.`);
}

main().catch((error) => {
  console.error(error.message || error);
  process.exit(1);
});
