# Auditoria de arquivos antigos - Fase 7A

Data: 2026-05-30

Escopo: revisar pendencias antigas antes do release candidate sem apagar nada cegamente.

## Decisoes

| Arquivo | Origem | Referencias atuais | Uso real | Risco de remocao | Decisao |
| --- | --- | --- | --- | --- | --- |
| `scripts/test-storefront-production-controlled.js` | Validacao controlada da storefront em producao | `package.json` em `test:storefront-production-controlled` e docs de saneamento | Teste ativo para conferir tabelas, RLS, policies e loja interna inativa | Alto: remover quebra script versionado e reduz cobertura de producao | MANTER |
| `docs/archive/storefront-phase35-validation.md` | Relatorio historico da Fase 3.5 | Sem referencia runtime | Evidencia historica de validacao local da Storefront | Baixo | ARQUIVAR |
| `docs/archive/storefront-phase36-staging.md` | Relatorio historico da Fase 3.6 | Sem referencia runtime | Evidencia de staging Supabase | Baixo | ARQUIVAR |
| `docs/archive/storefront-phase37-production-controlled.md` | Relatorio historico da Fase 3.7 | Sem referencia runtime | Evidencia de aplicacao controlada em producao | Baixo | ARQUIVAR |
| `docs/archive/storefront-phase38-admin-panel.md` | Relatorio historico da Fase 3.8 | Sem referencia runtime | Evidencia do admin da loja atras de flag | Baixo | ARQUIVAR |
| `docs/archive/storefront-phase39-hardening-storage.md` | Relatorio historico da Fase 3.9 | Sem referencia runtime | Evidencia de hardening/storage/beta | Baixo | ARQUIVAR |

## Observacoes

- Os documentos antigos foram movidos para `docs/archive/`.
- O script de teste continua em `scripts/` porque ainda e chamado por `npm run test:storefront-production-controlled`.
- A alteracao local do script foi preservada porque amplia a busca da loja interna controlada para `ne3d-internal-test` ou `ne3d` inativa, reduzindo falso negativo sem alterar runtime.
- Nenhum arquivo foi removido definitivamente.
- Nenhum arquivo antigo foi incluido no runtime publico.
