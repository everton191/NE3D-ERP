# Widget Presenters

Camada pura de transformacao entre **snapshots** (data layer) e **view models** (renderer).

## Arquitetura

```
Hermes --> Data Sources (snapshots) --> Presenters (view models) --> Renderer (3D)
```

Cada presenter recebe um snapshot pronto e retorna um **ViewModel pequeno e previsivel** para o renderer.

## Contrato

### Input (Snapshot)

```js
{
  status: "ready" | "empty" | "error" | "loading",
  updatedAt: ISO string,
  data: { ... }
}
```

### Output (ViewModel)

```js
{
  id: "production",           // identificador do card
  title: "Producao",         // titulo amigavel
  state: "ready",             // ready | empty | error | loading
  primaryMetric: {
    value: 5,
    label: "em producao",
    formatted: "5"
  },
  secondaryMetrics: [
    { value: 3, label: "na fila", formatted: "3" }
  ],
  items: [],                  // maximo 3 para orders/stock/alerts
  badge: { text: "Aberto", tone: "success" },
  targetScreen: "producao",  // navegacao ao tocar no card
  animationKey: "production-flow",  // animacao 3D
  visualState: "working"     // estado visual para o renderer
}
```

## Visual States

| Estado | Descricao |
|--------|-----------|
| `loading` | Dados ainda carregando |
| `ready` | Dados validos disponiveis |
| `empty` | Fonte existe mas retornou vazio |
| `error` | Fonte temporariamente indisponivel |

### Visual States por Widget

| Widget | Possiveis visualStates |
|--------|----------------------|
| production | `working`, `queue`, `ready-state`, `idle` |
| orders_recent | `has-orders`, `empty` |
| day_summary | `active`, `idle` |
| cash_today | `open`, `closed` |
| stock | `critical`, `low`, `normal` |
| customers | `active`, `empty` |
| storefront | `active`, `inactive` |
| alerts | `has-alerts`, `clear` |

## Animation Keys

| Widget | animationKey |
|--------|-------------|
| production | `production-flow` |
| orders_recent | `order-stack` |
| day_summary | `metric-bars` |
| cash_today | `cash-flow` |
| stock | `stock-level` |
| customers | `customer-cards` |
| storefront | `storefront-showcase` |
| alerts | `alert-pulse` |

## Regras

1. **Funcoes puras** — sem DOM, sem Canvas, sem WebGL
2. **Nao mutam** o snapshot de entrada
3. **Nao recalcram** regra de negocio
4. **Formatacao visual** apenas (currency, integer, label)
5. **Maximo 3 itens** para orders_recent, stock alertItems, alerts
6. **targetScreen** preservado do normalizer (exceto alerts = null)

## API

```js
var P = require("./widget-presenters");

// Todos aceitam 4 status:
var vm1 = P.presentProduction(snapshotReady);
var vm2 = P.presentProduction(snapshotEmpty);
var vm3 = P.presentProduction(snapshotError);
var vm4 = P.presentProduction(snapshotLoading);

// null tambem trata como loading:
var vm5 = P.presentProduction(null);
```

## Testes

```bash
node scripts/test-home-carousel-presenters.js
```

Resultado: 161 PASS / 0 FAIL (A-P: 16 categorias)

## Arquivos

- `src/features/home/carousel3d/presenters/widget-presenters.js`
- `scripts/test-home-carousel-presenters.js`
- `docs/home-carousel/widget-data-sources.md` (data layer)