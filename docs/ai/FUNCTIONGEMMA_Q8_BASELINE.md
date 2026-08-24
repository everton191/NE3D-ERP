# FunctionGemma Q8 — baseline real no Zenfone 8

Última execução completa: 2026-08-24T16:25:07.737Z

## Resultado

| Métrica | Resultado |
| --- | ---: |
| Casos executados | 560/560 |
| Tool selection | 60.54% |
| Disposition accuracy | 41.96% |
| Negative tool accuracy | 38.57% |
| No-tool accuracy | 100.00% |
| Schema validity | 100.00% |
| Missing-data detection | 91.25% |
| Argument exact/semantic | não mensurável: 0 casos anotados |
| Top-K violations | 0 |
| Unsafe direct WRITE | 0 |
| Latência média / P50 / P95 | 451 / 510 / 1103 ms |
| TTFT média / P50 / P95 | 338 / 281 / 807 ms |
| Tokens/s médio / P50 / P95 | 62.14 / 63.49 / 70.42 |

## Por domínio

| Domínio | Casos | Tool accuracy | No-tool | Schema |
| --- | ---: | ---: | ---: | ---: |
| calculator | 80 | 43.75% | 100.00% | 100.00% |
| cash | 80 | 83.75% | 100.00% | 100.00% |
| customers | 80 | 60.00% | 100.00% | 100.00% |
| inventory | 80 | 75.00% | 100.00% | 100.00% |
| navigation | 80 | 60.00% | 100.00% | 100.00% |
| orders | 80 | 66.25% | 100.00% | 100.00% |
| production | 80 | 35.00% | 100.00% | 100.00% |

## Leitura dos erros

- Erros restantes: 221; todos são falsos negativos, sem confusão aceita entre duas actions.
- `MODEL_NO_TOOL`: 176.
- `NO_ACTION_SEARCH_MATCH`: 45.
- `production.list_queue`: DEGRADED e fora do modelo por faltar contract test; seus casos não medem capacidade do checkpoint.
- Calculadora e demais CALLs não têm argumentos esperados anotados; não há base honesta para argument accuracy.

O arquivo de previsões desta execução contém 560 IDs únicos, sem duplicatas e sem falhas de inferência. O resultado mostra que as guardas estão seguras, mas o checkpoint base ainda tem recall insuficiente, sobretudo em Produção e Calculadora. Isso não autoriza fine-tuning antes da revisão humana e da estabilização dos contratos.

## Runtime após o baseline

- PSS do processo com modelo carregado: 820.245 KB.
- RSS do processo com modelo carregado: 973.484 KB.
- Temperatura da pele: 33,5 °C; bateria: 34,1 °C.
- Maior leitura de CPU em cache: 52,8 °C; estado térmico Android: 0, sem throttling.
- Crash do processo: 0; ANR: 0.
- GGUF no diretório privado: 291.557.856 bytes.
- SHA-256 no aparelho: `595b727d73a8e78cc8da03f12a947137818c6d3544be903eef8494824b2d5b47`.

Artefatos: `android-q8-predictions.v1.jsonl`, `android-q8-contract-rerun.v1.jsonl`, `android-q8-predictions.v2.jsonl`, `baseline.json` e `baseline-errors.v1.jsonl`.

## Status

```ini
FUNCTIONGEMMA_ANDROID_Q8 = READY
FUNCTIONGEMMA_BASELINE = READY
AI_RUNTIME_PERFORMANCE = READY
FINE_TUNING_PREPARATION = NOT_READY
WRITE_EXPOSED = 0
```
