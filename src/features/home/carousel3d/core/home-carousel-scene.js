(function attachHomeCarouselScene(global) {
  "use strict";
  const registryApi = global.SimplificaHomeCarouselRegistry || (typeof require === "function" && require("../widgets/home-carousel-widget-registry.js"));
  const stateApi = global.SimplificaHomeCarouselState || (typeof require === "function" && require("../widgets/home-carousel-widget-state.js"));
  const engineApi = global.SimplificaHomeCarouselEngine || (typeof require === "function" && require("./home-carousel-engine.js"));
  const rendererApi = global.SimplificaHomeCarouselRenderer || (typeof require === "function" && require("../visual/home-carousel-renderer.js"));
  function createScene(canvas, options) {
    const registry = registryApi.createRegistry((options && options.screens) || []), state = stateApi.createState(registry, options && options.state), engine = engineApi.createEngine(function () { return state.visible(); }, options), renderer = rendererApi.createRenderer(canvas, engine, function () { return state.visible(); });
    let active = false, frame = 0, wake = 0, last = 0, downX = 0, lastX = 0, lastTime = 0;
    function draw(now) { if (!active) return; const dt = last ? Math.min(.05, (now - last) / 1000) : 0; last = now; const changed = engine.tick(now, dt); if (changed || engine.needsRender) renderer.render(); if (engine.dragging || Math.abs(engine.transform(engine.selectedIndex).x) > .001) frame = global.requestAnimationFrame(draw); }
    function request(reason) { if (!active) return; if (reason === "autoplay") engine.startAutoplay(Date.now()); if (!frame) frame = global.requestAnimationFrame(draw); if (wake) global.clearTimeout(wake); wake = global.setTimeout(function () { request("autoplay"); }, (options && options.autoplayIntervalMs) || 15000); }
    function down(event) { downX = lastX = event.clientX; lastTime = event.timeStamp; engine.dragStart(); request(); }
    function move(event) { if (!engine.dragging) return; engine.dragBy(event.clientX - lastX); lastX = event.clientX; request(); }
    function up(event) { if (!engine.dragging) return; const elapsed = Math.max(1, event.timeStamp - lastTime); engine.dragEnd((event.clientX - downX) / elapsed * 1000); request(); }
    const api = { registry, state, engine, mount: function () { if (active) return api; active = true; canvas.addEventListener("pointerdown", down); canvas.addEventListener("pointermove", move); canvas.addEventListener("pointerup", up); canvas.addEventListener("pointercancel", up); request("autoplay"); return api; }, unmount: function () { active = false; if (frame) global.cancelAnimationFrame(frame); if (wake) global.clearTimeout(wake); canvas.removeEventListener("pointerdown", down); canvas.removeEventListener("pointermove", move); canvas.removeEventListener("pointerup", up); canvas.removeEventListener("pointercancel", up); renderer.dispose(); }, requestRender: request, hideCard: function (id) { engine.hide(id, state); request(); } };
    return Object.freeze(api);
  }
  global.SimplificaHomeCarouselScene = Object.freeze({ createScene });
  if (typeof module !== "undefined" && module.exports) module.exports = global.SimplificaHomeCarouselScene;
})(typeof window !== "undefined" ? window : globalThis);
