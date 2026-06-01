# Fase 7D - Plano de migracao de tema PWA e APK

## Estado registrado

- Cache PWA anterior: `simplifica-3d-v130-estavel-20260531-storefront-light-theme`
- Cache PWA desta fundacao: `simplifica-3d-v131-design-system-v2-foundation-20260531`
- APK atual: `1.0.18-rc`
- Android `versionCode`: `17`
- Manifest PWA: fundo e tema base `#ffffff`

## Lotes Web 0 a 3

- Carregar `themeAuthorityV2.js` antes de `app.js`.
- Aplicar atributos ERP e Storefront no `<head>`.
- Preservar fallback claro quando `matchMedia` nao estiver disponivel.
- Guardar preferencia `light`, `system` ou `dark`, sem perder compatibilidade
  com `auto` e `simplifica3d_store_theme`.
- Copiar e precachear `themes/base/design-system-v2.css`.

## Aprovacao PWA futura

Somente depois da revisao visual Web:

1. validar instalacao limpa;
2. validar atualizacao sobre cache antigo;
3. validar modo offline basico;
4. validar `theme-color` dinamico;
5. validar ausencia de loop de atualizacao;
6. criar `test:pwa-cache-integrity`.

## Aprovacao APK futura

Somente depois da aprovacao Web e PWA:

1. ajustar barras nativas e splash Android;
2. atualizar `versionName`, `versionCode` e `downloads/update.json`;
3. gerar APK com ambiente Java configurado;
4. validar instalacao limpa e sobreposicao;
5. executar smoke em aparelho real;
6. criar `test:apk-webview-smoke`.

## Risco Android conhecido

`MainActivity.java` e `styles.xml` ainda usam `#02080D` nas barras e no fundo
nativo. Esses arquivos nao sao alterados nos lotes 0 a 3 para evitar promover
mudanca Android antes da aprovacao visual Web/PWA.
