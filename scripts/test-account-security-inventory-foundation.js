const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "..");
const read = (file) => fs.readFileSync(path.join(root, file), "utf8");
const exists = (file) => fs.existsSync(path.join(root, file));

const migrationPath = "supabase/migrations/20260630103000_account_security_inventory_foundation_disabled.sql";
const remoteScriptPath = "scripts/account-security-inventory-remote-controlled.js";
const migration = read(migrationPath);
const remoteScript = read(remoteScriptPath);
const app = read("app.js");
const pkg = read("package.json");

function extractFunction(source, name) {
  const start = source.indexOf(`function ${name}`);
  assert.notEqual(start, -1, `${name} deve existir`);
  const open = source.indexOf("{", start);
  let depth = 0;
  for (let index = open; index < source.length; index += 1) {
    const char = source[index];
    if (char === "{") depth += 1;
    if (char === "}") {
      depth -= 1;
      if (depth === 0) return source.slice(start, index + 1);
    }
  }
  throw new Error(`Nao foi possivel extrair ${name}`);
}

function includes(marker) {
  assert.match(
    migration,
    new RegExp(marker.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")),
    `migration deve conter ${marker}`
  );
}

assert.equal(exists(migrationPath), true, "migration de fundacao backend deve existir");
assert.equal(exists(remoteScriptPath), true, "script remoto controlado deve existir");

[
  "No 2FA, Google login, device enforcement",
  "automatic roll consumption is active in this phase",
  "create table if not exists public.app_account_feature_flags",
  "create table if not exists public.inventory_rolls",
  "create table if not exists public.inventory_roll_events",
  "create table if not exists public.account_security_settings",
  "create table if not exists public.account_devices",
  "create table if not exists public.account_login_events",
  "create table if not exists public.account_deletion_requests",
  "filament_rolls_enabled",
  "automatic_roll_consumption_enabled",
  "account_2fa_enabled",
  "google_login_enabled",
  "account_devices_enabled",
  "account_deletion_enabled",
  "enabled boolean not null default false",
  "two_factor_enabled boolean not null default false",
  "google_login_enabled boolean not null default false",
  "deletion_grace_days integer not null default 15",
  "scheduled_delete_at >= requested_at + interval '15 days'",
  "alter table public.inventory_rolls enable row level security",
  "alter table public.account_security_settings enable row level security",
  "alter table public.account_devices enable row level security",
  "alter table public.account_deletion_requests enable row level security",
  "owner_id = auth.uid()",
  "public.erp_is_superadmin()",
  "revoke all on public.inventory_rolls from public, anon, authenticated",
  "revoke all on public.account_security_settings from public, anon, authenticated",
  "grant select on public.inventory_rolls, public.inventory_roll_events to authenticated, service_role",
  "grant select on public.account_security_settings, public.account_devices, public.account_login_events, public.account_deletion_requests to authenticated, service_role",
  "grant insert, update, delete on public.inventory_rolls, public.inventory_roll_events to service_role",
  "grant insert, update, delete on public.account_security_settings, public.account_devices, public.account_login_events, public.account_deletion_requests to service_role"
].forEach(includes);

assert.doesNotMatch(migration, /using\s*\(\s*true\s*\)|with check\s*\(\s*true\s*\)/i, "migration nao deve criar policy publica aberta");
assert.doesNotMatch(migration, /grant\s+(insert|update|delete|all)[^;]+to\s+authenticated/i, "authenticated nao deve receber escrita direta");
assert.doesNotMatch(migration, /grant\s+execute[^;]+to\s+(public|anon|authenticated)/i, "nenhuma RPC publica deve ser ativada");
assert.doesNotMatch(migration, /create\s+or\s+replace\s+function\s+public\.(request|confirm|activate|consume|register|enable)/i, "migration nao deve expor funcoes de ativacao");
assert.doesNotMatch(migration, /secret|access_token|refresh_token|client_secret/i, "migration nao deve conter segredo ou token real");

assert.match(remoteScript, /assertLinkedToMain\(\)/, "script remoto deve exigir projeto principal linkado");
assert.match(remoteScript, /assertControlledProductionConfirm\(\)/, "apply remoto deve exigir confirmacao de producao");
assert.match(remoteScript, /account_security_inventory_remote_validation_ok/, "script remoto deve validar aplicacao");
assert.match(remoteScript, /migration", "repair", FOUNDATION_VERSION/, "script remoto deve reparar historico de migration apos apply");
assert.match(pkg, /"supabase:account-security-inventory:apply"/, "package deve expor apply controlado");
assert.match(pkg, /"supabase:account-security-inventory:validate"/, "package deve expor validate remoto");

assert.match(app, /const WHATSAPP_2FA_BACKEND_ENABLED = false;/, "2FA do app deve continuar desligado");
const authCode = [
  extractFunction(app, "renderAuthPublica"),
  extractFunction(app, "renderAuthEntrar"),
  extractFunction(app, "renderAuthCriarConta")
].join("\n");
assert.doesNotMatch(authCode, /renderGoogleAuthButton\("Entrar com Google"\)/i, "login Google temporariamente desativado nao deve aparecer em Entrar");
assert.match(app, /const GOOGLE_AUTH_ENABLED = false;/, "login Google deve permanecer bloqueado ate a publicacao");
assert.doesNotMatch(pkg, /"googleapis"|"@google\//i, "nenhum SDK Google deve ser adicionado");

console.log("Account security and inventory foundation tests OK");
