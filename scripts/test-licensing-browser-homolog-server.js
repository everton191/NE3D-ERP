const assert = require('node:assert/strict');
const http = require('node:http');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const vm = require('node:vm');
const { createServer, CSP, allowedResolvedPath } = require('./serve-licensing-browser-homolog');

function testResolvedAllowlist() {
  const temporaryRoot = fs.mkdtempSync(path.join(os.tmpdir(), 's3d-homolog-static-'));
  try {
    const realRoot = fs.realpathSync(temporaryRoot);
    for (const relative of ['index.html', 'app.js', 'style.css', 'manifest.webmanifest',
      'src/features/account/example.js', 'styles/example.css', 'assets/example.json'])
      assert.equal(allowedResolvedPath(realRoot, path.join(realRoot, relative)), true, relative);
    for (const relative of ['artifacts/credentials.json', 'supabase/config.json', 'scripts/private.js',
      'apps/opticore/private.js', 'assets/.credentials.json', 'src/.private/config.json',
      'src/page.html', 'assets/file.env', '../outside.json'])
      assert.equal(allowedResolvedPath(realRoot, path.resolve(realRoot, relative)), false, relative);
    const assets = path.join(realRoot, 'assets');
    const artifacts = path.join(realRoot, 'artifacts');
    fs.mkdirSync(assets); fs.mkdirSync(artifacts);
    const target = path.join(artifacts, 'credentials.json');
    fs.writeFileSync(target, '{"synthetic":"not-a-secret"}');
    try {
      const alias = path.join(assets, 'link.json');
      fs.symlinkSync(target, alias, 'file');
      assert.equal(allowedResolvedPath(realRoot, fs.realpathSync(alias)), false,
        'An asset symlink to an excluded in-repository directory must be rejected');
      console.log('PASS real temporary symlink: assets/link.json cannot expose artifacts/credentials.json.');
    } catch (error) {
      if (!['EPERM', 'EACCES', 'ENOTSUP'].includes(error.code)) throw error;
      try {
        const junction = path.join(assets, 'linked-artifacts');
        fs.symlinkSync(artifacts, junction, 'junction');
        assert.equal(allowedResolvedPath(realRoot, fs.realpathSync(path.join(junction, 'credentials.json'))), false,
          'An allowed asset path through a directory junction must not expose artifacts');
        console.log('PASS real temporary junction: an asset alias cannot expose excluded in-repository artifacts.');
      } catch (junctionError) {
        if (!['EPERM', 'EACCES', 'ENOTSUP'].includes(junctionError.code)) throw junctionError;
        console.log('PASS resolved allowlist checks; temporary symlink/junction creation unavailable on this host.');
      }
    }
  } finally {
    // Only this invocation's verified temporary directory; never the workspace.
    const relative = path.relative(fs.realpathSync(os.tmpdir()), fs.realpathSync(temporaryRoot));
    assert(relative && !relative.startsWith('..') && !path.isAbsolute(relative)
      && path.basename(temporaryRoot).startsWith('s3d-homolog-static-'));
    fs.rmSync(temporaryRoot, { recursive: true, force: true });
  }
}

function listen(server) {
  return new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(0, '127.0.0.1', () => resolve(`http://127.0.0.1:${server.address().port}`));
  });
}
function close(server) {
  server.closeAllConnections?.();
  return new Promise((resolve) => server.close(resolve));
}
function rawRequest(origin, pathname, { method = 'GET', headers = {}, body } = {}) {
  return new Promise((resolve, reject) => {
    const request = http.request(origin, { method, path: pathname, headers }, (response) => {
      const chunks = [];
      response.on('data', (chunk) => chunks.push(chunk));
      response.on('end', () => resolve({ status: response.statusCode, headers: response.headers,
        body: Buffer.concat(chunks).toString('utf8') }));
    });
    request.on('error', reject);
    if (body) request.write(body);
    request.end();
  });
}

async function main() {
  testResolvedAllowlist();
  const records = [];
  const upstream = http.createServer(async (request, response) => {
    const chunks = [];
    for await (const chunk of request) chunks.push(chunk);
    const entry = { path: request.url, method: request.method, headers: request.headers,
      body: Buffer.concat(chunks).toString('utf8') };
    records.push(entry);
    if (request.url.includes('redirect_probe')) {
      response.statusCode = 302;
      response.setHeader('Location', 'https://must-not-be-requested.example.invalid/');
      response.end(); return;
    }
    response.setHeader('Content-Type', 'application/json');
    response.setHeader('Content-Range', '0-0/1');
    response.setHeader('Set-Cookie', 'upstream-only=never-forward');
    response.setHeader('Access-Control-Allow-Origin', '*');
    response.setHeader('X-Upstream-Private', 'must-not-leak');
    response.end(JSON.stringify({ ok: true, path: entry.path }));
  });
  let server, smallServer;
  try {
    const upstreamOrigin = await listen(upstream);
    const anon = 'synthetic-public-</script><script>bad()</script>&\u2028';
    const secret = 'synthetic-service-role-never-embed';
    const env = { S3D_LOCAL_SUPABASE_URL: upstreamOrigin,
      S3D_LOCAL_SUPABASE_ANON_KEY: anon, S3D_LOCAL_SUPABASE_SERVICE_ROLE_KEY: secret };
    assert.throws(() => createServer({ env: { ...env, S3D_LOCAL_SUPABASE_URL: 'https://production.example.invalid' } }));
    assert.throws(() => createServer({ env: { ...env, S3D_LOCAL_SUPABASE_URL: `${upstreamOrigin}/rest/v1` } }));
    const logs = [];
    server = createServer({ env, logger: (entry) => logs.push(entry) });
    const origin = await listen(server);
    const index = await rawRequest(origin, '/');
    assert.equal(index.status, 200);
    assert.equal(index.headers['cache-control'], 'no-store');
    assert.equal(index.headers['content-security-policy'], CSP);
    assert.equal(index.headers['x-content-type-options'], 'nosniff');
    assert.equal(index.headers['x-frame-options'], 'DENY');
    for (const directive of ["connect-src 'self'", "worker-src 'none'", "frame-src 'none'",
      "frame-ancestors 'none'", "object-src 'none'", "form-action 'self'"])
      assert(CSP.includes(directive));
    assert(!CSP.includes('https:') && !CSP.includes('http:') && !CSP.includes("'unsafe-eval'"));
    assert(!index.body.includes(secret));
    assert(!index.body.includes('</script><script>bad()'));
    assert(index.body.includes('\\u003c/script\\u003e'));
    const configuration = index.body.match(/<script>(globalThis\.__APP_PUBLIC_URL__=[\s\S]*?)<\/script>/)?.[1];
    assert(configuration);
    assert(index.body.indexOf(configuration) < index.body.indexOf('src="/app.js'));
    const globals = {};
    vm.runInNewContext(configuration, { globalThis: globals });
    assert.deepEqual(globals, { __APP_PUBLIC_URL__: origin, __SUPABASE_URL__: `${origin}/__supabase`,
      __SUPABASE_ANON_KEY__: anon });
    for (const pathname of ['/superadmin', '/privacy', '/terms'])
      assert.equal((await rawRequest(origin, pathname)).status, 200);
    for (const pathname of ['/app.js', '/manifest.webmanifest', '/assets/vendor/qrcode.min.js',
      '/src/features/account/auth-commands.js', '/styles/ui-v3/index.css', '/assets/icon-192.png'])
      assert.equal((await rawRequest(origin, pathname, { method: 'HEAD' })).status, 200, pathname);
    for (const pathname of ['/.env', '/.git/config', '/scripts/supabase-staging.js', '/supabase/config.toml',
      '/apps/opticore/index.html', '/dist/index.html', '/package.json', '/node_modules/x.js',
      '/src/../package.json', '/%2e%2e/.git/config', '/src/%2f..%2fpackage.json',
      '/src/%252e%252e/package.json', '/src\\..\\package.json', '/sw.js'])
      assert.notEqual((await rawRequest(origin, pathname)).status, 200, pathname);
    assert.equal((await rawRequest(origin, '/', { headers: { host: 'untrusted.example.invalid' } })).status, 403);
    const beforeProxy = records.length;
    for (const pathname of ['/__supabase/functions/v1/account-security', '/__supabase/functions/v1/mercadopago-create-subscription'])
      assert.equal((await rawRequest(origin, pathname, { method: 'POST', headers: { origin } })).status, 503);
    for (const pathname of ['/__supabase/auth/v1/admin/users', '/__supabase/auth/v1/authorize',
      '/__supabase/auth/v1/token?grant_type=client_credentials', '/__supabase/https://outside.invalid',
      '/__supabase/rest/v1/../auth/v1/admin/users'])
      assert.notEqual((await rawRequest(origin, pathname)).status, 200);
    assert.equal(records.length, beforeProxy, 'Forbidden services must never reach even the local upstream');

    const token = 'synthetic-browser-session';
    const requestBody = JSON.stringify({ email: 'synthetic@example.invalid', password: 'synthetic-password' });
    const login = await rawRequest(origin, '/__supabase/auth/v1/token?grant_type=password', {
      method: 'POST', headers: { origin, apikey: 'synthetic-browser-anon', authorization: `Bearer ${token}`,
        'content-type': 'application/json' }, body: requestBody });
    assert.equal(login.status, 200);
    assert.equal(records.at(-1).path, '/auth/v1/token?grant_type=password');
    assert.equal(records.at(-1).body, requestBody);
    assert.equal(records.at(-1).headers.authorization, `Bearer ${token}`);
    assert.equal(records.at(-1).headers.apikey, 'synthetic-browser-anon');
    assert(!JSON.stringify(records).includes(secret));
    assert.equal(login.headers['set-cookie'], undefined);
    assert.equal(login.headers['x-upstream-private'], undefined);
    assert.equal(login.headers['access-control-allow-origin'], undefined);
    assert.equal(login.headers['content-range'], '0-0/1');
    const rest = await rawRequest(origin, '/__supabase/rest/v1/plans?select=slug,metadata&active=eq.true');
    assert.equal(rest.status, 200);
    assert.equal(records.at(-1).path, '/rest/v1/plans?select=slug,metadata&active=eq.true');
    const mutation = await rawRequest(origin, '/__supabase/rest/v1/rpc/superadmin_update_plan_presentation', {
      method: 'POST', headers: { origin, 'content-type': 'application/json' }, body: '{"p_slug":"start"}' });
    assert.equal(mutation.status, 200);
    assert.equal(records.at(-1).path, '/rest/v1/rpc/superadmin_update_plan_presentation');
    const beforeForbidden = records.length;
    for (const headers of [{}, { origin: 'null' }, { origin: 'https://other.example.invalid' }])
      assert.equal((await rawRequest(origin, '/__supabase/rest/v1/rpc/example', {
        method: 'POST', headers, body: '{}' })).status, 403);
    assert.equal(records.length, beforeForbidden);
    const preflight = await rawRequest(origin, '/__supabase/rest/v1/plans', { method: 'OPTIONS',
      headers: { origin, 'access-control-request-method': 'PATCH' } });
    assert.equal(preflight.status, 204);
    assert.equal(preflight.headers['access-control-allow-origin'], origin);
    assert.equal((await rawRequest(origin, '/__supabase/rest/v1/plans', { method: 'OPTIONS',
      headers: { origin: 'https://other.example.invalid', 'access-control-request-method': 'PATCH' } })).status, 403);
    assert.equal((await rawRequest(origin, '/__supabase/auth/v1/user', { method: 'DELETE', headers: { origin } })).status, 405);
    const redirect = await rawRequest(origin, '/__supabase/rest/v1/redirect_probe');
    assert.equal(redirect.status, 502, 'Never follow a backend redirect to an external destination');

    smallServer = createServer({ env, bodyLimit: 32, logger: () => {} });
    const smallOrigin = await listen(smallServer);
    const beforeTooLarge = records.length;
    for (const withLength of [false, true]) {
      const large = await rawRequest(smallOrigin, '/__supabase/rest/v1/rpc/example', { method: 'POST',
        headers: { origin: smallOrigin, ...(withLength ? { 'content-length': '64' } : {}) }, body: 'x'.repeat(64) });
      assert.equal(large.status, 413);
    }
    assert.equal(records.length, beforeTooLarge, 'Oversized bodies must not reach the backend');
    assert(logs.every((entry) => Object.keys(entry).sort().join(',') === 'method,pathname,status'));
    assert(!JSON.stringify(logs).includes(token));
    assert(!JSON.stringify(logs).includes('synthetic-password'));
    assert(!JSON.stringify(logs).includes('grant_type'));
    console.log('PASS browser homologation server: local-only Auth/REST proxy, escaped public config, no service-key leak, file boundary, CSP, origin checks, gateway/SW denial and body limits.');
  } finally {
    if (smallServer) await close(smallServer);
    if (server) await close(server);
    await close(upstream);
  }
}

main().catch((error) => { console.error(error); process.exitCode = 1; });
