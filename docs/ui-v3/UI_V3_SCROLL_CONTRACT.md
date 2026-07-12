# Contrato de scroll UI V3

| Elemento | height | min-height | overflow | position/display |
|---|---|---|---|---|
| raiz V3 | `100vh;100dvh` | `0` | hidden | fixed, flex |
| `ui3-app-shell` | 100% | 0 | hidden | grid, linhas auto/minmax/auto |
| `ui3-content-scroller` | linha flexível | 0 | `hidden auto` | bloco de scroll único |
| página | natural | natural | visible | container centralizado |
| modal/sheet/drawer | limitado por `dvh` | 0 | auto | Portal fixed |

Documento, body e raiz não rolam durante a V3. Apenas `ContentScroller` é proprietário da página; tabela e overlays possuem scroll interno delimitado. Safe area e teclado entram no `scroll-padding-bottom` do proprietário.
