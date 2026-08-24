# Marco 2 — estado verificável

## A. Integração de domínio

`PreparedWriteUseCase` agora aceita `PersistentIdempotencyStore`; o armazenamento persistente retorna o resultado já concluído após recriar a instância do UseCase. Os contratos continuam a exigir permissão e `confirmed=true` antes de qualquer `commit`.

Pedidos permanecem o único domínio já ligado de ponta a ponta à UI pelos UseCases compartilhados. Estoque, caixa e produção têm contratos de composição, mas seus handlers de UI ainda não delegam aos novos UseCases. Não foram marcados READY e nenhum WRITE foi exposto ao modelo.

## B. Runtime FunctionGemma

O APK usa LiteRT-LM 0.15.0 e o Zenfone conectado (`ASUS_I005DA`, `arm64-v8a`) possui somente `gemma-4-e2b-it` no diretório privado do aplicativo. Não há artefato FunctionGemma próprio instalado.

O FunctionGemma base oficial requer aceite da licença Gemma. O artefato LiteRT publicamente identificado é um fine-tune de Mobile Actions, não treinado para Simplifica 3D; ele não será usado como substituto. Para integrar o runtime real são necessários: artefato `.litertlm` do base ou do fine-tune Simplifica, revisão/licença aceita, URL imutável, versão, tamanho e SHA-256. Sem esses elementos, download, warmup e benchmark seriam falsos.

## C. Dataset

`evaluation.v1.jsonl` passou na validação estrutural: 560 casos, zero IDs duplicados e zero casos inválidos. SHA-256 atual: `a55259a2a6808f87b20734aa1b6924efaa07ded41ee428bb165c14363d9a2cbf`.

Divisão atual, ainda provisória: 392 `train_candidate`, 84 `validation`, 84 `test_frozen`. O arquivo `DATASET_REVIEW.md` registra que a revisão humana é obrigatória. Não foram criados conjuntos de treino definitivos nem iniciado fine-tuning.

## D. Baseline e shadow no dispositivo

O comando `npm.cmd run ai:baseline -- --predictions <arquivo.jsonl>` só aceita previsões completas de um runtime real e grava métricas de seleção, disposição, chamadas negativas, schema, WRITE inseguro e latência. Ainda não foi executado porque não há FunctionGemma base/fine-tuned no aparelho.

## Próximo gate

1. Aceitar a licença e fornecer/gerar o artefato FunctionGemma correto, com SHA-256 verificável.
2. Conectar os handlers manuais de estoque, caixa e produção aos UseCases e executar testes de paridade com persistência local/sincronização.
3. Revisar humanamente cada caso, aprovar os splits e congelar o teste final.
4. Instalar no Zenfone, fazer warmup e produzir as 560 predições reais antes de qualquer fine-tuning.
