# Checkout e estados de pagamento - Fase 5C

Data: 2026-05-29

## Objetivo

A Fase 5C diferencia retorno de checkout, pagamento real e acesso efetivo. Nenhuma URL de retorno do navegador pode liberar plano.

## Fluxo seguro

```txt
abrir checkout
  -> registra checkout_opened local temporario
  -> nao altera plano
  -> nao cria pending real

retornar do Mercado Pago
  -> sucesso: aguarda webhook e sincroniza licenca
  -> pendente: mantem plano atual enquanto aguarda webhook
  -> falha/cancelamento: marca tentativa local como rejected
  -> remove parametros sensiveis e transitorios da URL

webhook validado
  -> consulta recurso oficial
  -> aplica payment status remoto
  -> somente approved pode liberar acesso
```

`checkout_opened` expira localmente em 30 minutos. A expiracao registra `checkout_abandoned` e preserva o plano anterior. Abrir novo checkout substitui a tentativa anterior de forma rastreavel.

Transacoes `pending` que ja possuem identificador remoto Mercado Pago nunca sao expiradas pela limpeza local. Elas continuam sob autoridade do webhook e da sincronizacao de licenca.

## Estados cobertos

| Cenario | Estado local/transitorio | Libera acesso |
| --- | --- | --- |
| Checkout aberto | `checkout_opened` | Nao |
| Aprovado por URL | continua aguardando webhook | Nao |
| Pendente por URL | continua aguardando webhook | Nao |
| Recusado/cancelado por URL | `rejected` | Nao |
| Abandono por timeout | `expired` | Nao |
| Webhook real aprovado | autoridade remota aplica `approved` | Sim |
| Cancelamento de renovacao | `cancelAtPeriodEnd=true` | Mantem acesso ate o fim do periodo |

## Runner sandbox controlado

O script `scripts/mercadopago-sandbox-controlled.js` prepara validacao guiada sem usar credencial produtiva.

Comandos sem rede:

```bash
npm run mercadopago:sandbox:status
npm run mercadopago:sandbox:fixtures
```

Operacoes sandbox com rede exigem:

```txt
MERCADOPAGO_SANDBOX_ACCESS_TOKEN=TEST-...
MERCADOPAGO_SANDBOX_CONTROLLED_CONFIRM=true
MERCADOPAGO_SANDBOX_TEST_PAYER_EMAIL=...
MERCADOPAGO_SANDBOX_PUBLIC_URL=...
MERCADOPAGO_SANDBOX_WEBHOOK_URL=...
```

Exemplos controlados:

```bash
node scripts/mercadopago-sandbox-controlled.js create-preference
node scripts/mercadopago-sandbox-controlled.js inspect-payment ID_SANDBOX
node scripts/mercadopago-sandbox-controlled.js cancel-preapproval ID_SANDBOX
```

O runner:

- rejeita token sem prefixo `TEST-`;
- nunca le `MERCADOPAGO_ACCESS_TOKEN`;
- nao imprime token;
- exige confirmacao explicita antes de criar preferencia ou cancelar preapproval;
- nao executa operacao de rede por padrao.

## Limite da validacao local

Nenhum teste sandbox real foi executado automaticamente nesta fase porque o ambiente local nao possui credencial sandbox dedicada nem conta compradora de teste configurada. O runner e a documentacao deixam o roteiro pronto para executar aprovado, recusado, pendente, abandono e cancelamento controlado sem cobranca produtiva.

## Referencia oficial

- Mercado Pago Developers: https://www.mercadopago.com.br/developers/pt/docs/checkout-pro/payment-notifications
