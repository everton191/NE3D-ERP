# Catálogo de actions/tools

Hoje existem actions JSON, não Tools tipadas. O prompt aceita: `chat`, `navegar`, `estoque.consultar`, `caixa.consultar`, `producao.status`, `pedido.criar`, `pedido.status`, `estoque.entrada`, `caixa.lancar`.

| Action atual | Executor | Classificação |
|---|---|---|
| chat | retorna texto | funcional |
| navegar | `trocarTela` | funcional com validação insuficiente |
| caixa.consultar | `calcularTotaisCaixa` | parcial |
| estoque.consultar | snapshot de estoque baixo | parcial |
| producao.status | pedidos recentes | parcial/incorreto semanticamente |
| quatro actions de escrita | nenhum | não conectado |

Tools da Fase 1: `customer_search`, `order_history`, `price_calculate`, `stock_search`. Cada Tool retorna status estruturado e chama adapter/operação existente; não contém regra de preço, estoque ou pedido. `price_calculate` é SIMULATION; as demais são READ. Nenhuma Tool WRITE foi registrada como pronta.
