# Release candidate - 2026-05-30

## Identificacao

- Branch: `codex/stable-premium-motion`
- Versao web: `1.0.17-rc`
- VersionCode Android: `16`
- Cache PWA: `simplifica-3d-v122-estavel-20260530-release-candidate`
- Commit base: `2b0f089`
- Tag anterior: `fase-5c1-start-pro-controlled-validation-20260530`
- URL publicada: `https://erpne3d.vercel.app`
- Deploy Vercel: `dpl_3MZxtgKZsmCCU5c8n7FBSoCJxJB6`

## Escopo consolidado

- Storefront V2 e editor modular.
- Planos e assinatura com regras corrigidas.
- Checkout com retorno sem autoridade.
- Diagnosticos, feedback e relatorios Codex.
- IA futura estruturada e desligada.
- Google futuro estruturado e desligado.
- Start preparado no backend e bloqueado publicamente.

## Mercado Pago

- Webhook unico preservado.
- Pro contratavel preservado.
- Start reconhecido pelo backend, mas bloqueado por `START_PLAN_ENABLED=false`.
- Webhook separado Start: nao.
- Sandbox Start: pendente por ausencia de token local `TEST-` dedicado.

## Migrations

- Aplicadas remotamente: base SaaS/ERP, IA disabled, diagnosticos, Google disabled, billing webhook, Start authority.
- Pendentes/necessitam revisao: Storefront 3.8/3.9, caixa/fiscal e financeiro antigos.
- `supabase db push` geral nao foi executado.

## Build publico

- `dist/` deve conter apenas artefatos publicos necessarios.
- Segredos nao devem aparecer em `dist/`.
- Google interno e services de IA nao devem ser ativados nem exibidos ao usuario final.
- Rotas internas `/src/integrations/*` e `/src/services/ai*` retornam 404 em producao.
- Assets publicos validados via HTTP 200: `index.html`, `app.js`, `style.css`, `sw.js`, `diagnosticsService.js`, icones, `intro.mp4`, cover e modulos do editor.

## APK

- VersionName: `1.0.17-rc`
- VersionCode: `16`
- Arquivo: `downloads/NE3D-ERP.apk`
- Tamanho aproximado: `25.61 MB`
- `aapt2 dump badging` confirmou `versionCode='16'` e `versionName='1.0.17-rc'`.
- APK fisico: pendente ate instalacao em aparelho real.

## Validacao executada

- Suite automatizada da Fase 7A concluida.
- Build web concluido.
- Deploy Vercel producao concluido.
- HTTP smoke dos assets publicos concluido.
- Browser smoke publico carregou login sem erros de console no navegador integrado.
- APK debug gerado e copiado para `downloads/`.

## Gates pendentes

- Smoke fisico PWA.
- Smoke fisico APK.
- Validacao autenticada completa.
- Sandbox real Start com token `TEST-`.

## Rollback

- Usar tag `fase-5c1-start-pro-controlled-validation-20260530`.
- Se o problema for cache, limpar Service Worker/cache e voltar para build anterior.
