# Animation Drivers

Logica deterministica das animacoes dos 8 widgets do carrossel.

## Pipeline

```
DATA -> PRESENTER -> WIDGET MODEL -> ANIMATION DRIVER -> RENDERER
```

## Contrato

```js
var driver = AD.createDriver(animationKey);

driver.update(deltaTime, visualModel);  // deltaTime em ms
var frame = driver.getFrame();
```

## FrameState

```js
{
  animationKey: "production-flow",
  state: "working",
  progress: 0.35,        // 0.0 a 1.0
  phase: "building",     // fase atual da animacao
  intensity: 1.0,        // 0.0 a 1.0
  elements: [            // elementos visuais
    { index: 0, position: 0.35, active: true }
  ]
}
```

## Drivers

| Driver | Key | Estados | Phases |
|--------|-----|---------|--------|
| production-flow | production | working, queue, idle, ready | printing, building, finishing |
| order-stack | orders | has-orders, empty | display, transition |
| metric-bars | day_summary | active, idle | entering, steady |
| cash-flow | cash | open, closed | inflow, outflow |
| stock-level | stock | critical, low, normal | alert-pulse, warning-pulse, normal |
| customer-cards | customers | active, idle | orbit |
| storefront-showcase | storefront | active, inactive | showcase-in, rotate, inactive |
| alert-pulse | alerts | has-alerts, clear | display, transition, clear |

## Regras

1. **Deterministico**: mesmo input -> mesmo output
2. **Sem DOM**: nao acessa document/window
3. **Sem Canvas/WebGL**: nao desenha
4. **Sem timers**: zero setInterval/setTimeout/requestAnimationFrame
5. **deltaTime externo**: motor fornece o tempo
6. **Nao muta visualModel**: entrada preservada
7. **Nao recalcma regra de negocio**: apenas logica visual

## Ciclos

| Driver | Ciclo padrao |
|--------|-------------|
| production | 3000ms |
| orders | 4000ms |
| day_summary | 5000ms |
| cash | 4000ms |
| stock | 1500ms (pulse) |
| customers | 6000ms |
| storefront | 5000ms |
| alerts | 1200ms (pulse) + 4000ms (swap) |

## API

```js
var AD = require("./animation-drivers");

// Criar driver
var driver = AD.createDriver("production-flow");

// Atualizar (chamado pelo renderer/engine)
driver.update(16.67, visualModel);  // ~60fps

// Obter frame
var frame = driver.getFrame();
// -> { animationKey, state, progress, phase, intensity, elements }
```

## Testes

```bash
node scripts/test-home-carousel-animation-drivers.js
```

Resultado: 217 PASS / 0 FAIL (A-Q: 17 categorias)
