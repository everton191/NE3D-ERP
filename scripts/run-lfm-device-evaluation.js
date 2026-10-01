"use strict";

const fs = require("node:fs");
const path = require("node:path");
const { execFileSync } = require("node:child_process");
const defaultCorpus = require("../src/ai/ptbr-evaluation-corpus.js");

const PACKAGE = "br.com.ne3d.erp";
const splitArg = process.argv.find((value) => value.startsWith("--split="));
const split = splitArg ? splitArg.slice("--split=".length) : "tuning";
const modeArg = process.argv.find((value) => value.startsWith("--mode="));
const mode = (modeArg ? modeArg.slice("--mode=".length) : "C").toUpperCase();
if (!new Set(["A", "B", "C"]).has(mode)) throw new Error("LFM_EVALUATION_MODE_INVALID");
const datasetArg = process.argv.find((value) => value.startsWith("--dataset="));
const datasetPath = datasetArg ? path.resolve(datasetArg.slice("--dataset=".length)) : "";
const corpus = datasetPath ? require(datasetPath) : defaultCorpus;
const cases = corpus.cases.filter((item) => item.split === split);
if (!cases.length) throw new Error("LFM_EVALUATION_SPLIT_EMPTY");
const adbPath = process.env.ANDROID_ADB || `${process.env.LOCALAPPDATA || ""}\\Android\\Sdk\\platform-tools\\adb.exe`;
const outputDir = path.resolve(__dirname, "..", "reports", "ai", "lfm25-evaluation");
const datasetId = corpus.datasetId || "ptbr-80";
const runId = `lfm25-${datasetId}-${split}-mode-${mode}-${new Date().toISOString().replace(/[:.]/g, "-")}`;
const outputPath = path.join(outputDir, `${runId}.json`);

function adb(...args) { return execFileSync(adbPath, args, { encoding: "utf8" }).trim(); }
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function evaluate(url, expression, timeoutMs = 90000) {
  const socket = new WebSocket(url);
  await new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error("CDP_CONNECT_TIMEOUT")), 5000);
    socket.addEventListener("open", () => { clearTimeout(timer); resolve(); }, { once: true });
    socket.addEventListener("error", () => { clearTimeout(timer); reject(new Error("CDP_CONNECT_FAILED")); }, { once: true });
  });
  const value = await new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error("CDP_EVALUATION_TIMEOUT")), timeoutMs);
    socket.addEventListener("message", (event) => {
      const message = JSON.parse(String(event.data));
      if (message.id !== 1) return;
      clearTimeout(timer);
      if (message.result?.exceptionDetails) reject(new Error(message.result.exceptionDetails.exception?.description || message.result.exceptionDetails.text));
      else resolve(message.result?.result?.value);
    });
    socket.send(JSON.stringify({ id: 1, method: "Runtime.evaluate", params: { expression, awaitPromise: true, returnByValue: true } }));
  });
  socket.close();
  return value;
}

function percentile(values, quantile) {
  if (!values.length) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  return sorted[Math.min(sorted.length - 1, Math.max(0, Math.ceil(sorted.length * quantile) - 1))];
}

function matrix(records) {
  const result = {};
  for (const item of records) {
    const expected = item.expectedIntent || "NO_MATCH";
    const predicted = item.predictedIntent || "NO_MATCH";
    result[expected] ||= {};
    result[expected][predicted] = (result[expected][predicted] || 0) + 1;
  }
  return result;
}

function percentage(numerator, denominator) { return denominator ? Number(((numerator / denominator) * 100).toFixed(2)) : 0; }

function ratioMetric(numerator, denominator) { return { numerator, denominator, percentage: percentage(numerator, denominator) }; }

function resolutionSourceFor(item) {
  if (item.resolutionSource) return item.resolutionSource;
  if (item.parsedOutput?.provider === "deterministic") return "deterministic";
  if (item.parsedOutput?.errorCode === "NO_PLAUSIBLE_INTENTS") return "fallback";
  if (item.parsedOutput?.provider === "lfm2.5") return "lfm";
  return "fallback";
}

function sourceMetrics(records) {
  return Object.fromEntries(["deterministic", "retriever", "lfm", "fallback"].map((source) => {
    const selected = records.filter((item) => resolutionSourceFor(item) === source);
    const latencies = selected.map((item) => item.totalLatencyMs ?? item.latencyMs ?? 0);
    return [source, {
      count: selected.length,
      intentAccuracy: percentage(selected.filter((item) => item.intentCorrect).length, selected.length),
      toolAccuracy: percentage(selected.filter((item) => item.toolCorrect).length, selected.length),
      schemaValidity: percentage(selected.filter((item) => item.schemaValid).length, selected.length),
      averageLatencyMs: latencies.length ? Math.round(latencies.reduce((sum, value) => sum + value, 0) / latencies.length) : 0,
      p50LatencyMs: percentile(latencies, 0.5),
      p95LatencyMs: percentile(latencies, 0.95),
      lfmCalls: selected.filter((item) => item.lfmInvoked === true || (!Object.hasOwn(item, "lfmInvoked") && item.parsedOutput?.provider === "lfm2.5" && item.parsedOutput?.errorCode !== "NO_PLAUSIBLE_INTENTS")).length
    }];
  }));
}

function summarize(records) {
  const fieldCases = records.filter((item) => Object.keys(item.expectedFields || {}).length > 0);
  const expectedFieldCount = fieldCases.reduce((sum, item) => sum + Object.keys(item.expectedFields || {}).length, 0);
  const correctFieldCount = fieldCases.reduce((sum, item) => sum + Object.keys(item.expectedFields || {}).filter((key) => key in (item.extractedFields || {}) && String(item.extractedFields[key]) === String(item.expectedFields[key])).length, 0);
  const extractedRelevantCount = fieldCases.reduce((sum, item) => sum + Object.keys(item.extractedFields || {}).length, 0);
  const extractedFieldCount = records.reduce((sum, item) => sum + Object.keys(item.extractedFields || {}).length, 0);
  const unexpectedFieldCount = records.reduce((sum, item) => sum + item.unexpectedFields.length, 0);
  const missingFieldCount = records.reduce((sum, item) => sum + item.missingFields.length, 0);
  const latencies = records.filter((item) => !item.errorCategories?.includes("I_RUNTIME")).map((item) => item.latencyMs);
  const categories = {};
  for (const item of records) for (const category of item.errorCategories || []) categories[category] = (categories[category] || 0) + 1;
  return {
    total: records.length,
    intentAccuracy: percentage(records.filter((item) => item.intentCorrect).length, records.length),
    toolAccuracy: percentage(records.filter((item) => item.toolCorrect).length, records.length),
    schemaValidity: percentage(records.filter((item) => item.schemaValid).length, records.length),
    fieldExtractionAccuracy: percentage(fieldCases.filter((item) => item.fieldCorrect).length, fieldCases.length),
    fieldCaseCoverage: ratioMetric(fieldCases.length, records.length),
    fieldExactCaseAccuracy: ratioMetric(fieldCases.filter((item) => item.fieldCorrect).length, fieldCases.length),
    fieldPrecision: ratioMetric(correctFieldCount, extractedRelevantCount),
    fieldRecall: ratioMetric(correctFieldCount, expectedFieldCount),
    unexpectedFieldRate: ratioMetric(unexpectedFieldCount, extractedFieldCount),
    missingFieldRate: ratioMetric(missingFieldCount, expectedFieldCount),
    missingRequiredFields: missingFieldCount,
    unexpectedFields: unexpectedFieldCount,
    technicalFailures: records.filter((item) => item.errorCategories?.includes("I_RUNTIME")).length,
    averageLatencyMs: latencies.length ? Math.round(latencies.reduce((sum, value) => sum + value, 0) / latencies.length) : 0,
    p50LatencyMs: percentile(latencies, 0.5),
    p95LatencyMs: percentile(latencies, 0.95),
    confusionMatrix: matrix(records),
    errorCategories: categories,
    byResolutionSource: sourceMetrics(records)
  };
}

function save(report) {
  fs.mkdirSync(outputDir, { recursive: true });
  fs.writeFileSync(outputPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");
}

async function targetForApp() {
  const pid = adb("shell", "pidof", PACKAGE).split(/\s+/)[0];
  if (!/^\d+$/.test(pid)) throw new Error("LFM_APP_NOT_RUNNING");
  adb("forward", "tcp:9223", `localabstract:webview_devtools_remote_${pid}`);
  for (let attempt = 0; attempt < 40; attempt += 1) {
    const targets = await fetch("http://127.0.0.1:9223/json").then((response) => response.json()).catch(() => []);
    const target = targets.find((item) => item.type === "page" && item.webSocketDebuggerUrl);
    if (target) return target;
    await sleep(250);
  }
  throw new Error("LFM_WEBVIEW_NOT_FOUND");
}

async function runCase(socketUrl, item) {
  const expression = `(async () => {
    await window.SimplificaAiRuntimeLoader.ensureAiRuntimeLoaded();
    const item = ${JSON.stringify(item)};
    const lfm = window.SimplificaLfmIntent;
    const started = performance.now();
    const provider = new lfm.LfmIntentProvider();
    const contextSnapshot = { ...(item.context || {}), ...(item.activeWorkflow ? { activeWorkflow: item.activeWorkflow } : {}) };
    const deterministicIntent = window.SimplificaToolCandidateRetriever.semanticIntent(item.rawInput, contextSnapshot) || "";
    const mode = ${JSON.stringify(mode)};
    const rawRetrievalStarted = performance.now();
    const rawRetrieval = window.SimplificaToolCandidateRetriever.retrieveToolCandidates({ input: item.rawInput, contextSnapshot, workflowState: item.activeWorkflow ? { intent: item.activeWorkflow } : {}, limit: 3 });
    const rawRetrieverLatencyMs = Math.round((performance.now() - rawRetrievalStarted) * 1000) / 1000;
    let parsed;
    let resolutionSource;
    let candidateSource;
    if (deterministicIntent) {
      parsed = { intentId: deterministicIntent, domain: deterministicIntent.split(".")[0], confidence: 1, noMatch: false, errorCode: "", provider: "deterministic", candidateIntents: [window.SimplificaIntentRegistry.get(deterministicIntent)], latencyMs: 0, grammarApplied: false, rawModelOutput: "", deterministic: true, writeExposed: 0 };
      resolutionSource = "deterministic";
      candidateSource = "deterministic-rule";
    } else if (mode === "A") {
      const top = rawRetrieval.candidates.find((candidate) => candidate.available) || rawRetrieval.candidates[0];
      parsed = top ? { intentId: top.intentId, domain: top.intentId.split(".")[0], confidence: Math.max(0, Math.min(1, top.score / 100)), noMatch: false, errorCode: "", provider: "retriever", candidateIntents: rawRetrieval.candidates.map((candidate) => window.SimplificaIntentRegistry.get(candidate.intentId)).filter(Boolean), latencyMs: 0, grammarApplied: false, rawModelOutput: "", deterministic: false, writeExposed: 0 } : { intentId: "", domain: "", confidence: 0, noMatch: true, errorCode: "NO_RETRIEVER_MATCH", provider: "fallback", candidateIntents: [], latencyMs: 0, grammarApplied: false, rawModelOutput: "", deterministic: false, writeExposed: 0 };
      resolutionSource = top ? "retriever" : "fallback";
      candidateSource = top ? "candidate-retriever" : "none";
    } else if (mode === "B") {
      const ids = [...new Set([...rawRetrieval.candidates.map((candidate) => candidate.intentId), ...lfm.plausibleIntents(item.rawInput, contextSnapshot).map((candidate) => candidate.id)])].slice(0, 8);
      const rerankCandidates = ids.map((id) => window.SimplificaIntentRegistry.get(id)).filter(Boolean);
      parsed = rerankCandidates.length ? await provider.interpretIntent({ input: item.rawInput, contextSnapshot, candidateIntents: rerankCandidates }) : { intentId: "", domain: "", confidence: 0, noMatch: true, errorCode: "NO_PLAUSIBLE_INTENTS", provider: "fallback", candidateIntents: [], latencyMs: 0, grammarApplied: false, rawModelOutput: "", deterministic: false, writeExposed: 0 };
      resolutionSource = rerankCandidates.length ? "lfm" : "fallback";
      candidateSource = rawRetrieval.candidates.length ? "retriever+domain-heuristic" : rerankCandidates.length ? "domain-heuristic" : "none";
    } else {
      parsed = await provider.interpretIntent({ input: item.rawInput, contextSnapshot });
      resolutionSource = parsed.provider === "deterministic" ? "deterministic" : parsed.errorCode === "NO_PLAUSIBLE_INTENTS" ? "fallback" : "lfm";
      candidateSource = deterministicIntent ? "deterministic-rule" : item.activeWorkflow ? "active-workflow" : (parsed.candidateIntents || []).length ? "domain-heuristic" : "none";
    }
    const candidates = parsed.candidateIntents || [];
    const generated = { grammarApplied: parsed.grammarApplied, error: parsed.errorCode || "" };
    const rawModelOutput = parsed.rawModelOutput || "";
    const promptApproxChars = resolutionSource === "lfm" ? lfm.promptFor(item.rawInput, candidates, contextSnapshot).length + lfm.systemPromptFor().length : 0;
    const actionPlan = parsed.intentId ? { intent: parsed.intentId } : null;
    const retrieverStarted = performance.now();
    const retrieval = window.SimplificaToolCandidateRetriever.retrieveToolCandidates({ input: item.rawInput, actionPlan, contextSnapshot, workflowState: item.activeWorkflow ? { intent: item.activeWorkflow } : {}, limit: 3 });
    const retrieverLatencyMs = Math.round((performance.now() - retrieverStarted) * 1000) / 1000;
    const extractorStarted = performance.now();
    const deterministic = window.SimplificaDeterministicValueExtractor.extractDeterministicValues(item.rawInput);
    const extractorLatencyMs = Math.round((performance.now() - extractorStarted) * 1000) / 1000;
    let needle = null;
    try { needle = await window.SimplificaNeedleShadow.shadow({ input: item.rawInput, actionPlan, contextSnapshot, workflowState: item.activeWorkflow ? { intent: item.activeWorkflow } : {}, currentDecision: {} }); } catch (error) { needle = { skipped: true, reason: "NEEDLE_RUNTIME_ERROR", error: String(error?.message || error) }; }
    const merged = needle?.mergedArguments?.fields || deterministic || {};
    const extractedFields = Object.fromEntries(Object.entries(merged).map(([key, value]) => [key, value && typeof value === "object" && "value" in value ? value.value : value]));
    return { evaluationMode: mode, candidates: candidates.map((candidate) => candidate.id), generated, parsed, rawModelOutput, resolutionSource, deterministicRuleId: deterministicIntent ? "semantic:" + deterministicIntent : "", candidateSource, lfmInvoked: resolutionSource === "lfm", fallbackReason: resolutionSource === "fallback" ? parsed.errorCode : "", lfmLatencyMs: parsed.latencyMs || 0, retrieverLatencyMs: retrieverLatencyMs + rawRetrieverLatencyMs, extractorLatencyMs, promptApproxChars, generatedTokens: parsed.generatedTokens ?? null, retrieval: { status: retrieval.status, candidateTools: retrieval.candidates.map((candidate) => candidate.toolId), availableTools: retrieval.candidates.filter((candidate) => candidate.available).map((candidate) => candidate.toolId), diagnostics: retrieval.diagnostics }, needle: { skipped: needle?.skipped === true, reason: needle?.reason || "", selectedTool: needle?.comparison?.needleDecision?.toolId || "", rawModelOutput: needle?.comparison?.needleDecision?.raw || needle?.result?.result || "", conflicts: needle?.mergedArguments?.conflicts || [] }, deterministic, extractedFields, latencyMs: Math.round(performance.now() - started), writeExposed: parsed.writeExposed };
  })()`;
  return evaluate(socketUrl, expression, 90000);
}

function createRecord(item, result, error = null) {
  if (error) return { caseId: item.id, datasetSplit: item.split, input: item.rawInput, expectedIntent: item.expectedIntent, predictedIntent: "", intentCorrect: false, expectedTool: item.expectedTool || "", candidateTools: [], selectedTool: "", toolCorrect: false, schemaValid: false, parsedOutput: null, expectedFields: item.expectedFields || {}, extractedFields: {}, missingFields: Object.keys(item.expectedFields || {}), unexpectedFields: [], confidence: null, latencyMs: 0, errorType: String(error.message || error), rawModelOutput: "", deterministicNotes: [], errorCategories: ["I_RUNTIME"] };
  const expectedFields = item.expectedFields || {};
  const extractedFields = result.extractedFields || {};
  const missingFields = Object.keys(expectedFields).filter((key) => !(key in extractedFields) || String(extractedFields[key]) !== String(expectedFields[key]));
  const unexpectedFields = Object.keys(extractedFields).filter((key) => !(key in expectedFields));
  const predictedIntent = result.parsed?.intentId || "";
  const selectedTool = result.needle?.selectedTool || "";
  const intentCorrect = predictedIntent === (item.expectedIntent || "");
  const toolCorrect = selectedTool === (item.expectedTool || "");
  const schemaValid = result.evaluationMode === "A" || result.parsed?.deterministic === true || result.parsed?.provider === "fallback" || result.parsed?.errorCode === "NO_PLAUSIBLE_INTENTS" || (!result.parsed?.errorCode && result.generated?.grammarApplied === true);
  const categories = [];
  if (!schemaValid) categories.push("F_SCHEMA_OUTPUT");
  if (!intentCorrect) categories.push(result.candidates.includes(item.expectedIntent) ? (result.candidates.length > 1 ? "B_AMBIGUOUS_INTENT" : "A_SEMANTIC") : "C_CANDIDATE_RETRIEVAL");
  if (!toolCorrect) categories.push("D_TOOL_SELECTION");
  if (missingFields.length || unexpectedFields.length) categories.push("E_ENTITY_EXTRACTION");
  if (["NO_MATCH", "MISSING_CONTEXT", "BLOCKED", "UNAVAILABLE"].includes(result.retrieval?.status)) categories.push("G_INSUFFICIENT_CONTEXT");
  return {
    caseId: item.id, datasetSplit: item.split, input: item.rawInput,
    expectedIntent: item.expectedIntent, predictedIntent, intentCorrect,
    expectedTool: item.expectedTool || "", candidateTools: result.retrieval?.candidateTools || [], selectedTool, toolCorrect,
    schemaValid, parsedOutput: result.parsed, expectedFields, extractedFields, missingFields, unexpectedFields,
    confidence: result.parsed?.confidence ?? null, latencyMs: result.latencyMs, totalLatencyMs: result.latencyMs, lfmLatencyMs: result.lfmLatencyMs || 0, retrieverLatencyMs: result.retrieverLatencyMs || 0, extractorLatencyMs: result.extractorLatencyMs || 0, generatedTokens: result.generatedTokens ?? null, promptApproxChars: result.promptApproxChars || 0, resolutionSource: result.resolutionSource, deterministicRuleId: result.deterministicRuleId || "", candidateSource: result.candidateSource || "", candidateCount: result.candidates.length, candidateIntents: result.candidates, lfmInvoked: result.lfmInvoked === true, fallbackReason: result.fallbackReason || "", decisionError: result.generated?.error || "", errorType: "",
    rawModelOutput: result.rawModelOutput, rawNeedleOutput: result.needle?.rawModelOutput || "",
    deterministicNotes: [`retrieval=${result.retrieval?.status || ""}`, `lfmCandidates=${result.candidates.join(",")}`, `needle=${result.needle?.reason || "executed"}`, ...(result.needle?.conflicts || [])],
    fieldCorrect: missingFields.length === 0, errorCategories: [...new Set(categories)], writeExposed: result.writeExposed
  };
}

async function main() {
  const target = await targetForApp();
  const report = { schemaVersion: 2, runId, datasetId, modelId: "lfm2.5-1.2b-q4_0", split, evaluationMode: mode, startedAt: new Date().toISOString(), completedAt: null, frozenRuntimeCommit: adb("shell", "dumpsys", "package", PACKAGE).match(/versionName=([^\s]+)/)?.[1] || "", writeExposed: 0, records: [], metrics: null };
  save(report);
  for (const [index, item] of cases.entries()) {
    let result; let error;
    try { result = await runCase(target.webSocketDebuggerUrl, item); } catch (caught) { error = caught; }
    const record = createRecord(item, result, error);
    report.records.push(record); report.metrics = summarize(report.records); save(report);
    console.log(`[${index + 1}/${cases.length}] ${record.caseId} intent=${record.predictedIntent || "NO_MATCH"} schema=${record.schemaValid ? "ok" : "fail"} error=${record.errorType || "none"}`);
  }
  report.completedAt = new Date().toISOString(); report.metrics = summarize(report.records); save(report);
  console.log(JSON.stringify({ outputPath, split, metrics: report.metrics }, null, 2));
}

module.exports = { summarize, sourceMetrics, createRecord };
if (require.main === module) main().catch((error) => { console.error(error.stack || error.message); process.exitCode = 1; });
