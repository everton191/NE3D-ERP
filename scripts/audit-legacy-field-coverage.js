"use strict";

const fs = require("node:fs");
const path = require("node:path");
const extractor = require("../src/ai/deterministic-value-extractor.js");
const schemas = require("../src/ai/dynamic-tool-schema.js");

const args = process.argv.slice(2);
const outputArg = args.find((value) => value.startsWith("--output="));
const inputs = args.filter((value) => !value.startsWith("--output="));
if (inputs.length !== 2 || !outputArg) throw new Error("USAGE: node scripts/audit-legacy-field-coverage.js tuning.json holdout.json --output=report.json");

const reports = inputs.map((input) => JSON.parse(fs.readFileSync(path.resolve(input), "utf8")));
const records = reports.flatMap((report) => report.records.map((record) => ({ ...record, sourceReport: path.basename(inputs[reports.indexOf(report)]) })));
const fields = [...new Set(Object.values(schemas.MODEL_ARGS).flat())].sort();
const REVIEW_OVERRIDES = Object.freeze({
  "nav-005:customerName": ["B", "preposition pra introduces an action, not a customer"],
  "order-015:customerName": ["B", "Adiciona is an imperative verb, not a customer"],
  "cash-004:customerName": ["B", "preposition para introduces an action, not a customer"],
  "prod-005:customerName": ["B", "produzir is an action, not a customer"],
  "order-015:description": ["B", "nesse pedido is workflow context, not an item description"],
  "calc-002:description": ["B", "minute is a duration unit, not an item description"],
  "calc-004:description": ["B", "hour is a duration unit, not an item description"],
  "calc-007:description": ["B", "duration text is not an item description"],
  "calc-010:description": ["B", "unit-price wording is not an item description"],
  "cash-006:description": ["B", "cash context is not an item description"],
  "calc-002:quantity": ["B", "duration value was misclassified as item quantity"],
  "calc-004:quantity": ["B", "duration value was misclassified as item quantity"],
  "calc-007:quantity": ["B", "duration value was misclassified as item quantity"],
  "calc-010:quantity": ["B", "unit-price value was misclassified as item quantity"],
  "cash-006:quantity": ["B", "withdrawal amount was misclassified as item quantity"],
  "other-007:orderNumber": ["A", "pedido 12 explicitly contains a valid numeric order reference"],
  "other-014:materialName": ["A", "PLA preto is an explicit material reference"],
  "inv-003:materialName": ["A", "PLA branco is an explicit material reference"],
  "inv-008:materialName": ["A", "PLA is an explicit material reference"],
  "inv-013:materialName": ["A", "ABS is an explicit material reference"]
});

function classifyUnannotated(record, field) {
  const override = REVIEW_OVERRIDES[`${record.caseId}:${field}`];
  if (override) return { classification: override[0], reason: override[1] };
  const deterministic = extractor.extractDeterministicValues(record.input || "");
  const extracted = record.extractedFields?.[field];
  if (deterministic[field] && String(deterministic[field].value) === String(extracted)) return { classification: "A", reason: "deterministic extractor confirms a grounded value present in the input" };
  if (field === "orderNumber" && !/^#?\d+$/.test(String(extracted || "").trim())) return { classification: "B", reason: "orderNumber violates the numeric runtime contract" };
  return { classification: "C", reason: "model-derived value lacks an independent deterministic oracle" };
}

const byField = Object.fromEntries(fields.map((field) => {
  const expected = records.filter((item) => Object.hasOwn(item.expectedFields || {}, field));
  const correct = expected.filter((item) => Object.hasOwn(item.extractedFields || {}, field) && String(item.extractedFields[field]) === String(item.expectedFields[field]));
  const incorrect = expected.filter((item) => Object.hasOwn(item.extractedFields || {}, field) && String(item.extractedFields[field]) !== String(item.expectedFields[field]));
  const missing = expected.filter((item) => !Object.hasOwn(item.extractedFields || {}, field));
  const unannotated = records.filter((item) => !Object.hasOwn(item.expectedFields || {}, field) && Object.hasOwn(item.extractedFields || {}, field));
  return [field, {
    expected: expected.length,
    correct: correct.length,
    incorrect: incorrect.length,
    unannotatedExtractions: unannotated.length,
    falsePositives: incorrect.length + unannotated.filter((item) => classifyUnannotated(item, field).classification === "B").length,
    falseNegatives: incorrect.length + missing.length,
    occurrences: unannotated.map((item) => ({ caseId: item.caseId, split: item.datasetSplit, input: item.input, extracted: item.extractedFields[field], ...classifyUnannotated(item, field) }))
  }];
}));

const output = {
  schemaVersion: 1,
  auditId: "legacy-field-audit-f3b8e7f",
  sourceCommit: "f3b8e7f",
  legacyCorpus: { total: records.length, tuning: reports.find((item) => item.split === "tuning")?.records.length || 0, holdout: reports.find((item) => item.split === "holdout")?.records.length || 0 },
  classificationLegend: { A: "true positive without annotation", B: "false positive", C: "ambiguous; human review required" },
  supportedFields: fields,
  byField
};
const outputPath = path.resolve(outputArg.slice("--output=".length));
fs.mkdirSync(path.dirname(outputPath), { recursive: true });
fs.writeFileSync(outputPath, `${JSON.stringify(output, null, 2)}\n`, "utf8");
console.log(outputPath);
