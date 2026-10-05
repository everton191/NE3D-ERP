"use strict";

const assert = require("node:assert/strict");
const legacy = require("../src/ai/ptbr-evaluation-corpus.js");
const corpus = require("../src/ai/field-validation-corpus.js");
const schemas = require("../src/ai/dynamic-tool-schema.js");

const supportedFields = [...new Set(Object.values(schemas.MODEL_ARGS).flat())].sort();
const evaluatedFields = [...new Set(corpus.cases.flatMap((item) => item.evaluatedFields))].sort();
assert.equal(corpus.datasetId, "field-validation-v1");
assert.equal(corpus.version, "1.0.0");
assert.equal(corpus.cases.length, 60);
assert.deepEqual(evaluatedFields, supportedFields);
assert.equal(new Set(corpus.cases.map((item) => item.id)).size, corpus.cases.length);
assert(corpus.cases.every((item) => item.split === "field-validation"));
assert(corpus.cases.every((item) => item.evaluatedFields.length > 0));
assert.equal(legacy.cases.length, 80);
assert.equal(legacy.tuning.length, 65);
assert.equal(legacy.holdout.length, 15);

const coverage = Object.fromEntries(supportedFields.map((field) => [field, corpus.cases.filter((item) => item.evaluatedFields.includes(field)).length]));
for (const [field, count] of Object.entries(coverage)) assert(count >= 8, `${field} needs at least 8 evaluated cases, got ${count}`);

const find = (input) => corpus.cases.find((item) => item.rawInput === input);
assert.deepEqual(find("abre pedido da Maria").expectedFields, { customerName: "Maria" });
assert.deepEqual(find("abre pedido do João").expectedFields, { customerName: "João" });
assert.deepEqual(find("abre pedido 123").expectedFields, { orderNumber: "123" });
assert.deepEqual(find("pedido 123 da Maria").expectedFields, { orderNumber: "123", customerName: "Maria" });
assert(!Object.hasOwn(find("abre o pedido da Maria").expectedFields, "orderNumber"));

console.log(`Field validation v1: ${corpus.cases.length} cases, ${supportedFields.length} supported fields, minimum coverage ${Math.min(...Object.values(coverage))}.`);
