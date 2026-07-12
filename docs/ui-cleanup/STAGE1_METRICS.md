# Etapa 1 — métricas

## CSS carregado

`style.css`, `themes/base/design-system-v2.css`, `src/storefront/styles/tokens.css`, `components.css`, `layouts.css` e `src/styles/google-expressive-motion.css`: 6 arquivos.

| Métrica | Antes | Depois | Diferença |
|---|---:|---:|---:|
| linhas dos 6 CSS carregados | 49.550 | 49.514 | -36 |
| bytes dos 6 CSS carregados/build | 1.291.918 | 1.289.918 | -2.000 |
| `style.css` linhas | 47.276 | 47.257 | -19 |
| motion CSS linhas | 586 | 569 | -17 |
| `!important` | 2.252 | 2.236 | -16 |
| media queries | 189 | 189 | 0 |
| breakpoints distintos em media query | 45 | 45 | 0 |
| duplicações exatas de regra-folha (scanner conservador) | 53 | 46 | -7 |
| arquivos CSS no repositório, fora de `dist/node_modules` | 22 | 22 | 0 |
| CSS vazios | 0 | 0 | 0 |
| arquivos não importados diretamente | 16 | 16 | 0 |

Breakpoints observados: 359, 360, 370, 380, 390, 410, 420, 430, 520, 560, 620, 640, 720, 760, 767, 768, 769, 820, 860, 861, 900, 901, 1020, 1023, 1024, 1080, 1099, 1100, 1101, 1120, 1180, 1181, 1200, 1279, 1280, 1320, 1360, 1400, 1440, 1500, 1600, 1680, 1800, 1920 e 2100 px.

## Método

Linhas/bytes foram medidos nos seis links do `index.html`. Duplicações contam regras-folha com seletor e corpo normalizados idênticos; keyframes e contextos aninhados continuam na contagem, portanto o número é inventário, não lista automática de remoção. O build copia CSS sem minificação; o tamanho de produção desses seis arquivos coincide com o pós-build.
