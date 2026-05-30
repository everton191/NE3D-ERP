# Checklist release candidate - Fase 7A

Data: 2026-05-30

## Validado automaticamente

- Branch `codex/stable-premium-motion`.
- Ultimo checkpoint base `2b0f089`.
- Cache PWA atualizado para `simplifica-3d-v122-estavel-20260530-release-candidate`.
- Versao web/APK preparada: `1.0.17-rc`, versionCode `16`.
- Build web gerado em `dist/`.
- Deploy web/PWA publicado em `https://erpne3d.vercel.app`.
- Deploy Vercel `dpl_3MZxtgKZsmCCU5c8n7FBSoCJxJB6` ficou `READY`.
- Assets publicos principais retornaram HTTP 200.
- Rotas internas Google/IA retornaram HTTP 404.
- APK debug gerado em `downloads/NE3D-ERP.apk`.
- APK `versionCode=16` e `versionName=1.0.17-rc` validados por `aapt2`.
- Migrations auditadas sem `db push` geral.
- Arquivos antigos auditados e documentos historicos arquivados.
- Start permanece com `START_PLAN_ENABLED=false`.
- IA futura permanece desligada.
- Google futuro permanece desligado.

## Validado manualmente

- Smoke real em aparelho fisico: pendente nesta estacao.
- Instalacao APK em aparelho fisico: pendente nesta estacao.
- Validacao completa com login real: pendente nesta estacao.
- Smoke visual desktop amplo 1366/1440/1920: pendente manual.
- Smoke mobile fisico: pendente manual.

## Pendente manual

- Sandbox Start com token `TEST-` dedicado.
- Validar PWA instalado em Android fisico.
- Instalar APK `1.0.17-rc` em aparelho fisico.
- Validar vitrine publicada real sem alterar loja de cliente.

## Bloqueador para release final

- APK fisico ainda precisa ser instalado e validado.
- PWA fisico ainda precisa ser validado em aparelho real.
- Login real/sessao autenticada deve ser validado no ambiente publicado.

## Bloqueador apenas para Start

- Sandbox Start aprovado, recusado, pendente, abandono e cancelamento real controlado.
- `START_PLAN_ENABLED` deve continuar `false` ate esses testes.

## Rollback

- Reverter para tag `fase-5c1-start-pro-controlled-validation-20260530` se o release candidate apresentar regressao critica.
- Cache anterior: `simplifica-3d-v121-estavel-20260529-checkout-states-5c`.
