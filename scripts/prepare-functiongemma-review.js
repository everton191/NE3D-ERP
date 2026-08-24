"use strict";
const crypto = require("crypto");
const fs = require("fs");
const path = require("path");
const root = path.resolve(__dirname, "..");
const source = path.join(root, "training", "functiongemma", "evaluation.v1.jsonl");
const target = path.join(root, "training", "functiongemma", "review.v1.jsonl");
const normalize = (value) => String(value || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/\b(pfv|rapid[oã]o ai|por favor)\b/g, "").replace(/[^a-z0-9 ]+/g, " ").replace(/\s+/g, " ").trim();
const semanticGroup = (row) => crypto.createHash("sha256").update(JSON.stringify({ domain: row.domain, action: row.expectedAction, disposition: row.expectedDisposition, normalizedInput: normalize(row.input) })).digest("hex").slice(0, 16);
const rows = fs.readFileSync(source, "utf8").trim().split(/\r?\n/).filter(Boolean).map(JSON.parse).map((row) => ({
  ...row, semanticGroup: semanticGroup(row), reviewStatus: "PENDING", reviewer: "", reviewedAt: "", reviewNotes: ""
}));
fs.writeFileSync(target, `${rows.map((row) => JSON.stringify(row)).join("\n")}\n`);
console.log(JSON.stringify({ cases: rows.length, pending: rows.length, semanticGroups: new Set(rows.map((row) => row.semanticGroup)).size, output: target }, null, 2));
