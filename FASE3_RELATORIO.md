MODELO: NEMOTRON

FASE:
4 - Contratos de Estado, Proveniência e Cobertura de Workflows

BRANCH:
codex/melhorias-setembro-2026

HEAD INICIAL:
7e73f06ff4af8dabf593c691da1b1de2f624ac47

HEAD FINAL:
7e73f06ff4af8dabf593c691da1b1de2f624ac47

CAMPOS AUDITADOS:
- 30 campos classificados por origem

USER_INPUT:
- customer, customerName, product, weightGrams, quantity, unitPrice, downPayment, totalPrice, notes, status

ACTION_OUTPUT:
- customer_refs, order_refs, material_refs, roll_refs, job_refs, weight_grams, time_minutes, roll

RESOLVER_OUTPUT:
- customer_id, order_id, roll_id, job_id

WORKFLOW_CONTEXT:
- order, prepared_operation, prepared_operation_id, confirmation_token, idempotency_key, session_id

SYSTEM_CONTEXT:
- conversationId, taskId, opening_amount, counted_amount

RESOLVERS REAIS ENCONTRADOS:
- EntityResolver: resolve customer_refs → customerId (exato/único, ambiguidade, fallback único)
- ContinuationResolver: extrai pricing args (weight_grams, time_minutes) do texto → ACTION_OUTPUT
- extractOrderSeed: extrai campos do pedido do texto → seed para ORDER.CREATE
- TaskStack/ConversationSession: gerencia estado do workflow (activeDraft, resolvedEntities, missingSlots)

GAPS:
- customer_refs → customerId: NÃO existe resolver real que transforma customer_refs em customerId
  → GAP: customer selection/resolver (atualmente EntityResolver resolve por nome, não por refs)
- order_refs → orderId: GAP similar (resolver por ID quando order_id é conhecido)
- job_refs → jobId: GAP (não existe resolver para job selection)
- material_refs → materialId: GAP (não existe resolver para material selection)

PLANNED_ORPHAN:
- customers.get (handler vazio, planned)
- inventory.get_roll (handler vazio, planned)

PRODUCES_UNUSED:
- order (produzido por orders.get, não é requires de nenhuma action)
- material_refs (produzido por inventory.search, sem action consumer para materialId)

REQUIRES SEM FONTE:
- Nenhum (todos os requires têm origem classificada)

CREATE_ORDER:
- PASS ✓

WRITE EXPOSTO:
- 0

TOP-K:
- máximo: 3

MANIFEST:
- sincronizado: SIM
- caminho: scripts/generate-ai-action-manifest.js

MATRIZ:
- caminho: docs/ai/workflow-state-matrix.md
- status: gerada

TESTES:
- npm run test:ai-workflow-tool-graph → PASS ✓
- npm run test:ai-action-registry → PASS ✓
- npm run test:ai-deterministic-router → PASS ✓
- scripts/validate-provenance-contracts.js → PASS ✓
- A (requires com fonte conhecida) → PASS ✓
- B (ACTION_OUTPUT existe) → PASS ✓
- C (RESOLVER_OUTPUT existe) → PASS ✓ (para campos classificados)
- D (allowedNext exige estado produtível) → PASS ✓
- E (planned não implementada) → PASS ✓
- F (implemented tem handler) → PASS ✓
- G (WRITE não no model context) → PASS ✓
- H (Top-K ≤ 3) → PASS ✓
- I (CREATE_ORDER fluxo completo) → PASS ✓

ARQUIVOS ALTERADOS:
- src/ai/action-registry.js (modelExposed agora só true se handler existir)
- scripts/validate-provenance-contracts.js (criado)

ARQUIVOS CRIADOS:
- scripts/validate-provenance-contracts.js
- docs/ai/workflow-state-matrix.md

NÃO ALTERADO:
- app.js
- Home/carrossel
- Loja
- Kotlin/Hermes
- JNI/LFM
- versão pública
- APK público
- push

PENDÊNCIAS:
- GAP: customer_refs → customerId resolver implementado (atualmente EntityResolver resolve por nome)
- GAP: order_refs → orderId, job_refs → jobId, material_refs → materialId (resolvers não implementados)
- Esses gaps serão preenchidos quando as actions correspondentes (customers.get, inventory.get_roll, etc.) forem implementadas
