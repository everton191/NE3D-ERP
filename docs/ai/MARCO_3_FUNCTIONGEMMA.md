# Marco 3 — FunctionGemma

`MARCO_3_FUNCTIONGEMMA = NOT_READY`

## Runtime real

- FunctionGemma real carregou: **NÃO**.
- Zenfone detectado: `ASUS_I005DA`, `arm64-v8a`, Simplifica 3D `1.0.37`.
- Modelo instalado no escopo privado do aplicativo: somente `gemma-4-e2b-it`.
- LiteRT-LM: `0.15.0` já integrado ao APK.
- Smoke test FunctionGemma: não executado; não existe checkpoint FunctionGemma oficial convertido e verificado neste aparelho.
- Baseline 560: não executado; o runner exige uma predição real por caso.
- RAM/TTFT/temperatura/CPU: não medidos para FunctionGemma.

O checkpoint oficial `google/functiongemma-270m-it` requer licença Gemma aceita. O artefato LiteRT identificado publicamente é o fine-tune Mobile Actions e foi rejeitado como substituto, pois não representa o Simplifica 3D. A conversão generativa LiteRT oficial exige toolchain Linux e não está disponível nesta estação Windows.

## Artefato e rollback

`ai:create-runtime-manifest` aceita somente um `.litertlm` local e exige versão, origem oficial e revisão imutável; ele calcula SHA-256 e gera `generated/ai-runtime-manifest.json`. Enquanto isso não ocorrer, o catálogo atual permanece com o modelo legado e os modos `legacy`/`disabled` continuam sendo o rollback.

## UseCases

- Pedidos: já integra UI e UseCases compartilhados.
- Estoque, Caixa, Produção: possuem contratos de UseCase e idempotência persistente, mas os handlers manuais ainda não delegam integralmente para eles.
- Handlers diretos restantes: `InventoryService.applyDiff`/`registerManualOutput`, `adicionarMovimentoCaixa`/`fecharSessaoCaixaBasica`, `confirmarLiberacaoProducao` e mudanças diretas de tarefa de produção.
- WRITE exposto ao modelo: **0**.

## Dataset

- Casos: 560; inválidos: 0; duplicados: 0.
- SHA-256 do conjunto: `a55259a2a6808f87b20734aa1b6924efaa07ded41ee428bb165c14363d9a2cbf`.
- Fila humana: `review.v1.jsonl`, com 560 casos pendentes.
- Agrupamento semântico determinístico: 65 grupos.
- Congelamento: bloqueado por design até todos os casos serem aprovados e cada grupo semântico ficar em apenas um split.
- Fine-tuning: não iniciado.

## Próximo passo necessário

Aceitar a licença do checkpoint FunctionGemma oficial na conta Hugging Face usada para este computador e disponibilizar o snapshot oficial. Depois, executar a conversão em ambiente Linux compatível, gerar o manifest assinado por hash, instalar pelo `ModelArtifactManager` e realizar os 10–20 smokes no Zenfone antes do baseline de 560 casos.
