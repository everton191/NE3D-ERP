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
