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
