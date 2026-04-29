# Relatorio de bugs - Simplifica 3D

Use este arquivo para registrar problemas que aparecerem no app, no site, no APK, no Supabase ou no Mercado Pago.
Ele ajuda o assistente a encontrar rapidamente o historico, os sintomas e os passos para reproduzir.

## Como registrar

Copie o bloco abaixo para cada novo problema:

```md
## BUG-0001 - Titulo curto

- Data:
- Versao do app:
- Ambiente: Web / APK Android / Supabase / Mercado Pago
- Usuario/plano:
- Tela:
- O que aconteceu:
- O que deveria acontecer:
- Passos para reproduzir:
- Mensagem de erro visivel:
- Logs/diagnostico:
- Status: aberto / em analise / corrigido / validado
- Correcao aplicada:
```

## Checklist rapido para investigar

- Conferir a versao em `APP_VERSION` e `downloads/update.json`.
- Conferir erros locais na tela `Bugs e sugestoes`.
- Conferir `auditLogs`, `securityLogs` e `diagnostics` no backup JSON.
- Conferir Supabase: `audit_logs`, `security_logs`, `payments`, `erp_payments`, `erp_webhook_events`.
- Conferir Mercado Pago: pagamento aprovado somente via webhook validado.
- Conferir se o APK instalado tem `versionCode` menor que o manifesto publico.

## Bugs conhecidos

Nenhum bug aberto nesta versao.

## Historico de validacao

### 2026-04-29 - SaaS Mercado Pago

- Build web executada com `npm.cmd run build:web`.
- Sintaxe validada com `node --check app.js` e `node --check dist\app.js`.
- Tela de planos validada em navegador local com Free, Pro e Premium.
- Tela Minha Assinatura validada em navegador local sem erro de console.
- APK gerado com fluxo Android.
