# Mapa de operações e casos de uso

O código atual não usa classes `UseCase` para a maioria dos domínios; a coluna UseCase indica a operação real reutilizável ou a lacuna de extração.

| Domínio | UseCase/operação atual | UI usa | IA usa | Tipo | Estado |
|---|---|---:|---:|---|---|
| Pedido | `fecharPedido()` via `salvarPedidoRapidoOperacional()` | sim | não | escrita | funcional na UI; adapter ausente |
| Pedido | `editarPedido`/`requestOrderEdit` | sim | não | escrita | funcional na UI |
| Pedido | arrays + `clienteDoPedido`/`totalPedido` | sim | snapshot parcial | leitura | sem UseCase de busca/histórico |
| Cliente | busca/autocomplete sobre dados atuais | sim | não | leitura | operação a formalizar |
| Cliente | dados do pedido/cadastros atuais | sim | não | escrita | não há `CreateCustomerUseCase` explícito |
| Estoque | `normalizarEstoque`/busca | sim | somente itens baixos | leitura | parcial na IA |
| Estoque | `InventoryService` + reposição/cadastro | sim | não | escrita | serviço reutilizável; adapter ausente |
| Calculadora | `CalculatorDomain` | sim | não | leitura/cálculo | serviço reutilizável; Tool ausente |
| Caixa | `calcularTotaisCaixa` | sim | sim | leitura | funcional, snapshot |
| Caixa | `adicionarMovimentoCaixa` | sim | não | escrita | adapter ausente |
| Produção | funções de jobs/pedidos | sim | resumo de pedidos recentes | leitura/escrita | IA não consulta produção real |
| Permissões | guards Free/plan/sensitive action | sim | não | autorização | P0 para IA |
| Persistência | `salvarDados` + sync silencioso | indireto | não | infraestrutura | não chamar diretamente por Tool |

Fluxo manual principal: editor/atalho -> estado de rascunho -> validação/guards -> `fecharPedido()` -> regras de estoque/caixa/histórico -> `salvarDados()` -> sync. A IA deve entrar antes da mesma operação, por adapter, nunca em `salvarDados()`.
