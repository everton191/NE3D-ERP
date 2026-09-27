"use strict";

(function attachHomeCarouselMount(global) {
  let activeMount = null;
  let pendingNativeHide = 0;

  function cancelDeferredNativeHide() {
    if (!pendingNativeHide) return;
    global.clearTimeout?.(pendingNativeHide);
    pendingNativeHide = 0;
  }

  function deferNativeHide(bridge) {
    cancelDeferredNativeHide();
    pendingNativeHide = global.setTimeout(() => {
      pendingNativeHide = 0;
      Promise.resolve(bridge.hide?.()).catch(() => {});
    }, 260);
  }

  function readCardPresentations(container) {
    try {
      const data = JSON.parse(container?.dataset.homeCarouselPresentations || "{}");
      return data && typeof data === "object" && !Array.isArray(data) ? data : {};
    } catch (_) { return {}; }
  }

  function buildCards(options, presentations) {
    const config = global.SimplificaHomeCarouselConfig;
    const canAccessScreen = typeof options.canAccessScreen === "function" ? options.canAccessScreen : () => true;
    const saved = options.getPreferences?.() || null;
    const defaultIds = config.active.filter((card) => card.defaultVisible).map((card) => card.id);
    const selected = Array.isArray(saved?.visibleCardIds) && saved.visibleCardIds.length >= 5
      ? saved.visibleCardIds : defaultIds;
    const allowed = new Set(selected);
    const order = Array.isArray(saved?.cardOrder) ? saved.cardOrder : selected;
    const rank = new Map(order.map((id, index) => [id, index]));
    return config.active
      .filter((card) => allowed.has(card.id))
      .filter((card) => card.targetMode === "dynamic" || canAccessScreen(card.targetScreen))
      .sort((a, b) => (rank.get(a.id) ?? Number.MAX_SAFE_INTEGER) - (rank.get(b.id) ?? Number.MAX_SAFE_INTEGER))
      .map((card) => Object.freeze({ ...card, presentation: presentations[card.id] || null }));
  }

  function resolveNativeBridge() {
    try {
      const capacitor = global.Capacitor;
      if (!capacitor || !capacitor.Plugins) return null;
      const isNative = typeof capacitor.isNativePlatform === "function"
        ? capacitor.isNativePlatform()
        : capacitor.getPlatform?.() === "android";
      if (!isNative) return null;
      const bridge = capacitor.Plugins.SimplificaCarousel3D;
      if (!bridge || typeof bridge.show !== "function") return null;
      return bridge;
    } catch (_) { return null; }
  }

  function buildNativeItems(cards) {
    return cards.map((card) => {
      const presentation = card.presentation || {};
      const live = Array.isArray(presentation.live) ? presentation.live : [];
      return {
        id: String(card.id || ""),
        title: String(card.title || ""),
        targetScreen: card.targetMode === "screen" ? String(card.targetScreen || "") : "",
        detail: String(presentation.detail || ""),
        live: live.slice(0, 4).map((line) => String(line))
      };
    });
  }

  function probeClear(container, doc, x, y) {
    const hit = doc.elementFromPoint(x, y);
    if (!hit) return false;
    if (hit === container) return true;
    return typeof container.contains === "function" && container.contains(hit);
  }

  function readTheme(doc) {
    const classes = String(doc?.body?.className || "").split(/\s+/);
    return classes.indexOf("theme-light") >= 0 ? "light" : "dark";
  }

  function readNativeRect(container) {
    try {
      if (!container.isConnected) return null;
      const rect = container.getBoundingClientRect();
      const viewWidth = global.innerWidth || 0;
      const viewHeight = global.innerHeight || 0;
      if (!viewWidth || !viewHeight) return null;
      const left = Math.max(rect.left, 0);
      const right = Math.min(rect.right ?? rect.left + rect.width, viewWidth);
      const top = Math.max(rect.top, 0);
      const bottom = Math.min(rect.bottom ?? rect.top + rect.height, viewHeight);
      if (right - left < 8 || bottom - top < 8) return null;
      const doc = container.ownerDocument;
      const canProbe = !!doc && typeof doc.elementFromPoint === "function";
      const xs = canProbe ? [left + (right - left) * 0.3, (left + right) / 2, left + (right - left) * 0.7] : [];
      const clearAt = (y) => !canProbe || xs.every((x) => probeClear(container, doc, x, y));
      const samples = 14;
      const step = (bottom - top) / (samples - 1);
      const flags = [];
      for (let index = 0; index < samples; index += 1) flags.push(clearAt(top + step * index));
      let start = -1;
      let end = -1;
      let cursor = -1;
      for (let index = 0; index <= samples; index += 1) {
        const on = index < samples && flags[index];
        if (on && cursor < 0) cursor = index;
        if (!on && cursor >= 0) {
          if (end < 0 || index - cursor > end - start) { start = cursor; end = index - 1; }
          cursor = -1;
        }
      }
      if (start < 0) return null;
      let bandTop = top + step * start;
      let bandBottom = top + step * end;
      if (start > 0) {
        let lo = top + step * (start - 1);
        let hi = bandTop;
        for (let k = 0; k < 8; k += 1) {
          const mid = (lo + hi) / 2;
          if (clearAt(mid)) hi = mid; else lo = mid;
        }
        bandTop = hi;
      }
      if (end < samples - 1) {
        let lo = bandBottom;
        let hi = top + step * (end + 1);
        for (let k = 0; k < 8; k += 1) {
          const mid = (lo + hi) / 2;
          if (clearAt(mid)) lo = mid; else hi = mid;
        }
        bandBottom = lo;
      }
      if (bandBottom - bandTop < 40) return null;
      return { left, top: bandTop, width: right - left, height: bandBottom - bandTop, viewWidth, viewHeight, theme: readTheme(doc) };
    } catch (_) { return null; }
  }

  function notifySelect(options, cards, payload) {
    const id = String(payload?.id || "");
    const reported = String(payload?.targetScreen || "");
    const card = cards.find((entry) => entry.id === id) || null;
    const targetScreen = card?.targetMode === "screen" ? (card.targetScreen || reported) : "";
    if (targetScreen) options.onNavigate?.(targetScreen);
  }

  function mountNative(bridge, container, options, cards) {
    cancelDeferredNativeHide();
    const controller = new AbortController();
    const items = buildNativeItems(cards);
    let disposed = false;
    let fallback = null;
    let listenerHandles = [];
    let hidden = true;
    let editorOpen = typeof options.isEditorOpen === "function" ? !!options.isEditorOpen() : false;
    let frameQueued = false;
    let lastRectKey = "";

    function rectKey(rect) {
      return [rect.left, rect.top, rect.width, rect.height, rect.viewWidth, rect.viewHeight, rect.theme].join("|");
    }

    function storeListener(handle) {
      if (disposed) { try { handle?.remove?.(); } catch (_) { /* já removido */ } return; }
      listenerHandles.push(handle);
    }

    if (typeof bridge.addListener === "function") {
      Promise.resolve(bridge.addListener("select", (payload) => {
        if (disposed) return;
        notifySelect(options, cards, payload);
      })).then(storeListener).catch(() => {});
      Promise.resolve(bridge.addListener("editor", () => {
        if (disposed) return;
        editorOpen = true;
        Promise.resolve(bridge.hide?.()).catch(() => {});
        options.onEdit?.();
      })).then(storeListener).catch(() => {});
    }

    function useFallback(error) {
      if (disposed || fallback || editorOpen) return;
      global.console?.warn?.("[home-carousel] carrossel nativo indisponível, usando CSS 3D", error);
      fallback = createCss3dMount(container, options, cards);
    }

    function sync() {
      if (disposed || fallback || editorOpen) return;
      const rect = readNativeRect(container);
      if (!rect) {
        if (!hidden) {
          hidden = true;
          lastRectKey = "";
          Promise.resolve(bridge.hide?.()).catch(() => {});
        }
        return;
      }
      const nextRectKey = rectKey(rect);
      if (hidden) {
        hidden = false;
        lastRectKey = nextRectKey;
        try {
          Promise.resolve(bridge.show({ ...rect, modules: items })).catch(useFallback);
        } catch (error) { useFallback(error); }
        return;
      }
      if (nextRectKey === lastRectKey) return;
      lastRectKey = nextRectKey;
      Promise.resolve(bridge.setRect(rect)).catch(() => {});
    }

    function scheduleSync() {
      if (disposed || frameQueued) return;
      frameQueued = true;
      const raf = (callback) => (typeof global.requestAnimationFrame === "function"
        ? global.requestAnimationFrame(callback)
        : global.setTimeout(callback, 32));
      raf(() => { frameQueued = false; sync(); });
    }

    const doc = container.ownerDocument;
    const observer = typeof global.MutationObserver === "function"
      ? new global.MutationObserver(scheduleSync)
      : null;
    if (observer) {
      observer.observe(doc.body || doc.documentElement, { subtree: true, childList: true, attributes: true });
    }

    if (typeof global.addEventListener === "function") {
      global.addEventListener("resize", scheduleSync, { signal: controller.signal, passive: true });
      global.addEventListener("scroll", scheduleSync, { signal: controller.signal, passive: true, capture: true });
    }
    container.addEventListener("scroll", scheduleSync, { signal: controller.signal, passive: true, capture: true });
    const overlayTimer = global.setInterval ? global.setInterval(sync, 160) : 0;
    sync();

    const api = Object.freeze({
      container,
      refresh() { fallback ? fallback.refresh() : scheduleSync(); },
      resume() {
        if (disposed || fallback) return;
        editorOpen = false;
        hidden = true;
        scheduleSync();
      },
      unmount() {
        if (disposed) return;
        disposed = true;
        controller.abort();
        if (overlayTimer) global.clearInterval?.(overlayTimer);
        try { observer?.disconnect(); } catch (_) { /* já desconectado */ }
        listenerHandles.forEach((handle) => { try { handle?.remove?.(); } catch (_) { /* já removido */ } });
        listenerHandles = [];
        if (fallback) fallback.unmount();
        // A Home recria o nó do carrossel em renderizações sequenciais durante
        // o bootstrap. Reter somente o overlay por uma janela curta evita três
        // animações de entrada; listeners e timers já foram limpos acima.
        else deferNativeHide(bridge);
      },
      getCards: () => cards.slice()
    });
    return api;
  }

  function createCss3dMount(container, options, cards) {
    const engine = global.SimplificaHomeCarouselEngine.createEngine(() => cards, { autoplayIntervalMs: 10500 });
    const renderer = global.SimplificaHomeCarouselCss3dRenderer.createRenderer(container, engine, () => cards);
    const controller = new AbortController();
    let frameId = 0;
    let lastFrameAt = 0;
    let gesture = null;
    let destroyed = false;
    let idleSince = global.performance.now();
    let previewing = false;
    let previewCompleted = false;
    const rotationStepPixels = 360 / cards.length / global.SimplificaHomeCarouselEngine.config.dragSensitivity;

    function interruptAutoplay() {
      idleSince = global.performance.now();
      previewing = false;
      previewCompleted = false;
      renderer.preview(-1);
      engine.startAutoplay(idleSince);
    }

    function renderFrame(now) {
      if (destroyed || !container.isConnected) return;
      const deltaSeconds = lastFrameAt ? (now - lastFrameAt) / 1000 : 0;
      lastFrameAt = now;
      if (!engine.dragging && !previewing && !previewCompleted && now - idleSince >= 6500) {
        previewing = true;
        renderer.preview(engine.selectedIndex);
      } else if (previewing && now - idleSince >= 9400) {
        previewing = false;
        previewCompleted = true;
        renderer.preview(-1);
      }
      if (!engine.dragging && now - idleSince >= 10500) renderer.settle();
      const selectedBeforeTick = engine.selectedIndex;
      if (engine.tick(now, deltaSeconds) || engine.needsRender) renderer.render();
      if (selectedBeforeTick !== engine.selectedIndex) {
        previewing = false;
        previewCompleted = false;
        renderer.preview(-1);
        idleSince = now;
      }
      frameId = global.requestAnimationFrame(renderFrame);
    }

    function finishGesture(event) {
      if (!gesture || event.pointerId !== gesture.pointerId) return;
      const distance = event.clientX - gesture.originX;
      const moved = Math.abs(distance) > 8 || Math.abs(event.clientY - gesture.originY) > 8;
      engine.dragEnd(0);
      interruptAutoplay();
      if (!moved) {
        const faceIndex = gesture.faceIndex;
        if (faceIndex >= 0 && faceIndex !== engine.selectedIndex) {
          const count = cards.length;
          const steps = ((engine.selectedIndex - faceIndex + count + Math.floor(count / 2)) % count) - Math.floor(count / 2);
          engine.dragStart();
          engine.dragBy(steps * rotationStepPixels);
          engine.dragEnd(0);
          engine.snap();
          renderer.settle();
          gesture = null;
          return;
        }
        const card = engine.selectedCard;
        if (card?.targetMode === "screen" && card.targetScreen) options.onNavigate?.(card.targetScreen);
      } else {
        engine.snap();
        renderer.settle();
      }
      gesture = null;
    }

    container.addEventListener("pointerdown", (event) => {
      if (!event.isPrimary) return;
      gesture = { pointerId: event.pointerId, faceIndex: renderer.faceAt(event.target), originX: event.clientX, originY: event.clientY, startX: event.clientX, startY: event.clientY, axis: null };
      container.setPointerCapture?.(event.pointerId);
      interruptAutoplay();
      renderer.beginDrag();
      engine.dragStart();
    }, { signal: controller.signal });
    container.addEventListener("pointermove", (event) => {
      if (!gesture || event.pointerId !== gesture.pointerId) return;
      if (!gesture.axis) {
        const dx = Math.abs(event.clientX - gesture.originX);
        const dy = Math.abs(event.clientY - gesture.originY);
        if (Math.max(dx, dy) < 8) return;
        gesture.axis = dy > dx * 1.2 ? "camera" : "rotation";
      }
      if (gesture.axis === "camera") renderer.moveCamera(event.clientY - gesture.startY);
      else engine.dragBy((event.clientX - gesture.startX) * 2);
      gesture.startX = event.clientX;
      gesture.startY = event.clientY;
    }, { signal: controller.signal });
    container.addEventListener("pointerup", finishGesture, { signal: controller.signal });
    container.addEventListener("pointercancel", finishGesture, { signal: controller.signal });
    container.addEventListener("keydown", (event) => {
      if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
      event.preventDefault();
      interruptAutoplay();
      renderer.beginDrag();
      engine.dragStart();
      engine.dragBy(event.key === "ArrowLeft" ? -rotationStepPixels : rotationStepPixels);
      engine.dragEnd(0);
      engine.snap();
      renderer.settle();
    }, { signal: controller.signal });

    engine.startAutoplay(global.performance.now());
    renderer.render();
    frameId = global.requestAnimationFrame(renderFrame);

    return Object.freeze({
      container,
      refresh() { renderer.render(); },
      unmount() {
        if (destroyed) return;
        destroyed = true;
        controller.abort();
        if (frameId) global.cancelAnimationFrame(frameId);
        engine.stopAutoplay();
        renderer.dispose();
      },
      getCards: () => cards.slice()
    });
  }

  function register(container, api, options) {
    activeMount = {
      container,
      api,
      options,
      unmount() {
        api.unmount();
        if (activeMount?.api === api) activeMount = null;
      }
    };
    return api;
  }

  function mount(container, options = {}) {
    if (!container || !container.isConnected) return null;
    if (activeMount?.container === container) return activeMount.api;
    activeMount?.unmount();

    const cards = buildCards(options, readCardPresentations(container));
    if (!cards.length) {
      container.textContent = "Nenhum atalho disponível no momento.";
      return null;
    }

    container.setAttribute("aria-label", "Carrossel de atalhos da Home");
    container.tabIndex = 0;

    const nativeBridge = resolveNativeBridge();
    if (nativeBridge) {
      const rect = readNativeRect(container);
      if (rect && rect.width > 0 && rect.height > 0) {
        return register(container, mountNative(nativeBridge, container, options, cards), options);
      }
    }

    return register(container, createCss3dMount(container, options, cards), options);
  }

  function remount() {
    const current = activeMount;
    if (!current?.container?.isConnected) return null;
    const { container, options } = current;
    current.unmount();
    return mount(container, options);
  }

  global.SimplificaHomeCarouselMount = Object.freeze({
    mount,
    remount,
    unmount() { activeMount?.unmount(); },
    resume() { activeMount?.api?.resume?.(); }
  });
  if (typeof module !== "undefined" && module.exports) module.exports = global.SimplificaHomeCarouselMount;
})(typeof window !== "undefined" ? window : globalThis);
