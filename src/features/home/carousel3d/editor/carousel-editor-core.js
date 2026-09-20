(function attachCarouselEditorCore(global) { "use strict";

/**
 * Carousel Editor Core — Operacoes puras para editar o carrossel.
 *
 * PRINCIPIO:
 *   EDITAR CARD nao significa EDITAR FUNCAO DO ERP.
 *   Remover um card somente faz ele desaparecer do carrossel.
 *
 * CONTRATO:
 *   editor(state, registry) retorna um objeto com operacoes puras.
 *
 * ESTADO:
 *   { visibleCardIds: string[], cardOrder: string[],
 *     autoplay: boolean, autoplayInterval: number }
 *
 * OPERACOES:
 *   addCard(id)       - adiciona card disponivel
 *   removeCard(id)    - remove card (nao remove feature/route)
 *   moveCard(id, dir) - move card up/down no array
 *   restoreDefaults() - restaura configuracao padrao
 *   setAutoplay(on)   - liga/desliga autoplay
 *   setAutoplayInterval(ms) - define intervalo (min 3000, max 60000)
 *   getState()        - retorna snapshot do estado
 *   canAdd(id)        - verifica se pode adicionar
 *
 * REGRAS:
 *   - Nao permite adicionar future=true ou available=false
 *   - Nao permite IDs inexistentes no registry
 *   - Nao permite duplicacao
 *   - Nao acessa DOM, Canvas, WebGL
 *   - Nao acessa Supabase, fetch, localStorage
 *   - Nao importa app.js
 */

var MIN_INTERVAL = 3000;
var MAX_INTERVAL = 60000;
var DEFAULT_INTERVAL = 15000;

/* ================================================================
   DEFAULT STATE BUILDER
   ================================================================ */

function buildDefaultState(registry) {
  var active = registry.active || [];
  var visibleIds = [];
  var order = [];

  active.forEach(function(card) {
    order.push(card.id);
    if (card.defaultVisible) visibleIds.push(card.id);
  });

  return {
    visibleCardIds: visibleIds,
    cardOrder: order,
    autoplay: true,
    autoplayInterval: DEFAULT_INTERVAL,
  };
}

/* ================================================================
   VALIDATION HELPERS
   ================================================================ */

function isValidId(registry, id) {
  var card = registry.get(id);
  return card !== null;
}

function isAvailable(registry, id) {
  var card = registry.get(id);
  return card !== null && card.available === true && card.future === false;
}

function clampInterval(ms) {
  var n = Number(ms) || DEFAULT_INTERVAL;
  if (n < MIN_INTERVAL) return MIN_INTERVAL;
  if (n > MAX_INTERVAL) return MAX_INTERVAL;
  return Math.round(n);
}

/* ================================================================
   EDITOR FACTORY
   ================================================================ */

function createEditor(initialState, registry) {
  var state = {
    visibleCardIds: Array.isArray(initialState && initialState.visibleCardIds) ? initialState.visibleCardIds.slice() : [],
    cardOrder: Array.isArray(initialState && initialState.cardOrder) ? initialState.cardOrder.slice() : [],
    autoplay: initialState ? !!initialState.autoplay : true,
    autoplayInterval: clampInterval(initialState && initialState.autoplayInterval),
  };

  function cloneState() {
    return {
      visibleCardIds: state.visibleCardIds.slice(),
      cardOrder: state.cardOrder.slice(),
      autoplay: state.autoplay,
      autoplayInterval: state.autoplayInterval,
    };
  }

  function canAdd(id) {
    if (!isValidId(registry, id)) return false;
    if (!isAvailable(registry, id)) return false;
    if (state.visibleCardIds.indexOf(id) !== -1) return false;
    return true;
  }

  function addCard(id) {
    if (!canAdd(id)) return false;
    state.visibleCardIds.push(id);
    state.cardOrder.push(id);
    return true;
  }

  function removeCard(id) {
    var idx = state.visibleCardIds.indexOf(id);
    if (idx === -1) return false;
    state.visibleCardIds.splice(idx, 1);
    state.cardOrder = state.cardOrder.filter(function(cardId) { return cardId !== id; });
    return true;
  }

  function moveCard(id, direction) {
    var idx = state.visibleCardIds.indexOf(id);
    if (idx === -1) return false;
    var newIdx = idx + direction;
    if (newIdx < 0 || newIdx >= state.visibleCardIds.length) return false;
    var temp = state.visibleCardIds[idx];
    state.visibleCardIds[idx] = state.visibleCardIds[newIdx];
    state.visibleCardIds[newIdx] = temp;
    state.cardOrder = state.visibleCardIds.slice();
    return true;
  }

  function moveCardToIndex(id, index) {
    var currentIndex = state.visibleCardIds.indexOf(id);
    var targetIndex = Math.floor(Number(index));
    if (currentIndex === -1 || !Number.isFinite(targetIndex) || targetIndex < 0 || targetIndex >= state.visibleCardIds.length) return false;
    if (currentIndex === targetIndex) return true;
    state.visibleCardIds.splice(currentIndex, 1);
    state.visibleCardIds.splice(targetIndex, 0, id);
    state.cardOrder = state.visibleCardIds.slice();
    return true;
  }

  function restoreDefaults() {
    var defaults = buildDefaultState(registry);
    state.visibleCardIds = defaults.visibleCardIds;
    state.cardOrder = defaults.cardOrder;
    state.autoplay = defaults.autoplay;
    state.autoplayInterval = defaults.autoplayInterval;
    return true;
  }

  function setAutoplay(on) {
    state.autoplay = !!on;
    return true;
  }

  function setAutoplayInterval(ms) {
    state.autoplayInterval = clampInterval(ms);
    return true;
  }

  function getState() {
    return cloneState();
  }

  return Object.freeze({
    addCard: addCard,
    removeCard: removeCard,
    moveCard: moveCard,
    moveCardToIndex: moveCardToIndex,
    restoreDefaults: restoreDefaults,
    setAutoplay: setAutoplay,
    setAutoplayInterval: setAutoplayInterval,
    getState: getState,
    canAdd: canAdd,
  });
}

/* ================================================================
   PERSISTENCE ADAPTER (in-memory)
   ================================================================ */

function createMemoryPersistence(initial) {
  var store = initial ? JSON.parse(JSON.stringify(initial)) : null;
  function loadPreferences() { return store ? JSON.parse(JSON.stringify(store)) : null; }
  function savePreferences(state) { store = JSON.parse(JSON.stringify(state)); return true; }
  return Object.freeze({
    load: loadPreferences,
    save: savePreferences,
    loadPreferences: loadPreferences,
    savePreferences: savePreferences,
    clear: function() { store = null; return true; },
  });
}

/* ================================================================
   EXPORTACAO
   ================================================================ */

global.SimplificaCarouselEditor = Object.freeze({
  createEditor: createEditor,
  createMemoryPersistence: createMemoryPersistence,
  buildDefaultState: buildDefaultState,
  MIN_INTERVAL: MIN_INTERVAL,
  MAX_INTERVAL: MAX_INTERVAL,
  DEFAULT_INTERVAL: DEFAULT_INTERVAL,
});

if (typeof module !== "undefined" && module.exports) {
  module.exports = global.SimplificaCarouselEditor;
}

})(typeof window !== "undefined" ? window : globalThis);
