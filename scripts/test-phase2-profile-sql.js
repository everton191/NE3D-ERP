// Requires PGlite in an external test directory, never a production connection.
// node scripts/test-phase2-profile-sql.js <test-runtime-directory>
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { createRequire } = require('node:module');
const runtime = process.argv[2];
if (!runtime) throw new Error('Informe o diretório de testes com @electric-sql/pglite@0.5.8');
const { PGlite } = createRequire(path.join(path.resolve(runtime), 'package.json'))('@electric-sql/pglite');

(async () => {
  const db = new PGlite();
  try {
    await db.exec(`
      create role anon; create role authenticated; create role service_role bypassrls;
      create schema auth;
      create function auth.uid() returns text language sql stable as
        $$select current_setting('test.user_id', true)$$;
      grant usage on schema public, auth to authenticated, service_role;
      create table public.profiles (user_id text primary key, name text, phone text,
        role text, status text, client_id text, company_id text, updated_at timestamptz,
        onboarding_completed boolean, onboarding_step integer);
      create table public.erp_profiles (id text primary key, display_name text, phone text,
        role text, status text, client_id text, company_id text, updated_at timestamptz,
        onboarding_completed boolean, onboarding_step integer, must_change_password boolean);
      insert into profiles(user_id,role,status,client_id,company_id) values
        ('a','user','active','client-a','company-a'),('b','user','active','client-b','company-b');
      insert into erp_profiles(id,role,status,client_id,company_id) values
        ('a','user','active','client-a','company-a'),('b','user','active','client-b','company-b');
      alter table profiles enable row level security;
      alter table erp_profiles enable row level security;
      create policy own on profiles for all to authenticated using(user_id=auth.uid()) with check(user_id=auth.uid());
      create policy own on erp_profiles for all to authenticated using(id=auth.uid()) with check(id=auth.uid());
      grant select,insert,update on profiles,erp_profiles to authenticated;
      grant update(role) on profiles to authenticated;
      set test.user_id='a'; set role authenticated;
      update erp_profiles set role='admin' where id='a';
      reset role;
      update erp_profiles set role='user' where id='a';
    `);
    const sql = fs.readFileSync(path.join(__dirname, '../docs/security/drafts/20260906151531_phase2_profile_authority_guard.sql'), 'utf8');
    await db.exec(sql);
    await db.exec(sql); // Migration remains repeatable.
    await db.exec('set role authenticated');
    let denied = 0;
    for (const [table, id] of [['profiles','user_id'], ['erp_profiles','id']]) {
      for (const column of ['role', 'status', 'client_id', 'company_id', id]) {
        await assert.rejects(db.query(`update public.${table} set ${column}='forged' where ${id}='a'`), e => e.code === '42501');
        denied++;
      }
      await assert.rejects(db.query(`insert into public.${table}(${id},role) values('c','admin')`), e => e.code === '42501');
      denied++;
      const name = table === 'profiles' ? 'name' : 'display_name';
      await db.query(`update public.${table} set ${name}='Nome',phone='123',onboarding_step=1 where ${id}='a'`);
      const other = await db.query(`update public.${table} set ${name}='Ataque' where ${id}='b' returning ${id}`);
      assert.equal(other.rows.length, 0);
    }
    await db.exec('reset role; set role service_role');
    await db.query("update public.profiles set role='admin' where user_id='a'");
    const rows = await db.query("select role from public.profiles where user_id='a'");
    assert.equal(rows.rows[0].role, 'admin');
    console.log(`profile_sql_ok: ${denied} escritas de autoridade bloqueadas; edição pessoal permitida; dois usuários isolados; service_role preservado; reaplicação OK`);
  } finally { await db.close(); }
})().catch(error => { console.error(error.message); process.exitCode = 1; });
