# Mapa de scroll e viewport

## Autoridade declarada versus real

`docs/layout-zones.md` declara `#app-content` como scroller. `UI_STRUCTURE_AUDIT.md` declara o documento. No runtime, `body.app-shell-ready` tenta fixar o shell e rolar `#app-content`, mas regras posteriores e containers de tela adicionam `overflow`, alturas e posições próprias. Portanto, não há garantia de um único scroller.

| Rota/área | Scroller esperado | Scrollers concorrentes/prováveis |
|---|---|---|
| Dashboard | `#app-content` | `.desktop-main` e cards pontuais |
| Pedidos/Novo pedido | `#app-content` | listas/detalhes/wizard e barra fixa/sticky |
| Produção/Estoque/Clientes/Caixa | `#app-content` | listas, tabelas e painéis de detalhe |
| Relatórios | `#app-content` | `.reports-page`/fluxos internos e ancestrais com altura/overflow |
| Usuário/Segurança | `#app-content` | subscreen mobile e cards/painéis internos |
| Storefront pública | `#app-content`/scroll natural isolado | modal/carrinho |
| Editor storefront | `.sfe-fields`, `.sfe-list__items`, `.sfe-scroll`, preview | múltiplos intencionais dentro de workspace `100dvh` |
| modal/drawer | painel interno | body é bloqueado por `app-layer-open` quando helper correto é usado |

## Causa provável de Relatórios não rolar

A tela está dentro de um shell cuja cadeia usa altura de viewport e `overflow` controlado. A documentação e o CSS discordam sobre o dono do scroll; `.reports-page` também recebe regras específicas por perfil. Quando um ancestral (`html/body/#app-shell/#app-content/.desktop-main`) fica com `overflow:hidden` ou altura fixa e a página não recebe `min-height:0` + `overflow:auto` no mesmo eixo, o conteúdo é cortado sem que exista scroller utilizável. Não é falta de conteúdo: é quebra da cadeia de altura/overflow e dupla autoridade.

## Viewport, bottom-nav e safe area

Há usos de `100vh`, `100dvh`, `height:100%`, fixed/sticky e variáveis de safe area. A navegação inferior é fixa e o conteúdo tenta reservar espaço; regras `.keyboard-visible` alteram a navegação. Se o inset de teclado/safe area não chegar ao scroller real, os últimos campos ficam atrás da barra.

## Regra de implementação recomendada

No ERP autenticado, `html/body/#app-shell` não rolam; `#app-content` é o único scroller de página. Rotas não definem `height:100vh/100dvh` nem `overflow-y`. Apenas listas delimitadas, modais, drawers e workspaces explicitamente isolados podem ter scroll interno.
