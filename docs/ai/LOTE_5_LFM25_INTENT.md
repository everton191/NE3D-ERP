# Lote 5 — LFM2.5 como interpretador de intent

## Estado

Classificação: **AINDA NÃO APTO — contrato estrutural aprovado; holdout insuficiente para promoção**.

O Lote 5 preserva Needle em shadow e não altera `WRITE`, ActionPlan, UI, calculadora, Supabase, carrossel ou `apps/opticore`.

## Implementação preparada

O provider em shadow reduz o conjunto de intents por domínio/contexto, limita a oito opções e valida cada retorno no `IntentRegistry`. Ele nunca aceita intent nova, IDs ou valor financeiro inferido. O provider foi adicionado ao carregador lazy, mas não foi conectado à decisão atual.

## Evidência real no ASUS_I005DA

- Download oficial verificado: PASS, 695.755.488 bytes e SHA-256 pinado.
- Importação privada com `.part` + SHA-256 + rename atômico: PASS.
- Load: PASS.
- Health/chat template do GGUF: PASS.
- Smoke estruturado inicial: **0/5**.
- Smoke estruturado após a correção do sampler: **5/5**.

Os cinco casos (`abre estoque`, `qnt tem de pla preto`, pedido, cálculo e compartilhamento contextual) chegaram ao runtime com duas mensagens (`system` + `user`), chat template oficial do GGUF e grammar ativa. Todos retornaram o JSON fechado aceito pelo parser, sem texto extra, com `writeExposed: 0`. O ciclo unload/reload também voltou de `INSTALLED` para `READY`.

A causa-raiz do 0/5 era o aceite duplicado do token no JNI. Nesta revisão do llama.cpp, `llama_sampler_sample()` já chama `llama_sampler_accept()`; o segundo aceite manual quebrava o estado da grammar no primeiro token (`{`) e terminava em `NATIVE_EXCEPTION`. A correção remove somente o segundo aceite.

O smoke estrutural não é uma métrica de acurácia. Nesta amostra exploratória, 3/5 intents coincidiram com o esperado; os dois erros foram `abre estoque` e `qnt tem de pla preto`. Esses resultados devem ser medidos no corpus completo, sem promover o provider antes das métricas separadas.

## Gate de cold start

O plugin agora diferencia runtime alocado de runtime realmente `READY`. Uma geração recebida em `UNLOADED` prepara o QAD no worker dedicado, aguarda load/warmup com prazo limitado e executa a solicitação uma única vez após `READY`. Não há espera ativa nem bloqueio da UI thread.

No ASUS, o teste físico partiu de `UNLOADED`, recebeu imediatamente `generateLocal`, fez uma carga, um warmup e uma geração, retornou `OK` e terminou em `READY`, sem `LOCAL_LLAMA_NOT_READY`. O smoke estruturado permaneceu 5/5 e `writeExposed` permaneceu 0.

## Corpus e comparação

O corpus de tuning foi executado no ASUS com persistência por caso. O baseline de 65 casos ficou em 38,46% de intent, 49,23% de tool, 93,85% de schema e 62,07% de campos. Após ajustes somente no conjunto de tuning, a rodada congelada ficou em 98,46% de intent, 87,69% de tool, 100% de schema e 62,07% de campos, com 13 campos obrigatórios ausentes, 42 inesperados e zero falha técnica. A única confusão de intent restante foi um `NO_MATCH` esperado classificado como `calculator.calculate` (`2 horas e meia`).

Os artefatos completos ficam em `reports/ai/lfm25-evaluation/`: baseline `lfm25-tuning-2026-09-30T23-47-26-089Z.json` e tuning congelado `lfm25-tuning-2026-10-01T00-03-58-053Z.json`. O evaluator grava cada caso imediatamente antes de avançar e mantém métricas, matriz de confusão, latência, saída bruta segura e categorias de erro.

O ajuste preservou o LFM2.5 QAD-Q4_0, a quantização, o chat template e a grammar. Ele passou a priorizar as regras semânticas determinísticas já existentes para padrões inequívocos, a respeitar continuação de `activeWorkflow`, e a falhar fechado quando não há intent plausível. O provider continua em shadow, sem executar tools e com `writeExposed: 0`.

O gate estrutural foi repetido após o tuning: **5/5**, com grammar ativa, duas mensagens de chat e `writeExposed: 0` em todos os casos.

Após o checkpoint `bbed17e`, o holdout foi executado uma única vez, sem ajuste posterior. Nos 15 casos, o resultado foi 60,00% de intent, 66,67% de tool, 86,67% de schema e 0% de campos (um caso com campo esperado), com 1 campo obrigatório ausente, 3 inesperados e zero falha técnica. As principais confusões foram `customers.search -> NO_MATCH` (2), `printers.list -> production.list` (2), `reports.sales -> cash.get_status` (1) e `reports.financial -> NO_MATCH` (1). O artefato completo é `reports/ai/lfm25-evaluation/lfm25-holdout-2026-10-01T00-08-20-915Z.json`.

Comparação preservada:

| Provider | Holdout intent | Holdout tool |
| --- | ---: | ---: |
| Needle pós-tuning | 46,67% | 60,00% |
| LFM2.5 QAD-Q4_0 | 60,00% | 66,67% |
| Híbrido | Não aplicável: LFM não promovido para simulação |

## Conclusão

Classificação: **AINDA NÃO APTO**. O contrato estrutural e o cold start estão aprovados, mas o holdout não sustenta promoção para roteamento de produção: há perda relevante de intent/tool e dois casos com conflito de schema. Manter shadow, `writeExposed: 0` e WRITE bloqueado. Uma próxima fase deve ampliar cobertura determinística e de entidades usando um novo conjunto de desenvolvimento, sem reutilizar estes 15 casos como tuning.

## Desenvolvimento v1 e comparação A/B/C

Foi criado um conjunto independente de 42 casos, seis por família (`customers.search`, `printers.list`, `production.list`, `reports.sales`, `reports.financial`, `cash.get_status` e `NO_MATCH`). Nenhuma entrada repete o holdout histórico.

No baseline, os modos A/B/C obtiveram respectivamente 14,29%, 26,19% e 26,19% de intent. A auditoria mostrou lacunas de domínio e ausência de sinais semânticos no CandidateRetriever. Após adicionar descrições e sinais gerais, sem regras por frase, a comparação ficou:

| Modo | Intent | Tool | Schema | Média | P50 | P95 | LFM calls |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| A — deterministic + retriever | 61,90% | 69,05% | 100% | 616 ms | 2 ms | 2.925 ms | 0 |
| B — LFM reranker restrito | 50,00% | 78,57% | 71,43% | 6.190 ms | 8.039 ms | 10.689 ms | 29 |
| C — pipeline atual | 47,62% | 78,57% | 76,19% | 5.850 ms | 7.975 ms | 9.634 ms | 29 |

O modo A venceu em intent, schema e latência. B e C ganharam em tool, mas perderam qualidade estrutural e adicionaram aproximadamente 29 chamadas ao LFM. Por evidência, o tuning final foi congelado no modo A para avaliação, sem promoção do comportamento de produção. A rodada final do dev atingiu 100% intent, 97,62% tool, 100% schema, média 312 ms, P50 237 ms e P95 991 ms.

As métricas de campos foram ampliadas com numeradores e denominadores. No dev final: coverage 26/42 (61,90%), exact 0/26, precision 0/2, recall 0/26, unexpected 4/4 e missing 26/26. Isso confirma que roteamento e extração de entidades continuam sendo gates separados.

## Validação v1 congelada

Após o congelamento, 21 casos inéditos (três por família) foram executados uma única vez no modo A. Resultado: 80,95% intent, 80,95% tool, 100% schema, média 273 ms, P50 1 ms, P95 870 ms e zero chamada ao LFM. NO_MATCH teve precision 3/7 (42,86%) e recall 3/3 (100%). Campos: coverage 12/21 (57,14%), exact 0/12, precision 0/0, recall 0/12, unexpected 1/1 e missing 12/12.

O resultado preserva a classificação **AINDA NÃO APTO**. A arquitetura A é a melhor base de avaliação, mas quatro intents válidos caíram em fallback e a extração de campos permaneceu insuficiente. Nenhuma alteração foi feita após observar a validação.

## Auditoria do evaluator 65/15 — 2026-10-05

O corpus histórico foi preservado com 80 casos (65 tuning e 15 holdout). A auditoria confirmou que `fieldExtractionAccuracy` já usava somente casos com `expectedFields` não vazio: casos exatos / casos anotados. Portanto, o 0% antigo do holdout significava 0/1, não 0/15. A amostra tinha cobertura de anotação de apenas 1/15 (6,67%), uma ocorrência e um único campo (`customerName`), insuficiente para representar extração de entidades no holdout.

O relatório mantém `fieldExtractionAccuracy` e `fieldCaseCoverage` por compatibilidade e acrescenta `fieldExactCaseAccuracy`, `fieldAnnotationCoverage` e `byField`. Para cada campo, `byField` registra ocorrências esperadas, extraídas, corretas, precisão (`corretas / extraídas`) e recall (`corretas / esperadas`). Isso expõe campos extraídos em casos sem anotação sem alterar o corpus retroativamente.

A causa funcional de `other-013` (`abre pedido da Maria`) era dupla: o extrator determinístico só reconhecia cliente após `pra/para`, enquanto o Needle podia inferir `orderNumber="da Maria"` e a fusão aceitava qualquer texto nesse campo. O extrator passou a reconhecer `pedido da/do <nome>` e a fusão agora aceita `orderNumber` inferido somente em formato numérico. Pedidos numéricos como `pedido 123` continuam aceitos.

No ASUS_I005DA, após sync, build e instalação, a rodada completa em modo C terminou sem falha técnica. Tuning: intent 98,46%, tool 87,69%, schema 100%, caso exato de campos 19/29 (65,52%), precisão agregada legada 42/76 (55,26%) e recall 42/54 (77,78%). Holdout: intent 93,33%, tool 93,33%, schema 93,33%, caso exato 1/1 (100%), precisão agregada legada 1/1 e recall 1/1. `other-013` retornou `customerName="Maria"`, sem `orderNumber`, e registrou `INVALID_FORMAT:orderNumber` para a inferência descartada.

O holdout ainda não é uma régua representativa de campos. Além da única anotação de `customerName`, a rodada encontrou `orderNumber` em `other-007` e `materialName` em `other-014`, ambos sem expectativa anotada. Esses casos precisam de revisão humana em uma futura versão do corpus; não foram reclassificados nesta auditoria para evitar tuning pelo holdout.

Classificação após esta fase: **EVALUATOR CORRIGIDO; AINDA NÃO APTO PARA NOVO CICLO LFM 65/15**. Antes de novo tuning, deve ser criada uma revisão versionada de desenvolvimento/validação com cobertura deliberada por campo e sem reutilizar o holdout observado como tuning. Needle permanece em shadow, `writeExposed: 0` e WRITE bloqueado.
