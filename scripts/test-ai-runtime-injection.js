"use strict";
const assert = require("node:assert/strict");
require("../src/ai/action-registry.js");
const C = require("../src/ai-3d/core.js");
const { AiOrchestrator3D } = require("../src/ai-3d/orchestrator.js");
const { create } = require("../src/ai/canonical-runtime-bindings.js");
const bindings = create({ readFacade: { searchCustomers: () => [{ id: "c-1", name: "Ana" }] } });
const options = { manager: new C.ConversationTaskManager(), continuationResolver: new C.ContinuationResolver(), contextBuilder: new C.ContextBuilder(), tools: { execute: async () => ({ status: "NOT_FOUND" }) }, provider: { converse: async () => "" } };
const runtime = new AiOrchestrator3D({ ...options, canonicalBindings: bindings });
assert.strictEqual(runtime.canonicalBindings, bindings);
assert.equal(runtime.executeCanonical("customers.search", { query: "Ana" }).items[0].id, "c-1");
assert.equal(runtime.executeCanonical("orders.commit_create", {}).reason, "WRITE_DISABLED");
assert.equal(runtime.executeCanonical("unknown.action", {}).reason, "UNKNOWN_ACTION");
assert.equal(new AiOrchestrator3D(options).executeCanonical("customers.search", {}).reason, "CANONICAL_BINDINGS_UNAVAILABLE");
const routed = new AiOrchestrator3D({ ...options, canonicalBindings: bindings, entityResolution: require("../src/ai-3d/entity-resolution.js") });
routed.runTool("CUSTOMER.SEARCH", { query: "Ana" }, {}).then((result) => {
  assert.equal(result.customer.id, "c-1", "customer lookup must traverse the injected canonical binding");
  console.log("Canonical bindings are injected once into the existing runtime and fail closed.");
}).catch((error) => { console.error(error); process.exitCode = 1; });
