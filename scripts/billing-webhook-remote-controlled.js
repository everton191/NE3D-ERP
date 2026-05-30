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

const BILLING_MIGRATION = "supabase/migrations/20260529213000_billing_webhook_hardening.sql";
const BILLING_VERSION = "20260529213000";
const BILLING_FUNCTIONS = [
  "mercadopago-webhook",
  "mercadopago-create-payment",
  "mercadopago-create-subscription",
  "mercadopago-cancel-subscription",
];

function getValidationSql() {
  return `
begin;

do $$
declare
  v_without_rls boolean;
  v_frontend_grants integer;
  v_open_policies integer;
  v_trigger_count integer;
begin
  if to_regclass('public.billing_webhook_events') is null then
    raise exception 'Billing webhook validation failed. billing_webhook_events is missing.';
  end if;

  select not c.relrowsecurity
    into v_without_rls
  from pg_class c
  join pg_namespace n on n.oid = c.relnamespace
  where n.nspname = 'public'
    and c.relname = 'billing_webhook_events';

  if coalesce(v_without_rls, true) then
    raise exception 'Billing webhook validation failed. RLS is disabled.';
  end if;

  select count(*)
    into v_frontend_grants
  from information_schema.role_table_grants
  where table_schema = 'public'
    and table_name = 'billing_webhook_events'
    and grantee in ('anon', 'authenticated')
    and privilege_type in ('SELECT', 'INSERT', 'UPDATE', 'DELETE');

  if v_frontend_grants <> 0 then
    raise exception 'Billing webhook validation failed. Frontend grants found: %', v_frontend_grants;
  end if;

  select count(*)
    into v_open_policies
  from pg_policies
  where schemaname = 'public'
    and tablename = 'billing_webhook_events'
    and (
      coalesce(qual, '') ~* '^\\s*true\\s*$'
      or coalesce(with_check, '') ~* '^\\s*true\\s*$'
    );

  if v_open_policies <> 0 then
    raise exception 'Billing webhook validation failed. Open policies found: %', v_open_policies;
  end if;

  select count(*)
    into v_trigger_count
  from pg_trigger
  where tgname = 's3d_clear_cancel_at_period_end_on_free'
    and not tgisinternal;

  if v_trigger_count <> 1 then
    raise exception 'Billing webhook validation failed. Cancel-at-period-end cleanup trigger missing.';
  end if;
end $$;

insert into public.billing_webhook_events (provider, event_key, event_type, external_id, request_id, signature_ts, status)
values ('mercado_pago', 'phase-5a1-validation', 'payment', 'fixture-payment', 'fixture-request', '0', 'received');

do $$
begin
  begin
    insert into public.billing_webhook_events (provider, event_key, event_type, external_id, request_id, signature_ts, status)
    values ('mercado_pago', 'phase-5a1-validation', 'payment', 'fixture-payment', 'fixture-request', '0', 'received');
    raise exception 'Billing webhook validation failed. Duplicate event was accepted.';
  exception
    when unique_violation then
      null;
  end;
end $$;

rollback;

select 'billing_webhook_remote_validation_ok' as status;
`;
}

async function runSql(sql) {
  const file = path.join(os.tmpdir(), `simplifica-billing-webhook-${Date.now()}.sql`);
  fs.writeFileSync(file, sql, "utf8");
  try {
    await run("npx.cmd", supabaseArgs(["db", "query", "--linked", "-f", file]));
  } finally {
    fs.rmSync(file, { force: true });
  }
}

async function smokeUnsignedWebhook() {
  const projectRef = getCurrentLinkedProjectRef();
  const url = `https://${projectRef}.supabase.co/functions/v1/mercadopago-webhook?type=payment&data.id=phase-5a1-unsigned`;
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ id: "phase-5a1-unsigned", type: "payment", action: "payment.updated" }),
  });
  if (response.status !== 401) {
    throw new Error(`Webhook unsigned smoke failed. Expected HTTP 401, received ${response.status}.`);
  }
  console.log("billing_webhook_unsigned_smoke_ok");
}

async function main() {
  const command = process.argv[2] || "status";
  assertLinkedToMain();

  if (command === "status") {
    console.log(`Projeto Supabase linkado: ${getCurrentLinkedProjectRef()}`);
    console.log(`${fs.existsSync(path.join(ROOT, BILLING_MIGRATION)) ? "OK" : "MISSING"} ${BILLING_MIGRATION}`);
    BILLING_FUNCTIONS.forEach((name) => console.log(`${fs.existsSync(path.join(ROOT, "supabase", "functions", name, "index.ts")) ? "OK" : "MISSING"} supabase/functions/${name}/index.ts`));
    return;
  }

  if (command === "dry-run") {
    await run("npx.cmd", supabaseArgs(["db", "push", "--linked", "--dry-run"]));
    return;
  }

  if (command === "apply") {
    assertControlledProductionConfirm();
    await run("npx.cmd", supabaseArgs(["db", "query", "--linked", "-f", BILLING_MIGRATION]));
    await run("npx.cmd", supabaseArgs(["migration", "repair", BILLING_VERSION, "--status", "applied", "--linked", "--yes"]));
    return;
  }

  if (command === "deploy-functions") {
    assertControlledProductionConfirm();
    const projectRef = getCurrentLinkedProjectRef();
    for (const functionName of BILLING_FUNCTIONS) {
      await run("npx.cmd", supabaseArgs(["functions", "deploy", functionName, "--project-ref", projectRef, "--use-api"]));
    }
    return;
  }

  if (command === "validate") {
    await runSql(getValidationSql());
    return;
  }

  if (command === "smoke") {
    await smokeUnsignedWebhook();
    return;
  }

  throw new Error(`Comando invalido: ${command}. Use status, dry-run, apply, deploy-functions, validate ou smoke.`);
}

main().catch((error) => {
  console.error(error.message || error);
  process.exit(1);
});
