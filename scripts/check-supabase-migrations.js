const fs = require("fs");
const path = require("path");

const migrationsDir = path.join("supabase", "migrations");
const sql = fs.readdirSync(migrationsDir)
  .filter((file) => file.endsWith(".sql"))
  .sort()
  .map((file) => fs.readFileSync(path.join(migrationsDir, file), "utf8"))
  .join("\n");

const checks = [
  ["RLS clients", /alter table public\.clients enable row level security/i],
  ["RLS profiles", /alter table public\.profiles enable row level security/i],
  ["RLS erp_profiles", /alter table public\.erp_profiles enable row level security/i],
  ["RLS subscriptions", /alter table public\.subscriptions enable row level security/i],
  ["RLS companies", /alter table public\.companies enable row level security/i],
  ["RLS company_members", /alter table public\.company_members enable row level security/i],
  ["RLS sync_settings", /alter table public\.sync_settings enable row level security/i],
  ["profiles SELECT policy", /create policy "profiles_select_same_client_or_superadmin"[\s\S]*on public\.profiles for select/i],
  ["profiles INSERT policy", /create policy "profiles_insert_self"[\s\S]*on public\.profiles for insert/i],
  ["profiles UPDATE policy", /create policy "profiles_update_self_or_admin"[\s\S]*on public\.profiles for update/i],
  ["clients SELECT policy", /create policy "clients_select_own_or_superadmin"[\s\S]*on public\.clients for select/i],
  ["clients UPDATE policy", /create policy "clients_update_admin_or_superadmin"[\s\S]*on public\.clients for update/i],
  ["subscriptions SELECT policy", /create policy "subscriptions_select_same_client_or_superadmin"[\s\S]*on public\.subscriptions for select/i],
  ["register_saas_client function", /create or replace function public\.register_saas_client/i],
  ["get_saas_license function", /create or replace function public\.get_saas_license/i],
  ["Simplified plan ids", /slug not in \('free', 'premium_trial', 'premium'\)/i],
  ["subscription promo_used", /add column if not exists promo_used boolean not null default false/i],
  ["subscription billing variant", /add column if not exists billing_variant text/i],
  ["auth trial 7 days", /now\(\) \+ interval '7 days'/i],
  ["payment metadata billing variant", /billing_variant/i],
  ["promotional token disabled", /Tokens promocionais foram desativados/i],
  ["RPC anon execute hardening", /revoke execute on function public\.get_saas_license\(\) from public, anon, authenticated/i],
  ["Auth signup handler", /create or replace function public\.handle_new_saas_auth_user/i],
  ["Auth signup profile trigger", /create trigger on_auth_user_created_saas_profile[\s\S]*after insert on auth\.users/i],
  ["Post-login SaaS sync RPC", /create or replace function public\.sync_saas_user_after_login/i],
  ["erp_profiles self update admin role", /profiles_update_own_user[\s\S]*role in \('user', 'admin', 'operador', 'visualizador'\)/i],
  ["companies table", /create table if not exists public\.companies/i],
  ["company_members owner role", /create table if not exists public\.company_members[\s\S]*role in \('owner', 'admin', 'attendant', 'production', 'finance', 'read_only'\)/i],
  ["signup creates company member", /handle_new_saas_auth_user[\s\S]*insert into public\.company_members[\s\S]*'owner'/i],
  ["post-login returns company_id", /sync_saas_user_after_login[\s\S]*'company_id'/i],
  ["sync settings table", /create table if not exists public\.sync_settings/i]
];

const results = checks.map(([check, pattern]) => ({
  check,
  ok: pattern.test(sql)
}));

console.table(results);

if (results.some((result) => !result.ok)) {
  process.exitCode = 1;
}
