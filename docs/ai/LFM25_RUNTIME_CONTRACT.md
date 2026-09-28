# LFM2.5 runtime contract — Lote 5

## Pin oficial

- Repositório: `LiquidAI/LFM2.5-1.2B-Instruct-GGUF`
- Revisão: `8ed288026e23958ad9dfa92d53ed773a8eee7125`
- Arquivo: `LFM2.5-1.2B-Instruct-QAD-Q4_0.gguf`
- Tamanho: 695.755.488 bytes
- SHA-256: `bb741ebb106d543e9de114b843a3d3d73d51c74b5801e69da2abde821a0cb3e1`
- Licença: `LFM1.0`
- Runtime: llama.cpp vendorizado, commit `c060ca974c773c7c3d17fd1b66dc9d312bc292c0`.

O runtime já reconhece a arquitetura LFM2 e usa o chat template transportado nos metadados do GGUF através de `llama_model_chat_template` e `llama_chat_apply_template`; não há template manual no app.

## Contrato de segurança

- Provider: `SimplificaLfmIntent.LfmIntentProvider`.
- Papel: interpretar linguagem e retornar intent canônica em conjunto fechado.
- Não cria ActionPlan, não chama ERP/Supabase, não executa tools e `writeExposed` permanece `0`.
- IDs de modelo são descartados. Campos financeiros inferidos pelo modelo são descartados sem fonte `USER`, `ERP_DATABASE`, `CURRENT_CALCULATION` ou `WORKFLOW`.
- Carregamento é lazy; estados expostos: `NOT_INSTALLED`, `INSTALLED`, `LOADING`, `READY`, `FAILED`.
- Em falha ou modelo ausente, o roteamento existente continua sem depender do LFM.

## Instalação e armazenamento

`SimplificaLocalAiPlugin` é o instalador já existente: recebe um artefato explicitamente fornecido, copia para `.part`, confere bytes/SHA-256 e aplica rename atômico no armazenamento privado em `files/models/lfm2/`. Não há download no boot nem segundo downloader.

## Resultado do primeiro health

No ASUS_I005DA (Android 13), o artefato foi importado e verificado. O modelo carregou com backend `armv8.2+dotprod`; load 855–982 ms e warmup 58–65 ms. O processo com LFM carregado apresentou PSS total de 1.662.748 KB; LFM e Needle não devem permanecer residentes na arquitetura futura sem uma política explícita de alternância/unload.

O GGUF gerou texto, mas não produziu o JSON curto exigido pelo provider no smoke. Portanto o contrato de geração estruturada ainda não é aprovado e o LFM não participa de roteamento.
