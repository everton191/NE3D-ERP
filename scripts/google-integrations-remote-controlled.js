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

const GOOGLE_MIGRATION = "supabase/migrations/20260529193000_google_integrations_foundation_disabled.sql";
const GOOGLE_VERSION = "20260529193000";

function getValidationSql() {
  return `
begin;

do $$
declare
  v_missing text[];
  v_without_rls text[];
  v_open_policies text[];
  v_token_policies integer;
  v_token_auth_grants integer;
  v_enabled_flags integer;
  v_enabled_integrations integer;
begin
  if to_regprocedure('public.erp_is_superadmin()') is null then
    raise exception 'Google validation failed. public.erp_is_superadmin() is missing.';
  end if;

  select array_agg(table_name)
    into v_missing
  from unnest(array[
    'external_integrations',
    'integration_tokens',
    'integration_sync_jobs',
    'integration_logs',
    'app_integration_feature_flags'
  ]::text[]) as table_name
  where to_regclass('public.' || table_name) is null;

  if v_missing is not null then
    raise exception 'Google validation failed. Missing tables: %', v_missing;
  end if;

  select array_agg(c.relname)
    into v_without_rls
  from pg_class c
  join pg_namespace n on n.oid = c.relnamespace
  where n.nspname = 'public'
    and c.relname = any(array[
      'external_integrations',
      'integration_tokens',
      'integration_sync_jobs',
      'integration_logs',
      'app_integration_feature_flags'
    ]::text[])
    and not c.relrowsecurity;

  if v_without_rls is not null then
    raise exception 'Google validation failed. Tables without RLS: %', v_without_rls;
  end if;

  select array_agg(tablename || ':' || policyname)
    into v_open_policies
  from pg_policies
  where schemaname = 'public'
    and tablename = any(array[
      'external_integrations',
      'integration_tokens',
      'integration_sync_jobs',
      'integration_logs',
      'app_integration_feature_flags'
    ]::text[])
    and (
      coalesce(qual, '') ~* '^\\s*true\\s*$'
      or coalesce(with_check, '') ~* '^\\s*true\\s*$'
    );

  if v_open_policies is not null then
    raise exception 'Google validation failed. Open policies: %', v_open_policies;
  end if;

  select count(*)
    into v_token_policies
  from pg_policies
  where schemaname = 'public'
    and tablename = 'integration_tokens';

  if v_token_policies <> 0 then
    raise exception 'Google validation failed. integration_tokens should not expose frontend policies. Count: %', v_token_policies;
  end if;

  select count(*)
    into v_token_auth_grants
  from information_schema.role_table_grants
  where table_schema = 'public'
    and table_name = 'integration_tokens'
    and grantee in ('anon', 'authenticated')
    and privilege_type in ('SELECT', 'INSERT', 'UPDATE', 'DELETE');

  if v_token_auth_grants <> 0 then
    raise exception 'Google validation failed. integration_tokens has frontend grants. Count: %', v_token_auth_grants;
  end if;

  select count(*)
    into v_enabled_flags
  from public.app_integration_feature_flags
  where provider = 'google'
    and enabled is true;

  if v_enabled_flags <> 0 then
    raise exception 'Google validation failed. Enabled Google flags found: %', v_enabled_flags;
  end if;

  select count(*)
    into v_enabled_integrations
  from public.external_integrations
  where provider = 'google'
    and (enabled is true or status <> 'disabled');

  if v_enabled_integrations <> 0 then
    raise exception 'Google validation failed. Enabled Google integrations found: %', v_enabled_integrations;
  end if;
end $$;

do $$
declare
  v_common uuid := '10000000-0000-0000-0000-000000000611';
  v_other uuid := '10000000-0000-0000-0000-000000000612';
  v_super uuid := '10000000-0000-0000-0000-000000000613';
begin
  insert into auth.users (id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
  values
    (v_common, 'authenticated', 'authenticated', 'phase6c1-common@example.invalid', 'google-validation', now(), '{}'::jsonb, '{}'::jsonb, now(), now()),
    (v_other, 'authenticated', 'authenticated', 'phase6c1-other@example.invalid', 'google-validation', now(), '{}'::jsonb, '{}'::jsonb, now(), now()),
    (v_super, 'authenticated', 'authenticated', 'phase6c1-super@example.invalid', 'google-validation', now(), '{}'::jsonb, '{}'::jsonb, now(), now())
  on conflict (id) do nothing;

  insert into public.erp_profiles (id, email, display_name, role)
  values
    (v_common, 'phase6c1-common@example.invalid', 'Phase 6C1 Common', 'user'),
    (v_other, 'phase6c1-other@example.invalid', 'Phase 6C1 Other', 'user'),
    (v_super, 'phase6c1-super@example.invalid', 'Phase 6C1 Superadmin', 'superadmin')
  on conflict (id) do update
  set role = excluded.role,
      email = excluded.email,
      updated_at = now();
end $$;

set local role authenticated;
select set_config('request.jwt.claim.sub', '10000000-0000-0000-0000-000000000611', true);

insert into public.external_integrations (owner_id, provider, integration_key, status, enabled, metadata)
values (auth.uid(), 'google', 'google_calendar', 'disabled', false, '{"phase":"6c1"}'::jsonb);

insert into public.integration_logs (owner_id, provider, action, status, message)
values (auth.uid(), 'google', 'validation', 'blocked', 'Google disabled validation');

do $$
declare
  v_count integer;
  v_rows integer;
begin
  select count(*) into v_count from public.external_integrations where owner_id = auth.uid();
  if v_count <> 1 then
    raise exception 'Common user cannot read own disabled integration. Count: %', v_count;
  end if;

  select count(*) into v_count from public.external_integrations where owner_id = '10000000-0000-0000-0000-000000000612';
  if v_count <> 0 then
    raise exception 'Common user can read another owner integration. Count: %', v_count;
  end if;

  begin
    select count(*) into v_count from public.integration_tokens;
    raise exception 'Common user read integration tokens unexpectedly. Count: %', v_count;
  exception
    when insufficient_privilege then
      null;
  end;

  begin
    insert into public.integration_tokens (owner_id, provider, token_type, encrypted_token_placeholder)
    values (auth.uid(), 'google', 'placeholder', 'not_configured');
    raise exception 'Common user inserted integration token unexpectedly.';
  exception
    when insufficient_privilege or check_violation or with_check_option_violation then
      null;
  end;

  update public.app_integration_feature_flags
  set enabled = true
  where owner_id = auth.uid();
  get diagnostics v_rows = row_count;
  if v_rows <> 0 then
    raise exception 'Common user updated feature flags unexpectedly. Rows: %', v_rows;
  end if;
end $$;

reset role;
set local role authenticated;
select set_config('request.jwt.claim.sub', '10000000-0000-0000-0000-000000000613', true);

do $$
declare
  v_count integer;
begin
  if not public.erp_is_superadmin() then
    raise exception 'Superadmin test user was not recognized by erp_is_superadmin().';
  end if;

  select count(*) into v_count from public.external_integrations where integration_key = 'google_calendar';
  if v_count <> 1 then
    raise exception 'Superadmin cannot read disabled Google integration. Count: %', v_count;
  end if;

  begin
    select count(*) into v_count from public.integration_tokens;
    raise exception 'Superadmin frontend read integration tokens unexpectedly. Count: %', v_count;
  exception
    when insufficient_privilege then
      null;
  end;

  insert into public.app_integration_feature_flags (owner_id, provider, feature_key, enabled)
  values (auth.uid(), 'google', 'google_integrations_enabled', false)
  on conflict (owner_id, provider, feature_key) do update
  set enabled = false,
      updated_at = now();
end $$;

reset role;
rollback;

select 'google_integrations_remote_validation_ok' as status;
`;
}

async function runSql(sql) {
  const file = path.join(os.tmpdir(), `simplifica-google-remote-${Date.now()}.sql`);
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
    console.log(`${fs.existsSync(path.join(ROOT, GOOGLE_MIGRATION)) ? "OK" : "MISSING"} ${GOOGLE_MIGRATION}`);
    return;
  }

  if (command === "dry-run") {
    await run("npx.cmd", supabaseArgs(["db", "push", "--linked", "--dry-run"]));
    return;
  }

  if (command === "apply") {
    assertControlledProductionConfirm();
    await run("npx.cmd", supabaseArgs(["db", "query", "--linked", "-f", GOOGLE_MIGRATION]));
    await run("npx.cmd", supabaseArgs(["migration", "repair", GOOGLE_VERSION, "--status", "applied", "--linked", "--yes"]));
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
