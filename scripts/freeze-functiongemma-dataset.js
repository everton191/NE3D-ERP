"use strict";
const crypto = require("crypto");
const fs = require("fs");
const path = require("path");
const root = path.resolve(__dirname, "..");
const base = path.join(root, "training", "functiongemma");
const reviewPath = path.join(base, "review.v1.jsonl");
const rows = fs.readFileSync(reviewPath, "utf8").trim().split(/\r?\n/).filter(Boolean).map(JSON.parse);
const pending = rows.filter((row) => row.reviewStatus !== "APPROVED");
if (pending.length) throw new Error(`Dataset não revisado: ${pending.length} casos ainda não foram aprovados por humano.`);
const destinations = { train_candidate: "train", validation: "validation", test_frozen: "test" };
const leakage = new Map();
for (const row of rows) { const set = leakage.get(row.semanticGroup) || new Set(); set.add(destinations[row.split]); leakage.set(row.semanticGroup, set); }
const leaked = [...leakage.entries()].filter(([, splits]) => splits.size > 1).map(([group]) => group);
if (leaked.length) throw new Error(`Vazamento semântico entre splits: ${leaked.length} grupos. Reatribua os casos antes de congelar.`);
const files = {};
for (const [split, folder] of Object.entries(destinations)) {
  const content = `${rows.filter((row) => row.split === split).map((row) => JSON.stringify(row)).join("\n")}\n`;
  const file = path.join(base, folder, "dataset.v1.jsonl"); fs.mkdirSync(path.dirname(file), { recursive: true }); fs.writeFileSync(file, content);
  files[folder] = { cases: rows.filter((row) => row.split === split).length, sha256: crypto.createHash("sha256").update(content).digest("hex"), path: path.relative(root, file).replace(/\\/g, "/") };
}
const evaluation = fs.readFileSync(path.join(base, "evaluation.v1.jsonl"), "utf8");
files.evaluation = { cases: evaluation.trim().split(/\r?\n/).filter(Boolean).length, sha256: crypto.createHash("sha256").update(evaluation).digest("hex"), path: "training/functiongemma/evaluation.v1.jsonl" };
fs.writeFileSync(path.join(base, "dataset-manifest.v1.json"), `${JSON.stringify({ version: "v1", frozenAt: new Date().toISOString(), source: "review.v1.jsonl", files }, null, 2)}\n`);
console.log(JSON.stringify(files, null, 2));
