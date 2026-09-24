"use strict";

(function attachHomeCarouselMount(global) {
  let activeMount = null;

  function buildCards(options) {
    const config = global.SimplificaHomeCarouselConfig;
    const canAccessScreen = typeof options.canAccessScreen === "function" ? options.canAccessScreen : () => true;
    return config.active.filter((card) => card.targetMode === "dynamic" || canAccessScreen(card.targetScreen));
  }

  function mount(container, options = {}) {
    if (!container || !container.isConnected) return null;
    if (activeMount?.container === container) return activeMount.api;
    activeMount?.unmount();

    const cards = buildCards(options);
    if (!cards.length) {
      container.textContent = "Nenhum atalho disponível no momento.";
      return null;
    }

    container.setAttribute("aria-label", "Carrossel de atalhos da Home");
    container.tabIndex = 0;

    const engine = global.SimplificaHomeCarouselEngine.createEngine(() => cards);
    const renderer = global.SimplificaHomeCarouselCss3dRenderer.createRenderer(container, engine, () => cards);
    const controller = new AbortController();
    let frameId = 0;
    let lastFrameAt = 0;
    let gesture = null;
    let destroyed = false;

    function renderFrame(now) {
      if (destroyed || !container.isConnected) return;
      const deltaSeconds = lastFrameAt ? (now - lastFrameAt) / 1000 : 0;
      lastFrameAt = now;
      if (engine.tick(now, deltaSeconds) || engine.needsRender) renderer.render();
      frameId = global.requestAnimationFrame(renderFrame);
    }

    function finishGesture(event) {
      if (!gesture || event.pointerId !== gesture.pointerId) return;
      const elapsed = Math.max(1, event.timeStamp - gesture.startedAt);
      const distance = event.clientX - gesture.originX;
      const moved = Math.abs(distance) > 8;
      engine.dragEnd((distance / elapsed) * 1000);
      engine.snap();
      if (!moved) {
        const faceIndex = renderer.faceAt(event.target);
        if (faceIndex >= 0 && faceIndex !== engine.selectedIndex) { engine.dragStart(); engine.dragBy((engine.selectedIndex - faceIndex) * 125); engine.dragEnd(0); engine.snap(); gesture = null; return; }
        const card = engine.selectedCard;
        if (card?.targetMode === "screen" && card.targetScreen) options.onNavigate?.(card.targetScreen);
      }
      gesture = null;
    }

    container.addEventListener("pointerdown", (event) => {
      if (!event.isPrimary) return;
      gesture = { pointerId: event.pointerId, originX: event.clientX, startX: event.clientX, startedAt: event.timeStamp };
      container.setPointerCapture?.(event.pointerId);
      engine.dragStart();
    }, { signal: controller.signal });
    container.addEventListener("pointermove", (event) => {
      if (!gesture || event.pointerId !== gesture.pointerId) return;
      engine.dragBy(event.clientX - gesture.startX);
      gesture.startX = event.clientX;
    }, { signal: controller.signal });
    container.addEventListener("pointerup", finishGesture, { signal: controller.signal });
    container.addEventListener("pointercancel", finishGesture, { signal: controller.signal });
    container.addEventListener("keydown", (event) => {
      if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
      event.preventDefault();
      engine.dragStart();
      engine.dragBy(event.key === "ArrowLeft" ? -125 : 125);
      engine.dragEnd(0);
      engine.snap();
    }, { signal: controller.signal });

    engine.startAutoplay(global.performance.now());
    renderer.render();
    frameId = global.requestAnimationFrame(renderFrame);

    const api = Object.freeze({
      container,
      refresh() { renderer.render(); },
      unmount() {
        if (destroyed) return;
        destroyed = true;
        controller.abort();
        if (frameId) global.cancelAnimationFrame(frameId);
        engine.stopAutoplay();
        renderer.dispose();
        if (activeMount?.api === api) activeMount = null;
      },
      getCards: () => cards.slice()
    });
    activeMount = { container, api, unmount: api.unmount };
    return api;
  }

  global.SimplificaHomeCarouselMount = Object.freeze({ mount, unmount() { activeMount?.unmount(); } });
  if (typeof module !== "undefined" && module.exports) module.exports = global.SimplificaHomeCarouselMount;
})(typeof window !== "undefined" ? window : globalThis);
