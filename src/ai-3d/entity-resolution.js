/**
 * src/ai-3d/entity-resolution.js
 *
 * Camada determinística de resolução de entidades.
 * Transforma refs/qualifiers em IDs concretos sem usar LFM.
 *
 * CORREÇÕES FASE 5:
 * - Não inventar customers.list (usar candidates de customers.search quando disponível)
 * - Diferenciar NOT_FOUND (busca executada, retornou vazio) de GAP_BLOCKED (fonte indisponível)
 * - Interface única resolve({entityType, refs, query, selectedId, context})
 */

"use strict";

const core = global.Simplifica3dAiCore || (typeof require === "function" ? require("./core.js") : null);
const { EntityResolver, TOOL_STATUS, normalizeSearch } = core || {};

/**
 * Status de resolução de entidade.
 */
const RESOLUTION_STATUS = Object.freeze({
  RESOLVED: "RESOLVED",
  AMBIGUOUS: "AMBIGUOUS",
  NOT_FOUND: "NOT_FOUND",
  MISSING_INPUT: "MISSING_INPUT",
  GAP_BLOCKED: "GAP_BLOCKED"
});

/**
 * Resultado de resolução de entidade.
 */
class EntityResolutionResult {
  constructor(status, entity = null, id = null, matches = [], reason = "") {
    this.status = status;
    this.entity = entity;
    this.id = id;
    this.matches = matches;
    this.reason = reason;
  }

  get ok() { return this.status === RESOLUTION_STATUS.RESOLVED; }
  get ambiguous() { return this.status === RESOLUTION_STATUS.AMBIGUOUS; }
  get notFound() { return this.status === RESOLUTION_STATUS.NOT_FOUND; }
  get gapBlocked() { return this.status === RESOLUTION_STATUS.GAP_BLOCKED; }
  get missingInput() { return this.status === RESOLUTION_STATUS.MISSING_INPUT; }
}

function compactCandidate(candidate = {}) {
  const id = candidate.id || candidate.customerId || candidate.customer_id || candidate.orderId || candidate.jobId || candidate.rollId || candidate.roll_id;
  return Object.freeze({ id: String(id || ""), label: String(candidate.name || candidate.label || candidate.code || id || "") });
}

function createPendingResolution({ entityType, result, workflowGoal = "", currentStep = "" } = {}) {
  if (!result?.ambiguous) return null;
  const candidates = (result.matches || []).map(compactCandidate).filter((candidate) => candidate.id);
  if (candidates.length < 2) return null;
  return Object.freeze({
    status: RESOLUTION_STATUS.AMBIGUOUS,
    entityType: String(entityType || ""),
    workflowGoal: String(workflowGoal || ""),
    currentStep: String(currentStep || ""),
    candidates: Object.freeze(candidates)
  });
}

function resumePendingResolution(pending, selectedId) {
  const selected = String(selectedId || "").trim();
  if (!pending || pending.status !== RESOLUTION_STATUS.AMBIGUOUS || !selected) {
    return Object.freeze({ status: RESOLUTION_STATUS.MISSING_INPUT, reason: "pendingResolution ou selectedId ausente" });
  }
  const candidate = (pending.candidates || []).find((item) => item.id === selected);
  if (!candidate) return Object.freeze({ status: RESOLUTION_STATUS.NOT_FOUND, reason: "selectedId não foi apresentado como candidato" });
  return Object.freeze({ status: RESOLUTION_STATUS.RESOLVED, entityType: pending.entityType, entity: candidate, id: candidate.id, workflowGoal: pending.workflowGoal, currentStep: pending.currentStep });
}

/**
 * Interface única de resolução de entidade.
 *
 * @param {Object} params
 * @param {string} params.entityType - Tipo: customer, order, job, material, roll
 * @param {Array} [params.refs] - Refs a serem resolvidos
 * @param {string} [params.query] - Query de busca
 * @param {string} [params.selectedId] - ID selecionado
 * @param {Object} [params.context] - Contexto adicional
 * @param {Array} [params.candidates] - Candidates de uma busca REAL executada
 * @returns {EntityResolutionResult}
 */
function resolveEntity(params = {}) {
  const { entityType, refs = null, query = null, selectedId = null, candidates = null } = params;

  if (!entityType) {
    return new EntityResolutionResult(RESOLUTION_STATUS.MISSING_INPUT, null, null, [], "entityType não informado");
  }

  switch (entityType) {
    case "customer":
      return resolveCustomer({ query, refs, selectedId, candidates });
    case "order":
      return resolveOrder({ refs, selectedId, candidates });
    case "job":
      return resolveJob({ refs, selectedId, candidates });
    case "material":
      return resolveMaterial({ refs, selectedId, candidates });
    case "roll":
      return resolveRoll({ refs, selectedId, candidates });
    default:
      return new EntityResolutionResult(RESOLUTION_STATUS.MISSING_INPUT, null, null, [], `entityType desconhecido: ${entityType}`);
  }
}

/**
 * Customer resolution.
 *
 * CORREÇÃO: Não inventar customers.list. candidates vem de customers.search
 * EXECUTADO. Se customers.search foi executado e retornou [], é NOT_FOUND.
 * Se customers.search NÃO foi executado ou não disponível, é GAP_BLOCKED.
 */
function resolveCustomer({ query = null, refs = null, selectedId = null, candidates = null }) {
  // selectedId fornecido diretamente
  if (selectedId && String(selectedId).trim()) {
    if (candidates && Array.isArray(candidates) && candidates.length > 0) {
      const found = candidates.find(c => {
        const id = c.id || c.customerId || c.customer_id || "";
        return String(id).trim() === String(selectedId).trim();
      });
      if (found) {
        return new EntityResolutionResult(RESOLUTION_STATUS.RESOLVED, found, found.id || found.customerId || found.customer_id, [found], "customer encontrado por selectedId");
      }
      return new EntityResolutionResult(RESOLUTION_STATUS.NOT_FOUND, null, null, [], "customer não encontrado pelo selectedId (busca executada)");
    }
    // Sem candidates = busca não executada
    return new EntityResolutionResult(RESOLUTION_STATUS.GAP_BLOCKED, null, null, [], "GAP_BLOCKED: customers.search não executado (sem candidates)");
  }

  // query por nome
  if (query && String(query).trim()) {
    // customers.search foi executado e retornou resultados?
    if (candidates && Array.isArray(candidates) && candidates.length > 0) {
      const resolver = core?.EntityResolver ? new core.EntityResolver() : null;
      if (!resolver) {
        return new EntityResolutionResult(RESOLUTION_STATUS.GAP_BLOCKED, null, null, [], "GAP_BLOCKED: EntityResolver não disponível");
      }
      const result = resolver.resolve(query, candidates, (c) => c.name || c.label || "");
      if (result.status === TOOL_STATUS.SUCCESS) {
        return new EntityResolutionResult(RESOLUTION_STATUS.RESOLVED, result.entity, result.entity?.id || result.entity?.customerId || result.entity?.customer_id, result.matches, "customer resolvido por nome");
      }
      if (result.status === TOOL_STATUS.AMBIGUOUS) {
        return new EntityResolutionResult(RESOLUTION_STATUS.AMBIGUOUS, null, null, result.matches, "múltiplos clientes com mesmo nome");
      }
      if (result.status === TOOL_STATUS.NOT_FOUND) {
        return new EntityResolutionResult(RESOLUTION_STATUS.NOT_FOUND, null, null, result.matches, "cliente não encontrado (busca executada)");
      }
    }
    // candidates vazio = busca executada, retornou nada
    return new EntityResolutionResult(RESOLUTION_STATUS.NOT_FOUND, null, null, [], "cliente não encontrado (customers.search executado, 0 resultados)");
  }

  // refs fornecidos
  if (refs && Array.isArray(refs) && refs.length > 0) {
    if (!candidates || !Array.isArray(candidates) || candidates.length === 0) {
      return new EntityResolutionResult(RESOLUTION_STATUS.GAP_BLOCKED, null, null, [], "GAP_BLOCKED: customers.search não executado");
    }

    const results = [];
    for (const ref of refs) {
      const refStr = String(ref).trim();
      if (!refStr) {
        results.push(new EntityResolutionResult(RESOLUTION_STATUS.MISSING_INPUT, null, null, [], "ref vazio"));
        continue;
      }
      // ref é ID numérico?
      if (/^\d+$/.test(refStr)) {
        const found = candidates.find(c => {
          const id = c.id || c.customerId || c.customer_id || "";
          return String(id).trim() === refStr;
        });
        if (found) {
          results.push(new EntityResolutionResult(RESOLUTION_STATUS.RESOLVED, found, found.id || found.customerId || found.customer_id, [found], "customer encontrado por ID"));
          continue;
        }
        results.push(new EntityResolutionResult(RESOLUTION_STATUS.NOT_FOUND, null, null, [], `customer não encontrado pelo ID: ${refStr}`));
        continue;
      }
      // ref é nome - usar EntityResolver
      const resolver = core?.EntityResolver ? new core.EntityResolver() : null;
      if (resolver) {
        const nameResult = resolver.resolve(refStr, candidates, (c) => c.name || c.label || "");
        if (nameResult.status === TOOL_STATUS.SUCCESS) {
          results.push(new EntityResolutionResult(RESOLUTION_STATUS.RESOLVED, nameResult.entity, nameResult.entity?.id || nameResult.entity?.customerId || nameResult.entity?.customer_id, nameResult.matches, "customer resolvido por nome"));
          continue;
        }
        if (nameResult.status === TOOL_STATUS.AMBIGUOUS) {
          results.push(new EntityResolutionResult(RESOLUTION_STATUS.AMBIGUOUS, null, null, nameResult.matches, `ambiguous para ref: ${refStr}`));
          continue;
        }
      }
      results.push(new EntityResolutionResult(RESOLUTION_STATUS.NOT_FOUND, null, null, [], `customer não encontrado para ref: ${refStr}`));
    }
    return results.length === 1 ? results[0] : results;
  }

  return new EntityResolutionResult(RESOLUTION_STATUS.MISSING_INPUT, null, null, [], "customer: query, refs ou selectedId necessário");
}

/**
 * Order resolution.
 */
function resolveOrder({ refs = null, selectedId = null, candidates = null }) {
  if (selectedId && String(selectedId).trim()) {
    if (candidates && Array.isArray(candidates) && candidates.length > 0) {
      const found = candidates.find(o => {
        const id = o.id || o.orderId || "";
        return String(id).trim() === String(selectedId).trim();
      });
      if (found) {
        return new EntityResolutionResult(RESOLUTION_STATUS.RESOLVED, found, found.id || found.orderId || "", [found], "order encontrado por selectedId");
      }
      return new EntityResolutionResult(RESOLUTION_STATUS.NOT_FOUND, null, null, [], "order não encontrado pelo selectedId (busca executada)");
    }
    return new EntityResolutionResult(RESOLUTION_STATUS.GAP_BLOCKED, null, null, [], "GAP_BLOCKED: orders.search não executado");
  }

  if (refs && Array.isArray(refs) && refs.length > 0) {
    if (!candidates || !Array.isArray(candidates) || candidates.length === 0) {
      return new EntityResolutionResult(RESOLUTION_STATUS.GAP_BLOCKED, null, null, [], "GAP_BLOCKED: orders.search não executado");
    }

    const results = [];
    for (const ref of refs) {
      const refStr = String(ref).trim();
      if (!refStr) {
        results.push(new EntityResolutionResult(RESOLUTION_STATUS.MISSING_INPUT, null, null, [], "ref vazio"));
        continue;
      }
      if (/^\d+$/.test(refStr)) {
        const found = candidates.find(o => {
          const id = o.id || o.orderId || "";
          return String(id).trim() === refStr;
        });
        if (found) {
          results.push(new EntityResolutionResult(RESOLUTION_STATUS.RESOLVED, found, found.id || found.orderId || "", [found], "order encontrado por ID"));
          continue;
        }
        results.push(new EntityResolutionResult(RESOLUTION_STATUS.NOT_FOUND, null, null, [], `order não encontrado pelo ID: ${refStr}`));
        continue;
      }
      results.push(new EntityResolutionResult(RESOLUTION_STATUS.NOT_FOUND, null, null, [], `order não encontrado para ref: ${refStr}`));
    }
    return results.length === 1 ? results[0] : results;
  }

  return new EntityResolutionResult(RESOLUTION_STATUS.MISSING_INPUT, null, null, [], "order: refs ou selectedId necessário");
}

/**
 * Job resolution.
 */
function resolveJob({ refs = null, selectedId = null, candidates = null }) {
  if (selectedId && String(selectedId).trim()) {
    if (candidates && Array.isArray(candidates) && candidates.length > 0) {
      const found = candidates.find(j => {
        const id = j.id || j.jobId || "";
        return String(id).trim() === String(selectedId).trim();
      });
      if (found) {
        return new EntityResolutionResult(RESOLUTION_STATUS.RESOLVED, found, found.id || found.jobId || "", [found], "job encontrado por selectedId");
      }
      return new EntityResolutionResult(RESOLUTION_STATUS.NOT_FOUND, null, null, [], "job não encontrado pelo selectedId (busca executada)");
    }
    return new EntityResolutionResult(RESOLUTION_STATUS.GAP_BLOCKED, null, null, [], "GAP_BLOCKED: production.list_queue não executado");
  }

  if (refs && Array.isArray(refs) && refs.length > 0) {
    if (!candidates || !Array.isArray(candidates) || candidates.length === 0) {
      return new EntityResolutionResult(RESOLUTION_STATUS.GAP_BLOCKED, null, null, [], "GAP_BLOCKED: production.list_queue não executado");
    }

    const results = [];
    for (const ref of refs) {
      const refStr = String(ref).trim();
      if (!refStr) {
        results.push(new EntityResolutionResult(RESOLUTION_STATUS.MISSING_INPUT, null, null, [], "ref vazio"));
        continue;
      }
      if (/^\d+$/.test(refStr)) {
        const found = candidates.find(j => {
          const id = j.id || j.jobId || "";
          return String(id).trim() === refStr;
        });
        if (found) {
          results.push(new EntityResolutionResult(RESOLUTION_STATUS.RESOLVED, found, found.id || found.jobId || "", [found], "job encontrado por ID"));
          continue;
        }
        results.push(new EntityResolutionResult(RESOLUTION_STATUS.NOT_FOUND, null, null, [], `job não encontrado pelo ID: ${refStr}`));
        continue;
      }
      results.push(new EntityResolutionResult(RESOLUTION_STATUS.NOT_FOUND, null, null, [], `job não encontrado para ref: ${refStr}`));
    }
    return results.length === 1 ? results[0] : results;
  }

  return new EntityResolutionResult(RESOLUTION_STATUS.MISSING_INPUT, null, null, [], "job: refs ou selectedId necessário");
}

/**
 * Material resolution.
 * GAP_BLOCKED: inventory.search não implementado.
 */
function resolveMaterial({ refs = null, selectedId = null, candidates = null }) {
  return resolveCandidateEntity("material", { refs, selectedId, candidates, source: "inventory.search" });
}

/**
 * Roll resolution.
 * Não implementa inventory.get_roll (PLANNED), apenas resolve quando roll_refs é ID válido.
 */
function resolveRoll({ refs = null, selectedId = null, candidates = null }) {
  return resolveCandidateEntity("roll", { refs, selectedId, candidates, source: "inventory.search" });
  /* legacy implementation retained below for historical provenance */
  if (selectedId && String(selectedId).trim()) {
    if (candidates && Array.isArray(candidates) && candidates.length > 0) {
      const found = candidates.find(r => {
        const id = r.id || r.rollId || r.roll_id || "";
        return String(id).trim() === String(selectedId).trim();
      });
      if (found) {
        return new EntityResolutionResult(RESOLUTION_STATUS.RESOLVED, found, found.id || found.rollId || found.roll_id || "", [found], "roll encontrado por selectedId");
      }
      return new EntityResolutionResult(RESOLUTION_STATUS.NOT_FOUND, null, null, [], "roll não encontrado pelo selectedId (busca executada)");
    }
    return new EntityResolutionResult(RESOLUTION_STATUS.GAP_BLOCKED, null, null, [], "GAP_BLOCKED: rolls.list não disponível (inventory.get_roll é PLANNED)");
  }

  if (refs && Array.isArray(refs) && refs.length > 0) {
    if (!candidates || !Array.isArray(candidates) || candidates.length === 0) {
      return new EntityResolutionResult(RESOLUTION_STATUS.GAP_BLOCKED, null, null, [], "GAP_BLOCKED: rolls.list não disponível (inventory.get_roll é PLANNED)");
    }

    const results = [];
    for (const ref of refs) {
      const refStr = String(ref).trim();
      if (!refStr) {
        results.push(new EntityResolutionResult(RESOLUTION_STATUS.MISSING_INPUT, null, null, [], "ref vazio"));
        continue;
      }
      if (/^\d+$/.test(refStr)) {
        const found = candidates.find(r => {
          const id = r.id || r.rollId || r.roll_id || "";
          return String(id).trim() === refStr;
        });
        if (found) {
          results.push(new EntityResolutionResult(RESOLUTION_STATUS.RESOLVED, found, found.id || found.rollId || found.roll_id || "", [found], "roll encontrado por ID"));
          continue;
        }
        results.push(new EntityResolutionResult(RESOLUTION_STATUS.NOT_FOUND, null, null, [], `roll não encontrado pelo ID: ${refStr}`));
        continue;
      }
      results.push(new EntityResolutionResult(RESOLUTION_STATUS.NOT_FOUND, null, null, [], `roll não encontrado para ref: ${refStr}`));
    }
    return results.length === 1 ? results[0] : results;
  }

  return new EntityResolutionResult(RESOLUTION_STATUS.MISSING_INPUT, null, null, [], "roll: refs ou selectedId necessário");
}

function resolveCandidateEntity(entityType, { refs = null, selectedId = null, candidates = null, source = "READ" } = {}) {
  if (!Array.isArray(candidates)) return new EntityResolutionResult(RESOLUTION_STATUS.GAP_BLOCKED, null, null, [], `GAP_BLOCKED: ${source} não executado`);
  const values = selectedId ? [selectedId] : Array.isArray(refs) ? refs : [];
  if (!values.length) return new EntityResolutionResult(RESOLUTION_STATUS.MISSING_INPUT, null, null, [], `${entityType}: refs ou selectedId necessário`);
  const ref = String(values[0] || "").trim();
  if (!ref) return new EntityResolutionResult(RESOLUTION_STATUS.MISSING_INPUT, null, null, [], "ref vazio");
  const exact = candidates.filter((item) => String(item?.id || item?.[`${entityType}Id`] || "") === ref);
  if (exact.length === 1) return new EntityResolutionResult(RESOLUTION_STATUS.RESOLVED, exact[0], String(exact[0].id || exact[0][`${entityType}Id`]), exact, `${entityType} resolvido por ID retornado pelo READ`);
  if (exact.length > 1) return new EntityResolutionResult(RESOLUTION_STATUS.AMBIGUOUS, null, null, exact, `${entityType} ambíguo`);
  return new EntityResolutionResult(RESOLUTION_STATUS.NOT_FOUND, null, null, [], `${entityType} não encontrado no resultado de ${source}`);
}

// Canonical contract adapter. It deliberately delegates to the existing resolver
// above so IDs can only originate from a real candidate returned by the ERP.
function resolveCanonicalEntity(params = {}) {
  const entityType = String(params.entityType || "");
  const resolved = resolveEntity(params);
  const result = Array.isArray(resolved) ? resolved[0] : resolved;
  const status = result?.status === RESOLUTION_STATUS.MISSING_INPUT || result?.status === RESOLUTION_STATUS.GAP_BLOCKED ? "INVALID" : (result?.status || "INVALID");
  const candidates = (result?.matches || []).map(compactCandidate).filter((candidate) => candidate.id);
  const entity = result?.entity || null;
  return Object.freeze({
    status,
    entityType,
    entityId: result?.id ? String(result.id) : "",
    displayName: String(entity?.name || entity?.label || entity?.code || ""),
    confidence: status === "RESOLVED" ? 1 : 0,
    candidates: Object.freeze(candidates),
    reason: String(result?.reason || "")
  });
}

// Export
const entityResolutionApi = Object.freeze({
  RESOLUTION_STATUS,
  EntityResolutionResult,
  createPendingResolution,
  resumePendingResolution,
  resolveEntity,
  resolveCanonicalEntity,
  resolveCustomer,
  resolveOrder,
  resolveJob,
  resolveMaterial,
  resolveRoll
});

if (typeof global !== "undefined") {
  global.Simplifica3dEntityResolution = entityResolutionApi;
}

if (typeof module !== "undefined" && module.exports) {
  module.exports = entityResolutionApi;
}
