const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const app = fs.readFileSync(path.join(__dirname, "..", "app.js"), "utf8");
const start = app.indexOf("function getPlanPresentationOverrides()");
const end = app.indexOf("function getPlanPresentationData(options", start);
assert(start >= 0 && end > start, "funções reais de apresentação não encontradas");
const source = app.slice(start, end);

function createContext(options = {}) {
  const storage = new Map();
  const server = {
    free: { name: "Free", headline: "Grátis" },
    start: { name: "Start", headline: "Inicial" },
    pro: { name: "Pro", headline: "Completo" }
  };
  const calls = [];
  let authorized = options.authorized !== false;
  let offline = false;
  let staleRead = false;
  const context = vm.createContext({
    syncConfig: { supabaseUrl: "https://example.invalid" },
    localStorage: {
      getItem: (key) => storage.get(key) ?? null,
      setItem: (key, value) => storage.set(key, value)
    },
    mostrarToast() {}, renderApp() {},
    podeSalvarAdminSupabaseRemoto: () => authorized,
    window: { SimplificaSaasAdmin: { carregarCatalogoPlanosSuperadminRemoto: async () => ({}) } },
    getSaasAdminDeps: () => ({}),
    requisicaoSupabase: async (url, request = {}) => {
      calls.push({ url, request });
      if (offline) throw new Error("rede indisponível");
      if (request.method === "POST") {
        const { p_slug, p_changes } = JSON.parse(request.body);
        server[p_slug] = { ...server[p_slug], ...p_changes };
        return { slug: p_slug, presentation: server[p_slug], updated_at: new Date().toISOString() };
      }
      return Object.entries(server).map(([slug, presentation]) => ({
        slug, metadata: { presentation: staleRead && slug === "start"
          ? { ...presentation, headline: "Desatualizado" } : presentation }
      }));
    }
  });
  vm.runInContext("let planPresentationRemoteOverrides = null; let planPresentationRemoteState = { status: 'idle', message: '' };", context);
  vm.runInContext(source, context);
  return {
    context, calls, storage, server,
    setAuthorized: (value) => { authorized = value; },
    setOffline: (value) => { offline = value; },
    setStaleRead: (value) => { staleRead = value; },
    run: (code) => vm.runInContext(code, context)
  };
}

async function main() {
  const t = createContext();
  await t.run("carregarApresentacaoPlanosRemota({ renderizar: false })");
  assert.equal(t.run("getPlanPresentationOverrides().start.headline"), "Inicial");
  await t.run("salvarApresentacaoPlanoSuperadmin('start', { name: 'Start Plus', headline: 'Nova oferta' })");
  assert.equal(t.server.start.name, "Start Plus");
  assert.equal(t.run("getPlanPresentationOverrides().start.headline"), "Nova oferta");
  assert(t.calls.some((call) => call.url.includes("superadmin_update_plan_presentation")));

  const secondDevice = createContext();
  secondDevice.server.start = { ...t.server.start };
  await secondDevice.run("carregarApresentacaoPlanosRemota({ renderizar: false })");
  assert.equal(secondDevice.run("getPlanPresentationOverrides().start.name"), "Start Plus");

  t.setStaleRead(true);
  await assert.rejects(t.run("salvarApresentacaoPlanoSuperadmin('start', { headline: 'Confirmar' })"), /não confirmou/);
  t.setStaleRead(false);
  t.setOffline(true);
  await assert.rejects(t.run("carregarApresentacaoPlanosRemota({ renderizar: false })"), /rede indisponível/);
  assert.equal(t.run("getPlanPresentationOverrides().start.headline"), "Nova oferta");

  const unauthorized = createContext({ authorized: false });
  await assert.rejects(unauthorized.run("salvarApresentacaoPlanoSuperadmin('pro', { name: 'Outro' })"), /superadmin/);
  assert.equal(unauthorized.calls.length, 0);
  console.log("Plan presentation persistence tests OK (save, readback, second device, offline, denied access)");
}

main().catch((error) => { console.error(error); process.exitCode = 1; });
