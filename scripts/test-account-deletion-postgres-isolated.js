const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { randomUUID } = require("node:crypto");
const { PGlite } = require("@electric-sql/pglite");

// This harness has no URL, credentials or network client: PostgreSQL runs only
// in memory. It verifies real migration SQL, not hosted Auth, API or row-lock
// concurrency between independent PostgreSQL connections.
const root = path.resolve(__dirname, "..");
const readMigration = (name) => fs.readFileSync(path.join(root, "supabase", "migrations", name), "utf8").replace(/\r\n/g, "\n");
const migrationName = "20261018173758_atomic_account_deletion_confirmation.sql";
const signature = "public.apply_account_deletion_action(uuid,uuid,uuid,text,uuid,text,text,text,text)";
const ids = {
  ownerA: "00000000-0000-4000-8000-000000000001",
  ownerB: "00000000-0000-4000-8000-000000000002",
  member: "00000000-0000-4000-8000-000000000003",
  companyA: "10000000-0000-4000-8000-000000000001",
  companyB: "10000000-0000-4000-8000-000000000002"
};

function definition(sql, start, end = ";") {
  const begin = sql.indexOf(start);
  assert(begin >= 0, `Definicao real ausente: ${start}`);
  const finish = sql.indexOf(end, begin);
  assert(finish > begin, `Fim da definicao real ausente: ${start}`);
  return sql.slice(begin, finish + end.length);
}

async function asRole(db, role, sql, params = [], userId = ids.ownerA) {
  assert(["service_role", "authenticated", "anon"].includes(role));
  await db.query("select set_config('request.jwt.claim.sub', $1, false)", [userId]);
  await db.exec(`set role ${role}`);
  try { return await db.query(sql, params); }
  finally { await db.exec("reset role"); }
}

async function rejectsSql(promise, pattern) {
  await assert.rejects(promise, (error) => pattern.test(String(error.message)), `Esperado erro ${pattern}`);
}

async function main() {
  const db = new PGlite();
  await db.waitReady;
  let passed = 0;
  try {
    const foundation = readMigration("20260630103000_account_security_inventory_foundation_disabled.sql");
    const activation = readMigration("20260630143000_account_security_email_2fa_and_deletion.sql");
    const companies = readMigration("20260504111204_account_companies_members_sync.sql");
    await db.exec(`
      create role anon; create role authenticated; create role service_role bypassrls;
      create schema auth;
      create table auth.users (id uuid primary key, email text not null);
      create function auth.uid() returns uuid language sql stable as
        $$select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid$$;
      grant usage on schema public, auth to anon, authenticated, service_role;
      grant select on auth.users to service_role;
    `);
    await db.exec(definition(companies, "create table if not exists public.companies (", "\n);"));
    for (const table of ["account_security_settings", "account_deletion_requests"])
      await db.exec(definition(foundation, `create table if not exists public.${table} (`, "\n);"));
    for (const table of ["user_2fa_challenges", "user_2fa_sessions", "security_events"])
      await db.exec(definition(activation, `create table if not exists public.${table} (`, "\n);"));
    await db.exec(definition(activation, "alter table public.account_deletion_requests\n"));
    await db.exec(definition(activation, "alter table public.companies\n"));
    await db.exec(definition(activation, "alter table public.companies\n  add constraint companies_deletion_status_check"));
    await db.exec(`
      alter table public.companies enable row level security;
      create policy fixture_owner_select on public.companies for select to authenticated
        using (owner_user_id=auth.uid());
      create policy fixture_owner_update on public.companies for update to authenticated
        using (owner_user_id=auth.uid()) with check (owner_user_id=auth.uid());
      create policy fixture_owner_insert on public.companies for insert to authenticated
        with check (owner_user_id=auth.uid());
      grant select, insert, update on public.companies to authenticated, service_role;
    `);
    for (const table of ["account_security_settings", "account_deletion_requests", "user_2fa_challenges", "user_2fa_sessions", "security_events"]) {
      await db.exec(`alter table public.${table} enable row level security;
        revoke all on public.${table} from public, anon, authenticated;
        grant select, insert, update, delete on public.${table} to service_role;`);
    }
    assert.equal((await db.query("select to_regprocedure($1) is null as absent", [signature])).rows[0].absent, true);
    await db.exec(readMigration(migrationName));
    assert.equal((await db.query("select to_regprocedure($1) is not null as found", [signature])).rows[0].found,
      true, "Migration deve criar a RPC real; arquivo vazio nao e homologacao");

    const fn = (await db.query(`select prosecdef, proconfig from pg_proc where oid=$1::regprocedure`, [signature])).rows[0];
    assert.equal(fn.prosecdef, false, "RPC service-only nao precisa SECURITY DEFINER");
    assert(fn.proconfig?.some((value) => value === "search_path=pg_catalog"), "search_path deve fixar pg_catalog");
    for (const role of ["anon", "authenticated", "service_role"]) {
      assert.equal((await db.query("select has_function_privilege($1,$2,'execute') as allowed", [role, signature])).rows[0].allowed,
        role === "service_role", `EXECUTE incorreto para ${role}`);
    }
    passed++;

    await db.query("insert into auth.users(id,email) values($1,'owner-a@example.invalid'),($2,'owner-b@example.invalid'),($3,'member@example.invalid')",
      [ids.ownerA, ids.ownerB, ids.member]);
    const reset = async () => {
      await db.exec("truncate public.companies, public.account_security_settings, public.account_deletion_requests, public.user_2fa_challenges, public.user_2fa_sessions, public.security_events cascade");
      await db.query("insert into public.companies(id,owner_user_id,name) values($1,$2,'Homologacao A'),($3,$4,'Homologacao B')",
        [ids.companyA, ids.ownerA, ids.companyB, ids.ownerB]);
    };
    const challenge = async (overrides = {}) => {
      const item = {
        id: randomUUID(), user: ids.ownerA, company: ids.companyA,
        purpose: "account_deletion", status: "pending", attempts: 0,
        expires: new Date(Date.now() + 600_000).toISOString(), ...overrides
      };
      await db.query(`insert into public.user_2fa_challenges(id,user_id,company_id,purpose,status,attempt_count,expires_at,resend_available_at)
        values($1,$2,$3,$4,$5,$6,$7::timestamptz,now())`,
        [item.id, item.user, item.company, item.purpose, item.status, item.attempts, item.expires]);
      return item.id;
    };
    const call = async ({ actor = ids.ownerA, company = ids.companyA, challengeId,
      action = "confirm_account_deletion", session = randomUUID(), role = "service_role" } = {}) => {
      const result = await asRole(db, role, `select public.apply_account_deletion_action(
        $1::uuid,$2::uuid,$3::uuid,$4::text,$5::uuid,$6::text,$7::text,$8::text,$9::text) as result`,
      [actor, company, challengeId, action, session, "synthetic-ip-hash", "synthetic-agent-hash", "Homologacao isolada", "owner-a@example.invalid"], actor);
      return result.rows[0].result;
    };
    const snapshot = async () => {
      const result = {};
      for (const table of ["companies", "account_deletion_requests", "user_2fa_challenges", "user_2fa_sessions", "security_events"])
        result[table] = (await db.query(`select to_jsonb(t) as row from public.${table} t order by id`)).rows.map((item) => item.row);
      return result;
    };
    const companyB = async () => (await db.query("select to_jsonb(c) as row from public.companies c where id=$1", [ids.companyB])).rows[0].row;
    const assertRejectedUnchanged = async (options, pattern) => {
      const before = await snapshot();
      await rejectsSql(call(options), pattern);
      assert.deepEqual(await snapshot(), before, "Falha nao pode persistir alteracoes parciais");
      passed++;
    };

    await reset();
    const protectedB = await companyB();
    const confirmedChallenge = await challenge();
    const verifiedSession = randomUUID();
    const confirmed = await call({ challengeId: confirmedChallenge, session: verifiedSession });
    assert.equal(confirmed.persisted, true);
    assert.equal(confirmed.action, "confirm_account_deletion");
    assert.equal(confirmed.company_id, ids.companyA);
    assert(confirmed.request_id);
    assert(Date.parse(confirmed.scheduled_for) > Date.now() + 14.99 * 86_400_000);
    const company = (await db.query("select * from public.companies where id=$1", [ids.companyA])).rows[0];
    const request = (await db.query("select * from public.account_deletion_requests where id=$1", [confirmed.request_id])).rows[0];
    assert.equal(company.deletion_status, "pending_deletion");
    assert.equal(company.status, "active", "Agendamento nao inativa a empresa");
    assert.equal(request.status, "confirmed");
    assert.equal(request.company_id, ids.companyA);
    assert.equal(request.owner_id, ids.ownerA);
    assert.equal(request.requested_by, ids.ownerA);
    assert.equal(request.confirmation_email, "owner-a@example.invalid");
    assert.equal(request.scheduled_delete_at.toISOString(), company.deletion_scheduled_at.toISOString());
    assert.equal(request.scheduled_delete_at.toISOString(), new Date(confirmed.scheduled_for).toISOString());
    const consumed = (await db.query("select status,used_at from public.user_2fa_challenges where id=$1", [confirmedChallenge])).rows[0];
    assert.equal(consumed.status, "verified");
    assert(consumed.used_at);
    const persistedSession = (await db.query("select * from public.user_2fa_sessions where user_id=$1 and auth_session_id=$2", [ids.ownerA, verifiedSession])).rows[0];
    assert(persistedSession && persistedSession.expires_at > new Date());
    assert.equal(persistedSession.company_id, ids.companyA);
    assert.equal((await db.query("select count(*)::int as n from public.security_events where company_id=$1 and status='success'", [ids.companyA])).rows[0].n, 1);
    assert.deepEqual(await companyB(), protectedB, "Empresa B nao pode mudar");
    passed++;

    await assertRejectedUnchanged({ challengeId: confirmedChallenge, session: verifiedSession }, /CHALLENGE_ALREADY_USED|PENDING_DELETION/);
    await assertRejectedUnchanged({ challengeId: await challenge() }, /PENDING_DELETION|ALREADY_PENDING/);
    const cancelledChallenge = await challenge({ purpose: "cancel_deletion" });
    const cancelled = await call({ challengeId: cancelledChallenge, action: "confirm_cancel_deletion" });
    assert.equal(cancelled.persisted, true);
    assert.equal(cancelled.cancelled, true);
    assert.equal(cancelled.action, "confirm_cancel_deletion");
    assert.equal(cancelled.company_id, ids.companyA);
    assert.equal(cancelled.request_id, confirmed.request_id);
    const cancelledCompany = (await db.query("select * from public.companies where id=$1", [ids.companyA])).rows[0];
    assert.equal(cancelledCompany.deletion_status, "cancelled");
    assert.equal(cancelledCompany.deletion_scheduled_at, null);
    assert(cancelledCompany.deletion_cancelled_at);
    assert.equal((await db.query("select status from public.account_deletion_requests where id=$1", [confirmed.request_id])).rows[0].status, "cancelled");
    assert.equal((await db.query("select count(*)::int as n from public.security_events where company_id=$1 and status='success'", [ids.companyA])).rows[0].n, 2);
    assert.deepEqual(await companyB(), protectedB);
    passed++;
    await assertRejectedUnchanged({ challengeId: cancelledChallenge, action: "confirm_cancel_deletion" }, /CHALLENGE_ALREADY_USED|NOT_PENDING|NO_PENDING/);
    const regranted = await call({ challengeId: await challenge() });
    assert.notEqual(regranted.request_id, confirmed.request_id, "Novo pedido apos cancelamento preserva historico");
    passed++;

    await reset();
    for (const role of ["anon", "authenticated"])
      await assertRejectedUnchanged({ challengeId: await challenge(), role }, /permission denied/i);
    await assertRejectedUnchanged({ challengeId: await challenge(), actor: ids.member }, /OWNER_REQUIRED|NOT_OWNER/);
    await assertRejectedUnchanged({ challengeId: await challenge(), company: ids.companyB }, /OWNER_REQUIRED|NOT_OWNER/);
    await assertRejectedUnchanged({ challengeId: await challenge(), company: randomUUID() }, /COMPANY_NOT_FOUND/);
    await assertRejectedUnchanged({ challengeId: randomUUID() }, /CHALLENGE_NOT_FOUND/);
    await assertRejectedUnchanged({ challengeId: await challenge({ user: ids.ownerB }) }, /CHALLENGE_NOT_FOUND|INVALID_CHALLENGE/);
    await assertRejectedUnchanged({ challengeId: await challenge({ company: ids.companyB }) }, /CHALLENGE_NOT_FOUND|INVALID_CHALLENGE/);
    await assertRejectedUnchanged({ challengeId: await challenge({ purpose: "enable_2fa" }) }, /INVALID_CHALLENGE_PURPOSE/);
    await assertRejectedUnchanged({ challengeId: await challenge({ status: "verified" }) }, /CHALLENGE_ALREADY_USED|CHALLENGE_NOT_FOUND/);
    await assertRejectedUnchanged({ challengeId: await challenge({ status: "failed", attempts: 5 }) }, /CHALLENGE_NOT_FOUND|TOO_MANY_ATTEMPTS|CHALLENGE_ALREADY_USED/);
    await assertRejectedUnchanged({ challengeId: await challenge({ attempts: 5 }) }, /TOO_MANY_ATTEMPTS/);
    await assertRejectedUnchanged({ challengeId: await challenge({ expires: "2020-01-01T00:00:00Z" }) }, /CODE_EXPIRED|CHALLENGE_EXPIRED/);
    await assertRejectedUnchanged({ challengeId: await challenge(), action: "bypass" }, /ACTION_NOT_ALLOWED|INVALID_ACTION/);
    await assertRejectedUnchanged({ challengeId: await challenge(), session: null }, /INVALID_VERIFIED_SESSION/);
    await assertRejectedUnchanged({ challengeId: await challenge({ purpose: "cancel_deletion" }), action: "confirm_cancel_deletion" }, /NOT_PENDING|NO_PENDING/);

    for (const status of ["blocked", "inactive", "cancelled"]) {
      await reset();
      await db.query("update public.companies set status=$1 where id=$2", [status, ids.companyA]);
      await assertRejectedUnchanged({ challengeId: await challenge() }, /COMPANY_INACTIVE|ACCOUNT_INACTIVE|COMPANY_NOT_ACTIVE/);
    }
    await reset();
    await db.query("update public.companies set deletion_status='completed' where id=$1", [ids.companyA]);
    await assertRejectedUnchanged({ challengeId: await challenge() }, /DELETION_COMPLETED|ACCOUNT_DELETED|COMPANY_DELETED/);

    for (const anomaly of ["missing", "duplicate", "schedule", "actor"]) {
      await reset();
      const original = await call({ challengeId: await challenge() });
      if (anomaly === "missing") await db.query("delete from public.account_deletion_requests where id=$1", [original.request_id]);
      if (anomaly === "duplicate") await db.query(`insert into public.account_deletion_requests(owner_id,requested_by,company_id,status,requested_at,scheduled_delete_at,confirmed_at)
        select owner_id,requested_by,company_id,status,requested_at,scheduled_delete_at,confirmed_at from public.account_deletion_requests where id=$1`, [original.request_id]);
      if (anomaly === "schedule") await db.query("update public.account_deletion_requests set scheduled_delete_at=scheduled_delete_at+interval '1 day' where id=$1", [original.request_id]);
      if (anomaly === "actor") await db.query("update public.account_deletion_requests set requested_by=$1 where id=$2", [ids.ownerB, original.request_id]);
      await assertRejectedUnchanged({ challengeId: await challenge({ purpose: "cancel_deletion" }), action: "confirm_cancel_deletion" },
        /DELETION_STATE_CONFLICT|DELETION_STATE_INCONSISTENT|DELETION_REQUEST_NOT_FOUND|DELETION_REQUEST_CONFLICT|INVALID_DELETION_STATE|REQUEST_STATE_MISMATCH/);
    }

    await db.exec(`create function public.fixture_fail_deletion_write() returns trigger language plpgsql as $$
      begin
        if current_setting('test.fail_deletion_table',true)=tg_table_name then
          if current_setting('test.skip_deletion_write',true)='true' then return null; end if;
          raise exception 'INJECTED_WRITE_FAILURE_%', tg_table_name;
        end if;
        return new;
      end;
      $$;`);
    for (const table of ["companies", "account_deletion_requests", "user_2fa_sessions", "user_2fa_challenges", "security_events"])
      await db.exec(`create trigger fixture_fail_write before insert or update on public.${table}
        for each row execute function public.fixture_fail_deletion_write()`);
    for (const action of ["confirm_account_deletion", "confirm_cancel_deletion"]) {
      for (const table of ["companies", "account_deletion_requests", "user_2fa_sessions", "user_2fa_challenges", "security_events"]) {
        for (const skip of [false, true]) {
          await reset();
          if (action === "confirm_cancel_deletion") await call({ challengeId: await challenge() });
          const challengeId = await challenge({ purpose: action === "confirm_account_deletion" ? "account_deletion" : "cancel_deletion" });
          await db.query("select set_config('test.fail_deletion_table',$1,false)", [table]);
          await db.query("select set_config('test.skip_deletion_write',$1,false)", [String(skip)]);
          await assertRejectedUnchanged({ challengeId, action }, skip ? /DELETION_STATE_CONFLICT/ : /INJECTED_WRITE_FAILURE/);
          await db.query("select set_config('test.fail_deletion_table','',false)");
          const recovered = await call({ challengeId, action });
          assert.equal(recovered.persisted, true, "Falha de gravação deve permitir recuperacao usando o desafio ainda pendente");
          passed++;
        }
      }
    }

    await reset();
    const guardedColumns = {
      deletion_status: "'pending_deletion'", deletion_requested_at: "now()", deletion_scheduled_at: "now()+interval '15 days'",
      deletion_cancelled_at: "now()", deletion_requested_by: `'${ids.ownerB}'::uuid`, deleted_at: "now()", deleted_by_system: "true"
    };
    for (const [column, value] of Object.entries(guardedColumns)) {
      const before = await snapshot();
      await rejectsSql(asRole(db, "authenticated", `update public.companies set ${column}=${value} where id=$1`, [ids.companyA]),
        /permission denied|DELETION.*(PROTECTED|FORBIDDEN|REQUIRES)|ACCOUNT_SECURITY_REQUIRED/i);
      assert.deepEqual(await snapshot(), before);
      await rejectsSql(asRole(db, "authenticated", `insert into public.companies(owner_user_id,name,${column}) values($1,'Bypass',${value})`, [ids.ownerA]),
        /permission denied|DELETION.*(PROTECTED|FORBIDDEN|REQUIRES)|ACCOUNT_SECURITY_REQUIRED/i);
      assert.deepEqual(await snapshot(), before);
      passed++;
    }
    const renamed = await asRole(db, "authenticated", "update public.companies set name='Nome editavel' where id=$1 returning name", [ids.companyA]);
    assert.equal(renamed.rows[0].name, "Nome editavel");
    const normalInsert = await asRole(db, "authenticated", "insert into public.companies(owner_user_id,name) values($1,'Empresa legitima') returning deletion_status,deleted_by_system", [ids.ownerA]);
    assert.equal(normalInsert.rows[0].deletion_status, "none");
    assert.equal(normalInsert.rows[0].deleted_by_system, false);
    const other = await asRole(db, "authenticated", "update public.companies set name='Ataque' where id=$1 returning id", [ids.companyB]);
    assert.equal(other.rows.length, 0);
    passed++;
    for (const table of ["user_2fa_challenges", "user_2fa_sessions", "account_deletion_requests", "security_events"])
      await rejectsSql(asRole(db, "authenticated", `select * from public.${table}`), /permission denied/i);
    passed++;

    console.log(`Account deletion isolated PostgreSQL: ${passed} scenario groups PASS. Real table definitions + new migration; service-only RPC, ownership, challenge binding, replay, state consistency, rollback/recovery and direct-write guards. No hosted Auth/API, independent-connection concurrency, cron execution, purge or production validation.`);
  } finally { await db.close(); }
}

main().catch((error) => { console.error(error); process.exitCode = 1; });
