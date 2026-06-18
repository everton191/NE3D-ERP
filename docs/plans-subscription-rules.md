# Regras de Planos e Assinatura

## Fase 5A

Esta fase corrige a regra de negocio dos planos antes de qualquer redesenho premium da tela. O objetivo e impedir downgrade indevido, estado pendente fantasma e acoes incompatíveis com o plano atual.

## Plano, assinatura e pagamento

`plan` e o plano de acesso efetivo do usuario. Ele define recursos liberados no ERP e na loja.

`subscriptionStatus` e o estado da assinatura. Ele pode indicar `active`, `canceling`, `expired`, `cancelled`, `past_due`, `trialing` ou `free`.

`paymentStatus` e o estado do pagamento. Ele nao deve ser confundido com checkout aberto.

`currentPeriodEnd` ou `expiresAt` define ate quando o acesso pago continua valido.

`cancelAtPeriodEnd` indica que a renovacao foi cancelada, mas o plano pago continua ativo ate o fim do periodo pago.

`pendingCheckout` representa tentativa temporaria de compra. Ele nao libera recurso, nao muda plano e deve expirar sem congelar a interface.

## Cancelamento ao fim do período

Quando um cliente Start ou Pro cancela a renovacao, o sistema marca `cancelAtPeriodEnd = true` e `subscriptionStatus = "canceling"`.

O acesso pago continua ate `currentPeriodEnd || expiresAt || planExpiresAt`.

Somente depois da data final o plano efetivo volta para `free`, com `cancelAtPeriodEnd = false`.

## Checkout abandonado

Abrir checkout nao altera `plan`, `subscriptionStatus` nem libera permissao.

O app registra apenas um pagamento local com status `checkout_opened` para diagnostico e retorno. Se o usuario abandonar, fechar ou deixar expirar, o plano anterior permanece.

Pagamento pendente visual so aparece quando existe uma transacao real associada, como `mercadoPagoPaymentId` ou `mercadoPagoSubscriptionId` com status `pending`.

## Ações permitidas por plano

Free:

- Mostra plano atual Free.
- Permite assinar Pro.
- Mostra Start como `Em breve`, sem checkout funcional.
- Nao mostra voltar para Free.
- Nao mostra cancelar Free.

Start ativo:

- Mostra plano atual.
- Permite upgrade para Pro.
- Permite cancelar renovacao.
- Nao volta para Free imediatamente ao cancelar.

Pro ativo:

- Mostra plano atual.
- Permite cancelar renovacao.
- Nao mostra downgrade imediato para Free.

Cancelamento agendado:

- Mostra a data de encerramento.
- Mantem recursos pagos ate o fim do periodo.
- Permite reativar renovacao no fluxo local.

## Helper central

A tela e as politicas devem depender de `getPlanAccessState(userSubscription)`, que consolida:

- `currentPlan`
- `effectivePlan`
- `subscriptionStatus`
- `paymentStatus`
- `isFree`
- `isPaid`
- `isActive`
- `isCancelingAtPeriodEnd`
- `canUpgrade`
- `canCancelRenewal`
- `canSubscribe`
- `shouldShowPendingPayment`
- `accessEndsAt`

Essa funcao evita logica de plano espalhada e reduz regressao futura.

## Diagnosticos preparados - Fase 6A

A Fase 6A adiciona eventos de diagnostico para planos, checkout e Mercado Pago sem alterar a regra de negocio corrigida na Fase 5A.

Eventos preparados:

- `checkout_opened`;
- `checkout_abandoned`;
- `checkout_returned_without_payment`;
- `payment_pending_real`;
- `payment_approved`;
- `payment_failed`;
- `subscription_created`;
- `subscription_cancel_requested`;
- `subscription_cancel_at_period_end`;
- `subscription_reactivated`;
- `subscription_expired`;
- `webhook_received`;
- `webhook_validation_failed`;
- `webhook_ignored_duplicate`;
- `webhook_plan_resolved`;
- `webhook_plan_resolution_failed`.

Esses eventos servem apenas para auditoria e relatorios. Eles nao mudam plano, nao criam pagamento pendente visual, nao liberam recurso e nao alteram `cancelAtPeriodEnd`.

## Validacao de eventos - Fase 6B

Os testes de diagnostico confirmam que a base aceita os eventos de planos, checkout e Mercado Pago preparados para a proxima fase.

Ainda nao foi alterado:

- webhook real do Mercado Pago;
- checkout;
- aprovacao/cancelamento real de pagamento;
- tela premium de planos.

## Fase 5A.1 - Webhook unico e ativacao segura

O endpoint `mercadopago-webhook` continua sendo o unico receptor de notificacoes Mercado Pago.

O cancelamento remoto foi alinhado com a regra da Fase 5A:

- nao aplica Free imediatamente;
- marca `cancel_at_period_end = true`;
- preserva acesso pago ate o fim do periodo conhecido;
- limpa a flag quando a autoridade remota expira o plano para Free.

A autoridade remota historica ainda aceita `premium` como alias interno do Pro. A matriz comercial publica usa somente `free`, `start` e `pro`, preservando os aliases antigos apenas para assinaturas existentes.

Detalhes operacionais: `docs/billing-mercado-pago.md`.

## Fase 5B - Tela premium e estados corretos

A tela premium usa `getPlanAccessState()` como contrato central. Free, Start e Pro ficam ativos; Start e Pro usam o webhook central e so liberam acesso depois da confirmacao remota.

O resumo do Free direciona para `Assinar Pro`. Pagamento pendente visual exige transacao real. Checkout aberto ou abandonado nao altera o plano efetivo e nao bloqueia a interface.

Cancelamento mostra a data final do acesso pago. Reativacao aparece somente quando `canReactivateRenewal = true`.

Detalhes visuais: `docs/plans-premium-ui.md`.

## Fase 5C - Retorno de checkout e sandbox controlado

O retorno do navegador diferencia `sucesso`, `pendente` e `falha`, mas continua sem autoridade para liberar plano. A URL apenas atualiza a tentativa local, limpa parametros transitorios, registra diagnostico e solicita sincronizacao da licenca.

`sucesso` e `pendente` aguardam webhook real. `falha` marca a tentativa local como `rejected`. Timeout ou substituicao de checkout registra `checkout_abandoned` e preserva o plano anterior.

O runner `scripts/mercadopago-sandbox-controlled.js` aceita somente token `TEST-` e exige confirmacao explicita para operacoes sandbox com rede. Detalhes: `docs/checkout-payment-states-sandbox.md`.

## Fase 5A.2 - autoridade Start

O Start possui autoridade propria no backend e fica ativo com `START_PLAN_ENABLED=true`.

- Slugs comerciais canonicos: `free`, `start`, `pro`.
- Start: R$ 29,90/mes, ate 300 produtos, publicacao da loja e link compartilhavel.
- Pro: R$ 59,90/mes, premium preservado, com compatibilidade backend para o slug legado `premium`.
- O frontend abre o checkout Start, mas nao grava pending real nem ativa acesso antes do webhook.
- `MERCADO_PAGO_START_PLAN_ID` deve existir apenas no backend.
- O webhook central resolve Start somente por allowlist de `preapproval_plan_id` e assinatura valida.
- Cancelamento Start deve marcar `cancelAtPeriodEnd=true` e manter acesso ate `currentPeriodEnd`.
- Start para Pro deve depender de webhook Pro aprovado.

## Fase 5C.1 - checkout controlado

Configuracao remota concluida para ativar Start comercialmente:

- IDs Start e Pro configurados como secrets backend.
- Migration Start aplicada isoladamente.
- Funcoes de billing republicadas.
- Smokes sem assinatura e com assinatura invalida recusaram corretamente.
- Retorno de checkout continua sem autoridade para liberar plano.
- Checkout aberto continua sem criar pending real.
- Sandbox real permanece pendente por ausencia de token `TEST-` local dedicado.
