"use strict";
const fs = require("node:fs");
const path = require("node:path");
const root = path.resolve(__dirname, "..");
const readJsonl = (file) => fs.readFileSync(file, "utf8").trim().split(/\r?\n/).filter(Boolean).map(JSON.parse);
const evaluation = readJsonl(path.join(root, "training/functiongemma/evaluation.v1.jsonl"));
const predictions = new Map(readJsonl(path.join(root, "training/functiongemma/android-q8-predictions.v2.jsonl")).map((row) => [row.id, row]));
const rows = evaluation.filter((row) => ["production", "calculator"].includes(row.domain) && predictions.get(row.id)?.action !== row.expectedAction).map((row) => {
  const prediction = predictions.get(row.id) || {};
  let rootCause = "modelo";
  let strategy = "Manter no FunctionGemma e revisar prompt somente após contratos e aliases.";
  if (row.domain === "production") {
    rootCause = prediction.reason === "NO_ACTION_SEARCH_MATCH" ? "intent ausente" : "descrição ruim da função";
    strategy = prediction.reason === "NO_ACTION_SEARCH_MATCH"
      ? "Adicionar aliases de impressão pendente e roteamento determinístico."
      : "Certificar production.list_queue no Registry e rotear consultas inequívocas localmente.";
  } else if (prediction.reason === "NO_ACTION_SEARCH_MATCH") {
    rootCause = "nomes ambíguos";
    strategy = "Normalizar erros PT-BR conservadores e reconhecer intenção de orçamento antes do modelo.";
  } else {
    rootCause = "argumentos ambíguos";
    strategy = "Extrair os argumentos presentes localmente e pedir somente os campos faltantes; nunca calcular com dados inventados.";
  }
  return {
    id: row.id, domain: row.domain, INPUT: row.input, EXPECTED_INTENT: row.expectedAction,
    MODEL_OUTPUT: prediction.action || prediction.reason || "NO_TOOL", ROOT_CAUSE: rootCause, FIX_STRATEGY: strategy
  };
});
const out = path.join(root, "docs/ai/PRODUCTION_CALCULATOR_FAILURE_ANALYSIS.jsonl");
fs.mkdirSync(path.dirname(out), { recursive: true });
fs.writeFileSync(out, `${rows.map((row) => JSON.stringify(row)).join("\n")}\n`);
const counts = rows.reduce((all, row) => { all[row.ROOT_CAUSE] = (all[row.ROOT_CAUSE] || 0) + 1; return all; }, {});
console.log(JSON.stringify({ cases: rows.length, production: rows.filter((row) => row.domain === "production").length, calculator: rows.filter((row) => row.domain === "calculator").length, rootCauses: counts, output: out }, null, 2));
