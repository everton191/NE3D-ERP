const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { ROOT, assertControlledProductionConfirm, assertLinkedToMain, run, supabaseArgs } = require("./storefront-production-utils");

const MIGRATIONS = [
  ["20260630143000", "supabase/migrations/20260630143000_account_security_email_2fa_and_deletion.sql"],
  ["20260630150000", "supabase/migrations/20260630150000_sensitive_feature_and_mfa_rls.sql"],
];
const TABLES = ["user_2fa_challenges", "user_2fa_sessions", "security_events"];

async function query(sql, name) {
  const file = path.join(os.tmpdir(), `${name}-${Date.now()}.sql`);
  fs.writeFileSync(file, sql, "utf8");
  try { await run("npx.cmd", supabaseArgs(["db", "query", "--linked", "-f", file])); }
  finally { fs.rmSync(file, { force: true }); }
}

function validationSql() {
  return `
do $$
declare v_missing text[]; v_bad integer;
begin
  select array_agg(t) into v_missing from unnest(array[${TABLES.map((t) => `'${t}'`).join(",")}]) t where to_regclass('public.' || t) is null;
  if v_missing is not null then raise exception 'Missing security tables: %', v_missing; end if;
  select count(*) into v_bad from pg_class c join pg_namespace n on n.oid=c.relnamespace where n.nspname='public' and c.relname=any(array[${TABLES.map((t) => `'${t}'`).join(",")}]) and not c.relrowsecurity;
  if v_bad <> 0 then raise exception 'Security tables without RLS: %', v_bad; end if;
  select count(*) into v_bad from information_schema.role_table_grants where table_schema='public' and table_name=any(array['user_2fa_challenges','user_2fa_sessions']) and grantee in ('anon','authenticated') and privilege_type in ('SELECT','INSERT','UPDATE','DELETE');
  if v_bad <> 0 then raise exception '2FA tables exposed to frontend: %', v_bad; end if;
  if to_regprocedure('public.process_due_account_deletions()') is null then raise exception 'Deletion processor missing'; end if;
  if to_regprocedure('public.erp_mfa_session_allowed(uuid)') is null then raise exception 'MFA session guard missing'; end if;
  if to_regprocedure('public.can_access_sensitive_feature(text,uuid,text)') is null then raise exception 'Sensitive feature guard missing'; end if;
  select count(*) into v_bad from pg_policies where schemaname='public' and policyname='mfa verified sensitive access' and permissive='RESTRICTIVE';
  if v_bad < 3 then raise exception 'Restrictive MFA policies missing: %', v_bad; end if;
end $$;
select 'account_security_activation_remote_validation_ok' as status;`;
}

async function main() {
  const command = process.argv[2] || "status";
  assertLinkedToMain();
  if (command === "status") return MIGRATIONS.forEach(([version, migration]) => console.log(`${version} ${migration}`));
  if (command === "dry-run") return query(`begin;\n${MIGRATIONS.map(([, migration]) => fs.readFileSync(path.join(ROOT, migration), "utf8")).join("\n")}\nrollback;\nselect 'account_security_activation_dry_run_ok' as status;`, "account-security-dry-run");
  if (command === "apply") {
    assertControlledProductionConfirm();
    for (const [version, migration] of MIGRATIONS) {
      await run("npx.cmd", supabaseArgs(["db", "query", "--linked", "-f", migration]));
      await run("npx.cmd", supabaseArgs(["migration", "repair", version, "--status", "applied", "--linked", "--yes"]));
    }
    return;
  }
  if (command === "deploy-functions") {
    assertControlledProductionConfirm();
    return run("npx.cmd", supabaseArgs(["functions", "deploy", "account-security", "--project-ref", "qsufnnivlgdidmjuaprb", "--no-verify-jwt"]));
  }
  if (command === "validate") return query(validationSql(), "account-security-validate");
  throw new Error("Use status, dry-run, apply, deploy-functions ou validate.");
}

main().catch((error) => { console.error(error.message || error); process.exit(1); });
