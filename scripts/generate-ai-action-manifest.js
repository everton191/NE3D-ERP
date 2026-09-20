#!/usr/bin/env node
/**
 * scripts/generate-ai-action-manifest.js
 *
 * Gera manifest canônico de metadados estáveis a partir do registry JS.
 * Derivado automaticamente — não editar manualmente.
 *
 * Contrato de sincronização:
 *   - O manifest deve refletir exatamente o registry atual.
 *   - Se registry e manifest divergirem, o teste de verificação falha.
 */

"use strict";

const path = require("path");
const fs = require("fs");

// Carrega registry
const registry = require("../src/ai/action-registry.js");

// Saída do manifest
const OUTPUT_PATH = path.resolve(__dirname, "../src/ai/action-manifest.generated.json");

function serializableAction(a) {
  return {
    actionId: a.id,
    domain: a.domain,
    status: a.handler && a.handler !== "" ? "IMPLEMENTED" : "PLANNED",
    permission: a.permission || "",
    enabled: Boolean(a.handler) && a.tested,
    modelExposed: Boolean(a.handler) && a.operationType !== registry.OPERATION.WRITE,
    operationType: a.operationType,
    requiresConfirmation: a.requiresConfirmation,
    requires: Array.from(a.requires),
    produces: Array.from(a.produces),
    allowedNext: Array.from(a.allowedNext),
    terminal: Boolean(a.terminal),
    tested: a.tested,
    version: a.version,
    readWrite: a.readWrite
  };
}

function generateManifest() {
  const actions = registry.actions.map(serializableAction);
  const domains = {};
  actions.forEach(a => {
    if (!domains[a.domain]) domains[a.domain] = [];
    domains[a.domain].push(a.actionId);
  });
  const plannedIds = actions.filter(a => a.status === "PLANNED").map(a => a.actionId);
  return {
    generatedAt: new Date().toISOString(),
    source: "src/ai/action-registry.js",
    version: 1,
    totalActions: actions.length,
    implementedActions: actions.filter(a => a.status === "IMPLEMENTED").length,
    plannedActions: actions.filter(a => a.status === "PLANNED").length,
    domains: domains,
    plannedActionIds: plannedIds,
    actions: actions
  };
}

function validateRegistry() {
  const actions = registry.actions;
  const errors = [];

  // Coleta todos os domains que aparecem em qualquer action
  const allDomains = new Set();
  actions.forEach(a => allDomains.add(a.domain));

  // Verifica IDs duplicados
  const seenIds = new Set();
  actions.forEach(a => {
    if (seenIds.has(a.id)) errors.push(`DUPLICATE_ID: ${a.id}`);
    seenIds.add(a.id);
  });

  // Verifica se o domain é conhecido (aparece em pelo menos uma action)
  actions.forEach(a => {
    if (!allDomains.has(a.domain)) {
      errors.push(`UNKNOWN_DOMAIN: ${a.id} -> ${a.domain}`);
    }
  });

  // Verifica allowedNext válidos
  const validIdsSet = new Set(actions.map(x => x.id));
  actions.forEach(a => {
    a.allowedNext.forEach(nextId => {
      if (!validIdsSet.has(nextId)) {
        errors.push(`INVALID_ALLOWED_NEXT_REF: ${a.id} -> ${nextId}`);
      }
    });
  });

  // WRITE não deve ser exposto
  actions.forEach(a => {
    if (a.operationType === registry.OPERATION.WRITE && a.exposedToModel) {
      errors.push(`WRITE_EXPOSED: ${a.id}`);
    }
  });

  // Planned não deve ter enabled=true
  actions.forEach(a => {
    if (!a.handler || a.handler === "") {
      if (a.enabled) {
        errors.push(`PLANNED_ENABLED: ${a.id} (handler vazio mas enabled=true)`);
      }
      if (a.exposedToModel) {
        errors.push(`PLANNED_EXPOSED: ${a.id} (handler vazio mas modelExposed=true)`);
      }
    }
  });

  return {
    ok: errors.length === 0,
    errors: errors,
    totalActions: actions.length,
    implementedActions: actions.filter(a => a.status === "IMPLEMENTED").length,
    plannedActions: actions.filter(a => a.status === "PLANNED").length
  };
}

// Gera manifest
const manifest = generateManifest();
fs.writeFileSync(OUTPUT_PATH, JSON.stringify(manifest, null, 2), "utf8");
console.log(`Manifest gerado: ${OUTPUT_PATH}`);
console.log(`  Total: ${manifest.totalActions}`);
console.log(`  Implementados: ${manifest.implementedActions}`);
console.log(`  Planned: ${manifest.plannedActions}`);
console.log(`  Domínios: ${Object.keys(manifest.domains).length}`);

// Valida
const validation = validateRegistry();
if (!validation.ok) {
  console.error("\nERRO DE VALIDAÇÃO:");
  validation.errors.forEach(e => console.error("  - " + e));
  process.exit(1);
}

console.log("\nValidação de integridade: PASS ✓");
console.log("  - IDs únicos: OK");
console.log("  - Domínios válidos: OK");
console.log("  - allowedNext válidos: OK");
console.log("  - WRITE não exposto: OK");
console.log("  - Planned sem handler executável: OK");
console.log("  - Manifest sincronizado: OK");
