"use strict";

const assert = require("node:assert/strict");
const C = require("../src/ai-3d/core.js");
const E = require("../src/ai-3d/entity-resolution.js");
const { AiOrchestrator3D } = require("../src/ai-3d/orchestrator.js");

const storage = { value: null, getItem() { return this.value; }, setItem(_, value) { this.value = value; } };
const manager = new C.ConversationTaskManager({ storage, storageKey: "agent-runtime-e2e" });
const customers = [{ id: "c-1", name: "Ana Silva" }, { id: "c-2", name: "Ana Souza" }];
const tools = { async execute(name, args) {
  if (name === "customer_search") return { status: C.TOOL_STATUS.AMBIGUOUS, matches: customers };
  if (name === "stock_search") return { status: C.TOOL_STATUS.SUCCESS, matches: [{ id: "m-1", name: args.query, quantity: 2, unit: "kg" }] };
  return { status: C.TOOL_STATUS.NOT_FOUND };
} };
const runtime = new AiOrchestrator3D({ manager, continuationResolver: new C.ContinuationResolver(), contextBuilder: new C.ContextBuilder(), tools, provider: { converse: async () => "fallback" }, entityResolution: E });

(async () => {
  const ambiguous = await runtime.handle("crie pedido de suporte para Ana");
  assert.equal(ambiguous.pendingResolution.status, "AMBIGUOUS");
  assert.equal(manager.session.pendingResolution.workflowGoal, "ORDER.CREATE");
  const resumed = await runtime.handle("c-2");
  assert.equal(resumed.entityResolution.status, "RESOLVED");
  assert.equal(manager.session.activeDraft.customerId.value, "c-2");
  assert.equal(manager.session.pendingResolution, null);
  manager.setPendingResolution(E.createPendingResolution({ entityType: "customer", result: E.resolveEntity({ entityType: "customer", query: "Ana", candidates: customers }), workflowGoal: "ORDER.CREATE", currentStep: "CUSTOMER" }));
  const cancelled = await runtime.handle("cancelar");
  assert.match(cancelled.summary, /descartei/i);
  assert.equal(manager.session.pendingResolution, null);
  console.log("Agent runtime E2E: ambiguous customer, safe resume and cancel passed.");
})().catch((error) => { console.error(error); process.exitCode = 1; });
