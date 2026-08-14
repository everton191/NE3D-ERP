# Matriz de paridade UI x IA

| Operação | UI manual | IA atual | Diferença/gate |
|---|---|---|---|
| Criar pedido | rascunho -> guards -> `fecharPedido` -> estoque/caixa/save/sync | action aceita; executor quebra | P0; adapter para a mesma operação |
| Editar/status pedido | confirmação/planos/regras | action aceita; executor quebra | P0 |
| Buscar cliente | autocomplete/busca | ausente | Tool de leitura |
| Criar cliente | fluxo embutido | ausente | formalizar operação antes da Tool |
| Consultar estoque | busca completa | só estoque baixo | filtro/resultado divergentes |
| Alterar estoque | `InventoryService`, créditos, sync e histórico | action aceita; executor quebra | P0 |
| Calcular preço | `CalculatorDomain` | ausente | reutilização direta obrigatória |
| Produção | jobs/eventos reais | lista pedidos recentes | sem paridade semântica |
| Caixa resumo | totais reais | snapshot dos totais | parcial |
| Lançar caixa | guards, normalização, histórico, sync | action aceita; executor quebra | P0 |
| Permissões/planos | aplicados na UI | não aplicados | P0 |

Conclusão: nenhuma escrita possui paridade. Leituras são snapshots, não UseCases/Tools. `ORDER.CREATE` permanece indisponível até testes equivalentes de resultado, estoque, caixa, histórico e sync.
