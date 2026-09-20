(function attachHomeCarouselEngine(global) {
  "use strict";
  const config = global.SimplificaHomeCarouselConfig || (typeof require === "function" && require("../config/home-carousel-config.js"));
  const modulo = function (value, size) { return ((value % size) + size) % size; };
  function createEngine(cards, options) {
    const opts = Object.assign({}, config, options); let position = 0, velocity = 0, dragging = false, autoplayAt = 0, paused = false, dirty = true;
    const count = function () { return cards().length; };
    const select = function () { const n = count(); return n ? modulo(Math.round(position), n) : 0; };
    const api = { get selectedIndex() { return select(); }, get selectedCard() { return cards()[select()] || null; }, get dragging() { return dragging; }, get needsRender() { return dirty; }, consumeRender: function () { dirty = false; }, dragStart: function () { dragging = true; paused = true; velocity = 0; dirty = true; }, dragBy: function (pixels) { if (dragging) { position += pixels * opts.dragToIndexRatio; dirty = true; } }, dragEnd: function (pixelsPerSecond) { dragging = false; velocity = (pixelsPerSecond || 0) * opts.dragToIndexRatio; paused = false; dirty = true; }, snap: function () { position = Math.round(position); velocity = 0; dirty = true; }, hide: function (id, state) { state.hide(id); position = select(); dirty = true; }, tick: function (now, dt) { const n = count(); if (!n) return false; if (!dragging && Math.abs(velocity) > .002) { position += velocity * dt; velocity *= Math.pow(opts.friction, dt * 60); dirty = true; } else if (!dragging && Math.abs(position - Math.round(position)) > .001) { position += (Math.round(position) - position) * Math.min(1, dt * 1000 / opts.snapDurationMs); dirty = true; } if (!paused && autoplayAt && now >= autoplayAt) { position = Math.round(position) + 1; autoplayAt = now + opts.autoplayIntervalMs; dirty = true; } return dirty; }, startAutoplay: function (now) { autoplayAt = now + opts.autoplayIntervalMs; }, stopAutoplay: function () { autoplayAt = 0; }, transform: function (index) { const n = count(); let delta = index - position; if (n) { while (delta > n / 2) delta -= n; while (delta < -n / 2) delta += n; } const depth = Math.cos(delta * Math.PI / 3); return Object.freeze({ index, x: Math.sin(delta * Math.PI / 3), depth, scale: .76 + Math.max(0, depth) * .24, alpha: .28 + Math.max(0, depth) * .72, rotationY: -delta * 18 }); } };
    return Object.freeze(api);
  }
  global.SimplificaHomeCarouselEngine = Object.freeze({ createEngine });
  if (typeof module !== "undefined" && module.exports) module.exports = global.SimplificaHomeCarouselEngine;
})(typeof window !== "undefined" ? window : globalThis);
