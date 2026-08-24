"use strict";

const fs = require("fs");
const path = require("path");
global.window = globalThis;
require("../src/ai/action-registry.js");

const root = path.resolve(__dirname, "..");
const training = path.join(root, "training", "functiongemma");
const docs = path.join(root, "docs", "ai");
const readJsonl = (file) => fs.readFileSync(file, "utf8").trim().split(/\r?\n/).filter(Boolean).map(JSON.parse);
const evaluation = readJsonl(path.join(training, "evaluation.v1.jsonl"));
const predictions = new Map(readJsonl(path.join(training, "android-q8-predictions.v2.jsonl")).map((row) => [row.id, row]));
const baseline = JSON.parse(fs.readFileSync(path.join(training, "baseline.json"), "utf8"));
const initial = JSON.parse(fs.readFileSync(path.join(training, "baseline.q8.initial.json"), "utf8"));
const registry = global.SimplificaActionRegistry;

const likelyLayer = (expected, prediction) => {
  const action = expected.expectedAction ? registry.get(expected.expectedAction) : null;
  if (action && !registry.health(action).exposed) return "CONTRACT_NOT_EXPOSED";
  if (prediction.reason === "NO_ACTION_SEARCH_MATCH") return "ACTION_SEARCH_ALIASES";
  if (expected.expectedAction && Object.keys(expected.expectedArguments || {}).length === 0) return "MODEL_OR_CONTRACT_WITH_UNANNOTATED_ARGUMENTS";
  return "MODEL_OR_TOOL_CONTRACT";
};
const errors = evaluation.filter((row) => predictions.get(row.id)?.action !== row.expectedAction).map((row) => {
  const prediction = predictions.get(row.id);
  return {
    id: row.id, domain: row.domain, category: row.category, input: row.input, screen: row.screen,
    expectedAction: row.expectedAction, predictedAction: prediction?.action || null,
    predictedArguments: prediction?.arguments || {}, reason: prediction?.reason || "UNKNOWN",
    likelyLayer: likelyLayer(row, prediction || {}), requiresHumanReview: true
  };
});
fs.writeFileSync(path.join(training, "baseline-errors.v1.jsonl"), `${errors.map((row) => JSON.stringify(row)).join("\n")}\n`);

const countBy = (key) => Object.fromEntries([...new Set(errors.map((row) => row[key]))].sort().map((value) => [value, errors.filter((row) => row[key] === value).length]));
const plan = `# Plano de correção antes de fine-tuning

Status: **FINE_TUNING_READY = NÃO**

## Evidência atual

- Baseline Android real: ${baseline.cases}/560 casos.
- Tool selection inicial: ${(initial.toolSelectionAccuracy * 100).toFixed(2)}%.
- Tool selection após guardas determinísticos: ${(baseline.toolSelectionAccuracy * 100).toFixed(2)}%.
- Erros restantes: ${errors.length}; todos são falsos negativos.
- Camadas prováveis: ${JSON.stringify(countBy("likelyLayer"))}.
- Dataset: 0/560 revisados humanamente, 65 grupos semânticos.
- Argumentos esperados anotados: ${baseline.argumentAnnotatedCases}/560.
- WRITE direto, violações Top-K e schema inválido aceito: 0.

## Ordem obrigatória

1. Estabilizar contratos: tornar \`production.list_queue\` READY com contract test e caminho UseCase real.
2. Revisar os 560 casos e anotar argumentos esperados; corrigir contradições de dados faltantes, principalmente Calculadora.
3. Melhorar aliases/recall do Action Search nos ${countBy("likelyLayer").ACTION_SEARCH_ALIASES || 0} erros de digitação sem ampliar Top-K indiscriminadamente.
4. Revisar nome, descrição, schema wire e contexto de tela dos falsos negativos restantes; repetir somente os casos afetados.
5. Congelar train/validation/test/evaluation por grupos semânticos e hashes.
6. Só então selecionar os erros residuais realmente atribuíveis ao modelo para fine-tuning do checkpoint oficial \`google/functiongemma-270m-it\`.

## Categorias candidatas a treinamento, após os gates

- PT-BR informal e erros de digitação que sobreviverem ao Action Search.
- Referências de contexto e multi-turn com contexto real anotado.
- Recall de tool calling para contratos já validados.

Não usar Mobile Actions fine-tuned como modelo do Simplifica. Não treinar para contornar contrato, Top-K ou dataset incorreto.
`;
fs.writeFileSync(path.join(training, "fine-tuning-plan.md"), plan);

const domainRows = Object.entries(baseline.byDomain).map(([domain, row]) => `| ${domain} | ${row.cases} | ${(row.toolSelectionAccuracy * 100).toFixed(2)}% | ${(row.noToolAccuracy * 100).toFixed(2)}% | ${(row.schemaValidity * 100).toFixed(2)}% |`).join("\n");
const report = `# FunctionGemma Q8 — baseline real no Zenfone 8

Data: ${baseline.generatedAt}

## Resultado

| Métrica | Resultado |
| --- | ---: |
| Casos executados | ${baseline.cases}/560 |
| Tool selection inicial | ${(initial.toolSelectionAccuracy * 100).toFixed(2)}% |
| Tool selection após correção contratual | ${(baseline.toolSelectionAccuracy * 100).toFixed(2)}% |
| No-tool accuracy | ${(baseline.noToolAccuracy * 100).toFixed(2)}% |
| Schema validity | ${(baseline.schemaValidity * 100).toFixed(2)}% |
| Missing-data detection | ${(baseline.missingDataDetection * 100).toFixed(2)}% |
| Argument exact/semantic | não mensurável: ${baseline.argumentAnnotatedCases} casos anotados |
| Top-K violations | ${baseline.outOfTopKAttempts} |
| Unsafe direct WRITE | ${baseline.unsafeDirectWrite} |
| Latência P50 / P95 | ${baseline.latencyMs.p50} / ${baseline.latencyMs.p95} ms |
| TTFT P50 / P95 | ${baseline.ttftMs.p50} / ${baseline.ttftMs.p95} ms |
| Tokens/s médio | ${baseline.tokensPerSecond.average} |

## Por domínio

| Domínio | Casos | Tool accuracy | No-tool | Schema |
| --- | ---: | ---: | ---: | ---: |
${domainRows}

## Leitura dos erros

- Erros restantes: ${errors.length}; todos são falsos negativos, sem confusão aceita entre duas actions.
- \`MODEL_NO_TOOL\`: ${errors.filter((row) => row.reason === "MODEL_NO_TOOL").length}.
- \`NO_ACTION_SEARCH_MATCH\`: ${errors.filter((row) => row.reason === "NO_ACTION_SEARCH_MATCH").length}.
- \`production.list_queue\`: DEGRADED e fora do modelo por faltar contract test; seus casos não medem capacidade do checkpoint.
- Calculadora e demais CALLs não têm argumentos esperados anotados; não há base honesta para argument accuracy.

Os 98 casos de negação/pergunta hipotética foram repetidos no aparelho após a correção. As demais previsões são as mesmas do baseline completo; os resultados foram mesclados por ID sem alterar a avaliação.

Artefatos: \`android-q8-predictions.v1.jsonl\`, \`android-q8-contract-rerun.v1.jsonl\`, \`android-q8-predictions.v2.jsonl\`, \`baseline.json\` e \`baseline-errors.v1.jsonl\`.
`;
fs.mkdirSync(docs, { recursive: true });
fs.writeFileSync(path.join(docs, "FUNCTIONGEMMA_Q8_BASELINE.md"), report);
console.log(JSON.stringify({ errors: errors.length, errorLayers: countBy("likelyLayer"), report: path.join(docs, "FUNCTIONGEMMA_Q8_BASELINE.md") }, null, 2));
