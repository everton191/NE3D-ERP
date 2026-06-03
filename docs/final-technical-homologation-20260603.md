# Fechamento tecnico pre-homologacao - 2026-06-03

## 1. Git

| Item | Resultado |
| --- | --- |
| Branch | `codex/stable-premium-motion` |
| Status inicial | Limpo, `ahead 12` |
| Checkpoint local criado | `checkpoint-before-apk-local-build-20260603` |
| Checkpoint anterior preservado | `release-readiness-audit-20260603` |
| Push remoto | Nao executado |
| Deploy/publicacao | Nao executado |

Observacao: esta etapa nao fez redesign, nao alterou regras de negocio, nao alterou Supabase/Mercado Pago e nao publicou PWA/APK remotamente.

## 2. Auditoria de anuncios

| Item | Resultado | Evidencia no codigo | Bloqueador |
| --- | --- | --- | --- |
| Existe implementacao de anuncios? | Sim, parcial | `src/services/adMobService.js`, `src/services/adSenseService.js`, `src/services/monetizationLimits.js`; carregados em `index.html:92-94` e cacheados em `sw.js:10-12` | Producao real depende de runtime correto, conta aprovada e dominio/app validado |
| Anuncios da loja publica existem? | Nao como slot proprio da loja publica | AdMob/AdSense limitam banners a `dashboard`, `relatorios`, `estoque`; `src/services/adMobService.js:29`, `src/services/adSenseService.js:4` | Implementacao futura precisa ser autorizada se a loja publica tiver anuncio |
| Onde aparecem? | Dashboard, Relatorios e Estoque, quando elegivel | `BANNER_ALLOWED_SCREENS` e `ALLOWED_SCREENS`; `src/services/adMobService.js:29`, `src/services/adSenseService.js:4` | Nao confirmado em producao local porque web AdSense nasce desligado e AdMob exige Android nativo |
| Existem anuncios relacionados ao plano Free? | Sim | `PlanService` marca `adsEnabled: !paid`; `app.js:1368`; `monetizationLimits` limita acoes Free; `src/services/monetizationLimits.js:4-6` | Depende de plugin/SDK em Android ou configuracao AdSense web |
| Existe limite diario ou desbloqueio por anuncio? | Sim | 5 acoes base + 5 bonus por anuncio; `src/services/monetizationLimits.js:4-6`; desbloqueio temporario em `src/services/adMobService.js:26` | Producao real do anuncio precisa carregar para liberar via SDK; ha fallback temporal testado |
| Existe flag de ativacao? | Sim, mas separada por runtime | AdSense `enabled: false`; `src/services/adSenseService.js:8`; AdMob possui override/testes e `ADS_PRODUCTION_ENABLED` | Web AdSense desligado por padrao; AdMob depende de Android nativo |
| Existem IDs ou placeholders configurados? | Sim | AdMob tem IDs reais e de teste no service; AdSense aceita publisher/slot por config; `ads.txt` existe | IDs nao foram expostos neste relatorio; validar se devem sair do frontend antes de release publica mais ampla |
| Script externo carrega uma unica vez? | Sim, no AdSense | `querySelector("script[data-simplifica-adsense='true']")`; `src/services/adSenseService.js:130`; `scriptPromise` evita duplicidade | So verificavel em producao com AdSense habilitado e publisher/slot validos |
| Anuncios aparecem dentro do editor indevidamente? | Nao pelo fluxo atual | Editor/loja nao estao em `ALLOWED_SCREENS`; contexto critico bloqueia modal/typing/auth/admin; `src/services/adMobService.js:561-567`, `src/services/adSenseService.js:95-105` | Smoke real com anuncio produtivo em Android ainda precisa ser feito |
| Comportamento mobile esta protegido contra sobreposicao? | Parcialmente | AdMob banner nativo usa `ADAPTIVE_BANNER` em `BOTTOM_CENTER`; contextos criticos bloqueiam exibicao | Precisa teste fisico em Android, porque overlay nativo do SDK nao e reproduzido no navegador |
| Producao pode ser confirmada localmente? | Nao completamente | `npm.cmd run test:monetization` cobre logica e mock do SDK | Validacao real depende de app Android, AdMob/AdSense aprovado, dominio/app publicado e dispositivos reais |

### Diferenciacao objetiva

- Codigo existente: sim, para AdMob Android nativo, AdSense web e limites de monetizacao.
- Flag habilitada: AdSense web nasce desligado; AdMob tem producao configurada no service, mas so roda se o runtime for Android nativo com plugin disponivel.
- Configuracao preenchida: AdMob tem configuracao de unidades no service; AdSense precisa `publisherId` e `bannerSlot` validos em runtime.
- Carregamento local: testado por mock em `npm.cmd run test:monetization`.
- Carregamento real em producao: nao confirmado localmente.
- Dependencias externas: conta AdMob/AdSense aprovada, dominio/app validado, politica de anuncios e teste em Android real.

Teste executado:

```txt
npm.cmd run test:monetization
```

Resultado: aprovado.

## 3. Auditoria de planos

| Item | Free | Start | Pro | Status |
| --- | --- | --- | --- | --- |
| Preco exibido | Gratuito | R$ 29,90 | R$ 59,90 | Confirmado em `PLAN_REGISTRY`; `app.js:164-166` |
| Registro no frontend | Sim | Sim | Sim | `PLAN_REGISTRY` central; `app.js:83`, `app.js:164-166` |
| Registro no backend | Sim | Sim, preparado | Sim | Billing variants em `supabase/functions/_shared/mercadopago-billing.ts:4-6` |
| Permissoes | Basico, com anuncios | Pago inicial | Pago avancado | `PlanService.getPolicy`; `app.js:1354-1386` |
| Pode editar loja | Sim | Sim | Sim | Editor liberado para usuario autenticado; `app.js:9176-9182` |
| Pode publicar loja | Nao | Sim, quando ativo | Sim | `publicStore: paid`; `app.js:1382`; bloqueio Free em `app.js:14570-14584` |
| Checkout configurado | Nao aplicavel | Preparado, bloqueado por flag | Sim | Start bloqueado por `START_PLAN_ENABLED=false`; Pro preservado |
| Webhook reconhece plano | Nao aplicavel | Sim por allowlist backend | Sim por allowlist backend | `resolvePlanSlugFromMercadoPagoPlanId`; `mercadopago-billing.ts:34-40` |
| Flag ativa | Nao aplicavel | Desativada | Ativa/preservada | `START_PLAN_ENABLED=false`; `app.js:82`, backend gate em `mercadopago-billing.ts:21` |
| Pendencias | Nenhuma para Free atual | Ativar somente apos sandbox real e decisao comercial | Validar sandbox/live antes de release com pagamento | Start ainda nao deve ser liberado automaticamente |

Confirmacoes especificas:

- Free pode abrir e editar a loja, mas nao publicar: confirmado por `canAccessStorefrontAdmin()` liberado para usuario autenticado e `exigirChecklistPublicacaoLoja()` bloqueando `policy.publicStore=false`.
- Start pode publicar a loja quando estiver como plano ativo: `PlanService` define `paid=true` para Start e `publicStore: paid`.
- Pro pode publicar e usar recursos avancados: `pro=true` libera `customThemes`, `advancedReports`, `employees`, `prioritySync`.
- `pending_plan` nao concede permissao: a regra central comenta e testa que somente `activePlan` libera acesso; `app.js:7136`, `scripts/test-plans-saas-structure.js`.
- `pending_plan` nao substitui `active_plan`: coberto por `getPlanAccessState()` e testes `test:plans`, `test:start-plan`, `test:checkout-states`.
- Checkout abandonado nao congela a interface: coberto por `test:checkout-states`.
- Conta Free continua Free apos desistir do checkout: coberto por `test:checkout-states` e ausencia de alteracao direta de `activePlan` por retorno.
- Conta paga permanece no plano anterior apos desistir de troca: coberto pela mesma regra de nao ativar plano via retorno local.
- Nova tentativa de compra continua disponivel: retorno local limpa/normaliza estado sem transformar em pending permanente.
- Webhook valido permanece autoridade final: coberto por `test:billing-webhook`.
- Flag do Start: desativada (`START_PLAN_ENABLED=false`).
- Falta para liberar Start com seguranca: executar sandbox real completo, validar assinatura/preapproval, webhook, idempotencia, cancelamento e retorno antes de alterar a flag.

Testes executados:

```txt
npm.cmd run test:plans
npm.cmd run test:plans-ui
npm.cmd run test:start-plan
npm.cmd run test:checkout-states
npm.cmd run test:billing-webhook
```

Resultado: todos aprovados.

## 4. Java e Android

| Item | Resultado |
| --- | --- |
| `java` no PATH global | Nao encontrado |
| `JAVA_HOME` global | Vazio |
| JDK/JBR encontrado | Sim |
| Origem | Android Studio JBR |
| Caminho usado temporariamente | `C:\Program Files\Android\Android Studio\jbr` |
| Versao | OpenJDK `21.0.10` |
| AGP | `com.android.tools.build:gradle:8.13.0` |
| Gradle Wrapper | `gradle-8.14.3-all.zip` |
| compileSdk/targetSdk | 36 / 36 |
| versionCode/versionName | 18 / `1.0.19-rc` |

Configuracao aplicada somente no processo local:

```powershell
$env:JAVA_HOME='C:\Program Files\Android\Android Studio\jbr'
$env:PATH="$env:JAVA_HOME\bin;$env:PATH"
```

Comandos executados:

```txt
npm.cmd run android:sync
.\gradlew.bat assembleDebug
```

Resultado do build Android:

| Item | Resultado |
| --- | --- |
| Variante | Debug |
| Build | Aprovado |
| APK local | `C:\Users\PAESS\OneDrive\Documentos\erpNE3d\android\app\build\outputs\apk\debug\app-debug.apk` |
| Tamanho | 27.501.103 bytes, aproximadamente 26,23 MB |
| Data de geracao | 2026-06-03 13:53:48 |
| Assets atuais | Confirmados por hash em `index.html`, `app.js`, `style.css`, `sw.js` entre `dist/` e `android/app/src/main/assets/public/` |
| Warnings | `flatDir should be avoided`; aviso CXX sobre SDK XML version 4 com ferramenta que entende ate version 3 |
| Download publico | Nao alterado |
| Upload/publicacao | Nao executado |

Validacao em aparelho:

- `adb` nao esta no PATH global.
- Existe `adb` no Android SDK local e o comando `adb devices` foi executado.
- Nenhum dispositivo/emulador conectado foi listado.
- Portanto, o APK foi gerado, mas a instalacao/teste em celular real ainda fica pendente.

## 5. Roteiro de homologacao manual restante

### APK local

1. Instalar `android/app/build/outputs/apk/debug/app-debug.apk` em aparelho Android de teste.
2. Abrir o app.
3. Confirmar inicializacao sem tela antiga.
4. Confirmar tema claro padrao.
5. Trocar claro -> escuro -> claro.
6. Fechar completamente e abrir novamente.
7. Confirmar persistencia do tema.
8. Validar scroll geral do ERP.
9. Validar barra inferior no mobile.
10. Validar inputs no tema claro.
11. Abrir Loja Online.
12. Abrir editor da loja.
13. Editar produto.
14. Salvar produto.
15. Confirmar preview e persistencia.
16. Validar carrinho.
17. Validar botao WhatsApp.
18. Testar navegacao de voltar.
19. Confirmar ausencia de botoes sobrepostos.
20. Confirmar ausencia de gradientes/resquicios no tema claro.

### PWA instalada

1. Instalar ou atualizar a PWA.
2. Fechar completamente.
3. Abrir pelo icone instalado.
4. Confirmar versao/cache atuais.
5. Testar claro -> escuro -> claro.
6. Fechar e reabrir.
7. Confirmar persistencia.
8. Abrir loja.
9. Abrir editor.
10. Editar produto.
11. Salvar.
12. Recarregar.
13. Confirmar persistencia.
14. Testar scroll.
15. Testar barra inferior.
16. Confirmar ausencia de layout antigo apos atualizacao.

## 6. Arquivos alterados nesta etapa

- `docs/final-technical-homologation-20260603.md`

Arquivos gerados pelo build e nao versionados:

- `android/app/build/outputs/apk/debug/app-debug.apk`

## 7. Decisao

GO PARA HOMOLOGAÇÃO MANUAL COM APK LOCAL E PWA INSTALADA
