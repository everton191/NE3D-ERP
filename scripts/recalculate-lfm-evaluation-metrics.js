"use strict";

const fs = require("node:fs");
const path = require("node:path");
const { summarize } = require("./run-lfm-device-evaluation.js");

const files = process.argv.slice(2);
if (!files.length) throw new Error("LFM_REPORT_PATH_REQUIRED");
for (const input of files) {
  const sourcePath = path.resolve(input);
  const report = JSON.parse(fs.readFileSync(sourcePath, "utf8"));
  const outputPath = sourcePath.replace(/\.json$/i, ".recalculated.json");
  const recalculated = { ...report, metrics: summarize(report.records), recalculatedFrom: path.basename(sourcePath), recalculatedAt: new Date().toISOString() };
  fs.writeFileSync(outputPath, `${JSON.stringify(recalculated, null, 2)}\n`, "utf8");
  console.log(outputPath);
}
