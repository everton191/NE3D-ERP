# Lote 5 — LFM2.5 como interpretador de intent

## Estado

Classificação: **A — LFM_NOT_USEFUL neste runtime/contrato atual**.

O Lote 5 preserva Needle em shadow e não altera `WRITE`, ActionPlan, UI, calculadora, Supabase, carrossel ou `apps/opticore`.

## Implementação preparada

O provider em shadow reduz o conjunto de intents por domínio/contexto, limita a oito opções e valida cada retorno no `IntentRegistry`. Ele nunca aceita intent nova, IDs ou valor financeiro inferido. O provider foi adicionado ao carregador lazy, mas não foi conectado à decisão atual.

## Evidência real no ASUS_I005DA

- Download oficial verificado: PASS, 695.755.488 bytes e SHA-256 pinado.
- Importação privada com `.part` + SHA-256 + rename atômico: PASS.
- Load: PASS.
- Health/chat template do GGUF: PASS.
- Smoke estruturado: **0/5**.

Os cinco casos (`abre estoque`, `qnt tem de pla preto`, pedido, cálculo e compartilhamento contextual) chegaram ao runtime e receberam geração curta, mas todos falharam no parse estruturado: o modelo retornou `allowedIntents` em vez de JSON com `intentId`. A latência ficou entre 2.169 e 3.087 ms; a geração não é usável como classificador nesse contrato.

## Corpus e comparação

O corpus 80/80 **não foi executado**. A condição para executá-lo era um health/smoke funcional; rodá-lo após 0/5 mascararia uma falha estrutural como métrica de intent. Não houve tuning por holdout e não houve novo sublote.

Comparação preservada:

| Provider | Holdout intent | Holdout tool |
| --- | ---: | ---: |
| Needle pós-tuning | 46,67% | 60,00% |
| LFM2.5 QAD-Q4_0 | Não aplicável: 0/5 no contrato estruturado |
| Híbrido | Não aplicável: LFM não promovido para simulação |

## Próximo passo

Não baixar Q4_K_M automaticamente e não iniciar tuning infinito. Antes de uma nova avaliação, investigar uma integração de mensagens system/user com o template oficial exposto pelo GGUF (ou suporte a grammar JSON no backend) e provar 5/5 no smoke. Só então repetir exatamente o corpus 65/15 em shadow.
