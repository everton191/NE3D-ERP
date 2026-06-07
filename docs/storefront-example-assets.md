# Loja Online - assets dos modelos demonstrativos

## Regra

Modelos demonstrativos existem somente para orientar o editor vazio. Eles nao
representam estoque real, nao podem ser publicados automaticamente e sao
filtrados da loja publica.

## Assets locais

| Modelo | Asset | Estado |
| --- | --- | --- |
| Peça técnica flexível | `assets/storefront-demo/stamp.jpg` | Foto local demonstrativa coerente |
| Protótipo funcional | `assets/storefront-demo/custom-part.jpg` | Foto local demonstrativa coerente |
| Miniatura personalizada | `assets/storefront-demo/figure.jpg` | Foto local demonstrativa coerente |
| Modelo orgânico | `assets/storefront-demo/organizer.jpg` | Foto local demonstrativa coerente |
| Maquete arquitetônica | `assets/storefront-demo/miniature.jpg` | Foto local demonstrativa coerente |
| Vaso decorativo | `assets/storefront-demo/vase.jpg` | Foto local demonstrativa coerente |

O editor vazio usa essas fotos somente como referencia visual local. Os produtos
continuam marcados como demonstracao, nao sao persistidos automaticamente e sao
filtrados quando a vitrine e aberta sem contexto administrativo.

## Revisao visual

Os nomes e descricoes dos exemplos foram alinhados ao conteudo real das fotos.
Nao usar URLs externas temporarias, imagens remotas sem licenca confirmada ou
uma foto generica para anunciar um produto diferente.

## Comportamento seguro

- Cada exemplo recebe `__demo: true`.
- A vitrine publica remove produtos e categorias demonstrativas.
- Ao escolher um modelo, o editor exige confirmacao.
- O novo produto inicia como rascunho invisivel.
