const fs = require("fs");
const vm = require("node:vm");

const app = fs.readFileSync("app.js", "utf8");
const sw = fs.readFileSync("sw.js", "utf8");
const bootstrap = fs.readFileSync("src/app/bootstrap.js", "utf8");
const editor = fs.readFileSync("src/features/storefront/storefront-editor.js", "utf8");
const source = `${app}\n${sw}\n${bootstrap}\n${editor}`;

const required = [
  "simplifica-storefront-admin-autosave-v1",
  "simplifica-storefront-admin-recovery-v1",
  "simplifica-storefront-admin-offline-queue-v1",
  "getStorefrontSessionRecoveryState",
  "restaurarStorefrontAutosaveLocal",
  "descartarStorefrontAutosaveLocal"
];

const missing = required.filter((item) => !source.includes(item));
if (!/const CACHE_NAME = "simplifica-3d-v\d+-[^"]+";/.test(sw)) {
  missing.push("cache PWA versionado");
}

if (missing.length) throw new Error(`Recovery/offline incompleto: ${missing.join(", ")}`);

async function main() {
  const handlers = new Map();
  const window = {
    addEventListener: (event, handler) => handlers.set(event, handler),
    clearTimeout: () => {},
    setTimeout: () => {}
  };
  const document = { addEventListener: () => {} };
  vm.runInNewContext(bootstrap, { window });
  let signedIn = true;
  const calls = [];
  const sync = { autoBackupStatus: "" };
  window.SimplificaAppBootstrap.start({
    document,
    getUsuarioAtual: () => signedIn ? { id: "owner-test" } : null,
    salvarRascunhoPedidoRapidoLocal: () => calls.push("draft"),
    atualizarStorefrontConnectionBadge: () => calls.push("badge"),
    getStorefrontAutosaveDraft: () => ({ scope: "product" }),
    storefrontQueuePendingAction: (type, recovery) => calls.push(`queue:${type}:${recovery.tab}`),
    getStorefrontSessionRecoveryState: () => ({ tab: "product" }),
    recomporFilaSyncPendente: () => calls.push("requeue"),
    getSyncConfig: () => sync,
    salvarDados: () => calls.push("save"),
    atualizarIndicadorSincronizacao: (state) => calls.push(`indicator:${state}`),
    mostrarToast: () => {},
    storefrontFlushPendingQueue: async () => { calls.push("flush"); return { pending: false }; },
    sincronizarLojaOnlineAdminRemoto: async () => calls.push("remote"),
    sincronizarLicencaEfetivaSePossivel: async () => calls.push("license"),
    sincronizarAlteracoesLocaisSilencioso: async () => calls.push("sync"),
    carregarPromocoes3d: async () => {},
    registrarDiagnostico: () => {}
  });
  if (!handlers.has("offline") || !handlers.has("online")) {
    throw new Error("Bootstrap deve registrar eventos reais de rede.");
  }
  handlers.get("offline")();
  if (!calls.includes("queue:session-offline-recovery:product") || sync.autoBackupStatus !== "Offline - fila pendente") {
    throw new Error("Offline deve preservar rascunho e enfileirar recuperação.");
  }
  handlers.get("online")();
  await new Promise((resolve) => setImmediate(resolve));
  if (!["flush", "remote", "license", "sync", "indicator:syncing"].every((call) => calls.includes(call))) {
    throw new Error("Reconexão deve descarregar fila e retomar sincronização.");
  }
  const previous = calls.length;
  signedIn = false;
  handlers.get("offline")();
  handlers.get("online")();
  if (calls.length !== previous) throw new Error("Sem sessão, eventos de rede não devem alterar a loja.");
  console.log("Storefront offline/recovery: eventos, rascunho, fila, reconexão e cache PWA validados.");
}

main().catch((error) => { console.error(error.message); process.exitCode = 1; });
