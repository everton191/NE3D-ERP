(function attachHomeCarouselRegistry(global) {
  "use strict";
  const config = global.SimplificaHomeCarouselConfig || (typeof require === "function" && require("../config/home-carousel-config.js"));
  function createRegistry(screens) {
    const items = config.active.concat(config.future);
    const ids = new Set();
    items.forEach(function (item) { if (ids.has(item.id)) throw new Error("HOME_CAROUSEL_DUPLICATE_ID:" + item.id); ids.add(item.id); if (!item.future && item.targetMode !== "dynamic" && !(screens || []).includes(item.targetScreen)) throw new Error("HOME_CAROUSEL_UNKNOWN_SCREEN:" + item.targetScreen); });
    return Object.freeze({ active: Object.freeze(config.active.slice()), future: Object.freeze(config.future.slice()), all: Object.freeze(items.slice()), get: function (id) { return items.find(function (item) { return item.id === id; }) || null; } });
  }
  global.SimplificaHomeCarouselRegistry = Object.freeze({ createRegistry });
  if (typeof module !== "undefined" && module.exports) module.exports = global.SimplificaHomeCarouselRegistry;
})(typeof window !== "undefined" ? window : globalThis);
