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

const START_PLAN_MIGRATION = "supabase/migrations/20260530103000_start_plan_backend_authority.sql";
const START_PLAN_VERSION = "20260530103000";
const START_PLAN_FUNCTIONS = [
  "mercadopago-webhook",
  "mercadopago-create-payment",
  "mercadopago-create-subscription",
];

function readMigration() {
  return fs.readFileSync(path.join(ROOT, START_PLAN_MIGRATION), "utf8");
}

function getValidationSql() {
  return `
begin;

do $$
declare
  v_start_count integer;
  v_start_price numeric;
  v_start_enabled boolean;
  v_active_commercial_plans text[];
  v_configured_ids integer;
  v_open_policies integer;
  v_frontend_grants integer;
begin
  select count(*), max(price)
    into v_start_count, v_start_price
  from public.plans
  where slug = 'start'
    and active is true;

  if v_start_count <> 1 or v_start_price <> 29.90 then
    raise exception 'Start plan validation failed. count=%, price=%', v_start_count, v_start_price;
  end if;

  if to_regclass('public.app_billing_feature_flags') is null then
    raise exception 'Start plan validation failed. app_billing_feature_flags missing.';
  end if;

  select enabled
    into v_start_enabled
  from public.app_billing_feature_flags
  where feature_key = 'start_plan_enabled';

  if coalesce(v_start_enabled, false) is not true then
    raise exception 'Start plan validation failed. start_plan_enabled must be true.';
  end if;

  select array_agg(slug order by sort_order, slug)
    into v_active_commercial_plans
  from public.plans
  where active is true;

  if v_active_commercial_plans is distinct from array['free', 'start', 'pro']::text[] then
    raise exception 'Commercial plan validation failed. active=%', v_active_commercial_plans;
  end if;

  select count(*)
    into v_configured_ids
  from public.app_billing_feature_flags
  where feature_key in (
      'mercado_pago_start_plan_id_configured',
      'mercado_pago_pro_plan_id_configured'
    )
    and enabled is true;

  if v_configured_ids <> 2 then
    raise exception 'Billing plan ID validation failed. configured=%', v_configured_ids;
  end if;

  select count(*)
    into v_frontend_grants
  from information_schema.role_table_grants
  where table_schema = 'public'
    and table_name = 'app_billing_feature_flags'
    and grantee in ('anon', 'authenticated')
    and privilege_type in ('SELECT', 'INSERT', 'UPDATE', 'DELETE');

  if v_frontend_grants <> 0 then
    raise exception 'Start plan validation failed. Frontend grants found: %', v_frontend_grants;
  end if;

  select count(*)
    into v_open_policies
  from pg_policies
  where schemaname = 'public'
    and tablename = 'app_billing_feature_flags'
    and (
      coalesce(qual, '') ~* '^\\s*true\\s*$'
      or coalesce(with_check, '') ~* '^\\s*true\\s*$'
    );

  if v_open_policies <> 0 then
    raise exception 'Start plan validation failed. Open policies found: %', v_open_policies;
  end if;
end $$;

rollback;

select 'start_plan_remote_validation_ok' as status;
`;
}

async function runSql(sql, prefix = "simplifica-start-plan") {
  const file = path.join(os.tmpdir(), `${prefix}-${Date.now()}.sql`);
  fs.writeFileSync(file, sql, "utf8");
  try {
    await run("npx.cmd", supabaseArgs(["db", "query", "--linked", "-f", file]));
  } finally {
    fs.rmSync(file, { force: true });
  }
}

function getSandboxToken() {
  return String(process.env.MERCADOPAGO_SANDBOX_ACCESS_TOKEN || "").trim();
}

function assertSandboxToken() {
  const token = getSandboxToken();
  if (!token) throw new Error("Defina MERCADOPAGO_SANDBOX_ACCESS_TOKEN para usar sandbox.");
  if (!token.startsWith("TEST-")) throw new Error("Sandbox rejeitado: use somente token Mercado Pago TEST-.");
  if (token.startsWith("APP_USR-")) throw new Error("Token produtivo APP_USR- bloqueado nesta fase.");
  return token;
}

async function sandboxCreatePlan() {
  if (process.env.MERCADOPAGO_SANDBOX_CONTROLLED_CONFIRM !== "true") {
    throw new Error("Confirme MERCADOPAGO_SANDBOX_CONTROLLED_CONFIRM=true para criar plano sandbox.");
  }
  const token = assertSandboxToken();
  const response = await fetch("https://api.mercadopago.com/preapproval_plan", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      reason: "Simplifica 3D Start",
      auto_recurring: {
        frequency: 1,
        frequency_type: "months",
        transaction_amount: 29.9,
        currency_id: "BRL",
      },
      back_url: "https://erpne3d.vercel.app/?assinatura=retorno",
      status: "active",
    }),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.message || `Mercado Pago sandbox HTTP ${response.status}`);
  console.log(`sandbox_start_plan_created id=${data.id || "(sem id)"}`);
}

async function sandboxValidate() {
  const token = assertSandboxToken();
  const planId = String(process.env.MERCADOPAGO_SANDBOX_START_PLAN_ID || process.env.MERCADO_PAGO_START_PLAN_ID || "").trim();
  if (!planId) throw new Error("Defina MERCADOPAGO_SANDBOX_START_PLAN_ID para validar o plano Start sandbox.");
  const response = await fetch(`https://api.mercadopago.com/preapproval_plan/${encodeURIComponent(planId)}`, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/json",
    },
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.message || `Mercado Pago sandbox HTTP ${response.status}`);
  const amount = Number(data?.auto_recurring?.transaction_amount);
  if (amount !== 29.9) throw new Error(`Plano sandbox Start com valor inesperado: ${amount}`);
  console.log(`sandbox_start_plan_validated id=${planId} amount=${amount}`);
}

async function main() {
  const command = process.argv[2] || "status";
  assertLinkedToMain();

  if (command === "status") {
    console.log(`Projeto Supabase linkado: ${getCurrentLinkedProjectRef()}`);
    console.log(`${fs.existsSync(path.join(ROOT, START_PLAN_MIGRATION)) ? "OK" : "MISSING"} ${START_PLAN_MIGRATION}`);
    START_PLAN_FUNCTIONS.forEach((name) => console.log(`${fs.existsSync(path.join(ROOT, "supabase", "functions", name, "index.ts")) ? "OK" : "MISSING"} supabase/functions/${name}/index.ts`));
    console.log(`START_PLAN_ENABLED local=${process.env.START_PLAN_ENABLED === "true" ? "true" : "false"}`);
    console.log(`MERCADO_PAGO_START_PLAN_ID local=${process.env.MERCADO_PAGO_START_PLAN_ID ? "configured" : "missing"}`);
    return;
  }

  if (command === "dry-run") {
    await runSql(`begin;\n${readMigration()}\nrollback;\nselect 'start_plan_dry_run_ok' as status;`, "simplifica-start-plan-dry-run");
    return;
  }

  if (command === "apply") {
    assertControlledProductionConfirm();
    await run("npx.cmd", supabaseArgs(["db", "query", "--linked", "-f", START_PLAN_MIGRATION]));
    await run("npx.cmd", supabaseArgs(["migration", "repair", START_PLAN_VERSION, "--status", "applied", "--linked", "--yes"]));
    return;
  }

  if (command === "validate") {
    await runSql(getValidationSql());
    return;
  }

  if (command === "sandbox-create-plan") {
    await sandboxCreatePlan();
    return;
  }

  if (command === "sandbox-validate") {
    await sandboxValidate();
    return;
  }

  if (command === "production-status") {
    console.log("production_start_plan_creation=disabled");
    console.log("Use sandbox-create-plan somente com token TEST-. Produção deve ser criada manualmente e configurada via secret backend.");
    return;
  }

  throw new Error(`Comando invalido: ${command}. Use status, dry-run, apply, validate, sandbox-create-plan, sandbox-validate ou production-status.`);
}

main().catch((error) => {
  console.error(error.message || error);
  process.exit(1);
});
