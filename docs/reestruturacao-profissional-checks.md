# Reestruturacao Profissional - Checks

Data da auditoria inicial: 2026-05-27

Checkpoint antes da fase: `checkpoint-restructuring-start-20260527`

Objetivo deste arquivo: manter um controle simples, incremental e verificavel da reestruturacao do Simplifica 3D, marcando o que ja existe, o que esta parcial e o que ainda precisa ser feito antes de novas features grandes.

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
