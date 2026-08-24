"use strict";
const crypto = require("crypto");
const fs = require("fs");
const path = require("path");
const root = path.resolve(__dirname, "..");
const source = path.join(root, "training", "functiongemma", "evaluation.v1.jsonl");
const target = path.join(root, "training", "functiongemma", "DATASET_REVIEW.md");
const raw = fs.readFileSync(source, "utf8");
const rows = raw.trim().split(/\r?\n/).filter(Boolean).map((line, index) => ({ line: index + 1, ...JSON.parse(line) }));
const duplicates = rows.filter((row, index) => rows.findIndex((candidate) => candidate.id === row.id) !== index).map((row) => row.id);
const invalid = rows.filter((row) => !row.id || !row.input || !row.expectedDisposition || !row.domain || !Object.prototype.hasOwnProperty.call(row, "expectedAction"));
const splits = Object.fromEntries(["train_candidate", "validation", "test_frozen"].map((split) => [split, rows.filter((row) => row.split === split).length]));
const categories = Object.fromEntries([...new Set(rows.map((row) => row.category))].sort().map((category) => [category, rows.filter((row) => row.category === category).length]));
const hash = crypto.createHash("sha256").update(raw).digest("hex");
const report = [
  "# Revisão humana obrigatória — FunctionGemma",
  "",
  `Arquivo: \`evaluation.v1.jsonl\``,
  `SHA-256: \`${hash}\``,
  `Casos: ${rows.length}; duplicados: ${duplicates.length}; inválidos: ${invalid.length}.`,
  "",
  "Este conjunto **não está congelado** e não pode entrar em treino. Cada caso deve receber revisão humana do comando, action, argumentos, disposição e split antes de criar `train/`, `validation/` e `test/` definitivos.",
  "",
  "## Distribuição atual",
  "",
  ...Object.entries(splits).map(([name, count]) => `- ${name}: ${count}`),
  "",
  "## Categorias",
  "",
  ...Object.entries(categories).map(([name, count]) => `- ${name}: ${count}`),
  "",
  "## Resultado automático",
  "",
  duplicates.length || invalid.length ? "REPROVADO: corrija os problemas acima antes da revisão humana." : "PENDENTE_DE_REVISAO_HUMANA: estrutura válida, conteúdo ainda não aprovado.",
  ""
];
fs.writeFileSync(target, report.join("\n"));
console.log(JSON.stringify({ cases: rows.length, sha256: hash, duplicates: duplicates.length, invalid: invalid.length, splits }, null, 2));
if (duplicates.length || invalid.length) process.exitCode = 1;
