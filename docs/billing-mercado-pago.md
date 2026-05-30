# Mercado Pago - Webhook unico e ativacao segura

## Fase 5A.1

Data: 2026-05-29

## Auditoria

O projeto possui um unico endpoint receptor:

```txt
supabase/functions/mercadopago-webhook
```

As outras Edge Functions possuem responsabilidades separadas:

- `mercadopago-create-payment`: cria preferencia de checkout;
- `mercadopago-create-subscription`: prepara assinatura recorrente;
- `mercadopago-cancel-subscription`: solicita cancelamento da renovacao;
- `mercadopago-webhook`: valida notificacao, consulta o recurso oficial e aplica o resultado.

Nao foi criado segundo webhook.

## Assinatura secreta

O webhook valida:

- `x-signature`;
- `x-request-id`;
- `data.id` recebido por query string;
- `ts`;
- `v1`;
- HMAC SHA-256;
- comparacao constante;
- tolerancia maxima padrao de cinco minutos.

O manifesto segue:

```txt
id:[data.id];request-id:[x-request-id];ts:[ts];
```

O segredo `MERCADOPAGO_WEBHOOK_SECRET` permanece apenas no backend.

## Idempotencia

A migration `20260529213000_billing_webhook_hardening.sql` cria `billing_webhook_events`.

Cada notificacao validada reserva uma chave unica antes de consultar ou aplicar o recurso Mercado Pago. Repeticoes retornam sucesso controlado com `duplicate=true` e registram `webhook_ignored_duplicate`.

Se o processamento falhar, o evento fica com status `error`, responde HTTP `500` e pode ser tentado novamente pelo provedor. Eventos ja processados ou ignorados continuam idempotentes.

A tabela:

- possui RLS;
- nao expoe grants para `anon` ou `authenticated`;
- e acessada apenas por `service_role`;
- armazena payload sanitizado.

## Cancelamento

Cancelar renovacao nao rebaixa para Free imediatamente.

O backend marca:

```txt
cancel_at_period_end = true
status_assinatura = canceling
```

O acesso pago continua ate o fim do periodo conhecido. Quando a autoridade existente expira o plano e muda `active_plan` para `free`, o trigger `s3d_clear_cancel_at_period_end_on_free` limpa a flag.

## Checkout aberto

Criar uma preferencia de checkout nao cria pagamento `pending` e nao altera o plano efetivo. O backend registra apenas auditoria `checkout aberto`.

Somente uma transacao real recebida pelo webhook pode inserir pagamento `pending`, aprovar acesso ou registrar falha.

## Slugs e limite conhecido

O banco remoto historico ainda usa `premium` como slug interno da autoridade paga. A camada backend aceita `pro`, `plus`, `premium`, `premium_monthly` e `pro_monthly` como aliases controlados para esse plano.

O plano `start` ainda nao possui tier remoto isolado. Para impedir liberacao acidental de recursos Pro, o backend bloqueia checkout Start com erro controlado:

```txt
Plano Start ainda não está habilitado no backend de cobrança
```

A futura migracao de tiers deve atualizar em conjunto constraints, RPCs de licenca, trigger de pagamentos e Edge Functions. Nao renomear slugs parcialmente.

## Segredos

Segredos esperados no Supabase:

```txt
MERCADOPAGO_ACCESS_TOKEN
MERCADOPAGO_WEBHOOK_SECRET
MERCADOPAGO_WEBHOOK_URL
MERCADOPAGO_WEBHOOK_TOLERANCE_MS
```

Nunca imprimir valores, commitar `.env` ou expor segredo no frontend.

## Fluxo remoto controlado

```bash
npm run supabase:billing-webhook:status
npm run supabase:billing-webhook:dry-run
$env:PRODUCTION_CONTROLLED_CONFIRM='true'; npm run supabase:billing-webhook:apply
$env:PRODUCTION_CONTROLLED_CONFIRM='true'; npm run supabase:billing-webhook:deploy-functions
npm run supabase:billing-webhook:validate
npm run supabase:billing-webhook:smoke
```

`apply` executa apenas a migration da Fase 5A.1. Nao usa `db push` amplo. O smoke envia fixture sem assinatura e espera HTTP `401`; ele nao cria cobranca.

## Aplicacao remota

Em 2026-05-29:

- a migration `20260529213000_billing_webhook_hardening.sql` foi aplicada individualmente no projeto `qsufnnivlgdidmjuaprb`;
- somente a versao `20260529213000` foi reparada como aplicada no historico remoto;
- as quatro Edge Functions Mercado Pago existentes foram publicadas;
- `supabase:billing-webhook:validate` retornou `billing_webhook_remote_validation_ok`;
- `supabase:billing-webhook:smoke` retornou `billing_webhook_unsigned_smoke_ok`.

## Referencia oficial

- Mercado Pago Developers: https://www.mercadopago.com.br/developers/pt/docs/checkout-pro/payment-notifications
