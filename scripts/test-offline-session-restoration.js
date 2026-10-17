"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const source = fs.readFileSync(path.join(__dirname, "..", "app.js"), "utf8");
const hour = 60 * 60 * 1000;
const day = 24 * hour;
const now = Date.parse("2026-10-17T12:00:00.000Z");
const email = "offline-fixture@example.invalid";

function extractFunction(name) {
  // Top-level functions in app.js have an unindented closing brace. Keep the
  // real async declaration and defaults instead of rebuilding their behavior.
  const match = new RegExp(`^(?:async )?function ${name}\\([^\\n]*\\) \\{[\\s\\S]*?^\\}`, "m").exec(source);
  assert(match, `Funcao real ausente: ${name}`);
  return match[0];
}

const constants = [
  "LOCAL_SESSION_CACHE_KEY", "LOCAL_UNLOCK_KEY", "LOCAL_UNLOCK_MAX_MS",
  "LOCAL_SESSION_MAX_MS", "OFFLINE_LICENSE_STALE_MAX_MS"
].map((name) => {
  const match = new RegExp(`^const ${name} = [^;]+;`, "m").exec(source);
  assert(match, `Constante real ausente: ${name}`);
  return match[0];
});
const functions = [
  "sanitizarCacheSessaoLocalLegado", "carregarSessaoSensivelSupabase",
  "limparSessaoSensivelSupabase", "registrarDesbloqueioLocal",
  "getUltimoDesbloqueioLocalMs", "precisaDesbloqueioLocal",
  "cacheSessaoLocalExpirou", "licencaLocalAindaConfiavel",
  "ativarTravaLocal", "desativarTravaLocal",
  "tentarDesbloqueioLocalComBiometria", "exigirDesbloqueioLocalSeNecessario",
  "sessaoSupabaseValidaParaEmail", "restaurarCacheSessaoLocal"
].map(extractFunction);
const program = [...constants, ...functions].join("\n\n");

function memoryStorage() {
  const values = new Map();
  return {
    getItem: (key) => values.has(key) ? values.get(key) : null,
    setItem: (key, value) => values.set(key, String(value)),
    removeItem: (key) => values.delete(key)
  };
}

function fixture(options = {}) {
  const calls = [];
  const localStorage = memoryStorage();
  const sessionStorage = memoryStorage();
  const forbidden = (name) => () => {
    calls.push(`network:${name}`);
    throw new Error(`Operacao remota proibida neste teste offline: ${name}`);
  };
  class FixtureDate extends Date {
    constructor(...args) { super(...(args.length ? args : [now])); }
    static now() { return now; }
  }
  const context = vm.createContext({
    Date: FixtureDate,
    window: { __simplificaLocalLockActive: false, __simplificaLocalLockReason: "" },
    appConfig: { keepSessionCache: options.keepSessionCache !== false, biometricEnabled: options.biometric === true },
    billingConfig: { lastOnlineLicenseValidationAt: options.licenseAt === null ? "" : new Date(options.licenseAt ?? now - hour).toISOString() },
    syncConfig: { supabaseAccessToken: "", supabaseRefreshToken: "", supabaseUserId: "", supabaseEmail: "" },
    usuarioAtualEmail: options.active ? email : "",
    usuarios: options.users ?? [{ email, ativo: true }],
    localLockModalOpen: false,
    localStorage,
    sessionStorage,
    normalizarEmail: (value) => String(value || "").trim().toLowerCase(),
    normalizarUsuarios: (users) => users,
    estaOnline: () => false,
    isAndroid: () => true,
    ativarEscopoDadosUsuarioAtual: () => calls.push("scope"),
    registrarAtividadeSessao: () => calls.push("activity"),
    salvarDados: () => calls.push("save"),
    mostrarToast: () => calls.push("toast"),
    registrarDiagnostico: () => calls.push("diagnostic"),
    debugInfo: () => {},
    renderApp: () => calls.push("render"),
    fecharPopup: () => calls.push("close-popup"),
    focarCampoSenha: () => calls.push("focus-password"),
    document: { getElementById: () => null },
    requestAnimationFrame: (callback) => queueMicrotask(callback),
    setTimeout: (callback) => queueMicrotask(callback),
    confirmarBiometriaSeDisponivel: async () => {
      calls.push("biometric");
      return options.biometricResult ?? { disponivel: true, ok: false };
    },
    fetch: forbidden("fetch"),
    requisicaoSupabase: forbidden("supabase-request"),
    renovarSessaoSupabase: forbidden("renew-session"),
    agendarSincronizacaoPosRestauracaoSessao: forbidden("schedule-sync"),
    sincronizarLicencaEfetivaSePossivel: forbidden("license-sync"),
    sincronizarFilaOfflinePendente: forbidden("queue-sync")
  });
  vm.runInContext(program, context, { filename: "app.js:offline-session-functions" });
  const cacheKey = vm.runInContext("LOCAL_SESSION_CACHE_KEY", context);
  const unlockKey = vm.runInContext("LOCAL_UNLOCK_KEY", context);
  const cache = options.cache === undefined ? {
    usuarioAtualEmail: email,
    autenticadoEm: new Date(options.authenticatedAt ?? now - hour).toISOString(),
    salvoEm: new Date(now - hour).toISOString(),
    supabase: {
      supabaseUserId: options.uid ?? "synthetic-auth-user",
      supabaseEmail: email,
      supabaseRefreshToken: options.refresh ?? "synthetic-refresh-not-a-real-token",
      supabaseTokenExpiresAt: now + hour
    }
  } : options.cache;
  if (cache !== null) localStorage.setItem(cacheKey, typeof cache === "string" ? cache : JSON.stringify(cache));
  if (options.unlockAt !== null) localStorage.setItem(unlockKey, new Date(options.unlockAt ?? now - hour).toISOString());
  if (options.active) sessionStorage.setItem("usuarioAtualEmail", email);
  if (options.session) sessionStorage.setItem("supabaseSession", JSON.stringify(options.session));
  return {
    context, calls, localStorage, sessionStorage, cacheKey, unlockKey,
    restore: () => context.restaurarCacheSessaoLocal(),
    assertNoRemote: () => assert.deepEqual(calls.filter((call) => call.startsWith("network:")), [], "Restauracao offline nao deve tentar renovar, buscar ou sincronizar")
  };
}

const flushMicrotasks = async () => { for (let index = 0; index < 8; index += 1) await Promise.resolve(); };

async function main() {
  let passed = 0;
  const test = async (name, run) => {
    await run();
    passed += 1;
    console.log(`PASS ${name}`);
  };

  await test("cache desativado nao restaura identidade", async () => {
    const f = fixture({ keepSessionCache: false });
    assert.equal(await f.restore(), false);
    assert.equal(f.context.usuarioAtualEmail, "");
    assert(!f.calls.includes("scope"));
    f.assertNoRemote();
  });

  for (const cache of [null, "{"]) {
    await test(`cache ${cache === null ? "ausente" : "invalido"} nao concede acesso`, async () => {
      const f = fixture({ cache });
      assert.equal(await f.restore(), false);
      assert.equal(f.context.usuarioAtualEmail, "");
      assert.equal(f.context.window.__simplificaLocalLockActive, false);
      f.assertNoRemote();
    });
  }

  for (const active of [false, true]) {
    for (const credential of ["uid", "refresh"]) {
      await test(`${active ? "sessao ativa" : "cache persistido"} sem ${credential} e recusado`, async () => {
        const f = fixture({ active, [credential]: "" });
        assert.equal(await f.restore(), false);
        assert.equal(f.context.usuarioAtualEmail, "");
        assert.equal(f.sessionStorage.getItem("usuarioAtualEmail"), null);
        if (!active) assert.equal(f.localStorage.getItem(f.cacheKey), null);
        f.assertNoRemote();
      });
    }
  }

  for (const active of [false, true]) {
    await test(`${active ? "sessao ativa" : "cache persistido"} no limite de sete dias exige novo login`, async () => {
      const f = fixture({ active, authenticatedAt: now - 7 * day, session: {
        supabaseAccessToken: "synthetic-expired-access",
        supabaseRefreshToken: "synthetic-expired-refresh"
      } });
      assert.equal(await f.restore(), false);
      assert.equal(f.context.usuarioAtualEmail, "");
      assert.equal(f.localStorage.getItem(f.cacheKey), null);
      assert.equal(f.sessionStorage.getItem("supabaseSession"), null);
      assert.equal(f.context.syncConfig.supabaseRefreshToken, "");
      assert.equal(f.context.syncConfig.supabaseAccessToken, "");
      assert(!f.calls.includes("activity"));
      f.assertNoRemote();
    });
  }

  await test("usuario inativo nao e restaurado pelo cache", async () => {
    const f = fixture({ users: [{ email, ativo: false }] });
    assert.equal(await f.restore(), false);
    assert.equal(f.context.usuarioAtualEmail, "");
    assert(!f.calls.includes("scope"));
    f.assertNoRemote();
  });

  for (const active of [false, true]) {
    for (const licenseAt of [null, now - 3 * day - 1]) {
      await test(`${active ? "sessao ativa" : "cache persistido"} com licenca ${licenseAt === null ? "ausente" : "antiga"} fica travado`, async () => {
        const f = fixture({ active, licenseAt, biometric: true });
        assert.equal(await f.restore(), true, "Cache reconhecido nao significa dispositivo desbloqueado");
        assert.equal(f.context.window.__simplificaLocalLockActive, true);
        assert.equal(f.context.window.__simplificaLocalLockReason, "offline-stale-license");
        assert(!f.calls.includes("biometric"), "Biometria nao deve substituir a revalidacao de licenca antiga");
        f.assertNoRemote();
      });
    }
  }

  for (const active of [false, true]) {
    await test(`${active ? "sessao ativa" : "cache persistido"} com licenca recente abre sem trabalho remoto`, async () => {
      const f = fixture({ active, licenseAt: now - 3 * day });
      assert.equal(await f.restore(), true);
      assert.equal(f.context.usuarioAtualEmail, email);
      assert.equal(f.context.window.__simplificaLocalLockActive, false);
      assert.equal(f.context.billingConfig.effectiveLicenseStale, true);
      assert.equal(f.context.billingConfig.effectiveLicenseSource, "backend-rpc-cache-stale");
      assert(f.calls.includes("activity"));
      f.assertNoRemote();
    });
  }

  for (const unlockAt of [null, now - 12 * hour - 1]) {
    await test(`desbloqueio ${unlockAt === null ? "ausente" : "superior a 12 horas"} exige trava local`, async () => {
      const f = fixture({ unlockAt });
      assert.equal(await f.restore(), true);
      assert.equal(f.context.window.__simplificaLocalLockActive, true);
      assert.equal(f.context.window.__simplificaLocalLockReason, "restore-offline");
      assert.equal(f.localStorage.getItem(f.unlockKey), unlockAt === null ? null : new Date(unlockAt).toISOString());
      f.assertNoRemote();
    });
  }

  await test("limite exato de 12 horas preserva a janela atual de desbloqueio", async () => {
    const f = fixture({ unlockAt: now - 12 * hour });
    assert.equal(await f.restore(), true);
    assert.equal(f.context.window.__simplificaLocalLockActive, false);
    f.assertNoRemote();
  });

  await test("biometria pendente e cancelada nunca remove a trava", async () => {
    let resolveBiometric;
    const biometricResult = new Promise((resolve) => { resolveBiometric = resolve; });
    const f = fixture({ biometric: true, unlockAt: now - 13 * hour, biometricResult });
    let settled = false;
    const restoration = f.restore().then((result) => { settled = true; return result; });
    await flushMicrotasks();
    assert(f.calls.includes("biometric"));
    assert.equal(settled, false);
    assert.equal(f.context.window.__simplificaLocalLockActive, true);
    assert(f.calls.indexOf("render") < f.calls.indexOf("biometric"), "A trava deve aparecer antes do prompt nativo");
    resolveBiometric({ disponivel: true, ok: false });
    assert.equal(await restoration, true);
    assert.equal(f.context.window.__simplificaLocalLockActive, true);
    assert.equal(f.localStorage.getItem(f.unlockKey), new Date(now - 13 * hour).toISOString());
    f.assertNoRemote();
  });

  await test("biometria indisponivel mantem a trava", async () => {
    const f = fixture({ biometric: true, unlockAt: null, biometricResult: { disponivel: false, ok: false } });
    assert.equal(await f.restore(), true);
    assert.equal(f.context.window.__simplificaLocalLockActive, true);
    assert.equal(f.localStorage.getItem(f.unlockKey), null);
    f.assertNoRemote();
  });

  await test("somente biometria confirmada renova o desbloqueio", async () => {
    const f = fixture({ biometric: true, unlockAt: null, biometricResult: { disponivel: true, ok: true } });
    assert.equal(await f.restore(), true);
    assert.equal(f.context.window.__simplificaLocalLockActive, false);
    assert.equal(f.localStorage.getItem(f.unlockKey), new Date(now).toISOString());
    f.assertNoRemote();
  });

  console.log(`OFFLINE SESSION RESTORATION: ${passed} casos PASS; funcoes reais, dados sinteticos e nenhuma operacao remota.`);
}

main().catch((error) => { console.error(error); process.exitCode = 1; });
