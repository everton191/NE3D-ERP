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
