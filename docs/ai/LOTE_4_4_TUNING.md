# Lote 4.4 — Tuning concentrado do Needle

Data: 2026-09-27
Branch: `codex/melhorias-setembro-2026`
Escopo: roteamento determinístico e segurança de argumentos em modo shadow. `WRITE` permanece desabilitado.

## Runs reais no ASUS_I005DA (Android 13)

- Baseline preservada: `run-e03b932f-316b-4a87-a02e-466ee8308402`
- Pós-tuning: `run-cfab874a-6d90-45cf-be54-2ca4f04bc854`
- Ambos: 80/80 casos persistidos, Needle revision `b274efcb211a9eef48c9a88da4b43bd569696a39`.

## Patches

- Normalização estritamente pontual: `qunto` para `quanto`.
- Intenções de estoque em ordem natural (por exemplo, item/material antes de `tem quanto`), sem condicionar a materiais específicos.
- Cálculo reconhecido somente quando peso e duração aparecem juntos; durações isoladas continuam sem intenção global.
- Consultas de resumo/situação do caixa e de status/situação da produção mapeadas às ações READ existentes.
- `unitPrice`, `discount`, `total` e valores financeiros equivalentes só entram em argumentos mesclados com fonte `USER`, `ERP_DATABASE`, `CURRENT_CALCULATION` ou `WORKFLOW`. Uma inferência isolada do Needle é removida e gera `FINANCIAL_VALUE_WITHOUT_PROVENANCE`.

## Comparação

| Métrica | Tuning antes | Tuning depois | Holdout antes | Holdout depois |
| --- | ---: | ---: | ---: | ---: |
| Intent accuracy | 69,23% | 80,00% | 46,67% | 46,67% |
| Tool match | 70,77% | 78,46% | 60,00% | 60,00% |
| Required args | 55,38% | 55,38% | 93,33% | 93,33% |
| Critical args | 76,92% | 76,92% | 100,00% | 100,00% |
| Strict args | 46,15% | 46,15% | 80,00% | 80,00% |
| Optional extras | 8 | 8 | 3 | 3 |
| Financial hallucination efetiva | 1 | 0 | 0 | 0 |
| Unresolved IDs / invalid tools | 0 / 0 | 0 / 0 | 0 / 0 | 0 / 0 |
| Média / P50 / P95 (ms) | 525,65 / 160 / 2240 | 254,68 / 216 / 681 | 122,07 / 0 / 559 | 122,93 / 0 / 606 |

O baseline não persistia candidatos; por isso as métricas condicionais de cascata só existem no pós-tuning. No pós-tuning: candidate coverage dado intent correto foi 97,50% no tuning e 100,00% no holdout; tool match dado candidato disponível foi 87,18% no tuning e 0,00% no holdout. Required args dado tool correto foi 56,86% / 88,89%; critical args dado tool correto foi 78,43% / 100,00%.

## Regressão financeira

O padrão `order-015` seleciona `orders.create`, mas a resposta nativa que incluiu `unitPrice: 2` foi bloqueada antes dos argumentos mesclados. O registro persistido contém `FINANCIAL_VALUE_WITHOUT_PROVENANCE:unitPrice`; não há preço inferido no plano efetivo. Nenhum valor padrão foi adicionado: se um campo obrigatório não tiver fonte válida, continua ausente.

## Decisão

Classificação: **D — NEEDLE_ROUTING_SHOULD_BE_ASSISTED_BY_LFM**.

O tuning corrigiu os falsos `NO_MATCH` diagnosticados sem degradar o holdout, mas não elevou o holdout de intenção/ferramenta. Esta foi a rodada única autorizada; não abrir Lote 4.5. Próximo passo: Lote 5, LFM2.5 para interpretação de linguagem e intenção, mantendo o Needle apenas como extractor/tool filler em shadow, com `writeExposed: 0`.
