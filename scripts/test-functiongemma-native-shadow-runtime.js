"use strict";
const assert = require("assert");
global.window = globalThis;
const calls = [];
global.Capacitor = { Plugins: { SimplificaLocalAi: {
  loadFunctionGemma: async () => ({ ok: true, metrics: { backend: "armv8.2+dotprod" } }),
  warmupFunctionGemma: async () => ({ ok: true, metrics: { warmupMs: 20 } }),
  predictFunctionGemma: async (request) => {
    calls.push(request);
    assert.ok(request.tools.length >= 1 && request.tools.length <= 3);
    assert.ok(request.tools.every((tool) => tool.operationType !== "WRITE"));
    const navigation = request.tools.find((tool) => tool.wireName === "navigation_open_orders");
    return navigation
      ? { ok: true, kind: "TOOL_CALL", tool: "navigation.open", wireTool: navigation.wireName, arguments: { tela: "pedidos" }, reason: "VALIDATED", metrics: { ttftMs: 100 } }
      : { ok: true, kind: "NO_TOOL", reason: "MODEL_NO_TOOL", arguments: {}, metrics: { ttftMs: 100 } };
  }
} } };

require("../src/ai/action-registry.js");
require("../src/ai/action-search.js");
require("../src/ai/deterministic-router.js");
require("../src/ai/ai-telemetry.js");
require("../src/ai/tool-calling-model.js");
require("../src/ai/functiongemma-adapter.js");
require("../src/ai/functiongemma-native-runtime.js");
require("../src/services/simplifica3dAiRuntime.js");

(async () => {
  const inventorySpec = global.SimplificaFunctionGemmaNativeRuntime.toolSpec(
    global.SimplificaActionRegistry.get("inventory.search"), "quanto tenho de PLA preto"
  );
  assert.deepStrictEqual(inventorySpec.properties.map((item) => item.name), ["query"]);
  assert.deepStrictEqual(inventorySpec.requiredAll, ["query"]);
  assert.strictEqual(inventorySpec.properties[0].description, "Material ou rolo que deve ser procurado.");
  const opened = await global.Simplifica3dAiRuntime.predictToolShadow("abre os pedidos", { screen: "dashboard" });
  assert.strictEqual(opened.kind, "TOOL_CALL");
  assert.strictEqual(opened.tool, "navigation.open");
  assert.deepStrictEqual(opened.arguments, { tela: "pedidos" });
  assert.strictEqual(opened.reason, "DETERMINISTIC_INTENT");
  assert.strictEqual(opened.diagnostics.modelInvoked, false);
  assert.strictEqual(calls.length, 0, "navegacao inequívoca não deve carregar nem invocar o modelo");

  const inventory = await global.Simplifica3dAiRuntime.predictToolShadow("quanto tenho de PLA preto", { screen: "inventory.list" });
  assert.strictEqual(inventory.kind, "TOOL_CALL");
  assert.strictEqual(inventory.tool, "inventory.search");
  assert.strictEqual(calls.length, 0, "consulta inequívoca de estoque não deve invocar o modelo");

  const ambiguous = await global.Simplifica3dAiRuntime.predictToolShadow("abre lá", { screen: "dashboard" });
  assert.strictEqual(ambiguous.kind, "NO_TOOL");
  assert.strictEqual(ambiguous.reason, "NO_SEMANTIC_TOP_K_MATCH");
  assert.strictEqual(calls.length, 0, "ambiguous navigation must be rejected before JNI");

  const negated = await global.Simplifica3dAiRuntime.predictToolShadow("não mostra pedidos atrasados", { screen: "orders.list" });
  assert.strictEqual(negated.kind, "NO_TOOL");
  assert.strictEqual(negated.reason, "NEGATED_COMMAND");
  const hypothetical = await global.Simplifica3dAiRuntime.predictToolShadow("se eu pedir para abrir pedidos, o que acontece?", { screen: "orders.list" });
  assert.strictEqual(hypothetical.kind, "NO_TOOL");
  assert.strictEqual(hypothetical.reason, "HYPOTHETICAL_REQUEST");
  assert.strictEqual(calls.length, 0, "non-executable utterances must never reach JNI");
  console.log("FunctionGemma native shadow routing contract passed.");
})().catch((error) => { console.error(error); process.exitCode = 1; });
