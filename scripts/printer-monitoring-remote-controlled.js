const crypto = require("node:crypto");
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

const MIGRATION = "supabase/migrations/20260630130000_printer_monitoring_read_only.sql";
const VERSION = "20260630130000";
const TABLES = [
  "printer_brands",
  "printer_models",
  "printer_connector_types",
  "printer_brand_connector_suggestions",
  "printers",
  "printer_status_snapshots",
  "printer_order_links",
  "printer_events",
  "local_agents",
  "local_agent_printers",
];

function readMigration() {
  return fs.readFileSync(path.join(ROOT, MIGRATION), "utf8");
}

function sqlList(values) {
  return values.map((value) => `'${value}'`).join(", ");
}

async function runSql(sql, prefix = "simplifica-printer-monitor") {
  const file = path.join(os.tmpdir(), `${prefix}-${Date.now()}.sql`);
  fs.writeFileSync(file, sql, "utf8");
  try {
    await run("npx.cmd", supabaseArgs(["db", "query", "--linked", "-f", file]));
  } finally {
    fs.rmSync(file, { force: true });
  }
}

function validationSql() {
  return `
begin;
do $$
declare
  v_missing text[];
  v_without_rls text[];
  v_open_policies text[];
  v_write_grants integer;
  v_remote_control integer;
  v_connectors integer;
begin
  select array_agg(table_name) into v_missing
  from unnest(array[${sqlList(TABLES)}]::text[]) as table_name
  where to_regclass('public.' || table_name) is null;
  if v_missing is not null then
    raise exception 'Printer monitoring validation failed. Missing tables: %', v_missing;
  end if;

  select array_agg(c.relname) into v_without_rls
  from pg_class c
  join pg_namespace n on n.oid = c.relnamespace
  where n.nspname = 'public'
    and c.relname = any(array[${sqlList(TABLES)}]::text[])
    and not c.relrowsecurity;
  if v_without_rls is not null then
    raise exception 'Printer monitoring validation failed. Tables without RLS: %', v_without_rls;
  end if;

  select array_agg(tablename || ':' || policyname) into v_open_policies
  from pg_policies
  where schemaname = 'public'
    and tablename = any(array[${sqlList(TABLES)}]::text[])
    and (coalesce(qual, '') ~* '^\\s*true\\s*$' or coalesce(with_check, '') ~* '^\\s*true\\s*$');
  if v_open_policies is not null then
    raise exception 'Printer monitoring validation failed. Open policies: %', v_open_policies;
  end if;

  select count(*) into v_write_grants
  from information_schema.role_table_grants
  where table_schema = 'public'
    and table_name = any(array[${sqlList(TABLES)}]::text[])
    and grantee in ('anon', 'authenticated')
    and privilege_type in ('INSERT', 'UPDATE', 'DELETE');
  if v_write_grants <> 0 then
    raise exception 'Printer monitoring validation failed. Frontend write grants: %', v_write_grants;
  end if;

  select count(*) into v_remote_control
  from public.printer_connector_types
  where supports_remote_control is true;
  if v_remote_control <> 0 then
    raise exception 'Printer monitoring validation failed. Remote control connector enabled.';
  end if;

  select count(*) into v_connectors
  from public.printer_connector_types
  where key in ('manual', 'octoprint', 'moonraker', 'prusalink', 'bambu');
  if v_connectors <> 5 then
    raise exception 'Printer monitoring validation failed. Expected 5 connectors, found %.', v_connectors;
  end if;

  if not exists (
    select 1 from public.app_feature_access_rules
    where feature_key = 'printer_remote_control' and future_only is true
  ) then
    raise exception 'Printer remote control must remain future-only.';
  end if;
end $$;
rollback;
select 'printer_monitoring_remote_validation_ok' as status;
`;
}

async function main() {
  const command = process.argv[2] || "status";
  assertLinkedToMain();

  if (command === "status") {
    console.log(`Projeto Supabase linkado: ${getCurrentLinkedProjectRef()}`);
    console.log(`${fs.existsSync(path.join(ROOT, MIGRATION)) ? "OK" : "MISSING"} ${MIGRATION}`);
    console.log(`Migration version: ${VERSION}`);
    return;
  }
  if (command === "dry-run") {
    await runSql(`begin;\n${readMigration()}\nrollback;\nselect 'printer_monitoring_dry_run_ok' as status;`, "simplifica-printer-dry-run");
    return;
  }
  if (command === "apply") {
    assertControlledProductionConfirm();
    await run("npx.cmd", supabaseArgs(["db", "query", "--linked", "-f", MIGRATION]));
    await run("npx.cmd", supabaseArgs(["migration", "repair", VERSION, "--status", "applied", "--linked", "--yes"]));
    return;
  }
  if (command === "configure-secret") {
    assertControlledProductionConfirm();
    const secret = crypto.randomBytes(48).toString("base64url");
    await run("npx.cmd", supabaseArgs(["secrets", "set", `PRINTER_CREDENTIALS_SECRET=${secret}`, "--project-ref", getCurrentLinkedProjectRef()]));
    console.log("PRINTER_CREDENTIALS_SECRET configurado sem exibir o valor.");
    return;
  }
  if (command === "deploy-functions") {
    assertControlledProductionConfirm();
    await run("npx.cmd", supabaseArgs(["functions", "deploy", "printer-monitor", "--no-verify-jwt", "--project-ref", getCurrentLinkedProjectRef()]));
    return;
  }
  if (command === "validate") {
    await runSql(validationSql(), "simplifica-printer-validation");
    return;
  }
  throw new Error("Comando invalido. Use status, dry-run, apply, configure-secret, deploy-functions ou validate.");
}

main().catch((error) => {
  console.error(error.message || error);
  process.exit(1);
});
