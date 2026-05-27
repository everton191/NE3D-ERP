# Module Dependencies - Fase 1B

Data: 2026-05-27

Escopo: mapeamento sem reorganizacao. Nenhum arquivo foi movido nesta fase.

## Resumo Executivo

O projeto ainda funciona principalmente como um aplicativo monolitico no navegador:

- `app.js` concentra estado global, renderizacao, eventos, permissao, planos, storefront, pedidos, caixa e UX.
- `style.css` concentra o tema, componentes, App/PWA/APK, Storefront/Admin e correcoes historicas.
- `src/storefront` ja existe como inicio de modularizacao real para servicos, adapters e regras.
- `scripts/` contem uma boa base anti-regressao para storefront, PWA, planos, responsividade e saneamento.
- `supabase/` contem a fundacao backend, migrations, functions e templates.

## Dependencias Principais

| Area | Arquivo(s) | Depende de | Observacao | Risco |
| --- | --- | --- | --- | --- |
| Bootstrap web | `index.html` | `style.css`, services, `app.js`, `sw.js` | Cache-bust atual esta em `1.0.16-estavel-plan-profile-rings`. | medium |
| Runtime principal | `app.js` | DOM global, `localStorage`, `sessionStorage`, Supabase REST, services carregados no window | Ponto mais acoplado do sistema. | critical |
| Visual global | `style.css` | classes emitidas por `app.js`, temas via CSS variables | Muito grande, com historico de hotfixes. | critical |
| PWA cache | `sw.js` | assets raiz e `dist/` | Versionado e limpa caches antigos. | medium |
| Storefront services | `src/storefront/services/*` | Supabase REST port, tipos, adapters | Ja e fronteira modular aproveitavel. | safe |
| Storefront adapters | `src/storefront/adapters/*` | tipos de storefront | Pode ser base para extrair renderizacao depois. | safe |
| Planos storefront | `src/storefront/plans/storefrontPlanRules.ts` | regras de plano | Ajuda a reduzir acoplamento futuro. | safe |
| Backend fiscal/financeiro | `supabase/migrations/*` | RLS/funcoes/tabelas | Estrutura future-ready existente. | high-risk |
| APK/PWA | `android/`, `capacitor.config.json`, `downloads/update.json` | build web e Capacitor | Precisa versionamento sincronizado. | high-risk |

## Layouts Mapeados

| Layout | Evidencia | Estado | Risco |
| --- | --- | --- | --- |
| `sidebar` | `renderMenuLateral`, `.side-menu`, `sidebarCollapsed` | ativo | medium |
| `drawer` | `renderDrawerLateral`, `.side-drawer`, `.side-drawer-backdrop` | ativo | high-risk em touch/overlay |
| `topbar` | `renderTopbar`, `.topbar`, menu de perfil em `#popup` | ativo | medium |
| `bottom-nav` | `renderMobileBottomNav`, `.mobile-bottom-nav` | ativo | high-risk em safe-area/PWA |
| `modal-layer` | `#popup`, `.modal-backdrop`, `.modal-card` | ativo, nao formalizado | critical |
| `toast-layer` | `mostrarToast`, `#toastArea`, `.app-toast` | ativo | medium |
| `overlay-layer` | `#popup`, intro overlay, drawers, profile panels | ativo, concorrente | critical |

## Modulos Funcionais

| Modulo | Entrada/Render | Estado | Dependencias Perigosas |
| --- | --- | --- | --- |
| `dashboard` | `renderDashboard`, `renderDashboardPwaTechnical`, `renderDashboardApkSimple` | ativo | decide layout por PWA/mobile dentro do render |
| `pedidos` | `renderPedido`, `renderPedidoStatusChips`, modais/confirmacoes | ativo | muitos handlers inline e estado global de pedido |
| `clientes` | `renderTela("clientes")` e funcoes relacionadas | ativo | DOM direto e dados globais |
| `caixa` | sessoes/movimentos em `app.js`, migrations Supabase | ativo | financeiro deve continuar centralizado e protegido |
| `storefront` | `renderTela("lojaPublica")`, `renderStorePublic*` | ativo | admin controls podem coexistir com publico se flag falhar |
| `store-editor` | `renderStorefrontAdminStandalone`, `renderStorefrontAdmin*` | ativo | muito render ainda no `app.js` |
| `planos` | `renderAssinatura`, `setPlansModernTab`, regras SaaS | ativo | sincronizacao frontend/backend/webhook |
| `configuracoes` | `renderTela` + telas de config/empresa/aparencia | ativo | CSS global e handlers inline |

## Dependencias Ocultas e Acoplamentos

### DOM direto

Encontrado uso amplo de:

- `document.getElementById`
- `document.querySelector`
- `document.querySelectorAll`
- `innerHTML`
- `document.body.appendChild`

Classificacao: `CRITICAL` para renderizacao e modais, `HIGH-RISK` para formularios, `SAFE` apenas quando restrito a componentes pequenos.

### Estado global

Estados globais sensiveis:

- `telaAtual`
- `appConfig`
- `billingConfig`
- `usuarioAtualEmail`
- `adminLogado`
- arrays de pedidos/clientes/estoque/caixa
- estado de storefront/admin/popup/drawer
- `window.__...` flags temporarias

Classificacao: `CRITICAL` para App Shell, planos, caixa e storefront.

### Listeners fora de ciclo isolado

Encontrados listeners globais para:

- `popstate`
- `beforeunload`
- `touchstart`, `touchmove`, `touchend`, `touchcancel`
- `pointerdown`, `pointermove`, `pointerup`, `pointercancel`
- `click`, `keydown`
- timers de sessao

Risco: listeners podem sobreviver a renders, interferir no scroll/touch e duplicar comportamento se inicializados mais de uma vez.

## Classificacao Atual Sem Mover

| Item | Classificacao | Motivo |
| --- | --- | --- |
| `app.js` | `CRITICAL ACTIVE` | fonte principal de render/estado |
| `style.css` | `CRITICAL ACTIVE` | fonte principal de layout/tema |
| `sw.js` | `ACTIVE` | cache PWA atual |
| `src/storefront` | `ACTIVE MODULARIZATION-SEED` | base modular segura |
| `scripts/test-*` | `ACTIVE QA` | anti-regressao |
| `storefront-preview/` | `EXPERIMENTAL/IGNORED` | ja ignorado no git |
| `rollback/` | `ROLLBACK/IGNORED` | nao commitar |
| `backups/` | `BACKUP/IGNORED` | nao commitar |
| screenshots raiz `simplifica_*.png` | `DEPRECATED LOCAL ARTIFACT` | ignorados por `.gitignore` |

## Recomendacao de Ordem Para a Proxima Fase

1. Formalizar `modal-layer`, `overlay-layer` e `toast-layer` antes de mexer em telas.
2. Criar tokens de z-index e substituir primeiro overlays/drawers/toasts.
3. Isolar scroll oficial do App Shell antes de refatorar telas internas.
4. Extrair Storefront/Admin por blocos pequenos, mantendo `src/storefront` como base.

