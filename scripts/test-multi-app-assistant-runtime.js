const assert = require("assert");

require("../src/assistant-core/schemas/contracts.js");
require("../src/assistant-core/context/context-manager.js");
require("../src/assistant-core/memory/conversation-memory.js");
require("../src/assistant-core/cache/cache-manager.js");
require("../src/assistant-core/attachments/image-attachment-store.js");
require("../src/assistant-core/navigation/navigation-registry.js");
require("../src/assistant-core/search/entity-search.js");
require("../src/assistant-core/tools/tool-registry.js");
require("../src/assistant-core/ui-contracts/components.js");
require("../src/assistant-core/security/privacy-policy.js");
require("../src/assistant-core/models/model-provider.js");
require("../src/assistant-core/models/pwa-model-artifact-store.js");
require("../src/assistant-core/models/web-local-model-provider.js");
require("../src/assistant-core/engine/assistant-core.js");
require("../src/assistant-core/engine/app-assistant-runtime.js");

const packs = [
  require("../apps/simplifica/assistant-pack/index.js"),
  require("../apps/rural/assistant-pack/index.js"),
  require("../apps/tec/assistant-pack/index.js"),
  require("../apps/store-editor/assistant-pack/index.js")
];

function createStorage() {
  const data = new Map();
  return {
    getItem(key) { return data.has(key) ? data.get(key) : null; },
    setItem(key, value) { data.set(key, String(value)); },
    removeItem(key) { data.delete(key); },
    keys() { return [...data.keys()]; }
  };
}

function adaptersFor(pack) {
  return Object.fromEntries(pack.tools.map((tool) => [
    tool.adapter,
    async (input) => ({ appId: pack.manifest.appId, tool: tool.name, input })
  ]));
}

(async () => {
  const storage = createStorage();
  const runtimeOptions = {
    storage,
    artifactStore: { status: async () => ({ state: "NOT_INSTALLED", verified: false }) },
    navigatorRef: {},
    writePipeline: { prepare: async ({ type, payload }) => ({ status: "AWAITING_CONFIRMATION", type, payload }) }
  };
  const runtimes = packs.map((pack) => pack.createRuntime(runtimeOptions));

  assert.equal(new Set(runtimes.map((runtime) => runtime.appId)).size, 4, "appId deve ser exclusivo");
  assert.equal(new Set(runtimes.map((runtime) => runtime.modelScope)).size, 4, "modelScope deve ser exclusivo");
  assert.equal(new Set(runtimes.map((runtime) => runtime.modelProvider.settingsKey)).size, 4, "configuração de modelo deve ser isolada");
  assert.equal(new Set(runtimes.map((runtime) => runtime.core.store.key)).size, 4, "conversas devem ser isoladas");
  assert.equal(new Set(runtimes.map((runtime) => runtime.core.cache.prefix)).size, 4, "cache deve ser isolado");

  for (const runtime of runtimes) {
    const readiness = runtime.bindAdapters(adaptersFor(runtime.pack));
    assert.equal(readiness.ready, true, `${runtime.appId} deve registrar todos os adaptadores`);
    assert.equal(readiness.missing.length, 0);
    assert.match(runtime.ui.launcher(), new RegExp(`data-assistant-app="${runtime.appId}"`));

    runtime.core.memory.setFact("isolation", runtime.appId, "P1");
    runtime.core.save();
    runtime.core.cache.put("shared-kind", "same-id", runtime.appId);
    runtime.modelProvider.writeSettings({ selection: `${runtime.appId}-model` });

    const readTool = runtime.pack.tools.find((tool) => tool.access === "READ");
    const result = await runtime.executeTool(readTool.name, { source: runtime.appId });
    assert.equal(result.status, "SUCCESS");
    assert.equal(result.data.appId, runtime.appId);
    assert.equal(runtime.privacyDecision({ mode: "LOCAL_WEB" }).allowed, true);
    assert.equal(runtime.privacyDecision({ mode: "REMOTE", explicitConsent: true }).allowed, false);
  }

  for (const runtime of runtimes) {
    const restored = runtime.pack.createRuntime(runtimeOptions);
    assert.equal(restored.core.memory.facts.isolation.value, runtime.appId, "memória não pode atravessar aplicativos");
    assert.equal(restored.core.cache.get("shared-kind", "same-id"), runtime.appId, "cache não pode atravessar aplicativos");
    assert.equal(restored.modelProvider.readSettings().selection, `${runtime.appId}-model`, "seleção de modelo não pode atravessar aplicativos");
  }

  const [simplifica, rural, tec, store] = runtimes;
  assert.equal(simplifica.navigate("calculator").status, "SUCCESS");
  assert.equal(simplifica.navigate("rural.home").status, "BLOCKED");
  assert.equal(rural.navigate("rural.milkDiary").status, "SUCCESS");
  assert.equal(rural.navigate("tec.home").status, "BLOCKED");
  assert.equal(tec.navigate("tec.serviceOrders").status, "SUCCESS");
  assert.equal(tec.navigate("store.editor").status, "BLOCKED");
  assert.equal(store.navigate("store.products").status, "SUCCESS");
  assert.equal(store.navigate("orders.list").status, "BLOCKED");

  assert.equal(store.pack.manifest.capabilities.some((capability) => capability.access === "WRITE"), false, "Editor da Loja deve permanecer somente leitura");
  assert.equal(store.pack.tools.some((tool) => tool.access === "WRITE"), false, "Editor da Loja não pode registrar tool de escrita");
  assert.equal(storage.keys().some((key) => !runtimes.some((runtime) => key.startsWith(`assistant:${runtime.appId}:`) || key.startsWith(`${runtime.appId}:assistant-web-model:`))), false);

  console.log("Runtime universal isolado validado para Simplifica 3D, Rural, Tec e Editor da Loja.");
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
