"use strict";
const assert = require("assert");
require("../src/ai/action-registry.js");
require("../src/ai/tool-calling-model.js");
const { FunctionGemmaAdapter, resolveMode } = require("../src/ai/functiongemma-adapter.js");

(async () => {
  let now = 0;
  const runtime = { load: async () => { now += 5; }, warmup: async () => { now += 3; }, generateToolCall: async () => { now += 7; return { tool: "inventory.search", arguments: { query: "PLA preto" }, confidence: 0.93 }; } };
  const adapter = new FunctionGemmaAdapter({ runtime, mode: "functiongemma", shadow: true, clock: () => now });
  await adapter.load(); await adapter.warmup();
  const call = await adapter.generateToolCall({ command: "qnt tem de pla preto", tools: ["inventory.search", "inventory.consume"] });
  assert.strictEqual(call.tool, "inventory.search"); assert.strictEqual(call.shadow, true); assert.strictEqual(call.confidence, 0.93);
  assert.strictEqual(adapter.allowedTools(["inventory.search", "inventory.consume"]).some((item) => item.operationType === "WRITE"), false);
  assert.strictEqual(adapter.getMetrics().calls, 1); assert.strictEqual(resolveMode({ AI_TOOL_MODEL: "legacy" }), "disabled"); assert.strictEqual(resolveMode({ AI_TOOL_MODEL: "unknown" }), "disabled");
  runtime.generateToolCall = async () => ({ tool: "orders.cancel", arguments: {}, confidence: 1 });
  const blocked = await adapter.generateToolCall({ command: "cancela", tools: ["inventory.search"] });
  assert.strictEqual(blocked.kind, "NO_TOOL"); assert.strictEqual(blocked.reason, "TOOL_OUTSIDE_TOP_K");
  console.log("FunctionGemma development shadow adapter contract passed.");
})().catch((error) => { console.error(error); process.exitCode = 1; });
