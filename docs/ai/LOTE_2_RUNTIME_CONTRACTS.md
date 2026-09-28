# LOTE 2 — Contratos executáveis da IA

## Fonte única de semântica

`src/ai/intent-registry.js` contém as 34 intents do mapa do Lote 1. `resolveIntentId()` preserva aliases legados em um único ponto, por exemplo `ORDER.CREATE` para `orders.create`. A ponte ActionRegistry é `intentForAction(actionId)`; ela não renomeia tools ou handlers existentes.

## ActionPlan e segurança

`src/ai/action-plan.js` normaliza, combina e valida o plano. O schema vem do IntentRegistry; modelo algum decide campos obrigatórios. `MODEL_INFERENCE` não pode preencher IDs críticos, preços, descontos, valores ou chaves de escrita. Um plano de domínio PREPARE/WRITE exige confirmação e este lote bloqueia `EXECUTED`.

## Contexto e entidades

`buildContextSnapshot()` recebe fontes reais já disponíveis (sessão, tela, cálculo e seleção) e reduz para IDs e resumos. Não acessa globals de ERP nem copia registros completos. `resolveCanonicalEntity()` é um adaptador de `src/ai-3d/entity-resolution.js`: nunca inventa ID e só promove candidato retornado por consulta real.

## Draft de pedidos

`DraftManager` reutiliza `ConversationTaskManager`, `ContinuationResolver`, `createOrderDraft` e `updateSlot`. O suporte real deste lote é somente `orders.create`. Ele transforma o draft legado em ActionPlan, resolve clientes por candidatos, preserva o draft na continuação e termina em `REQUIRES_CONFIRMATION`. `complete()` retorna bloqueado: não há executor novo nem WRITE novo.

## Diagnóstico DEV

`SimplificaRuntimeContractDiagnostics.diagnoseAiContracts()` é somente leitura e informa contratos inválidos e actions sem associação. Não seleciona tool, não executa handler e não muda storage.

## Limites explícitos

Needle, LFM, modelos, downloads, JNI, memória semântica, manifests e alteração de WRITE permanecem fora deste lote. O router determinístico ganhou apenas `canonicalIntent`, mantendo o campo `intent` legado e os mesmos tools.
