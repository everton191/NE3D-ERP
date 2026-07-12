# Métricas finais de CSS da Etapa 3

## Delta da etapa

| Métrica | Antes da Etapa 3 | Depois | Delta |
|---|---:|---:|---:|
| `style.css` (linhas) | 41.099 | 39.427 | -1.672 |
| `style.css` (bytes) | não reconstituído neste checkout | 1.156.360 | — |
| regras estruturais removidas | 0 | 287 | +287 |
| novos módulos de tela V3 | 0 | 4 | +4 |

Os quatro módulos (`settings.css`, `reading.css`, `operational.css`, `finance.css`) somam 34 linhas compactas, além de quatro imports no índice. O saldo estrutural da etapa é, portanto, redução líquida de 1.634 linhas no CSS carregado em comparação com o início da Etapa 3.

Inventário atual dos CSS rastreados: 46 arquivos, 1.281.162 bytes, 2.090 ocorrências de `!important` e 194 `@media`. Esses números incluem ERP, Loja e demais folhas rastreadas; não justificam remoção automática de regras compartilhadas.

