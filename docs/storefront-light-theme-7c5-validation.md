# Fase 7C.5 - Tema claro oficial da loja online

## Causa raiz

A Storefront V2 tinha uma camada visual clara, mas ainda dependia parcialmente
de `body.theme-light`, que pertence ao ERP. Ao mesmo tempo, lojas antigas
mantinham `theme_config.mode = "auto"` e podiam seguir o tema do sistema
operacional. Drawers globais, como carrinho e lead, ficavam fora do shell da
vitrine e herdavam tokens escuros do ERP.

## Correcao

- `light` e o fallback oficial da loja.
- `auto` legado e normalizado para `light`.
- `simplifica3d_store_theme` e a chave persistida unica.
- `data-store-theme` e aplicado antes do primeiro render.
- `applyStoreTheme()` sincroniza DOM, persistencia e `theme-color`.
- A Storefront V2 possui tokens claros e escuros isolados.
- Carrinho e modal de lead recebem tokens pelo atributo no elemento `html`.
- Manifest e cache PWA foram atualizados.

## Escopo preservado

Nao houve alteracao em planos, checkout, Mercado Pago, Supabase, RLS, webhook,
publicacao ou CRUD de produtos.

## Validacoes

Executadas com sucesso:

```bash
node --check app.js
npm run test:storefront-light-theme-stability
npm run test:storefront-guided-editor
npm run test:storefront-pwa-upgrade
npm run test:storefront-premium-7c3
npm run test:storefront-offline-recovery
npm run test:storefront-performance-lite
npm run test:ui-theme-consistency
npm run test:ui-overflow
npm run test:ui-responsive-balance
npm run test:ui-contrast
npm run test:mobile-visual-stability
npm run test:ultrawide-layout
npm run test:restructuring-checks
npm run build:web
npm run android:sync
git diff --check
```

O smoke lateral autenticado confirmou:

- `data-store-theme="light"` em `html`, `body` e shell publico;
- `theme-color=#ffffff`;
- preview claro sem overflow horizontal;
- carrinho claro e legivel em desktop;
- carrinho claro e contido em viewport estreita de `242px`;
- shell publico unico, sem duplicacao.

## APK e PWA

O manifest usa fundo claro e o cache PWA foi alterado para
`simplifica-3d-v130-estavel-20260531-storefront-light-theme`.

`npm run android:sync` concluiu e copiou o build web atualizado para o projeto
Capacitor. O `assembleDebug` nao foi concluido neste ambiente porque
`JAVA_HOME` nao esta configurado e o executavel `java` nao esta no `PATH`.

Antes de promover uma nova versao publica do APK:

- validar o tema em instalacao limpa;
- validar atualizacao sobre o APK anterior;
- conferir status bar e splash Android;
- executar o smoke da loja publica em ambiente com fallback SPA.

## Rollback

```txt
checkpoint-before-phase-7c5-storefront-light-theme-20260531
```
