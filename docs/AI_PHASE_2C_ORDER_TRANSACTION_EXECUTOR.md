# Fase 2C — executor transacional de pedido

## Estado

`NOT_READY_FOR_LIVE`. O modo manual agora utiliza `OrderCreateTransactionExecutor` para o núcleo reversível da operação. A IA continua em `WRITE_MODE = DRY_RUN`, `order_create` permanece `UNAVAILABLE` e o executor não é anexado ao `AiOrchestrator3D`.

## Limite transacional

O executor coordena:

1. snapshot de pedidos, caixa, estoque e histórico;
2. aplicação de estoque;
3. inclusão/substituição do pedido;
4. criação e inclusão do recebimento de caixa;
5. persistência local;
6. restauração do snapshot quando uma etapa anterior ao commit falha.

Sugestões de cliente, aprendizado de uso, diagnóstico financeiro, sync, auditoria, histórico do pedido, monetização e UI são pós-commit. Falha nessas tarefas não deve duplicar nem desfazer o pedido.

## Proteções

- chave transacional baseada em `client_request_id`;
- detecção de operação já concluída;
- bloqueio de execução concorrente da mesma chave;
- fail-closed quando dependências estão ausentes;
- rollback local para falha de estoque, pedido, caixa ou persistência detectável;
- nenhuma referência do módulo a IA, LLM, ToolRegistry, Supabase ou globals do ERP.

## Limitações restantes

O pedido passou a usar uma reserva de crédito Free com recibo exato. Se a execução falhar ou já estiver concluída, a compensação só decrementa o contador quando `count` e `updatedAt` ainda correspondem ao recibo, evitando remover crédito de outra ação concorrente.

A persistência do pedido agora relê o cache do escopo atual e exige encontrar o `client_request_id`. Ausência ou falha de leitura provoca rollback. O sandbox diferencial obteve 4/4 estados equivalentes entre o fluxo legado simulado e o executor, sem tocar no storage real.

Ainda faltam o diferencial com uma operação manual real em ambiente descartável, falhas físicas de armazenamento/processo e validação visual do fluxo manual completo. Esses pontos impedem a ativação LIVE da IA.
