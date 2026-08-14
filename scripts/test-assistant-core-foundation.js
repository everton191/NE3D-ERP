const assert = require("assert");
const Contracts = require("../src/assistant-core/schemas/contracts.js");
require("../src/assistant-core/context/context-manager.js");
require("../src/assistant-core/memory/conversation-memory.js");
require("../src/assistant-core/cache/cache-manager.js");
require("../src/assistant-core/attachments/image-attachment-store.js");
require("../src/assistant-core/navigation/navigation-registry.js");
require("../src/assistant-core/search/entity-search.js");
require("../src/assistant-core/tools/tool-registry.js");
require("../src/assistant-core/models/model-registry.js");
require("../src/assistant-core/models/model-provider.js");
require("../src/assistant-core/models/pwa-model-artifact-store.js");
require("../src/assistant-core/models/web-local-model-provider.js");
require("../src/assistant-core/models/device-capability-profiler.js");
require("../src/assistant-core/engine/assistant-core.js");
const pack = require("../apps/simplifica/assistant-pack/index.js");
const ruralPack = require("../apps/rural/assistant-pack/index.js");
const tecPack = require("../apps/tec/assistant-pack/index.js");
const storeEditorPack = require("../apps/store-editor/assistant-pack/index.js");

assert.deepStrictEqual(new Set([pack.modelScope, ruralPack.modelScope, tecPack.modelScope, storeEditorPack.modelScope]).size, 4, "cada aplicativo deve isolar seu armazenamento de modelo");

const memoryStorage = (() => { const data = new Map(); return { getItem: (key) => data.get(key) || null, setItem: (key, value) => data.set(key, value) }; })();
const core = new globalThis.UniversalAssistantCore.AssistantCore({ manifest: pack.manifest, storage: memoryStorage });

assert.equal(core.context.contextWindow, 8192);
core.context.register({ screen: "pedido_detalhe", routeId: "orders.list", route: "pedidos", entityRefs: [{ type: "order", id: "1842" }] });
assert.equal(core.context.snapshot().entityRefs[0].id, "1842");
core.context.removeEntityRef("order", "1842");
assert.equal(core.context.snapshot().entityRefs.length, 0);
assert.equal(core.context.selectManifest("procure o pedido atrasado").domains[0].id, "orders");

core.memory.setFact("material", "PETG", "P1").setFact("material", "PLA", "P1");
assert.equal(core.memory.facts.material.value, "PLA");
assert.equal(core.memory.corrections.length, 1);
const conversationId = core.save().conversationId;
assert.equal(core.store.get(conversationId).facts.material.value, "PLA");
const restored = new globalThis.UniversalAssistantCore.AssistantCore({ manifest: pack.manifest, storage: memoryStorage });
assert.equal(restored.memory.conversationId, conversationId);
assert.notEqual(restored.newConversation().conversationId, conversationId);
core.cache.put("search", "orders", [{ id: "1" }], 1000);
assert.equal(core.cache.get("search", "orders")[0].id, "1");

const fuzzy = core.search.search({ query: "chavero corintias", items: [{ id: "1", name: "Chaveiro Corinthians" }], fields: ["name"], minScore: 25 });
assert.equal(fuzzy[0].item.id, "1");

assert.equal(core.navigation.navigate("route.inventada").status, "BLOCKED");
assert.equal(core.navigation.resolve("orders.list").path, "pedidos");

(async () => {
  const unknown = await core.tools.execute("sql.run", {});
  assert.equal(unknown.reason, "UNKNOWN_TOOL");
  core.tools.register({ name: "prepare_create", access: Contracts.ACCESS.WRITE, execute: () => ({}) });
  const write = await core.tools.execute("prepare_create", { entity: "order" });
  assert.equal(write.reason, "WRITE_CAPABILITY_GATE_UNAVAILABLE");

  const models = new globalThis.UniversalAssistantModels.ModelRegistry({ artifacts: [{ id: "leve", displayName: "IA Leve", version: "planned", provider: "android-local", runtime: "litert-lm", available: false, supportedPlatforms: ["android"] }] });
  assert.equal(models.list("android")[0].status, "EXPERIMENTAL");
assert.equal(models.chooseAutomatic({ installedIds: ["leve"], platform: "android" }), null);
  const webProvider = new globalThis.UniversalAssistantWebProvider.WebLocalModelProvider({ navigatorRef: {} });
  const webStatus = await webProvider.status();
  assert.equal(webStatus.available, false);
  assert.match(webStatus.reason, /WebGPU/);
  assert.equal(typeof globalThis.UniversalAssistantAttachments.ImageAttachmentStore, "function");
  console.log("Fundação do Assistant Core universal validada.");
})().catch((error) => { console.error(error); process.exitCode = 1; });
