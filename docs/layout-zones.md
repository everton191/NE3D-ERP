# Layout Zones - Fase 1B

Data: 2026-05-27

Escopo: mapa das zonas visuais e camadas atuais antes do App Shell profissional.

## Zonas Atuais

```txt
body
 ├── #app-shell
 │    ├── #app-sidebar       reservado
 │    ├── #app-topbar        reservado
 │    ├── #app-content
 │    │    └── #app
 │    │         ├── desktop-shell
 │    │         │    ├── side-menu
 │    │         │    └── desktop-main app-content
 │    │         │         ├── topbar
 │    │         │         └── desktop-focus/app-page/dashboard
 │    │         ├── mobile shell/render
 │    │         │    ├── mobile content
 │    │         │    ├── drawer gesture rail
 │    │         │    └── mobile-bottom-nav
 │    │         ├── lojaPublica
 │    │         └── lojaAdmin standalone
 │    ├── #overlay-layer
 │    ├── #drawer-layer
 │    ├── #modal-layer
 │    └── #toast-layer
 ├── #popup
 ├── #toastArea
 ├── introOverlay
 └── floating controls
```

## Camadas Desejadas no App Shell

```txt
app-shell
 ├── sidebar
 ├── topbar
 ├── page-content
 ├── overlay-layer
 ├── modal-layer
 └── toast-layer
```

## Mapeamento Atual Para Futuro

| Futuro | Atual | Status | Risco |
| --- | --- | --- | --- |
| `app-shell` | `desktop-shell`, mobile render, storefront standalone | parcial | high-risk |
| `sidebar` | `renderMenuLateral`, `.side-menu` | ativo | medium |
| `topbar` | `renderTopbar`, `.topbar` | ativo | medium |
| `page-content` | `.desktop-main`, `.desktop-focus`, mobile content | parcial | critical para scroll |
| `overlay-layer` | `#popup`, `introOverlay`, drawer backdrops | misturado | critical |
| `modal-layer` | `#popup .modal-backdrop/.modal-card` | misturado | critical |
| `toast-layer` | `#toast-layer` recebe `#toastArea` criado por `mostrarToast` | ativo | medium |

## Fase 2A - Tokens de Camada

Tokens globais criados:

```css
--z-base: 1;
--z-sidebar: 100;
--z-header: 120;
--z-overlay: 400;
--z-drawer: 500;
--z-modal: 700;
--z-toast: 900;
--z-critical: 9999;
```

Uso inicial:

- `intro-overlay` usa `--z-critical`.
- `modal-backdrop` e `.popup` usam `--z-modal`.
- `side-drawer-backdrop` usa `--z-drawer`.
- `.toast-area` usa `--z-toast`.
- hardcodes `z-index:9999` e `z-index:10000` foram removidos dos pontos encontrados.

## Fase 2B - Camadas em Uso Real

Primeiros componentes migrados:

| Componente | Camada nova | Camada legada removida deste fluxo |
| --- | --- | --- |
| Documento legal (`Termos`/`Politica`) | `#modal-layer` + `#overlay-layer` | `#popup.innerHTML` |
| Drawer lateral mobile | `#drawer-layer` + `#overlay-layer` | `#popup.innerHTML` |

`#popup` continua ativo para os fluxos ainda nao migrados, mas nao deve receber codigo novo.

Responsabilidade atual das camadas:

```txt
overlay-layer
 └── app-overlay-scrim

drawer-layer
 └── side-drawer-backdrop
      └── side-drawer

modal-layer
 └── app-modal-stage
      └── modal-card

toast-layer
 └── toastArea
```

## Fase 2C - Scroll e Sidebar Consolidados

O shell passa a tratar `#app-content` como scroller principal quando `body.app-shell-ready` esta ativo.

```txt
body.app-shell-ready
 └── #app-shell
      └── #app-content  <- scroll principal
           └── #app
                └── desktop-shell/mobile/storefront
```

Regras consolidadas:

- `#app-content` controla o scroll vertical principal.
- `.desktop-main` deixa de competir com scroll proprio no perfil PWA desktop.
- `.side-menu:not(.side-drawer)` usa largura oficial `--sidebar-width`.
- `body.app-layer-open` bloqueia o scroll de fundo enquanto modal/drawer/overlay esta ativo.
- drawer, modal e toast continuam autorizados a usar `position:fixed`.

Zonas oficiais preparadas:

```txt
layout-shell
layout-admin
layout-storefront
layout-auth
layout-editor
```

## Zonas de Scroll

| Zona | Status Atual | Risco |
| --- | --- | --- |
| `body/html` | travado quando `app-shell-ready` esta ativo | baixo, depende de excecoes publicas |
| `#app-content` | scroller principal oficial | medio, precisa testes por tela |
| `.desktop-main` | conteudo desktop sem scroll proprio no PWA | medio, depende de telas antigas |
| drawers | usam scroll proprio | necessario, mas precisa limite |
| modais | usam scroll proprio | necessario, mas pode brigar com body |
| storefront preview/editor | possui containers com scroll | high-risk |
| public storefront | deve scrollar natural | deve ficar separado do editor |

## Overlays Concorrentes

| Overlay | Atual | Risco |
| --- | --- | --- |
| menu usuario topbar | `#popup` + `topbar-profile-backdrop` | usa z-index inline |
| drawer lateral | `#popup` + `side-drawer-backdrop` | divide camada com modais |
| modais sensiveis | `#popup` + `modal-backdrop` | pode ser sobrescrito por outro popup |
| editor visual loja | `store-visual-panel-backdrop` | precisa camada propria |
| carrinho loja | `store-cart-drawer` | drawer/modal misto |
| quick order/cash/stock | `operational-drawer-backdrop` | drawer operacional |
| toast | `#toastArea` | separado, mas z-index precisa token |

## Zonas Criticas Para Teste Manual

### Mobile

- Drawer abre/fecha sem travar scroll.
- Bottom-nav nao cobre botoes finais.
- Modais cabem com teclado aberto.
- Store admin nao parece desktop comprimido.
- Store publica nao tem controles admin sem `admin=1`.

### Desktop

- Mouse wheel funciona em dashboard, pedidos, loja admin e storefront.
- Sidebar expandida/recolhida nao quebra conteudo.
- Topbar nao sobrepoe botoes.
- Planos mostram atual/todos os planos corretamente.
- Storefront desktop usa largura real, nao container mobile.

## Regras Para a Proxima Fase

1. Nenhum novo modal deve escrever direto no `#popup` sem passar pela camada padronizada.
2. Nenhum novo z-index numerico deve ser adicionado sem token.
3. Nenhuma tela nova deve criar scroll de pagina proprio.
4. Storefront publico e editor/admin devem ter containers separados.
5. Bottom-nav e drawer mobile precisam respeitar safe-area e teclado.
