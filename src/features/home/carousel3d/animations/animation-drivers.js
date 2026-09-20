(function attachAnimationDrivers(global) { "use strict";

/**
 * Animation Drivers — Logica deterministica das animacoes dos 8 widgets.
 *
 * CONTRATO:
 *   createDriver(config) -> driver
 *   driver.update(deltaTime, visualModel) -> void
 *   driver.getFrame() -> FrameState
 *
 * FrameState:
 *   { animationKey, state, progress, phase, intensity, elements }
 *
 * REGRAS:
 *   - Deterministico: mesmo input -> mesmo output
 *   - Sem DOM, sem Canvas, sem WebGL
 *   - Sem requestAnimationFrame, sem timer proprio
 *   - deltaTime fornecido externamente
 *   - Testavel em Node
 */

/* ================================================================
   FRAME STATE BASE
   ================================================================ */

function baseFrame(animationKey) {
  return {
    animationKey: animationKey,
    state: "idle",
    progress: 0,
    phase: "none",
    intensity: 0,
    elements: [],
  };
}

function clamp01(v) {
  return v < 0 ? 0 : v > 1 ? 1 : v;
}

/* ================================================================
   1. PRODUCTION — production-flow
   ================================================================ */

function createProductionDriver() {
  var frame = baseFrame("production-flow");
  var acc = 0;
  var CYCLE = 3000;

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
      var itemCount = (vm.items && vm.items.length) || Math.min(Math.max(Number(vm.primary && vm.primary.value) || 0, 0), 1);
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

  function getFrame() { return frame; }

  return Object.freeze({ update: update, getFrame: getFrame });
}

/* ================================================================
   2. ORDERS — order-stack
   ================================================================ */

function createOrdersDriver() {
  var frame = baseFrame("order-stack");
  var acc = 0;
  var CYCLE = 4000;

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
          transitionProgress: i === 0 ? clamp01(raw) : 0,
        };
      });
    } else {
      frame.state = anim.state;
      frame.progress = 0;
      frame.phase = "empty";
      frame.elements = [];
    }
  }

  function getFrame() { return frame; }

  return Object.freeze({ update: update, getFrame: getFrame });
}


/* ================================================================
   3. DAY SUMMARY — metric-bars
   ================================================================ */

function createDaySummaryDriver() {
  var frame = baseFrame("metric-bars");
  var acc = 0;
  var CYCLE = 5000;

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
          color: b.color,
        };
      });
    } else {
      frame.state = anim.state;
      frame.progress = 0;
      frame.phase = "idle";
      frame.elements = [];
    }
  }

  function getFrame() { return frame; }

  return Object.freeze({ update: update, getFrame: getFrame });
}

/* ================================================================
   4. CASH — cash-flow
   ================================================================ */

function createCashDriver() {
  var frame = baseFrame("cash-flow");
  var acc = 0;
  var CYCLE = 4000;

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
          flowProgress: clamp01((raw + i * 0.2) % 1),
        };
      });
      if (vm.primary) {
        frame.elements.unshift({
          index: -1,
          label: vm.primary.label,
          value: vm.primary.value,
          direction: "balance",
          flowProgress: clamp01(raw),
        });
      }
    } else {
      frame.state = anim.state;
      frame.progress = 0;
      frame.phase = "closed";
      frame.elements = [];
    }
  }

  function getFrame() { return frame; }

  return Object.freeze({ update: update, getFrame: getFrame });
}

/* ================================================================
   5. STOCK — stock-level
   ================================================================ */

function createStockDriver() {
  var frame = baseFrame("stock-level");
  var acc = 0;
  var PULSE_CYCLE = 1500;

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
        pulsePhase: item.status === "critical" ? frame.progress : 0,
      };
    });
  }

  function getFrame() { return frame; }

  return Object.freeze({ update: update, getFrame: getFrame });
}

/* ================================================================
   6. CUSTOMERS — customer-cards
   ================================================================ */

function createCustomersDriver() {
  var frame = baseFrame("customer-cards");
  var acc = 0;
  var CYCLE = 6000;

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
          emphasis: item.emphasis,
        };
      });
    } else {
      frame.state = anim.state;
      frame.progress = 0;
      frame.phase = "idle";
      frame.elements = [];
    }
  }

  function getFrame() { return frame; }

  return Object.freeze({ update: update, getFrame: getFrame });
}

/* ================================================================
   7. STOREFRONT — storefront-showcase
   ================================================================ */

function createStorefrontDriver() {
  var frame = baseFrame("storefront-showcase");
  var acc = 0;
  var CYCLE = 5000;

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
    } else {
      frame.state = anim.state;
      frame.progress = 0;
      frame.phase = "inactive";
      frame.elements = [];
    }
  }

  function getFrame() { return frame; }

  return Object.freeze({ update: update, getFrame: getFrame });
}

/* ================================================================
   8. ALERTS — alert-pulse
   ================================================================ */

function createAlertsDriver() {
  var frame = baseFrame("alert-pulse");
  var acc = 0;
  var PULSE_CYCLE = 1200;
  var SWAP_CYCLE = 4000;

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
      var swap = (acc % SWAP_CYCLE) / SWAP_CYCLE;
      frame.progress = clamp01(pulse);
      frame.phase = swap < 0.7 ? "display" : "transition";
      var items = vm.items || [];
      var activeIndex = Math.floor(swap * items.length) % Math.max(items.length, 1);
      frame.elements = items.slice(0, 3).map(function(item, i) {
        return {
          index: i,
          type: item.type,
          severity: item.severity,
          emphasis: item.emphasis,
          isActive: i === activeIndex,
          pulsePhase: pulse,
        };
      });
    } else {
      frame.state = anim.state;
      frame.progress = 0;
      frame.phase = "clear";
      frame.elements = [];
    }
  }

  function getFrame() { return frame; }

  return Object.freeze({ update: update, getFrame: getFrame });
}

/* ================================================================
   DRIVER MAP
   ================================================================ */

var DRIVER_FACTORIES = {
  "production-flow": createProductionDriver,
  "order-stack": createOrdersDriver,
  "metric-bars": createDaySummaryDriver,
  "cash-flow": createCashDriver,
  "stock-level": createStockDriver,
  "customer-cards": createCustomersDriver,
  "storefront-showcase": createStorefrontDriver,
  "alert-pulse": createAlertsDriver,
};

function createDriver(animationKey) {
  var factory = DRIVER_FACTORIES[animationKey];
  if (!factory) return null;
  return factory();
}

/* ================================================================
   EXPORTACAO
   ================================================================ */

global.SimplificaAnimationDrivers = Object.freeze({
  createDriver: createDriver,
  _factories: DRIVER_FACTORIES,
});

if (typeof module !== "undefined" && module.exports) {
  module.exports = global.SimplificaAnimationDrivers;
}

})(typeof window !== "undefined" ? window : globalThis);
