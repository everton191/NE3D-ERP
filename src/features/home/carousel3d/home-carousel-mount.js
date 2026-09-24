"use strict";

(function attachHomeCarouselMount(global) {
  let activeMount = null;

  function readCardPresentations(container) {
    try {
      const data = JSON.parse(container?.dataset.homeCarouselPresentations || "{}");
      return data && typeof data === "object" && !Array.isArray(data) ? data : {};
    } catch (_) { return {}; }
  }

  function buildCards(options, presentations) {
    const config = global.SimplificaHomeCarouselConfig;
    const canAccessScreen = typeof options.canAccessScreen === "function" ? options.canAccessScreen : () => true;
    return config.active
      .filter((card) => card.targetMode === "dynamic" || canAccessScreen(card.targetScreen))
      .map((card) => Object.freeze({ ...card, presentation: presentations[card.id] || null }));
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
