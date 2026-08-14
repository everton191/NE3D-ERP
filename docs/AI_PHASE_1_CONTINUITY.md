# Fase 1 — Fundação de continuidade

Data: 2026-08-12. Flag: `aiContextV2Enabled !== false`.

## Entrega

- `ConversationSession`, `ConversationTaskManager`, `ContinuationResolver`, `TaskStack`, slots e draft operacional.
- `ContextBuilder` orientado à tarefa.
- `CapabilityRegistry.selfTest()` e `ToolRegistry`.
- Tools `customer_search`, `order_history`, `price_calculate` e `stock_search`.
- Abstração `LegacyCapacitorAiProvider` sobre o provider atual.
- Integração no modal existente, sem nova tela.
- Telemetria sem prompt/conteúdo integral.

## Limites de segurança

O registry aceita somente READ e SIMULATION. `ORDER.CREATE`, `ORDER.UPDATE`, `ORDER.CANCEL`, escritas de cliente, estoque, caixa e financeiro são registradas como `UNAVAILABLE`. A facade nova não chama `fecharPedido`, `salvarDados` ou movimentações. O draft usa campos compatíveis conceitualmente com o pedido manual, mas possui armazenamento operacional próprio e não é persistido como pedido.

## Validação

`npm.cmd run test:simplifica3d-ai-context-v2` cobre início/continuação, fast path, cálculo/estoque como subtarefas, conversa sem mutação, atualização explícita, cancelamento, conversa normal, permissões e zero-write. Os gates gerais permanecem os comandos documentados no relatório da fase.
