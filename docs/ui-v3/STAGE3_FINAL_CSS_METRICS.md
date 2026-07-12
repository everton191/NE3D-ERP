# Métricas finais de CSS da Etapa 3

Baseline: commit `d1957a8` (fim da Fundação V3). Medição atual: branch `codex/ui-v3-screen-migration-stage3`, em 2026-07-12. A contagem usa todos os arquivos CSS rastreados, inclusive ERP, Loja e Editor.

| Métrica | Antes | Depois | Delta |
|---|---:|---:|---:|
| arquivos CSS | 42 | 46 | +4 módulos V3 |
| linhas físicas | 50.052 | 48.431 | -1.621 |
| bytes CSS rastreados | 1.300.612 | 1.281.836 | -18.776 |
| `!important` | 2.236 | 2.086 | -150 |
| `@media` | 192 | 194 | +2 |
| seletores duplicados exatos | 892 | 866 | -26 |
| breakpoints distintos | 119 | 118 | -1 (`1500px`) |
| regras estruturais removidas | 0 | 295 | -295 regras |
| linhas removidas de `style.css` | 0 | 1.714 | -1.714 |

O CSS copiado pelo build atual soma 1.269.938 bytes em 32 arquivos. Não existe artefato de build preservado do commit baseline; por isso o tamanho comparável antes/depois é o total rastreado acima, e não um bundle antigo inventado.

Arquivos CSS removidos: 0. Imports removidos: 0. Os quatro arquivos adicionados são `settings.css`, `reading.css`, `operational.css` e `finance.css`. A redução líquida inclui a nova integração de shell, overlays e telas.
