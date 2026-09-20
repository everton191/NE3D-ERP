# Widget Visual Models

Camada pura entre **Presenter ViewModel** e **futuro Renderer**.

## Pipeline

```
Hermes -> Data Sources -> Presenters -> Visual Models -> Renderer (3D)
```

## Contrato

### Input (Presenter ViewModel)

```js
{
  id, title, state, primaryMetric, secondaryMetrics, items,
  badge, targetScreen, animationKey, visualState
}
```

### Output (Visual Model)

```js
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

## Visual States por Widget

| Widget | visualState | emphasis | intensity |
|--------|------------|----------|-----------|
| production | working | high | 1.0 |
| production | queue | medium | 0.6 |
| production | ready-state | low | 0.0 |
| production | idle | low | 0.0 |
| orders_recent | has-orders | medium | 0.8 |
| orders_recent | empty | low | 0.0 |
| day_summary | active | medium | 0.7 |
| day_summary | idle | low | 0.0 |
| cash_today | open | medium | 0.6 |
| cash_today | closed | low | 0.0 |
| stock | critical | high | 1.0 |
| stock | low | medium | 0.6 |
| stock | normal | low | 0.0 |
| customers | active | medium | 0.5 |
| customers | empty | low | 0.0 |
| storefront | active | medium | 0.7 |
| storefront | inactive | low | 0.0 |
| alerts | has-alerts | high | 1.0 |
| alerts | clear | low | 0.0 |

## Texture Keys

| Widget | Texture Keys |
|--------|-------------|
| production | production-idle, production-active, production-queue, production-ready |
| orders | orders-stack |
| day_summary | summary-chart |
| cash | cash-flow |
| stock | stock-level |
| customers | customers-orbit |
| storefront | storefront-product |
| alerts | alert-overdue, alert-stopped, alert-material, alert-stock, alert-cash |

## Icon Keys

| Widget | Icon Keys |
|--------|----------|
| production | production-idle, production-active, production-queue, production-done |
| orders | orders-card |
| day_summary | summary-chart |
| cash | cash-coins |
| stock | stock-spool |
| customers | customers-orbit |
| storefront | storefront-product |
| alerts | alerts-bell, alert-clock, alert-stop, alert-box, alert-warning, alert-register |

## Layout Keys

| Widget | layoutKey |
|--------|-----------|
| production | production-belt |
| orders | orders-stack-layout |
| day_summary | summary-bars-layout |
| cash | cash-dashboard-layout |
| stock | stock-levels-layout |
| customers | customers-cards-layout |
| storefront | storefront-showcase-layout |
| alerts | alerts-list-layout |

## API

```js
var VM = require("./widget-visual-models");

// buildVisualModel(widgetId, viewModel) -> visualModel
var model = VM.buildVisualModel("production", presenterViewModel);
// -> { id, state, title, primary, secondary, items, badge, visual, animation, navigation }

// null viewModel retorna null
var empty = VM.buildVisualModel("production", null); // -> null
```

## Regras

1. Funcoes puras, sem DOM, sem Canvas, sem WebGL
2. Nao mutam o ViewModel de entrada
3. Nao recalcram regra de negocio
4. intensity: 0.0 (idle) a 1.0 (critico/trabalhando)
5. maximo 3 items preservado do presenter

## Testes

```bash
node scripts/test-home-carousel-widget-models.js
```

Resultado: 232 PASS / 0 FAIL (A-L: 12 categorias)
