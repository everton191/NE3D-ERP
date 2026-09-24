/**
 * scripts/ai-evals/add-extra-cases.js
 *
 * Adiciona os 11 casos restantes ao dataset principal.
 * Rodar quando precisar completar os déficits de domínio.
 *
 * Metas:
 *   Inventory:    20 → 25 (+5)
 *   Calculator:   19 → 20 (+1)
 *   Cash:         18 → 20 (+2)
 *   Production:   12 → 15 (+3)
 *   Orders:       34 → 35 (+1) (se necessário)
 */

"use strict";

const fs = require("fs");

const datasetPath = "fixtures/ai-evals/toolcalling-dataset.json";
const samplePath = "fixtures/ai-evals/sample-response.json";

function loadJson(path) {
  return JSON.parse(fs.readFileSync(path, "utf-8"));
}

function saveJson(path, data) {
  fs.writeFileSync(path, JSON.stringify(data, null, 2), "utf-8");
}

function addCases(dataset, cases) {
  const existingIds = new Set(dataset.map(c => c.id));
  const toAdd = cases.filter(c => !existingIds.has(c.id));
  if (toAdd.length === 0) {
    console.log("Nenhum caso novo para adicionar (todos já existem).");
    return dataset;
  }
  dataset.push(...toAdd);
  console.log(`Adicionados ${toAdd.length} casos novos.`);
  return dataset;
}

function addSampleResponses(sample, cases) {
  let added = 0;
  for (const dc of cases) {
    if (sample[dc.id]) continue;
    const expected = dc.expected_action;
    const args = dc.expected_args && typeof dc.expected_args === "object"
      ? JSON.parse(JSON.stringify(dc.expected_args))
      : {};
    if (expected === "NO_TOOL" || expected === null || !expected) {
      sample[dc.id] = {
        case_id: dc.id,
        model_response: {
          kind: "NO_TOOL",
          reason: "NO_ALLOWED_TOOL",
          diagnostics: { backend: "mock-perfect-adapter" }
        }
      };
    } else {
      sample[dc.id] = {
        case_id: dc.id,
        model_response: {
          kind: "TOOL_CALL",
          tool: expected,
          arguments: args,
          confidence: 0.95,
          diagnostics: { backend: "mock-perfect-adapter" }
        }
      };
    }
    added++;
  }
  if (added > 0) {
    console.log(`Adicionadas ${added} respostas de exemplo.`);
  }
  return sample;
}

// ─────────────────────────────────────────────
// CASOS EXTRAS POR DOMÍNIO
// ─────────────────────────────────────────────

const extraCases = [
  // ========== INVENTORY +5 (20 → 25) ==========
  {
    id: "INV-113",
    domain: "inventory",
    user_prompt: "tem dois rolos de PLA 9950 com peso diferente — qual uso?",
    expected_intent: "inventory.search",
    expected_action: "inventory.search",
    expected_args: { query: "PLA 9950" },
    expected_result_type: "material_refs",
    requires_confirmation: false,
    allowed_tools: ["inventory.search", "inventory.get_roll"],
    forbidden_tools: ["inventory.consume", "inventory.reserve"],
    notes: "Caso difícil: rolo ambíguo — dois rolos PLA com mesmo material, pesos diferentes. Buscar e deixar UI escolher."
  },
  {
    id: "INV-114",
    domain: "inventory",
    user_prompt: "preciso de 5kg de ABS mas sobra apenas 2kg em estoque",
    expected_intent: "inventory.search",
    expected_action: "inventory.search",
    expected_args: { query: "ABS" },
    expected_result_type: "material_refs",
    requires_confirmation: false,
    allowed_tools: ["inventory.search"],
    forbidden_tools: ["inventory.reserve", "inventory.consume"],
    notes: "Caso difícil: material insuficiente — modelo busca, não reserva automaticamente"
  },
  {
    id: "INV-115",
    domain: "inventory",
    user_prompt: "transforma 3 rolos de 1kg em gramas para calculo",
    expected_intent: "inventory.search",
    expected_action: "inventory.search",
    expected_args: { query: "rolo 1kg" },
    expected_result_type: "material_refs",
    requires_confirmation: false,
    allowed_tools: ["inventory.search"],
    forbidden_tools: ["inventory.consume"],
    notes: "Caso difícil: conversão unidades (kg → g). O modelo deve apenas buscar, não calcular."
  },
  {
    id: "INV-116",
    domain: "inventory",
    user_prompt: "busca por filamento ackml — nome parcial",
    expected_intent: "inventory.search",
    expected_action: "inventory.search",
    expected_args: { query: "ackml" },
    expected_result_type: "material_refs",
    requires_confirmation: false,
    allowed_tools: ["inventory.search"],
    forbidden_tools: ["inventory.consume", "inventory.reserve"],
    notes: "Caso difícil: nome parcial de material (ABCMEL → busca por ackml)"
  },
  {
    id: "INV-117",
    domain: "inventory",
    user_prompt: "escolha entre rolo 33 e rolo 44 para usar no pedido 99",
    expected_intent: "inventory.search",
    expected_action: "inventory.search",
    expected_args: { query: "rolo 33 rolo 44" },
    expected_result_type: "material_refs",
    requires_confirmation: false,
    allowed_tools: ["inventory.search", "inventory.get_roll"],
    forbidden_tools: ["inventory.consume", "inventory.reserve"],
    notes: "Caso difícil: escolha entre múltiplos rolos — modelo busca, UI decide"
  },

  // ========== CALCULATOR +1 (19 → 20) ==========
  {
    id: "CAL-109",
    domain: "calculator",
    user_prompt: "cada peca e de 200g, tempo 25min por peca, quantidade 15 — material PLA branco",
    expected_intent: "calculator.quote",
    expected_action: "calculator.quote",
    expected_args: { weight_grams: 3000, time_minutes: 375, quantity: 15 },
    expected_result_type: "quote",
    requires_confirmation: false,
    allowed_tools: ["calculator.quote"],
    forbidden_tools: ["orders.prepare_create", "inventory.consume"],
    notes: "Cenário multitool: quantidade × peso × tempo + referência a material. O modelo deve extrair calculator.quote e descartar referência ao material (READ apenas)."
  },

  // ========== CASH +2 (18 → 20) ==========
  {
    id: "CSH-111",
    domain: "cash",
    user_prompt: "o caixa da sessao 55 ja foi fechado",
    expected_intent: "cash.get_summary",
    expected_action: "cash.get_summary",
    expected_args: { period: "today" },
    expected_result_type: "summary",
    requires_confirmation: false,
    allowed_tools: ["cash.get_summary"],
    forbidden_tools: ["cash.close_session", "cash.commit_withdrawal"],
    notes: "Caso difícil: sessão já fechada — modelo deve consultar resumo, não tentar fechar novamente"
  },
  {
    id: "CSH-112",
    domain: "cash",
    user_prompt: "reversao da venda do pedido 777 — R$ 189,90 de devolucao",
    expected_intent: "cash.prepare_deposit",
    expected_action: "cash.prepare_deposit",
    expected_args: { amount: 189.9, description: "reversao venda pedido 777", idempotency_key: "<gerado>" },
    expected_result_type: "prepared_operation",
    requires_confirmation: false,
    allowed_tools: ["cash.prepare_deposit"],
    forbidden_tools: ["cash.commit_deposit", "orders.cancel"],
    notes: "Caso difícil: reversão/recebimento com referência de pedido. WRITE do cash com contexto do pedido (PREPARE, não WRITE do order)"
  },

  // ========== PRODUCTION +3 (12 → 15) ==========
  {
    id: "PRD-108",
    domain: "production",
    user_prompt: "tem dois trabalhos com o mesmo nome Pedido 55 na fila",
    expected_intent: "production.list_queue",
    expected_action: "production.list_queue",
    expected_args: { status: "all" },
    expected_result_type: "job_refs",
    requires_confirmation: false,
    allowed_tools: ["production.list_queue"],
    forbidden_tools: ["production.prepare_job", "production.change_status"],
    notes: "Caso difícil: job ambíguo — dois trabalhos com mesmo nome. Modelo lista fila."
  },
  {
    id: "PRD-109",
    domain: "production",
    user_prompt: "imprimir o pedido 88 mas nao tem material ABS em estoque",
    expected_intent: "inventory.search",
    expected_action: "inventory.search",
    expected_args: { query: "ABS" },
    expected_result_type: "material_refs",
    requires_confirmation: false,
    allowed_tools: ["inventory.search"],
    forbidden_tools: ["inventory.consume", "inventory.reserve", "production.commit_job"],
    notes: "Caso difícil: material bloqueando produção — modelo busca estoque (READ), não tenta produzir sem material"
  },
  {
    id: "PRD-110",
    domain: "production",
    user_prompt: "marcar como pronto o trabalho do pedido 44",
    expected_intent: "production.prepare_change_status",
    expected_action: "production.prepare_change_status",
    expected_args: { job_id: "44", status: "ready", idempotency_key: "<gerado>" },
    expected_result_type: "prepared_operation",
    requires_confirmation: false,
    allowed_tools: ["production.prepare_change_status"],
    forbidden_tools: ["production.change_status"],
    notes: "Caso difícil: transição de status solicitada pelo usuário — modelo faz PREPARE, não WRITE direto"
  }
];

// ─────────────────────────────────────────────
// EXECUTAR
// ─────────────────────────────────────────────

const dataset = loadJson(datasetPath);
const sample = loadJson(samplePath);

const before = dataset.length;
const updatedDataset = addCases(dataset, extraCases);
saveJson(datasetPath, updatedDataset);

addSampleResponses(sample, extraCases);
saveJson(samplePath, sample);

const after = updatedDataset.length;
console.log(`Dataset: ${before} → ${after} casos (total: ${after})`);

// Resumo por domínio
const doms = {};
updatedDataset.forEach(c => { doms[c.domain] = (doms[c.domain] || 0) + 1; });

console.log("\n=== Estado atual do dataset ===");
const metas = {
  orders: 35, customers: 15, inventory: 25,
  calculator: 20, cash: 20, production: 15,
  printers: 10, products: 10
};
Object.entries(doms)
  .sort(([a], [b]) => a.localeCompare(b))
  .forEach(([d, c]) => {
    const meta = metas[d];
    const ok = meta ? c >= meta : null;
    console.log(`  ${d.padEnd(12)}: ${String(c).padStart(3)} / ${meta || "—"} ${ok !== null ? (ok ? "✓" : "✗") : ""}`);
  });
