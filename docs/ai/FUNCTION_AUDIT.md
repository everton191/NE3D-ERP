# Auditoria funcional do Simplifica 3D

Data: 2026-08-20. Escopo: checkout `erpNE3d`, domínios Pedidos, Clientes, Estoque, Caixa, Calculadora, Produção e Navegação. Esta fase não altera comportamento nem habilita WRITE.

## Arquitetura encontrada

O sistema é local-first e concentra grande parte da composição, UI e regras em `app.js`. Há serviços reutilizáveis (`CalculatorDomain`, `InventoryService`, núcleo financeiro), um núcleo operacional em `src/ai-3d`, um Assistant Core genérico e um contrato legado em `simplifica3dAiActions.js`. Pedidos já possuem preparação compartilhada, executor transacional, rollback, confirmação e idempotência. O acesso remoto operacional passa principalmente por sincronização de registros locais; a Storefront possui serviços Supabase separados.

Existem dois registries anteriores: `src/assistant-core/tools/tool-registry.js` e `src/ai-3d/core.js`. O novo `src/ai/action-registry.js` é o catálogo canônico de migração e não cria handlers paralelos.

## Matriz

| ID funcional | Nome atual / arquivo | Domínio | Responsabilidade / parâmetros / retorno | Dependências / tabelas / RPC | Tipo / permissão / efeitos | Idempotência / validação | Status | AI tool? | Problema e ação recomendada |
|---|---|---|---|---|---|---|---|---|---|
| NAV-OPEN | `abrirRotaPelaAssistenteIa`, `app.js` | Navegação | abre rota; `routeId`; resultado local | router/UI | READ; autenticado; navega | rota permitida | HEALTHY | sim, `navigation.open` | manter adapter fino |
| ORD-SEARCH | `searchOrdersReadOnly`, `app.js` | Pedidos | busca; query/filtros; lista | `pedidos`, `erp_records` | READ; `basic_orders` | limite e filtro | HEALTHY | sim, `orders.search` | padronizar envelope |
| ORD-GET | `orderHistory`, `app.js` | Pedidos | detalhes/histórico por ID | `pedidos`, `erp_records` | READ; `basic_orders` | ID deve vir de busca/contexto | REFACTOR | sim, `orders.get` | impedir ID inventado |
| ORD-PREP | `OrderCreatePreparationUseCase`, `src/ai-3d/order-create-preparation.js` | Pedidos | valida rascunho; cliente/itens; preview | ordem canônica, calculadora, estoque | PREPARE; `basic_orders`; sem gravação | hash/draftVersion | HEALTHY | sim, `orders.prepare_create` | preservar como preparação única |
| ORD-COMMIT | `SafeOperationPipeline.prepareOrder`, `operation-safety.js` | Pedidos | confirma operação preparada | executor transacional, gate, confirmação | WRITE; alto risco; pedido/estoque/caixa | chave de requisição + hash | REFACTOR | bloqueada | contrato existe, falta registrar teste no catálogo novo |
| ORD-EXEC | `OrderCreateTransactionExecutor`, `order-create-executor.js` | Pedidos | grava pedido e efeitos com rollback | `InventoryService`, persistência local, sync | WRITE; efeitos múltiplos | lock + rollback + request key | HEALTHY | indireta | nunca expor diretamente ao modelo |
| ORD-UPDATE | `EditOrderUseCase`, `src/ai-3d/order-shared-usecases.js` | Pedidos | prepara/compara/edita pedido | executor transacional, estoque, financeiro, sync | WRITE; `basic_orders`; efeitos explícitos | operationId + conflito por versão | HEALTHY | pronta, não exposta | UI `fecharPedido` migrada; preservar adapter fino |
| ORD-CANCEL | `CancelOrderUseCase`, `src/ai-3d/order-shared-usecases.js` | Pedidos | plano e commit composto | estoque, caixa, financeiro, produção, sync | WRITE crítico; senha/confirm. na UI | idempotente e rollback local | HEALTHY | pronta, não exposta | UI `cancelOrderSafely` migrada; backend atômico ainda recomendável |
| CUS-SEARCH | `customer_search`/`CustomerSuggestionManager`, `app.js` | Clientes | busca e resolve cliente | coleção local | READ; `basic_orders` | desambiguação | HEALTHY | sim, `customers.search` | retornar IDs reais |
| CUS-GET | acesso direto à coleção, `app.js` | Clientes | detalhe por ID | coleção local | READ | sem contrato isolado | MISSING | não | criar query service |
| INV-SEARCH | `InventoryService.searchMaterialsReadOnly`, `app.js` | Estoque | busca materiais/rolos | `estoque`, `erp_records` | READ; `basic_stock` | normalização | HEALTHY | sim, `inventory.search` | padronizar envelope |
| INV-HISTORY | `InventoryService`, `app.js` | Estoque | histórico por material/rolo | estado local/sync | READ | vínculo interno | REFACTOR | depois | criar adapter explícito e teste |
| INV-DIFF | `InventoryService.applyDiff`, `app.js` | Estoque | baixa/devolução | histórico, persistência | WRITE crítico | chaves por pedido | HEALTHY | indireta | manter atrás de UseCase |
| INV-RESERVE | lógica de consumo por pedido, `app.js` | Estoque | reservar/liberar | pedido/estoque | WRITE | incompleta como contrato autônomo | MISSING | não | criar preparação antes do handler |
| CASH-SUM | `cashSummaryReadOnly`, `app.js` | Caixa | entradas/saídas/saldo | núcleo financeiro + fallback local | READ; `simple_cashier` | regra monetária em código | HEALTHY | sim, `cash.get_summary` | manter sem somar pedidos ao saldo |
| CASH-LOCAL | `calcularTotaisCaixa`, `app.js` | Caixa | soma array local | `caixa` | READ; efeito nenhum | decimal JS | DUPLICATED | não diretamente | tratar como fallback explícito |
| CASH-OPEN | `abrirSessaoCaixaAutomatica`, `app.js` | Caixa | abre sessão local | armazenamento local | WRITE | sessão textual, sem E2E canônico | REFACTOR | bloqueada | adapter para sessão financeira |
| CASH-WITHDRAW | handlers de caixa, `app.js` | Caixa | sangria/retirada | local + sync | WRITE crítico | confirmação não formalizada no catálogo | UNSAFE | bloqueada | PREPARE + COMMIT + idempotência |
| FIN-SALE | `simplifica3dFinancialCore.js` | Caixa | registra venda/pagamento | RPC `register_sale_financial_operation` | WRITE crítico | request hash e operation UUID | HEALTHY | indireta | somente chamada por serviço de domínio |
| CALC-QUOTE | `CalculatorDomain.calculate`, `src/services/calculatorDomain.js` | Calculadora | preço determinístico | configuração local | READ/cálculo; `basic_calculator` | valida números | HEALTHY | sim, `calculator.quote` | fonte única, nunca calcular no LLM |
| CALC-LEGACY | cálculos/handlers em `app.js` | Calculadora | UI e reconciliação | CalculatorDomain | READ | parcialmente duplicada | DUPLICATED | não | UI deve só montar entrada/exibir saída |
| PROD-SUM | `productionSummaryReadOnly`, `app.js` | Produção | resumo da produção | pedidos/status local | READ | teste apenas RLM | REFACTOR | ainda não | query service + contrato |
| PROD-WRITE | handlers de status, `app.js` | Produção | muda fila/status | pedidos/impressoras | WRITE | sem preparação AI formal | MISSING | não | UseCase compartilhado |
| AI-LEGACY | `Simplifica3dAiActions`, `src/services/simplifica3dAiActions.js` | IA | normaliza 9 nomes legados | bridge/runtime | READ/WRITE mistos | validação manual parcial | DEPRECATED | migração | mapear para nomes canônicos e remover após paridade |
| AI-CAP | `CapabilityRegistry`, `src/ai-3d/core.js` | IA | disponibilidade e execução | schemas/tools/adapters | READ/SIMULATION; WRITE bloqueado | self-test parcial | REFACTOR | infraestrutura | convergir no catálogo canônico |
| AI-SAFE | `operation-safety.js` | IA | gate/preparo/confirmação/idempotência | executor de domínio | WRITE | forte para pedido | HEALTHY | infraestrutura | generalizar incrementalmente, não duplicar |

## Duplicações e bugs confirmados

- Três fontes de nomes/capabilities podem derivar: legado PT-BR, `CapabilityRegistry` em caixa alta e catálogo canônico.
- Caixa local e financeiro remoto não são a mesma autoridade; o fallback precisa continuar explícito.
- Regras de elegibilidade de vendas/Home/gráficos já foram encontradas divergentes e não devem ser mascaradas por actions.
- Edição/cancelamento/sangria/produção ainda misturam UI, regra e persistência; não estão aptos a AI WRITE.

## Decisão da Fase A

Preservar os serviços existentes, usar adapters finos, migrar manual e IA para os mesmos UseCases e manter todo WRITE novo desabilitado. O catálogo registra lacunas sem fingir prontidão.

## Complemento da Fase B — fluxos encontrados

- Criar/editar: `fecharPedido` → `OrderCreatePreparationUseCase` → `OrderCreateTransactionExecutor` → estoque → pedido → recebimento → persistência → evento financeiro. A edição passou a usar `EditOrderUseCase` como composição oficial.
- Cancelar: `requestOrderDelete` mantém confirmação/credencial; `cancelOrderSafely` agora é adapter para `CancelOrderUseCase`.
- Status: `alterarStatusPedido` foi migrado para `EditOrderUseCase`; o handler mantém somente lock, mensagens, auditoria e renderização.
- Duplicar: `duplicarPedidoSalvo` apenas preenche o formulário e termina no fluxo canônico de salvar.
- Produção: `confirmarLiberacaoProducao` cria jobs e baixa estoque diretamente; o cancel plan agora identifica/cancela jobs não entregues.
- Financeiro: criação/edição usa `registrarEventoFinanceiroPedidoLocal`; cancelamento produz reversão local e evento para a fila/RPC canônica. Não foi criada regra financeira paralela.
