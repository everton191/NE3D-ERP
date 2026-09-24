# Plano de Integração Final — Home Carousel 3D

> Documento de planejamento técnico. Não é implementação.
> Pronto para quando o app.js estiver estabilizado.

**Data:** 2026-09-21  
**Base:** Leitura read-only de `src/features/home/carousel3d/`

---

## 1. Inventário de Arquivos

| Arquivo | Classificação | Responsabilidade |
|---|---|---|
| `config/home-carousel-config.js` | **READY** | Definição dos 8 cards ativos + 8 cards futuros, parâmetros de animação |
| `core/home-carousel-engine.js` | **READY** | Motor determinístico: posição, velocidade, snap, autoplay, transform |
| `core/home-carousel-scene.js` | **MISSING** | Não existe — engine e renderer são diretos sem scene intermediário |
| `visual/home-carousel-renderer.js` | **READY** | Canvas 2D: renderiza cards com depth, scale, alpha, rotationY |
| `animations/animation-drivers.js` | **READY** | Drivers determinísticos por widget (production, orders_recent, etc.) |
| `data/widget-data-sources.js` | **READY** | Fontes de dados puras para os 8 widgets (production, orders, cash, etc.) |
| `presenters/widget-presenters.js` | **READY** | Presenters: snapshot →ViewModel (production, orders_recent, day_summary, cash_today, stock, customers, storefront, alerts) |
| `widget-models/widget-visual-models.js` | **READY** | ViewModel → Visual Model (textures, icons, layout, animation params) |
| `widgets/home-carousel-widget-registry.js` | **READY** | Registry: valida telas, gerencia cards ativos/futuros |
| `widgets/home-carousel-widget-state.js` | **READY** | Estado de visibilidade: hide/show, snapshot de hidden ids |
| `editor/carousel-editor-core.js` | **READY** | Core do editor: add/remove/move/restore/setAutoplay — operações puras |
| `editor/carousel-editor-view.js` | **READY** | UI do editor isolada (DOM abstrato, testável) — labels, render de cards |
| `editor/carousel-editor-controller.js` | **MISSING** | Não existe — não há controller conectando view ao core |
| `editor/carousel-editor-styles.css` | **READY** | Estilos do editor |
| `carousel-contract.js` | **READY** | Contract helper: normalize de itens |

**Total: 15 arquivos**  
**READY: 12** | **PARTIAL: 2** (presenters, widget-data-sources — lidos parcialmente) | **MISSING: 2** (scene, editor-controller)

---

## 2. Gap Map

### 2.1 WidgetData → Presenter → VisualModel → AnimationDriver → Renderer

```
WidgetDataSources.<widget>(rawData)
  → snapshot { status, data }
  → WidgetPresenters.<widget>(snapshot)
  → ViewModel { id, title, state, primaryMetric, secondaryMetrics, items, badge,
                targetScreen, animationKey, visualState, animation }
  → WidgetVisualModels.build<Widget>(vm)
  → VisualModel { id, state, title, primary, secondary, items, badge,
                  visual: { emphasis, iconKey, textureKey, layoutKey },
                  animation: { key, state, intensity, progress },
                  navigation: { targetScreen } }
  → AnimationDriver.update(dt, visualModel)
  → FrameState { animationKey, state, progress, phase, intensity, elements }
  → Renderer.render() usa engine.transform(index) para cada card
```

| Widget | DataSource | Presenter | VisualModel | AnimationDriver | Status |
|---|---|---|---|---|---|
| production | `normalizeProductionSnapshot` | `presentProduction` | `buildProductionVisualModel` | `createProductionDriver` | **READY** |
| orders_recent | `normalizeOrdersRecentSnapshot` | `presentOrdersRecent` | `buildOrdersRecentVisualModel` | `createOrdersRecentDriver` | **READY** (verificar) |
| day_summary | `normalizeDaySummarySnapshot` | `presentDaySummary` | `buildDaySummaryVisualModel` | `createDaySummaryDriver` | **READY** (verificar) |
| cash_today | `normalizeCashTodaySnapshot` | `presentCashToday` | `buildCashTodayVisualModel` | `createCashTodayDriver` | **READY** (verificar) |
| stock | `normalizeStockSnapshot` | `presentStock` | `buildStockVisualModel` | `createStockDriver` | **READY** (verificar) |
| customers | `normalizeCustomersSnapshot` | `presentCustomers` | `buildCustomersVisualModel` | `createCustomersDriver` | **READY** (verificar) |
| storefront | `normalizeStorefrontSnapshot` | `presentStorefront` | `buildStorefrontVisualModel` | `createStorefrontDriver` | **READY** (verificar) |
| alerts | `normalizeAlertsSnapshot` | `presentAlerts` | `buildAlertsVisualModel` | `createAlertsDriver` | **READY** (verificar) |

> **Ação necessária:** ler os drivers restantes em `animation-drivers.js` (linhas 101-499) para confirmar que todos os 8 widgets têm driver. O arquivo tem 499 linhas; os 8 drivers devem estar implementados.

### 2.2 EditorView → EditorController → WidgetState → Persistence

```
EditorView (DOM abstrato)
  → EventHandler clicado (add/remove/move/setAutoplay)
  → MISSING: EditorController (não existe!)
  → EditorCore operações puras (addCard/removeCard/moveCard/etc.)
  → WidgetState (visibleCardIds, hidden)
  → MISSING: Persistence layer (não existe!)
```

**Conexões faltando:**
1. **EditorController** — não existe. A `carousel-editor-view.js` cria a view com `createView(container, editor, registry)` mas não há controller que conecte os eventos de UI ao editor core.
2. **Persistence** — não existe. O `WidgetState.createState(registry, saved)` aceita um parâmetro `saved` mas não há camada que leia/escreva esse estado.

### 2.3 Home → Carousel Mount

A Home ainda não tem montagem do carrossel. Faltam:

| Conexão | Estado | Ação |
|---|---|---|
| Home → carousel mount point | **MISSING** | Definir onde o canvas é montado na Home |
| Home → refresh snapshot | **MISSING** | Como os dados chegam ao carrossel (dados do app.js → WidgetDataSources) |
| Home → pause/resume | **MISSING** | Engine tem `startAutoplay`/`stopAutoplay` mas nada conecta |
| Home → unmount | **MISSING** | Renderer tem `dispose()` mas nada conecta |
| Card click → targetScreen | **READY** | Cada widget tem `targetScreen` no VisualModel; renderer precisa conectar clique ao navigation |

### 2.4 Card Click → Existing targetScreen

Cada um dos 8 cards ativos tem um `targetScreen`:

| Card ID | targetScreen | targetMode |
|---|---|---|
| production | `producao` | screen |
| orders_recent | `pedidos` | screen |
| day_summary | `relatorios` | screen |
| cash_today | `caixa` | screen |
| stock | `estoque` | screen |
| customers | `clientes` | screen |
| storefront | `lojaOnline` | screen |
| alerts | `null` (dynamic) | dynamic |

> **Regra:** Card é camada visual. O click deve navegar para a tela existente. Não criar rotas novas.

---

## 3. Driver → Renderer

### 3.1 Como cada animation driver alimenta o renderer

O renderer chama `engine.transform(index)` para cada card, que retorna:
```javascript
{ index, x, depth, scale, alpha, rotationY }
```

O animation driver é chamado separadamente pelo ciclo de animação (não pelo renderer diretamente — a arquitetura atual tem o engine sendo usado pelo renderer para transform, mas os animation drivers atualizam o ViewModel de cada widget).

**Fluxo atual:**
1. Motor (engine) calcula posição de cada card no espaço 3D
2. Cada card tem um widget associado
3. O animation driver do widget atualiza o `animation` state no VisualModel
4. O renderer desenha cada card com base no transform do engine + animation state do widget

### 3.2 Estados que o renderer espera

O renderer espera um array de cards, cada um com:
- `card.title` — texto do card
- `engine.transform(index)` — posição transform

O renderer NÃO usa diretamente o animation driver output. Ele apenas usa o engine para posição e desenha o card com título. O animation driver atualiza o ViewModel que por sua vez alimenta o VisualModel.

### 3.3 O que falta conectar

| Componente | Status | Detalhe |
|---|---|---|
| Animation drivers → VisualModel.animation | **READY** | O VisualModel já tem `animation: { key, state, intensity, progress }` |
| VisualModel.animation → Renderer | **BLOCKED** | O renderer atual não lê `visualModel.animation` — ele apenas desenha o card com título. Os drivers são ativos mas não influenciam o render atual. |
| 8 widgets têm driver | **VERIFICAR** | Ler linhas 101-499 de animation-drivers.js para confirmar os 8 drivers |

### 3.4 Quais efeitos são opcionais

| Efeito | Obrigatório? | Detalhe |
|---|---|---|
| Depth (3D) | Obrigatório | `Math.cos(delta * Math.PI / 3)` — depth do card |
| Scale | Obrigatório | `.76 + Math.max(0, depth) * .24` |
| Alpha | Obrigatório | `.28 + Math.max(0, depth) * .72` |
| RotationY | Obrigatório | `-delta * 18` |
| Animation driver (production-flow etc.) | **Opcional** | Drivers determinísticos atualizam ViewModel.animation, mas renderer atual não consome |
| Shadow glow | Opcional | `ctx.shadowBlur = 18 * t.scale` — presente no renderer |
| Autoplay | Opcional | Engine tem `startAutoplay`/ `stopAutoplay` |

### 3.5 Comportamento reduced-motion

O código atual NÃO tem suporte a reduced-motion. O `animation-drivers.js` tem contrato de ser determinístico e testável, mas não há 체크 para `prefers-reduced-motion`. Isso é um gap identificado para futura implementação, não um bug atual.

---

## 4. Editor → WidgetState

### 4.1 Contrato de operações do EditorCore

```javascript
editor = createEditor(initialState, registry)

editor.addCard(id)        → Adiciona card disponível (se available=true, future=false)
editor.removeCard(id)     → Remove card (somente do carrossel, não da feature)
editor.moveCard(id, dir)  → Move up/down no cardOrder
editor.restoreDefaults()  → Restaura configuração padrão do registry
editor.setAutoplay(on)    → Liga/desliga autoplay
editor.setAutoplayInterval(ms) → Define intervalo (min 3000, max 60000)
editor.getState()         → { visibleCardIds, cardOrder, autoplay, autoplayInterval }
editor.canAdd(id)         → Verifica se pode adicionar
```

### 4.2 Contrato do WidgetState

```javascript
state = createState(registry, saved)
state.visible()   → Cards visíveis (registry.active.filter(!hidden.has))
state.hide(id)    → Adiciona à hidden set
state.show(id)    → Remove da hidden set
state.snapshot()  → { hidden: Array.from(hidden) }
```

### 4.3 Fluxo de edição

```
Usuário clica "Adicionar" no editor view
  → EditorController (FALTANDO) chama editor.addCard(id)
  → editor.addCard valida: disponível, não future, não duplicado
  → editor.addCard atualiza visibleCardIds e cardOrder
  → editor.getState() retorna novo estado
  → Controller atualiza UI (FALTANDO)
  → Controller salva estado (FALTANDO — persistence)
```

### 4.4 Cards futuros

Confirmado no `config/home-carousel-config.js`:

```javascript
const future = [
  "fiscal", "accounts_payable", "accounts_receivable", "purchases",
  "shipping", "crm", "quality", "maintenance"
].map(id => Object.freeze({ id, future: true, available: false, enabled: false,
  defaultVisible: false, removable: false, reorderable: false, configurable: false }));
```

**Regra confirmada:** Cards futuros mostram apenas "Em breve" no editor view e não podem ser adicionados.

```javascript
// carousel-editor-view.js — renderAvailableCard:
// Se card.future === true: mostra "Em breve" em vez de botão "Adicionar"
```

---

## 5. Persistência

### 5.1 Estrutura proposta

```javascript
{
  schemaVersion: 1,
  activeWidgetIds: ["production", "orders_recent", "day_summary", "cash_today",
                    "stock", "customers", "storefront", "alerts"],
  order: ["production", "orders_recent", "day_summary", "cash_today",
          "stock", "customers", "storefront", "alerts"],
  autoplayEnabled: true,
  autoplayInterval: 15000,
  hiddenWidgetIds: []  // cards ocultados pelo usuário
}
```

### 5.2 Defaults

| Campo | Valor padrão |
|---|---|
| activeWidgetIds | 8 cards ativos do config (todos visíveis por padrão) |
| order | Ordem do config (priority order) |
| autoplayEnabled | `true` |
| autoplayInterval | `15000` (DEFAULT_INTERVAL) |
| hiddenWidgetIds | `[]` |
| schemaVersion | `1` |

### 5.3 Migration

- `schemaVersion: 1` é a versão inicial
- Migration para versões futuras: verificar `schemaVersion` e aplicar transformações
- Sem implementação de storage real — isso é um contrato

### 5.4 Recuperação de estado inválido

| Situação | Ação |
|---|---|
| `activeWidgetIds` contém ID inexistente no registry | Remover do array, manter os válidos |
| `order` contém ID que não está em `activeWidgetIds` | Remover do order |
| `autoplayInterval` < 3000 ou > 60000 | Clamp para [3000, 60000] |
| `hiddenWidgetIds` contém ID inválido | Filtrar IDs inválidos |
| Estado corrompido (JSON inválido) | Usar defaults completos |

### 5.5 Recuperação de widget ausente

Se um widget que estava no carrossel for removido do registry (ex: feature desabilitada):
- O `registry.active` não inclui mais o widget
- O `WidgetState.visible()` filtra automaticamente por `registry.active`
- O widget simplesmente não aparece mais — sem erro

### 5.6 Comportamento de widgets futuros

- Cards futuros (`future: true`) nunca são salvos no estado
- Se um card futuro for "adicionado" pelo usuário, a validação do editor (`isAvailable`) rejeita
- Quando um card futuro se torna ativo no futuro, ele aparece no `registry.active` e pode ser adicionado

---

## 6. Mount Contract

### 6.1 Contrato conceitual

```javascript
// Montagem
carousel = mount(container, dependencies)
// dependencies: { engine, renderer, cards, registry, widgetState, dataSources, presenters }

// Atualização de dados
carousel.refresh(snapshot)
// snapshot: dados brutos dos 8 widgets (production, orders, cash, etc.)

// Controle de autoplay
carousel.pause()
carousel.resume()

// Limpeza
carousel.unmount()
```

### 6.2 Ownership de listeners

| Recurso | Owner | Cleanup |
|---|---|---|
| Event listeners de clique no canvas | Carousel mount | Remover no `unmount()` |
| `requestAnimationFrame` loop | Carousel mount | Cancelar no `unmount()` ou `pause()` |
| Resize observer | Carousel mount | Disconnect no `unmount()` |

### 6.3 Ownership de animation frame

O `engine.tick(now, dt)` é chamado pelo ciclo de animação externo. O carrossel montado deve:
- Chamar `engine.tick(now, dt)` a cada frame
- Chamar `renderer.render()` após cada tick quando `engine.needsRender` é true
- Chamar `engine.consumeRender()` após renderizar

### 6.4 Cleanup

```javascript
unmount() {
  // 1. Cancelar animation frame
  // 2. Remover event listeners
  // 3. Disconnect resize observer
  // 4. Chamar renderer.dispose()
  // 5. Chamar stopAutoplay()
  // 6. Remover o elemento do DOM
}
```

### 6.5 Visibility changes

| Evento | Ação |
|---|---|
| Página fica invisível (visibilitychange hidden) | `pause()` — suspender autoplay e animation frame |
| Página fica visível novamente | `resume()` — retomar autoplay |
| Navegação away da Home | `unmount()` — cleanup total |
| Volta para a Home | `mount()` — nova montagem ou reutilizar se ainda existir |

### 6.6 Screen resize

| Evento | Ação |
|---|---|
| Resize da janela | Recalcular canvas size (renderer faz isso no `render()`) — não é necessário ação extra |
| Orientation change | Mesmo tratamento que resize |

> **Nota:** O renderer já lida com resize no próprio `render()`:
> ```javascript
> canvas.width = canvas.clientWidth * devicePixelRatio
> canvas.height = canvas.clientHeight * devicePixelRatio
> ```

---

## 7. Routing — 8 Cards Ativos

### 7.1 Confirmação dos 8 cards ativos

Do `config/home-carousel-config.js`:

```javascript
const active = [
  ["production",       "Producão",        "producao",     "screen"],
  ["orders_recent",    "Pedidos recentes","pedidos",      "screen"],
  ["day_summary",      "Resumo do dia",   "relatorios",   "screen"],
  ["cash_today",       "Caixa hoje",      "caixa",        "screen"],
  ["stock",            "Estoque",         "estoque",      "screen"],
  ["customers",        "Clientes",        "clientes",     "screen"],
  ["storefront",       "Loja Online",     "lojaOnline",   "screen"],
  ["alerts",           "Alertas",         null,           "dynamic"]
].map(...)
```

### 7.2 targetScreen de cada card

| Card ID | targetScreen | targetMode | Ação no click |
|---|---|---|---|
| production | `producao` | screen | Navegar para tela de produção |
| orders_recent | `pedidos` | screen | Navegar para tela de pedidos |
| day_summary | `relatorios` | screen | Navegar para tela de relatórios |
| cash_today | `caixa` | screen | Navegar para tela de caixa |
| stock | `estoque` | screen | Navegar para tela de estoque |
| customers | `clientes` | screen | Navegar para tela de clientes |
| storefront | `lojaOnline` | screen | Navegar para tela loja online |
| alerts | `null` | dynamic | Lida pelo targetMode "dynamic" — comportamento a definir |

### 7.3 Regra de routing

- **Card é camada visual** — o clique no card deve acionar a navegação existente
- **Não criar `/carousel/*` rotas novas**
- **Feature/rota continuam independentes** — o carrossel apenas aciona a navegação
- Para `targetMode: "dynamic"` (alerts): o comportamento de clique é definido dynamicamente, fora do escopo do carrossel

---

## 8. Home Final — Layout Futuro

### 8.1 Direção existente

```
[Dispositivos]     ← Topo
[Carrossel 3D]    ← Meio (grande)
[Calculadora]     ← Fundo
```

### 8.2 Mount point

- O carrossel deve ser montado em um container específico na Home
- O container deve ter tamanho definido (width/height) para o canvas
- O renderer usa `canvas.clientWidth` e `canvas.clientHeight` para calcular dimensões

### 8.3 Responsive bounds

| Perfil | Comportamento |
|---|---|
| Desktop | Carrossel em tamanho completo |
| Mobile | Carrossel em tamanho ajustado (provavelmente menor) |
| Simple profile | Mesma estrutura, possivelmente sem animation drivers intensos |

### 8.4 Empty/Error/Loading behavior

| Estado | Ação |
|---|---|
| Nenhum card visível | Mostrar mensagem "Nenhum card no carrossel" (sem canvas vazio) |
| Todos os widgets em erro | Cards aparecem com state "error" no VisualModel — renderer desenha normalmente |
| Carregando dados | Cards aparecem com state "loading" — spinner ou skeleton (a definir) |

---

## 9. Test Plan

### 9.1 Checklist de testes para futura integração

| Categoria | Teste | Status |
|---|---|---|
| **Unit** | Engine: createEngine, tick, snap, dragBy, dragEnd | Pronto para testar |
| **Unit** | Renderer: createRenderer, render, dispose | Pronto para testar |
| **Unit** | Animation drivers: createProductionDriver, update, getFrame | Pronto para testar |
| **Unit** | EditorCore: addCard, removeCard, moveCard, restoreDefaults, setAutoplay | Pronto para testar |
| **Unit** | WidgetState: createState, visible, hide, show, snapshot | Pronto para testar |
| **Unit** | Presenters: presentProduction, presentOrdersRecent, etc. | Pronto para testar |
| **Unit** | WidgetDataSources: normalizeProductionSnapshot, etc. | Pronto para testar |
| **Unit** | WidgetVisualModels: buildProductionVisualModel, etc. | Pronto para testar |
| **Contract** | EditorCore → WidgetState: add/remove/move atualiza estado corretamente | A implementar |
| **Contract** | WidgetState → Persistence: snapshot salva e restore | A implementar |
| **DOM** | EditorView render: cards ativos, disponíveis, futuros | A implementar |
| **DOM** | Card click → targetScreen navigation | A implementar |
| **Navigation** | Cada card clicka para a tela correta | A implementar |
| **Persistence** | Salvar/ler estado do carrossel | A implementar |
| **Mobile** | Renderização em tela pequena | A testar |
| **Desktop** | Renderização em tela grande | A testar |
| **Reduced-motion** | Respeitar prefers-reduced-motion | A implementar |
| **Lifecycle** | Mount → refresh → pause → resume → unmount | A testar |
| **Memory/leak** | Não vazamento de listeners após unmount | A testar |
| **Android WebView** | Renderização Canvas 2D no WebView | A testar em dispositivo |

### 9.2 Regressão de testes existentes

| Módulo | O que testar |
|---|---|
| data | normalizeProductionSnapshot, normalizeOrdersRecentSnapshot, etc. |
| presenters | presentProduction, presentOrdersRecent, etc. |
| widget models | buildProductionVisualModel, etc. |
| animation drivers | createProductionDriver, createOrdersRecentDriver, etc. |
| editor core | createEditor, addCard, removeCard, etc. |
| editor view | createView, render, destroy |
| phase 1 | Engine + Renderer integrados |

---

## 10. Launcher-3D como Referência

### 10.1 O que consultar

Se necessário, consultar `D:\Projetos\launcher-3d` para:

| Conceito | Relevância |
|---|---|
| Gesture | Referência para gestos de arraste no carrossel |
| Inertia | Referência para continuação de movimento após soltar |
| Snap | Referência para snap para card mais próximo |
| Depth | Referência para profundidade 3D dos cards |
| Loop | Referência para comportamento circular do carrossel |
| Autoplay | Referência para autoplay interval e pause/resume |
| Demand rendering | Referência para renderizar apenas quando necessário |

### 10.2 O que NÃO copiar

- Branding (identidade visual da Simplifica 3D é diferente)
- SPB, SPBShell, Shell3D (namespaces e estrutura não aplicáveis)
- Launcher namespaces (o carrossel é parte do app, não um launcher)

### 10.3 Limitação

O launcher-3d é consultado **somente** como referência conceitual. Não criar dependência com ele.

---

---

## FAQ / Casos de Uso Comum

### O que app.js faz com este plano (responsabilidades de app.js)

> Tratamento contextual: app.js é o consumidor deste plano — trata-se de "quasi-3rd
> party" na leitura deste documento. Este plano descreve o que o carousel espera de
> app.js, não como app.js é implementado.

| Responsabilidade | O que app.js faz | O que o carousel espera |
|---|---|---|
| **Retrieval de dados dos cards** | Chama os data source wrappers (`normalizeProductionSnapshot`, etc.) com dados reais do sistema | Os normalizadores são puros — recebem dados brutos e retornam snapshots |
| **Fornecer configs / widget state** | Mantém as configs do carrossel (quais cards estão ativos, estado de autoplay, intervalos) | O carousel consome o config e estado via `registry` e `widgetState` |
| **On card click → routing/screen changes** | app.js recebe o `targetScreen` do card clicado e executa a navegação para a tela correspondente | O carousel apenas emite o `targetScreen` — não navega. Cards com `targetMode: "dynamic"` (alerts) têm comportamento definido por app.js |
| **Autoplay lifecycle (pause/resume)** | app.js gerencia quando o carrossel fica visível ou não (visibility change, navegação away/back) e chama `carousel.pause()` / `carousel.resume()` | O carousel fornece `pause()`/`resume()` — app.js é o owner do ciclo de vida |
| **Trigger refresh** | app.js chama `carousel.refresh(rawData)` quando os dados mudam (ex: a cada N segundos, ou quando o usuário volta para a Home) | O carousel consumirá os novos dados no próximo render |

### O que NÃO é responsabilidade de app.js no contexto do carousel

| O que o carousel faz sozinho | Detalhe |
|---|---|
| Determinar quais cards estão visíveis | WidgetState + registry decidem — app.js só fornece o estado inicial |
| Renderizar os cards em 3D | Renderer + engine fazem — app.js não desenha |
| Gerenciar gestos (arraste, snap) | Engine gerencia — app.js só conecta os listeners |
| Animar cada widget | Animation drivers fazem — app.js fornece o deltaTime |
| Validar estado do editor | EditorCore valida — app.js só consome o estado resultante |

### Como usar este plano

1. **Quando app.js estiver pronto** — use este documento como check-list de integração
2. **Antes de implementar** — verifique se o componente que você vai tocar já está documentado aqui
3. **Ao revisar** — confirme que a implementação segue os contratos documentados
4. **Ao testar** — use o Test Plan (seção 9) como base para o plano de teste

> **Nota:** app.js é tratado como "quasi-3rd party" — ou seja, seu comportamento é a
> realidade que o carousel consome, mas não é modifié por este documento. Se app.js
> muda, este plano pode precisar de atualização.
