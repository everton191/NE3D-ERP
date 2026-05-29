const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "..");
const read = (file) => fs.readFileSync(path.join(root, file), "utf8");
const exists = (file) => fs.existsSync(path.join(root, file));

const googleService = require("../src/integrations/google/googleIntegrationService.js");
const googleConfig = require("../src/integrations/google/google.config.example.js");

function extractFunction(source, name) {
  const start = source.indexOf(`function ${name}`);
  assert.notEqual(start, -1, `${name} deve existir`);
  const open = source.indexOf("{", start);
  let depth = 0;
  for (let i = open; i < source.length; i += 1) {
    if (source[i] === "{") depth += 1;
    if (source[i] === "}") depth -= 1;
    if (depth === 0) return source.slice(start, i + 1);
  }
  throw new Error(`Nao foi possivel extrair ${name}`);
}

async function run() {
  [
    "src/integrations/google/README.md",
    "src/integrations/google/google.config.example.js",
    "src/integrations/google/googleIntegrationService.js",
    "src/integrations/google/auth/README.md",
    "src/integrations/google/calendar/README.md",
    "src/integrations/google/drive/README.md",
    "src/integrations/google/gmail/README.md",
    "src/integrations/google/sheets/README.md",
    "supabase/functions/google-oauth/README.md",
    "supabase/functions/google-calendar-sync/README.md",
    "supabase/functions/google-drive-backup/README.md",
    "supabase/functions/google-gmail-send/README.md",
    "supabase/functions/google-sheets-sync/README.md"
  ].forEach((file) => assert.equal(exists(file), true, `arquivo base Google deve existir: ${file}`));

  const flags = googleConfig.GOOGLE_FEATURE_FLAGS;
  [
    "google_integrations_enabled",
    "google_auth_enabled",
    "google_calendar_enabled",
    "google_drive_enabled",
    "google_gmail_enabled",
    "google_sheets_enabled"
  ].forEach((flag) => assert.equal(flags[flag], false, `${flag} deve nascer false`));

  assert.equal(googleService.isGoogleIntegrationsEnabled(), false, "integracoes Google devem ficar desligadas");
  const status = await googleService.getGoogleIntegrationStatus();
  assert.equal(status.enabled, false, "status Google deve ficar disabled");
  assert.equal(status.status, "disabled", "status Google deve retornar disabled");

  for (const method of [
    "connectGoogleAccount",
    "disconnectGoogleAccount",
    "syncGoogleCalendar",
    "backupToGoogleDrive",
    "sendWithGmail",
    "syncGoogleSheets"
  ]) {
    const result = await googleService[method]();
    assert.equal(result.ok, false, `${method} deve bloquear`);
    assert.equal(result.enabled, false, `${method} deve permanecer desligado`);
    assert.equal(result.status, "disabled", `${method} deve retornar disabled`);
    assert.equal(result.reason, "GOOGLE_INTEGRATIONS_DISABLED", `${method} deve usar erro controlado`);
  }

  const pkg = read("package.json");
  assert.doesNotMatch(pkg, /"googleapis"|"@google\//i, "nenhum SDK Google deve ser adicionado ao package.json");

  const index = read("index.html");
  assert.doesNotMatch(index, /googleIntegrationService\.js|google-oauth|Entrar com Google|Login com Google/i, "index.html nao deve carregar ou exibir Google");

  const app = read("app.js");
  const authPublica = extractFunction(app, "renderAuthPublica");
  const authEntrar = extractFunction(app, "renderAuthEntrar");
  const authCriarConta = extractFunction(app, "renderAuthCriarConta");
  const authCode = [authPublica, authEntrar, authCriarConta].join("\n");
  assert.match(authCode, /usuarioLoginEmail/, "login por email/senha deve permanecer");
  assert.match(authCode, /usuarioLoginSenha/, "campo senha deve permanecer");
  assert.doesNotMatch(authCode, /Entrar com Google|Login com Google|renderGoogleAuthButton/i, "auth publico nao deve exibir botao Google");

  const service = read("src/integrations/google/googleIntegrationService.js");
  assert.doesNotMatch(service, /\bfetch\s*\(|XMLHttpRequest|gapi\.|googleapis|accounts\.google/i, "service Google nao deve chamar API externa");
  assert.doesNotMatch(service, /client_secret\s*[:=]\s*['"][^'"]+|refresh_token\s*[:=]\s*['"][^'"]+/i, "service Google nao deve conter segredo");

  const migration = read("supabase/migrations/20260529193000_google_integrations_foundation_disabled.sql");
  [
    "create table if not exists public.external_integrations",
    "create table if not exists public.integration_tokens",
    "create table if not exists public.integration_sync_jobs",
    "create table if not exists public.integration_logs",
    "create table if not exists public.app_integration_feature_flags",
    "encrypted_token_placeholder",
    "google_integrations_enabled",
    "google_auth_enabled",
    "google_calendar_enabled",
    "google_drive_enabled",
    "google_gmail_enabled",
    "google_sheets_enabled",
    "alter table public.external_integrations enable row level security",
    "alter table public.integration_tokens enable row level security",
    "alter table public.integration_sync_jobs enable row level security",
    "alter table public.integration_logs enable row level security",
    "alter table public.app_integration_feature_flags enable row level security"
  ].forEach((marker) => assert.match(migration, new RegExp(marker.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")), `migration deve conter ${marker}`));
  assert.doesNotMatch(migration, /using\s*\(\s*true\s*\)|with check\s*\(\s*true\s*\)/i, "migration Google nao deve criar policy publica aberta");
  assert.match(migration, /owner_id = auth\.uid\(\)/, "RLS deve usar auth.uid por owner_id");
  assert.match(migration, /public\.erp_is_superadmin\(\)/, "RLS deve respeitar superadmin");
  assert.doesNotMatch(migration, /integration tokens select owner or superadmin/i, "tokens nao devem ter policy de leitura frontend");
  assert.match(migration, /revoke all on public\.integration_tokens from anon, authenticated/i, "tokens devem revogar acesso frontend explicitamente");
  assert.doesNotMatch(migration, /grant select on public\.integration_tokens to authenticated/i, "tokens nao devem ter grant select para authenticated");
  assert.match(migration, /grant select, insert, update, delete on public\.integration_tokens to service_role/i, "tokens devem ficar reservados ao service_role");

  console.log("Google integrations foundation tests OK");
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
