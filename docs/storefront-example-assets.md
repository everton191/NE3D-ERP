# Loja Online - assets dos modelos demonstrativos

## Regra

Modelos demonstrativos existem somente para orientar o editor vazio. Eles nao
representam estoque real, nao podem ser publicados automaticamente e sao
filtrados da loja publica.

## Assets locais

| Modelo | Asset | Estado |
| --- | --- | --- |
| Carimbo personalizado | `assets/storefront-demo/stamp.jpg` | Foto local demonstrativa |
| Chaveiro personalizado | `assets/storefront-demo/custom-part.jpg` | Foto local demonstrativa |
| Topo de bolo personalizado | `assets/storefront-demo/figure.jpg` | Foto local demonstrativa |
| Cortador para confeitaria | `assets/storefront-demo/organizer.jpg` | Foto local demonstrativa |
| Lembrancinha personalizada | `assets/storefront-demo/miniature.jpg` | Foto local demonstrativa |
| Decoracao impressa em 3D | `assets/storefront-demo/vase.jpg` | Foto local demonstrativa |

O editor vazio usa essas fotos somente como referencia visual local. Os produtos
continuam marcados como demonstracao, nao sao persistidos automaticamente e sao
filtrados quando a vitrine e aberta sem contexto administrativo.

## Fotos ainda necessarias

Substituir os cinco placeholders acima somente por fotos licenciadas e
semanticamente adequadas. Nao usar URLs externas temporarias, imagens remotas
sem licenca confirmada ou uma foto generica para categorias diferentes.

## Comportamento seguro

- Cada exemplo recebe `__demo: true`.
- A vitrine publica remove produtos e categorias demonstrativas.
- Ao escolher um modelo, o editor exige confirmacao.
- O novo produto inicia como rascunho invisivel.
