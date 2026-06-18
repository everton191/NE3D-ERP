# Tela Premium de Planos

## Fase 5B

Data: 2026-05-29

A tela de planos consome `getPlanAccessState()` como fonte central de estado. A camada visual nao altera webhook, secrets, Edge Functions nem autoridade remota de cobranca.

## Matriz comercial ativa

O card Start continua visivel para comparacao, mas seu CTA depende de `START_PLAN_ENABLED`.

- Com `START_PLAN_ENABLED=true`: badge `MAIS POPULAR`, CTA `Assinar Start`.
- O fallback `START_PLAN_ENABLED=false` permanece apenas para desligamento emergencial.
- O card nao pode enviar preco, ID de plano ou ativacao local ao frontend.
- A identidade visual segue Free verde, Start roxo e Pro preto/dourado.

## Fase 5C.1

Com os IDs remotos configurados no backend, a UI oferece os tres planos comerciais:

- Free ativo.
- Start ativo com assinatura recorrente.
- Pro ativo.
- Nenhum ID de plano foi colocado em `app.js`, `index.html` ou `sw.js`.
- A ativacao efetiva continua dependendo de webhook assinado e pagamento confirmado.

## Estados visuais

### Free

- Mostra `Plano atual: Gratis`.
- Exibe limites e bloqueios explicitamente.
- Loja Online fica em preview: pode editar e visualizar, mas nao cadastra produtos da loja.
- Nao publica vitrine, nao gera link publico e nao permite compartilhar loja.
- Permite contratar Start ou Pro.
- Nao oferece cancelamento, downgrade ou retorno para Free.

### Start ativo

- Mostra badge `MAIS POPULAR`.
- Exibe CTA `Assinar Start`.
- Lista os recursos do Start, incluindo ate 100 produtos da loja.
- Abre a assinatura recorrente pelo backend e aguarda confirmacao do webhook.
- Usuarios Start legados continuam reconhecidos sem perder acesso.

### Pro ativo

- O CTA `Assinar Pro` abre confirmacao antes do redirecionamento seguro ao Mercado Pago.
- O plano so muda depois de confirmacao real processada pelo webhook.

### Cancelamento agendado

- Mantem Pro ou Start legado ate `accessEndsAt`.
- Exibe a data final claramente.
- Permite reativar renovacao somente quando `canReactivateRenewal` estiver ativo.

### Pagamento pendente real

- So aparece quando `shouldShowPendingPayment = true`.
- Exige transacao remota associada.
- Checkout aberto isoladamente nao vira pending real.

### Checkout abandonado

- O app mantem o plano atual.
- Um checkout local expirado mostra aviso discreto de pagamento nao concluido.
- A interface nao congela e nao remove acesso atual.

## Tema claro e escuro

Os cards preservam identidade visual controlada:

- Free: verde;
- Start: roxo;
- Pro: preto com dourado.

No tema claro, os cards mantem fundos escuros de produto para garantir contraste. Alertas, textos, badges e CTAs usam tokens do Design System.

## Responsividade

O workspace possui largura maxima de `1280px`.

O grid usa:

```css
repeat(auto-fit, minmax(min(100%, 300px), 1fr))
```

Comportamento:

- mobile: uma coluna;
- tablet: adaptacao automatica;
- desktop: ate tres cards equilibrados;
- ultrawide: largura limitada para evitar cards esticados.

## Diagnosticos seguros

Eventos registrados:

- `plans_screen_opened`;
- `plan_card_viewed`;
- `plan_checkout_clicked`;
- `plan_start_unavailable_clicked`;
- `subscription_cancel_requested`;
- `subscription_cancel_at_period_end`;
- `subscription_reactivated`;
- `payment_pending_real_viewed`.

Nenhum evento salva token, segredo, autorizacao, cartao ou payload de pagamento.

## Arquivos alterados

- `app.js`;
- `style.css`;
- `index.html`;
- `sw.js`;
- `src/services/diagnosticsService.js`;
- `scripts/test-plans-ui.js`;
- `scripts/test-plans-subscription-rules.js`;
- `scripts/test-restructuring-checks.js`;
- `package.json`;
- documentacao relacionada.
