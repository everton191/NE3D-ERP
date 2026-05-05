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
  ["erp_profiles self update user role", /profiles_update_self_or_admin[\s\S]*and role = 'user'/i],
  ["companies table", /create table if not exists public\.companies/i],
  ["company_members user role", /company_members_role_check[\s\S]*role in \('user', 'admin', 'attendant', 'production', 'finance', 'read_only'\)/i],
  ["signup creates user member", /handle_new_saas_auth_user[\s\S]*insert into public\.company_members[\s\S]*'user'/i],
  ["post-login returns company_id", /sync_saas_user_after_login[\s\S]*'company_id'/i],
  ["superadmins table", /create table if not exists public\.superadmins/i],
  ["superadmin by user_id", /public\.superadmins[\s\S]*user_id = auth\.uid\(\)/i],
  ["active plan column", /add column if not exists active_plan text not null default 'free'/i],
  ["pending plan column", /add column if not exists pending_plan text/i],
  ["plan price locked", /add column if not exists plan_price numeric\(10,2\)[\s\S]*add column if not exists price_locked boolean not null default false/i],
  ["trial fields", /trial_started_at[\s\S]*trial_expires_at[\s\S]*is_trial_active/i],
  ["pending cleanup 24h", /pending_started_at[\s\S]*now\(\) - interval '24 hours'/i],
  ["paid price tiers", /v_paid_clients < 100[\s\S]*19\.90[\s\S]*v_paid_clients < 200[\s\S]*24\.90[\s\S]*29\.90/i],
  ["payment trigger applies approved only", /private\.s3d_apply_payment_to_subscription[\s\S]*if new\.status = 'pending'[\s\S]*elsif new\.status = 'approved'/i],
  ["app suggestions table", /create table if not exists public\.app_suggestions/i],
  ["app suggestions RLS", /alter table public\.app_suggestions enable row level security/i],
  ["demote accidental admins", /update public\.profiles[\s\S]*set role = 'user'[\s\S]*where role = 'admin'/i],
  ["sync settings table", /create table if not exists public\.sync_settings/i],
  ["profiles onboarding fields", /alter table (if exists )?public\.profiles[\s\S]*onboarding_completed[\s\S]*onboarding_step/i],
  ["erp_profiles onboarding fields", /alter table (if exists )?public\.erp_profiles[\s\S]*onboarding_completed[\s\S]*onboarding_step/i],
  ["companies setup fields", /alter table (if exists )?public\.companies[\s\S]*setup_completed[\s\S]*print_type[\s\S]*default_material/i],
  ["app error logs table", /create table if not exists public\.app_error_logs/i],
  ["app error log users table", /create table if not exists public\.app_error_log_users/i],
  ["app feedback reports table", /create table if not exists public\.app_feedback_reports/i],
  ["register app error RPC", /create or replace function public\.register_app_error/i],
  ["error logs RLS", /alter table public\.app_error_logs enable row level security/i],
  ["feedback RLS", /alter table public\.app_feedback_reports enable row level security/i],
  ["error dedupe 6 hours", /last_seen_at >= now\(\) - interval '6 hours'/i],
  ["error affected users count", /affected_user_count[\s\S]*app_error_log_users/i]
];

const results = checks.map(([check, pattern]) => ({
  check,
  ok: pattern.test(sql)
}));

console.table(results);

if (results.some((result) => !result.ok)) {
  process.exitCode = 1;
}
