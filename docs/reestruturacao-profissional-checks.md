# Reestruturacao Profissional - Checks

Data da auditoria inicial: 2026-05-27

Checkpoint antes da fase: `checkpoint-restructuring-start-20260527`

Objetivo deste arquivo: manter um controle simples, incremental e verificavel da reestruturacao do Simplifica 3D, marcando o que ja existe, o que esta parcial e o que ainda precisa ser feito antes de novas features grandes.

## Fase 5A.2 - Start backend authority

- `[x]` Criar `PLAN_REGISTRY` com Free, Start e Pro.
- `[x]` Manter `START_PLAN_ENABLED=false`.
- `[x]` Preparar `MERCADO_PAGO_START_PLAN_ID` somente no backend.
- `[x]` Manter webhook Mercado Pago unico.
- `[x]` Criar migration idempotente do Start.
- `[x]` Criar runner remoto controlado sem `db push` cego.
- `[x]` Criar `test:start-plan`.
- `[x]` Configurar IDs Start/Pro como Supabase secrets backend.
- `[x]` Aplicar migration Start isoladamente e validar remoto.
- `[x]` Republicar apenas funcoes de billing afetadas.
- `[x]` Executar smokes sem assinatura e assinatura invalida.
- `[ ]` Validar sandbox Start com token `TEST-` dedicado.
- `[ ]` Ativar comercialmente Start.

## Fase 7A - release candidate

- `[x]` Auditar arquivos antigos e arquivar docs historicos da Storefront.
- `[x]` Auditar migrations locais/remotas sem `db push` geral.
- `[x]` Atualizar PWA para cache v122.
- `[x]` Atualizar web/APK para `1.0.19-rc` e versionCode `18`.
- `[x]` Publicar web/PWA em Vercel.
- `[x]` Bloquear rotas publicas internas de Google/IA.
- `[x]` Gerar APK debug atualizado.
- `[ ]` Validar APK em aparelho fisico.
- `[ ]` Validar PWA em aparelho fisico.
- `[ ]` Validar Start em sandbox real com token `TEST-`.

Legenda:

- `[x]` concluido ou ja implementado com evidencia local.
- `[ ]` pendente.
- `[~]` parcial, precisa consolidar.
- `[!]` risco tecnico que exige cuidado antes de alterar.

## Estado Geral Verificado

- `[x]` PWA possui cache versionado em `sw.js`.
- `[x]` `index.html` referencia `app.js`, `style.css` e `sw.js` com cache-bust da versao `1.0.16-estavel-plan-profile-rings`.
- `[x]` Existem testes ativos para storefront, PWA, planos, tema, responsividade e saneamento.
- `[x]` Existem modulos de storefront em `src/storefront`.
- `[~]` Tokens globais existem em `style.css`, mas ainda ha muitos estilos diretos e regras acumuladas.
- `[~]` Navegacao mobile possui drawer e bottom navigation, mas ainda nao ha App Shell formal unico.
- `[~]` Loja/editor ja estao parcialmente separados em servicos/adapters, mas muito do render/editor ainda esta concentrado em `app.js` e `style.css`.
- `[!]` `app.js` e `style.css` continuam muito grandes e devem ser reduzidos gradualmente, sem reescrita brusca.
- `[!]` Foram encontrados muitos usos de `overflow:hidden`, `position:fixed` e `z-index` hardcoded. Nem todos sao errados, mas precisam de padronizacao por camada.

## Arquivos Soltos Fora Desta Fase

Nao incluir automaticamente em commits de reestruturacao sem revisao:

- `scripts/test-storefront-production-controlled.js` esta modificado antes desta fase.
- `docs/storefront-phase35-validation.md`
- `docs/storefront-phase36-staging.md`
- `docs/storefront-phase37-production-controlled.md`
- `docs/storefront-phase38-admin-panel.md`
- `docs/storefront-phase39-hardening-storage.md`

## Bloco 1 - Auditoria e Limpeza Estrutural

- `[x]` Mapear estrutura atual: raiz, `src/storefront`, `scripts`, `supabase`, `android`, `assets`, `docs`.
- `[x]` Identificar existencia de CSS global principal: `style.css`.
- `[x]` Identificar render principal concentrado em `app.js`.
- `[x]` Identificar service worker ativo: `sw.js`.
- `[x]` Identificar testes ativos em `scripts/`.
- `[~]` Identificar codigo legado: ha evidencias de previews antigos e arquivos soltos, mas ainda nao movidos.
- `[ ]` Criar quarentena real `/legacy` e `/deprecated` com itens classificados.
- `[ ]` Mover apenas arquivos confirmados como obsoletos.
- `[~]` Procurar renderizacao duplicada: storefront/admin/editor aparecem em varios trechos, precisa auditoria por fluxo antes de mover.
- `[~]` Revisar overflow e scroll: riscos encontrados, correcao deve ser feita por tela.
- `[ ]` Criar tokens de z-index (`--z-sidebar`, `--z-header`, `--z-modal`, `--z-overlay`, `--z-toast`) e substituir hardcodes gradualmente.
- `[ ]` Commit alvo: `fase-1 auditoria estrutural e limpeza de legado`.

## Bloco 2 - App Shell Profissional

- `[~]` Sidebar desktop existe e possui estado recolhido/expandido.
- `[~]` Drawer mobile existe.
- `[~]` Bottom navigation mobile existe.
- `[ ]` Formalizar estrutura unica `app-shell`.
- `[ ]` Formalizar `sidebar`, `topbar`, `page-content`, `overlay-layer`, `modal-layer`, `toast-layer`.
- `[ ]` Garantir scroll unico oficial em `page-content`.
- `[ ]` Remover scrolls concorrentes criados por paginas isoladas.
- `[ ]` Commit alvo: `fase-2 app shell responsivo estabilizado`.

## Bloco 3 - Design System e Tokens

- `[x]` Tokens basicos existem em `style.css`: cores, spacing, radius e sombras.
- `[x]` Dark/light possuem variaveis separadas em parte do CSS e via aplicacao de tema em `app.js`.
- `[~]` Paletas controladas foram iniciadas, mas ainda precisam ser extraidas e documentadas.
- `[ ]` Criar pasta `/themes`.
- `[ ]` Centralizar tokens oficiais em arquivos de tema.
- `[ ]` Substituir cores hardcoded gradualmente.
- `[ ]` Criar teste que bloqueie novas cores fora dos tokens em componentes novos.
- `[ ]` Commit alvo: `fase-3 design system e theme tokens`.

## Bloco 4 - Responsividade Real

- `[x]` Existem testes de responsividade/ultrawide/mobile em `scripts/`.
- `[~]` Storefront desktop recebeu upscale responsivo, mas precisa validacao continua.
- `[~]` Mobile/PWA tem correcoes recentes, mas precisa auditoria por tela.
- `[ ]` Definir breakpoints oficiais no design system.
- `[ ]` Remover media queries aleatorias ou documentar excecoes.
- `[ ]` Padronizar grids reutilizaveis.
- `[ ]` Validar todas as telas com zero overflow horizontal.
- `[ ]` Commit alvo: `fase-4 responsividade consolidada`.

## Bloco 5 - Loja e Editor Modularizados

- `[x]` Existem services/adapters/modelos de storefront em `src/storefront`.
- `[~]` Loja publica, admin contextual e editor existem, mas ainda ha render grande dentro de `app.js`.
- `[~]` Preview existe, mas precisa isolamento formal de estado/scroll/container.
- `[ ]` Criar estrutura formal `/modules/storefront`, `/modules/store-editor`, `/modules/store-preview` ou consolidar a estrutura existente em `src/storefront` com fronteiras claras.
- `[ ]` Eliminar renderizacao dupla confirmada por fluxo.
- `[ ]` Separar blocos de banner, produtos, categorias, destaques e footer.
- `[ ]` Commit alvo: `fase-5 storefront e editor modularizados`.

## Bloco 6 - Sistema de Planos e Assinatura

- `[x]` Existem `plan`, `activePlan`, `subscriptionStatus`, `expiresAt` e normalizacao de plano.
- `[x]` Checkout aberto nao deve alterar plano antes de pagamento aprovado.
- `[x]` Perfil ja separa plano atual de todos os planos.
- `[~]` Expiracao/pending possui limpeza local, mas precisa validacao contra backend/webhook.
- `[ ]` Garantir `cancelAtPeriodEnd` como regra central para Start/Pro.
- `[ ]` Garantir que Free nunca mostre cancelar/voltar para Free.
- `[ ]` Separar formalmente plano, cobranca, status e acesso no service layer.
- `[ ]` Commit alvo: `fase-6 sistema profissional de assinatura`.

## Bloco 7 - Sistema Anti-Regressao

- `[x]` Cache PWA versionado em `sw.js`.
- `[x]` `sw.js` limpa caches antigos via `caches.keys()`.
- `[x]` Existem testes de PWA, tema, planos, storefront e mobile.
- `[~]` Branch atual usa `codex/stable-premium-motion`, mas estrategia `main/develop/staging/feature/hotfix` ainda nao esta formalizada neste workspace.
- `[ ]` Criar feature flags oficiais (`enableNewStorefront`, `enableNewPlans`) ou documentar equivalentes atuais.
- `[ ]` Criar checklist QA fixo por release.
- `[ ]` Commit alvo: `fase-7 sistema anti-regressao`.

## Bloco 8 - Polimento Premium

- `[~]` Tema claro/escuro e planos passaram por refinamentos recentes.
- `[~]` Botoes, cards e avatares possuem padronizacoes recentes, mas ainda precisam varredura global.
- `[ ]` Consolidar microinteracoes em tokens/classes reutilizaveis.
- `[ ]` Consolidar skeleton/loading/feedback visual.
- `[ ]` Reduzir herancas visuais antigas do ERP em telas internas.
- `[ ]` Commit alvo: `fase-8 polimento premium`.

## Proximos Passos Seguros

1. Rodar `npm run test:restructuring-checks`.
2. Consolidar Bloco 1 com uma classificacao real de arquivos:
   - manter;
   - mover para legacy;
   - mover para deprecated;
   - ignorar;
   - remover somente apos validacao.
3. Corrigir z-index/overflow por camada, com testes mobile e desktop.
4. Somente depois iniciar App Shell formal.

## Fase 1B - Mapeamento Antes da Cirurgia

- `[x]` Criar `docs/module-dependencies.md`.
- `[x]` Criar `docs/render-flow.md`.
- `[x]` Criar `docs/css-risk-map.md`.
- `[x]` Criar `docs/layout-zones.md`.
- `[x]` Criar pastas-base `/core`, `/layouts`, `/components`, `/themes`, `/legacy`.
- `[x]` Confirmar que `/modules` ja existe e permanece sem mudanca nesta fase.
- `[x]` Mapear fluxo de renderizacao principal.
- `[x]` Mapear overlays concorrentes.
- `[x]` Mapear riscos de CSS.
- `[x]` Classificar itens sem mover arquivos.
- `[ ]` Iniciar Bloco 2 apenas depois de revisar estes mapas.

## Fase 2A - Infraestrutura Global de Camadas e Scroll

- `[x]` Criar `#app-shell`.
- `[x]` Criar `#app-content` envolvendo o `#app` atual.
- `[x]` Criar `#overlay-layer`.
- `[x]` Criar `#drawer-layer`.
- `[x]` Criar `#modal-layer`.
- `[x]` Criar `#toast-layer`.
- `[x]` Manter `#popup` como camada legada temporaria.
- `[x]` Criar tokens `--z-base`, `--z-sidebar`, `--z-overlay`, `--z-drawer`, `--z-modal`, `--z-toast`, `--z-critical`.
- `[x]` Remover hardcodes `z-index:9999` e `z-index:10000` encontrados.
- `[x]` Criar handlers globais compativeis: `openModal`, `closeModal`, `openDrawer`, `closeDrawer`, `showToast`, `hideToast`, `showOverlay`, `hideOverlay`.
- `[x]` Direcionar `mostrarToast()` para `#toast-layer`.
- `[~]` Scroll central preparado em `#app-content`; migracao completa do scroll principal fica para etapa seguinte para evitar regressao brusca.
- `[ ]` Migrar modais/drawers legados do `#popup` para camadas novas de forma gradual.

## Fase 2B - Migracao Inicial do Popup Legado

- `[x]` Criar wrapper estruturado para `openModal({ content, size, closable, overlay })`.
- `[x]` Criar wrapper estruturado para `openDrawer({ content, closable, overlay })`.
- `[x]` Centralizar scrim em `#overlay-layer`.
- `[x]` Migrar `abrirDocumentoLegal()` para `#modal-layer`.
- `[x]` Migrar `abrirDrawerLateral()` para `#drawer-layer`.
- `[x]` Manter `#popup` como fallback legado.
- `[x]` Atualizar checks para impedir regressao desses dois fluxos ao `#popup`.
- `[ ]` Migrar proximos modais leves em commits pequenos.

## Fase 2C - Scroll, Sidebar e Responsividade Base

- `[x]` Definir `#app-content` como scroller principal do app shell.
- `[x]` Adicionar lock de scroll de fundo com `body.app-layer-open`.
- `[x]` Reduzir scroll concorrente da `.desktop-main` no PWA desktop.
- `[x]` Padronizar `--sidebar-width` e `--sidebar-width-collapsed`.
- `[x]` Criar tokens de breakpoints oficiais.
- `[x]` Criar zonas oficiais `layout-shell`, `layout-admin`, `layout-storefront`, `layout-auth` e `layout-editor`.
- `[~]` Manter scroll proprio apenas em drawers/modais e areas legadas ainda nao migradas.
- `[ ]` Migrar containers antigos com `overflow:hidden` tela por tela.

## Fase 3A - Design System Foundation

- `[x]` Criar estrutura `themes/base`, `themes/dark`, `themes/light` e `themes/premium`.
- `[x]` Criar arquivos de tokens por tema.
- `[x]` Completar tokens globais criticos em `style.css`.
- `[x]` Adicionar aliases oficiais para cores, bordas, spacing, radius, shadows, tipografia e layout.
- `[x]` Aplicar tokens apenas em shell, topbar/sidebar base e camadas visuais.
- `[x]` Criar documentacao `design-system`, `theme-tokens` e `spacing-system`.
- `[ ]` Componentizar botoes/cards/inputs na Fase 3B.

## Fase 3B - Componentizacao Visual

- `[x]` Criar estrutura `/components` por familia visual.
- `[x]` Criar contratos CSS para buttons, cards, inputs, modals, badges, tables, navigation, empty-states e loaders.
- `[x]` Ativar classes base `ds-*` e pontes `app-*` no `style.css`.
- `[x]` Documentar `docs/components.md` e `docs/component-contracts.md`.
- `[x]` Manter classes legadas funcionando para migracao gradual.
- `[ ]` Migrar telas reais para `ds-*` por fluxo nas proximas fases.

## Fase 3C - Polimento Premium e UX Empresarial

- `[x]` Criar tokens `--transition-fast`, `--transition-base` e `--transition-slow`.
- `[x]` Padronizar hover, active, focus e disabled para componentes `ds-*`/`app-*`.
- `[x]` Refinar skeleton loaders com varredura leve.
- `[x]` Refinar empty states com hierarquia e leitura.
- `[x]` Refinar tabelas base com hover, zebra e sticky header.
- `[x]` Refinar feedback visual de toast/modal/drawer.
- `[x]` Respeitar `prefers-reduced-motion` nos componentes novos.
- `[ ]` Aplicar polimento profundo em dashboards reais na fase futura.

## Fase 5B - Fundacao de IA Futura Desativada

- `[x]` Criar services isolados `src/services/ai*.js`.
- `[x]` Criar provider adapter com `disabled` funcional e providers futuros como stubs seguros.
- `[x]` Criar quota, feature flags, custo e context builders seguros.
- `[x]` Criar migration idempotente `app_ai_*` com RLS ativo.
- `[x]` Garantir que todas as feature flags de IA nascem desligadas.
- `[x]` Garantir que todos os planos retornam IA bloqueada nesta fase.
- `[x]` Criar `docs/ai-foundation.md`.
- `[x]` Criar `npm run test:ai-foundation`.
- `[x]` Nao carregar services de IA no `index.html`.
- `[x]` Nao adicionar menu, botao, card, tooltip ou tela de IA.
- `[x]` Nao adicionar provider real, SDK externo, fetch de IA ou chave de API.

## Fase 4A - Arquitetura Modular da Storefront e Editor

- `[x]` Criar estrutura formal `modules/storefront`, `modules/store-editor` e `modules/store-preview`.
- `[x]` Manter migracao apenas em contratos/documentacao, sem mover logica critica de `app.js`.
- `[x]` Documentar responsabilidades em `docs/storefront-architecture.md`.
- `[x]` Documentar zonas e grids em `docs/storefront-layout.md`.
- `[x]` Documentar isolamento de storefront/editor/preview em `docs/storefront-zones.md`.
- `[x]` Criar contratos CSS seguros para storefront, editor e preview.
- `[x]` Aplicar ponte de CSS em `style.css` para grids, zonas, scroll de preview e camadas da loja.
- `[x]` Permitir no `.gitignore` apenas os modulos formais da loja, mantendo o restante de `modules/` protegido.
- `[~]` Preview continua usando a implementacao legada, mas agora possui contrato de isolamento para migracao futura.
- `[~]` Storefront/editor continuam renderizados em `app.js`; a migracao real fica para Fase 4B.

## Fase 4B - Migracao Controlada da Storefront V2

- `[x]` Criar flag oficial `enableStorefrontV2`.
- `[x]` Criar adapter central `renderStorefrontView({ mode, source })`.
- `[x]` Manter fallback `Legacy` para publico, editor e preview.
- `[x]` Ativar `public/v2` por padrao com atributos `data-storefront-render` e `data-storefront-source`.
- `[x]` Aplicar zonas oficiais em header, conteudo, filtros, produtos e rodape da loja publica.
- `[x]` Aplicar zonas oficiais no painel editor/admin.
- `[x]` Isolar preview com `store-preview-zone`, `store-preview-frame` e `store-preview-scroll`.
- `[x]` Adicionar check anti-regressao para flag, adapter, v2/legacy e zonas.
- `[ ]` Migrar overlays visuais restantes da loja para layers globais em fase posterior.
- `[ ]` Extrair render real para arquivos modulares na Fase 4C/4D.

## Fase 4C - Editor Profissional da Loja

- `[x]` Criar `store-editor-shell` como workspace dedicado do editor.
- `[x]` Separar `store-editor-sidebar`, `store-editor-workspace`, `store-editor-header`, `store-editor-main` e `store-editor-sections`.
- `[x]` Transformar preview em `store-preview-panel` com largura lateral controlada no desktop.
- `[x]` Empilhar preview em tablet/mobile para evitar painel central espremido.
- `[x]` Agrupar acoes do topo em primarias, secundarias, sistema e `Mais acoes`.
- `[x]` Manter regras de planos, pagamentos, checkout e pedidos fora do escopo.
- `[~]` Preview ainda usa render legado por dentro; a isolacao profunda fica para fase futura.
- `[ ]` Migrar conteudo real das abas para componentes modulares em commits menores.

## Fase 4D - Refinamento e Migracao do Editor da Loja

- `[x]` Encapsular todas as abas em `store-editor-tab-panel`.
- `[x]` Separar abas com preview proprio (`has-inline-preview`) e preview automatico (`has-preview-panel`).
- `[x]` Garantir preview lateral/empilhado em produtos, categorias, leads, compartilhamento e configuracoes.
- `[x]` Ajustar preview para evitar scroll duplicado entre device e scroll interno.
- `[x]` Melhorar Produtos com resumo, CTA de adicionar, formulario nomeado e lista com empty state acionavel.
- `[x]` Manter planos, pagamentos, checkout e regras de assinatura fora do escopo.
- `[ ]` Extrair render das abas para arquivos em `modules/store-editor` em fase posterior.

## Fase 4E - Extracao Segura do Editor da Loja

- `[x]` Criar `modules/store-editor/storeEditorRenderer.js`.
- `[x]` Criar `modules/store-editor/storeEditorTabs.js`.
- `[x]` Criar `modules/store-editor/storeEditorPreview.js`.
- `[x]` Criar `modules/store-editor/storeEditorProducts.js`.
- `[x]` Carregar helpers antes do `app.js` sem mudar para ES modules.
- `[x]` Garantir ordem renderer -> tabs -> preview -> products -> app.js.
- `[x]` Copiar `modules/store-editor`, `modules/store-preview` e `modules/storefront` para `dist/modules` no `build:web`.
- `[x]` Manter `app.js` como orquestrador de `renderStorefrontView`.
- `[x]` Preservar fallback local de `renderStoreEditorTabContent`.
- `[x]` Preservar contratos `store-editor-tab-panel`, `store-preview-device`, `store-preview-scroll` e `storefrontProductForm`.
- `[x]` Nao mover planos, pagamentos, checkout, assinatura ou regras de salvar produto.

## Fase 4F - Endurecimento dos Modulos, Cache e Fallback

- `[x]` Incluir os helpers `modules/store-editor/*.js` no precache do service worker.
- `[x]` Atualizar cache version para `simplifica-3d-v116-estavel-20260528-store-editor-modules`.
- `[x]` Atualizar cache-bust de `app.js`, `sw.js` e scripts do editor no `index.html`.
- `[x]` Validar namespace completo antes de usar renderer modular.
- `[x]` Marcar caminho modular com `data-store-editor-renderer="module"` e `data-store-editor-modules-ready="true"`.
- `[x]` Marcar fallback com `data-store-editor-renderer="fallback"` e `data-store-editor-modules-ready="false"`.
- `[x]` Manter log de fallback apenas em modo debug.
- `[x]` Manter fallback local preservado para PWA/cache antigo e rollback.

## Fase 4G - Reducao Segura do app.js

- `[x]` Adicionar `version = "4G"` e `moduleVersion = "store-editor-4g"` ao namespace do editor.
- `[x]` Criar validacao segura `isStoreEditorModuleReady()`.
- `[x]` Separar log de fallback em `logStoreEditorModuleFallback()`.
- `[x]` Reduzir fallback local para modo minimo/controlado.
- `[x]` Remover duplicacao de `previewTitles` do fallback em `app.js`.
- `[x]` Manter `renderStorefrontView` e decisao de modo no `app.js`.
- `[x]` Manter fallback observavel com `data-store-editor-renderer="fallback"`.
- `[x]` Atualizar cache-bust/cache version para a etapa 4G.

## Fase 4H - Validacao Final da Loja e Editor Modular

- `[x]` Validar editor autenticado pelo caminho modular.
- `[x]` Confirmar `data-store-editor-renderer="module"`.
- `[x]` Confirmar `data-store-editor-modules-ready="true"`.
- `[x]` Confirmar versao `store-editor-4g` no DOM e namespace em Chrome real.
- `[x]` Trocar abas do editor sem duplicar tela.
- `[x]` Validar Produtos com `storefrontProductForm`, CTA e preview sem salvar dados permanentes.
- `[x]` Validar loja publica V2 sem vazamento de UI administrativa.
- `[x]` Validar modulos `modules/store-editor/*.js` com HTTP 200.
- `[x]` Validar service worker/cache `simplifica-3d-v116-estavel-20260528-store-editor-4g`.
- `[x]` Simular falha local de modulo e confirmar fallback minimo.
- `[x]` Manter planos, pagamentos, checkout, assinatura e banco fora do escopo.
- `[~]` Validacao em PWA instalado/celular fisico ainda precisa ser repetida manualmente.

## Fase 5A - Logica de Planos e Assinatura

- `[x]` Criar helper central `getPlanAccessState()`.
- `[x]` Separar plano efetivo, status de assinatura e status de pagamento.
- `[x]` Impedir que usuario Free veja "voltar para Free" ou "cancelar Free".
- `[x]` Impedir que cancelamento de Start/Pro faca downgrade imediato.
- `[x]` Marcar cancelamento pago como `cancelAtPeriodEnd = true`.
- `[x]` Manter acesso pago ate `currentPeriodEnd || expiresAt || planExpiresAt`.
- `[x]` Tratar `checkout_opened` como tentativa temporaria, sem mudar plano.
- `[x]` Mostrar pagamento pendente apenas quando houver transacao real pendente.
- `[x]` Adicionar teste `test:plans` para as regras de assinatura.
- `[ ]` Validar webhook Mercado Pago em ambiente remoto antes de remover caminhos legados.

## Fase 5C - Checkout e Estados de Pagamento

- `[x]` Diferenciar retorno de checkout aprovado, pendente e falho sem ativar plano por URL.
- `[x]` Limpar parametros transitorios do Mercado Pago apos retorno.
- `[x]` Sincronizar licenca online apos retorno sem transformar URL em autoridade.
- `[x]` Registrar `checkout_opened`, `checkout_abandoned`, `checkout_returned_without_payment` e `payment_failed`.
- `[x]` Expirar checkout local abandonado preservando o plano anterior.
- `[x]` Criar runner sandbox controlado que aceita somente token `TEST-`.
- `[x]` Criar fixtures locais para aprovado, recusado, pendente, abandono e cancelamento.
- `[~]` Executar sandbox real aprovado, recusado, pendente e cancelamento com credencial TEST dedicada.

## Fase 6A - Diagnosticos, Bugs, Sugestoes e Relatorio Codex

- `[x]` Criar `src/services/diagnosticsService.js` com fila offline, sanitizacao, fingerprint e envio seguro.
- `[x]` Expor `reportAppError`, `reportFeedback`, `reportDiagnosticEvent`, `generateErrorFingerprint`, `sanitizeDiagnosticPayload` e `flushPendingDiagnosticsQueue`.
- `[x]` Capturar `window.onerror` e `window.onunhandledrejection` sem quebrar runtime.
- `[x]` Criar migration idempotente para `app_error_logs`, `app_error_log_users`, `app_feedback_reports`, `app_diagnostic_events`, `app_bug_clusters`, `app_bug_reports_exports`, `app_ai_analysis_runs` e `app_ai_knowledge_base`.
- `[x]` Ativar RLS nas tabelas novas sem policies publicas abertas.
- `[x]` Adicionar aba Superadmin `Relatorios e Diagnostico`.
- `[x]` Gerar relatorio tecnico para Codex a partir de bugs/clusters.
- `[x]` Preparar eventos de planos, checkout e Mercado Pago sem alterar regras de assinatura.
- `[x]` Preparar flags de IA futura (`enableAiDiagnostics`, `enableAiAssistant`, `enableAiBugSummary`) desligadas.
- `[x]` Criar testes `test:diagnostics`, `test:feedback-reports`, `test:superadmin-diagnostics` e `test:codex-report-export`.
- `[ ]` Aplicar migration no Supabase remoto antes de validar dados reais de usuarios.
- `[ ]` Validar painel Superadmin autenticado contra dados reais de producao controlada.

## Fase 6B - Validacao dos Relatorios de Bugs, Sugestoes e Superadmin

- `[x]` Validar envio programatico de feedback com tipos `suggestion`, `bug_report` e eventos diagnosticos.
- `[x]` Validar sanitizacao de `access_token`, `refresh_token`, `password`, `authorization`, `apikey`, `secret`, `webhook_secret`, `card`, `cpf` e `cnpj`.
- `[x]` Validar fingerprint normalizado para erros repetidos.
- `[x]` Validar fila offline e flush posterior.
- `[x]` Criar trigger `refresh_app_bug_cluster_from_error()` para manter `app_bug_clusters`.
- `[x]` Persistir relatorios Codex em `app_bug_reports_exports` quando Supabase estiver disponivel.
- `[x]` Adicionar acoes Superadmin para status, severidade e notas de bugs/clusters/feedback.
- `[x]` Confirmar que eventos de planos/Mercado Pago sao aceitos sem mexer no webhook real.
- `[ ]` Validar envio manual pela UI com usuario autenticado em ambiente remoto.
- `[ ]` Validar RLS real com usuario comum e superadmin apos aplicar migrations no Supabase.

## Fase 6C - Aplicacao Remota, RLS e Superadmin

- `[x]` Rodar dry-run remoto antes de aplicar migrations.
- `[x]` Identificar que `db push` geral tentaria aplicar migrations antigas fora do escopo.
- `[x]` Aplicar individualmente `20260529141000_ai_foundation_disabled.sql`.
- `[x]` Aplicar individualmente `20260529162000_diagnostics_bugs_feedback_codex.sql`.
- `[x]` Aplicar individualmente `20260529173500_diagnostics_validation_hardening.sql`.
- `[x]` Reparar historico remoto apenas das tres migrations da fase.
- `[x]` Corrigir idempotencia de `app_feedback_reports.message` para bancos onde a tabela ja existia.
- `[x]` Criar `scripts/diagnostics-remote-controlled.js` para status, dry-run, apply e validate.
- `[x]` Validar RLS remoto com usuario comum e superadmin em transacao com rollback.
- `[x]` Validar que usuario comum nao le clusters globais nem altera severidade.
- `[x]` Validar que superadmin altera bug/feedback e gera export Codex.
- `[x]` Confirmar IA futura ainda desativada no remoto.
- `[~]` Validacao manual com usuario/superadmin real no navegador deve ser repetida apos deploy.

## Fundacao Google Futura Desativada

- `[x]` Criar estrutura `src/integrations/google`.
- `[x]` Criar placeholders para Auth, Calendar, Drive, Gmail e Sheets.
- `[x]` Criar placeholders de Supabase Functions para OAuth e sincronizacoes futuras.
- `[x]` Criar `googleIntegrationService.js` sem chamadas externas.
- `[x]` Garantir retorno `GOOGLE_INTEGRATIONS_DISABLED` em todos os metodos.
- `[x]` Documentar variaveis futuras `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_REDIRECT_URI` e `GOOGLE_ENCRYPTION_KEY`.
- `[x]` Criar migration idempotente para `external_integrations`, `integration_tokens`, `integration_sync_jobs`, `integration_logs` e `app_integration_feature_flags`.
- `[x]` Manter flags Google futuras desligadas por padrao.
- `[x]` Ativar RLS com isolamento por `owner_id = auth.uid()` e superadmin.
- `[x]` Nao carregar service Google no `index.html`.
- `[x]` Nao alterar login por e-mail/senha nem Supabase Auth atual.
- `[x]` Nao adicionar SDK Google ou OAuth funcional.

## Fase 6C.1 - Google Remoto e Seguranca

- `[x]` Criar checkpoint local da fundacao Google antes da aplicacao remota.
- `[x]` Validar dependencia remota `public.erp_is_superadmin()`.
- `[x]` Aplicar individualmente `20260529193000_google_integrations_foundation_disabled.sql`.
- `[x]` Reparar historico remoto apenas da migration Google.
- `[x]` Criar `scripts/google-integrations-remote-controlled.js`.
- `[x]` Validar tabelas remotas, RLS e ausencia de policy publica.
- `[x]` Validar `integration_tokens` sem policy/grant para frontend.
- `[x]` Validar flags Google desligadas.
- `[x]` Validar isolamento por `owner_id`.
- `[x]` Validar usuario comum sem acesso a outro owner e sem criar token.
- `[x]` Validar superadmin sem leitura frontend de tokens.
- `[x]` Confirmar que login atual e UI continuam sem botao Google.

## Fase 6D - Deploy Controlado e Smoke Real

- `[x]` Conferir checkpoint `80d4852` e tags recentes.
- `[x]` Manter arquivos antigos fora de escopo fora do commit/deploy de codigo.
- `[x]` Executar suite pre-deploy de diagnosticos, Google, planos, UI, migrations e build.
- `[x]` Publicar deploy prebuilt no Vercel.
- `[x]` Validar URL `https://erpne3d.vercel.app`.
- `[x]` Confirmar assets novos: icon-192, icon-512, apple-touch-icon, intro.mp4 e simplifica-brand-cover.
- `[x]` Confirmar cache `v119` ou posterior.
- `[x]` Corrigir build para nao publicar `src/integrations/google`.
- `[x]` Confirmar Google/IA invisiveis no HTML remoto.
- `[x]` Confirmar diagnosticos remotos com `diagnostics_remote_validation_ok`.

## Fase 5A.1 - Mercado Pago webhook unico

- `[x]` Auditar Edge Functions existentes e manter apenas `mercadopago-webhook` como receptor.
- `[x]` Validar `x-signature`, `x-request-id`, `data.id`, `ts` e `v1` com HMAC SHA-256.
- `[x]` Adicionar tolerancia de timestamp e comparacao constante.
- `[x]` Criar `billing_webhook_events` com chave unica, RLS e acesso exclusivo por `service_role`.
- `[x]` Sanitizar payload persistido pelo backend.
- `[x]` Corrigir cancelamento remoto para `cancel_at_period_end=true`, sem downgrade imediato.
- `[x]` Preservar aliases Pro legados e bloquear Start ate migracao completa da autoridade remota.
- `[x]` Criar `test:billing-webhook`.
- `[x]` Criar `supabase:billing-webhook:*` para aplicacao isolada, deploy, validacao e smoke sem cobranca.
- `[x]` Confirmar Google remoto com `google_integrations_remote_validation_ok`.
- `[~]` Validacao de usuario comum e Superadmin reais exige login manual/autenticado.
- `[~]` Loja publica `/ne3d` retornou `Loja em preparacao`; validar com loja publicada antes de release final.

## Fase 5B - Tela Premium de Planos

- `[x]` Derivar tela moderna de `getPlanAccessState()`.
- `[x]` Adicionar `canReactivateRenewal` ao contrato central.
- `[x]` Manter Start visivel como `Em breve`, sem checkout funcional.
- `[x]` Direcionar Free somente para checkout Pro.
- `[x]` Mostrar pending apenas com transacao remota real.
- `[x]` Mostrar aviso discreto para checkout aberto ou abandonado sem congelar interface.
- `[x]` Confirmar contratacao Pro antes do redirecionamento Mercado Pago.
- `[x]` Confirmar cancelamento e reativacao com textos claros.
- `[x]` Criar workspace responsivo limitado a `1280px`.
- `[x]` Garantir uma coluna mobile e ate tres cards equilibrados desktop.
- `[x]` Preservar contraste dos cards e avisos em tema claro e escuro.
- `[x]` Registrar eventos seguros da tela sem payload sensivel.
- `[x]` Criar `test:plans-ui`.
- `[~]` Validacao visual autenticada em navegador deve ser repetida manualmente antes do release.

## Fase 7C.3 - Loja Publica Premium

- `[x]` Criar checkpoint Git antes da alteracao visual.
- `[x]` Preservar Storefront V2, editor guiado, Supabase, planos, checkout e publicacao.
- `[x]` Aplicar superficie clara premium apenas na loja publica.
- `[x]` Manter sidebar e toolbar do editor com contraste operacional escuro.
- `[x]` Reordenar home para banner, beneficios, categorias, produtos e contato.
- `[x]` Remover promocao e depoimentos genericos da home sem apagar fallback legado.
- `[x]` Consolidar grade unica de contatos e CTA unico.
- `[x]` Reduzir carrinho flutuante para icone e contador.
- `[x]` Fixar cards com imagem quadrada e titulo em ate duas linhas.
- `[x]` Ajustar limites: banner `40/100/24`, produto `60/180`.
- `[x]` Criar `test:storefront-premium-7c3`.
- `[x]` Atualizar cache PWA para `simplifica-3d-v129-estavel-20260531-storefront-premium`.
- `[~]` Validar CRUD remoto com conta descartavel antes de publicar produtos reais.

## Fase 7C.5 - Tema Claro Oficial da Loja Online

- `[x]` Criar autoridade unica `applyStoreTheme()` para a Storefront.
- `[x]` Definir `light` como fallback de usuario novo, PWA e APK.
- `[x]` Aplicar `data-store-theme` antes do primeiro render em `index.html`.
- `[x]` Remover modo automatico da configuracao publica da loja.
- `[x]` Separar o tema publico da vitrine do tema operacional do ERP.
- `[x]` Migrar carrinho e modal de lead para tokens do tema da loja.
- `[x]` Atualizar manifest para splash e barra claras.
- `[x]` Atualizar cache PWA para `simplifica-3d-v130-estavel-20260531-storefront-light-theme`.
- `[x]` Adicionar `npm run test:storefront-light-theme-stability`.
- `[~]` Rebuild e promocao publica do APK dependem do smoke Android fisico.

## Checkpoint Storefront Final Polish

- `[x]` Preservar regras comerciais, Supabase, checkout e planos.
- `[x]` Adicionar retorno interno seguro para vitrine e gesto Android.
- `[x]` Fechar modal, painel guiado ou menu mobile antes de sair da vitrine.
- `[x]` Remover tokens escuros incondicionais do editor no tema claro.
- `[x]` Aplicar tema claro aos modais visuais externos ao shell.
- `[x]` Compactar toolbar e limitar status de publicacao.
- `[x]` Ocultar carrinho flutuante durante edicao contextual.
- `[x]` Organizar produtos-modelo e agrupar acoes secundarias.
- `[x]` Usar bordas discretas do plano Free, Start e Pro no editor.
- `[x]` Trocar rotulos antigos por `Abrir vitrine` e `Copiar link da vitrine`.
- `[~]` Gerar e publicar novo APK somente depois do smoke Android fisico.

## Checkpoint Storefront Oficial e Acoes Compactas

- `[x]` Liberar a Storefront V2 como experiencia oficial sem aviso beta no fluxo normal.
- `[x]` Preservar bloqueio comercial da publicacao no plano Free.
- `[x]` Trocar textos tecnicos e termos em ingles por linguagem simples em portugues.
- `[x]` Ocultar nome interno de teste no titulo, metadados e descricao da imagem da vitrine.
- `[x]` Compactar acoes frequentes e mover operacoes raras para menu contextual.
- `[x]` Impedir que o cartao de link repita a entrada do proprio admin.
- `[x]` Atualizar cache PWA para `simplifica-3d-v136-storefront-public-ui-20260601`.
- `[x]` Criar `npm run test:storefront-public-ui`.
- `[~]` Publicacao remota de Web/PWA e rebuild do APK permanecem fora deste checkpoint local.
