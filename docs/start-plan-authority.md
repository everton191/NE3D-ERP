# Autoridade do Plano Start

## Estado da fase 5A.2

O plano Start tem autoridade preparada no backend, mas permanece comercialmente desativado por padrao.

Gates obrigatorios:

- `START_PLAN_ENABLED=false` por padrao.
- `MERCADO_PAGO_START_PLAN_ID` deve existir somente no backend.
- O frontend nao ativa Start sozinho.
- URL de retorno nao ativa plano.
- Checkout aberto nao altera plano nem cria pending fantasma.
- Webhook central `mercadopago-webhook` continua sendo o unico endpoint Mercado Pago.

## Slugs canonicos

- `free`: entrada gratuita.
- `start`: plano pago inicial, R$ 29,90/mes.
- `pro`: plano premium, R$ 59,90/mes.

O backend ainda preserva compatibilidade com o slug legado `premium` para assinaturas Pro ja existentes.

## Fluxos permitidos

- Free para Start.
- Free para Pro.
- Start para Pro.

Nao permitido nesta fase:

- Pro para Start imediato.
- Start ativado por retorno do checkout.
- Start ativado por estado local/pending.
- Webhook separado para Start.
- Cobranca produtiva automatica.

## Mercado Pago

O Start usa allowlist por `preapproval_plan_id`:

- `MERCADO_PAGO_START_PLAN_ID` resolve `start`.
- `MERCADO_PAGO_PRO_PLAN_ID` resolve `pro`/`premium`.

Plano desconhecido deve falhar fechado, diagnosticar `webhook_start_plan_resolution_failed` e nao ativar acesso.

## Sandbox

Use `scripts/start-plan-remote-controlled.js`:

- `status`
- `dry-run`
- `apply`
- `validate`
- `sandbox-create-plan`
- `sandbox-validate`
- `production-status`

Sandbox aceita somente token `TEST-`. Token `APP_USR-` e bloqueado nesta fase.

## Criterios para ativar

Somente alterar `START_PLAN_ENABLED=true` depois de validar:

- migration aplicada;
- `MERCADO_PAGO_START_PLAN_ID` configurado no backend;
- checkout Start criado em sandbox;
- aprovado, recusado, pending real, abandono e duplicidade testados;
- cancelamento ao fim do periodo validado;
- Start para Pro aprovado;
- `npm run test:start-plan` passando.
