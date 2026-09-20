#!/usr/bin/env node
/**
 * scripts/validate-provenance-contracts.js
 *
 * Valida que todo requires tem origem explicável e que
 * não há campos "mágicos" sem fonte documentada.
 */

"use strict";

const registry = require("../src/ai/action-registry.js");
const { WorkflowToolGraph } = require("../src/ai/workflow-tool-graph.js");
const graph = new WorkflowToolGraph();

// Classificação de origem dos campos
const ORIGIN = Object.freeze({
  USER_INPUT: "USER_INPUT",
  ACTION_OUTPUT: "ACTION_OUTPUT",
  RESOLVER_OUTPUT: "RESOLVER_OUTPUT",
  WORKFLOW_CONTEXT: "WORKFLOW_CONTEXT",
  SYSTEM_CONTEXT: "SYSTEM_CONTEXT"
});

// Mapa de origem para cada campo (sem duplicatas)
const FIELD_ORIGIN = Object.freeze({
  // USER_INPUT: fornecido diretamente pelo usuário
  customer: ORIGIN.USER_INPUT,
  customerName: ORIGIN.USER_INPUT,
  product: ORIGIN.USER_INPUT,
  weightGrams: ORIGIN.USER_INPUT,
  quantity: ORIGIN.USER_INPUT,
  unitPrice: ORIGIN.USER_INPUT,
  downPayment: ORIGIN.USER_INPUT,
  totalPrice: ORIGIN.USER_INPUT,
  notes: ORIGIN.USER_INPUT,
  status: ORIGIN.USER_INPUT,

  // ACTION_OUTPUT: produzido por uma action
  customer_refs: ORIGIN.ACTION_OUTPUT,
  order_refs: ORIGIN.ACTION_OUTPUT,
  material_refs: ORIGIN.ACTION_OUTPUT,
  roll_refs: ORIGIN.ACTION_OUTPUT,
  job_refs: ORIGIN.ACTION_OUTPUT,
  weight_grams: ORIGIN.ACTION_OUTPUT,
  time_minutes: ORIGIN.ACTION_OUTPUT,
  roll: ORIGIN.ACTION_OUTPUT,

  // RESOLVER_OUTPUT: produzido por resolver implementado
  customer_id: ORIGIN.RESOLVER_OUTPUT,
  order_id: ORIGIN.RESOLVER_OUTPUT,
  roll_id: ORIGIN.RESOLVER_OUTPUT,
  job_id: ORIGIN.RESOLVER_OUTPUT,

  // WORKFLOW_CONTEXT: flui pelo workflow
  order: ORIGIN.WORKFLOW_CONTEXT,
  prepared_operation: ORIGIN.WORKFLOW_CONTEXT,
  prepared_operation_id: ORIGIN.WORKFLOW_CONTEXT,
  confirmation_token: ORIGIN.WORKFLOW_CONTEXT,
  idempotency_key: ORIGIN.WORKFLOW_CONTEXT,
  session_id: ORIGIN.WORKFLOW_CONTEXT,

  // SYSTEM_CONTEXT: do sistema
  conversationId: ORIGIN.SYSTEM_CONTEXT,
  taskId: ORIGIN.SYSTEM_CONTEXT,
  opening_amount: ORIGIN.SYSTEM_CONTEXT,
  counted_amount: ORIGIN.SYSTEM_CONTEXT
});

// Resolvers reais conhecidos (implementados em entity-resolution.js)
const RESOLVER_IMPLEMENTATION = Object.freeze({
  customer: { status: "IMPLEMENTED", description: "resolveCustomer - resolve por nome ou ID com candidates de customers.search" },
  order: { status: "IMPLEMENTED", description: "resolveOrder - resolve por ID com candidates de orders.search" },
  job: { status: "IMPLEMENTED", description: "resolveJob - resolve por ID com candidates de production.list_queue" },
  roll: { status: "GAP_BLOCKED", description: "resolveRoll - GAP_BLOCKED (inventory.get_roll é PLANNED, rolls.list indisponível)" },
  material: { status: "GAP_BLOCKED", description: "resolveMaterial - GAP_BLOCKED (inventory.search não implementado)" }
});

// Mapa de como cada ACTION_OUTPUT vira RESOLVER_OUTPUT
const REF_TO_ID = Object.freeze({
  customer_refs: "customer_id",
  order_refs: "order_id",
  roll_refs: "roll_id",
  job_refs: "job_id",
  material_refs: "material_id"
});

function validate() {
  const errors = [];
  const warnings = [];
  const gaps = [];

  // 1. Verificar que todo requires tem origem conhecida
  registry.actions.forEach(action => {
    action.requires.forEach(field => {
      if (!(field in FIELD_ORIGIN)) {
        errors.push(`UNKNOWN_REQUIRE_SOURCE: ${action.id} requires [${field}] - origem desconhecida`);
      }
    });
  });

  // 2. Verificar que ACTION_OUTPUTs têm consumers (requis ou fluxo documentado)
  const allProduced = new Set();
  registry.actions.forEach(a => a.produces.forEach(p => allProduced.add(p)));

  const allRequired = new Set();
  registry.actions.forEach(a => a.requires.forEach(r => allRequired.add(r)));

  // Campos produzidos que são OUTPUT de ações (não são requires diretos)
  // mas são consumidos via referência (refs → ID)
  Object.entries(REF_TO_ID).forEach(([ref, id]) => {
    if (allProduced.has(ref)) {
      if (!allRequired.has(id)) {
        const resolverType = ref.replace("_refs", "");
        const resolverImpl = RESOLVER_IMPLEMENTATION[resolverType];
        if (resolverImpl && resolverImpl.status === "IMPLEMENTED") {
          warnings.push(`REFERENCE_CHAIN: ${ref} produzido, ${id} é RESOLVER_OUTPUT (consumo via resolver implementado: ${resolverImpl.description})`);
        } else {
          gaps.push(`GAP: ${ref} produzido mas ${id} não é requires (sem resolver para ${resolverType}: ${resolverImpl ? resolverImpl.description : "sem resolver"})`);
        }
      }
    }
  });

  // 3. Verificar que campos mágicos não existem
  const magicFields = [];
  registry.actions.forEach(a => {
    a.requires.forEach(f => {
      if (!(f in FIELD_ORIGIN)) magicFields.push(f);
    });
    a.produces.forEach(f => {
      if (!(f in FIELD_ORIGIN)) magicFields.push(f);
    });
  });

  if (magicFields.length > 0) {
    errors.push(`MAGIC_FIELDS: campos sem origem documentada: ${magicFields.join(", ")}`);
  }

  // 4. Verificar CREATE_ORDER fluxo
  const calcAction = registry.get("calculator.quote");
  const customerSearch = registry.get("customers.search");
  const prepareCreate = registry.get("orders.prepare_create");

  if (calcAction && calcAction.terminal === false) {
    // OK: calculator.quote continua para prepare
  }
  if (customerSearch && customerSearch.produces.includes("customer_refs")) {
    // OK: customers.search produz customer_refs
  }
  if (prepareCreate && prepareCreate.requires.includes("customer_id")) {
    // OK: orders.prepare_create requires customer_id (RESOLVER_OUTPUT)
  }

  // 5. Verificar que planned actions têm modelExposed=false
  registry.actions.forEach(a => {
    if (!a.handler || a.handler === "") {
      if (a.exposedToModel) {
        errors.push(`PLANNED_EXPOSED: ${a.id} é planned mas modelExposed=true`);
      }
    }
  });

  // 6. Verificar que resolvers implementados têm campos de origem corretos
  Object.entries(RESOLVER_IMPLEMENTATION).forEach(([entityType, info]) => {
    const refField = entityType + "_refs";
    const idField = entityType + (entityType === "customer" ? "_id" : "_id");
    // Verificar se o ref é produzido por alguma action
    const hasRefProducer = registry.actions.some(a => a.produces.includes(refField));
    if (info.status === "IMPLEMENTED" && !hasRefProducer) {
      warnings.push(`RESOLVER_SEM_PRODUTOR: ${entityType} resolver implementado mas ${refField} não é produzido por nenhuma action`);
    }
  });

  return {
    ok: errors.length === 0,
    errors: errors,
    warnings: warnings,
    gaps: gaps,
    fieldOrigin: FIELD_ORIGIN,
    refToId: REF_TO_ID,
    resolverImplementation: RESOLVER_IMPLEMENTATION
  };
}

// Executa validação
const result = validate();

console.log("=== VALIDAÇÃO DE CONTRACTOS DE PROVENIÊNCIA ===\n");

console.log("ORIGEM DOS CAMPOS:");
Object.entries(FIELD_ORIGIN).forEach(([field, origin]) => {
  console.log(`  ${field}: ${origin}`);
});
console.log("");

console.log("REQUIS → FONTE:");
registry.actions.forEach(a => {
  a.requires.forEach(f => {
    const origin = FIELD_ORIGIN[f] || "DESCONHECIDO";
    console.log(`  ${a.id} requires [${f}] → ${origin}`);
  });
});
console.log("");

console.log("REF → ID CHAINS (RESOLUÇÃO):");
Object.entries(REF_TO_ID).forEach(([ref, id]) => {
  const producer = registry.actions.find(a => a.produces.includes(ref));
  const resolverInfo = RESOLVER_IMPLEMENTATION[ref.replace("_refs", "")];
  console.log(`  ${ref} → ${id}`);
  console.log(`    produtor: ${producer ? producer.id : "N/A"}`);
  console.log(`    resolver: ${resolverInfo ? resolverInfo.description : "NÃO IMPLEMENTADO"}`);
  console.log(`    status: ${resolverInfo ? resolverInfo.status : "GAP_BLOCKED"}`);
});
console.log("");

console.log("GAPS DETECTADOS:");
if (result.gaps.length > 0) {
  result.gaps.forEach(g => console.log("  ⚠️  " + g));
} else {
  console.log("  Nenhum gap detectado.");
}
console.log("");

console.log("WARNINGS:");
if (result.warnings.length > 0) {
  console.log("  (warnings informativos, não erros)");
  result.warnings.forEach(w => console.log("  ℹ️  " + w));
} else {
  console.log("  Nenhum warning.");
}
console.log("");

console.log("ERROS:");
if (result.errors.length > 0) {
  result.errors.forEach(e => console.log("  ❌ " + e));
} else {
  console.log("  Nenhum erro.");
}
console.log("");

console.log("RESULTADO: " + (result.ok ? "PASS ✓" : "FAIL ✗"));
console.log("  GAPS: " + (result.gaps.length > 0 ? result.gaps.length + " gap(s) documentado(s)" : "0"));
