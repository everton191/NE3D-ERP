# CSS Risk Map - Fase 1B

Data: 2026-05-27

Escopo: catalogar riscos sem remover CSS.

## Metricas Rapidas

- `style.css`: aproximadamente 21.835 linhas.
- Media queries: aproximadamente 62 ocorrencias.
- Regras encontradas com `overflow`, `position` e `z-index`: muitas ocorrencias distribuidas no arquivo.
- `app.js`: aproximadamente 34.884 linhas e injeta muitas classes diretamente.

## Categorias

- `critical`: pode travar tela, bloquear toque, quebrar overlay ou esconder conteudo.
- `high-risk`: pode causar regressao visual/responsiva se alterado sem teste.
- `legacy`: hotfix antigo ou regra ampla demais.
- `safe`: regra local, previsivel e com escopo claro.

## Riscos Encontrados

| Padrao | Classificacao | Onde aparece | Impacto |
| --- | --- | --- | --- |
| `overflow:hidden` | high-risk/critical | muitos blocos, cards, drawers, storefront, modais | pode bloquear scroll e cortar conteudo |
| `overflow:auto` | high-risk | modais, drawers, paineis operacionais | pode criar scrolls concorrentes |
| `overflow-x:hidden` | high-risk | body/shell/storefront | pode mascarar overflow real e quebrar swipe |
| `position:fixed` | critical | bottom-nav, drawers, overlays, toasts, widgets | pode bloquear toque ou sobrepor conteudo |
| `position:absolute` | high-risk | elementos visuais, badges, overlays internos | pode causar colisao responsiva |
| `height:100vh`/`max-height:100vh` | critical em mobile | containers e modais | pode quebrar teclado mobile/safe-area |
| `z-index:9999/10000` | critical | popup/backdrop/toasts | ordem de camada nao padronizada |
| `.card` global | high-risk | componente antigo e base visual | altera muitas telas ao mesmo tempo |
| `button` global | high-risk | base de botoes | pode afetar ERP, storefront e admin |
| `[class$="-preview"]` amplo | legacy/high-risk | tema claro | pode afetar previews nao relacionados |

## Linhas/Areas de Atencao

| Area aproximada | Padrao | Risco |
| --- | --- | --- |
| Inicio do arquivo | `*`, `body`, `overflow-x:hidden` | regra global mascara overflow |
| Base UI | `.card`, `button`, `.btn` | mudancas propagam para todo o app |
| Mobile nav/drawer | `.mobile-bottom-nav`, `.side-drawer`, `.side-drawer-backdrop` | touch, safe-area, z-index |
| PWA/APK overrides | `body[data-ui-profile="android_apk"]`, `web_pwa` | pode divergir web/app |
| Storefront admin | `.storefront-admin-*`, `.store-preview-*` | preview/editor podem brigar por scroll |
| Store public | `.store-public-*` | cliente final nao pode receber estilo admin |
| Light mode overrides | `body.theme-light ...` | risco de cascata excessiva |
| Final do arquivo | estabilizacoes recentes | importante manter ate consolidar tokens |

## Hardcodes Que Devem Virar Tokens

Prioridade para criar:

```css
--z-sidebar
--z-header
--z-drawer
--z-overlay
--z-modal
--z-toast
--z-floating
```

Depois substituir gradualmente:

- `z-index:10000`
- `z-index:9999`
- `z-index:9998`
- `z-index:220`
- `z-index:95`
- `z-index:80`
- `z-index:72`
- `z-index:60`
- `z-index:54`

## Regras Genericas a Vigiar

```css
* {}
body {}
button {}
.btn {}
.card {}
.modal-card {}
[class$="-preview"] {}
[class*="-preview "] {}
```

Nao remover em massa. Primeiro criar componentes/tokens substitutos e migrar tela por tela.

## Ordem de Correcao Recomendada

1. Criar tokens de z-index e aplicar apenas em overlay/drawer/modal/toast.
2. Catalogar quais `overflow:hidden` sao decorativos e quais sao estruturais.
3. Remover `height:100vh` de areas mobile em favor de `min-height`/`100dvh` quando seguro.
4. Limitar regras globais de `button`, `.card`, `.btn` com classes de componente.
5. Separar CSS de storefront publico do admin/editor.

