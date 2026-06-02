# Tema claro suave sem gradientes - 2026-06-01

## Objetivo

Reduzir o brilho excessivo do tema claro, remover gradientes decorativos das superficies comuns e preservar nitidez de imagens reais, especialmente banners da Loja Online.

## Tokens e superficies ajustados

- `body.theme-light` em `style.css` passa a usar fundo global `#f2f5f4`, pagina `#f4f6f5`, cards `#fcfdfc`, inputs `#f8faf9` e bordas `#dfe6e4/#d5dedb`.
- `themes/light/tokens.css` foi alinhado com a mesma paleta para manter o design system consistente.
- `aplicarPersonalizacao()` em `app.js` deixa de gerar `linear-gradient` para `--glass-bg`, `--card-gradient` e `--app-body-background` quando o tema esta claro.
- Manifest e meta theme-color foram suavizados para `#f2f5f4`.

## Gradientes e overlays removidos no tema claro

- Fundo global do ERP e PWA.
- Cards, modais, paineis, widgets e grupos visuais compartilhados.
- Sidebar/menu lateral em tema claro.
- Blocos de pedidos, calculadora, planos, editor e admin da loja.
- Storefront V2 em tema claro, incluindo header, cards, editor, preview e superficies do painel.
- Overlay do banner da loja com imagem real.

## Banner da loja

Quando o banner tem imagem:

- `::after` fica transparente e com `opacity:0`.
- A imagem preserva `filter:none`, `opacity:1` e `mix-blend-mode:normal`.
- O fundo do container nao força preto ou branco atras da foto.
- A protecao de leitura fica apenas na caixa local do texto, sem blur e sem cobrir a imagem inteira.

Quando nao ha imagem:

- O fallback fica solido e suave (`#f8faf9`), sem gradiente.

## PWA e APK

- Cache PWA local atualizado para `simplifica-3d-v138-soft-light-no-gradient-20260601`.
- Cache-bust web atualizado para `1.0.32-rc-soft-light-no-gradient-20260601`.
- Nenhuma publicacao foi feita.
- O APK usa a camada Web corrigida em uma futura recompilacao, mas nao foi recompilado nesta etapa.

## Fallbacks preservados

- Fallbacks tecnicos de Storefront/editor continuam no codigo para cache antigo, PWA e rollback.
- Eles nao devem aparecer visualmente no fluxo principal.

## Validacoes executadas

- `node --check app.js`
- `node --check scripts/test-storefront-light-theme-stability.js`
- `npm run test:storefront-light-theme-stability`
- `npm run test:storefront-public-ui`
- `npm run test:storefront-mobile-actions`
- `npm run test:ui-theme-consistency`
- `npm run test:restructuring-checks`
- `npm run test:ui-overflow`
- `npm run test:ui-responsive-balance`
- `npm run test:storefront-pwa-upgrade`
- `npm run test:storefront-premium-7c3`
- `npm run test:storefront-guided-editor`
- `npm run test:storefront-og-meta`
- `npm run test:design-system-v2`
- `npm run build:web`
- `git diff --check`
