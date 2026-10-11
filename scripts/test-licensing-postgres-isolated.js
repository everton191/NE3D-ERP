const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { PGlite } = require("@electric-sql/pglite");

const root = path.resolve(__dirname, "..");
const migration = (name) => fs.readFileSync(path.join(root, "supabase", "migrations", name), "utf8");
const ids = {
  admin: "00000000-0000-4000-8000-000000000001",
  userA: "00000000-0000-4000-8000-000000000002",
  userB: "00000000-0000-4000-8000-000000000003",
  noCompany: "00000000-0000-4000-8000-000000000004",
  clientA: "10000000-0000-4000-8000-000000000001",
  clientB: "10000000-0000-4000-8000-000000000002",
  clientC: "10000000-0000-4000-8000-000000000003"
};

async function asUser(db, userId, sql, params = []) {
  await db.exec("set role authenticated");
  await db.query("select set_config('request.jwt.claim.sub', $1, false)", [userId || ""]);
  try { return await db.query(sql, params); }
  finally { await db.exec("reset role"); }
}

async function rejectsSql(run, pattern) {
  await assert.rejects(run, (error) => pattern.test(String(error.message)), `esperado erro ${pattern}`);
}

async function main() {
  const db = new PGlite();
  await db.waitReady;
  try {
    await db.exec(`
      create role anon; create role authenticated; create role service_role;
      create schema auth; create schema private;
      grant usage on schema auth, private to authenticated;
      create table auth.users (id uuid primary key);
      create function auth.uid() returns uuid language sql stable as
        'select nullif(current_setting(''request.jwt.claim.sub'', true), '''')::uuid';
      create table public.superadmins (user_id uuid primary key, status text not null);
      create table public.profiles (user_id uuid primary key, client_id uuid, status text,
        name text, email text, phone text, updated_at timestamptz default now());
      create table public.erp_profiles (id uuid primary key, client_id uuid, role text,
        status text, display_name text, email text, phone text, updated_at timestamptz default now());
      create table public.plans (id uuid primary key default gen_random_uuid(), slug text unique not null,
        name text not null, price numeric default 0, active boolean default true,
        metadata jsonb not null default '{}'::jsonb, updated_at timestamptz default now());
      create table public.clients (id uuid primary key, name text, email text, responsible_name text,
        nome_responsavel text, phone text, status text default 'active', blocked_at timestamptz,
        blocked_reason text, archived_at timestamptz, anonymized_at timestamptz,
        active_plan text default 'free', plano_atual text default 'free',
        subscription_status text default 'free', status_assinatura text default 'active',
        plan_expires_at timestamptz, updated_at timestamptz default now());
      create table public.subscriptions (
        id uuid primary key default gen_random_uuid(), client_id uuid not null unique references public.clients(id),
        user_id uuid references auth.users(id), plan_id uuid references public.plans(id),
        active_plan text default 'free', plan_code text default 'FREE', plan_status text default 'FREE',
        status text default 'active', status_assinatura text default 'active',
        subscription_status text default 'free', subscription_active boolean default false,
        billing_variant text, payment_status text default 'none', pending_plan text,
        pending_started_at timestamptz, manual_override boolean default false,
        manual_override_reason text, manual_override_by uuid, manual_override_at timestamptz,
        premium_until timestamptz, plan_expires_at timestamptz, current_period_start timestamptz,
        current_period_end timestamptz, expires_at timestamptz, next_billing_at timestamptz,
        proximo_vencimento timestamptz, trial_started_at timestamptz, trial_expires_at timestamptz,
        trial_consumed_at timestamptz, is_trial_active boolean default false,
        blocked_at timestamptz, blocked_reason text, archived_at timestamptz,
        anonymized_at timestamptz, cancel_at_period_end boolean default false,
        mercado_pago_subscription_id text, created_at timestamptz default now(),
        updated_at timestamptz default now(),
        constraint subscriptions_active_plan_check check (active_plan in ('free','start','pro')),
        constraint subscriptions_plan_code_check check (plan_code in ('FREE','START','PRO'))
      );
      create table public.audit_logs (id uuid primary key default gen_random_uuid(),
        user_id uuid, client_id uuid, action text not null, details jsonb not null default '{}'::jsonb,
        created_at timestamptz default now());
      create function private.s3d_uuid_or_null(p_value text) returns uuid language plpgsql immutable as
        'begin return nullif(trim(p_value), '''')::uuid; exception when invalid_text_representation then return null; end';
      create function public.erp_is_superadmin() returns boolean language sql stable security definer
        set search_path = pg_catalog, public, auth as
        'select exists (select 1 from public.superadmins s where s.user_id = auth.uid() and s.status = ''active'')';
      grant execute on function public.erp_is_superadmin() to authenticated;
      grant select on public.plans to anon, authenticated;
      alter table public.plans enable row level security;
      create policy plans_select_active_anon on public.plans for select to anon using (active = true);
      create policy plans_select_active_or_superadmin on public.plans for select to authenticated
        using (active = true or public.erp_is_superadmin());
    `);

    const old = migration("20260506194730_saas_license_authority_phase1.sql");
    const begin = old.indexOf("create or replace function private.superadmin_update_subscription_impl(");
    const finish = old.indexOf("\n$$;", begin);
    assert(begin >= 0 && finish > begin, "implementação anterior da RPC não encontrada");
    await db.exec(old.slice(begin, finish + 4));
    await db.exec(migration("20261011151202_normalize_manual_plan_licenses.sql"));
    await db.exec(migration("20261011151604_superadmin_plan_presentation_persistence.sql"));

    const objects = (await db.query(`select n.nspname, p.proname, p.prosecdef,
      p.proconfig from pg_proc p join pg_namespace n on n.oid=p.pronamespace
      where p.proname in ('get_effective_license_impl','superadmin_set_plan_v2',
        'superadmin_update_plan_presentation_impl') order by p.proname`)).rows;
    assert.equal(objects.length, 3);
    assert(objects.every((item) => item.nspname === "private" && item.prosecdef === true));
    assert(objects.every((item) => item.proconfig.some((setting) => setting.startsWith("search_path=pg_catalog,"))));

    await db.query("insert into auth.users(id) values ($1),($2),($3),($4)",
      [ids.admin, ids.userA, ids.userB, ids.noCompany]);
    await db.query("insert into public.superadmins(user_id,status) values($1,'active')", [ids.admin]);
    await db.query("insert into public.clients(id,name,email) values($1,'Homologacao A','a@example.invalid'),($2,'Homologacao B','b@example.invalid')",
      [ids.clientA, ids.clientB]);
    await db.query("insert into public.profiles(user_id,client_id) values($1,$2),($3,$4)",
      [ids.userA, ids.clientA, ids.userB, ids.clientB]);
    await db.exec("insert into public.plans(slug,name,price) values ('free','Free',0),('start','Start',29.90),('pro','Pro',59.90)");
    await db.query(`insert into public.subscriptions(client_id,user_id,plan_id)
      select $1,$2,id from public.plans where slug='free'`, [ids.clientA, ids.userA]);
    await db.query(`insert into public.subscriptions(client_id,user_id,plan_id)
      select $1,$2,id from public.plans where slug='free'`, [ids.clientB, ids.userB]);

    const callPlan = (target, action, plan, until) => asUser(db, ids.admin,
      "select public.superadmin_update_subscription($1,$2,$3,$4::timestamptz,'Teste sintético') as license",
      [target, action, plan, until]);
    const future = new Date(Date.now() + 10 * 86400000).toISOString();
    const later = new Date(Date.now() + 15 * 86400000).toISOString();

    assert.equal((await asUser(db, ids.userA,
      "select private.get_effective_license_impl(null) as license")).rows[0].license.active_plan, "free");
    assert.equal((await asUser(db, ids.noCompany,
      "select private.get_effective_license_impl(null) as license")).rows[0].license.active_plan, "free");
    await rejectsSql(callPlan(ids.userA, "SET_PLAN_MANUAL", "START", null), /vencimento futura/i);
    await rejectsSql(callPlan(ids.userA, "SET_PLAN_MANUAL", "PRO", "2020-01-01"), /vencimento futura/i);
    const start = (await callPlan(ids.userA, "SET_PLAN_MANUAL", "START", future)).rows[0].license;
    assert.equal(start.active_plan, "start");
    assert.equal(start.is_premium, false);
    assert.equal(start.effective_status, "ACTIVE");
    const pro = (await callPlan(ids.userA, "SET_PLAN_MANUAL", "PRO", future)).rows[0].license;
    assert.equal(pro.active_plan, "pro");
    assert.equal(pro.has_full_access, true);
    const renewed = (await callPlan(ids.userA, "ACTIVATE_PREMIUM_MANUAL", "PRO", later)).rows[0].license;
    assert(Date.parse(renewed.premium_until) >= Date.parse(later) - 1000);
    assert.equal((await db.query("select count(*)::int as n from public.audit_logs where action='superadmin_update_subscription'")).rows[0].n, 3);
    const lastPlanAudit = (await db.query(`select user_id, client_id, details from public.audit_logs
      where action='superadmin_update_subscription' order by created_at desc, id desc limit 1`)).rows[0];
    assert.equal(lastPlanAudit.user_id, ids.admin);
    assert.equal(lastPlanAudit.client_id, ids.clientA);
    assert.equal(lastPlanAudit.details.new_plan, "pro");
    assert(lastPlanAudit.details.new_until);
    const blocked = (await asUser(db, ids.admin,
      "select public.superadmin_update_subscription($1,'BLOCK',null,null,'Teste de bloqueio') as license",
      [ids.userA])).rows[0].license;
    assert.equal(blocked.effective_status, "BLOCKED");
    const unblocked = (await asUser(db, ids.admin,
      "select public.superadmin_update_subscription($1,'UNBLOCK') as license",
      [ids.userA])).rows[0].license;
    assert.equal(unblocked.active_plan, "pro");
    assert.equal(unblocked.effective_status, "ACTIVE");

    await rejectsSql(asUser(db, ids.userB,
      "select private.get_effective_license_impl($1) as license", [ids.userA]), /apenas superadmin/i);
    await rejectsSql(asUser(db, ids.userB,
      "select public.superadmin_update_subscription($1,'SET_FREE')", [ids.clientA]), /apenas superadmin/i);
    await rejectsSql(asUser(db, ids.noCompany,
      "select public.superadmin_update_subscription($1,'SET_FREE')", [ids.clientA]), /apenas superadmin/i);
    await rejectsSql(asUser(db, "",
      "select private.get_effective_license_impl(null)"), /autenticado/i);
    assert.equal((await asUser(db, ids.userB,
      "select private.get_effective_license_impl(null) as license")).rows[0].license.active_plan, "free");

    await db.query("insert into public.clients(id,name,email) values($1,'Homologacao C','c@example.invalid')", [ids.clientC]);
    await db.query("insert into public.profiles(user_id,client_id) values($1,$2)", [ids.noCompany, ids.clientC]);
    await callPlan(ids.noCompany, "SET_PLAN_MANUAL", "START", future);
    await callPlan(ids.noCompany, "SET_PLAN_MANUAL", "START", future);
    assert.equal((await db.query("select count(*)::int as n from public.subscriptions where client_id=$1", [ids.clientC])).rows[0].n, 1);

    await db.query(`update public.subscriptions set mercado_pago_subscription_id='synthetic-provider-id'
      where client_id=$1`, [ids.clientB]);
    await rejectsSql(callPlan(ids.userB, "SET_PLAN_MANUAL", "PRO", future), /Mercado Pago/i);
    await rejectsSql(callPlan(ids.userB, "SET_FREE", "FREE", null), /Mercado Pago/i);

    await db.query(`update public.subscriptions set premium_until=now()-interval '1 day',
      plan_expires_at=now()-interval '1 day', current_period_end=now()-interval '1 day',
      expires_at=now()-interval '1 day' where client_id=$1`, [ids.clientA]);
    const expired = (await asUser(db, ids.userA,
      "select private.get_effective_license_impl(null) as license")).rows[0].license;
    assert.equal(expired.active_plan, "free");
    assert.equal((await db.query("select active_plan,manual_override from public.subscriptions where client_id=$1", [ids.clientA])).rows[0].manual_override, false);
    assert.equal((await db.query("select count(*)::int as n from public.audit_logs where action='manual_plan_expired'")).rows[0].n, 1);
    await asUser(db, ids.userA, "select private.get_effective_license_impl(null)");
    assert.equal((await db.query("select count(*)::int as n from public.audit_logs where action='manual_plan_expired'")).rows[0].n, 1);

    const changes = { name: "Start Homologado", headline: "Novo título", description: "Nova descrição",
      features: ["Benefício A", "Benefício B"], priceLabel: "R$ 29,90" };
    const saved = (await asUser(db, ids.admin,
      "select public.superadmin_update_plan_presentation('start',$1::jsonb) as result",
      [JSON.stringify(changes)])).rows[0].result;
    assert.equal(saved.presentation.name, changes.name);
    const otherUserRead = (await asUser(db, ids.userB,
      "select metadata->'presentation' as presentation from public.plans where slug='start'")).rows[0].presentation;
    assert.equal(otherUserRead.headline, changes.headline);
    await db.exec("set role anon");
    try {
      assert.equal((await db.query("select metadata->'presentation' as presentation from public.plans where slug='start'")).rows[0].presentation.name,
        changes.name);
      await rejectsSql(db.query("select public.superadmin_update_plan_presentation('start','{\"name\":\"Fraude\"}'::jsonb)"),
        /permission denied/i);
    } finally { await db.exec("reset role"); }
    assert.equal((await db.query("select price from public.plans where slug='start'")).rows[0].price, "29.90");
    await rejectsSql(asUser(db, ids.userB,
      "select public.superadmin_update_plan_presentation('start',$1::jsonb)", [JSON.stringify({ name: "Fraude" })]), /superadmin/i);
    await rejectsSql(asUser(db, "",
      "select public.superadmin_update_plan_presentation('start',$1::jsonb)", [JSON.stringify({ name: "Fraude" })]), /autenticado/i);
    await rejectsSql(asUser(db, ids.admin,
      "select public.superadmin_update_plan_presentation('start',$1::jsonb)", [JSON.stringify({ price: 0 })]), /invalido/i);
    await rejectsSql(asUser(db, ids.userB,
      "update public.plans set metadata='{}'::jsonb where slug='start'"), /permission denied/i);
    assert.equal((await db.query("select count(*)::int as n from public.audit_logs where action='superadmin_update_plan_presentation'")).rows[0].n, 1);

    await asUser(db, ids.admin, "select public.superadmin_update_subscription($1,'SET_FREE')", [ids.userA]);
    assert.equal((await asUser(db, ids.userA,
      "select private.get_effective_license_impl(null) as license")).rows[0].license.active_plan, "free");
    await rejectsSql(asUser(db, "",
      "select private.get_effective_license_impl(null)"), /autenticado/i);
    assert.equal((await asUser(db, ids.userA,
      "select private.get_effective_license_impl(null) as license")).rows[0].license.active_plan, "free");
    console.log("Isolated PostgreSQL: 2 migrations applied; licenses, expiry, provider guard, RLS, RPC authorization and card persistence PASS");
  } finally { await db.close(); }
}

main().catch((error) => { console.error(error); process.exitCode = 1; });
