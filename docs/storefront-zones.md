# Storefront Zones - Fases 4A/4B

Data: 2026-05-27

## Zonas e camadas

```txt
storefront publica
 ├── store-header
 ├── store-content
 │    ├── store-filters
 │    └── store-products
 ├── store-cart
 └── store-footer

editor
 ├── store-editor-panel
 ├── store-editor-content
 └── store-editor-actions

preview
 ├── store-preview-frame
 └── store-preview-scroll
```

## Isolamento

| Area | Scroll | Overlay | Estado |
| --- | --- | --- | --- |
| Storefront publica | `#app-content` | layers globais | publico |
| Store editor | editor/admin | layers globais | admin |
| Store preview | `store-preview-scroll` | preview isolado | visual/simulado |

## Regra para futuras features

Qualquer nova area da loja deve declarar explicitamente sua zona antes de receber UI complexa. Isso evita que filtros, carrinho, preview e editor compartilhem containers de forma acidental.

## Render v2 inicial

| Mode | Source padrao | Raiz | Observacao |
| --- | --- | --- | --- |
| `public` | `v2` | `store-public-shell store-layout-zone layout-storefront` | Conteudo antigo dentro de zonas oficiais |
| `editor` | `v2` | `storefront-admin-page store-editor-zone` | Painel existente, sem mudar logica de salvar |
| `preview` | `v2` | `store-preview-container store-preview-zone` | Preview com frame/scroll proprio |

Render duplicado deve ser tratado no adapter `renderStorefrontView(...)`, nunca por condicional espalhada em telas.

## Fase 4C - Zonas do editor profissional

| Zona | Papel | Regra |
| --- | --- | --- |
| `store-editor-shell` | raiz do workspace administrativo da loja | nao usar grid publico da storefront |
| `store-editor-sidebar` | navegacao interna e estado do editor | fixa/sticky no desktop, horizontal no mobile |
| `store-editor-workspace` | area principal de edicao | recebe header e conteudo da aba ativa |
| `store-editor-header` | titulo, contexto e acoes agrupadas | nao deve virar bottom bar no desktop |
| `store-editor-main` | avisos e corpo da edicao | mantem scroll no App Shell |
| `store-editor-sections` | agrupamento dos cards internos | usa gaps/tokens globais |
| `store-preview-panel` | preview lateral/empilhado | lateral no desktop, 100% no tablet/mobile |

O preview continua usando `store-preview-scroll` dentro do frame. A diferenca da Fase 4C e que o painel externo possui limites responsivos para nao estreitar o conteudo central.
