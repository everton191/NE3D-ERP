# Legado removido na Etapa 3

Foram removidas 295 regras e 1.714 linhas de `style.css` por raízes comprovadamente substituídas.

| Família | Seletores/blocos | Regras | Linhas |
|---|---|---:|---:|
| Configurações | perfil, segurança, notificações e modo de interface | 106 | 621 |
| Leitura | dashboard e relatórios estruturais | 126 | 698 |
| Operacional | pedido, estoque, produção e clientes | 50 | 322 |
| Financeiro | `cash-screen-card`, `cash-screen-header` | 5 | 31 |
| Overlays | backdrops específicos já promovidos ao Portal | 6 | 30 |
| Lista de pedidos | `orders-screen-card` | 2 | 12 |

Componentes visuais substituídos: raízes antigas de página, barras estruturais antigas e backdrops específicos. O `#popup` permanece somente como fallback da Loja/Superadmin e área temporária de montagem; todos os fluxos visuais do ERP são promovidos para Dialog/Drawer V3 e deixam o nó vazio. `test:ui-v3-legacy-boundary` impede nova renderização ERP direta nesse sistema.

Arquivos removidos: 0. Imports removidos: 0. Breakpoint eliminado: `1500px`. Ocorrências de `!important` eliminadas no saldo: 150. Seletores duplicados exatos eliminados no saldo: 26.
