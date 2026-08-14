# Navegação controlada

O `NavigationRegistry` aceita apenas IDs presentes no manifest. Ele resolve parâmetros simples, recusa rota/parâmetro desconhecido e mantém uma pilha de origem para retorno.

Mapeamento principal do Simplifica:

| Intenção | routeId | Tela real |
|---|---|---|
| Home | `dashboard` | `dashboard` |
| Pedidos | `orders.list` | `pedidos` |
| Novo pedido | `orders.new` | `pedido` |
| Estoque | `inventory.list` | `estoque` |
| Calculadora | `calculator` | `calculadora` |
| Caixa | `cash.home` | `caixa` |
| Produção | `production.home` | `producao` |
| Clientes | `customers.list` | `clientes` |

O adapter usa a navegação existente do ERP. Abrir calculadora por orçamento grava somente o draft dos campos e deixa o cálculo para o domínio real. Filtros e restauração completa de drafts de todas as telas ainda são itens parciais registrados no progresso.
