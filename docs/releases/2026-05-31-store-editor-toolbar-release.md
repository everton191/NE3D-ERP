# Release 1.0.18-rc - editor guiado e publicacao PWA/APK

Data: 2026-05-31

## Escopo

- toolbar desktop unica no editor guiado da Loja Online;
- remocao da barra contextual duplicada e do rodape legado;
- botao flutuante `Editar loja` separado do carrinho no mobile;
- bottom sheet mobile dentro da viewport;
- preview imediato de textos controlados;
- limites visuais de texto para identidade, banner e produtos;
- limites da vitrine centralizados em `getPlanLimits()`, sem alterar a regra comercial.

## Planos preservados

- Gratis: edita e visualiza preview, sem produtos publicados e sem link publico;
- Start: ate `100` produtos na vitrine;
- Pro: produtos da vitrine ilimitados;
- `START_PLAN_ENABLED=false` permanece preservado.

## PWA

- dominio: `https://erpne3d.vercel.app`;
- deployment: `dpl_DX8YWBhpuDf22FX2faC3AEyfZfRn`;
- cache: `simplifica-3d-v128-estavel-20260531-store-editor-toolbar`;
- cache-bust web: `1.0.22-rc-store-editor-toolbar-20260531`;
- verificacao remota: `index.html` e `sw.js` responderam HTTP `200` com os marcadores esperados.

## APK

- pacote: `br.com.ne3d.erp`;
- versao: `1.0.18-rc`;
- versionCode: `17`;
- SHA-256: `8D0C06915B106ECFF514F1A1104941B3F1514027996DAAECB48623FBD71D4A8C`;
- manifesto publico: `https://raw.githubusercontent.com/everton191/NE3D-ERP.apk/main/update.json`;
- repositorio publico atualizado no commit `654fb4f`.

## Smoke visual

- mobile: `320px`, `360px`, `390px`, `412px`, `430px`;
- desktop: `1366px`, `1440px`, `1920px`;
- resultado: sem overflow horizontal, sem sobreposicao entre FAB e carrinho, uma toolbar desktop e nenhum rodape legado;
- console do navegador: sem erros ou avisos durante o smoke.

## Validacoes executadas

- `node --check app.js`;
- `npm run test:project-saneamento`;
- `npm run test:storefront-guided-editor`;
- `npm run test:storefront-mobile-real`;
- `npm run test:storefront-mobile-resilience`;
- `npm run test:storefront-desktop-upscale`;
- `npm run test:storefront-pwa-upgrade`;
- `npm run test:storefront-publish-validation`;
- `npm run test:ui-overflow`;
- `npm run test:ui-theme-consistency`;
- `npm run test:ui-responsive-balance`;
- `npm run test:start-plan`;
- `npm run test:plans`;
- `npm run test:plans-ui`;
- `npm run test:plans-saas-structure`;
- `npm run test:sensitive-action-guards`;
- `npm run test:restructuring-checks`;
- `npm run build:web`;
- `git diff --check`;
- `aapt2 dump badging downloads/NE3D-ERP.apk`.

## Pendencias manuais

- instalar o APK em aparelho fisico e validar atualizacao sobre versao anterior;
- abrir o PWA instalado em aparelho fisico e confirmar troca do service worker;
- concluir a matriz descartavel Free, Start, Pro e Super Admin antes de remover qualquer fallback do editor.
