# ORDER.CREATE — auditoria e paridade

## Fluxo manual encontrado

`fecharPedido()` lê a UI por `createOrderHeader()` e agora delega sanitização, normalização, cálculo financeiro, método de pagamento, metadados e montagem do registro a `OrderCreatePreparationUseCase`. Depois da preparação, o fluxo manual ainda verifica plano e limites, valida e aplica estoque, adiciona o pedido ao array, pode lançar entrada no caixa, registra shadow financeiro, persiste o estado local, agenda sincronização, registra histórico/telemetria, limpa o Draft manual e renderiza a UI.

Essa função não é um UseCase isolado de criação de pedido. Ela mistura pedido, estoque, caixa, plano, sync, telemetria e UI. Por isso não é segura como adapter LIVE da IA nesta etapa.

## CanonicalOrderPayload

O contrato canônico suporta `items[]`, `materials[]`, `discounts[]`, snapshots do cliente e `metadata`. IDs/timestamps operacionais não entram no hash de intenção. A serialização ordena propriedades recursivamente e o hash é SHA-256 de 64 caracteres hexadecimais.

## Paridade

O `OrderCreateAdapter` converte o contrato canônico para o formato comercial reconhecido pelo fluxo manual. Esse formato passa pelo mesmo `OrderCreatePreparationUseCase` usado por `fecharPedido()`. O normalizador reconverte ambos os lados antes da comparação e ignora apenas campos ausentes do contrato comercial. A suíte canônica passou 4/4 e a preparação compartilhada passou 30/30 cenários sem executar WRITE.

## Readiness

`NOT_READY_FOR_LIVE`: preparação, executor transacional, persistência verificável, rollback e compensação já estão isolados e testados. A Fase 2E também executou um pedido manual real em sandbox descartável no Android, validou +1 pedido/+1 caixa, consumo de estoque, restauração, fault injection antes/depois da persistência e reinício do processo. LIVE continua desabilitado porque a conexão controlada da IA e sua política final de confirmação ainda não foram autorizadas.
