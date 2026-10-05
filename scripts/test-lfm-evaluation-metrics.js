"use strict";

const assert = require("node:assert/strict");
const { summarize } = require("./run-lfm-device-evaluation.js");

const base = { expectedIntent: "test.intent", predictedIntent: "test.intent", intentCorrect: true, toolCorrect: true, schemaValid: true, errorType: "", errorCategories: [], latencyMs: 10, missingFields: [], unexpectedFields: [], writeExposed: 0 };
const metrics = summarize([
  { ...base, expectedFields: { customerName: "Maria", quantity: 2 }, evaluatedFields: ["customerName", "quantity", "orderNumber"], extractedFields: { customerName: "Maria", quantity: 2, note: "x" }, unexpectedFields: ["note"], fieldCorrect: true, resolutionSource: "deterministic" },
  { ...base, expectedFields: { orderNumber: "7" }, evaluatedFields: ["orderNumber"], extractedFields: { orderNumber: 8 }, missingFields: ["orderNumber"], fieldCorrect: false, resolutionSource: "lfm", lfmInvoked: true },
  { ...base, expectedFields: {}, extractedFields: {}, fieldCorrect: true, resolutionSource: "fallback" }
]);

assert.deepEqual(metrics.fieldCaseCoverage, { numerator: 2, denominator: 3, percentage: 66.67 });
assert.deepEqual(metrics.fieldExactCaseAccuracy, { numerator: 1, denominator: 2, percentage: 50 });
assert.deepEqual(metrics.fieldAnnotationCoverage, { cases: { numerator: 2, denominator: 3, percentage: 66.67 }, expectedOccurrences: 3, distinctExpectedFields: 3 });
assert.deepEqual(metrics.fieldPrecision, { numerator: 2, denominator: 4, percentage: 50 });
assert.deepEqual(metrics.fieldRecall, { numerator: 2, denominator: 3, percentage: 66.67 });
assert.deepEqual(metrics.unexpectedFieldRate, { numerator: 1, denominator: 4, percentage: 25 });
assert.deepEqual(metrics.missingFieldRate, { numerator: 1, denominator: 3, percentage: 33.33 });
assert.deepEqual(metrics.noMatchPrecision, { numerator: 0, denominator: 0, percentage: 0 });
assert.deepEqual(metrics.noMatchRecall, { numerator: 0, denominator: 0, percentage: 0 });
assert.equal(metrics.byResolutionSource.deterministic.count, 1);
assert.equal(metrics.byResolutionSource.lfm.lfmCalls, 1);
assert.deepEqual(metrics.byField.customerName, { expected: 1, extracted: 1, correct: 1, precision: { numerator: 1, denominator: 1, percentage: 100 }, recall: { numerator: 1, denominator: 1, percentage: 100 } });
assert.deepEqual(metrics.byField.orderNumber, { expected: 1, extracted: 1, correct: 0, precision: { numerator: 0, denominator: 1, percentage: 0 }, recall: { numerator: 0, denominator: 1, percentage: 0 } });
assert.deepEqual(metrics.fieldValidation.annotationCoverage, { numerator: 2, denominator: 3, percentage: 66.67 });
assert.deepEqual(metrics.fieldValidation.exactCaseMatch, { numerator: 1, denominator: 2, percentage: 50 });
assert.deepEqual(metrics.fieldValidation.microPrecision, { numerator: 2, denominator: 3, percentage: 66.67 });
assert.deepEqual(metrics.fieldValidation.microRecall, { numerator: 2, denominator: 3, percentage: 66.67 });
assert.equal(metrics.fieldValidation.microF1, 66.67);
assert.equal(metrics.fieldValidation.byField.orderNumber.falsePositives, 1);
assert.equal(metrics.fieldValidation.byField.orderNumber.falseNegatives, 1);
console.log("LFM evaluation field and resolution-source metrics: PASS");
