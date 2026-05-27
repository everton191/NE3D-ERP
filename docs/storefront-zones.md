# Storefront Zones - Fase 4A

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
