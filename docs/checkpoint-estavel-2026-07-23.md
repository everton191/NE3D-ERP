# Checkpoint estável antes das melhorias

Data: 2026-07-23

## Estado preservado

- Branch: `codex/ui-v3-screen-migration-stage3`
- Commit: `6d6581c98a386b06cbe5350e6e285910911dc446`
- Release descrita pelo commit: `1.0.17`
- Árvore Git rastreada limpa antes da criação do checkpoint.
- `output/` e `tmp/` permaneceram locais e não fazem parte do ponto de restauração.

## Ponto de restauração local

Diretório ignorado pelo Git:

`backups/stable-before-improvements-20260723-115324/`

Conteúdo:

- bundle Git completo e verificado;
- APK local disponível no checkpoint;
- `downloads/update.json` correspondente;
- manifesto de restauração e hashes SHA-256.

## Limpeza realizada

Os snapshots locais antigos de código e APK, datados de maio e junho de 2026,
foram enviados para a Lixeira do Windows após a validação do novo bundle.

Foi preservado separadamente o backup lógico válido:

`backups/storefront-phase37/main-qsufnnivlgdidmjuaprb-2026-05-22T18-17-39-590Z-logical/`

Esse backup contém dados e não é substituído pelo bundle do repositório.

## Limites deste checkpoint

- Não houve publicação, push ou deploy.
- O checkpoint não cria um backup novo do banco Supabase.
- O APK foi copiado e conferido por hash, mas não foi reinstalado em aparelho.
- A restauração completa deve ser testada em um diretório separado antes de substituir o projeto ativo.
