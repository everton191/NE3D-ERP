# Mapa de uso de grid

## Veredito

Não existe contrato global 4 colunas mobile / 8 tablet / 12 desktop realmente utilizado pelas páginas. Existem muitos grids locais. A presença de `display:grid` não constitui uma grade de página.

| Área | Estratégia real | Contrato 4/8/12 | Risco |
|---|---|---|---|
| shell desktop | sidebar + conteúdo por grid/flex e larguras próprias | não | limites mudam por perfil |
| dashboard | grids de métricas/spans específicos | não | spans desktop precisam normalização local |
| relatórios | KPI grid, main grid, painéis e carrossel mobile próprios | não | altura/scroll dependem de regras da tela |
| Novo pedido | wizard, cards e linhas flex/grid locais | não | conteúdo e ações não compartilham trilhos |
| Usuário/Segurança | cards/linhas de configurações locais | não | ação final perde espaço em larguras pequenas |
| storefront V3 | grades próprias (2 colunas, auto-fit, 4 tabs) | não, intencionalmente isolada | não deve virar grade do ERP |
| editor V3 | painéis e grids próprios com breakpoints 900/560/430 | não | scrollers aninhados são parte do workspace |

## Padrões que simulam colunas

`style.css` contém `flex-wrap`, larguras percentuais/cálculos, `minmax()`, `auto-fit`, spans locais, margens e posicionamento absoluto. Esses padrões coexistem com grids explícitos. A consequência é que alinhamento horizontal, `row-gap`, alturas e recuos variam entre componentes que parecem pertencer à mesma linha.

## Telas que ignoram uma fundação comum

Todas as rotas renderizadas pelo monólito usam classes específicas em algum grau. Dashboard é a área mais próxima de uma grade formal; Novo pedido, Relatórios, Usuário e Segurança dependem de contratos locais. Storefront/editor têm fundação própria e devem permanecer isolados.

## Critério para a próxima fase

Criar primeiro um contrato de container e uma grade de página opt-in. Não converter automaticamente grids internos de cards, tabelas, editor ou storefront. Mapear cada filho para span somente quando a tela piloto for migrada.
