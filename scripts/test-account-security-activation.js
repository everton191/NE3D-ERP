const assert = require("node:assert/strict");
const fs = require("node:fs");

const app = fs.readFileSync("app.js", "utf8");
const migration = fs.readFileSync("supabase/migrations/20260630143000_account_security_email_2fa_and_deletion.sql", "utf8");
const guardMigration = fs.readFileSync("supabase/migrations/20260630150000_sensitive_feature_and_mfa_rls.sql", "utf8");
const edge = fs.readFileSync("supabase/functions/account-security/index.ts", "utf8");
const template = fs.readFileSync("supabase/templates/magic_link.html", "utf8");

for (const marker of ["user_2fa_challenges", "user_2fa_sessions", "security_events", "process_due_account_deletions", "erp_mfa_session_allowed", "pending_deletion"]) {
  assert.match(migration, new RegExp(marker), `migration deve conter ${marker}`);
}
assert.match(migration, /enable row level security/i);
assert.doesNotMatch(migration, /grant\\s+(insert|update|delete)[^;]+to\\s+authenticated/i);
assert.match(migration, /provider = 'supabase_auth' and code_hash is null/);

for (const action of ["request_2fa_enable", "request_2fa_login", "request_2fa_disable", "verify_2fa", "request_account_deletion", "confirm_account_deletion", "request_cancel_deletion", "confirm_cancel_deletion", "export_account_data"]) {
  assert.match(edge, new RegExp(action), `Edge Function deve conter ${action}`);
}
assert.match(edge, /attempt_count >= 5/);
assert.match(edge, /10 \* 60_000/);
assert.match(edge, /60_000/);
assert.doesNotMatch(edge, /Math\.random/);
assert.doesNotMatch(edge, /return\s+\{[^}]*\bcode\b[^}]*\}/is);

assert.match(app, /function accountSecurityRequest/);
assert.match(app, /function preparar2FAAposPrimeiroFator/);
assert.match(app, /function renderSegurancaContaOnline/);
assert.match(app, /function renderAccountDeletionBanner/);
assert.doesNotMatch(app, /function gerarCodigo2FA|Código: \\$\\{twoFactorPending\\.codigo\\}/);
assert.match(template, /{{ \.Token }}/);
assert.doesNotMatch(template, /ConfirmationURL/);
assert.match(guardMigration, /can_access_sensitive_feature/);
assert.match(guardMigration, /as restrictive for all to authenticated/i);
assert.match(guardMigration, /pending_deletion/);
assert.match(guardMigration, /requires_2fa/);

console.log("Account security activation checks OK");
