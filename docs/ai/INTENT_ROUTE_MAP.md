# Intent Route Map — LOTE 1

## Regras de leitura

- `Intent route` identifica o significado canônico da frase.
- `Tool route` aponta a action/tool atual que poderá ser apresentada a um provider futuro.
- `Workflow route` aponta o fluxo que valida e continua a tarefa.
- `Screen route` é opcional e não substitui consulta funcional.
- `Handler route` aponta somente código existente. Ausência permanece `NOT_IMPLEMENTED`.
- Na coluna `Entidades e campos`, a lista representa entidades e campos requeridos pelo contrato atual. Campos opcionais são `—` quando não há schema canônico real que os declare; eles não foram inferidos para completar a tabela.

## Mapa de intents solicitado

| Intent | Domain | Exemplos | Legado / action / tool atual | Entidades e campos | Workflow / handler / binding | Screen / destino | Mode | Confirmação | Status |
|---|---|---|---|---|---|---|---|---|---|
| `navigation.open` | navigation | “abre estoque” | — / `navigation.open` | `tela` | determinístico / `navigation.open` / binding navigation | rota conhecida / abre tela | READ | não | READY |
| `customers.search` | customers | “busca Maria” | `CUSTOMER.SEARCH` / `customers.search` | query | busca + EntityResolver / `customer_search` / binding | nenhuma / candidatos reais | READ | não | READY |
| `customers.get` | customers | “dados da Maria” | RLM `customers_get` / `customers.get` | customerId resolvido | sem workflow canônico / sem handler/binding | nenhuma / cliente | READ | não | NOT_IMPLEMENTED |
| `customers.create` | customers | “cadastra Maria” | `CUSTOMER.CREATE` | nome, contato | ausente | clientes / cadastro | WRITE | sim | NOT_IMPLEMENTED |
| `customers.update` | customers | “altera telefone da Maria” | `CUSTOMER.UPDATE` | customerId, alteração | ausente | clientes / cliente alterado | WRITE | sim | NOT_IMPLEMENTED |
| `orders.list` | orders | “lista pedidos atrasados” | `ORDER.SEARCH` / `orders.search` | query/status/customer | graph `orders.search` / `order_search` / binding | pedidos opcional / lista | READ | não | READY |
| `orders.get` | orders | “pedido 123” | `ORDER.HISTORY` ambíguo / `orders.get` | orderId resolvido | após search / `order_history` / binding | pedidos opcional / pedido | READ | não | READY |
| `orders.create` | orders | “cria pedido para Maria” | `ORDER.CREATE` / `orders.prepare_create` | customer, item, quantidade, preço; customerId resolvido | draft → resolver → missing fields → prepare → confirmação → executor | pedidos / pedido persistido ou dry-run | PREPARE → WRITE | sim | PARTIAL |
| `orders.update` | orders | “altera pedido 123” | `ORDER.UPDATE` / prepare+commit | orderId, proposed, idempotency | `orders.get` → prepare update / handler declarado; binding ausente | pedidos / pedido atualizado | PREPARE → WRITE | sim | DEGRADED |
| `orders.cancel` | orders | “cancela pedido 123” | `ORDER.CANCEL` / prepare+commit | orderId, motivo, devolução | `orders.get` → prepare cancel / handler declarado; binding ausente | pedidos / cancelado | PREPARE → WRITE | sim | DEGRADED |
| `calculator.calculate` | calculator | “quanto custa 120 g em 2 h?” | `PRICE.CALCULATE` / `calculator.quote` | peso, tempo, quantidade | `calculator.quote` / `CalculatorDomain.calculate` / binding | calculadora opcional / orçamento | READ | não | READY |
| `calculator.create_order` | calculator | “cria pedido com esse cálculo” | — / `calculator.quote` seguido de draft | cálculo atual, customer, itens | quote → `orders.create` legado | pedidos / preview | PREPARE | sim para WRITE | PARTIAL |
| `inventory.search` | inventory | “procura PLA preto” | `STOCK.SEARCH` / `inventory.search` | material/query | graph / `stock_search` / binding | estoque opcional / itens | READ | não | READY |
| `inventory.get_stock` | inventory | “quanto tenho de PLA preto?” | `STOCK.SUMMARY` parcial / `inventory.search` | material resolvido | search + resolver; sem get_stock atômico | nenhuma / saldo real | READ | não | PARTIAL |
| `inventory.low_stock` | inventory | “o que está acabando?” | — / `inventory.search` por status | status | busca atual não possui contrato específico | estoque / lista baixa | READ | não | PARTIAL |
| `inventory.entry` | inventory | “entrada de 1 kg PLA” | `STOCK.ADD` / nenhuma | materialId, quantidade | ausente | estoque / saldo alterado | WRITE | sim | NOT_IMPLEMENTED |
| `inventory.adjust` | inventory | “ajusta saldo” | `STOCK.REMOVE` ambíguo | material/roll, quantidade, razão | prepare consume/reserve declarados, sem binding | estoque / saldo alterado | PREPARE → WRITE | sim | DEGRADED |
| `production.list` | production | “fila de produção” | `PRODUCTION.SEARCH` parcial / `production.list_queue` | status | graph / `searchProductionJobsReadOnly` / binding | produção opcional / fila | READ | não | READY |
| `production.get` | production | “detalhes da impressão” | RLM `inventory_get` não aplicável / nenhuma action | jobId resolvido | ausente | produção / job | READ | não | NOT_IMPLEMENTED |
| `production.start` | production | “inicia impressão” | — / prepare job/change status | jobId/printerId/status | prepare declarado, sem binding | produção / status alterado | PREPARE → WRITE | sim | DEGRADED |
| `production.change_status` | production | “marca como pronto” | — / `production.prepare_change_status` | jobId/status | graph parcial / handler declarado; binding ausente | produção / status alterado | PREPARE → WRITE | sim | DEGRADED |
| `cash.get_status` | cash | “saldo do caixa” | `CASH.SUMMARY` / `cash.get_summary` | período | binding `cashSummaryReadOnly` | caixa opcional / resumo | READ | não | READY |
| `cash.open` | cash | “abre caixa” | `CASH.WRITE` ambíguo / `cash.open_session` | valor inicial | handler declarado, sem binding | caixa / sessão aberta | WRITE | sim | DEGRADED |
| `cash.withdraw` | cash | “faz sangria” | `CASH.WRITE` ambíguo / prepare withdrawal | valor, descrição | prepare/commit declarados, sem binding | caixa / sangria | PREPARE → WRITE | sim | DEGRADED |
| `cash.close` | cash | “fecha caixa” | `CASH.WRITE` ambíguo / prepare close | sessionId, valor contado | prepare/commit declarados, sem binding | caixa / sessão fechada | PREPARE → WRITE | sim | DEGRADED |
| `reports.sales` | reports | “vendas da semana” | — / `reports.open` | período | só navegação / `navigation.open`; sem consulta | relatórios / tela | READ | não | PARTIAL |
| `reports.financial` | reports | “relatório financeiro” | — / `reports.open` | período | só navegação / `navigation.open`; sem consulta | relatórios / tela | READ | não | PARTIAL |
| `storefront.get_status` | storefront | “status da loja” | — / nenhuma | storeId | ausente | loja online / status | READ | não | NOT_IMPLEMENTED |
| `storefront.products` | storefront | “produtos da loja” | `products.search` ambíguo | query/storeId | busca genérica / `searchProductsReadOnly` / binding | loja opcional / produtos | READ | não | PARTIAL |
| `printers.list` | printers | “lista impressoras” | — / `printers.search` | query/status | binding `searchPrintersReadOnly` | impressoras opcional / lista | READ | não | READY |
| `printers.get` | printers | “status da Ender 3” | — / `printers.search` | printerId/nome | busca genérica, sem get atômico | impressoras / impressora | READ | não | PARTIAL |
| `documents.order_pdf` | documents | “gera PDF do pedido” | — / nenhuma | orderId | ausente | pedido / PDF | READ | não | NOT_IMPLEMENTED |
| `documents.share_order` | documents | “manda pedido no WhatsApp” | — / nenhuma | orderId/canal | ausente | pedido / compartilhamento | READ | não | NOT_IMPLEMENTED |
| `admin.open` | admin | “abre configurações admin” | — / nenhuma | — | ausente | admin / tela | READ | não | NOT_IMPLEMENTED |

## Referência detalhada: `orders.create`

`input do usuário → ORDER.CREATE legado → ConversationTaskManager.startOrder → createOrderDraft → TaskResolver/ContinuationResolver → EntityResolver(customer) → missingSlots/RequirementEngine → SafeOperationPipeline.prepareOrder → ConfirmationManager → ExecutionGuard + IdempotencyManager → executor real ou DryRunExecutor → pedido persistido somente quando a feature de WRITE já existente estiver autorizada.`

Nenhum provider seleciona WRITE. O ActionPlan futuro deverá apontar `orders.prepare_create`; o executor permanece fora do modelo.

## Catálogo completo de actions atuais (52/52)

| Action | Intent canônica | Status | Handler | Binding atual | Bundle | Categoria |
|---|---|---|---|---|---|---|
| `navigation.open` | `navigation.open` | READY | navigation.open | sim | dashboard | MAPPED |
| `orders.search` | `orders.list` | READY | order_search | sim | orders.list | MAPPED |
| `orders.get` | `orders.get` | READY | order_history | sim | orders.list/details | MAPPED |
| `orders.prepare_create` | `orders.create` | READY | OrderCreatePreparationUseCase | sim | orders.list | MAPPED |
| `orders.prepare_update` | `orders.update` | READY | EditOrderUseCase.prepare | não | orders.details | NO_BINDING |
| `orders.prepare_cancel` | `orders.cancel` | READY | CancelOrderUseCase.prepare | não | orders.details | NO_BINDING |
| `orders.commit_create` | `orders.create` | DEGRADED | SafeOperationPipeline.prepareOrder | não | — | NO_BINDING |
| `orders.update` | `orders.update` | READY | EditOrderUseCase.commit | não | — | NO_BINDING |
| `orders.cancel` | `orders.cancel` | READY | CancelOrderUseCase.commit | não | — | NO_BINDING |
| `customers.search` | `customers.search` | READY | customer_search | sim | orders.list | MAPPED |
| `customers.get` | `customers.get` | DISABLED | — | não | — | NO_HANDLER |
| `inventory.search` | `inventory.search` | READY | stock_search | sim | inventory.list | MAPPED |
| `inventory.get_roll` | `inventory.get_stock` parcial | DISABLED | — | não | inventory.* | NO_HANDLER |
| `inventory.history` | nenhum do mapa inicial | DEGRADED | InventoryService | não | inventory.* | LEGACY_ONLY |
| `inventory.prepare_reservation` | `inventory.adjust` parcial | DEGRADED | InventoryReserveUseCase.prepare | não | inventory.* | NO_BINDING |
| `inventory.prepare_release` | `inventory.adjust` parcial | DEGRADED | InventoryReleaseUseCase.prepare | não | inventory.roll_details | NO_BINDING |
| `inventory.prepare_consume` | `inventory.adjust` parcial | DEGRADED | InventoryConsumeUseCase.prepare | não | inventory.roll_details | NO_BINDING |
| `inventory.reserve` | `inventory.adjust` parcial | DEGRADED | InventoryReserveUseCase.commit | não | — | NO_BINDING |
| `inventory.release` | `inventory.adjust` parcial | DEGRADED | InventoryReleaseUseCase.commit | não | — | NO_BINDING |
| `inventory.consume` | `inventory.adjust` parcial | DEGRADED | InventoryConsumeUseCase.commit | não | — | NO_BINDING |
| `cash.get_summary` | `cash.get_status` | READY | cash_summary | sim | cash.home | MAPPED |
| `cash.prepare_withdrawal` | `cash.withdraw` | DEGRADED | CashWithdrawalUseCase.prepare | não | cash.home | NO_BINDING |
| `cash.commit_withdrawal` | `cash.withdraw` | DEGRADED | CashWithdrawalUseCase.commit | não | — | NO_BINDING |
| `cash.prepare_deposit` | nenhum do mapa inicial | DEGRADED | CashDepositUseCase.prepare | não | cash.home | LEGACY_ONLY |
| `cash.commit_deposit` | nenhum do mapa inicial | DEGRADED | CashDepositUseCase.commit | não | — | LEGACY_ONLY |
| `cash.open_session` | `cash.open` | DEGRADED | abrirSessaoCaixaAutomatica | não | — | NO_BINDING |
| `cash.prepare_close_session` | `cash.close` | DEGRADED | CashCloseSessionUseCase.prepare | não | cash.home | NO_BINDING |
| `cash.close_session` | `cash.close` | DEGRADED | CashCloseSessionUseCase.commit | não | — | NO_BINDING |
| `calculator.quote` | `calculator.calculate` | READY | CalculatorDomain.calculate | sim | calculator | MAPPED |
| `calculator.batch` | `calculator.calculate` | DEGRADED | CalculatorDomain.calculate | não | calculator | NO_BINDING |
| `production.list_queue` | `production.list` | READY | searchProductionJobsReadOnly | sim | production.queue | MAPPED |
| `production.prepare_job` | `production.start` | DEGRADED | ProductionPrepareUseCase.prepare | não | production.queue | NO_BINDING |
| `production.commit_job` | `production.start` | DEGRADED | ProductionPrepareUseCase.commit | não | — | NO_BINDING |
| `production.prepare_change_status` | `production.change_status` | DEGRADED | ProductionChangeStatusUseCase.prepare | não | production.queue | NO_BINDING |
| `production.change_status` | `production.change_status` | DEGRADED | ProductionChangeStatusUseCase.commit | não | — | NO_BINDING |
| `products.search` | `storefront.products` ambígua | READY | searchProductsReadOnly | sim | — | LEGACY_ONLY |
| `printers.search` | `printers.list` | READY | searchPrintersReadOnly | sim | — | MAPPED |
| `reports.open` | `reports.sales`/`reports.financial` | READY | navigation.open | não | — | NO_BINDING |
| `fiscal.invoice.search` | nenhum | DISABLED | — | não | — | NO_HANDLER |
| `fiscal.invoice.details` | nenhum | DISABLED | — | não | — | NO_HANDLER |
| `fiscal.invoice.prepare_issue` | nenhum | DISABLED | — | não | — | NO_HANDLER |
| `fiscal.invoice.prepare_cancel` | nenhum | DISABLED | — | não | — | NO_HANDLER |
| `fiscal.invoice.prepare_correction` | nenhum | DISABLED | — | não | — | NO_HANDLER |
| `fiscal.settings` | nenhum | DISABLED | — | não | — | NO_HANDLER |
| `fiscal.certificate` | nenhum | DISABLED | — | não | — | NO_HANDLER |
| `finance.accounts_payable` | nenhum | DISABLED | — | não | — | NO_HANDLER |
| `finance.accounts_receivable` | nenhum | DISABLED | — | não | — | NO_HANDLER |
| `purchases.search` | nenhum | DISABLED | — | não | — | NO_HANDLER |
| `shipping.status` | nenhum | DISABLED | — | não | — | NO_HANDLER |
| `crm.search` | nenhum | DISABLED | — | não | — | NO_HANDLER |
| `maintenance.list` | nenhum | DISABLED | — | não | — | NO_HANDLER |
| `quality.search` | nenhum | DISABLED | — | não | — | NO_HANDLER |
