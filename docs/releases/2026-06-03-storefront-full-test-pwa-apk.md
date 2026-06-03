# Storefront full test - PWA/APK - 2026-06-03

## Objetivo

Atualizar Web/PWA/APK para homologacao real da Loja Online e deixar todas as funcoes da vitrine visiveis durante os testes.

## O que foi liberado

- Publicacao da loja.
- Compartilhamento/link da vitrine.
- Produtos da loja.
- Leads/contato da vitrine.
- QR/link.
- Temas e personalizacao visual da loja.
- Metricas/recursos visuais da loja para teste.

Essa liberacao usa `STOREFRONT_REAL_TEST_FULL_ACCESS=true` em `app.js`.

## O que nao foi alterado

- `START_PLAN_ENABLED` permanece `false`.
- Checkout Start continua bloqueado.
- Mercado Pago nao foi alterado.
- Webhook nao foi alterado.
- Supabase/migrations nao foram alterados.
- Regras comerciais dos planos continuam preservadas.

## Versionamento

- Web/PWA cache-bust: `1.0.37-rc-storefront-full-test-20260603`.
- Service Worker cache: `simplifica-3d-v143-storefront-full-test-20260603`.
- APK/update manifest: `version=1.0.19-rc`, `versionCode=18`.

## Artefatos gerados

- `downloads/NE3D-ERP.apk`
- `downloads/NE3D-ERP-android-users17-debug.apk`
- `downloads/update.json`
- `android/app/build/outputs/apk/debug/app-debug.apk`

## Validacoes executadas

```txt
node --check app.js
node --check sw.js
npm.cmd run test:storefront-guided-editor
npm.cmd run test:storefront-publish-validation
npm.cmd run test:storefront-public-ui
npm.cmd run test:storefront-light-theme-stability
npm.cmd run test:storefront-pwa-upgrade
npm.cmd run test:storefront-offline-recovery
npm.cmd run test:storefront-og-meta
npm.cmd run test:storefront-premium-7c3
npm.cmd run test:plans
npm.cmd run test:start-plan
npm.cmd run test:checkout-states
npm.cmd run test:plans-saas-structure
npm.cmd run test:billing-webhook
npm.cmd run test:design-system-v2
npm.cmd run test:project-saneamento
npm.cmd run test:restructuring-checks
npm.cmd run test:ui-overflow
npm.cmd run build:web
npm.cmd run android:apk
git diff --check
```

## Validacao manual pendente

- Instalar APK em Android real.
- Abrir PWA instalada e confirmar atualizacao do cache.
- Logar com conta real de teste.
- Publicar loja.
- Compartilhar link.
- Criar/editar produto.
- Conferir loja publica fora da sessao admin.
- Testar WhatsApp e carrinho.
