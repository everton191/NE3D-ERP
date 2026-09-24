# Contrato Atual de IA — Simplifica 3D

> Documento gerado por leitura read-only do runtime existente.
> Não é código executável — é especificação de contrato para avaliação de modelo.

**Data de geração:** 2026-09-21
**Base:** `src/ai/action-registry.js`, `src/ai/deterministic-router.js`,
        `src/ai/workflow-tool-graph.js`, `src/ai/canonical-runtime-bindings.js`,
        `src/ai/local-tool-model-adapter.js`, `src/ai-3d/entity-resolution.js`,
        `src/ai-3d/operation-safety.js`, `src/ai-3d/canonical-order.js`

---

## 1. Modelos Permitidos

| Model ID | Descrição |
|---|---|
| `functiongemma-270m-it-q8_0` | Função Gemma 270M instruct-tuned |
| `lfm2.5-1.2b-q4_0` | LFM 2.5 1.2B quantizado Q4_0 |
| `lfm2.5-1.2b-q6_k` | LFM 2.5 1.2B quantizado Q6_K |
| `disabled` | Sem modelo (fallback determinístico) |

---

## 2. Ações Registry — Visão Geral

Total: **39 ações** definidas.

### 2.1 Por Tipo de Operação

| Tipo | Count | Exposta ao Modelo? |
|---|---|---|
| READ | 22 | Sim — sempre |
| PREPARE | 11 | Sim — sempre |
| WRITE | 6 | **Nunca** |

### 2.2 Ações WRITE (EXPOSIÇÃO = 0, obrigatório)

| ID | Domínio | Handler | Requer Confirmação? |
|---|---|---|---|
| `orders.commit_create` | orders | `SafeOperationPipeline.prepareOrder` | ❌ |
| `orders.update` | orders | `EditOrderUseCase.commit` | ✅ |
| `orders.cancel` | orders | `CancelOrderUseCase.commit` | ✅ |
| `inventory.reserve` | inventory | `InventoryReserveUseCase.commit` | ❌ |
| `inventory.release` | inventory | `InventoryReleaseUseCase.commit` | ❌ |
| `inventory.consume` | inventory | `InventoryConsumeUseCase.commit` | ❌ |
| `cash.commit_withdrawal` | cash | `CashWithdrawalUseCase.commit` | ❌ |
| `cash.commit_deposit` | cash | `CashDepositUseCase.commit` | ❌ |
| `cash.open_session` | cash | `abrirSessaoCaixaAutomatica` | ❌ |
| `cash.close_session` | cash | `CashCloseSessionUseCase.commit` | ❌ |
| `production.commit_job` | production | `ProductionPrepareUseCase.commit` | ❌ |
| `production.change_status` | production | `ProductionChangeStatusUseCase.commit` | ❌ |

> **Regra de segurança:** `exposedToModel = false` para qualquer ação com
> `operationType === OPERATION.WRITE`. O modelo nunca deve ser capaz de
> selecionar diretamente qualquer uma das ações acima.

### 2.3 Ações READ (expostas ao modelo)

| ID | Domínio | Permission | Required Args | Aliases (PT-BR) |
|---|---|---|---|---|
| `navigation.open` | navigation | authenticated | `tela` | abrir, abre, ir para, vai, mostrar tela |
| `orders.search` | orders | basic_orders | `query` ou `status` ou `customer` | buscar pedido, procurar pedido, mostrar pedido, pedidos atrasados |
| `orders.get` | orders | basic_orders | `order_id` | ver pedido, detalhes do pedido |
| `customers.search` | customers | basic_orders | `query` | buscar cliente, procurar cliente |
| `customers.get` | customers | basic_orders | `customer_id` | ver cliente, dados do cliente |
| `inventory.search` | inventory | basic_stock | `query` ou `status` | ver estoque, quanto tem, procurar filamento, PLA, rolo, material |
| `inventory.get_roll` | inventory | basic_stock | `roll_id` | ver rolo, detalhes do rolo |
| `inventory.history` | inventory | basic_stock | `material_id` ou `roll_id` | histórico do estoque, movimentos do rolo |
| `cash.get_summary` | cash | simple_cashier | `period` | resumo do caixa, saldo do caixa |
| `calculator.quote` | calculator | basic_calculator | `weight_grams`, `time_minutes`, `quantity` | calcular preço, fazer orçamento, quanto custa |
| `calculator.batch` | calculator | basic_calculator | `items` | calcular em lote, vários orçamentos |
| `production.list_queue` | production | basic_production | `status` | fila de produção, o que tem na produção, impressão pendente, qual impressão está rodando |
| `products.search` | products | basic_products | `query` | buscar produto, procurar produto, mostrar produto |
| `printers.search` | printers | printer_registry | `query` ou `status` | buscar impressora, qual impressora, impressora imprimindo, status da impressora |
| `reports.open` | reports | simple_reports | (nenhum) | abrir relatórios, ver relatórios, mostrar relatórios |

### 2.4 Ações PREPARE (expostas ao modelo — não gravam)

| ID | Domínio | Handler | Required Args | Requer Confirmação? | Aliases |
|---|---|---|---|---|---|
| `orders.prepare_create` | orders | `OrderCreatePreparationUseCase` | `customer_id`, `items` | ❌ | preparar pedido, montar pedido |
| `orders.prepare_update` | orders | `EditOrderUseCase.prepare` | `order_id`, `proposed`, `idempotency_key` | ❌ | preparar edição, revisar alteração do pedido |
| `orders.prepare_cancel` | orders | `CancelOrderUseCase.prepare` | `order_id`, `reason`, `return_stock`, `idempotency_key` | ❌ | preparar cancelamento, revisar cancelamento |
| `inventory.prepare_reservation` | inventory | `InventoryReserveUseCase.prepare` | `material_id`, `amount`, `order_id`, `idempotency_key` | ❌ | preparar reserva, separar material |
| `inventory.prepare_release` | inventory | `InventoryReleaseUseCase.prepare` | `reservation_id`, `amount`, `reason`, `idempotency_key` | ❌ | preparar liberação, revisar liberação |
| `inventory.prepare_consume` | inventory | `InventoryConsumeUseCase.prepare` | `roll_id`, `amount`, `idempotency_key` | ❌ | preparar baixa, revisar consumo |
| `cash.prepare_withdrawal` | cash | `CashWithdrawalUseCase.prepare` | `amount`, `description`, `idempotency_key` | ❌ | preparar sangria, retirar dinheiro |
| `cash.prepare_deposit` | cash | `CashDepositUseCase.prepare` | `amount`, `description`, `idempotency_key` | ❌ | preparar suprimento, adicionar dinheiro |
| `cash.prepare_close_session` | cash | `CashCloseSessionUseCase.prepare` | `session_id`, `counted_amount`, `idempotency_key` | ❌ | preparar fechamento, conferir caixa |
| `production.prepare_job` | production | `ProductionPrepareUseCase.prepare` | `order_id`, `printer_id`, `idempotency_key` | ❌ | preparar impressão, colocar na fila, enviar para produção |
| `production.prepare_change_status` | production | `ProductionChangeStatusUseCase.prepare` | `job_id`, `status`, `idempotency_key` | ❌ | preparar mudança de status, revisar status |

---

## 3. Input Schema (Campos Permitidos e Obrigatórios)

### 3.1 Campos obrigatórios (requiredAll)

| Action | requiredAll |
|---|---|
| `navigation.open` | `tela` |
| `orders.search` | (qualquer um de: `query`, `status`, `customer`) |
| `orders.get` | `order_id` |
| `orders.prepare_create` | `customer_id`, `items` |
| `orders.prepare_update` | `order_id`, `proposed`, `idempotency_key` |
| `orders.prepare_cancel` | `order_id`, `reason`, `return_stock`, `idempotency_key` |
| `customers.search` | `query` |
| `inventory.search` | (qualquer um de: `query`, `status`) |
| `calculator.quote` | `weight_grams`, `time_minutes`, `quantity` |
| `products.search` | `query` |
| `printers.search` | (qualquer um de: `query`, `status`) |

### 3.2 Campos permitidos por action (allowed)

Cada action possui um conjunto fixo de campos permitidos no `inputSchema.allowed`.
Qualquer campo fora desse conjunto gera `UNKNOWN_ARGUMENT` na validação.

---

## 4. Workflow Graph — Transições Permitidas

O grafo restringe quais ações podem seguir cada ação. O modelo só pode
pertinentar ações que estejam no `allowedNext` da ação anterior (ou no mesmo
domínio).

| Ação | allowedNext |
|---|---|
| `orders.search` | `orders.get`, `orders.prepare_update`, `orders.prepare_cancel` |
| `orders.get` | `orders.prepare_update`, `orders.prepare_cancel` |
| `orders.prepare_create` | `orders.commit_create` (WRITE — bloqueado) |
| `orders.prepare_update` | `orders.update` (WRITE — bloqueado) |
| `orders.prepare_cancel` | `orders.cancel` (WRITE — bloqueado) |
| `customers.search` | `customers.get`, `orders.prepare_create` |
| `inventory.search` | `inventory.get_roll`, `inventory.history`, `inventory.prepare_reservation`, `inventory.prepare_consume` |
| `inventory.get_roll` | `inventory.history`, `inventory.prepare_consume` |
| `cash.prepare_withdrawal` | `cash.commit_withdrawal` (WRITE — bloqueado) |
| `cash.prepare_deposit` | `cash.commit_deposit` (WRITE — bloqueado) |
| `cash.prepare_close_session` | `cash.close_session` (WRITE — bloqueado) |
| `production.list_queue` | `production.prepare_change_status` |
| `production.prepare_job` | `production.commit_job` (WRITE — bloqueado) |
| `production.prepare_change_status` | `production.change_status` (WRITE — bloqueado) |
| `calculator.quote` | `orders.prepare_create` |

---

## 5. Top-K

**MAX_TOP_K = 3**

O grafo retorna no máximo 3 ações candidatas por chamada. A search retorna
no máximo 10, mas o grafo reduz para 3.

---

## 6. WRITE Blocking — Duas Camadas

### 6.1 Camada 1: allowedTools (model adapter)

```javascript
allowedTools(ids = []) {
  return ids.map((id) => registry.get(id)).filter(
    (action) => action &&
    registry.health(action).exposed &&
    action.operationType !== registry.OPERATION.WRITE
  );
}
```

WRITE actions não passam do `allowedTools`. Container da chamada sempre
recebe apenas READ + PREPARE.

### 6.2 Camada 2: blockedWriteAliases

O runtime passa ao modelo uma lista de aliases de WRITE actions como
`blockedWriteAliases`, para que o modelo saiba que termos como "confirmar
pedido", "salvar pedido", "cancelar pedido", "reservar material", etc.
são proibidos.

---

## 7. Canonical Runtime Bindings — Executores

Cada ação READ/PREPARE tem um executor concreto no runtime.

| Action | Binding | Result Type |
|---|---|---|
| `navigation.open` | navegação | `{ status: "SUCCESS", route }` |
| `orders.search` | `readFacade.searchOrdersReadOnly` | `{ status, items }` |
| `orders.get` | `readFacade.searchOrdersReadOnly` (1 item) | `{ status, item }` |
| `customers.search` | `readFacade.searchCustomers` | `{ status, items }` |
| `inventory.search` | `readFacade.searchStock` | `{ status, items }` |
| `cash.get_summary` | `readFacade.cashSummaryReadOnly` | `{ status, summary }` |
| `calculator.quote` | `readFacade.calculatePrice` | `{ status, quote }` |
| `production.list_queue` | `readFacade.productionSummaryReadOnly` | `{ status, summary }` |
| `products.search` | `readFacade.searchProductsReadOnly` | `{ status, items }` |
| `printers.search` | `readFacade.searchPrintersReadOnly` | `{ status, items }` |
| `orders.prepare_create` | `prepareOrder(args, context)` | preparado ou GAP_BLOCKED |

---

## 8. Entity Resolution — Requisitos

| Entity | Como resolver | Caminhos |
|---|---|---|
| `customer` | ID numérico (candidates), nome (EntityResolver), selectedId | `customers.search` → candidates → resolver |
| `order` | ID numérico (candidates), selectedId | `orders.search` → candidates → buscar por ID |
| `job` | ID numérico (candidates), selectedId | `production.list_queue` → candidates |
| `roll` | ID numérico (candidates) — PLANNED | `inventory.get_roll` não implementado |
| `material` | **GAP_BLOCKED** — `inventory.search` não implementado | N/A |

Status de resolução:
- `RESOLVED` — encontrado
- `AMBIGUOUS` — múltiplos matches (ex: dois clientes com mesmo nome)
- `NOT_FOUND` — busca executada, resultado vazio
- `MISSING_INPUT` — parâmetro ausente
- `GAP_BLOCKED` — fonte indisponível (busca não executada)

---

## 9. Confirmation Requirements

| Action | Requer Confirmação? |
|---|---|
| `orders.update` (WRITE) | ✅ |
| `orders.cancel` (WRITE) | ✅ |
| Todas as outras WRITE | ❌ (operação direta com prepared_operation_id) |
| Todas as READ/PREPARE | ❌ (não aplicável) |

---

## 10. LFM Contract (resumo)

O contrato LFM espera:
- Entrada: `{ command: string, tools: Tool[], context: object }`
- Saída: `{ kind: "TOOL_CALL", tool: string, arguments: object, confidence: number }`
  ou `{ kind: "NO_TOOL", reason: string }`

O modelo:
1. Recebe lista de tools filtradas (apenas READ + PREPARE, max 3)
2. Recebe command em PT-BR
3. Deve retornar tool call válido ou NO_TOOL
4. Nunca deve retornar WRITE tool (nem por nome, nem por alias)

---

## 11. Aliases de WRITE (blockedWriteAliases)

Estes aliases são passados ao modelo como términos proibidos:

| Alias | WRITE Action |
|---|---|
| `confirmar pedido`, `salvar pedido` | `orders.commit_create` |
| `alterar pedido`, `editar pedido` | `orders.update` |
| `cancelar pedido` | `orders.cancel` |
| `reservar material` | `inventory.reserve` |
| `liberar reserva` | `inventory.release` |
| `dar baixa`, `baixar`, `consumir`, `usar material` | `inventory.consume` |
| `confirmar sangria` | `cash.commit_withdrawal` |
| `confirmar suprimento` | `cash.commit_deposit` |
| `abrir caixa` | `cash.open_session` |
| `fechar caixa` | `cash.close_session` |
| `confirmar trabalho`, `enviar para produção` | `production.commit_job` |
| `iniciar impressão`, `marcar como pronto` | `production.change_status` |

---

## 12. Ações Futuras / Desabilitadas

Estas ações existem no registry mas estão desabilitadas (handler vazio,
tested=false, permission vazio):

- `fiscal.invoice.search`, `fiscal.invoice.details`, `fiscal.invoice.prepare_issue`,
  `fiscal.invoice.prepare_cancel`, `fiscal.invoice.prepare_correction`,
  `fiscal.settings`, `fiscal.certificate`
- `finance.accounts_payable`, `finance.accounts_receivable`
- `purchases.search`
- `shipping.status`
- `crm.search`
- `maintenance.list`
- `quality.search`

---

## 13. Como usar este documento

> **Contexto:** Este documento é um contrato de leitura — não código executável.
> Ele descreve o que o runtime de IA **já faz** e o que o modelo **deve respeitar**.

### 13.1 Quem lê este documento

| Leitor | Uso |
|---|---|
| **Desenvolvedor da IA** | Entender o registry, schemas, aliases e regras de segurança antes de implementar/avaliar o modelo |
| **QA / Tester** | Escrever casos de teste que cubram os contratos documentados |
| **Revisor de código** | Validar que mudanças no runtime não quebram o contrato |
| **Integrador (app.js)** | Saber quais ações estão disponíveis para cada fluxo |

### 13.2 O que app.js faz com este contrato (responsabilidades de app.js)

> Tratamento contextual: app.js é o provedor de dados e execução — tratado como
> "quasi-3rd party" na leitura deste documento. Este documento descreve o contrato
> que app.js consome, não como app.js é implementado.

app.js é responsável por:

1. **Fornecer o readFacade** — objeto com métodos `searchOrdersReadOnly`, `searchCustomers`,
   `searchStock`, `cashSummaryReadOnly`, `calculatePrice`, `productionSummaryReadOnly`,
   `searchProductsReadOnly`, `searchPrintersReadOnly`. Sem isso, as bindings retornam `GAP_BLOCKED`.

2. **Fornecer o `prepareOrder` bridge** — função que recebe args e context e chama
   `SafeOperationPipeline.prepareOrder`. Sem isso, `orders.prepare_create` retorna `GAP_BLOCKED`.

3. **Executar as ações PREPARE/READ** — o runtime de IA chama as bindings, que usam os
   readFacades e o prepareOrder bridge. app.js implementa esses métodos.

4. **Fornecer entity resolution** — app.js resolve customers, orders, jobs a partir de
   IDs/nomes usando os métodos do serviço correspondente.

5. **Gerenciar confirmacoes** — app.js é o owner do `ConfirmationManager` e do
   `ExecutionGuard`. O runtime de IA prepara a operação; app.js confirma e executa.

6. **Routing de mensagens** — app.js recebe a mensagem do usuário, chama o deterministic
   router ou o modelo de IA, e direciona o tool call resultante para a ação apropriada.

7. **Fornecer permissões** — app.js implementa o permission guard que o workflow graph
   usa para filtrar ações disponíveis por permissão do usuário logado.

### 13.3 O que este documento NÃO cobre

| Tópico | Por que não está aqui |
|---|---|
| Implementação do readFacade | É código de app.js, não contrato de IA |
| Implementação do SafeOperationPipeline | É código de app.js/operation-safety, não contrato |
| Como app.js chama o router | Detalhe de integração, não contrato do modelo |
| UI de confirmação | É responsabilidade de app.js, não do runtime de IA |
| Persistência de confirmation tokens | É responsibility de app.js |

> **Resumo:** Este documento descreve a **interface** entre o runtime de IA e o resto
> do sistema. app.js é o **provedor** dessa interface. O modelo de IA é o **consumidor**.

