# Fase 2D — persistência verificável e paridade transacional

## Estado

`NOT_READY_FOR_LIVE`. `ALLOW_LIVE_AI_ORDER_CREATE = false` está explícito, o gate continua em `DRY_RUN` e o executor transacional não é exposto à IA.

## Persistência verificável

Após `salvarDados()`, o fluxo relê `pedidos` no cache global ou no cache do usuário autenticado e procura o mesmo `client_request_id`. Se não encontrar, lança `ORDER_LOCAL_PERSISTENCE_NOT_VERIFIED`; o executor restaura pedidos, caixa, estoque e histórico e persiste a compensação.

## Crédito Free compensável

O pedido reserva o crédito antes da transação. A reserva inclui `count` e `updatedAt`. Falha ou replay confirmado tenta compensar a reserva. A compensação é recusada como `RECEIPT_STALE` se outra ação já modificou o contador.

## Sandbox diferencial

O teste cria dois estados isolados: um passa pela sequência legada simulada e outro por `OrderCreateTransactionExecutor`. Compara pedidos, caixa e estoque depois de normalizar somente campos transitórios. Foram cobertos pedido sem caixa, com entrada, múltiplos materiais e quantidade alta: 4/4 equivalentes, sem storage real.

## Limites restantes

- teste manual real precisa ser feito em dados descartáveis ou com backup/restore controlado;
- queda do processo durante a janela entre mutação em memória e persistência ainda precisa de fault injection no Android;
- sincronização remota continua pós-commit e não faz parte da atomicidade local;
- LIVE da IA continua proibido.
