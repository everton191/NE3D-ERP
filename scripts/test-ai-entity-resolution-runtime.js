"use strict";

const assert = require("node:assert/strict");
require("../src/ai-3d/core.js");
const resolver = require("../src/ai-3d/entity-resolution.js");

const customers = [{ id: "c-1", name: "Ana Silva" }, { id: "c-2", name: "Ana Souza" }];
assert.equal(resolver.resolveEntity({ entityType: "customer", selectedId: "c-1", candidates: customers }).status, "RESOLVED");
const ambiguous = resolver.resolveEntity({ entityType: "customer", query: "Ana", candidates: customers });
assert.equal(ambiguous.status, "AMBIGUOUS");
assert.equal(resolver.resolveEntity({ entityType: "customer", selectedId: "missing", candidates: customers }).status, "NOT_FOUND");
assert.equal(resolver.resolveEntity({ entityType: "customer", query: "Ana" }).status, "NOT_FOUND");
assert.equal(resolver.resolveEntity({ entityType: "roll", selectedId: "r-1" }).status, "GAP_BLOCKED");

const pending = resolver.createPendingResolution({ entityType: "customer", result: ambiguous, workflowGoal: "ORDER.CREATE", currentStep: "CUSTOMER" });
assert.deepEqual(pending.candidates.map((item) => item.id), ["c-1", "c-2"]);
assert.equal(resolver.resumePendingResolution(pending, "invented-id").status, "NOT_FOUND");
const resumed = resolver.resumePendingResolution(pending, "c-2");
assert.equal(resumed.status, "RESOLVED");
assert.equal(resumed.id, "c-2");
assert.equal(resumed.workflowGoal, "ORDER.CREATE");
assert.equal(resumed.currentStep, "CUSTOMER");
console.log("Entity resolution contract: status matrix, pending resolution and safe resume passed.");
