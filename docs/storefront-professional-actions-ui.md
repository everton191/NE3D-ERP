# Loja publica oficial e acoes profissionais

## Escopo

Checkpoint local de 2026-06-01 para retirar a apresentacao beta da Loja Online e
melhorar a densidade visual do editor sem alterar regras comerciais, backend,
checkout, planos ou publicacao remota.

## Alteracoes

- A vitrine passa a ser apresentada como loja publica oficial.
- A consulta beta legada nao roda mais durante `renderApp()`.
- Free continua podendo preparar e visualizar a loja sem produtos publicos,
  link ou compartilhamento.
- Start e Pro preservam as permissoes atuais de publicacao.
- Avisos de demonstracao usam a linguagem `Modelos para comecar`.
- Termos tecnicos visiveis foram trocados por mensagens simples em portugues.
- Nome interno de teste nao aparece no titulo publico, metadados ou banner.
- Acoes raras do editor e dos produtos ficam em menus contextuais.
- Cards administrativos usam linha compacta no desktop e composicao contida no
  mobile.
- O editor de produtos quebra o aviso e o cabecalho de salvamento em telas de
  `320px`, sem criar overflow horizontal.
- O cache local avanca para `simplifica-3d-v136-storefront-public-ui-20260601`.

## Validacao

Executar:

```bash
npm run test:storefront-public-ui
npm run test:storefront-guided-editor
npm run test:storefront-final-polish
npm run test:ui-overflow
npm run test:storefront-mobile-resilience
npm run build:web
git diff --check
```

## Fora de escopo

- Nao publica PWA ou APK remotamente.
- Nao altera Supabase, RLS, cobranca ou Mercado Pago.
- Nao remove os helpers beta legados; eles permanecem apenas como compatibilidade
  temporaria e nao fazem mais parte do render principal.
