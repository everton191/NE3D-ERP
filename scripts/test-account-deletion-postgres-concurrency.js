const assert = require("node:assert/strict");
const { spawn } = require("node:child_process");
const { randomUUID } = require("node:crypto");

// Explicit opt-in only. This script never creates/drops a database, changes its
// schema, loads a migration, contacts Auth, or uses a remote Supabase endpoint.
// Each actor uses an independent, real PostgreSQL connection through WSL psql.
// The caller must first create a disposable full-schema clone and apply the
// migration under test. SQL fixture users skip ONLY signup provisioning in a
// short transaction; all tested RPC/processor sessions use normal triggers/RLS.
const signature = "public.apply_account_deletion_action(uuid,uuid,uuid,text,uuid,text,text,text,text)";
const q = (value) => `'${String(value).replace(/'/g, "''")}'`;
const uuidList = (values) => values.length ? values.map(q).join(",") : "null";
const runId = randomUUID().replace(/-/g, "").slice(0, 16);
const ledger = { users: [], companies: [], members: [], challenges: [], sessions: [] };
const live = new Set();
// WSL/native CLI connection startup is included in the scenario wall clock.
// Bounds remain finite; a lock timeout is always a failure, never an accepted
// alternative to CODE_EXPIRED or any other semantic rejection below.
const limits = Object.freeze({ statement: 75_000, lock: 60_000, idle: 120_000,
  process: 150_000, marker: 90_000, poll: 30_000 });
let connectionNumber = 0;
let config;

function configuration(env = process.env) {
  const raw = env.S3D_LOCAL_DB_URL;
  assert(raw, "S3D_LOCAL_DB_URL obrigatoria; nenhum endpoint padrao sera usado.");
  let url;
  try { url = new URL(raw); } catch { throw new Error("S3D_LOCAL_DB_URL invalida (valor omitido)."); }
  assert(["postgres:", "postgresql:"].includes(url.protocol), "Somente PostgreSQL local.");
  assert(["127.0.0.1", "localhost", "[::1]"].includes(url.hostname), "Host deve ser loopback literal.");
  assert(!url.search && !url.hash, "Parametros e fragments de conexao nao sao aceitos.");
  const database = decodeURIComponent(url.pathname.slice(1));
  assert(/^s3d_deletion_[a-z0-9_]+$/.test(database), "Banco descartavel deve ter prefixo s3d_deletion_.");
  assert.equal(env.S3D_LOCAL_DISPOSABLE_DB, database, "Confirme o nome exato em S3D_LOCAL_DISPOSABLE_DB.");
  const psql = env.S3D_LOCAL_WSL_PSQL || "";
  assert(/^\/[A-Za-z0-9_./-]+\/bin\/psql$/.test(psql), "Informe caminho WSL absoluto terminando em /bin/psql.");
  const distro = env.S3D_LOCAL_WSL_DISTRO || "";
  const user = env.S3D_LOCAL_WSL_USER || "";
  assert(/^[A-Za-z0-9_.-]+$/.test(distro) && /^[A-Za-z0-9_.-]+$/.test(user), "Distro e usuario WSL explicitos obrigatorios.");
  assert(url.username && url.password && url.port, "Usuario, senha e porta locais devem ser explicitos (valores omitidos).");
  const pg = {
    PGHOST: url.hostname === "[::1]" ? "::1" : url.hostname,
    PGPORT: url.port, PGDATABASE: database,
    PGUSER: decodeURIComponent(url.username), PGPASSWORD: decodeURIComponent(url.password),
    PGCONNECT_TIMEOUT: "5", PGSSLMODE: "disable", PGPASSFILE: "/dev/null",
    PGSERVICEFILE: "/dev/null", PGOPTIONS: `-c statement_timeout=${limits.statement} -c lock_timeout=${limits.lock} -c idle_in_transaction_session_timeout=${limits.idle}`
  };
  // WSLENV propagates credentials through the child environment, NOT argv.
  // Do not print config, child.env, URL, spawn options, or inherited env.
  const baseEnv = Object.fromEntries(Object.entries(env).filter(([name]) => !name.startsWith("PG")));
  const inherited = (env.WSLENV || "").split(":").filter(Boolean)
    .filter((entry) => !entry.split("/")[0].startsWith("PG"));
  return { database, distro, user, psql, pg,
    env: { ...baseEnv, ...pg, WSLENV: [...inherited, ...Object.keys(pg)].join(":") } };
}

function redact(value) {
  let result = String(value || "");
  for (const secret of [process.env.S3D_LOCAL_DB_URL, config?.pg.PGPASSWORD])
    if (secret) result = result.split(secret).join("[REDACTED]");
  return result;
}

function start(label) {
  const app = `s3ddel_${runId}_${++connectionNumber}_${label}`.slice(0, 63);
  const child = spawn("wsl.exe", ["-d", config.distro, "-u", config.user, "--", config.psql,
    "-X", "-q", "-t", "-A", "-v", "ON_ERROR_STOP=1", "-f", "-"],
  { env: config.env, stdio: ["pipe", "pipe", "pipe"], windowsHide: true });
  const session = { app, child, out: "", err: "", ended: false, waiters: new Set() };
  live.add(session);
  child.stdout.setEncoding("utf8"); child.stderr.setEncoding("utf8");
  const wake = () => { for (const callback of session.waiters) callback(); };
  child.stdout.on("data", (chunk) => { session.out += chunk; wake(); });
  child.stderr.on("data", (chunk) => { session.err += chunk; });
  child.stdin.on("error", () => {}); // EPIPE is reported through the exit result.
  session.done = new Promise((resolve) => {
    const finish = (code, error) => {
      if (session.ended) return;
      session.ended = true; live.delete(session); clearTimeout(session.watchdog);
      resolve({ code, error: redact(error || session.err), out: session.out }); wake();
    };
    child.on("error", (error) => finish(-1, error.message));
    child.on("close", (code) => finish(code === null ? -1 : code));
  });
  session.watchdog = setTimeout(() => child.kill(), limits.process);
  session.send = (sql) => { assert(!session.ended, "Conexao encerrou antes do comando."); child.stdin.write(`${sql}\n`); };
  session.end = () => child.stdin.end();
  session.marker = async (marker) => {
    if (session.out.split(/\r?\n/).includes(marker)) return;
    await new Promise((resolve, reject) => {
      const timeout = setTimeout(() => { session.waiters.delete(check); reject(new Error(`Timeout de marcador ${label}.`)); }, limits.marker);
      const check = () => {
        if (session.out.split(/\r?\n/).includes(marker)) {
          clearTimeout(timeout); session.waiters.delete(check); resolve();
        } else if (session.ended) {
          clearTimeout(timeout); session.waiters.delete(check); reject(new Error(`psql encerrou: ${redact(session.err)}`));
        }
      };
      session.waiters.add(check); check();
    });
  };
  session.send(`set application_name=${q(app)}; set statement_timeout=${limits.statement}; set lock_timeout=${limits.lock}; set idle_in_transaction_session_timeout=${limits.idle};`);
  return session;
}

function jsonRows(output) {
  return output.split(/\r?\n/).filter((line) => /^\s*[\[{]/.test(line)).map((line) => JSON.parse(line));
}
async function query(sql, label = "observer") {
  const started = Date.now();
  const session = start(label); session.send(sql); session.end();
  const result = await session.done;
  assert.equal(result.code, 0, `psql ${label} (${Date.now() - started} ms): ${result.error}`);
  return jsonRows(result.out);
}
async function one(sql, label) {
  const rows = await query(sql, label);
  assert.equal(rows.length, 1, "Consulta deve retornar um unico JSON.");
  return rows[0];
}
async function marker(session, sql) {
  const name = `READY_${randomUUID().replace(/-/g, "")}`;
  session.send(`${sql}\n\\echo ${name}`);
  await session.marker(name);
}
async function finished(session, expected = null) {
  session.end(); const result = await session.done;
  if (expected) { assert.notEqual(result.code, 0, "Operacao deveria rejeitar."); assert.match(result.error, expected); }
  else assert.equal(result.code, 0, result.error);
  return result;
}
async function until(check, description, timeoutMs = limits.poll) {
  const deadline = Date.now() + timeoutMs;
  do {
    if (await check()) return;
    // Only bounded polling; ordering is established by observed DB state/locks,
    // never by assuming an arbitrary sleep gives the other actor enough time.
    await new Promise((resolve) => setTimeout(resolve, 30));
  } while (Date.now() < deadline);
  throw new Error(`Timeout aguardando ${description}.`);
}
async function blockedBy(waiter, blocker) {
  await until(async () => {
    const state = await one(`select json_build_object('blocked',exists(
      select 1 from pg_stat_activity a join pg_stat_activity b on b.application_name=${q(blocker.app)}
      where a.application_name=${q(waiter.app)} and a.datname=current_database()
      and b.datname=current_database() and a.wait_event_type='Lock'
      and b.pid=any(pg_blocking_pids(a.pid))))`);
    if (waiter.ended) throw new Error(`Conexao terminou antes de bloquear: ${redact(waiter.err)}`);
    return state.blocked;
  }, "row-lock entre as conexoes independentes");
}

function rpc(item, challenge, action = "confirm_account_deletion") {
  const sessionId = randomUUID(); ledger.sessions.push(sessionId);
  return `set role service_role;
    select public.apply_account_deletion_action(${q(item.actor)}::uuid,${q(item.id)}::uuid,
      ${q(challenge)}::uuid,${q(action)},${q(sessionId)}::uuid,
      'synthetic-ip','synthetic-agent','Concorrencia local isolada',${q(item.email)}) as result;
    reset role;`;
}
async function call(item, challenge, action, expected) {
  const session = start("rpc"); session.send(rpc(item, challenge, action));
  return finished(session, expected);
}
async function fixture(actor) {
  const item = { id: randomUUID(), actor, member: randomUUID(), email: `${actor}@example.invalid` };
  ledger.companies.push(item.id); ledger.members.push(item.member);
  await query(`begin;
    insert into public.companies(id,owner_user_id,name) values(${q(item.id)},${q(actor)},${q(`Concurrency ${runId}`)});
    insert into public.company_members(id,company_id,user_id,role,status)
      values(${q(item.member)},${q(item.id)},${q(actor)},'user','active');
    commit;`);
  return item;
}
async function challenge(item, purpose = "account_deletion") {
  const id = randomUUID(); ledger.challenges.push(id);
  await query(`insert into public.user_2fa_challenges(id,user_id,company_id,purpose,expires_at,resend_available_at)
    values(${q(id)},${q(item.actor)},${q(item.id)},${q(purpose)},clock_timestamp()+interval '10 minutes',clock_timestamp());`);
  return id;
}
function snapshotSql(item) {
  return `select jsonb_build_object(
    'company',(select to_jsonb(c) from public.companies c where c.id=${q(item.id)}),
    'requests',(select coalesce(jsonb_agg(to_jsonb(t) order by t.id),'[]'::jsonb) from public.account_deletion_requests t where company_id=${q(item.id)}),
    'challenges',(select coalesce(jsonb_agg(to_jsonb(t) order by t.id),'[]'::jsonb) from public.user_2fa_challenges t where company_id=${q(item.id)}),
    'sessions',(select coalesce(jsonb_agg(to_jsonb(t) order by t.id),'[]'::jsonb) from public.user_2fa_sessions t where company_id=${q(item.id)}),
    'events',(select coalesce(jsonb_agg(to_jsonb(t) order by t.id),'[]'::jsonb) from public.security_events t where company_id=${q(item.id)}),
    'members',(select coalesce(jsonb_agg(to_jsonb(t) order by t.id),'[]'::jsonb) from public.company_members t where company_id=${q(item.id)}))`;
}
async function snapshot(item) { return one(snapshotSql(item)); }
function events(state, type) { return state.events.filter((entry) => entry.event_type === type && entry.status === "success"); }
async function replayUnchanged(item, id, action, pattern) {
  const before = await snapshot(item);
  await call(item, id, action, pattern);
  assert.deepEqual(await snapshot(item), before, "Replay nao pode alterar datas, desafio, sessao ou auditoria.");
}
async function race(item, winnerChallenge, loserChallenge, action, rejection) {
  const first = start("winner");
  await marker(first, `begin; ${rpc(item, winnerChallenge, action)}`);
  const second = start("loser"); second.send(rpc(item, loserChallenge, action));
  await blockedBy(second, first);
  await marker(first, "commit;");
  await finished(first);
  await finished(second, rejection);
}
async function companyLock(item, mutation = "") {
  const session = start("company_lock");
  await marker(session, `begin; select id from public.companies where id=${q(item.id)} for update; ${mutation}`);
  return session;
}
async function due(item) {
  await query(`begin;
    update public.companies set deletion_requested_at=clock_timestamp()-interval '16 days',
      deletion_scheduled_at=clock_timestamp()-interval '1 day' where id=${q(item.id)};
    update public.account_deletion_requests r set requested_at=c.deletion_requested_at,
      confirmed_at=c.deletion_requested_at,scheduled_delete_at=c.deletion_scheduled_at
      from public.companies c where c.id=${q(item.id)} and r.company_id=c.id and r.status='confirmed';
    commit;`);
}
async function processorSafe(item) {
  const state = await one(`select json_build_object('foreign_pending',count(*) filter(where id not in (${uuidList(ledger.companies)})),
    'other_due',count(*) filter(where id<>${q(item.id)} and deletion_scheduled_at<=clock_timestamp()))
    from public.companies where deletion_status='pending_deletion'`);
  assert.equal(state.foreign_pending, 0, "Processador recusado: empresa nao pertencente ao ledger pendente.");
  assert.equal(state.other_due, 0, "Processador recusado: outra empresa vencida.");
}
const processorSql = "set role service_role; select json_build_object('processed',public.process_due_account_deletions()); reset role;";

async function fingerprintOld() {
  // NOT IN (NULL) is UNKNOWN, not TRUE. Before fixtures exist the complete
  // original companies table must be hashed, not silently treated as empty.
  const originalCompanies = ledger.companies.length
    ? `id not in (${uuidList(ledger.companies)})` : "true";
  return one(`select jsonb_build_object(
    'companies',(select md5(coalesce(string_agg(to_jsonb(t)::text,'' order by id),'')) from public.companies t where ${originalCompanies}),
    'clients',(select md5(coalesce(string_agg(to_jsonb(t)::text,'' order by id),'')) from public.clients t),
    'subscriptions',(select md5(coalesce(string_agg(to_jsonb(t)::text,'' order by id),'')) from public.subscriptions t))`);
}
async function schemaFingerprint() {
  return one(`select jsonb_build_object(
    'tables',(select jsonb_agg(jsonb_build_object('name',c.oid::regclass::text,'rls',c.relrowsecurity,'force_rls',c.relforcerowsecurity,'acl',c.relacl) order by c.oid)
      from pg_class c where c.oid in ('public.companies'::regclass,'public.company_members'::regclass,'public.account_deletion_requests'::regclass,
      'public.user_2fa_challenges'::regclass,'public.user_2fa_sessions'::regclass,'public.security_events'::regclass)),
    'functions',(select jsonb_agg(jsonb_build_object('oid',p.oid::text,'def',pg_get_functiondef(p.oid),'acl',p.proacl) order by p.oid)
      from pg_proc p where p.oid in (${q(signature)}::regprocedure,'public.process_due_account_deletions()'::regprocedure,'private.guard_company_deletion_fields()'::regprocedure)),
    'triggers',(select jsonb_agg(jsonb_build_object('def',pg_get_triggerdef(t.oid),'enabled',t.tgenabled) order by t.oid)
      from pg_trigger t where not t.tgisinternal and t.tgrelid in ('auth.users'::regclass,'public.companies'::regclass,'public.account_deletion_requests'::regclass)),
    'policies',(select coalesce(jsonb_agg(to_jsonb(p) order by p.schemaname,p.tablename,p.policyname),'[]'::jsonb) from pg_policies p where p.schemaname in ('public','auth')))`);
}

async function cleanup() {
  // No broad TRUNCATE, CASCADE, guessed ranges, or deletion by name/prefix.
  // Every target was generated in this process before any write was attempted.
  await query(`begin;
    delete from public.security_events where company_id in (${uuidList(ledger.companies)}) and user_id in (${uuidList(ledger.users)});
    delete from public.user_2fa_sessions where company_id in (${uuidList(ledger.companies)}) and user_id in (${uuidList(ledger.users)});
    delete from public.user_2fa_challenges where id in (${uuidList(ledger.challenges)}) and user_id in (${uuidList(ledger.users)});
    delete from public.account_deletion_requests where company_id in (${uuidList(ledger.companies)}) and owner_id in (${uuidList(ledger.users)});
    delete from public.company_members where id in (${uuidList(ledger.members)}) and user_id in (${uuidList(ledger.users)});
    delete from public.companies where id in (${uuidList(ledger.companies)}) and owner_user_id in (${uuidList(ledger.users)});
    delete from auth.users where id in (${uuidList(ledger.users)}) and email like '%@example.invalid';
    commit;`, "own_ledger_cleanup");
  const left = await one(`select json_build_object('companies',(select count(*) from public.companies where id in (${uuidList(ledger.companies)})),
    'users',(select count(*) from auth.users where id in (${uuidList(ledger.users)})),
    'challenges',(select count(*) from public.user_2fa_challenges where id in (${uuidList(ledger.challenges)})))`);
  assert.deepEqual(left, { companies: 0, users: 0, challenges: 0 }, "Limpeza deve remover somente o ledger proprio completo.");
}
async function settleLive() {
  for (const session of [...live]) {
    if (!session.ended) {
      try { session.send("rollback;"); session.end(); } catch { session.child.kill(); }
    }
  }
  await Promise.all([...live].map((session) => session.done));
}

async function main() {
  config = configuration();
  const preflight = await one(`select json_build_object('database',current_database(),'loopback',inet_server_addr() in ('127.0.0.1'::inet,'::1'::inet),
    'unix_socket',inet_server_addr() is null,'data_directory',current_setting('data_directory'),
    'superuser',(select rolsuper from pg_roles where rolname=current_user),
    'replication_role',current_setting('session_replication_role'),
    'foreign_pending',(select count(*) from public.companies where deletion_status='pending_deletion'),
    'rpc',to_regprocedure(${q(signature)}) is not null,
    'processor',to_regprocedure('public.process_due_account_deletions()') is not null,
    'guard',exists(select 1 from pg_trigger where tgrelid='public.companies'::regclass and tgname='guard_company_deletion_fields' and tgenabled='O'))`);
  assert.equal(preflight.database, config.database);
  // Native CLI forwards its loopback SQL listener to a Unix-only PostgreSQL.
  // In that case demand the caller's exact, explicit local cluster directory.
  const nativeDirectory = process.env.S3D_LOCAL_NATIVE_DATA_DIR;
  const verifiedNative = preflight.unix_socket === true && typeof nativeDirectory === "string"
    && /^\/home\/[A-Za-z0-9_./-]+\/data$/.test(nativeDirectory)
    && preflight.data_directory === nativeDirectory;
  assert(preflight.loopback === true || verifiedNative,
    "Servidor deve confirmar loopback ou diretorio nativo local explicitamente autorizado.");
  assert.equal(preflight.superuser, true, "Fixtures isoladas exigem usuario SQL local explicito com controle do banco descartavel.");
  assert.equal(preflight.replication_role, "origin");
  assert.equal(preflight.foreign_pending, 0, "Recusado: banco tem empresa pendente anterior ao teste.");
  assert(preflight.rpc && preflight.processor && preflight.guard, "Aplique antes a migration real no clone completo.");
  const oldRows = await fingerprintOld();
  const oldSchema = await schemaFingerprint();
  assert(oldSchema.tables.length === 6 && oldSchema.tables.every((table) => table.rls), "RLS das seis tabelas monitoradas deve permanecer habilitado.");
  const actor = randomUUID(), otherActor = randomUUID(); ledger.users.push(actor, otherActor);
  let passed = 0;
  let primaryError;
  let groupName = "fixtures";
  let groupStart = Date.now();
  const beginGroup = (name) => {
    groupName = name; groupStart = Date.now();
    console.log(`[concurrency] ${passed + 1}/9 START ${name}`);
  };
  const completeGroup = () => {
    passed++;
    console.log(`[concurrency] ${passed}/9 PASS ${groupName} (${Date.now() - groupStart} ms)`);
  };
  try {
    await query(`begin; set local session_replication_role=replica;
      insert into auth.users(id,instance_id,aud,role,email,encrypted_password,email_confirmed_at,raw_app_meta_data,raw_user_meta_data,created_at,updated_at)
      values ${ledger.users.map((id) => `(${q(id)},'00000000-0000-0000-0000-000000000000','authenticated','authenticated',${q(`${id}@example.invalid`)},'',now(),'{}','{}',now(),now())`).join(",")};
      set local session_replication_role=origin; commit;`);

    // Same challenge, simultaneous independent connections: exactly one wins.
    beginGroup("same challenge");
    const same = await fixture(actor); const sameCode = await challenge(same);
    await race(same, sameCode, sameCode, "confirm_account_deletion", /CHALLENGE_ALREADY_USED|PENDING_DELETION/);
    let state = await snapshot(same);
    assert.equal(state.company.deletion_status, "pending_deletion"); assert.equal(state.requests.length, 1);
    assert.equal(state.challenges.filter((row) => row.status === "verified").length, 1);
    assert.equal(state.sessions.length, 1); assert.equal(events(state, "account_deletion_requested").length, 1);
    assert.equal(state.requests[0].scheduled_delete_at, state.company.deletion_scheduled_at);
    await replayUnchanged(same, sameCode, "confirm_account_deletion", /CHALLENGE_ALREADY_USED|PENDING_DELETION/); completeGroup();

    // Different valid challenges on the same company cannot create two requests.
    beginGroup("two challenges on one company");
    const two = await fixture(actor); const twoA = await challenge(two), twoB = await challenge(two);
    await race(two, twoA, twoB, "confirm_account_deletion", /PENDING_DELETION/);
    state = await snapshot(two);
    assert.equal(state.requests.length, 1); assert.equal(state.sessions.length, 1);
    assert.equal(events(state, "account_deletion_requested").length, 1);
    assert.equal(state.challenges.find((row) => row.id === twoB).status, "pending");
    await replayUnchanged(two, twoB, "confirm_account_deletion", /PENDING_DELETION/); completeGroup();

    beginGroup("two cancellations");
    const cancel = await fixture(actor); await call(cancel, await challenge(cancel));
    const cancelA = await challenge(cancel, "cancel_deletion"), cancelB = await challenge(cancel, "cancel_deletion");
    await race(cancel, cancelA, cancelB, "confirm_cancel_deletion", /DELETION_NOT_PENDING/);
    state = await snapshot(cancel);
    assert.equal(state.company.deletion_status, "cancelled"); assert.equal(state.company.deletion_scheduled_at, null);
    assert.equal(state.requests[0].status, "cancelled"); assert.equal(events(state, "account_deletion_cancelled").length, 1);
    await replayUnchanged(cancel, cancelB, "confirm_cancel_deletion", /DELETION_NOT_PENDING/); completeGroup();

    // Expiry occurs while blocked on the company, not before the call starts.
    beginGroup("expiry while blocked");
    const expiring = await fixture(actor); const expiringCode = await challenge(expiring);
    const expiryLock = await companyLock(expiring);
    const expiryWaitStart = Date.now();
    const expiryProgress = (stage) => console.log(`[concurrency] expiry ${stage} (${Date.now() - expiryWaitStart} ms after lock acquired)`);
    const expiryCall = start("expiry"); expiryCall.send(rpc(expiring, expiringCode));
    await blockedBy(expiryCall, expiryLock);
    expiryProgress("waiter observed blocked");
    // One observer process both changes the synthetic expiry and captures the
    // expected unchanged state, saving a WSL startup while the lock is held.
    const beforeExpired = await one(`update public.user_2fa_challenges set expires_at=clock_timestamp()+interval '1 second' where id=${q(expiringCode)};
      ${snapshotSql(expiring)}`, "expiry_setup_and_snapshot");
    expiryProgress("expiry and baseline recorded");
    await until(async () => (await one(`select json_build_object('expired',clock_timestamp()>=expires_at) from public.user_2fa_challenges where id=${q(expiringCode)}`)).expired,
      "vencimento observado no relogio PostgreSQL");
    expiryProgress("database clock confirms expired");
    await marker(expiryLock, "rollback;"); await finished(expiryLock); await finished(expiryCall, /CODE_EXPIRED/);
    expiryProgress("released and CODE_EXPIRED verified");
    assert.deepEqual(await snapshot(expiring), beforeExpired); completeGroup();

    for (const [name, change, rejection] of [
      ["owner", `owner_user_id=${q(otherActor)}`, /OWNER_REQUIRED/],
      ["inactive", "status='inactive'", /COMPANY_INACTIVE/]
    ]) {
      beginGroup(`${name} changed while blocked`);
      const changed = await fixture(actor); const code = await challenge(changed);
      const lock = await companyLock(changed, `update public.companies set ${change} where id=${q(changed.id)};`);
      const request = start(name); request.send(rpc(changed, code)); await blockedBy(request, lock);
      await marker(lock, "commit;"); await finished(lock); await finished(request, rejection);
      state = await snapshot(changed); assert.equal(state.requests.length, 0); assert.equal(state.events.length, 0);
      assert.equal(state.sessions.length, 0); assert.equal(state.challenges[0].status, "pending");
      await replayUnchanged(changed, code, "confirm_account_deletion", rejection); completeGroup();
    }

    // Holding company A must not block a different owner's company B.
    beginGroup("independent companies");
    const a = await fixture(actor), b = await fixture(otherActor);
    const aCode = await challenge(a), bCode = await challenge(b);
    const aLock = await companyLock(a); const aCall = start("independent_a"); aCall.send(rpc(a, aCode));
    await blockedBy(aCall, aLock);
    await call(b, bCode); // Must finish BEFORE releasing A, otherwise timeout/fail.
    assert.equal((await snapshot(b)).company.deletion_status, "pending_deletion");
    assert.equal((await snapshot(a)).company.deletion_status, "none");
    await blockedBy(aCall, aLock); await marker(aLock, "rollback;"); await finished(aLock); await finished(aCall);
    assert.equal(events(await snapshot(a), "account_deletion_requested").length, 1); completeGroup();

    // Cancellation wins the company lock. Existing processor SKIP LOCKED must
    // return 0 and must never resurrect the cancellation after it commits.
    beginGroup("cancellation before processor");
    const cancelFirst = await fixture(actor); await call(cancelFirst, await challenge(cancelFirst)); await due(cancelFirst);
    const cfCode = await challenge(cancelFirst, "cancel_deletion"); await processorSafe(cancelFirst);
    const cfLock = start("cancel_first"); await marker(cfLock, `begin; ${rpc(cancelFirst, cfCode, "confirm_cancel_deletion")}`);
    assert.equal((await one(processorSql, "processor_skip_locked")).processed, 0);
    await marker(cfLock, "commit;"); await finished(cfLock);
    await processorSafe(cancelFirst); assert.equal((await one(processorSql, "processor_after_cancel")).processed, 0);
    state = await snapshot(cancelFirst); assert.equal(state.company.deletion_status, "cancelled");
    assert.equal(state.requests[0].status, "cancelled"); assert.equal(state.members[0].status, "active");
    assert.equal(events(state, "account_deletion_cancelled").length, 1); assert.equal(events(state, "account_deletion_completed").length, 0); completeGroup();

    // Processor wins first; blocked cancellation must re-read completed state.
    beginGroup("processor before cancellation");
    const processFirst = await fixture(actor); await call(processFirst, await challenge(processFirst)); await due(processFirst);
    const pfCode = await challenge(processFirst, "cancel_deletion"); await processorSafe(processFirst);
    const pfLock = start("processor_first"); await marker(pfLock, `begin; ${processorSql}`);
    assert.equal(jsonRows(pfLock.out).at(-1).processed, 1);
    const pfCancel = start("cancel_waiting_processor"); pfCancel.send(rpc(processFirst, pfCode, "confirm_cancel_deletion"));
    await blockedBy(pfCancel, pfLock); await marker(pfLock, "commit;"); await finished(pfLock);
    await finished(pfCancel, /DELETION_COMPLETED/);
    state = await snapshot(processFirst);
    assert.equal(state.company.deletion_status, "completed"); assert.equal(state.company.status, "inactive");
    assert.equal(state.company.deleted_by_system, true); assert(state.company.deleted_at);
    assert.equal(state.requests[0].status, "completed"); assert.equal(state.members[0].status, "blocked");
    assert.equal(events(state, "account_deletion_completed").length, 1); assert.equal(events(state, "account_deletion_cancelled").length, 0);
    await replayUnchanged(processFirst, pfCode, "confirm_cancel_deletion", /DELETION_COMPLETED/); completeGroup();

    assert.deepEqual(await fingerprintOld(), oldRows, "Empresas, clientes e assinaturas anteriores devem permanecer identicos.");
    assert.deepEqual(await schemaFingerprint(), oldSchema, "Objetos monitorados de funcoes, gatilhos, grants e RLS devem permanecer intactos.");
  } catch (error) {
    primaryError = new Error(`Grupo ${groupName} falhou apos ${Date.now() - groupStart} ms.`, { cause: error });
  } finally {
    // Cleanup/verification must never hide the failure which caused this path.
    // Run read-only post-checks even if cleanup fails, reporting each stage.
    const failures = primaryError ? [new Error("Cenario principal falhou.", { cause: primaryError })] : [];
    for (const [description, check] of [
      ["Encerramento das conexoes de teste falhou.", () => settleLive()],
      ["Limpeza dos IDs sinteticos proprios falhou.", () => cleanup()],
      ["Dados anteriores divergiram depois da limpeza.", async () => assert.deepEqual(await fingerprintOld(), oldRows, "Limpeza nao pode alterar dados anteriores.")],
      ["Esquema/permissoes divergiram depois da limpeza.", async () => assert.deepEqual(await schemaFingerprint(), oldSchema, "Limpeza nao pode alterar esquema/permissoes.")]
    ]) {
      try { await check(); }
      catch (error) { failures.push(new Error(description, { cause: error })); }
    }
    if (failures.length) throw new AggregateError(failures,
      `Execucao ${runId}: ${passed} grupos concluidos; falhas preservadas em ordem (cenario, limpeza, verificacao).`);
  }
  console.log(`Account deletion real local PostgreSQL concurrency: ${passed} scenario groups PASS; independent connections, observed row locks, replay, expiry after wait, owner/status changes, company isolation and both processor/cancel orderings. Own-ledger fixtures removed; previous companies/clients/subscriptions and monitored RLS/schema objects unchanged. No Auth OTP/API, remote staging, permanent purge, production, APK or AAB validation.`);
}

function describeFailure(error) {
  const nested = error instanceof AggregateError ? error.errors : error?.cause ? [error.cause] : [];
  return `${error?.name || "Error"}: ${error?.message || error}${nested.length
    ? `\n${nested.map((cause, index) => `  [${index + 1}] ${describeFailure(cause).replace(/\n/g, "\n  ")}`).join("\n")}` : ""}`;
}

if (require.main === module) {
  main().catch(async (error) => {
    await settleLive();
    console.error(`Account deletion concurrency FAIL: ${redact(describeFailure(error))}`);
    process.exitCode = 1;
  });
}

module.exports = { configuration, main };
