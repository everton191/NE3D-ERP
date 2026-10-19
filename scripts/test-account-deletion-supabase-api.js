const assert = require("node:assert/strict");
const crypto = require("node:crypto");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const { stripTypeScriptTypes } = require("node:module");
const { createClient } = require("@supabase/supabase-js");
const { getTarget, createFixtures, runWithCleanup } = require("./supabase-homolog-test-utils");

// Local Auth/Data API and captured SMTP only. No .env, remote target, generated
// admin OTP fallback, real account, Deno deployment or permanent deletion.
const root = path.resolve(__dirname, "..");
const sourcePath = path.join(root, "supabase/functions/account-security/index.ts");
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function localOrigin(value, label) {
  let parsed;
  try { parsed = new URL(value); } catch { throw new Error(`PENDENTE: configurar ${label} local explicito.`); }
  assert(["http:", "https:"].includes(parsed.protocol)
    && ["127.0.0.1", "localhost", "[::1]"].includes(parsed.hostname)
    && !parsed.username && !parsed.password && !parsed.search && !parsed.hash
    && parsed.pathname === "/", `${label} deve ser somente uma origem loopback.`);
  return parsed.origin;
}

function must(result, label) {
  // Do not print Auth responses, secrets, OTPs or SQL error payloads.
  if (result.error) throw new Error(`${label}: operacao local recusada (${result.error.code || result.error.status || "erro"}).`);
  return result.data;
}

function loadHandler({ url, anonKey, serviceKey, localFetch }) {
  let handler;
  const context = vm.createContext({ Request, Response, URL, TextEncoder, Uint8Array,
    Error, console, atob, crypto: crypto.webcrypto, fetch: localFetch,
    createClient: (requestedUrl, key, options) => {
      assert(requestedUrl === url && [anonKey, serviceKey].includes(key), "Handler tentou usar outro backend.");
      return createClient(requestedUrl, key, { ...options, global: { fetch: localFetch } });
    },
    Deno: { env: { get: (key) => ({ SUPABASE_URL: url,
      SUPABASE_ANON_KEY: anonKey, SUPABASE_SERVICE_ROLE_KEY: serviceKey })[key] } },
    serve: (callback) => { handler = callback; }
  });
  const source = fs.readFileSync(sourcePath, "utf8");
  vm.runInContext(stripTypeScriptTypes(source.replace(/^import[\s\S]*?from ["'][^"']+["'];\s*/gm, "")), context,
    { filename: "account-security-canonical.ts" });
  assert(typeof handler === "function", "Handler canonical nao carregou.");
  return handler;
}

function mailboxRecipients(message) {
  return (message.To || message.to || []).map((recipient) =>
    typeof recipient === "string" ? recipient : recipient.Address || recipient.address || "");
}

function extractOtp(message) {
  const body = [message.Text, message.text, message.HTML, message.html].filter((value) => typeof value === "string")
    .join("\n").replace(/<(style|script)\b[^>]*>[\s\S]*?<\/\1>/gi, " ")
    .replace(/<[^>]*>/g, " ").replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)));
  const tokens = [...new Set((body.match(/\b\d{6}\b/g) || []))];
  assert(tokens.length === 1, "PENDENTE: SMTP local deve entregar um codigo de seis digitos nao ambiguo; configurar template magic_link com .Token.");
  return tokens[0];
}

async function run({ env = process.env } = {}) {
  const { url, anonKey, serviceKey } = getTarget("local", env);
  const mailUrl = localOrigin(env.S3D_LOCAL_MAIL_URL || "", "S3D_LOCAL_MAIL_URL");
  const fault = { armed: false, count: 0 };
  const localFetch = async (input, init = {}) => {
    const endpoint = new URL(typeof input === "string" || input instanceof URL ? String(input) : input.url);
    assert(endpoint.origin === url, "Trafego Supabase fora da origem local bloqueado.");
    if (fault.armed && endpoint.pathname === "/rest/v1/rpc/apply_account_deletion_action") {
      // Keep the one logical fault scenario closed even if a client retries I/O.
      fault.count++;
      throw new TypeError("Synthetic local RPC transport interruption");
    }
    return fetch(input, { ...init, redirect: "error" });
  };
  const mailFetch = async (pathname) => {
    assert(/^\/api\/v1\/(messages(?:\?limit=200)?|message\/[A-Za-z0-9_-]+)$/.test(pathname), "Rota SMTP fora do escopo.");
    let result;
    try { result = await fetch(`${mailUrl}${pathname}`, { redirect: "error" }); }
    catch { throw new Error("PENDENTE: Mailpit SMTP local indisponivel; nenhum fallback de OTP sera utilizado."); }
    assert(result.ok, "PENDENTE: API Mailpit local indisponivel ou incompativel.");
    return result.json();
  };
  const listMail = async () => {
    const result = await mailFetch("/api/v1/messages?limit=200");
    assert(Array.isArray(result.messages), "PENDENTE: resposta da API Mailpit local incompativel.");
    return result.messages;
  };
  // SMTP availability is checked before creating any identity.
  await listMail();
  const options = { auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    global: { fetch: localFetch } };
  const service = createClient(url, serviceKey, options);
  const runId = crypto.randomBytes(6).toString("hex");
  const fixtures = createFixtures(service, runId);
  const users = [];
  const nextOtpAt = new Map();
  const handler = loadHandler({ url, anonKey, serviceKey, localFetch });
  let passed = 0;
  const pass = (label) => { passed++; console.log(`PASS account deletion local: ${label}`); };

  async function register(label) {
    const email = `s3d-deletion-${runId}-${label}@example.invalid`;
    const password = crypto.randomBytes(24).toString("base64url");
    const created = must(await service.auth.admin.createUser({ email, password, email_confirm: true,
      user_metadata: { name: `Deletion ${label} ${runId}`, business_name: `Deletion ${label} ${runId}` } }), "Criar Auth sintetico");
    fixtures.user(created.user);
    const client = fixtures.session(createClient(url, anonKey, options));
    const login = must(await client.auth.signInWithPassword({ email, password }), "Login sintetico");
    const profile = must(await service.from("profiles").select("client_id,company_id")
      .eq("user_id", created.user.id).single(), "Provisionamento sintetico");
    assert(profile?.client_id && profile?.company_id, "Signup deve provisionar cliente e empresa completos.");
    const company = must(await service.from("companies").select("id,name,owner_user_id")
      .eq("id", profile.company_id).single(), "Conferir empresa sintetica");
    assert(company.name.includes(runId) && (!company.owner_user_id || company.owner_user_id === created.user.id),
      "Empresa provisionada fora da fixture.");
    must(await service.from("companies").update({ owner_user_id: created.user.id })
      .eq("id", company.id).eq("name", company.name).select("id").single(), "Definir proprietario sintetico");
    const user = { id: created.user.id, email, password, companyId: company.id, clientId: profile.client_id,
      client, token: login.session.access_token };
    users.push(user);
    return user;
  }

  async function invoke(user, action, extra = {}, token = user?.token) {
    const result = await handler(new Request(`${url}/functions/v1/account-security`, {
      method: "POST", headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      body: JSON.stringify({ action, ...extra })
    }));
    return { status: result.status, body: await result.json() };
  }

  async function rejected(user, action, extra, expected, token) {
    const result = await invoke(user, action, extra, token);
    assert(result.status >= 400 && result.body.ok === false, "Operacao nao autorizada nao pode obter sucesso.");
    assert(expected.includes(result.body.error), "Codigo de rejeicao diferente do contrato esperado.");
    return result;
  }

  async function state(user) {
    return {
      company: must(await service.from("companies").select("id,status,deletion_status,deletion_requested_at,deletion_scheduled_at,deletion_cancelled_at,deletion_requested_by,deleted_at,deleted_by_system")
        .eq("id", user.companyId).single(), "Reler empresa"),
      requests: must(await service.from("account_deletion_requests").select("id,owner_id,requested_by,company_id,status,requested_at,scheduled_delete_at,cancelled_at,confirmation_email")
        .eq("company_id", user.companyId).order("id"), "Reler pedidos"),
      challenges: must(await service.from("user_2fa_challenges").select("id,purpose,status,used_at,attempt_count,expires_at")
        .eq("user_id", user.id).order("id"), "Reler desafios"),
      sessions: must(await service.from("user_2fa_sessions").select("id,company_id,auth_session_id,revoked_at")
        .eq("user_id", user.id).order("id"), "Reler sessoes MFA"),
      events: must(await service.from("security_events").select("id,event_type,status,metadata")
        .eq("user_id", user.id).order("id"), "Reler auditoria")
    };
  }

  async function requestOtp(user, action) {
    const remaining = (nextOtpAt.get(user.email) || 0) - Date.now();
    if (remaining > 0) {
      console.log("INFO account deletion local: respeitando intervalo de reenvio do Auth/SMTP.");
      while ((nextOtpAt.get(user.email) || 0) > Date.now())
        await sleep(Math.min(10000, nextOtpAt.get(user.email) - Date.now()));
    }
    const seen = new Set((await listMail()).map((message) => message.ID || message.id));
    const result = await invoke(user, action);
    assert(result.status === 200 && result.body.ok === true && uuid.test(result.body.data?.id || ""),
      "Solicitacao real de OTP deve ser confirmada pelo handler.");
    nextOtpAt.set(user.email, Date.now() + 61000);
    const challenge = result.body.data;
    const deadline = Date.now() + 20000;
    while (Date.now() < deadline) {
      const messages = await listMail();
      const matching = messages.filter((message) => !seen.has(message.ID || message.id)
        && mailboxRecipients(message).some((address) => address.toLowerCase() === user.email));
      assert(matching.length <= 1, "Mais de uma mensagem SMTP nova para a mesma fixture.");
      if (matching.length) {
        const id = matching[0].ID || matching[0].id;
        assert(/^[A-Za-z0-9_-]+$/.test(id), "ID de mensagem SMTP invalido.");
        return { challenge, code: extractOtp(await mailFetch(`/api/v1/message/${id}`)) };
      }
      await sleep(250);
    }
    throw new Error("PENDENTE: codigo nao recebido no SMTP local; nao sera gerado OTP administrativo alternativo.");
  }

  function confirmed(result, action, user) {
    const data = result.body.data;
    assert(result.status === 200 && result.body.ok === true && data?.persisted === true
      && data.action === action && data.company_id === user.companyId && uuid.test(data.request_id || ""),
    "Confirmacao real deve conter prova persistida coerente.");
    assert(typeof data.session?.access_token === "string" && typeof data.session?.refresh_token === "string",
      "Auth deve devolver sessao real apos verificar OTP.");
    if (action === "confirm_account_deletion")
      assert(Date.parse(data.scheduled_for) > Date.now(), "Carencia de exclusao deve ser futura.");
    else assert(data.cancelled === true, "Cancelamento deve ser confirmado.");
    return data;
  }

  await runWithCleanup(async () => {
    const a = await register("owner-a"), b = await register("owner-b");
    const member = await register("member"), withoutCompany = await register("no-company");
    assert(new Set(users.map((user) => user.companyId)).size === users.length, "Tenants devem ser independentes.");
    for (const user of [member, withoutCompany]) {
      must(await service.from("company_members").update({ status: "inactive", role: "user" })
        .eq("user_id", user.id), "Desativar vinculo sintetico inicial");
      must(await service.from("companies").update({ owner_user_id: null })
        .eq("id", user.companyId).eq("owner_user_id", user.id).select("id").single(), "Retirar propriedade sintetica");
    }
    must(await service.from("company_members").insert({ company_id: a.companyId, user_id: member.id,
      role: "user", status: "active" }), "Vincular membro sintetico");
    const bInitial = await state(b);
    await rejected(null, "request_account_deletion", {}, ["UNAUTHENTICATED"]);
    await rejected(null, "request_account_deletion", {}, ["UNAUTHENTICATED"], "synthetic-invalid-session");
    await rejected(member, "request_account_deletion", {}, ["OWNER_REQUIRED"]);
    await rejected(withoutCompany, "request_account_deletion", {}, ["COMPANY_REQUIRED"]);
    pass("Auth real, duas empresas, membro comum e ausencia de empresa");

    for (const user of [a, member]) {
      const denied = await user.client.rpc("apply_account_deletion_action", {
        p_actor_user_id: a.id, p_company_id: a.companyId, p_challenge_id: crypto.randomUUID(),
        p_action: "confirm_account_deletion", p_verified_session_id: crypto.randomUUID()
      });
      assert(denied.error?.code === "42501", "RPC interna deve negar EXECUTE ao cliente autenticado, nao apenas falhar por outro motivo.");
    }
    const anon = createClient(url, anonKey, options);
    assert((await anon.rpc("apply_account_deletion_action", { p_actor_user_id: a.id, p_company_id: a.companyId,
      p_challenge_id: crypto.randomUUID(), p_action: "confirm_account_deletion", p_verified_session_id: crypto.randomUUID() })).error?.code === "42501",
    "RPC interna nao pode ser executada por anon.");
    assert((await a.client.from("companies").update({ deletion_status: "pending_deletion" })
      .eq("id", a.companyId).select("id")).error, "Escrita direta de exclusao deve ser negada mesmo ao proprietario.");
    must(await a.client.from("companies").update({ name: `Deletion edited ${runId}` })
      .eq("id", a.companyId).select("id").single(), "Edicao legitima da empresa");
    pass("ACL de RPC e trigger reais preservam edicao normal e negam bypass");

    for (const [purpose, companyId, expected] of [["login", a.companyId, "INVALID_CHALLENGE_PURPOSE"],
      ["account_deletion", b.companyId, "CHALLENGE_COMPANY_MISMATCH"]]) {
      const challenge = must(await service.from("user_2fa_challenges").insert({ user_id: a.id, company_id: companyId,
        purpose, expires_at: new Date(Date.now() + 600000).toISOString(), resend_available_at: new Date().toISOString() })
        .select("id").single(), "Criar desafio negativo sintetico");
      await rejected(a, "confirm_account_deletion", { challenge_id: challenge.id, code: "000000" }, [expected]);
    }
    pass("desafios de finalidade e empresa incorretas rejeitados antes do OTP");

    const bOtp = await requestOtp(b, "request_account_deletion");
    const bBeforeFailure = await state(b);
    fault.armed = true;
    let failed;
    try {
      failed = await rejected(b, "confirm_account_deletion", { challenge_id: bOtp.challenge.id, code: bOtp.code },
        ["ACCOUNT_DELETION_UNAVAILABLE"]);
    } finally { fault.armed = false; }
    assert(failed.status === 503 && fault.count >= 1 && fault.armed === false, "Interrupcao deve atingir a RPC somente neste cenario.");
    assert.deepEqual(await state(b), bBeforeFailure, "Falha RPC nao pode persistir confirmacao parcial.");
    pass("OTP Auth real seguido de falha de transporte RPC sem falso sucesso ou escrita parcial");

    const aOtp = await requestOtp(a, "request_account_deletion");
    await rejected(b, "confirm_account_deletion", { challenge_id: aOtp.challenge.id, code: "000000" }, ["CHALLENGE_NOT_FOUND"]);
    await rejected(member, "confirm_account_deletion", { challenge_id: aOtp.challenge.id, code: "000000" }, ["OWNER_REQUIRED"]);
    const confirmedA = confirmed(await invoke(a, "confirm_account_deletion", {
      challenge_id: aOtp.challenge.id, code: aOtp.code, reason: `Synthetic deletion ${runId}`,
      company_id: b.companyId, user_id: b.id
    }), "confirm_account_deletion", a);
    const aPending = await state(a);
    assert(aPending.company.deletion_status === "pending_deletion" && aPending.requests.length === 1
      && aPending.requests[0].id === confirmedA.request_id && aPending.requests[0].status === "confirmed"
      && aPending.requests[0].confirmation_email === a.email, "Empresa e pedido devem confirmar juntos no tenant autenticado.");
    assert(Date.parse(aPending.company.deletion_scheduled_at) - Date.parse(aPending.company.deletion_requested_at) === 15 * 86400000,
      "Prazo original de quinze dias deve ser preservado.");
    assert(aPending.challenges.find((item) => item.id === aOtp.challenge.id)?.status === "verified"
      && aPending.sessions.length === 1
      && aPending.events.filter((event) => event.event_type === "account_deletion_requested").length === 1,
    "Desafio, MFA e auditoria devem ser persistidos com a confirmacao.");
    const ownRequests = must(await a.client.from("account_deletion_requests").select("id,status")
      .eq("id", confirmedA.request_id), "Leitura autenticada do pedido");
    assert(ownRequests.length === 1 && ownRequests[0].status === "confirmed", "Proprietario deve reler sua confirmacao via REST.");
    assert(must(await b.client.from("account_deletion_requests").select("id").eq("id", confirmedA.request_id),
      "Leitura de outro tenant").length === 0, "Outro tenant nao deve enxergar o pedido.");
    await rejected(a, "confirm_account_deletion", { challenge_id: aOtp.challenge.id, code: aOtp.code }, ["PENDING_DELETION"]);
    assert.deepEqual(await state(a), aPending, "Repeticao nao deve criar pedido, estender prazo ou duplicar evento.");
    assert.deepEqual((await state(b)).company, bInitial.company, "Confirmacao A nao deve alterar empresa B.");
    pass("confirmacao real, carencia, persistencia REST, isolamento e repeticao sem duplicacao");

    const cancelOtp = await requestOtp(a, "request_cancel_deletion");
    const cancelledA = confirmed(await invoke(a, "confirm_cancel_deletion", {
      challenge_id: cancelOtp.challenge.id, code: cancelOtp.code
    }), "confirm_cancel_deletion", a);
    const aCancelled = await state(a);
    assert(cancelledA.request_id === confirmedA.request_id && aCancelled.company.deletion_status === "cancelled"
      && aCancelled.company.deletion_scheduled_at === null && aCancelled.requests[0].status === "cancelled"
      && aCancelled.requests[0].cancelled_at, "Cancelamento deve persistir na mesma solicitacao e liberar o agendamento.");
    await rejected(a, "confirm_cancel_deletion", { challenge_id: cancelOtp.challenge.id, code: cancelOtp.code }, ["CHALLENGE_ALREADY_USED"]);
    await rejected(a, "confirm_account_deletion", { challenge_id: aOtp.challenge.id, code: aOtp.code }, ["CHALLENGE_ALREADY_USED"]);
    assert.deepEqual(await state(a), aCancelled, "Repeticoes apos cancelamento nao devem mudar estado ou auditoria.");
    const secondClient = fixtures.session(createClient(url, anonKey, options));
    const secondLogin = must(await secondClient.auth.signInWithPassword({ email: a.email, password: a.password }), "Novo login independente");
    const secondStatus = await invoke(a, "status", {}, secondLogin.session.access_token);
    assert(secondStatus.body.ok === true && secondStatus.body.data.company.deletion_status === "cancelled"
      && secondStatus.body.data.deletion === null, "Outra sessao deve reconhecer o cancelamento persistido.");
    must(await secondClient.auth.signOut({ scope: "local" }), "Logout da segunda sessao");
    assert((await state(a)).company.deletion_status === "cancelled", "Logout nao deve alterar estado de exclusao.");
    pass("cancelamento, novo login, logout e auditoria persistentes com OTP real");

    const recoveredOtp = await requestOtp(b, "request_account_deletion");
    const recovered = confirmed(await invoke(b, "confirm_account_deletion", {
      challenge_id: recoveredOtp.challenge.id, code: recoveredOtp.code
    }), "confirm_account_deletion", b);
    const recoveredState = await state(b);
    assert(recoveredState.company.deletion_status === "pending_deletion" && recoveredState.requests.length === 1
      && recoveredState.requests[0].id === recovered.request_id
      && recoveredState.challenges.find((item) => item.id === bOtp.challenge.id)?.status === "expired"
      && recoveredState.events.filter((event) => event.event_type === "account_deletion_requested").length === 1,
    "Novo codigo apos falha deve recuperar a operacao sem duplicacao; OTP anterior nao e reutilizado.");
    pass("recuperacao com novo OTP apos falha de transporte e cooldown respeitado");
  }, [async () => {
    await fixtures.cleanup();
    for (const user of users) {
      assert(must(await service.from("user_2fa_challenges").select("id").eq("user_id", user.id), "Verificar desafios removidos").length === 0,
        "Desafio sintetico remanescente.");
      assert(must(await service.from("user_2fa_sessions").select("id").eq("user_id", user.id), "Verificar sessoes removidas").length === 0,
        "Sessao sintetica remanescente.");
      assert(must(await service.from("account_deletion_requests").select("id").eq("company_id", user.companyId), "Verificar pedidos removidos").length === 0,
        "Pedido sintetico remanescente.");
    }
  }]);
  console.log(`PASS account deletion Supabase local: ${passed} grupos; Auth/PostgREST/SMTP reais, handler canonical em VM; sem Deno, concorrencia SQL ou purga definitiva.`);
  return { passed, target: "local", handlerRuntime: "node-vm", realAuth: true, realSmtp: true };
}

module.exports = { run, localOrigin, extractOtp, loadHandler };
if (require.main === module) {
  assert(!process.argv[2] || process.argv[2] === "local", "Somente homologacao local isolada e permitida.");
  run().catch((error) => { console.error(`FAIL account deletion Supabase local: ${error.message}`); process.exitCode = 1; });
}
