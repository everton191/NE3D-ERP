# Mapa do Simplifica 3D

Mapa curto de responsabilidades. O índice detalhado fica em `index/records.json`.

## Pedidos

- Aplicação e telas legadas: `app.js`, `index.html`, `style.css`.
- Fluxos determinísticos de IA: `src/ai-3d/`.
- Testes: `scripts/test-ai-order-*.js`, `scripts/test-order-*.js`.

## Caixa

- Aplicação e regras atuais: `app.js` e módulos relacionados identificados pelo índice.
- Bridge da IA: integração `Simplifica3dErpBridge` no runtime web.
- Testes financeiros: `scripts/test-erp-cash-fiscal-foundation.js`, `scripts/test-simplifica3d-financial-core.js`.

## Estoque

- Aplicação e UI atuais: `app.js`, `style.css`.
- Domínio/testes: `scripts/test-stock-*.js`, `scripts/test-order-stock-calculator-flow.js`.
- Consultas da IA passam por ferramentas determinísticas; nunca pelo modelo diretamente.

## Loja

- Módulos internos: `modules/storefront`, `modules/store-editor`, `modules/store-preview`.
- A Loja pertence ao Simplifica 3D; não importar packs Rural/Tec.

## Assistente

- Núcleo web existente: `src/assistant-core/`.
- Orquestração de domínio 3D: `src/ai-3d/`.
- Pack exclusivo: `apps/simplifica/assistant-pack/`.
- UI e integração: `app.js`, `src/assistant-core/ui-contracts/`.
- Documentação: `docs/assistant/` e `docs/AI_*.md`.

## Android

- Projeto Capacitor: `android/`.
- Plugin: `android/app/src/main/java/br/com/ne3d/erp/SimplificaLocalAiPlugin.kt`.
- LiteRT/modelos privados: `android/app/src/main/java/br/com/ne3d/erp/ai/`.
- Build: `npm run build`, `npx cap sync android`, `android/gradlew.bat assembleDebug`.

## Supabase

- Migrações e funções: `supabase/`.
- Operações remotas controladas: scripts `supabase:*` do `package.json`.

## Configuração e testes

- Configuração web/runtime: `src/config/`, `capacitor.config.json`, `android/variables.gradle`.
- Testes: `scripts/test-*.js`.
- Memória de desenvolvimento: `.projeto-ai/`.

<!-- AUTO-MODULES:START -->
## Inventário automático

- android: services: 1, tests: 3, files: 34
- assistant: components: 1, routes: 2, tests: 5, aiActions: 2, files: 34
- caixa: database: 2, tests: 2, files: 2
- config: aiActions: 1, files: 4
- core: screens: 18, components: 32, services: 15, database: 4, routes: 4, tests: 109, aiActions: 11, files: 218
- estoque: database: 1, tests: 4, files: 7
- pedidos: files: 2
- storefront: screens: 55, components: 1, services: 5, database: 7, routes: 1, tests: 41, aiActions: 2, files: 44
- supabase: database: 95, tests: 3
<!-- AUTO-MODULES:END -->
