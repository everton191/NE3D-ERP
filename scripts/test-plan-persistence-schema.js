const assert = require("assert");
const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const migrationPath = path.join(root, "supabase", "migrations", "20260628110000_plan_catalog_persistence_foundation.sql");
const migration = fs.readFileSync(migrationPath, "utf8");
const rpcMigration = fs.readFileSync(path.join(root, "supabase", "migrations", "20260628113000_superadmin_plan_catalog_rpc.sql"), "utf8");
const remoteControl = fs.readFileSync(path.join(root, "scripts", "plan-persistence-remote-controlled.js"), "utf8");
const app = fs.readFileSync(path.join(root, "app.js"), "utf8");
const css = fs.readFileSync(path.join(root, "style.css"), "utf8");
const pkg = JSON.parse(fs.readFileSync(path.join(root, "package.json"), "utf8"));
const progress = fs.readFileSync(path.join(root, "docs", "superadmin-planos-progresso-2026-06-28.md"), "utf8");

function includesAll(source, items, label) {
  for (const item of items) {
    assert(source.includes(item), `${label}: faltando ${item}`);
  }
}

includesAll(migration, [
  "alter table public.plans",
  "display_headline",
  "display_subtitle",
  "display_description",
  "capabilities jsonb not null default '{}'::jsonb",
  "create table if not exists public.plan_card_stats",
  "create table if not exists public.plan_features",
  "create table if not exists public.plan_prices",
  "create table if not exists public.checkout_sessions",
  "create table if not exists public.payment_transactions",
  "create table if not exists public.webhook_events",
  "create table if not exists public.company_plan_overrides",
  "create table if not exists public.plan_change_schedules",
  "create table if not exists public.company_plan_usage",
], "tabelas de persistencia de planos");

[
  "plan_card_stats",
  "plan_features",
  "plan_prices",
  "checkout_sessions",
  "payment_transactions",
  "webhook_events",
  "company_plan_overrides",
  "plan_change_schedules",
  "company_plan_usage",
].forEach((table) => {
  assert(new RegExp(`alter table public\\.${table} enable row level security`, "i").test(migration), `${table}: RLS ausente`);
  assert(new RegExp(`revoke all on public\\.${table} from public, anon, authenticated`, "i").test(migration), `${table}: revoke frontend ausente`);
  assert(new RegExp(`grant select, insert, update, delete on public\\.${table} to service_role`, "i").test(migration), `${table}: grant service_role ausente`);
});

includesAll(migration, [
  "plan_prices_plan_key_unique_idx",
  "payment_transactions_provider_payment_unique_idx",
  "payment_transactions_idempotency_unique_idx",
  "webhook_events_provider_key_unique_idx",
  "checkout_connected\":false",
  "on conflict (plan_id, price_key) do update",
  "on conflict (plan_id, stat_key) do update",
  "on conflict (plan_id, feature_key) do update",
], "idempotencia e seeds seguros");

assert(!migration.includes("create or replace function public.mercadopago"), "foundation nao deve trocar funcoes Mercado Pago");
assert(!migration.includes("update public.subscriptions"), "foundation nao deve alterar assinatura real");
assert(!migration.includes("update public.payments"), "foundation nao deve alterar pagamentos reais");
assert(pkg.scripts["test:plan-persistence"], "package.json deve expor test:plan-persistence");
assert(pkg.scripts["supabase:plan-persistence:status"], "package.json deve expor status remoto");
assert(pkg.scripts["supabase:plan-persistence:dry-run"], "package.json deve expor dry-run remoto");
assert(pkg.scripts["supabase:plan-persistence:apply"], "package.json deve expor apply remoto");
assert(pkg.scripts["supabase:plan-persistence:validate"], "package.json deve expor validate remoto");
assert(pkg.scripts["supabase:plan-catalog:dry-run"], "package.json deve expor dry-run do catalogo");
assert(pkg.scripts["supabase:plan-catalog:apply"], "package.json deve expor apply do catalogo");
assert(pkg.scripts["supabase:plan-catalog:validate"], "package.json deve expor validate do catalogo");
includesAll(remoteControl, [
  "PLAN_PERSISTENCE_MIGRATION",
  "PLAN_CATALOG_RPC_MIGRATION",
  "assertLinkedToMain",
  "assertControlledProductionConfirm",
  "plan_persistence_dry_run_ok",
  "plan_persistence_remote_validation_ok",
  "plan_catalog_rpc_dry_run_ok",
  "plan_catalog_rpc_remote_validation_ok",
  "checkout_connected",
  "Frontend grants found",
  "Tables without RLS",
], "controle remoto de persistencia");
includesAll(rpcMigration, [
  "create or replace function public.get_superadmin_plan_catalog",
  "security definer",
  "if not public.erp_is_superadmin() then",
  "'checkout_connected', false",
  "public.plan_prices",
  "public.plan_features",
  "public.plan_card_stats",
  "public.checkout_sessions",
  "revoke all on function public.get_superadmin_plan_catalog() from public, anon",
  "grant execute on function public.get_superadmin_plan_catalog() to authenticated",
], "RPC Superadmin de catalogo");
includesAll(app, [
  "superAdminPlanCatalogRemoteState",
  "function carregarCatalogoPlanosSuperadminRemoto",
  "/rest/v1/rpc/get_superadmin_plan_catalog",
  "function renderSuperAdminPlanCatalogRemote",
  "Catálogo de planos",
], "painel Superadmin de catalogo remoto");
includesAll(css, [
  ".superadmin-plan-grid,",
  ".superadmin-plan-remote-list",
  ".superadmin-plan-grid .superadmin-plan-card",
  ".superadmin-plan-remote-list .superadmin-plan-remote-card",
  "scroll-snap-type:x mandatory",
], "carrossel mobile do Superadmin Planos");
assert(progress.includes("Fase PL-02A - Persistencia escalavel de planos"), "progresso deve registrar a fase PL-02A");

console.log("Plan persistence schema tests OK");
