(function initSimplificaSafeAreaManager(global) {
  "use strict";

  const KEYBOARD_THRESHOLD = 120;
  // Controles nunca podem ficar sob recortes, barra de status ou navegação.
  const CONTENT_TOP_INSET_RATIO = 1;
  const DEFAULT_SAFE_AREA = Object.freeze({
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    keyboardHeight: 0,
    visualViewportHeight: 0,
    viewportHeight: 0,
    source: "initial"
  });

  const state = { ...DEFAULT_SAFE_AREA };
  let probes = null;
  let scheduled = false;

  function toNumber(value) {
    const parsed = Number.parseFloat(String(value || "").replace("px", ""));
    return Number.isFinite(parsed) ? Math.max(0, Math.round(parsed)) : 0;
  }

  function ensureProbes() {
    const doc = global.document;
    if (!doc?.body) return null;
    if (probes) return probes;
    const host = doc.createElement("div");
    host.setAttribute("aria-hidden", "true");
    host.style.cssText = "position:fixed;inset:auto;visibility:hidden;pointer-events:none;z-index:-1;contain:strict;";

    const makeProbe = (prop, value) => {
      const node = doc.createElement("div");
      node.style.cssText = `position:fixed;${prop}:${value};width:0;height:0;`;
      host.appendChild(node);
      return node;
    };

    probes = {
      host,
      top: makeProbe("top", "env(safe-area-inset-top, 0px)"),
      right: makeProbe("right", "env(safe-area-inset-right, 0px)"),
      bottom: makeProbe("bottom", "env(safe-area-inset-bottom, 0px)"),
      left: makeProbe("left", "env(safe-area-inset-left, 0px)")
    };
    doc.body.appendChild(host);
    return probes;
  }

  function readProbeInset(name) {
    const currentProbes = ensureProbes();
    if (!currentProbes?.[name]) return 0;
    const computed = global.getComputedStyle?.(currentProbes[name]);
    return toNumber(computed?.[name]);
  }

  function readNativeInset(name) {
    const root = global.document?.documentElement;
    if (!root || !global.getComputedStyle) return 0;
    return toNumber(global.getComputedStyle(root).getPropertyValue(`--android-system-${name}-inset`));
  }

  function getKeyboardHeight() {
    const viewport = global.visualViewport;
    if (!viewport) return 0;
    const layoutHeight = Number(global.innerHeight) || 0;
    const visibleBottom = Number(viewport.height || 0) + Number(viewport.offsetTop || 0);
    const hidden = Math.max(0, Math.round(layoutHeight - visibleBottom));
    return hidden >= KEYBOARD_THRESHOLD ? hidden : 0;
  }

  function computeSafeArea() {
    const rawTopInset = Math.max(readProbeInset("top"), readNativeInset("top"));
    const envTop = Math.round(rawTopInset * CONTENT_TOP_INSET_RATIO);
    const envRight = Math.max(readProbeInset("right"), readNativeInset("right"));
    const envBottom = Math.max(readProbeInset("bottom"), readNativeInset("bottom"));
    const envLeft = Math.max(readProbeInset("left"), readNativeInset("left"));
    const keyboardHeight = getKeyboardHeight();
    const viewportHeight = Math.round(Number(global.visualViewport?.height || global.innerHeight || 0));
    return {
      top: envTop,
      right: envRight,
      bottom: envBottom,
      left: envLeft,
      keyboardHeight,
      visualViewportHeight: viewportHeight,
      viewportHeight,
      source: "css-env"
    };
  }

  function applySafeArea(next) {
    const doc = global.document;
    const root = doc?.documentElement;
    if (!root) return;
    const changed = ["top", "right", "bottom", "left", "keyboardHeight", "viewportHeight", "source"].some((key) => state[key] !== next[key]);
    Object.assign(state, next);
    global.safeArea = state;

    root.style.setProperty("--safe-area-inset-top", `${state.top}px`);
    root.style.setProperty("--safe-area-inset-right", `${state.right}px`);
    root.style.setProperty("--safe-area-inset-bottom", `${state.bottom}px`);
    root.style.setProperty("--safe-area-inset-left", `${state.left}px`);
    root.style.setProperty("--safe-area-bottom-offset", `${state.bottom}px`);
    root.style.setProperty("--app-safe-top", `${state.top}px`);
    root.style.setProperty("--app-safe-bottom", `${state.bottom}px`);
    root.style.setProperty("--viewport-height", `${state.viewportHeight}px`);
    root.style.setProperty("--keyboard-inset", `${state.keyboardHeight}px`);
    root.dataset.safeAreaBottom = String(state.bottom);
    root.dataset.safeAreaSource = state.source;
    doc.body?.setAttribute("data-safe-area-bottom", String(state.bottom));
    doc.body?.classList.toggle("keyboard-visible", state.keyboardHeight > 0);

    if (changed) {
      global.dispatchEvent?.(new CustomEvent("simplifica-safe-area-change", { detail: { ...state } }));
    }
  }

  function updateSafeArea() {
    scheduled = false;
    applySafeArea(computeSafeArea());
  }

  function scheduleUpdate() {
    if (scheduled) return;
    scheduled = true;
    global.requestAnimationFrame ? global.requestAnimationFrame(updateSafeArea) : setTimeout(updateSafeArea, 0);
  }

  function start() {
    if (!global.document?.body) {
      global.document?.addEventListener?.("DOMContentLoaded", start, { once: true });
      return;
    }
    scheduleUpdate();
    global.addEventListener?.("resize", scheduleUpdate, { passive: true });
    global.addEventListener?.("orientationchange", scheduleUpdate, { passive: true });
    global.addEventListener?.("simplifica-native-insets-change", scheduleUpdate);
    global.visualViewport?.addEventListener?.("resize", scheduleUpdate, { passive: true });
    global.visualViewport?.addEventListener?.("scroll", scheduleUpdate, { passive: true });
    setTimeout(scheduleUpdate, 120);
    setTimeout(scheduleUpdate, 600);
  }

  global.safeArea = state;
  global.SimplificaSafeAreaManager = Object.freeze({
    get: () => ({ ...state }),
    update: scheduleUpdate,
    compute: computeSafeArea
  });
  start();
})(typeof window !== "undefined" ? window : globalThis);
