# Simplifica AI — Mapa de capabilities

Status implementado em 2026-08-14. `READY` significa que o handler atual está ligado a uma função real e possui teste proporcional. `PARTIAL` significa que há função real, mas falta requisito, integração canônica ou teste E2E. `BLOCKED` não deve ser anunciado pela IA como disponível.

| Capability | Domínio | Tipo | Handler | Service | Repository/RPC | Permissão | Risco | Confirmação | Status | Testes |
|---|---|---|---|---|---|---|---|---|---|---|
| `APP.NAVIGATE` | Navegação | NAVIGATION | `TaskResolver` / `abrirRotaPelaAssistenteIa` | Assistant Core Navigation | rota local | usuário autenticado | baixo | não | READY | `test-ai-main-function-routing`; contexto V2 |
| `HOME.SUMMARY` | Home | READ | `home_summary` | `Simplifica3dAiReadFacade.homeSummaryReadOnly` | projeção financeira canônica + fallback local explícito | `basic_dashboard` | baixo | não | READY | routing; financial core; UI V3 finance |
| `ORDER.SEARCH` | Pedidos | READ | `order_search` | `searchOrdersReadOnly` | `pedidos`/`erp_records` | `basic_orders` | baixo | não | READY | contexto V2 |
| `ORDER.HISTORY` | Pedidos | READ | `order_history` | `orderHistory` | `pedidos`/`erp_records` | `basic_orders` | baixo | não | READY | contexto V2 |
| `ORDER.CREATE` | Pedidos | WRITE | `SafeOperationPipeline.prepareOrder` | preparação + executor transacional | local/`erp_records` + `register_sale_financial_operation` | `basic_orders` + gate | alto | sim, uma vez | READY | safety; transaction; live gate; E2E Gecinaldo |
| `ORDER.UPDATE` | Pedidos | WRITE | ausente na IA | `OrderCreatePreparationUseCase` pode ser adaptado | local/`erp_records` | `basic_orders` | alto | sim | BLOCKED | ausente |
| `ORDER.CANCEL` | Pedidos | WRITE | não exposto à IA | `cancelOrderSafely` | local/`erp_records` + `register_order_financial_cancellation` | `basic_orders` + senha | crítico | sim | BLOCKED | core financeiro e contrato RPC; automação pela IA deliberadamente bloqueada |
| `CUSTOMER.SEARCH` | Clientes | READ | `customer_search` | `CustomerSuggestionManager` | coleção local | `basic_orders` | baixo | não | READY | contexto V2 |
| `CUSTOMER.CREATE` | Clientes | WRITE | ausente na IA | cadastro existente de cliente | local/`erp_records` | conforme plano | alto | sim | BLOCKED | ausente |
| `PRICE.CALCULATE` | Calculadora | SIMULATION | `price_calculate` | `CalculatorDomain.calculate` | configuração local | `basic_calculator` | médio | não | READY | domínio; reconciliação; routing; abertura sem peso |
| `STOCK.SEARCH` | Estoque | READ | `stock_search` | `InventoryService.searchMaterialsReadOnly` | `estoque`/`erp_records` | `basic_stock` | baixo | não | READY | contexto V2 |
| `STOCK.SUMMARY` | Estoque | READ | `stock_summary` | `stockSummaryReadOnly` | `estoque`/`erp_records` | `basic_stock` | baixo | não | READY | contexto V2 |
| `STOCK.ADD` | Estoque | WRITE | ausente na IA | `InventoryService.addMaterial` | local/`erp_records` | `basic_stock` | alto | sim | BLOCKED | serviço testado fora da IA |
| `STOCK.REMOVE` | Estoque | WRITE | ausente na IA | `InventoryService.applyDiff` / saída manual | local/`erp_records` | `basic_stock` | crítico | sim | BLOCKED | serviço testado fora da IA |
| `CASH.SUMMARY` | Caixa | READ | `cash_summary` | `cashSummaryReadOnly` | operações/movimentos canônicos + fallback local explícito | `simple_cashier` | médio | não | READY | contexto V2; financial core; UI V3 finance |
| `CASH.WRITE` | Caixa | WRITE | ausente na IA | lançamento manual local | `caixa`/`erp_records`; `register_cash_movement` pendente | `simple_cashier` | crítico | sim | BLOCKED | foundation estático; E2E pendente |
| `FINANCE.REGISTER_SALE` | Financeiro | WRITE | `registrarEventoFinanceiroPedidoLocal` / sync | `simplifica3dFinancialCore` | `register_sale_financial_operation` | membro da empresa | crítico | herdada do pedido | READY | R$ 10/R$ 80/R$ 150; foundation; transação do pedido |
| `FINANCE.RECONCILE` | Financeiro | READ | `getDiagnosticoReconciliacaoFinanceira` | `simplifica3dFinancialCore.reconcileFinancialState` | operações e movimentos canônicos | membro da empresa/admin | médio | não | READY | financial core |
| `PRODUCTION.SUMMARY` | Produção | READ | somente RLM | `productionSummaryReadOnly` | local | conforme plano | baixo | não | PARTIAL | RLM; capability principal não registrada |

## Regras obrigatórias do registry

1. Capability só pode ficar `READY` quando schema, handler, permissão, operação de risco e teste estiverem conectados.
2. READ pode executar diretamente; SIMULATION não persiste; WRITE sempre cria operação preparada imutável.
3. A confirmação referencia uma versão/hash do rascunho e expira quando qualquer campo muda.
4. Operação já confirmada/concluída retorna o mesmo resultado; nunca cria duplicata.
5. Capabilities `BLOCKED` não entram no prompt/tool list do modelo.
6. Nenhuma capability financeira soma pedidos para fingir saldo de caixa.
7. O escopo permanece `simplifica-3d`; packs, memória e modelos de outros aplicativos não são carregados neste repositório.
