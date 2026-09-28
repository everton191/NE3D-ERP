# Mapa legado para intents canônicas

Este documento preserva os nomes existentes. Ele não renomeia capabilities, tools, handlers ou storage keys.

| Capability/tool legado | Intent canônica | Estado | Observação |
|---|---|---|---|
| `ORDER.CREATE` | `orders.create` | MAPPED | Fluxo de draft e confirmação existente; não equivale diretamente a uma action `orders.create`. |
| `ORDER.SEARCH` | `orders.list` | MAPPED | Busca/lista de pedidos. |
| `ORDER.HISTORY` | `orders.get` | AMBIGUOUS_MAPPING | É usado para histórico e também para busca por ID no RLM. |
| `CUSTOMER.SEARCH` | `customers.search` | MAPPED | Busca e resolução de cliente. |
| `PRICE.CALCULATE` | `calculator.calculate` | MAPPED | Cálculo determinístico. |
| `STOCK.SEARCH` | `inventory.search` | MAPPED | Busca textual de estoque/material. |
| `STOCK.SUMMARY` | `inventory.get_stock` | PARTIAL | Resume estoque; não resolve material específico. |
| `CASH.SUMMARY` | `cash.get_status` | MAPPED | Resumo financeiro do caixa. |
| `HOME.SUMMARY` | `navigation.open` | AMBIGUOUS_MAPPING | É leitura de indicadores da Home, não navegação; requer intent própria futura se continuar exposto. |
| `PRODUCTION.SEARCH` | `production.list` | PARTIAL | Atualmente usado por tool RLM de resumo. |
| `ORDER.UPDATE` | `orders.update` | LEGACY_ONLY | Capability WRITE declarada; não é o mesmo fluxo canônico de PREPARE/commit. |
| `ORDER.CANCEL` | `orders.cancel` | LEGACY_ONLY | Capability WRITE declarada; não é o mesmo fluxo canônico de PREPARE/commit. |
| `CUSTOMER.CREATE` | `customers.create` | NOT_IMPLEMENTED | Capability declarada, sem tool/handler canônico. |
| `CUSTOMER.UPDATE` | `customers.update` | NOT_IMPLEMENTED | Capability declarada, sem tool/handler canônico. |
| `STOCK.ADD` | `inventory.entry` | NOT_IMPLEMENTED | Capability declarada, sem tool/handler canônico. |
| `STOCK.REMOVE` | `inventory.adjust` | AMBIGUOUS_MAPPING | Pode significar ajuste, consumo ou reserva; não migrar sem regra. |
| `CASH.WRITE` | `cash.withdraw` / `cash.open` / `cash.close` | AMBIGUOUS_MAPPING | Capability ampla demais para uma intent única. |
| `FINANCE.WRITE` | nenhum | NO_INTENT | Não possui semântica suficientemente atômica. |

## Regra de migração futura

O produtor legado pode continuar emitindo seu nome atual. Um adaptador deve convertê-lo para a intent canônica antes de criar ActionPlan, diagnostics ou avaliação. Não serão criados aliases diferentes por modelo.
