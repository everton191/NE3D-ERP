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

const PLAN_PERSISTENCE_MIGRATION = "supabase/migrations/20260628110000_plan_catalog_persistence_foundation.sql";
const PLAN_PERSISTENCE_VERSION = "20260628110000";
const PLAN_CATALOG_RPC_MIGRATION = "supabase/migrations/20260628113000_superadmin_plan_catalog_rpc.sql";
const PLAN_CATALOG_RPC_VERSION = "20260628113000";
const PLAN_PERSISTENCE_TABLES = [
  "plan_card_stats",
  "plan_features",
  "plan_prices",
  "checkout_sessions",
  "payment_transactions",
  "webhook_events",
  "company_plan_overrides",
  "plan_change_schedules",
  "company_plan_usage",
];

function readMigration() {
  return fs.readFileSync(path.join(ROOT, PLAN_PERSISTENCE_MIGRATION), "utf8");
}

function readCatalogRpcMigration() {
  return fs.readFileSync(path.join(ROOT, PLAN_CATALOG_RPC_MIGRATION), "utf8");
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
  v_frontend_grants integer;
  v_open_policies text[];
  v_price_count integer;
  v_feature_count integer;
  v_stat_count integer;
begin
  select array_agg(table_name)
    into v_missing
  from unnest(array[${sqlArray(PLAN_PERSISTENCE_TABLES)}]::text[]) as table_name
  where to_regclass('public.' || table_name) is null;

  if v_missing is not null then
    raise exception 'Plan persistence validation failed. Missing tables: %', v_missing;
  end if;

  if not exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'plans'
      and column_name in ('display_headline', 'capabilities', 'storefront_product_limit')
  ) then
    raise exception 'Plan persistence validation failed. Plans display/capability columns missing.';
  end if;

  select array_agg(c.relname)
    into v_without_rls
  from pg_class c
  join pg_namespace n on n.oid = c.relnamespace
  where n.nspname = 'public'
    and c.relname = any(array[${sqlArray(PLAN_PERSISTENCE_TABLES)}]::text[])
    and not c.relrowsecurity;

  if v_without_rls is not null then
    raise exception 'Plan persistence validation failed. Tables without RLS: %', v_without_rls;
  end if;

  select count(*)
    into v_frontend_grants
  from information_schema.role_table_grants
  where table_schema = 'public'
    and table_name = any(array[${sqlArray(PLAN_PERSISTENCE_TABLES)}]::text[])
    and grantee in ('anon', 'authenticated')
    and privilege_type in ('SELECT', 'INSERT', 'UPDATE', 'DELETE');

  if v_frontend_grants <> 0 then
    raise exception 'Plan persistence validation failed. Frontend grants found: %', v_frontend_grants;
  end if;

  select array_agg(tablename || ':' || policyname)
    into v_open_policies
  from pg_policies
  where schemaname = 'public'
    and tablename = any(array[${sqlArray(PLAN_PERSISTENCE_TABLES)}]::text[])
    and (
      coalesce(qual, '') ~* '^\\s*true\\s*$'
      or coalesce(with_check, '') ~* '^\\s*true\\s*$'
    );

  if v_open_policies is not null then
    raise exception 'Plan persistence validation failed. Open policies: %', v_open_policies;
  end if;

  select count(*)
    into v_price_count
  from public.plan_prices pp
  join public.plans p on p.id = pp.plan_id
  where p.slug in ('free', 'start', 'pro')
    and pp.metadata->>'checkout_connected' = 'false';

  if v_price_count < 3 then
    raise exception 'Plan persistence validation failed. Safe price seeds missing: %', v_price_count;
  end if;

  select count(*)
    into v_feature_count
  from public.plan_features pf
  join public.plans p on p.id = pf.plan_id
  where p.slug in ('free', 'start', 'pro');

  if v_feature_count < 9 then
    raise exception 'Plan persistence validation failed. Feature seeds missing: %', v_feature_count;
  end if;

  select count(*)
    into v_stat_count
  from public.plan_card_stats ps
  join public.plans p on p.id = ps.plan_id
  where p.slug in ('free', 'start', 'pro');

  if v_stat_count < 9 then
    raise exception 'Plan persistence validation failed. Card stat seeds missing: %', v_stat_count;
  end if;
end $$;

rollback;

select 'plan_persistence_remote_validation_ok' as status;
`;
}

function getCatalogRpcValidationSql() {
  return `
begin;

do $$
declare
  v_function_exists boolean;
  v_anon_grants integer;
  v_authenticated_grants integer;
  v_result jsonb;
  v_plan_count integer;
begin
  select to_regprocedure('public.get_superadmin_plan_catalog()') is not null
    into v_function_exists;

  if coalesce(v_function_exists, false) is not true then
    raise exception 'Plan catalog RPC validation failed. Function is missing.';
  end if;

  select count(*)
    into v_anon_grants
  from information_schema.routine_privileges
  where routine_schema = 'public'
    and routine_name = 'get_superadmin_plan_catalog'
    and grantee in ('public', 'anon');

  if v_anon_grants <> 0 then
    raise exception 'Plan catalog RPC validation failed. Public/anon grants found: %', v_anon_grants;
  end if;

  select count(*)
    into v_authenticated_grants
  from information_schema.routine_privileges
  where routine_schema = 'public'
    and routine_name = 'get_superadmin_plan_catalog'
    and grantee = 'authenticated';

  if v_authenticated_grants < 1 then
    raise exception 'Plan catalog RPC validation failed. Authenticated grant missing.';
  end if;

  insert into auth.users (id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
  values ('10000000-0000-0000-0000-000000000702', 'authenticated', 'authenticated', 'plan-catalog-super@example.invalid', 'validation', now(), '{}'::jsonb, '{}'::jsonb, now(), now())
  on conflict (id) do nothing;

  insert into public.erp_profiles (id, email, display_name, role)
  values ('10000000-0000-0000-0000-000000000702', 'plan-catalog-super@example.invalid', 'Plan Catalog Super', 'superadmin')
  on conflict (id) do update
  set role = excluded.role,
      email = excluded.email,
      updated_at = now();

  set local role authenticated;
  perform set_config('request.jwt.claim.sub', '10000000-0000-0000-0000-000000000702', true);

  select public.get_superadmin_plan_catalog()
    into v_result;

  select jsonb_array_length(coalesce(v_result->'plans', '[]'::jsonb))
    into v_plan_count;

  if v_plan_count < 3 then
    raise exception 'Plan catalog RPC validation failed. Plan count=%', v_plan_count;
  end if;

  if coalesce(v_result->>'checkout_connected', '') <> 'false' then
    raise exception 'Plan catalog RPC validation failed. checkout_connected must be false.';
  end if;
end $$;

rollback;

select 'plan_catalog_rpc_remote_validation_ok' as status;
`;
}

async function runSql(sql, prefix = "simplifica-plan-persistence") {
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
    console.log(`${fs.existsSync(path.join(ROOT, PLAN_PERSISTENCE_MIGRATION)) ? "OK" : "MISSING"} ${PLAN_PERSISTENCE_MIGRATION}`);
    console.log(`${fs.existsSync(path.join(ROOT, PLAN_CATALOG_RPC_MIGRATION)) ? "OK" : "MISSING"} ${PLAN_CATALOG_RPC_MIGRATION}`);
    console.log(`Migration version: ${PLAN_PERSISTENCE_VERSION}`);
    console.log(`Catalog RPC version: ${PLAN_CATALOG_RPC_VERSION}`);
    PLAN_PERSISTENCE_TABLES.forEach((table) => console.log(`TABLE ${table}`));
    return;
  }

  if (command === "dry-run") {
    await runSql(`begin;\n${readMigration()}\nrollback;\nselect 'plan_persistence_dry_run_ok' as status;`, "simplifica-plan-persistence-dry-run");
    return;
  }

  if (command === "apply") {
    assertControlledProductionConfirm();
    await run("npx.cmd", supabaseArgs(["db", "query", "--linked", "-f", PLAN_PERSISTENCE_MIGRATION]));
    await run("npx.cmd", supabaseArgs(["migration", "repair", PLAN_PERSISTENCE_VERSION, "--status", "applied", "--linked", "--yes"]));
    return;
  }

  if (command === "validate") {
    await runSql(getValidationSql());
    return;
  }

  if (command === "rpc-dry-run") {
    await runSql(`begin;\n${readCatalogRpcMigration()}\nrollback;\nselect 'plan_catalog_rpc_dry_run_ok' as status;`, "simplifica-plan-catalog-rpc-dry-run");
    return;
  }

  if (command === "rpc-apply") {
    assertControlledProductionConfirm();
    await run("npx.cmd", supabaseArgs(["db", "query", "--linked", "-f", PLAN_CATALOG_RPC_MIGRATION]));
    await run("npx.cmd", supabaseArgs(["migration", "repair", PLAN_CATALOG_RPC_VERSION, "--status", "applied", "--linked", "--yes"]));
    return;
  }

  if (command === "rpc-validate") {
    await runSql(getCatalogRpcValidationSql(), "simplifica-plan-catalog-rpc");
    return;
  }

  throw new Error(`Comando invalido: ${command}. Use status, dry-run, apply, validate, rpc-dry-run, rpc-apply ou rpc-validate.`);
}

main().catch((error) => {
  console.error(error.message || error);
  process.exit(1);
});
