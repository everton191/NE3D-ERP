"use strict";

const assert = require("node:assert/strict");
require("../src/features/home/home-data.js");
const { formatDashboardVariation } = global.SimplificaHomeData;

assert.deepEqual(formatDashboardVariation(0, 0), { texto: "0% vs anterior", estado: "neutral" });
assert.deepEqual(formatDashboardVariation(25, 0, "vs ontem"), { texto: "+100% vs ontem", estado: "positive" });
assert.deepEqual(formatDashboardVariation(50, 100), { texto: "-50% vs anterior", estado: "negative" });
console.log("Home data formatter: variação de dashboard preservada.");
