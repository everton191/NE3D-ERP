"use strict";
const fs = require("fs");
const path = require("path");
const root = path.resolve(__dirname, "..");
const evaluationPath = path.join(root, "training", "functiongemma", "evaluation.v1.jsonl");
const outputPath = path.join(root, "training", "functiongemma", "baseline.json");
const predictionsArg = process.argv.indexOf("--predictions");
if (predictionsArg < 0 || !process.argv[predictionsArg + 1]) throw new Error("Use --predictions <arquivo-jsonl> com resultados reais do runtime.");
const evaluation = fs.readFileSync(evaluationPath, "utf8").trim().split(/\r?\n/).filter(Boolean).map(JSON.parse);
const predictions = new Map(fs.readFileSync(path.resolve(process.argv[predictionsArg + 1]), "utf8").trim().split(/\r?\n/).filter(Boolean).map(JSON.parse).map((row) => [row.id, row]));
if (predictions.size !== evaluation.length || evaluation.some((row) => !predictions.has(row.id))) throw new Error("Predições incompletas: cada caso de avaliação deve ter exatamente um resultado.");
const stable = (value) => JSON.stringify(value && typeof value === "object" ? Object.fromEntries(Object.entries(value).sort(([a], [b]) => a.localeCompare(b))) : value);
const semantic = (value) => {
  if (Array.isArray(value)) return value.map(semantic);
  if (value && typeof value === "object") return Object.fromEntries(Object.entries(value).sort(([a], [b]) => a.localeCompare(b)).map(([key, item]) => [key, semantic(item)]));
  if (typeof value === "string") return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/\s+/g, " ").trim();
  return value;
};
const score = (predicate, source = evaluation) => source.length ? Number((source.filter(predicate).length / source.length).toFixed(4)) : null;
const percentile = (values, p) => values.length ? values.slice().sort((a, b) => a - b)[Math.min(values.length - 1, Math.ceil(values.length * p) - 1)] : null;
const expectedNoTool = evaluation.filter((row) => row.expectedAction === null);
const argumentRows = evaluation.filter((row) => row.expectedAction && Object.keys(row.expectedArguments || {}).length > 0);
const byDomain = Object.fromEntries([...new Set(evaluation.map((row) => row.domain))].sort().map((domain) => {
  const rows = evaluation.filter((row) => row.domain === domain);
  const domainArguments = rows.filter((row) => row.expectedAction && Object.keys(row.expectedArguments || {}).length > 0);
  return [domain, {
    cases: rows.length,
    toolSelectionAccuracy: score((row) => predictions.get(row.id).action === row.expectedAction, rows),
    noToolAccuracy: score((row) => predictions.get(row.id).action === null, rows.filter((row) => row.expectedAction === null)),
    argumentExactMatch: score((row) => stable(predictions.get(row.id).arguments || {}) === stable(row.expectedArguments || {}), domainArguments),
    dispositionAccuracy: score((row) => predictions.get(row.id).disposition === row.expectedDisposition, rows),
    schemaValidity: score((row) => predictions.get(row.id).schemaValid === true, rows)
  }];
}));
const confusion = {};
for (const row of evaluation) { const expected = row.expectedAction || "NO_TOOL"; const predicted = predictions.get(row.id).action || "NO_TOOL"; ((confusion[expected] ||= {})[predicted] ||= 0); confusion[expected][predicted] += 1; }
const result = {
  generatedAt: new Date().toISOString(),
  source: "real-runtime-predictions", cases: evaluation.length,
  toolSelectionAccuracy: score((row) => predictions.get(row.id).action === row.expectedAction),
  argumentAnnotatedCases: argumentRows.length,
  argumentExactMatch: score((row) => stable(predictions.get(row.id).arguments || {}) === stable(row.expectedArguments || {}), argumentRows),
  argumentSemanticMatch: score((row) => stable(semantic(predictions.get(row.id).arguments || {})) === stable(semantic(row.expectedArguments || {})), argumentRows),
  dispositionAccuracy: score((row) => predictions.get(row.id).disposition === row.expectedDisposition),
  negativeToolAccuracy: score((row) => ["NO_CALL", "ANSWER_ONLY", "ASK_CLARIFICATION", "OUT_OF_DOMAIN"].includes(row.expectedDisposition) && predictions.get(row.id).action === null),
  noToolAccuracy: score((row) => predictions.get(row.id).action === null, expectedNoTool),
  schemaValidity: score((row) => predictions.get(row.id).schemaValid === true),
  missingDataDetection: score((row) => row.expectedDisposition !== "ASK_CLARIFICATION" || Array.isArray(predictions.get(row.id).missing) && predictions.get(row.id).missing.length > 0),
  invalidToolCalls: evaluation.filter((row) => predictions.get(row.id).invalidToolCall === true).length,
  outOfTopKAttempts: evaluation.filter((row) => predictions.get(row.id).outOfTopK === true).length,
  unsafeDirectWrite: evaluation.filter((row) => predictions.get(row.id).operationType === "WRITE").length,
  byDomain,
  confusionMatrix: confusion,
  latency: evaluation.map((row) => Number(predictions.get(row.id).latencyMs)).filter(Number.isFinite),
  ttft: evaluation.map((row) => Number(predictions.get(row.id).ttftMs)).filter((value) => Number.isFinite(value) && value > 0),
  tokenRates: evaluation.map((row) => {
    const prediction = predictions.get(row.id);
    const generationMs = Number(prediction.totalMs) - Number(prediction.ttftMs);
    return generationMs > 0 ? Number(prediction.tokensGenerated) * 1000 / generationMs : NaN;
  }).filter(Number.isFinite)
};
if (result.latency.length) result.latencyMs = { average: Math.round(result.latency.reduce((total, value) => total + value, 0) / result.latency.length), p50: percentile(result.latency, 0.5), p95: percentile(result.latency, 0.95), max: Math.max(...result.latency) };
if (result.ttft.length) result.ttftMs = { average: Math.round(result.ttft.reduce((total, value) => total + value, 0) / result.ttft.length), p50: percentile(result.ttft, 0.5), p95: percentile(result.ttft, 0.95), max: Math.max(...result.ttft) };
if (result.tokenRates.length) result.tokensPerSecond = { average: Number((result.tokenRates.reduce((total, value) => total + value, 0) / result.tokenRates.length).toFixed(2)), p50: Number(percentile(result.tokenRates, 0.5).toFixed(2)), p95: Number(percentile(result.tokenRates, 0.95).toFixed(2)) };
delete result.latency; delete result.ttft; delete result.tokenRates;
fs.writeFileSync(outputPath, `${JSON.stringify(result, null, 2)}\n`);
console.log(JSON.stringify(result, null, 2));
