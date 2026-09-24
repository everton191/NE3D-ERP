# Esboço — Animation Drivers (8 Widgets)

> Esboço técnico baseado no código real de `animation-drivers.js`.
> Não é implementação. Atualizado em 2026-09-21.

---

## 1. Contrato geral

```javascript
var driver = AD.createDriver(animationKey);

driver.update(deltaTime, visualModel);  // deltaTime em ms
var frame = driver.getFrame();
// → { animationKey, state, progress, phase, intensity, elements }
```

### FrameState

```javascript
{
  animationKey: "production-flow",
  state: "working",
  progress: 0.35,        // 0.0 a 1.0
  phase: "building",      // fase atual da animação
  intensity: 1.0,         // 0.0 a 1.0
  elements: [             // elementos visuais
    { index: 0, position: 0.35, active: true }
  ]
}
```

---

## 2. Production — `production-flow`

```javascript
function createProductionDriver() {
  var frame = baseFrame("production-flow");
  var acc = 0;
  var CYCLE = 3000; // 3s por ciclo

  function update(dt, vm) {
    if (!vm || vm.state === "loading" || vm.state === "error" || vm.state === "empty") {
      frame.state = vm ? vm.animation.state : "idle";
      frame.progress = 0;
      frame.phase = "none";
      frame.intensity = 0;
      frame.elements = [];
      return;
    }

    var anim = vm.animation;
    frame.state = anim.state;
    frame.intensity = anim.intensity;

    if (anim.state === "working") {
      acc += dt;
      var raw = (acc % CYCLE) / CYCLE;
      frame.progress = clamp01(raw);
      frame.phase = raw < 0.3 ? "printing" : raw < 0.7 ? "building" : "finishing";

      var itemCount = (vm.items && vm.items.length) ||
        Math.min(Math.max(Number(vm.primary && vm.primary.value) || 0, 0), 1);

      frame.elements = [];
      for (var i = 0; i < itemCount; i++) {
        var offset = (frame.progress + i * 0.2) % 1;
        frame.elements.push({ index: i, position: clamp01(offset), active: i === 0 });
      }
    } else if (anim.state === "queue") {
      acc += dt;
      var raw2 = (acc % CYCLE) / CYCLE;
      frame.progress = clamp01(raw2);
      frame.phase = "queued";

      var q = (vm.primary && vm.primary.value) || 0;
      frame.elements = [];
      for (var j = 0; j < Math.min(q, 3); j++) {
        frame.elements.push({ index: j, position: clamp01((raw2 + j * 0.15) % 1), active: false });
      }
    } else if (anim.state === "ready-state") {
      frame.progress = 1;
      frame.phase = "ready";
      frame.elements = [{ index: 0, position: 1, active: false }];
    } else {
      frame.state = anim.state;
      frame.progress = 0;
      frame.phase = "idle";
      frame.elements = [];
    }
  }

  return Object.freeze({ update: update, getFrame: getFrame });
}
```

### Estados e fases

| state | phases possíveis | Descrição |
|---|---|---|
| `working` | printing, building, finishing | Animação cíclica de impressão |
| `queue` | queued | Fila estática com itens |
| `ready-state` | ready | Estado final pronto |
| `idle` | idle | Sem animação |

### Cycle
- 3000ms por ciclo completo
- 3 fases: 0-30% printing, 30-70% building, 70-100% finishing

---

## 3. Orders Recent — `order-stack`

```javascript
function createOrdersDriver() {
  var frame = baseFrame("order-stack");
  var acc = 0;
  var CYCLE = 4000; // 4s por ciclo

  function update(dt, vm) {
    if (!vm || vm.state === "loading" || vm.state === "error" || vm.state === "empty") {
      frame.state = vm ? vm.animation.state : "idle";
      frame.progress = 0;
      frame.phase = "none";
      frame.intensity = 0;
      frame.elements = [];
      return;
    }

    var anim = vm.animation;
    frame.state = anim.state;
    frame.intensity = anim.intensity;

    if (anim.state === "has-orders") {
      acc += dt;
      var raw = (acc % CYCLE) / CYCLE;
      frame.progress = clamp01(raw);
      frame.phase = raw < 0.6 ? "display" : "transition";

      var items = vm.items || [];
      frame.elements = items.slice(0, 3).map(function(item, i) {
        return {
          index: i,
          offset: i * 0.08,
          zDepth: i * 0.15,
          isFront: i === 0,
          transitionProgress: i === 0 ? clamp01(raw) : 0
        };
      });
    } else {
      frame.state = anim.state;
      frame.progress = 0;
      frame.phase = "empty";
      frame.elements = [];
    }
  }

  return Object.freeze({ update: update, getFrame: getFrame });
}
```

### Estados e fases

| state | phases possíveis | Descrição |
|---|---|---|
| `has-orders` | display, transition | Exibição dos pedidos com transição |
| `empty` | empty | Sem pedidos |

### Cycle
- 4000ms por ciclo
- 60% display, 40% transition

---

## 4. Day Summary — `metric-bars`

```javascript
function createDaySummaryDriver() {
  var frame = baseFrame("metric-bars");
  var acc = 0;
  var CYCLE = 5000; // 5s por ciclo

  function update(dt, vm) {
    if (!vm || vm.state === "loading" || vm.state === "error" || vm.state === "empty") {
      frame.state = vm ? vm.animation.state : "idle";
      frame.progress = 0;
      frame.phase = "none";
      frame.intensity = 0;
      frame.elements = [];
      return;
    }

    var anim = vm.animation;
    frame.state = anim.state;
    frame.intensity = anim.intensity;

    if (anim.state === "active") {
      acc += dt;
      var raw = (acc % CYCLE) / CYCLE;
      frame.progress = clamp01(raw);
      frame.phase = raw < 0.4 ? "entering" : "steady";

      var bars = vm.items || [];
      var maxVal = 0;
      bars.forEach(function(b) { if (b.value > maxVal) maxVal = b.value; });

      frame.elements = bars.map(function(b, i) {
        var normalized = maxVal > 0 ? b.value / maxVal : 0;
        var entryProgress = clamp01((raw - i * 0.1) * 2.5);
        return {
          index: i,
          label: b.label,
          fillPercent: normalized * 100,
          entryProgress: entryProgress,
          color: b.color
        };
      });
    } else {
      frame.state = anim.state;
      frame.progress = 0;
      frame.phase = "idle";
      frame.elements = [];
    }
  }

  return Object.freeze({ update: update, getFrame: getFrame });
}
```

### Estados e fases

| state | phases possíveis | Descrição |
|---|---|---|
| `active` | entering, steady | Barras entrando e em steady state |
| `idle` | idle | Sem animação |

### Cycle
- 5000ms por ciclo
- 40% entering, 60% steady

---

## 5. Cash Today — `cash-flow`

```javascript
function createCashDriver() {
  var frame = baseFrame("cash-flow");
  var acc = 0;
  var CYCLE = 4000; // 4s por ciclo

  function update(dt, vm) {
    if (!vm || vm.state === "loading" || vm.state === "error" || vm.state === "empty") {
      frame.state = vm ? vm.animation.state : "idle";
      frame.progress = 0;
      frame.phase = "none";
      frame.intensity = 0;
      frame.elements = [];
      return;
    }

    var anim = vm.animation;
    frame.state = anim.state;
    frame.intensity = anim.intensity;

    if (anim.state === "open") {
      acc += dt;
      var raw = (acc % CYCLE) / CYCLE;
      frame.progress = clamp01(raw);
      frame.phase = raw < 0.5 ? "inflow" : "outflow";

      var sec = vm.secondary || [];
      frame.elements = sec.map(function(s, i) {
        return {
          index: i,
          label: s.label,
          value: s.value,
          direction: s.label === "entradas" ? "in" : "out",
          flowProgress: clamp01((raw + i * 0.2) % 1)
        };
      });

      if (vm.primary) {
        frame.elements.unshift({
          index: -1,
          label: vm.primary.label,
          value: vm.primary.value,
          direction: "balance",
          flowProgress: clamp01(raw)
        });
      }
    } else {
      frame.state = anim.state;
      frame.progress = 0;
      frame.phase = "closed";
      frame.elements = [];
    }
  }

  return Object.freeze({ update: update, getFrame: getFrame });
}
```

### Estados e fases

| state | phases possíveis | Descrição |
|---|---|---|
| `open` | inflow, outflow | Fluxo de entrada/saída alternado |
| `closed` | closed | Sem animação |

### Cycle
- 4000ms por ciclo
- 50% inflow, 50% outflow

---

## 6. Stock — `stock-level`

```javascript
function createStockDriver() {
  var frame = baseFrame("stock-level");
  var acc = 0;
  var PULSE_CYCLE = 1500; // 1.5s por pulso

  function update(dt, vm) {
    if (!vm || vm.state === "loading" || vm.state === "error" || vm.state === "empty") {
      frame.state = vm ? vm.animation.state : "idle";
      frame.progress = 0;
      frame.phase = "none";
      frame.intensity = 0;
      frame.elements = [];
      return;
    }

    var anim = vm.animation;
    frame.state = anim.state;
    frame.intensity = anim.intensity;

    if (anim.state === "critical") {
      acc += dt;
      var pulse = (acc % PULSE_CYCLE) / PULSE_CYCLE;
      frame.progress = clamp01(pulse);
      frame.phase = "alert-pulse";
    } else if (anim.state === "low") {
      acc += dt;
      var pulse2 = (acc % (PULSE_CYCLE * 2)) / (PULSE_CYCLE * 2);
      frame.progress = clamp01(pulse2);
      frame.phase = "warning-pulse";
    } else {
      frame.state = anim.state;
      frame.progress = 0;
      frame.phase = "normal";
    }

    var items = vm.items || [];
    frame.elements = items.slice(0, 3).map(function(item) {
      return {
        id: item.id,
        name: item.name,
        fillPercent: item.fillPercent || 0,
        status: item.status,
        pulsePhase: item.status === "critical" ? frame.progress : 0
      };
    });
  }

  return Object.freeze({ update: update, getFrame: getFrame });
}
```

### Estados e fases

| state | phases possíveis | Descrição |
|---|---|---|
| `critical` | alert-pulse | Pulso de alerta (1.5s) |
| `low` | warning-pulse | Pulso de aviso (3s — 2x o cycle de critical) |
| `normal` | normal | Sem animação |

### Cycle
- Critical: 1500ms por pulso
- Low: 3000ms por pulso (2x o critical)
- Normal: sem animação

---

## 7. Customers — `customer-cards`

```javascript
function createCustomersDriver() {
  var frame = baseFrame("customer-cards");
  var acc = 0;
  var CYCLE = 6000; // 6s por ciclo

  function update(dt, vm) {
    if (!vm || vm.state === "loading" || vm.state === "error" || vm.state === "empty") {
      frame.state = vm ? vm.animation.state : "idle";
      frame.progress = 0;
      frame.phase = "none";
      frame.intensity = 0;
      frame.elements = [];
      return;
    }

    var anim = vm.animation;
    frame.state = anim.state;
    frame.intensity = anim.intensity;

    if (anim.state === "active") {
      acc += dt;
      var raw = (acc % CYCLE) / CYCLE;
      frame.progress = clamp01(raw);
      frame.phase = "orbit";

      var items = vm.items || [];
      frame.elements = items.map(function(item, i) {
        var angle = (raw + i / items.length) % 1;
        return {
          index: i,
          angle: angle,
          radius: 0.6 + i * 0.1,
          emphasis: item.emphasis
        };
      });
    } else {
      frame.state = anim.state;
      frame.progress = 0;
      frame.phase = "idle";
      frame.elements = [];
    }
  }

  return Object.freeze({ update: update, getFrame: getFrame });
}
```

### Estados e fases

| state | phases possíveis | Descrição |
|---|---|---|
| `active` | orbit | Cards em órbita ao redor do centro |
| `idle` | idle | Sem animação |

### Cycle
- 6000ms por ciclo completo de órbita
- Cada card tem ângulo baseado na posição no array + progresso global

---

## 8. Storefront — `storefront-showcase`

```javascript
function createStorefrontDriver() {
  var frame = baseFrame("storefront-showcase");
  var acc = 0;
  var CYCLE = 5000; // 5s por ciclo

  function update(dt, vm) {
    if (!vm || vm.state === "loading" || vm.state === "error" || vm.state === "empty") {
      frame.state = vm ? vm.animation.state : "idle";
      frame.progress = 0;
      frame.phase = "none";
      frame.intensity = 0;
      frame.elements = [];
      return;
    }

    var anim = vm.animation;
    frame.state = anim.state;
    frame.intensity = anim.intensity;

    if (anim.state === "active") {
      acc += dt;
      var raw = (acc % CYCLE) / CYCLE;
      frame.progress = clamp01(raw);
      frame.phase = raw < 0.3 ? "showcase-in" : "rotate";
      frame.elements = [{ rotation: raw * 360, active: true }];
    } else if (anim.state === "inactive") {
      frame.state = anim.state;
      frame.progress = 0;
      frame.phase = "inactive";
      frame.elements = [];
    } else {
      frame.state = anim.state;
      frame.progress = 0;
      frame.phase = "idle";
      frame.elements = [];
    }
  }

  return Object.freeze({ update: update, getFrame: getFrame });
}
```

### Estados e fases

| state | phases possíveis | Descrição |
|---|---|---|
| `active` | showcase-in, rotate | Apresentação com rotação 360° |
| `inactive` | inactive | Sem animação |
| `idle` | idle | Sem animação |

### Cycle
- 5000ms por ciclo
- 30% showcase-in, 70% rotate

---

## 9. Alerts — `alert-pulse`

```javascript
function createAlertsDriver() {
  var frame = baseFrame("alert-pulse");
  var acc = 0;
  var PULSE_CYCLE = 1200; // 1.2s por pulso
  var SWAP_CYCLE = 4000;  // 4s por swap

  function update(dt, vm) {
    if (!vm || vm.state === "loading" || vm.state === "error" || vm.state === "empty") {
      frame.state = vm ? vm.animation.state : "idle";
      frame.progress = 0;
      frame.phase = "none";
      frame.intensity = 0;
      frame.elements = [];
      return;
    }

    var anim = vm.animation;
    frame.state = anim.state;
    frame.intensity = anim.intensity;

    if (anim.state === "has-alerts") {
      acc += dt;
      var pulse = (acc % PULSE_CYCLE) / PULSE_CYCLE;
      var swap = ((acc % SWAP_CYCLE) / SWAP_CYCLE);

      frame.progress = clamp01(pulse);
      frame.phase = swap < 0.5 ? "display" : "transition";
      frame.intensity = 1.0;

      var alerts = vm.items || [];
      var activeIndex = Math.floor(swap * alerts.length) % alerts.length;
      frame.elements = alerts.slice(0, 3).map(function(a, i) {
        return {
          index: i,
          type: a.type,
          severity: a.severity,
          title: a.title,
          pulsePhase: i === activeIndex ? frame.progress : 0,
          active: i === activeIndex,
          swapProgress: i === activeIndex ? clamp01(swap * 2) : 0
        };
      });
    } else {
      frame.state = anim.state;
      frame.progress = 0;
      frame.phase = "clear";
      frame.elements = [];
    }
  }

  return Object.freeze({ update: update, getFrame: getFrame });
}
```

### Estados e fases

| state | phases possíveis | Descrição |
|---|---|---|
| `has-alerts` | display, transition | Pulso + swap entre alertas |
| `clear` | clear | Sem alertas |

### Cycle
- Pulso: 1200ms
- Swap: 4000ms para trocar de alerta ativo
- O alerta ativo muda a cada 4s, com transição suave

---

## Tabela resumo dos 8 drivers

| Driver | Key | States | Cycles | Phases |
|---|---|---|---|---|
| production-flow | `production` | working, queue, ready, idle | 3000ms | printing, building, finishing, queued, ready, idle |
| order-stack | `orders` | has-orders, empty | 4000ms | display, transition, empty |
| metric-bars | `day_summary` | active, idle | 5000ms | entering, steady, idle |
| cash-flow | `cash` | open, closed | 4000ms | inflow, outflow, closed |
| stock-level | `stock` | critical, low, normal | 1500ms/3000ms | alert-pulse, warning-pulse, normal |
| customer-cards | `customers` | active, idle | 6000ms | orbit, idle |
| storefront-showcase | `storefront` | active, inactive, idle | 5000ms | showcase-in, rotate, inactive |
| alert-pulse | `alerts` | has-alerts, clear | 1200ms + 4000ms | display, transition, clear |

---

## Regras gerais

1. **Determinístico**: mesmo input → mesmo output
2. **Sem DOM**: não acessa document/window
3. **Sem Canvas/WebGL**: não desenha
4. **Sem timers**: zero setInterval/setTimeout/requestAnimationFrame
5. **deltaTime externo**: o motor fornece o tempo
6. **Não muta visualModel**: entrada preservada
7. **Não recalculating regra de negócio**: apenas lógica visual

---

---

## Contexto do app.js — como usar este documento

> **Tratamento contextual:** app.js é o consumidor deste esboço — trata-se de "quasi-3rd party" na leitura deste documento. Este documento descreve o que os drivers esperam de app.js, não como app.js é implementado.

### O que app.js faz com este documento

| Responsabilidade | O que app.js faz | O que os drivers esperam |
|---|---|---|
| **Fornecer deltaTime** | Calcula e fornece o deltaTime em ms para cada tick de animação | Receber deltaTime como parâmetro do `update()` |
| **Chamar update()** | Chama `driver.update(dt, visualModel)` a cada frame de animação | Executar a lógica do driver e atualizar o frame state |
| **Fornecer visualModel** | Passa o visualModel (já construído pelos widget visual models) para o driver | Ler `visualModel.animation.state` e outros campos para calcular o frame |
| **Gerenciar ciclo de vida** | Inicia o loop de animação quando o carrossel é montado, pausa/resume conforme visibilidade | Os drivers não gerenciam próprios timers — só respondem ao update() |
| **Cleanup** | Cancela o loop de animação no unmount | Os drivers são stateless após parar de receber update() |

### O que NÃO é responsabilidade de app.js neste documento

| O que os drivers fazem sozinhos | Detalhe |
|---|---|
| Calcular posição dos elementos de animação | Cada driver calcula positions, phases, intensities internamente |
| Gerenciar timings cíclicos | Os drivers usam acumuladores internos baseados no deltaTime recebido |
| Determinar estados de animação | Os drivers lêem `visualModel.state` e `visualModel.animation.state` para decidir o comportamento |
| Ser determinístico | Os drivers sempre produzem o mesmo output para o mesmo input |

### Como usar este documento

1. **Para integrar os drivers no carrossel** — use esta documentação para entender o contrato `createDriver()` / `update()` / `getFrame()`
2. **Para testar os drivers** — cada driver pode ser testado isoladamente passando visualModels mockados e verificando o frame resultante
3. **Para estender os drivers** — siga o padrão: função pura, sem DOM, sem timers, deltaTime externo
4. **Para revisar** — confirme que um novo driver não introduz timers, acesso a DOM, ou mutação do visualModel

> **Nota:** app.js é tratado como "quasi-3rd party" — ou seja, este documento descreve o contrato que app.js consome, sem depender de como app.js é implementado internamente.
