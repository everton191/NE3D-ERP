# Matriz de migração da Etapa 3

Data: 2026-07-12. Branch: `codex/ui-v3-screen-migration-stage3`.

| Lote | Família | Raiz V3 | Contratos consumidos | CSS estrutural antigo removido |
|---|---|---|---|---:|
| 1 | Usuário, Segurança, Perfil, Empresa, Aparência e Notificações | sim | page, stack, settings list, dialog, danger zone | 621 linhas |
| 2 | Relatórios, Dashboard, históricos, filtros, tabelas e gráficos | sim | grid 4/8/12, chart container, scrollable table | 698 linhas |
| 3 | Clientes, Pedido, Produção e Estoque | sim | page, grid, sticky actions, keyboard boundary | 322 linhas |
| 4 | Caixa, movimentações, pagamentos e fechamento | sim | page, grid, cards e listas financeiras | 31 linhas |
| 5 | fronteiras e documentação | sim | imports V3 separados de `style.css` | sem remoção incerta |

O fluxo Manual/Calcular é renderizado somente quando `pedidoTab === "itens"`. Nenhuma regra de negócio financeira, estoque ou produção foi removida.

