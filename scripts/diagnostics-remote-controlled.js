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

const TARGET_MIGRATIONS = [
  "supabase/migrations/20260529141000_ai_foundation_disabled.sql",
  "supabase/migrations/20260529162000_diagnostics_bugs_feedback_codex.sql",
  "supabase/migrations/20260529173500_diagnostics_validation_hardening.sql",
];

const TARGET_VERSIONS = [
  "20260529141000",
  "20260529162000",
  "20260529173500",
];

function getValidationSql() {
  const aiTables = [
    "app_ai_settings",
    "app_ai_usage_logs",
    "app_ai_context_snapshots",
    "app_ai_feature_flags",
  ];
  const diagnosticsTables = [
    "app_error_logs",
    "app_error_log_users",
    "app_feedback_reports",
    "app_diagnostic_events",
    "app_bug_clusters",
    "app_bug_reports_exports",
    "app_ai_analysis_runs",
    "app_ai_knowledge_base",
  ];
  const allTables = [...aiTables, ...diagnosticsTables];
  const sqlArray = allTables.map((table) => `'${table}'`).join(", ");

  return `
begin;

do $$
declare
  v_missing text[];
  v_without_rls text[];
  v_open_policies text[];
  v_wrong_ai_settings integer;
  v_trigger_count integer;
begin
  select array_agg(table_name)
    into v_missing
  from unnest(array[${sqlArray}]::text[]) as table_name
  where to_regclass('public.' || table_name) is null;

  if v_missing is not null then
    raise exception 'Diagnostics remote validation failed. Missing tables: %', v_missing;
  end if;

  select array_agg(c.relname)
    into v_without_rls
  from pg_class c
  join pg_namespace n on n.oid = c.relnamespace
  where n.nspname = 'public'
    and c.relname = any(array[${sqlArray}]::text[])
    and not c.relrowsecurity;

  if v_without_rls is not null then
    raise exception 'Diagnostics remote validation failed. Tables without RLS: %', v_without_rls;
  end if;

  select array_agg(tablename || ':' || policyname)
    into v_open_policies
  from pg_policies
  where schemaname = 'public'
    and tablename = any(array[${sqlArray}]::text[])
    and (
      coalesce(qual, '') ~* '^\\s*true\\s*$'
      or coalesce(with_check, '') ~* '^\\s*true\\s*$'
    );

  if v_open_policies is not null then
    raise exception 'Diagnostics remote validation failed. Open policies: %', v_open_policies;
  end if;

  select count(*)
    into v_wrong_ai_settings
  from public.app_ai_settings
  where ai_enabled is true
     or ai_provider <> 'disabled'
     or monthly_limit <> 0;

  if v_wrong_ai_settings > 0 then
    raise exception 'Diagnostics remote validation failed. AI settings enabled unexpectedly: %', v_wrong_ai_settings;
  end if;

  select count(*)
    into v_trigger_count
  from pg_trigger
  where tgname = 'refresh_app_bug_cluster_after_error'
    and not tgisinternal;

  if v_trigger_count <> 1 then
    raise exception 'Diagnostics remote validation failed. Cluster trigger not installed.';
  end if;
end $$;

do $$
declare
  v_common uuid := '10000000-0000-0000-0000-000000000601';
  v_super uuid := '10000000-0000-0000-0000-000000000602';
begin
  insert into auth.users (id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
  values
    (v_common, 'authenticated', 'authenticated', 'phase6c-common@example.invalid', 'diagnostics-validation', now(), '{}'::jsonb, '{}'::jsonb, now(), now()),
    (v_super, 'authenticated', 'authenticated', 'phase6c-super@example.invalid', 'diagnostics-validation', now(), '{}'::jsonb, '{}'::jsonb, now(), now())
  on conflict (id) do nothing;

  insert into public.erp_profiles (id, email, display_name, role)
  values
    (v_common, 'phase6c-common@example.invalid', 'Phase 6C Common', 'user'),
    (v_super, 'phase6c-super@example.invalid', 'Phase 6C Superadmin', 'superadmin')
  on conflict (id) do update
  set role = excluded.role,
      email = excluded.email,
      updated_at = now();
end $$;

set local role authenticated;
select set_config('request.jwt.claim.sub', '10000000-0000-0000-0000-000000000601', true);

insert into public.app_feedback_reports (user_id, type, title, message, description, screen, app_version, platform)
values (auth.uid(), 'suggestion', 'Phase 6C common feedback', 'Validacao remota com rollback', 'Validacao remota com rollback', 'diagnostics', 'phase-6c', 'test');

insert into public.app_error_logs (user_id, error_key, error_message, error_type, screen, action, app_version, platform, fingerprint, severity)
values (auth.uid(), 'phase6c-common-error', 'Phase 6C controlled error', 'ValidationError', 'diagnostics', 'remote-rls', 'phase-6c', 'test', 'phase6c-common-error', 'medium');

insert into public.app_diagnostic_events (user_id, event_type, screen, action, app_version, platform, severity, fingerprint)
values (auth.uid(), 'sync_failed', 'diagnostics', 'remote-rls', 'phase-6c', 'test', 'low', 'phase6c-event');

insert into public.app_ai_usage_logs (owner_id, user_id, context_type, action_type, status, blocked_reason)
values (auth.uid(), auth.uid(), 'orders_summary', 'ask', 'blocked', 'AI_DISABLED');

do $$
declare
  v_count integer;
  v_rows integer;
begin
  select count(*) into v_count from public.app_feedback_reports where title = 'Phase 6C common feedback';
  if v_count <> 1 then
    raise exception 'Common user cannot read own feedback. Count: %', v_count;
  end if;

  select count(*) into v_count from public.app_bug_clusters where fingerprint = 'phase6c-common-error';
  if v_count <> 0 then
    raise exception 'Common user can read global bug clusters unexpectedly. Count: %', v_count;
  end if;

  update public.app_error_logs set severity = 'critical' where fingerprint = 'phase6c-common-error';
  get diagnostics v_rows = row_count;
  if v_rows <> 0 then
    raise exception 'Common user updated diagnostic severity unexpectedly. Rows: %', v_rows;
  end if;
end $$;

reset role;
set local role authenticated;
select set_config('request.jwt.claim.sub', '10000000-0000-0000-0000-000000000602', true);

do $$
declare
  v_count integer;
  v_rows integer;
begin
  if not public.erp_is_superadmin() then
    raise exception 'Superadmin test user was not recognized by erp_is_superadmin().';
  end if;

  select count(*) into v_count from public.app_bug_clusters where fingerprint = 'phase6c-common-error';
  if v_count <> 1 then
    raise exception 'Superadmin cannot read generated bug cluster. Count: %', v_count;
  end if;

  update public.app_error_logs
  set severity = 'critical',
      admin_notes = 'phase-6c remote validation'
  where fingerprint = 'phase6c-common-error';
  get diagnostics v_rows = row_count;
  if v_rows <> 1 then
    raise exception 'Superadmin could not update diagnostic bug. Rows: %', v_rows;
  end if;

  update public.app_feedback_reports
  set status = 'planned',
      admin_notes = 'phase-6c remote validation'
  where title = 'Phase 6C common feedback';
  get diagnostics v_rows = row_count;
  if v_rows <> 1 then
    raise exception 'Superadmin could not update feedback. Rows: %', v_rows;
  end if;

  insert into public.app_bug_reports_exports (created_by, report_title, technical_report, status)
  values (auth.uid(), 'Phase 6C Codex report', '# Relatorio tecnico para correcao', 'generated');
end $$;

reset role;
rollback;

select 'diagnostics_remote_validation_ok' as status;
`;
}

async function runSql(sql) {
  const file = path.join(os.tmpdir(), `simplifica-diagnostics-remote-${Date.now()}.sql`);
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
    TARGET_MIGRATIONS.forEach((migration) => {
      const exists = fs.existsSync(path.join(ROOT, migration));
      console.log(`${exists ? "OK" : "MISSING"} ${migration}`);
    });
    return;
  }

  if (command === "dry-run") {
    await run("npx.cmd", supabaseArgs(["db", "push", "--linked", "--dry-run"]));
    return;
  }

  if (command === "apply") {
    assertControlledProductionConfirm();
    for (const migration of TARGET_MIGRATIONS) {
      await run("npx.cmd", supabaseArgs(["db", "query", "--linked", "-f", migration]));
    }
    await run("npx.cmd", supabaseArgs(["migration", "repair", ...TARGET_VERSIONS, "--status", "applied", "--linked", "--yes"]));
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
