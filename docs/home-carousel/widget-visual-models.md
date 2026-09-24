# Esboço — Widget Visual Models (8 Widgets)

> Esboço técnico baseado no código real de `widget-visual-models.js`.
> Não é implementação. Atualizado em 2026-09-21.

---

## 1. Contrato geral

```javascript
function buildWidgetVisualModel(widgetId, viewModel) {
  // viewModel: ViewModel do presenter
  // → retorna VisualModel ou null se viewModel for null
}
```

### Input (Presenter ViewModel)

```javascript
{
  id, title, state, primaryMetric, secondaryMetrics, items,
  badge, targetScreen, animationKey, visualState
}
```

### Output (Visual Model)

```javascript
{
  id, state, title,
  primary, secondary, items, badge,
  visual: {
    emphasis: "high" | "medium" | "low",
    iconKey: "production-active",
    textureKey: "production-active",
    layoutKey: "production-belt"
  },
  animation: {
    key: "production-flow",
    state: "working",
    intensity: 1.0,    // 0.0 a 1.0
    progress: 0         // 0 a 1 (futuro)
  },
  navigation: {
    targetScreen: "producao"
  }
}
```

---

## 2. Production

```javascript
function buildProductionVisualModel(vm) {
  var vs = vm.visualState;
  return {
    id: vm.id,
    state: vm.state,
    title: vm.title,
    primary: vm.primaryMetric,
    secondary: vm.secondaryMetrics,
    items: [], // production não usa items
    badge: vm.badge,
    visual: {
      emphasis: vs === "working" ? "high" : vs === "queue" ? "medium" : "low",
      iconKey: PRODUCTION_ICONS[vs] || "production-idle",
      textureKey: PRODUCTION_TEXTURES[vs] || "production-idle",
      layoutKey: "production-belt"
    },
    animation: {
      key: vm.animationKey,       // "production-flow"
      state: vs,
      intensity: vs === "working" ? 1.0 : vs === "queue" ? 0.6 : vs === "blocked" ? 0.3 : 0.0,
      progress: 0
    },
    navigation: { targetScreen: vm.targetScreen }
  };
}
```

### Mappings

| visualState | emphasis | intensity | iconKey | textureKey |
|---|---|---|---|---|
| `working` | high | 1.0 | production-active | production-active |
| `queue` | medium | 0.6 | production-queue | production-queue |
| `ready-state` | low | 0.0 | production-done | production-ready |
| `idle` | low | 0.0 | production-idle | production-idle |
| `blocked` | low | 0.3 | production-idle | production-idle |

---

## 3. Orders Recent

```javascript
function buildOrdersRecentVisualModel(vm) {
  var vs = vm.visualState;
  return {
    id: vm.id,
    state: vm.state,
    title: vm.title,
    primary: vm.primaryMetric,
    secondary: vm.secondaryMetrics,
    items: mapItems(vm.items, function(item, index) {
      return {
        id: item.id,
        displayClient: item.displayClient,
        displayTotal: item.displayTotal,
        displayStatus: item.displayStatus,
        displayDeadline: item.displayDeadline,
        orderNumber: item.orderNumber,
        itemCount: item.itemCount,
        stackPosition: index,
        emphasis: index === 0 ? "high" : "normal"
      };
    }),
    badge: vm.badge,
    visual: {
      emphasis: vs === "has-orders" ? "medium" : "low",
      iconKey: "orders-card",
      textureKey: "orders-stack",
      layoutKey: "orders-stack-layout"
    },
    animation: {
      key: vm.animationKey,       // "order-stack"
      state: vs,
      intensity: vs === "has-orders" ? 0.8 : 0.0,
      progress: 0
    },
    navigation: { targetScreen: vm.targetScreen }
  };
}
```

### Mappings

| visualState | emphasis | intensity | iconKey | textureKey |
|---|---|---|---|---|
| `has-orders` | medium | 0.8 | orders-card | orders-stack |
| `empty` | low | 0.0 | orders-card | orders-stack |

---

## 4. Day Summary

```javascript
function buildDaySummaryVisualModel(vm) {
  var vs = vm.visualState;
  var bars = [];

  if (vm.primary) {
    bars.push({
      label: vm.primary.label,
      value: vm.primary.value,
      formatted: vm.primary.formatted,
      fillPercent: 100,
      color: "primary"
    });
  }

  if (vm.secondary) {
    vm.secondary.forEach(function(m, i) {
      bars.push({
        label: m.label,
        value: m.value,
        formatted: m.formatted,
        fillPercent: 0,        // preenchimento animado pelo driver
        color: i === 0 ? "secondary" : "tertiary"
      });
    });
  }

  return {
    id: vm.id,
    state: vm.state,
    title: vm.title,
    primary: vm.primaryMetric,
    secondary: vm.secondaryMetrics,
    items: bars,                  // as barras métricas
    badge: vm.badge,
    visual: {
      emphasis: vs === "active" ? "medium" : "low",
      iconKey: "summary-chart",
      textureKey: "summary-chart",
      layoutKey: "summary-bars-layout"
    },
    animation: {
      key: vm.animationKey,       // "metric-bars"
      state: vs,
      intensity: vs === "active" ? 0.7 : 0.0,
      progress: 0
    },
    navigation: { targetScreen: vm.targetScreen }
  };
}
```

### Mappings

| visualState | emphasis | intensity | iconKey | textureKey |
|---|---|---|---|---|
| `active` | medium | 0.7 | summary-chart | summary-chart |
| `idle` | low | 0.0 | summary-chart | summary-chart |

---

## 5. Cash Today

```javascript
function buildCashTodayVisualModel(vm) {
  var vs = vm.visualState;
  return {
    id: vm.id,
    state: vm.state,
    title: vm.title,
    primary: vm.primaryMetric,
    secondary: vm.secondaryMetrics,
    items: mapItems(vm.items, function(item) {
      return {
        id: item.id,
        type: item.type,
        value: item.value,
        formatted: item.formatted,
        emphasis: item.type === "entrada" ? "positive" : "negative"
      };
    }),
    badge: vm.badge,
    visual: {
      emphasis: vs === "open" ? "medium" : "low",
      iconKey: "cash-coins",
      textureKey: "cash-flow",
      layoutKey: "cash-dashboard-layout"
    },
    animation: {
      key: vm.animationKey,       // "cash-flow"
      state: vs,
      intensity: vs === "open" ? 0.6 : 0.0,
      progress: 0
    },
    navigation: { targetScreen: vm.targetScreen }
  };
}
```

### Mappings

| visualState | emphasis | intensity | iconKey | textureKey |
|---|---|---|---|---|
| `open` | medium | 0.6 | cash-coins | cash-flow |
| `closed` | low | 0.0 | cash-coins | cash-flow |

---

## 6. Stock

```javascript
function buildStockVisualModel(vm) {
  var vs = vm.visualState;
  return {
    id: vm.id,
    state: vm.state,
    title: vm.title,
    primary: vm.primaryMetric,
    secondary: vm.secondaryMetrics,
    items: mapItems(vm.items, function(item) {
      return {
        id: item.id,
        name: item.name,
        quantity: item.quantity,
        unit: item.unit,
        status: item.status,
        displayQuantity: item.displayQuantity,
        fillPercent: item.status === "critical" ? 20 : item.status === "low" ? 50 : 100,
        emphasis: item.status === "critical" ? "high" : item.status === "low" ? "medium" : "normal"
      };
    }),
    badge: vm.badge,
    visual: {
      emphasis: vs === "critical" ? "high" : vs === "low" ? "medium" : "low",
      iconKey: "stock-spool",
      textureKey: "stock-level",
      layoutKey: "stock-levels-layout"
    },
    animation: {
      key: vm.animationKey,       // "stock-level"
      state: vs,
      intensity: vs === "critical" ? 1.0 : vs === "low" ? 0.6 : 0.0,
      progress: 0
    },
    navigation: { targetScreen: vm.targetScreen }
  };
}
```

### Mappings

| visualState | emphasis | intensity | iconKey | textureKey |
|---|---|---|---|---|
| `critical` | high | 1.0 | stock-spool | stock-level |
| `low` | medium | 0.6 | stock-spool | stock-level |
| `normal` | low | 0.0 | stock-spool | stock-level |

---

## 7. Customers

```javascript
function buildCustomersVisualModel(vm) {
  var vs = vm.visualState;
  return {
    id: vm.id,
    state: vm.state,
    title: vm.title,
    primary: vm.primaryMetric,
    secondary: vm.secondaryMetrics,
    items: mapItems(vm.items, function(item, index) {
      return {
        id: item.id || "cust-" + index,
        displayClient: item.displayClient,
        displayTotal: item.displayTotal,
        emphasis: index === 0 ? "high" : "normal"
      };
    }),
    badge: vm.badge,
    visual: {
      emphasis: vs === "active" ? "medium" : "low",
      iconKey: "customers-orbit",
      textureKey: "customers-orbit",
      layoutKey: "customers-cards-layout"
    },
    animation: {
      key: vm.animationKey,       // "customer-cards"
      state: vs,
      intensity: vs === "active" ? 0.5 : 0.0,
      progress: 0
    },
    navigation: { targetScreen: vm.targetScreen }
  };
}
```

### Mappings

| visualState | emphasis | intensity | iconKey | textureKey |
|---|---|---|---|---|
| `active` | medium | 0.5 | customers-orbit | customers-orbit |
| `empty` | low | 0.0 | customers-orbit | customers-orbit |

---

## 8. Storefront

```javascript
function buildStorefrontVisualModel(vm) {
  var vs = vm.visualState;
  return {
    id: vm.id,
    state: vm.state,
    title: vm.title,
    primary: vm.primaryMetric,
    secondary: vm.secondaryMetrics,
    items: mapItems(vm.items, function(item) {
      return {
        id: item.id,
        name: item.name,
        emphasis: "normal"
      };
    }),
    badge: vm.badge,
    visual: {
      emphasis: vs === "active" ? "medium" : "low",
      iconKey: "storefront-product",
      textureKey: "storefront-product",
      layoutKey: "storefront-showcase-layout"
    },
    animation: {
      key: vm.animationKey,       // "storefront-showcase"
      state: vs,
      intensity: vs === "active" ? 0.7 : 0.0,
      progress: 0
    },
    navigation: { targetScreen: vm.targetScreen }
  };
}
```

### Mappings

| visualState | emphasis | intensity | iconKey | textureKey |
|---|---|---|---|---|
| `active` | medium | 0.7 | storefront-product | storefront-product |
| `inactive` | low | 0.0 | storefront-product | storefront-product |
| `loading` | low | 0.0 | storefront-product | storefront-product |

---

## 9. Alerts

```javascript
function buildAlertsVisualModel(vm) {
  var vs = vm.visualState;
  var alertTextures = {
    order_overdue: "alert-overdue",
    production_stopped: "alert-stopped",
    production_material: "alert-material",
    stock_critical: "alert-stock",
    cash_no_session: "alert-cash"
  };

  // Determina texture baseado no tipo do primeiro alerta (se houver)
  var primaryAlertType = (vm.items && vm.items.length > 0) ? vm.items[0].type : null;
  var textureKey = primaryAlertType && alertTextures[primaryAlertType]
    ? alertTextures[primaryAlertType]
    : "alerts-bell";

  return {
    id: vm.id,
    state: vm.state,
    title: vm.title,
    primary: vm.primaryMetric,
    secondary: vm.secondaryMetrics,
    items: mapItems(vm.items, function(item) {
      return {
        id: item.id || "alert-" + item.type,
        type: item.type,
        severity: item.severity,
        title: item.title,
        summary: item.summary,
        targetScreen: item.targetScreen,
        entityId: item.entityId,
        textureKey: alertTextures[item.type] || "alerts-bell",
        emphasis: item.severity === "danger" ? "high" : "normal"
      };
    }),
    badge: vm.badge,
    visual: {
      emphasis: vs === "has-alerts" ? "high" : "low",
      iconKey: vs === "has-alerts" ? "alerts-bell" : "alerts-bell",
      textureKey: textureKey,
      layoutKey: "alerts-list-layout"
    },
    animation: {
      key: vm.animationKey,       // "alert-pulse"
      state: vs,
      intensity: vs === "has-alerts" ? 1.0 : 0.0,
      progress: 0
    },
    navigation: { targetScreen: vm.targetScreen }  // null para alerts (dynamic)
  };
}
```

### Mappings

| visualState | emphasis | intensity | iconKey | textureKey |
|---|---|---|---|---|
| `has-alerts` | high | 1.0 | alerts-bell | alert-<type> ou alerts-bell |
| `clear` | low | 0.0 | alerts-bell | alerts-bell |

### Textures por tipo de alerta

| type | textureKey |
|---|---|
| `order_overdue` | alert-overdue |
| `production_stopped` | alert-stopped |
| `production_material` | alert-material |
| `stock_critical` | alert-stock |
| `cash_no_session` | alert-cash |

---

---

## Contexto do app.js — como usar este documento

> **Tratamento contextual:** app.js é o consumidor deste esboço — trata-se de "quasi-3rd party" na leitura deste documento. Este documento descreve o que os widget visual models esperam de app.js, não como app.js é implementado.

### O que app.js faz com este documento

| Responsabilidade | O que app.js faz | O que os widget visual models esperam |
|---|---|---|
| **Fornecer os ViewModels** | App.js chama os presenters para obter ViewModels, e depois passa cada ViewModel para o visual model correspondente | Cada `buildXxxVisualModel(vm)` recebe um ViewModel e retorna um VisualModel |
| **Gerenciar o pipeline de renderização** | App.js é o orchestrator: ViewModel → WidgetVisualModel → AnimationDriver → Renderer | Os visual models são stateless — cada chamada é independente e retorna um VisualModel novo |
| **Passar null para estados inválidos** | Quando um ViewModel não está disponível, app.js pode passar `null` para o visual model | `buildXxxVisualModel(null)` retorna `null` para todos os widgets |
| **Lidar com estados de widget** | App.js decide qual widget está visível e passa apenas os ViewModels relevantes para os visual models | Os visual models não decidem visibilidade — eles apenas transformam o ViewModel em um VisualModel |

### O que NÃO é responsabilidade de app.js neste documento

| O que os widget visual models fazem sozinhos | Detalhe |
|---|---|
| Transformar ViewModel em VisualModel | Cada `buildXxxVisualModel()` mapeia os campos do ViewModel para o formato do VisualModel |
| Definir texturas, ícones e layouts | Cada widget tem seus próprios `textureKey`, `iconKey` e `layoutKey` baseados no visualState |
| Calcular emphasis e intensity | `emphasis` e `intensity` são definidos baseados no `visualState` do ViewModel |
| Preservar targetScreen | O `targetScreen` é preservado do ViewModel (exceto alerts, que é null) |
| Estruturar itens para o renderer | `items` são mapeados para o formato esperado pelo renderer (com `emphasis`, `fillPercent`, etc.) |

### Como usar este documento

1. **Para integrar os visual models no carrossel** — use este documento para entender cada builder e seu VisualModel resultante
2. **Para testar os visual models** — cada builder pode ser testado passando ViewModels mockados (de diferentes visualStates) e verificando o VisualModel resultante
3. **Para estender os visual models** — siga o padrão: funções puras, sem DOM, sem Canvas, sem WebGL, sem mutação do ViewModel
4. **Para revisar** — confirme que um novo widget visual model não introduz efeitos colaterais, acesso a DOM, ou dependência de app.js

> **Nota:** app.js é tratado como "quasi-3rd party" — ou seja, este documento descreve o contrato que app.js consome, sem depender de como app.js é implementado internamente.
