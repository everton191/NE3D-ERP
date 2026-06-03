# Prontidao de publicacao - 2026-06-03

## Escopo validado

Esta rodada consolidou a bateria final de validacao visual e estrutural apos as correcoes de tema claro, loja, editor guiado, PWA/cache e textos publicos em portugues.

Nao foram alteradas regras de negocio, Supabase, Mercado Pago, checkout, planos, IA futura, integracoes Google futuras ou webhooks nesta rodada de prontidao.

## Estado do Web/PWA

Status: pronto para homologacao manual final.

Evidencias:

- `npm.cmd run build:web` passou e gerou `dist/`.
- `git diff --check` passou.
- `git diff --cached --check` passou antes dos commits anteriores da rodada.
- Cache bust web atualizado para `1.0.36-rc-store-editor-pt-cache-20260603`.
- Service Worker atualizado para `simplifica-3d-v142-store-editor-pt-cache-20260603`.
- Navegador local em `dist/` carregou sem erros de console no smoke final.
- App iniciou em `theme-light`, `viewport-desktop` e `desktop-mode`.
- Loja Online abriu sem overflow horizontal.
- Editor guiado abriu sem overflow horizontal.
- Banner da loja ficou sem filtro cinza: `filter: none`, `opacity: 1`.
- Textos visiveis do editor foram padronizados em portugues, trocando referencias de "Preview" por "Visualizacao".

## Bateria automatizada executada

Sintaxe e build:

- `node --check app.js`
- `node --check sw.js`
- `npm.cmd run build:web`
- `git diff --check`

Tema, UI, responsividade e loja:

- `npm.cmd run test:ui-theme-consistency`
- `npm.cmd run test:ui-contrast`
- `npm.cmd run test:ui-overflow`
- `npm.cmd run test:ui-responsive-balance`
- `npm.cmd run test:mobile-visual-stability`
- `npm.cmd run test:ultrawide-layout`
- `npm.cmd run test:theme-isolation`
- `npm.cmd run test:design-system-v2`
- `npm.cmd run test:erp-theme-v2`
- `npm.cmd run test:storefront-theme-v2`
- `npm.cmd run test:storefront-light-theme-stability`
- `npm.cmd run test:storefront-public-ui`
- `npm.cmd run test:storefront-guided-editor`
- `npm.cmd run test:storefront-mobile-real`
- `npm.cmd run test:storefront-mobile-actions`
- `npm.cmd run test:storefront-mobile-resilience`
- `npm.cmd run test:storefront-desktop-upscale`
- `npm.cmd run test:storefront-final-polish`
- `npm.cmd run test:storefront-visual-balance`
- `npm.cmd run test:storefront-performance-lite`
- `npm.cmd run test:storefront-pwa-upgrade`

Planos, checkout, diagnosticos e calculos:

- `npm.cmd run test:plans`
- `npm.cmd run test:plans-ui`
- `npm.cmd run test:plans-theme-v2`
- `npm.cmd run test:plans-saas-structure`
- `npm.cmd run test:start-plan`
- `npm.cmd run test:checkout-states`
- `npm.cmd run test:checkout-payment-states`
- `npm.cmd run test:billing-webhook`
- `npm.cmd run test:calculator-fee`
- `npm.cmd run test:diagnostics`
- `npm.cmd run test:feedback-reports`
- `npm.cmd run test:superadmin-diagnostics`
- `npm.cmd run test:codex-report-export`
- `npm.cmd run test:ai-foundation`
- `npm.cmd run test:google-integrations-foundation`
- `npm.cmd run test:monetization`

Estrutura e Supabase local:

- `npm.cmd run test:restructuring-checks`
- `npm.cmd run test:project-saneamento`
- `npm.cmd run test:erp-shell-v2`
- `npm.cmd run test:layout-overflow-v2`
- `npm.cmd run test:auth-ui`
- `npm.cmd run test:auth-hotfix`
- `npm.cmd run test:sensitive-action-guards`
- `npm.cmd run test:quick-order-multiselect`
- `npm.cmd run test:erp-cash-fiscal-foundation`
- `npm.cmd run test:storefront-demo-products`
- `npm.cmd run test:storefront-offline-recovery`
- `npm.cmd run test:storefront-og-meta`
- `npm.cmd run test:storefront-premium-7c3`
- `npm.cmd run test:storefront-publish-validation`
- `npm.cmd run test:storefront-share-links`
- `npm.cmd run test:storefront-rls-simulation`
- `npm.cmd run test:storefront-production-controlled`
- `npm.cmd run supabase:test:migrations`

## Validacao visual em navegador

Servidor local usado para smoke:

```txt
python -m http.server 5251 --directory dist
```

Rotas conferidas:

- `http://127.0.0.1:5251/?fresh=release-smoke-final`
- `http://127.0.0.1:5251/ne3d?admin=1`

Resultado:

- Sem erro de console no smoke.
- Sem overflow horizontal no ERP, Loja Online e Editor.
- Sem texto tecnico "Preview" visivel no editor.
- Sem filtro cinza aplicado ao banner da vitrine.
- Loja publica e editor continuam separados.

## Estado do APK/Android

Status: bloqueado para gerar APK neste ambiente.

O sync Android ja havia sido executado com sucesso anteriormente, copiando os assets web para o projeto Android. Porem a geracao do APK nao pode ser concluida porque o ambiente local nao possui Java/JDK configurado.

Evidencia atual:

```txt
java: The term 'java' is not recognized as a name of a cmdlet, function, script file, or executable program.
JAVA_HOME=
```

Para liberar o APK:

1. Instalar JDK compativel com o projeto Android/Gradle.
2. Configurar `JAVA_HOME`.
3. Confirmar `java -version`.
4. Rodar novamente `npm.cmd run android:sync`.
5. Rodar o build do APK configurado no projeto.
6. Testar instalacao em Android real antes de publicar.

## Estado de publicacao

Web/PWA:

- Estado tecnico: pronto para homologacao manual final.
- Publicacao automatica: nao executada nesta rodada.
- Push remoto: nao executado nesta rodada.

APK:

- Estado tecnico: nao pronto para publicacao completa neste ambiente.
- Motivo: JDK ausente, `JAVA_HOME` vazio.

## Pendencias manuais antes de release final

- Testar PWA instalado em Android real apos limpeza de cache.
- Testar tema claro e tema automatico seguindo o sistema em aparelho real.
- Testar editor guiado em telas reais de 320, 360, 390, 412 e 430 px.
- Testar upload/troca de imagem do banner e produto com conta real de homologacao.
- Testar loja publica compartilhada fora da sessao admin.
- Testar checkout Mercado Pago em sandbox se a release envolver pagamento.
- Gerar APK apos configurar JDK e validar instalacao em aparelho real.

## Conclusao

Resultado desta rodada:

```txt
Web build: aprovado
PWA/cache: atualizado
Tema claro: estabilizado na bateria automatizada e smoke local
Loja/editor: sem overflow no smoke local
Banner cinza: corrigido no smoke local
Textos em ingles no editor: corrigidos nos pontos rastreados
APK: bloqueado por ambiente sem Java/JDK
Publicacao remota: nao executada
```

Decisao recomendada:

- GO para homologacao manual Web/PWA.
- NO-GO para publicacao completa com APK ate configurar JDK e gerar o binario.
