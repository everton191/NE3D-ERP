"use strict";

const assert = require("node:assert/strict");
const { formatMinutes } = require("../src/features/production/production-status.js");

assert.equal(formatMinutes(-5), "0min");
assert.equal(formatMinutes(59.6), "1h");
assert.equal(formatMinutes(61), "1h 1min");
assert.equal(formatMinutes(0), "0min");
console.log("Production formatters: duração determinística preservada.");
