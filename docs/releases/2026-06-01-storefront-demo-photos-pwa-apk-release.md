# Release 1.0.19-rc - exemplos fotograficos, contencao da loja e PWA/APK

Data: 2026-06-01

## Publicacao

- Web/PWA: `https://erpne3d.vercel.app`
- Deploy Vercel: `dpl_FxANdRGTvwH9eTDZ7EtDnLbngV4b`
- APK: `1.0.19-rc`
- Android `versionCode`: `18`
- Manifesto publico: `https://raw.githubusercontent.com/everton191/NE3D-ERP.apk/main/update.json`
- Cache PWA: `simplifica-3d-v135-storefront-demo-photos-20260601`

## Correcoes aplicadas

- O editor guiado agora usa exemplos fotograficos locais em `assets/storefront-demo/`.
- O catalogo de demonstracao fica restrito ao editor administrativo e nao vaza para a loja publica.
- O modo administrativo prioriza o fallback local atualizado antes de um cache publico antigo.
- A vitrine, o canvas do editor e a barra de acoes receberam contencao responsiva contra overflow.
- A faixa intermediaria entre `861px` e `1320px` usa sidebar e acoes compactas.
- Web/PWA e APK foram versionados juntos para impedir mistura de cache antigo com arquivos novos.

## Validacao automatizada

- `node --check app.js`
- `npm run test:storefront-demo-products`
- `npm run test:storefront-guided-editor`
- `npm run test:storefront-light-theme-stability`
- `npm run test:storefront-theme-v2`
- `npm run test:theme-isolation`
- `npm run test:ui-overflow`
- `npm run test:ui-responsive-balance`
- `npm run test:mobile-visual-stability`
- `npm run test:storefront-mobile-resilience`
- `npm run test:storefront-desktop-upscale`
- `npm run test:project-saneamento`
- `npm run test:storefront-pwa-upgrade`
- `npm run test:design-system-v2`
- `npm run test:restructuring-checks`
- `npm run test:plans`
- `npm run test:plans-ui`
- `npm run test:plans-saas-structure`
- `npm run test:start-plan`
- `npm run build:web`
- `git diff --check`

## Validacao visual

- Editor administrativo verificado em `320`, `360`, `390`, `412`, `768`, `1024`, `1280`, `1366`, `1440` e `1920px`.
- Nenhum overflow horizontal foi encontrado nesses breakpoints.
- A barra inferior mobile permaneceu ancorada na parte inferior da tela.
- Dashboard, Pedidos, Clientes, Estoque, Caixa, Relatorios, Loja Online, Producao e Calculadora foram auditados no desktop sem overflow horizontal.
- O dominio publicado respondeu com `app.js`, `sw.js` e fotos HTTP `200`.
- A tela inicial publicada abriu em tema claro e sem overflow horizontal.

## Rollback

- Tag anterior: `checkpoint-before-phase7d3-storefront-demo-photos-20260601`
- Para Android, o repositorio publico preserva historico do manifesto e do APK.
