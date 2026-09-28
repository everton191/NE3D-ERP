(function attachNeedlePersistedEvaluation(global) {
  "use strict";

  const native = () => global.Capacitor?.Plugins?.SimplificaNeedle;
  const emptyRecord = (item) => ({
    caseId: item.id, split: item.split, status: "PENDING", expectedIntent: item.expectedIntent,
    actualIntent: "", intentMatch: false, expectedTool: item.expectedTool || "", needleTool: "",
    toolMatch: false, deterministicArgs: {}, needleArgs: {}, mergedArgs: {}, requiredArgsMatch: false,
    criticalArgsMatch: false, strictArgsMatch: false, optionalExtraFields: [], unresolvedIdAttempt: false,
    candidateTools: [], candidateExpected: false, invalidTool: false, financialProvenanceViolations: [],
    hallucinatedFinancialValue: false, routeConfidence: null, needleConfidence: null,
    latency: { totalMs: 0, needleInferenceMs: 0 }, errorCode: ""
  });
  const matchesFields = (actual, expected, keys) => keys.every((key) => actual?.[key] === expected?.[key]);
  const recordFromShadow = (item, result, totalMs) => {
    const record = emptyRecord(item);
    const retrieval = result.retrieval || {};
    const comparison = result.comparison || {};
    const needle = comparison.needleDecision || {};
    const merged = result.mergedArguments?.fields || {};
    const critical = item.criticalFields || [];
    const expected = item.expectedFields || {};
    const required = Object.keys(expected);
    const extra = Object.keys(needle.arguments || {}).filter((key) => !(key in expected));
    return {
      ...record,
      status: result.skipped ? result.reason || "SKIPPED" : "COMPLETED",
      actualIntent: retrieval.diagnostics?.intent || "",
      intentMatch: retrieval.diagnostics?.intent === item.expectedIntent,
      needleTool: needle.toolId || "",
      toolMatch: (needle.toolId || "") === (item.expectedTool || ""),
      deterministicArgs: result.deterministicValues || {}, needleArgs: needle.arguments || {}, mergedArgs: merged,
      requiredArgsMatch: matchesFields(merged, expected, required), criticalArgsMatch: matchesFields(merged, expected, critical),
      strictArgsMatch: matchesFields(merged, expected, required) && !extra.length,
      optionalExtraFields: extra, unresolvedIdAttempt: (needle.inventedIdFields || []).length > 0,
      candidateTools: comparison.candidateTools || [], candidateExpected: !!item.expectedTool && (comparison.candidateTools || []).includes(item.expectedTool), invalidTool: !!needle.invalidTool,
      financialProvenanceViolations: (result.mergedArguments?.conflicts || []).filter((value) => String(value).startsWith("FINANCIAL_VALUE_WITHOUT_PROVENANCE:")),
      hallucinatedFinancialValue: Object.entries(merged).some(([name, field]) => field?.source === "MODEL_INFERENCE" && /(?:price|amount|value|valor|preco|desconto|total)/i.test(name)),
      routeConfidence: retrieval.diagnostics?.routeConfidence ?? null, needleConfidence: comparison.needleConfidence ?? null,
      latency: { totalMs: Math.round(totalMs), needleInferenceMs: result.result?.inferenceMs || comparison.latency || 0 }
    };
  };
  async function createRun(corpus) {
    const bridge = native();
    if (!bridge?.createNeedleEvaluationRun) throw new Error("EVALUATION_PERSISTENCE_UNAVAILABLE");
    return bridge.createNeedleEvaluationRun({ totalCases: corpus.length, caseIds: corpus.map((item) => item.id) });
  }
  async function run({ runId = "", maxCases = Number.POSITIVE_INFINITY, caseLimit = 0 } = {}) {
    const readiness = global.SimplificaAiRuntimeLoader?.isAiRuntimeReady?.();
    if (!readiness?.ready) { const error = new Error(`AI_RUNTIME_NOT_READY:${readiness?.missing?.join(",") || "loader"}`); error.code = "AI_RUNTIME_NOT_READY"; error.missing = readiness?.missing || ["AiRuntimeLoader"]; throw error; }
    const allCases = global.SimplificaPtbrEvaluationCorpus?.cases || [];
    const corpus = caseLimit > 0 ? allCases.slice(0, caseLimit) : allCases;
    const bridge = native();
    if (!corpus.length || !bridge?.appendNeedleEvaluationCase || !bridge?.getNeedleEvaluationRun) throw new Error("EVALUATION_PERSISTENCE_UNAVAILABLE");
    const state = runId ? await bridge.getNeedleEvaluationRun({ runId }) : await createRun(corpus);
    if (state.status !== "RUNNING") return state;
    const completed = new Set(state.caseIds || []);
    let executed = 0;
    for (const item of corpus) {
      if (completed.has(item.id) || executed >= maxCases) continue;
      const started = performance.now();
      let record;
      try {
        const result = await global.SimplificaNeedleShadow.shadow({ input: item.rawInput, contextSnapshot: item.context, workflowState: item.activeWorkflow ? { intent: item.activeWorkflow } : {}, currentDecision: {} });
        record = recordFromShadow(item, result, performance.now() - started);
      } catch (error) {
        record = { ...emptyRecord(item), status: "FAILED", latency: { totalMs: Math.round(performance.now() - started), needleInferenceMs: 0 }, errorCode: "EVALUATION_CASE_FAILED" };
      }
      await bridge.appendNeedleEvaluationCase({ runId: state.runId, result: record });
      completed.add(item.id); executed += 1;
    }
    const current = await bridge.getNeedleEvaluationRun({ runId: state.runId });
    if (executed >= maxCases && current.completed < corpus.length && bridge.interruptNeedleEvaluationRun) return bridge.interruptNeedleEvaluationRun({ runId: state.runId });
    return current;
  }
  async function finalize(runId) {
    const bridge = native();
    if (!bridge?.finalizeNeedleEvaluationRun) throw new Error("EVALUATION_PERSISTENCE_UNAVAILABLE");
    return bridge.finalizeNeedleEvaluationRun({ runId });
  }
  async function resume(runId, options = {}) { const bridge = native(); if (bridge?.resumeNeedleEvaluationRun) await bridge.resumeNeedleEvaluationRun({ runId }); return run({ ...options, runId }); }
  const api = Object.freeze({ createRun, run, resume, finalize, recordFromShadow, emptyRecord });
  global.SimplificaNeedlePersistedEvaluation = api;
  if (typeof module !== "undefined" && module.exports) module.exports = api;
})(typeof window !== "undefined" ? window : globalThis);
