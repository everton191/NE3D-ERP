"use strict";

const assert = require("node:assert/strict");
global.window = global;
require("../src/ai/action-registry.js");
require("../src/ai/action-search.js");
require("../src/ai/deterministic-router.js");
require("../src/ai/workflow-tool-graph.js");
require("../src/services/simplifica3dAiRuntime.js");

global.__SIMPLIFICA_AI_TOOL_MODEL__ = "lfm2.5-1.2b-q4_0";
const lfm = global.Simplifica3dAiRuntime.modelSelection();
assert.equal(lfm.selected, "lfm2.5-1.2b-q4_0");
assert.equal(lfm.writeExposed, 0);
assert.equal(global.Simplifica3dAiRuntime.predictTool("confirmar pedido").then instanceof Function, true);
global.Simplifica3dAiRuntime.predictTool("confirmar pedido").then((prediction) => {
  assert.notEqual(prediction.tool, "orders.commit_create");
  console.log("LFM runtime contract keeps WRITE unavailable to the model.");
}).catch((error) => { console.error(error); process.exitCode = 1; });
