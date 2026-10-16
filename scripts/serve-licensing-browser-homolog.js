const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const { getTarget } = require('./supabase-homolog-test-utils');

const REPO_ROOT = path.resolve(__dirname, '..');
const BODY_LIMIT = 256 * 1024;
const CSP = [
  "default-src 'self'", "script-src 'self' 'unsafe-inline'",
  "style-src 'self' 'unsafe-inline'", "connect-src 'self'", "img-src 'self' data: blob:",
  "font-src 'self' data:", "media-src 'self' blob:", "worker-src 'none'",
  "frame-src 'none'", "frame-ancestors 'none'", "object-src 'none'",
  "base-uri 'self'", "form-action 'self'",
].join('; ');
const MIME = Object.freeze({ '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8', '.json': 'application/json; charset=utf-8',
  '.webmanifest': 'application/manifest+json; charset=utf-8', '.svg': 'image/svg+xml', '.png': 'image/png',
  '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp', '.gif': 'image/gif', '.ico': 'image/x-icon',
  '.woff': 'font/woff', '.woff2': 'font/woff2', '.ttf': 'font/ttf', '.otf': 'font/otf', '.mp4': 'video/mp4' });
const STATIC_FILES = new Set(['/index.html', '/app.js', '/style.css', '/manifest.webmanifest']);
const SPA_ROUTES = new Set(['/', '/superadmin', '/privacy', '/terms']);
const AUTH_METHODS = Object.freeze({ token: ['POST'], user: ['GET', 'PUT'], logout: ['POST'],
  signup: ['POST'], recover: ['POST'], settings: ['GET'] });

function failure(status, message) { return Object.assign(new Error(message), { status }); }
function allowedStaticPath(filePath) {
  if (!filePath.startsWith('/') || filePath.includes('\\')
    || filePath.split('/').some((part) => part.startsWith('.'))) return false;
  const extension = path.extname(filePath).toLowerCase();
  return STATIC_FILES.has(filePath) || (['/src/', '/styles/', '/assets/'].some((prefix) => filePath.startsWith(prefix))
    && !!MIME[extension] && extension !== '.html');
}

function allowedResolvedPath(realRoot, realFile) {
  const relative = path.relative(realRoot, realFile);
  if (!relative || relative.startsWith('..') || path.isAbsolute(relative)) return false;
  // A symlink inside assets/src must not expose another directory merely
  // because its destination is still somewhere inside the repository.
  return allowedStaticPath('/' + relative.split(path.sep).join('/'));
}

function jsonForScript(value) {
  return JSON.stringify(value).replace(/[<>&\u2028\u2029]/g, (char) => `\\u${char.charCodeAt(0).toString(16).padStart(4, '0')}`);
}

function cleanPath(rawUrl, origin) {
  if (!rawUrl?.startsWith('/') || rawUrl.startsWith('//') || /[\\\x00-\x20#]/.test(rawUrl))
    throw failure(400, 'Invalid request path');
  const rawPath = rawUrl.split('?')[0];
  let decoded;
  try { decoded = decodeURIComponent(rawPath); } catch { throw failure(400, 'Invalid path encoding'); }
  // Reject separators, double encodings and dot segments before URL normalizes them.
  if (/[\\\x00-\x1f%]/.test(decoded) || /%2f/i.test(rawPath)
    || decoded.split('/').some((part) => part === '.' || part === '..' || part.startsWith('.')))
    throw failure(400, 'Invalid request path');
  const parsed = new URL(rawUrl, origin);
  if (parsed.origin !== origin || parsed.pathname !== rawPath) throw failure(400, 'Invalid request path');
  return { pathname: decoded, search: parsed.search, params: parsed.searchParams };
}

function proxyRoute(pathname, params) {
  if (pathname.startsWith('/functions/') || pathname.startsWith('/storage/') || pathname.startsWith('/realtime/'))
    throw failure(503, 'This backend service is not available in browser homologation');
  const auth = /^\/auth\/v1\/([a-z]+)$/.exec(pathname);
  if (auth && AUTH_METHODS[auth[1]]) {
    if (auth[1] === 'token' && !['password', 'refresh_token'].includes(params.get('grant_type')))
      throw failure(403, 'Authentication grant not allowed');
    return AUTH_METHODS[auth[1]];
  }
  if (/^\/rest\/v1\/[A-Za-z_][A-Za-z0-9_]*$/.test(pathname)
    || /^\/rest\/v1\/rpc\/[A-Za-z_][A-Za-z0-9_]*$/.test(pathname))
    return ['GET', 'HEAD', 'POST', 'PATCH', 'PUT', 'DELETE'];
  throw failure(403, 'Proxy path not allowed');
}

function readBody(request, limit) {
  if (Number(request.headers['content-length']) > limit) {
    request.resume();
    return Promise.reject(failure(413, 'Request body too large'));
  }
  return new Promise((resolve, reject) => {
    let size = 0, rejected = false;
    const chunks = [];
    request.on('data', (chunk) => {
      if (rejected) return;
      size += chunk.length;
      if (size > limit) {
        rejected = true; chunks.length = 0;
        reject(failure(413, 'Request body too large'));
      } else chunks.push(chunk);
    });
    request.on('end', () => { if (!rejected) resolve(Buffer.concat(chunks)); });
    request.on('error', () => reject(failure(400, 'Request body unavailable')));
    request.on('aborted', () => reject(failure(400, 'Request body aborted')));
  });
}

function createServer({ env = process.env, bodyLimit = BODY_LIMIT,
  logger = ({ method, pathname, status }) => console.log(`[browser-homolog] ${method} ${pathname} ${status}`) } = {}) {
  const { url: targetUrl, anonKey } = getTarget('local', env);
  if (!Number.isSafeInteger(bodyLimit) || bodyLimit < 1 || bodyLimit > BODY_LIMIT) throw new Error('Invalid body limit');
  const realRoot = fs.realpathSync(REPO_ROOT);
  const server = http.createServer(async (request, response) => {
    const origin = `http://127.0.0.1:${server.address().port}`;
    let loggedPath = '[rejected path]';
    response.setHeader('Cache-Control', 'no-store');
    response.setHeader('Content-Security-Policy', CSP);
    response.setHeader('X-Content-Type-Options', 'nosniff');
    response.setHeader('X-Frame-Options', 'DENY');
    response.setHeader('Referrer-Policy', 'no-referrer');
    response.on('finish', () => logger({ method: request.method, pathname: loggedPath, status: response.statusCode }));
    const sendJson = (status, body) => {
      response.statusCode = status;
      response.setHeader('Content-Type', 'application/json; charset=utf-8');
      response.end(JSON.stringify(body));
    };
    try {
      if (request.headers.host !== new URL(origin).host) throw failure(403, 'Unexpected host');
      const { pathname, search, params } = cleanPath(request.url, origin);
      const proxyPrefix = '/__supabase';
      if (pathname === proxyPrefix || pathname.startsWith(`${proxyPrefix}/`)) {
        const upstreamPath = pathname.slice(proxyPrefix.length);
        loggedPath = proxyPrefix + (upstreamPath.startsWith('/auth/') ? '/auth/v1/[endpoint]' : upstreamPath);
        const methods = proxyRoute(upstreamPath, params);
        if (request.headers.origin && request.headers.origin !== origin) throw failure(403, 'Cross-origin request forbidden');
        if (request.method === 'OPTIONS') {
          if (request.headers.origin !== origin) throw failure(403, 'Origin required');
          const intendedMethod = String(request.headers['access-control-request-method'] || '').toUpperCase();
          if (!methods.includes(intendedMethod)) throw failure(405, 'Method not allowed');
          response.setHeader('Access-Control-Allow-Origin', origin);
          response.setHeader('Access-Control-Allow-Methods', methods.join(', '));
          response.setHeader('Access-Control-Allow-Headers', 'authorization, apikey, content-type, prefer, range, x-client-info');
          response.statusCode = 204; response.end(); return;
        }
        if (!methods.includes(request.method)) throw failure(405, 'Method not allowed');
        const mutating = !['GET', 'HEAD'].includes(request.method);
        if (mutating && request.headers.origin !== origin) throw failure(403, 'Same-origin mutation required');
        const body = mutating ? await readBody(request, bodyLimit) : null;
        const headers = {};
        for (const key of ['accept', 'apikey', 'authorization', 'content-type', 'prefer', 'range',
          'range-unit', 'x-client-info', 'accept-profile', 'content-profile', 'if-match', 'if-none-match'])
          if (typeof request.headers[key] === 'string') headers[key] = request.headers[key];
        let upstream;
        try {
          upstream = await fetch(targetUrl + upstreamPath + search, { method: request.method,
            headers, ...(body?.length ? { body } : {}), redirect: 'error', signal: AbortSignal.timeout(25000) });
        } catch { throw failure(502, 'Local backend unavailable'); }
        response.statusCode = upstream.status;
        for (const key of ['content-type', 'content-range', 'range-unit', 'preference-applied']) {
          const value = upstream.headers.get(key);
          if (value) response.setHeader(key, value);
        }
        if (!response.hasHeader('Content-Type')) response.setHeader('Content-Type', 'application/json; charset=utf-8');
        response.end(request.method === 'HEAD' ? undefined : Buffer.from(await upstream.arrayBuffer()));
        return;
      }
      loggedPath = pathname;
      if (!['GET', 'HEAD'].includes(request.method)) throw failure(405, 'Method not allowed');
      if (pathname === '/sw.js') throw failure(404, 'Service worker disabled in web homologation');
      const filePath = SPA_ROUTES.has(pathname) ? '/index.html' : pathname;
      const extension = path.extname(filePath).toLowerCase();
      if (!allowedStaticPath(filePath))
        throw failure(404, 'File not available in web homologation');
      const resolved = path.resolve(realRoot, `.${filePath}`);
      let realFile, stats;
      try { realFile = await fs.promises.realpath(resolved); stats = await fs.promises.stat(realFile); }
      catch { throw failure(404, 'File not found'); }
      if (!allowedResolvedPath(realRoot, realFile) || !stats.isFile())
        throw failure(403, 'File outside static allowlist');
      response.statusCode = 200;
      response.setHeader('Content-Type', MIME[extension]);
      if (filePath === '/index.html') {
        const configuration = `<script>globalThis.__APP_PUBLIC_URL__=${jsonForScript(origin)};` +
          `globalThis.__SUPABASE_URL__=${jsonForScript(origin + proxyPrefix)};` +
          `globalThis.__SUPABASE_ANON_KEY__=${jsonForScript(anonKey)};</script>`;
        const html = (await fs.promises.readFile(realFile, 'utf8')).replace('<head>', `<head>\n${configuration}`);
        response.end(request.method === 'HEAD' ? undefined : html);
      } else {
        response.setHeader('Content-Length', stats.size);
        if (request.method === 'HEAD') response.end();
        else fs.createReadStream(realFile).on('error', () => response.destroy()).pipe(response);
      }
    } catch (error) {
      if (!response.headersSent) sendJson(error.status || 500, { ok: false,
        error: error.status ? error.message : 'Local homologation server error' });
      else response.destroy();
    }
  });
  server.requestTimeout = 30000;
  server.headersTimeout = 10000;
  return server;
}

if (require.main === module) {
  const configured = process.argv[2] || process.env.S3D_BROWSER_HOMOLOG_PORT || '4187';
  if (!/^\d+$/.test(configured) || Number(configured) < 1 || Number(configured) > 65535)
    throw new Error('Use a valid local browser homologation port');
  const server = createServer();
  server.on('error', (error) => {
    console.error(`Local browser homologation server unavailable (${error.code || 'server error'})`);
    process.exitCode = 1;
  });
  server.listen(Number(configured), '127.0.0.1', () => {
    console.log(`Browser homologation: http://127.0.0.1:${configured} (local Auth/REST only; not PWA/gateway certification)`);
  });
}

module.exports = { createServer, CSP, BODY_LIMIT, allowedResolvedPath };
