const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const { execFileSync } = require("node:child_process");
const { stripTypeScriptTypes } = require("node:module");
const { webcrypto } = require("node:crypto");

const root = path.resolve(__dirname, "..");
const ids = { actor: "00000000-0000-4000-8000-000000000001", other: "00000000-0000-4000-8000-000000000002",
  company: "10000000-0000-4000-8000-000000000001", otherCompany: "10000000-0000-4000-8000-000000000002",
  challenge: "20000000-0000-4000-8000-000000000001", session: "30000000-0000-4000-8000-000000000001",
  request: "40000000-0000-4000-8000-000000000001" };
const deleting = "confirm_account_deletion", cancelling = "confirm_cancel_deletion";
const sourcePath = "supabase/functions/account-security/index.ts";
// Optional immutable baseline, read into memory only: no checkout or source edits.
const source = process.argv.includes("--baseline")
  ? execFileSync("git", ["show", `d9153bb:${sourcePath}`], { cwd: root, encoding: "utf8" })
  : fs.readFileSync(path.join(root, sourcePath), "utf8");

function fixture(options = {}) {
  const action = options.action || deleting;
  const user = { id: ids.actor, email: "synthetic@example.invalid" };
  const rows = {
    company_members: [{ user_id: ids.actor, company_id: ids.company, role: "user", status: "active" }],
    companies: [{ id: ids.company, owner_user_id: options.nonOwner ? ids.other : ids.actor,
      status: "active", deletion_status: action === cancelling ? "pending_deletion" : "none" }],
    user_2fa_challenges: [{ id: ids.challenge, user_id: ids.actor, company_id: ids.company,
      purpose: action === cancelling ? "cancel_deletion" : "account_deletion", status: "pending",
      attempt_count: 0, max_attempts: 5, expires_at: new Date(Date.now() + 600000).toISOString(),
      ...options.challenge }],
    user_2fa_sessions: [], account_deletion_requests: [], security_events: []
  };
  const state = { operations: [], rpc: [], otp: 0 };
  const proof = { sub: ids.actor, session_id: ids.session, exp: Math.floor(Date.now() / 1000) + 3600, ...options.proof };
  const session = { access_token: `synthetic.${Buffer.from(JSON.stringify(proof)).toString("base64url")}.signature`,
    refresh_token: "synthetic-refresh", user, ...options.session };
  const client = {
    auth: { getUser: async () => ({ data: { user: options.invalidAuth ? null : user }, error: null }) },
    rpc: async (name, args) => {
      assert.equal(name, "apply_account_deletion_action");
      state.rpc.push(args);
      if (options.rpcThrow) throw new Error("Synthetic transport outage");
      if (options.rpcError || options.failWriteTable) return { data: null, error: { message: options.rpcError || "Synthetic write outage" } };
      const data = { persisted: true, action, company_id: ids.company, request_id: ids.request,
        ...(action === deleting ? { scheduled_for: new Date(Date.now() + 15 * 86400000).toISOString() } : { cancelled: true }) };
      return { data: options.rpcData === undefined ? data : options.rpcData, error: null };
    },
    from(table) {
      assert(rows[table], `Unexpected table ${table}`);
      let op = "select", changes, single = false;
      const filters = [];
      const query = {
        select() { return query; }, eq(k, v) { filters.push([k, v]); return query; },
        update(value) { op = "update"; changes = value; return query; },
        insert(value) { op = "insert"; changes = value; return query; },
        upsert(value) { op = "upsert"; changes = value; return query; },
        maybeSingle() { single = true; return query; }, single() { single = true; return query; },
        then(resolve, reject) {
          return Promise.resolve().then(() => {
            state.operations.push({ table, op });
            if (options.failWriteTable === table && op !== "select") return { data: null, error: { message: "Synthetic write outage" } };
            if (options.failQuery === table) return { data: null, error: { message: "Synthetic DB failure" } };
            let data = rows[table].filter((row) => filters.every(([k, v]) => row[k] === v));
            if (op === "update") data.forEach((row) => Object.assign(row, changes));
            if (["insert", "upsert"].includes(op)) { data = [{ id: ids.request, ...changes }]; rows[table].push(...data); }
            return { data: single ? data[0] || null : data, error: null };
          }).then(resolve, reject);
        }
      };
      return query;
    }
  };
  let handler;
  const sandbox = { Request, Response, URL, TextEncoder, Uint8Array, Error, console, atob,
    crypto: webcrypto, createClient: () => client, serve: (fn) => { handler = fn; },
    Deno: { env: { get: (key) => key === "SUPABASE_URL" ? "http://127.0.0.1:1" : "synthetic" } },
    fetch: async (url, init) => {
      assert.equal(url, "http://127.0.0.1:1/auth/v1/verify", "No actual network or provider access allowed");
      state.otp++;
      assert.equal(JSON.parse(init.body).email, user.email);
      return options.invalidOtp ? Response.json({}, { status: 400 }) : Response.json(session);
    }
  };
  vm.runInNewContext(stripTypeScriptTypes(source.replace(/^import[\s\S]*?from ["'][^"']+["'];\s*/gm, "")), sandbox);
  return { state, rows, async run() {
    const result = await handler(new Request("http://127.0.0.1:1/account-security", {
      method: "POST", headers: { Authorization: "Bearer synthetic-auth", "Content-Type": "application/json" },
      body: JSON.stringify({ action, challenge_id: ids.challenge, code: "123456", reason: "Synthetic request",
        company_id: ids.otherCompany, user_id: ids.other })
    }));
    return { status: result.status, body: await result.json() };
  } };
}

async function main() {
  let passed = 0;
  const failures = [];
  const test = async (name, run) => { try { await run(); passed++; } catch (error) { failures.push(`${name}: ${error.message}`); } };
  for (const action of [deleting, cancelling]) {
    await test(`${action}: trusted atomic result and no partial writes`, async () => {
      const f = fixture({ action }); const result = await f.run();
      assert.equal(result.status, 200); assert.equal(result.body.data.persisted, true);
      assert.equal(result.body.data.action, action);
      assert.equal(f.state.otp, 1); assert.equal(f.state.rpc.length, 1);
      assert.equal(f.state.rpc[0].p_actor_user_id, ids.actor);
      assert.equal(f.state.rpc[0].p_company_id, ids.company, "Browser-supplied tenant must be ignored");
      assert.equal(f.state.rpc[0].p_verified_session_id, ids.session);
      assert.equal(f.state.rpc[0].p_confirmation_email, "synthetic@example.invalid");
      assert.equal(f.state.operations.filter((op) => op.op !== "select").length, 0,
        "MFA, challenge, company, request and audit must be committed only by the RPC");
    });
    for (const options of [{ rpcError: "Synthetic constraint failure" }, { rpcData: null }, { rpcData: {} },
      { rpcData: { persisted: true, action, company_id: ids.otherCompany, request_id: ids.request } }]) {
      await test(`${action}: RPC failure/invalid result cannot report success`, async () => {
        const f = fixture({ action, ...options }); const result = await f.run();
        assert.equal(result.status, 503); assert.equal(result.body.ok, false);
        assert.equal(result.body.data, undefined);
        assert.equal(f.state.operations.filter((op) => op.op !== "select").length, 0);
      });
    }
    await test(`${action}: preserved database state conflict`, async () => {
      const f = fixture({ action, rpcError: "DELETION_STATE_CONFLICT" }); const result = await f.run();
      assert.equal(result.status, 409); assert.equal(result.body.error, "DELETION_STATE_CONFLICT");
    });
    for (const table of ["companies", "account_deletion_requests", "user_2fa_sessions", "security_events"]) {
      await test(`${action}: write failure ${table} cannot be ignored`, async () => {
        const f = fixture({ action, failWriteTable: table }); const result = await f.run();
        assert.equal(result.status, 503); assert.equal(result.body.ok, false);
        assert.equal(f.state.operations.filter((op) => op.op !== "select").length, 0);
      });
    }
    await test(`${action}: transport outage has no false success`, async () => {
      const f = fixture({ action, rpcThrow: true }); const result = await f.run();
      assert.equal(result.status, 503); assert.equal(result.body.error, "ACCOUNT_DELETION_UNAVAILABLE");
    });
  }
  for (const options of [{ invalidAuth: true }, { nonOwner: true }, { failQuery: "companies" },
    { failQuery: "company_members" }, { failQuery: "user_2fa_challenges" },
    { challenge: { user_id: ids.other } }, { challenge: { company_id: ids.otherCompany } },
    { challenge: { purpose: "enable_2fa" } }, { challenge: { purpose: "cancel_deletion" } },
    { challenge: { status: "verified" } }, { challenge: { attempt_count: 5 } },
    { challenge: { expires_at: "2020-01-01T00:00:00Z" } }]) {
    await test(`authorization/challenge fails before OTP ${JSON.stringify(options)}`, async () => {
      const f = fixture(options); const result = await f.run();
      assert.equal(result.body.ok, false); assert.notEqual(result.status, 200);
      assert.equal(f.state.otp, 0); assert.equal(f.state.rpc.length, 0);
    });
  }
  for (const options of [{ invalidOtp: true }, { proof: { sub: ids.other } },
    { proof: { session_id: "invalid" } }, { proof: { exp: 1 } },
    { session: { user: { id: ids.other } } }, { session: { refresh_token: "" } },
    { session: { refresh_token: 123 } }, { session: { access_token: 123 } }]) {
    await test(`invalid verified session cannot persist ${JSON.stringify(options)}`, async () => {
      const f = fixture(options); const result = await f.run();
      assert.equal(result.body.ok, false); assert.equal(f.state.rpc.length, 0);
      assert.equal(f.state.operations.filter((op) => ["companies", "account_deletion_requests", "user_2fa_sessions"].includes(op.table) && op.op !== "select").length, 0);
    });
  }
  assert.equal(failures.length, 0, failures.join("\n"));
  console.log(`PASS account deletion Edge: ${passed} scenarios; actual TypeScript with mocked I/O, no remote Auth/Edge/API.`);
}
main().catch((error) => { console.error(error.message); process.exitCode = 1; });
