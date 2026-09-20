(function attachHomeCarouselState(global) {
  "use strict";
  function createState(registry, saved) {
    const hidden = new Set((saved && saved.hidden) || []);
    return Object.freeze({ visible: function () { return registry.active.filter(function (card) { return !hidden.has(card.id); }); }, hide: function (id) { const card = registry.get(id); if (card && card.removable) hidden.add(id); return this; }, show: function (id) { hidden.delete(id); return this; }, snapshot: function () { return Object.freeze({ hidden: Array.from(hidden) }); } });
  }
  global.SimplificaHomeCarouselState = Object.freeze({ createState });
  if (typeof module !== "undefined" && module.exports) module.exports = global.SimplificaHomeCarouselState;
})(typeof window !== "undefined" ? window : globalThis);
