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

## Historico de bugs corrigidos

### BUG-20260502-01 - Cadastro local nao sincronizava com Supabase apos confirmacao

- Data: 2026-05-02
- Versao do app: 2026.05.02-login-supabase
- Ambiente: Web / APK Android / Supabase Auth
- Tela: Login e Criar conta
- O que aconteceu: quando o Supabase exigia confirmacao de e-mail, o app criava o trial local, mas no login seguinte validava apenas a senha local e nao tentava autenticar novamente no Supabase.
- O que deveria acontecer: apos confirmar o e-mail e entrar com e-mail/senha, o app deve autenticar no Supabase e criar/sincronizar `clients`, `profiles` e `subscriptions`.
- Status: corrigido
- Correcao aplicada: usuario local agora guarda estado `supabasePending`; no login local o app tenta conectar/criar a conta online e sincroniza o cadastro SaaS quando recebe sessao Supabase.

### BUG-20260502-02 - Erro Google OAuth sem mensagem amigavel

- Data: 2026-05-02
- Versao do app: 2026.05.02-login-supabase
- Ambiente: Web / Supabase Auth Google
- Tela: Login com Google
- O que aconteceu: quando o provedor Google nao estava habilitado no Supabase, o usuario podia cair em erro tecnico do OAuth.
- O que deveria acontecer: o app deve registrar diagnostico e mostrar mensagem simples.
- Status: parcialmente corrigido
- Correcao aplicada: retorno OAuth com erro agora e tratado, a URL e limpa e o usuario recebe mensagem amigavel. A ativacao real do Google ainda depende do Client ID/Secret no painel Supabase/Google.

## Historico de validacao

### 2026-05-02 - Login Supabase e OAuth Google

- Backup limpo criado antes da alteracao.
- Sintaxe validada com `node --check app.js`.
- Diff validado com `git diff --check`.
- App local carregado em `http://127.0.0.1:4173/` sem erros de console.
- Erro OAuth simulado com `Unsupported provider` tratado no app sem erro de console.
- Endpoint publico de planos Supabase respondeu com sucesso.

### 2026-04-29 - SaaS Mercado Pago

- Build web executada com `npm.cmd run build:web`.
- Sintaxe validada com `node --check app.js` e `node --check dist\app.js`.
- Tela de planos validada em navegador local com Free, Pro e Premium.
- Tela Minha Assinatura validada em navegador local sem erro de console.
- APK gerado com fluxo Android.
