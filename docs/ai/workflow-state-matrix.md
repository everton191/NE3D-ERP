# Matriz de Estado dos Workflows - Simplifica 3D AI

Documentação dos fluxos de workflow, proveniência dos campos e transições.

## Legenda de Fontes

| Código | Significado |
|--------|-------------|
| USER_INPUT | Valor fornecido diretamente pelo usuário |
| ACTION_OUTPUT | Valor produzido por uma action do registry |
| RESOLVER_OUTPUT | Valor produzido por resolver (EntityResolver, ContinuationResolver) |
| WORKFLOW_CONTEXT | Valor que flui pelo contexto do workflow |
| SYSTEM_CONTEXT | Valor de contexto do sistema |

## Fluxo CREATE_ORDER

```
ORDER.CREATE (intenção)
  ├─ customers.search
  │   ├─ requires: customer (USER_INPUT)
  │   ├─ source: USER_INPUT (nome do cliente na mensagem)
  │   ├─ produces: customer_refs (ACTION_OUTPUT)
  │   └─ next: customer resolver
  │
  ├─ customer resolver (EntityResolver)
  │   ├─ requires: customer_refs (ACTION_OUTPUT)
  │   ├─ source: ACTION_OUTPUT (da customers.search)
  │   ├─ produces: customerId (RESOLVER_OUTPUT)
  │   └─ next: orders.prepare_create
  │
  ├─ calculator.quote
  │   ├─ requires: weight_grams, time_minutes, quantity (USER_INPUT/ACTION_OUTPUT)
  │   ├─ source: USER_INPUT (extraído da mensagem pelo ContinuationResolver)
  │   ├─ produces: weight_grams, time_minutes (ACTION_OUTPUT)
  │   └─ next: orders.prepare_create
  │
  ├─ orders.prepare_create
  │   ├─ requires: customer_id (RESOLVER_OUTPUT), items (USER_INPUT)
  │   ├─ source: customer_id = RESOLVER_OUTPUT, items = USER_INPUT
  │   ├─ produces: prepared_operation (WORKFLOW_CONTEXT)
  │   └─ next: confirmação
  │
  ├─ confirmação
  │   ├─ requires: prepared_operation_id, confirmation_token, idempotency_key
  │   ├─ source: WORKFLOW_CONTEXT
  │   └─ next: app executa WRITE (fora do modelo)
```

## Fluxo ORDERS

### orders.search

| Campo | Origem | Observação |
|-------|--------|------------|
| query | USER_INPUT | Texto de busca |
| status | USER_INPUT | Filtro opcional |
| customer | USER_INPUT | Filtro opcional |
| **Produz:** | | |
| order_refs | ACTION_OUTPUT | Usado para seleção posterior |

### orders.get

| Campo | Origem | Observação |
|-------|--------|------------|
| order_id | RESOLVER_OUTPUT | Vem de order_refs via resolver ou selection |
| **Produz:** | | |
| order | WORKFLOW_CONTEXT | Detalhes do pedido |

### orders.prepare_create

| Campo | Origem | Observação |
|-------|--------|------------|
| customer_id | RESOLVER_OUTPUT | Vem de customer_refs via EntityResolver |
| items | USER_INPUT | Itens do pedido |
| **Produz:** | | |
| prepared_operation | WORKFLOW_CONTEXT | Operação preparada para confirmação |

### orders.prepare_update

| Campo | Origem | Observação |
|-------|--------|------------|
| order_id | RESOLVER_OUTPUT | Pedido a editar |
| proposed | USER_INPUT | Proposta de alteração |
| idempotency_key | WORKFLOW_CONTEXT | Chave de idempotência |
| **Produz:** | | |
| prepared_operation | WORKFLOW_CONTEXT | |

### orders.prepare_cancel

| Campo | Origem | Observação |
|-------|--------|------------|
| order_id | RESOLVER_OUTPUT | Pedido a cancelar |
| reason | USER_INPUT | Motivo do cancelamento |
| return_stock | USER_INPUT | Devolver estoque? |
| idempotency_key | WORKFLOW_CONTEXT | |
| **Produz:** | | |
| prepared_operation | WORKFLOW_CONTEXT | |

## Fluxo INVENTORY

### inventory.search

| Campo | Origem | Observação |
|-------|--------|------------|
| query | USER_INPUT | Termo de busca |
| status | USER_INPUT | Filtro opcional |
| **Produz:** | | |
| material_refs | ACTION_OUTPUT | Referências de material |
| roll_refs | ACTION_OUTPUT | Referências de rolo |

### inventory.get_roll

| Campo | Origem | Observação |
|-------|--------|------------|
| roll_id | RESOLVER_OUTPUT | Vem de roll_refs via resolver |
| **Produz:** | | |
| roll | ACTION_OUTPUT | Detalhes do rolo |

## Fluxo PRODUCTION

### production.list_queue

| Campo | Origem | Observação |
|-------|--------|------------|
| status | USER_INPUT | Filtro de status |
| **Produz:** | | |
| job_refs | ACTION_OUTPUT | Referências de trabalho |

### production.prepare_job

| Campo | Origem | Observação |
|-------|--------|------------|
| order_id | RESOLVER_OUTPUT | Pedido associado |
| printer_id | USER_INPUT | Impressora alvo |
| idempotency_key | WORKFLOW_CONTEXT | |
| **Produz:** | | |
| prepared_operation | WORKFLOW_CONTEXT | |

### production.prepare_change_status

| Campo | Origem | Observação |
|-------|--------|------------|
| job_id | RESOLVER_OUTPUT | Trabalho a alterar |
| status | USER_INPUT | Novo status |
| idempotency_key | WORKFLOW_CONTEXT | |
| **Produz:** | | |
| prepared_operation | WORKFLOW_CONTEXT | |

## Fluxo CASH

### cash.get_summary

| Campo | Origem | Observação |
|-------|--------|------------|
| period | USER_INPUT | Período (today/all) |
| **Produz:** | | |
| (sem produção) | | Consulta apenas |

### cash.prepare_close_session

| Campo | Origem | Observação |
|-------|--------|------------|
| session_id | WORKFLOW_CONTEXT | Sessão a fechar |
| counted_amount | SYSTEM_CONTEXT | Valor contado |
| idempotency_key | WORKFLOW_CONTEXT | |
| **Produz:** | | |
| prepared_operation | WORKFLOW_CONTEXT | |

## Fluxo CUSTOMERS

### customers.search

| Campo | Origem | Observação |
|-------|--------|------------|
| query | USER_INPUT | Nome ou termo de busca |
| **Produz:** | | |
| customer_refs | ACTION_OUTPUT | IDs de clientes encontrados |

### customers.get

| Campo | Origem | Observação |
|-------|--------|------------|
| customer_id | RESOLVER_OUTPUT | ID do cliente (via selector ou resolver) |
| **Produz:** | | |
| (sem produção) | | Detalhes do cliente |

## Fluxo CALCULATOR

### calculator.quote

| Campo | Origem | Observação |
|-------|--------|------------|
| weight_grams | USER_INPUT | Peso da peça (do message/continuation) |
| time_minutes | USER_INPUT | Tempo estimado |
| quantity | USER_INPUT | Quantidade |
| **Produz:** | | |
| weight_grams | ACTION_OUTPUT | (mesmo valor propagado) |
| time_minutes | ACTION_OUTPUT | (mesmo valor propagado) |

## Fluxo CALCULATOR BATCH

### calculator.batch

| Campo | Origem | Observação |
|-------|--------|------------|
| items | USER_INPUT | Lista de itens para calcular |
| **Produz:** | | |
| (sem produção) | | Calcula em lote sem persistir |
