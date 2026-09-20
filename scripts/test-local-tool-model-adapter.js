"use strict";

const assert = require("node:assert/strict");
require("../src/ai/action-registry.js");
const { LocalToolModelAdapter } = require("../src/ai/local-tool-model-adapter.js");

function runtimeFor(output) {
  return {
    async load() {},
    async warmup() {},
    async generateToolCall() { return output; }
  };
}

(async () => {
  const valid = new LocalToolModelAdapter({ runtime: runtimeFor({ tool: "customers.search", arguments: { query: "Ana" }, confidence: .9 }), modelId: "lfm2.5-1.2b-q4_0" });
  await valid.load();
  assert.equal((await valid.generateToolCall({ command: "buscar Ana", tools: ["customers.search"] })).kind, "TOOL_CALL");

  const missing = new LocalToolModelAdapter({ runtime: runtimeFor({ tool: "customers.search", arguments: {} }), modelId: "lfm2.5-1.2b-q4_0" });
  await missing.load();
  assert.equal((await missing.generateToolCall({ command: "buscar", tools: ["customers.search"] })).reason, "MISSING_REQUIRED_ARGUMENT");

  const unknown = new LocalToolModelAdapter({ runtime: runtimeFor({ tool: "customers.search", arguments: { query: "Ana", injected: true } }), modelId: "lfm2.5-1.2b-q4_0" });
  await unknown.load();
  assert.equal((await unknown.generateToolCall({ command: "buscar Ana", tools: ["customers.search"] })).reason, "UNKNOWN_ARGUMENT");

  const write = new LocalToolModelAdapter({ runtime: runtimeFor({ tool: "orders.commit_create", arguments: {} }), modelId: "lfm2.5-1.2b-q4_0" });
  await write.load();
  assert.equal((await write.generateToolCall({ command: "confirmar", tools: ["orders.commit_create"] })).reason, "NO_ALLOWED_TOOL");
  console.log("Local tool model adapter validates required arguments and keeps WRITE hidden.");
})().catch((error) => { console.error(error); process.exitCode = 1; });
