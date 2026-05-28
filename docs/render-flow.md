# Render Flow - Fase 1B

Data: 2026-05-27

Escopo: compreender a renderizacao atual antes de reorganizar arquivos.

## Fluxo Principal Atual

```txt
index.html
 ├── carrega style.css
 ├── carrega services em src/services
 ├── carrega app.js
 └── registra sw.js

app.js
 └── renderApp()
      ├── valida trava local / auth / onboarding
      ├── aplicarPersonalizacao()
      ├── decide mobile via isMobile()
      ├── renderMobile() OU renderDesktop()
      ├── atualiza menu
      ├── renderCalculadoraFlutuante()
      ├── sincronizarBannersSeNecessario()
      ├── sincronizarStorefrontBetaAccessRemoto(false)
      ├── hidratarLojaPublicaSeNecessario()
      ├── preencherImpressoras()
      ├── preencherMateriaisCalculadora()
      ├── aplicarMotionSequenciado()
      └── hidratarLojaOnlineAdmin()
```

## Fase 2A - App Shell de Camadas

Infraestrutura adicionada em coexistencia com o runtime legado:

```txt
app-shell
 ├── app-sidebar        vazio nesta fase
 ├── app-topbar         vazio nesta fase
 ├── app-content
 │    └── app           render atual continua aqui
 ├── overlay-layer      nova camada global preparada
 ├── drawer-layer       nova camada global preparada
 ├── modal-layer        nova camada global preparada
 └── toast-layer        camada usada por mostrarToast()
```

O `#popup` continua existindo como camada legada para modais/drawers ainda nao migrados. A regra desta fase e coexistencia segura, nao migracao completa.

Handlers globais criados:

```txt
openModal()/closeModal()
openDrawer()/closeDrawer()
showOverlay()/hideOverlay()
showToast()/hideToast()
```

Responsabilidade atual:

- `toast-layer`: ja recebe `#toastArea`.
- `modal-layer`: ja recebe o modal leve de documentos legais (`abrirDocumentoLegal`).
- `drawer-layer`: ja recebe o drawer lateral mobile (`abrirDrawerLateral`).
- `overlay-layer`: ja fornece o scrim central para modal/drawer migrados.
- `#popup`: permanece como fallback legado.

## Fase 2B - Primeira Migracao Controlada

Itens migrados para as novas camadas:

```txt
abrirDocumentoLegal()
 └── openModal({ content, size:"wide" })
      ├── modal-layer
      └── overlay-layer

abrirDrawerLateral()
 └── openDrawer({ content: renderDrawerLateral() })
      ├── drawer-layer
      └── overlay-layer
```

O que continua legado:

- Fluxos de pedidos.
- Editor/storefront admin.
- Planos e billing.
- Confirmacoes criticas.
- Modais de IA/desbloqueio/admin sob demanda.

Regra a partir daqui: novo modal/drawer deve usar `openModal()`/`openDrawer()`. `#popup` fica apenas para migracoes pendentes.

## Fase 2C - Scroll Principal

Fluxo visual consolidado:

```txt
ensureAppShellLayers()
 └── body.app-shell-ready
      └── #app-shell
           ├── #app-content  <- scroller principal
           │    └── #app
           ├── #overlay-layer
           ├── #drawer-layer
           ├── #modal-layer
           └── #toast-layer
```

Quando uma camada visual abre:

```txt
openModal/openDrawer/showOverlay
 └── setAppLayerContent()
      └── syncAppShellLayerState()
           └── body.app-layer-open
                └── #app-content overflow bloqueado temporariamente
```

O desktop PWA deixa de usar `.desktop-main` como scroller principal. O objetivo e reduzir scrolls concorrentes sem migrar ainda os fluxos criticos.

## Fluxo Desktop

```txt
renderDesktop()
 ├── se telaAtual == "lojaPublica" -> renderTela("lojaPublica")
 ├── se telaAtual == "lojaAdmin" -> renderStorefrontAdminStandalone()
 ├── se auth desktop -> renderAdmin()
 └── desktop-shell
      ├── renderMenuLateral()
      └── desktop-main app-content
           ├── renderTopbar()
           └── renderDesktopConteudo()
                ├── bloqueio acesso -> renderAcessoNegado()
                ├── telas configuracao -> renderTela(telaAtual)
                ├── telas comuns -> renderTela(telaAtual)
                └── dashboard -> renderDashboard()
```

## Fluxo Mobile

```txt
renderApp()
 └── renderMobile()
      ├── render de tela atual
      ├── renderDrawerGestureRail()
      └── renderMobileBottomNav()

acao menu
 └── renderDrawerLateral()
      └── #popup
           └── .side-drawer-backdrop
                └── .side-drawer
```

Observacao: mobile ja existe, mas ainda nao e um App Shell formal separado. O drawer e o bottom-nav passam por `#popup` e classes globais.

## Fluxo Storefront Publico

```txt
rota /:slug ou /loja/:slug
 └── telaAtual = "lojaPublica"
      └── renderTela("lojaPublica")
           └── renderStorePublic*
                ├── renderStorePublicHeader()
                ├── renderStorePublicBanner()
                ├── renderStorePublicCategoryBar()
                ├── renderStorePublicGrid()
                ├── renderStorePublicProductCard()
                ├── renderStorePublicProductDetail()
                ├── renderStorePublicBenefits()
                ├── renderStorePublicTestimonials()
                └── renderStorePublicFooter()
```

### Modo admin contextual

```txt
storefront publico
 └── getStorefrontPublicMode(vm)
      └── admin true
           ├── renderStoreAdminControls()
           ├── abrirStoreContextSheet()
           ├── abrirStoreVisualPanel()
           └── abrirStorefrontAdminRoute()
```

Risco: controles de admin sao condicionais no render publico. Deve permanecer testado para nao aparecer ao cliente final.

## Fluxo Store Editor / Admin

```txt
renderDesktop()
 └── telaAtual == "lojaAdmin"
      └── renderStorefrontAdminStandalone()
           └── storefront-admin-standalone
                └── storefront-admin-page
                     ├── tabs/admin shell
                     ├── editor panel
                     ├── preview container
                     └── sticky actions
```

Risco: preview, editor e admin ainda compartilham bastante CSS global e estado em `app.js`.

## Fluxo Pedidos / Modal / Detalhes

```txt
admin
 └── renderTela("pedido"|"pedidos")
      ├── renderPedido()
      │    ├── tabs cliente/itens/producao/financeiro
      │    ├── order item cards
      │    ├── multiselecao
      │    └── bottom bar
      └── visualizarPedido()
           └── #popup
                └── modal-backdrop
                     └── modal-card
```

## Fluxo Caixa

```txt
pedido com entrada
 └── fecharPedido()/fluxo financeiro
      ├── sessao automatica de caixa
      ├── movimentos de caixa
      ├── resumo visual
      └── auditoria interna
```

Risco: esta area tem regras financeiras future-ready. Evitar refatoracao visual que mude sem querer idempotencia, sessoes ou movimento.

## Camadas de Overlay Atuais

```txt
body
 ├── #app-shell
 │    ├── #app-content
 │    │    └── #app
 │    ├── #overlay-layer
 │    ├── #drawer-layer
 │    ├── #modal-layer
 │    └── #toast-layer
 ├── #popup
 │    ├── modal-backdrop
 │    ├── side-drawer-backdrop
 │    ├── profile-panel-backdrop
 │    └── operational-drawer-backdrop
 ├── #toastArea
 ├── introOverlay
 └── floating widgets
```

Risco principal: `#popup` atua como modal-layer, drawer-layer, overlay-layer e menu-layer ao mesmo tempo.

## Pontos de Renderizacao Dupla a Vigiar

| Ponto | Motivo | Risco |
| --- | --- | --- |
| `lojaPublica` vs `lojaAdmin` | Storefront publico e admin standalone coexistem no mesmo runtime | admin vazando no publico |
| `renderDashboardPwaTechnical` vs `renderDashboardApkSimple` | dashboard alterna por perfil PWA/mobile | experiencia diferente entre app/web |
| `renderMobile` vs `renderDesktop` | bifurcacao por `isMobile()` | resize/orientacao pode re-renderizar com estado preso |
| `#popup` | usado para drawer, modal, perfil e admin visual | overlays concorrentes |
| `renderizarPreservandoScroll` | preserva scroll em re-render | scroll errado se containers mudam |

## Fase 4A - Storefront, Editor e Preview

Contrato novo, iniciado sem migracao pesada de runtime:

```txt
storefront publico
 └── modules/storefront
      └── render publico/catalogo/carrinho

store editor
 └── modules/store-editor
      └── configuracao/blocos/publicacao

store preview
 └── modules/store-preview
      └── preview isolado com scroll visual proprio
```

Regras desta fase:

- storefront publica continua seguindo `#app-content`;
- preview deve usar contrato de isolamento e nao controlar shell global;
- novos modais/drawers da loja devem usar `#modal-layer`, `#drawer-layer` e `#overlay-layer`;
- `#popup` permanece apenas como fallback legado.

## Fase 4B - Adapter de renderizacao

```txt
renderTela("lojaPublica")
 └── renderLojaOnlinePublica()
      └── renderStorefrontView({ mode: "public" })
           ├── source "v2" -> renderStorefrontPublicV2()
           └── source "legacy" -> renderStorefrontPublicLegacy()

renderTela("lojaAdmin")
 └── renderStorefrontAdminPanel()
      └── renderStorefrontView({ mode: "editor" })

renderStorefrontPreview()
 └── renderStorefrontView({ mode: "preview" })
```

Regra: novas chamadas devem passar pelo adapter. A renderizacao antiga permanece como `Legacy` para rollback controlado.

## Fase 4C - Fluxo do editor profissional

```txt
renderTela("lojaAdmin")
 └── renderStorefrontAdminStandalone()
      └── renderStorefrontAdminPanel()
           └── renderStorefrontView({ mode: "editor" })
                └── renderStorefrontAdminPanelLegacy()
                     └── store-editor-shell
                          ├── store-editor-sidebar
                          │    ├── store-editor-sidebar-card
                          │    └── renderStorefrontTabs(activeTab)
                          └── store-editor-workspace
                               ├── store-editor-header
                               │    └── renderStorefrontEditorActionGroups()
                               └── store-editor-main
                                    └── store-editor-sections
```

Quando a aba ativa possui preview, `renderStorefrontPreview()` continua passando pelo adapter e gera `store-preview-panel` dentro do conteudo da aba. Assim o preview fica visualmente lateral/empilhado, mas sem controlar o shell principal.

## Fase 4D - Render por aba

```txt
renderStorefrontAdminPanelLegacy()
 ├── render da aba ativa
 └── renderStoreEditorTabContent(activeTab, bodyContent, vm)
      ├── has-inline-preview -> usa preview que a aba ja renderiza
      └── has-preview-panel
           ├── store-editor-tab-main
           └── renderStorefrontPreview(vm)
```

Esse fluxo evita preview duplicado em `overview`, `appearance` e `banner`, mas garante que `products`, `categories`, `leads`, `qrcode` e `settings` tenham a mesma estrutura visual do editor profissional.

## Fase 4E - Fluxo modular do editor

```txt
index.html
 ├── modules/store-editor/storeEditorRenderer.js
 ├── modules/store-editor/storeEditorTabs.js
 ├── modules/store-editor/storeEditorPreview.js
 ├── modules/store-editor/storeEditorProducts.js
 └── app.js
      └── renderStorefrontView({ mode: "editor" })
           └── renderStorefrontAdminPanelLegacy()
                └── renderStoreEditorTabContent(activeTab, bodyContent, vm)
                     ├── SimplificaStoreEditor.renderer.renderTabContent(...)
                     └── fallback local legado se o modulo nao estiver disponivel
```

O contrato visual continua o mesmo: `store-editor-tab-panel`, `has-inline-preview`, `has-preview-panel`, `store-preview-device`, `store-preview-scroll` e `storefrontProductForm` permanecem presentes. A extracao e uma ponte: reduz acoplamento sem alterar regras de negocio nem remover o fluxo legado.

`build:web` copia os modulos formais para `dist/modules`, entao o build final publica os mesmos helpers que o ambiente local referencia no `index.html`.

## Fase 4F - Caminho module/fallback

```txt
renderStoreEditorTabContent(...)
 ├── getStoreEditorNamespace()
 │    ├── namespace completo -> renderer modular
 │    │    └── data-store-editor-renderer="module"
 │    └── namespace incompleto/ausente -> fallback local
 │         └── data-store-editor-renderer="fallback"
```

O service worker faz precache de `modules/store-editor/*.js` e ignora cache para esses caminhos durante fetch, da mesma forma que `app.js`, `style.css` e `sw.js`. Isso reduz risco de PWA carregar index/app novo com helpers antigos, ou o contrario.

## Fase 4G - Fallback minimo

```txt
renderStoreEditorTabContent(...)
 ├── isStoreEditorModuleReady(namespace)
 │    ├── true  -> renderer modular 4G
 │    └── false -> fallback minimo
 │         ├── aviso de compatibilidade
 │         ├── conteudo administrativo da aba
 │         └── sem preview automatico duplicado no app.js
```

O `app.js` nao replica mais `previewTitles` nem a regra completa de preview lateral no fallback. O caminho rico vive em `modules/store-editor`; o fallback local fica propositalmente pequeno para manter operacao basica e rollback.

## Sequencia Segura Para App Shell

1. Criar camada central de `overlay-layer/modal-layer/toast-layer`.
2. Migrar `#popup` para roteamento interno de overlay, sem trocar comportamento externo.
3. Padronizar scroll do shell.
4. Migrar desktop e mobile para o mesmo shell.
5. So entao extrair telas.
