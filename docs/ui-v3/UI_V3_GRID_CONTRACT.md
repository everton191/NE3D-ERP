# Contrato de grid UI V3

| Faixa | Colunas | Gap |
|---|---:|---:|
| `<768px` | 4 | 16px |
| `768–1023px` | 8 | 20px |
| `>=1024px` | 12 | 24px |

O grid usa `minmax(0,1fr)` e todos os descendentes recebem `min-width:0`. `GridItem` aceita `span`, início (`--ui3-col-start`) e `data-full="true"`. Span é limitado à quantidade atual de colunas. Campos full-width usam a linha inteira.
