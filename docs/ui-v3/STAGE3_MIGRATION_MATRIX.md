# Matriz de migração da Etapa 3

| Rota/família | Estrutura anterior | Contrato novo | CSS removido | Evidência principal | Status |
|---|---|---|---:|---|---|
| Perfil, Conta e Usuário | cards/linhas e `#popup` | PageContainer, SettingsRow e Dialog Portal | lote 1: 621 linhas | teste de conta + captura 412×911 | migrado |
| Segurança e Zona de perigo | cards aninhados e confirmação local | PageContainer, DangerZone e confirmação V3 | incluído no lote 1 | testes de conta/segurança | migrado |
| Configuração, Empresa, Aparência, Notificações, suporte e informações | containers locais | limite compartilhado `renderTelaComUiV3` e Dialog | incluído no lote 1 | testes de tema/interface | migrado |
| Dashboard | grids locais de página | ResponsiveGrid 4/8/12 | lote 2: 698 linhas | teste reading + captura final 412×911 | migrado |
| Relatórios, filtros, tabelas e gráficos | cadeia local de altura/overflow | PageContainer, único `#app-content`, ScrollableTableArea e ChartContainer | incluído no lote 2 | rolagem real até 2.616px + captura | migrado |
| Pedidos e detalhes | `orders-screen-card`/layout PWA local | PageContainer e grid 4/8/12 | 12 linhas adicionais | teste operacional + captura | migrado |
| Novo/editar pedido | `order-edit-screen`, barra local e ações fora da etapa | PageContainer, grid, StickyActionBar e teclado central | lote 3: 322 linhas | testes pedido/calculadora | migrado |
| Clientes | container e filtros locais | PageContainer e grid V3 | incluído no lote 3 | teste operacional | migrado |
| Produção/impressoras | container e modais no `#popup` | PageContainer e Dialog Portal | incluído no lote 3 | teste produção + captura | migrado |
| Estoque/rolos | container e formulários no `#popup` | PageContainer, Dialog/Drawer Portal | incluído no lote 3 | testes estoque/rolos | migrado |
| Caixa/Financeiro | `cash-screen-card` e modais locais | PageContainer, grid, Dialog/Drawer Portal | lote 4: 31 linhas | teste financeiro + captura | migrado |
| Shell/rolagem | documento, painel e conteúdo concorrentes | `#app-content.ui3-content-scroller` único | conflitos editados na origem | prova runtime mobile | migrado |

Manual e Calcular são montados somente quando `pedidoTab === "itens"`; não são apenas ocultados por CSS.

