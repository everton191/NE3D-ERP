# Plano de correção antes de fine-tuning

Status: **FINE_TUNING_READY = NÃO**

## Evidência atual

- Baseline Android real: 560/560 casos.
- Tool selection inicial: 51.79%.
- Tool selection após guardas determinísticos: 60.54%.
- Erros restantes: 221; todos são falsos negativos.
- Camadas prováveis: {"ACTION_SEARCH_ALIASES":33,"CONTRACT_NOT_EXPOSED":52,"MODEL_OR_CONTRACT_WITH_UNANNOTATED_ARGUMENTS":136}.
- Dataset: 0/560 revisados humanamente, 65 grupos semânticos.
- Argumentos esperados anotados: 0/560.
- WRITE direto, violações Top-K e schema inválido aceito: 0.

## Ordem obrigatória

1. Estabilizar contratos: tornar `production.list_queue` READY com contract test e caminho UseCase real.
2. Revisar os 560 casos e anotar argumentos esperados; corrigir contradições de dados faltantes, principalmente Calculadora.
3. Melhorar aliases/recall do Action Search nos 33 erros de digitação sem ampliar Top-K indiscriminadamente.
4. Revisar nome, descrição, schema wire e contexto de tela dos falsos negativos restantes; repetir somente os casos afetados.
5. Congelar train/validation/test/evaluation por grupos semânticos e hashes.
6. Só então selecionar os erros residuais realmente atribuíveis ao modelo para fine-tuning do checkpoint oficial `google/functiongemma-270m-it`.

## Categorias candidatas a treinamento, após os gates

- PT-BR informal e erros de digitação que sobreviverem ao Action Search.
- Referências de contexto e multi-turn com contexto real anotado.
- Recall de tool calling para contratos já validados.

Não usar Mobile Actions fine-tuned como modelo do Simplifica. Não treinar para contornar contrato, Top-K ou dataset incorreto.
