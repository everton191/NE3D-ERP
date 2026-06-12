# Checkpoint local - Loja Publica V3 reconstruida

Data: 2026-06-11

## Objetivo

Interromper os remendos visuais sobre a Loja V2 e reconstruir a camada publica da Loja V3 com raiz, componentes e CSS isolados.

## Checkpoint

Este checkpoint nao cria commit, push ou deploy. Ele registra o estado local apos a reconstrucao inicial da interface publica.

## Preservado

- Dados existentes da loja.
- Rotas publicas e slugs.
- Produtos, categorias, contatos e banner.
- Regras comerciais e limites de planos.
- Carrinho/orcamento e fluxo WhatsApp existente.
- Editor guiado e funcoes de negocio do editor.
- Supabase, banco, migrations, Mercado Pago e checkout.

## Substituido no render publico

- Shell visual antigo da loja publica.
- Header antigo da vitrine.
- Hero antigo.
- Cards antigos de categorias.
- Cards antigos de produto.
- Estados vazios antigos no caminho principal publico.

## Nova arquitetura visual

- Raiz publica: `.storefront-v3`.
- Host publico: `.storefront-v3-host`.
- CSS isolado: `storefront-v3.css`.
- Componentes novos:
  - `.storefront-v3__header`
  - `.storefront-v3__hero`
  - `.storefront-v3__benefits`
  - `.storefront-v3__category-card`
  - `.storefront-v3__product-card`
  - `.storefront-v3__empty-state`
  - `.storefront-v3__bottom-nav`

## Evidencias visuais

- Desktop: `artifacts/storefront-v3-rebuild-desktop-1366-20260611.png`
- Mobile: `artifacts/storefront-v3-rebuild-mobile-390-20260611.png`

## Validacoes executadas

- `node --check app.js`
- `npm run test:storefront-v3-approved`
- `npm run test:storefront-public-ui`
- `npm run test:storefront-light-theme-stability`
- `npm run test:storefront-guided-editor`
- `npm run test:ui-overflow`
- `npm run test:ui-theme-consistency`
- `npm run build:web`
- `git diff --check`
- `git diff --cached --check`

## Diferencas restantes contra os mockups

- Os mockups usam catalogo demonstrativo com produtos preenchidos; a loja publica real nao fabrica produtos falsos quando esta vazia.
- As imagens reais dependem do banner/produtos cadastrados pelo usuario. Sem dados, a V3 usa placeholder visual premium apenas como imagem estrutural.
- A pagina de carrinho/orcamento continua reaproveitando a logica existente; a reconstrucao completa do carrinho visual ainda deve ser tratada em etapa propria.
