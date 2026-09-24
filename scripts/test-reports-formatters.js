"use strict";

const assert = require("node:assert/strict");
const { formatDelta, formatShortPeriod, calculatePercentageDelta } = require("../src/features/reports/reports-formatters.js");

assert.equal(formatDelta(2), "↑ 2,0%");
assert.equal(formatDelta(-1.25), "↓ 1,3%");
assert.equal(formatDelta("invalid"), "↑ 0,0%");
assert.equal(formatShortPeriod(new Date(2026, 0, 5)), "05/01");
assert.equal(calculatePercentageDelta(150, 100), 50);
assert.equal(calculatePercentageDelta(0, 100), -100);
assert.equal(calculatePercentageDelta(25, 0), 100);
assert.equal(calculatePercentageDelta(0, 0), 0);
console.log("Reports formatters: delta e período curto preservados.");
