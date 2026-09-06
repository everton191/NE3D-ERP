const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { stripTypeScriptTypes } = require('node:module');
const { test } = require('node:test');
const file = path.join(__dirname, '../supabase/functions/account-security/index.ts');
const code = stripTypeScriptTypes(fs.readFileSync(file, 'utf8').replace(/^import .*;\r?\n/gm, ''));

function harness({ enabled = true, verified = false, settingsError = null, sessionError = null, authenticated = true, role = 'read_only' } = {}) {
  const calls = [];
  let handler;
  const token = `x.${Buffer.from(JSON.stringify({ session_id: 'session-a' })).toString('base64url')}.x`;
  const admin = {
    auth: { getUser: async () => ({ data: { user: authenticated ? { id: 'user-a', email: 'test@example.invalid' } : null } }) },
    from(table) {
      const query = { table, filters: [], operation: 'select' };
      calls.push(query);
      const chain = {
        select() { return this; },
        eq(...args) { query.filters.push(['eq', ...args]); return this; },
        is(...args) { query.filters.push(['is', ...args]); return this; },
        gt(...args) { query.filters.push(['gt', ...args]); return this; },
        insert() { query.operation = 'insert'; return this; },
        maybeSingle() { return this; }, single() { return this; },
        then(resolve, reject) {
          let result = { data: [], error: null };
          if (table === 'company_members') result.data = { company_id: 'company-a', role, status: 'active' };
          if (table === 'companies') result.data = query.filters.some(f => f[1] === 'owner_user_id') ? null : { id: 'company-a', status: 'active' };
          if (table === 'account_security_settings') result = { data: { two_factor_enabled: enabled }, error: settingsError };
          if (table === 'user_2fa_sessions') result = { data: verified ? { id: 'verified-a' } : null, error: sessionError };
          return Promise.resolve(result).then(resolve, reject);
        }
      };
      return chain;
    }
  };
  vm.runInNewContext(code, { createClient: () => admin, serve: fn => { handler = fn; },
    Deno: { env: { get: () => 'test-only' } }, crypto: globalThis.crypto, TextEncoder, Uint8Array,
    atob, Response, Request, fetch: () => { throw new Error('Unexpected network'); } });
  return { calls, invoke: () => handler(new Request('https://example.invalid/account-security', {
    method: 'POST', headers: { authorization: `Bearer ${token}`, 'content-type': 'application/json' },
    body: JSON.stringify({ action: 'export_account_data' })
  })) };
}

for (const [name, options, expected] of [
  ['sem sessão autenticada', { authenticated: false }, 401],
  ['primeiro fator sem MFA', {}, 403],
  ['sessão MFA válida', { verified: true }, 200],
  ['conta sem MFA habilitado', { enabled: false }, 200],
  ['falha ao consultar configuração', { settingsError: { message: 'db offline' } }, 503],
  ['falha ao consultar sessão', { sessionError: { message: 'db offline' } }, 503]
]) {
  test(`exportação: ${name}`, async () => {
    const { calls, invoke } = harness(options);
    const response = await invoke();
    assert.equal(response.status, expected);
    assert.equal(response.headers.get('cache-control'), 'no-store');
    const events = calls.filter(c => c.table === 'security_events' && c.operation === 'select');
    if (expected !== 200) assert.equal(events.length, 0, 'bloqueio ocorre antes da leitura dos eventos');
    else {
      assert.equal(events.length, 1);
      assert.ok(events[0].filters.some(f => f[1] === 'user_id' && f[2] === 'user-a'));
      assert.ok(events[0].filters.some(f => f[1] === 'company_id' && f[2] === 'company-a'));
    }
    const session = calls.find(c => c.table === 'user_2fa_sessions');
    if (session) {
      assert.ok(session.filters.some(f => f[1] === 'auth_session_id' && f[2] === 'session-a'));
      assert.ok(session.filters.some(f => f[1] === 'revoked_at' && f[2] === null));
      assert.ok(session.filters.some(f => f[0] === 'gt' && f[1] === 'expires_at'));
    }
  });
}
