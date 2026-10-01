"use strict";

const assert = require("node:assert/strict");
const { summarize } = require("./run-lfm-device-evaluation.js");

const base = { expectedIntent: "test.intent", predictedIntent: "test.intent", intentCorrect: true, toolCorrect: true, schemaValid: true, errorType: "", errorCategories: [], latencyMs: 10, missingFields: [], unexpectedFields: [], writeExposed: 0 };
const metrics = summarize([
  { ...base, expectedFields: { customerName: "Maria", quantity: 2 }, extractedFields: { customerName: "Maria", quantity: 2, note: "x" }, unexpectedFields: ["note"], fieldCorrect: true, resolutionSource: "deterministic" },
  { ...base, expectedFields: { orderNumber: "7" }, extractedFields: { orderNumber: 8 }, missingFields: ["orderNumber"], fieldCorrect: false, resolutionSource: "lfm", lfmInvoked: true },
  { ...base, expectedFields: {}, extractedFields: {}, fieldCorrect: true, resolutionSource: "fallback" }
]);

assert.deepEqual(metrics.fieldCaseCoverage, { numerator: 2, denominator: 3, percentage: 66.67 });
assert.deepEqual(metrics.fieldExactCaseAccuracy, { numerator: 1, denominator: 2, percentage: 50 });
assert.deepEqual(metrics.fieldPrecision, { numerator: 2, denominator: 4, percentage: 50 });
assert.deepEqual(metrics.fieldRecall, { numerator: 2, denominator: 3, percentage: 66.67 });
assert.deepEqual(metrics.unexpectedFieldRate, { numerator: 1, denominator: 4, percentage: 25 });
assert.deepEqual(metrics.missingFieldRate, { numerator: 1, denominator: 3, percentage: 33.33 });
assert.deepEqual(metrics.noMatchPrecision, { numerator: 0, denominator: 0, percentage: 0 });
assert.deepEqual(metrics.noMatchRecall, { numerator: 0, denominator: 0, percentage: 0 });
assert.equal(metrics.byResolutionSource.deterministic.count, 1);
assert.equal(metrics.byResolutionSource.lfm.lfmCalls, 1);
console.log("LFM evaluation field and resolution-source metrics: PASS");
