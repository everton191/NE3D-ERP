const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "..");
const read = (file) => fs.readFileSync(path.join(root, file), "utf8");

const app = read("app.js");
const migration = read("supabase/migrations/20260630113000_feature_access_matrix.sql");

[
  "const FEATURE_ACCESS_STATES = Object.freeze",
  "const FEATURE_ACCESS_REGISTRY = Object.freeze",
  "function getUserAccessRole",
  "function getFeatureAccessRule",
  "function getFeatureForScreen",
  "function formatFeatureAccessMessage",
  "function canAccessFeature(options = {})",
  "locked_by_plan",
  "hidden_by_mode",
  "blocked_by_role",
  "disabled_by_status",
  "limit_reached"
].forEach((marker) => assert.match(app, new RegExp(marker.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")), `app deve conter ${marker}`));

[
  "basic_dashboard",
  "advanced_dashboard",
  "basic_calculator",
  "professional_calculator",
  "calculator_settings",
  "basic_orders",
  "advanced_orders",
  "basic_stock",
  "spool_stock",
  "simple_cashier",
  "advanced_cashier",
  "basic_store",
  "advanced_store",
  "advanced_production",
  "printer_monitoring",
  "printer_remote_control",
  "employees_management",
  "advanced_account_security",
  "account_deletion",
  "theme_settings"
].forEach((feature) => assert.match(app, new RegExp(`${feature}:|${feature}'|${feature}"`), `feature front-end ausente: ${feature}`));

[
  "owner",
  "manager",
  "cashier",
  "production",
  "sales",
  "viewer"
].forEach((role) => assert.match(app, new RegExp(`"${role}"|'${role}'`), `papel front-end ausente: ${role}`));

assert.match(app, /const papel = getUserAccessRole\(usuario\)/, "canAccessScreen deve usar papel normalizado");
assert.match(app, /canAccessFeature\(\{ feature, usuario \}\)/, "canAccessScreen deve consultar matriz central");
assert.match(app, /return acesso\.allowed \|\| acesso\.state === FEATURE_ACCESS_STATES\.HIDDEN_BY_MODE;/, "modo oculto deve redirecionar sem quebrar navegacao");

[
  "create table if not exists public.app_feature_access_rules",
  "create or replace function public.can_access_app_feature",
  "basic_dashboard",
  "advanced_dashboard",
  "spool_stock",
  "printer_remote_control",
  "account_deletion",
  "allowed_modes text[]",
  "allowed_roles text[]",
  "requires_strong_confirmation boolean",
  "future_only boolean",
  "grant execute on function public.can_access_app_feature",
  "to authenticated, service_role"
].forEach((marker) => assert.match(migration, new RegExp(marker.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")), `migration deve conter ${marker}`));

assert.doesNotMatch(migration, /using\s*\(\s*true\s*\)|with check\s*\(\s*true\s*\)/i, "migration nao deve usar policy aberta");
assert.doesNotMatch(migration, /grant\s+(insert|update|delete|all)[^;]+to\s+authenticated/i, "authenticated nao deve escrever regras de acesso");
assert.match(migration, /revoke all on function public\.can_access_app_feature\(text, text, text, text, boolean\) from public, anon;/, "RPC nao deve ser publica/anon");

console.log("Feature access matrix tests OK");
