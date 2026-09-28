"use strict";
const assert = require("assert");
const fs = require("fs");
const path = require("path");
const corpus = require("../src/ai/ptbr-evaluation-corpus.js");
const runs = new Map(); let sequence = 0;
function bridge() {
  const state = (id) => { const run = runs.get(id); if (!run) throw new Error("EVALUATION_RUN_NOT_FOUND"); return { runId: id, status: run.status, completed: run.records.length, caseIds: run.records.map((r) => r.caseId) }; };
  return {
    createNeedleEvaluationRun: async ({ totalCases, caseIds }) => { const runId = `run-00000000-0000-0000-0000-${String(++sequence).padStart(12, "0")}`; runs.set(runId, { caseIds, totalCases, records: [], status: "RUNNING" }); return state(runId); },
    getNeedleEvaluationRun: async ({ runId }) => state(runId),
    interruptNeedleEvaluationRun: async ({ runId }) => { runs.get(runId).status = "INTERRUPTED"; return state(runId); },
    resumeNeedleEvaluationRun: async ({ runId }) => { runs.get(runId).status = "RUNNING"; return state(runId); },
    appendNeedleEvaluationCase: async ({ runId, result }) => { const run = runs.get(runId); assert(run.caseIds.includes(result.caseId), "unknown case"); if (run.records.some((item) => item.caseId === result.caseId)) throw new Error("EVALUATION_DUPLICATE_CASE"); run.records.push(result); return state(runId); },
    finalizeNeedleEvaluationRun: async ({ runId }) => { const run = runs.get(runId); const missingCaseIds = run.caseIds.filter((id) => !run.records.some((r) => r.caseId === id)); run.status = missingCaseIds.length ? "INCOMPLETE" : "COMPLETED"; return { ...state(runId), expected: run.totalCases, missingCaseIds }; }
  };
}
global.Capacitor = { Plugins: { SimplificaNeedle: bridge() } };
global.SimplificaAiRuntimeLoader = { isAiRuntimeReady: () => ({ ready: true, missing: [] }) };
global.SimplificaPtbrEvaluationCorpus = { cases: corpus.cases.slice(0, 5) };
global.SimplificaNeedleShadow = { shadow: async () => ({ skipped: false, retrieval: { diagnostics: { intent: "navigation.open", routeConfidence: 1 } }, deterministicValues: {}, comparison: { needleDecision: { toolId: "navigation.open", arguments: {}, inventedIdFields: [] }, needleConfidence: 1 }, mergedArguments: { fields: {} }, result: { inferenceMs: 1 } }) };
const evaluation = require("../src/ai/needle-persisted-evaluation.js");
(async () => {
  const first = await evaluation.run({ maxCases: 2 }); assert.equal(first.completed, 2, "checkpoint after interruption");
  assert.equal(first.status, "INTERRUPTED", "interrupted run is explicit");
  const resumed = await evaluation.resume(first.runId, { maxCases: 3 }); assert.equal(resumed.completed, 5, "resume preserves prior cases");
  await assert.rejects(() => global.Capacitor.Plugins.SimplificaNeedle.appendNeedleEvaluationCase({ runId: first.runId, result: { caseId: corpus.cases[0].id } }), /DUPLICATE/);
  const completed = await evaluation.finalize(first.runId); assert.equal(completed.status, "COMPLETED"); assert.equal(completed.missingCaseIds.length, 0);
  const partial = await evaluation.createRun(corpus.cases.slice(0, 5)); await global.Capacitor.Plugins.SimplificaNeedle.appendNeedleEvaluationCase({ runId: partial.runId, result: { caseId: corpus.cases[0].id } });
  const incomplete = await evaluation.finalize(partial.runId); assert.equal(incomplete.status, "INCOMPLETE"); assert.equal(incomplete.missingCaseIds.length, 4);
  const kotlin = fs.readFileSync(path.join(__dirname, "../android/app/src/main/java/br/com/ne3d/erp/SimplificaNeedlePlugin.kt"), "utf8");
  ["createNeedleEvaluationRun", "appendNeedleEvaluationCase", "getNeedleEvaluationRun", "interruptNeedleEvaluationRun", "resumeNeedleEvaluationRun", "finalizeNeedleEvaluationRun", "getNeedleEvaluationSummary", "EVALUATION_DUPLICATE_CASE", "summary.json", "filesDir"].forEach((token) => assert(kotlin.includes(token), `missing native contract: ${token}`));
  console.log("needle persisted evaluation contract: PASS");
})().catch((error) => { console.error(error); process.exitCode = 1; });
