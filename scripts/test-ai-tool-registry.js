"use strict";
const assert = require("node:assert/strict");
const actions = require("../src/ai/action-registry.js");
global.SimplificaActionRegistry = actions;
const intents = require("../src/ai/intent-registry.js");
global.SimplificaIntentRegistry = intents;
const tools = require("../src/ai/tool-registry.js");

assert.equal(tools.tools.length, 34);
assert.equal(tools.validateToolRegistry().ok, true);
assert.equal(new Set(tools.tools.map((tool) => tool.id)).size, tools.tools.length);
assert.equal(tools.get("orders.create").actionId, "orders.prepare_create");
assert.equal(tools.get("orders.create").modelExposed, true);
assert.equal(tools.get("inventory.low_stock").modelExposed, false);
assert.equal(tools.get("inventory.low_stock").status, "NOT_SUPPORTED");
assert.equal(tools.get("orders.cancel").modelExposed, false);
assert(tools.tools.filter((tool) => tool.modelExposed).every((tool) => actions.get(tool.actionId).operationType !== "WRITE"));
assert(tools.tools.filter((tool) => tool.modelExposed).every((tool) => actions.health(actions.get(tool.actionId)).state === "READY"));
console.log("AI ToolRegistry: semantic profiles, operational action references and exposure policy passed.");
