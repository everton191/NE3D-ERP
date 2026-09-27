(function attachCarouselEditorView(global) { "use strict";

/**
 * Carousel Editor View — Organizador do carrossel (PanelOrganizer na web).
 *
 * CONTRATO:
 *   createView(container, editor, registry, onChange, previews) -> view
 *   view.render() -> void
 *   view.destroy() -> void
 *
 * MODELO (Launcher 3D / ui/PanelOrganizer.kt):
 *   - Cards ativos no topo (zona do carrossel), cards fora no "Piso" embaixo.
 *   - Segurar um card (long press) levanta o fantasma; arrastar move o card.
 *   - Soltar na zona ativa reordena pelo eixo X; soltar no Piso remove;
 *     um card do Piso solto na zona ativa volta para a ordem.
 *   - Auto-scroll das duas faixas enquanto o ponteiro esta nas bordas.
 *   - A origem fica escura (alpha .25) durante o arraste.
 *
 * REGRAS:
 *   - Toda alteracao dispara onChange (a persistencia acontece fora da view).
 *   - Sem setas "mover para cima/baixo"; ordenacao somente por arraste.
 *   - Minimo 5 cards, maximo 10 (enforcado pelo EditorCore).
 *   - Nao monta na Home, nao usa app.js, nao persiste em appConfig.
 *   - Linguagem: "Remover do carrossel", nao "Excluir".
 *   - Sem dependencia de Supabase.
 */

var MIN_CARDS = 5;
var MAX_CARDS = 10;

var LONG_PRESS_MS = 500;
var MOVE_TOLERANCE = 10;
var EDGE_PX = 36;
var EDGE_STEP = EDGE_PX * 0.22;
var SCROLL_TICK_MS = 16;

/* ================================================================
   LABELS
   ================================================================ */

var LABELS = {
  title: "Editar Carrossel",
  activeCards: "Carrossel",
  floorCards: "Piso",
  floorHint: "Piso · arraste para o carrossel",
  floorHintOver: "Piso · solte para remover",
  add: "Adicionar ao carrossel",
  remove: "Remover do carrossel",
  autoplay: "Reproduzir automaticamente",
  interval: "Intervalo (ms)",
  restore: "Restaurar padrao",
  empty: "Nenhum card disponivel",
  noActive: "Nenhum card no carrossel",
  futureHint: "Em breve",
  orderHint: "Segure e arraste um card para alterar a ordem.",
  minimumHint: "Mantenha ao menos 5 cards no carrossel.",
  maximumHint: "O carrossel comporta no máximo 10 cards.",
};

/* ================================================================
   HELPERS DOM (abstratos para testabilidade)
   ================================================================ */

function el(tag, attrs, children) {
  var node = { tag: tag, attrs: attrs || {}, children: children || [], type: "element" };
  return node;
}

function text(value) {
  return { tag: "text", value: value, type: "text" };
}

/* ================================================================
   CARD RENDERER
   ================================================================ */

function renderCard(item, zone, previews, extraClass, style) {
  var preview = (previews && previews[item.id]) || {};
  var icon = typeof preview.icon === "string" && preview.icon ? preview.icon : item.title.charAt(0);
  var detail = typeof preview.detail === "string" ? preview.detail : "";

  var frameChildren = [
    el("span", { class: "editor-card-icon" }, [text(icon)]),
    el("strong", { class: "editor-card-title" }, [text(item.title)]),
    el("span", { class: "editor-card-id" }, [text(item.id)]),
  ];
  if (detail) frameChildren.push(el("small", { class: "editor-card-detail" }, [text(detail)]));

  return el("div", {
    class: "editor-card editor-card-" + zone + (extraClass ? " " + extraClass : ""),
    "data-card-id": item.id,
    "data-organizer-card": item.id,
    "data-card-zone": zone,
    style: style || "",
    title: zone === "floor" ? LABELS.add + " " + item.title : LABELS.remove + " " + item.title,
  }, [
    el("div", { class: "editor-card-frame" }, frameChildren),
  ]);
}

/* ================================================================
   VIEW STRUCTURE BUILDER
   ================================================================ */

function buildActiveCards(editor, registry) {
  var activeIds = editor.getState().visibleCardIds;
  var cards = [];
  activeIds.forEach(function(id) {
    var card = registry.get(id);
    if (card && !card.future) cards.push(card);
  });
  return cards;
}

function buildFloorCards(editor, registry) {
  var activeIds = editor.getState().visibleCardIds;
  return (registry.all || []).filter(function(card) {
    return !card.future && card.available !== false && activeIds.indexOf(card.id) === -1;
  });
}

function buildRow(zone, cards, previews, emptyLabel) {
  var children = [];
  if (!cards.length) {
    children.push(el("p", { class: "editor-empty" }, [text(emptyLabel)]));
  } else {
    cards.forEach(function(card) { children.push(renderCard(card, zone, previews)); });
  }
  return el("div", {
    class: "organizer-row organizer-row-" + zone,
    "data-organizer-row": zone,
    "data-allow-horizontal-scroll": "",
  }, children);
}

function buildOrganizerCarousel(cards, previews, emptyLabel) {
  if (!cards.length) return el("p", { class: "editor-empty" }, [text(emptyLabel)]);
  var count = cards.length;
  return el("div", { class: "organizer-carousel-stage", "data-organizer-carousel": "true" }, cards.map(function(card, index) {
    return renderCard(card, "active", previews, "organizer-carousel-panel", "--organizer-angle:" + (index * 360 / count) + "deg;");
  }));
}

function buildViewStructure(editor, registry, previews) {
  var state = editor.getState();
  var activeCards = buildActiveCards(editor, registry);
  var floorCards = buildFloorCards(editor, registry);
  var children = [];

  children.push(el("h2", { class: "editor-title" }, [text(LABELS.title)]));

  children.push(el("div", { class: "organizer-zones" }, [
    el("section", { class: "organizer-zone organizer-zone-active", "data-organizer-zone": "active" }, [
      el("div", { class: "organizer-zone-head" }, [
        el("h3", {}, [text(LABELS.activeCards + " (" + activeCards.length + ")")]),
        el("span", { class: "organizer-zone-hint" }, [text(LABELS.orderHint)]),
      ]),
      buildOrganizerCarousel(activeCards, previews, LABELS.noActive),
    ]),
    el("p", { class: "organizer-caption", "data-organizer-caption": "true" }, [text(LABELS.floorHint)]),
    el("section", { class: "organizer-zone organizer-zone-floor", "data-organizer-zone": "floor" }, [
      el("div", { class: "organizer-zone-head" }, [
        el("h3", {}, [text(LABELS.floorCards + " (" + floorCards.length + ")")]),
      ]),
      buildRow("floor", floorCards, previews, LABELS.empty),
    ]),
  ]));

  var count = state.visibleCardIds.length;
  var limit = count <= MIN_CARDS ? LABELS.minimumHint : (count >= MAX_CARDS ? LABELS.maximumHint : "");

  // O organizador do Launcher não possui botões paralelos: piso e carrossel
  // são as únicas ações. Isso evita criar um segundo fluxo além do arraste.
  children.push(el("p", { class: "editor-limit", "data-organizer-count": String(count) }, [
    text(limit || (count + " de " + MAX_CARDS + " cards no carrossel.")),
  ]));

  children.push(el("div", {
    class: "organizer-ghost",
    "data-organizer-ghost": "true",
    hidden: "true",
  }, []));

  return el("div", { class: "editor-container organizer", "data-carousel-organizer": "true" }, children);
}

/* ================================================================
   VIEW FACTORY
   ================================================================ */

function createView(container, editor, registry, onChange, previews) {
  var bound = false;
  var dispose = null;

  function render() {
    var tree = buildViewStructure(editor, registry, previews);
    container.innerHTML = "";
    container.appendChild(materialize(tree));
    if (!bound) {
      dispose = attachListeners(container, editor, registry, render, onChange);
      bound = true;
    }
  }

  function destroy() {
    if (typeof dispose === "function") dispose();
    dispose = null;
    bound = false;
    container.innerHTML = "";
  }

  return Object.freeze({ render: render, destroy: destroy });
}

/* ================================================================
   MATERIALIZE (tree -> DOM real)
   ================================================================ */

function materialize(node) {
  if (node.type === "text") {
    return document.createTextNode(node.value);
  }
  var element = document.createElement(node.tag);
  Object.keys(node.attrs).forEach(function(key) {
    var val = node.attrs[key];
    if (key === "class") {
      element.className = val;
    } else if (key === "checked") {
      if (val) element.checked = true;
    } else if (key === "disabled") {
      element.disabled = val;
    } else if (key === "value") {
      element.value = val;
    } else if (key === "hidden") {
      element.setAttribute("hidden", "");
    } else if (key === "title") {
      element.title = val;
    } else {
      element.setAttribute(key, val);
    }
  });
  node.children.forEach(function(child) {
    element.appendChild(materialize(child));
  });
  return element;
}

/* ================================================================
   EVENT LISTENERS
   ================================================================ */

function findCard(target, root) {
  var node = target;
  while (node && node !== root) {
    if (node.getAttribute && node.getAttribute("data-organizer-card")) return node;
    node = node.parentNode;
  }
  return null;
}

function findAction(target, root) {
  var node = target;
  while (node && node !== root) {
    if (node.getAttribute && node.getAttribute("data-action")) return node;
    node = node.parentNode;
  }
  return null;
}

function handleAction(action, cardId, editor, registry, rerender, onChange) {
  if (action === "restore") editor.restoreDefaults();
  else if (action === "add") editor.addCard(cardId);
  else if (action === "remove") editor.removeCard(cardId);
  else return;
  onChange && onChange(editor.getState());
  rerender();
}

function attachListeners(root, editor, registry, rerender, onChange) {
  var pending = null;
  var drag = null;
  var dragCard = null;
  var longPressTimer = 0;
  var scrollTimer = 0;
  var suppressClickUntil = 0;
  var windowBound = false;
  var touchGuardBound = false;

  function zoneNode(zone) { return root.querySelector('[data-organizer-zone="' + zone + '"]'); }
  function rowNode(zone) { return root.querySelector('[data-organizer-row="' + zone + '"]'); }
  function ghostNode() { return root.querySelector("[data-organizer-ghost]"); }
  function captionNode() { return root.querySelector("[data-organizer-caption]"); }

  function clearLongPress() {
    if (longPressTimer) { clearTimeout(longPressTimer); longPressTimer = 0; }
  }

  function stopAutoScroll() {
    if (scrollTimer) { clearInterval(scrollTimer); scrollTimer = 0; }
  }

  function zoneUnder(x, y) {
    var zones = ["active", "floor"];
    for (var i = 0; i < zones.length; i += 1) {
      var zone = zoneNode(zones[i]);
      if (!zone || typeof zone.getBoundingClientRect !== "function") continue;
      var rect = zone.getBoundingClientRect();
      if (x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom) return zones[i];
    }
    return null;
  }

  function updateAutoScroll() {
    if (!drag) return;
    var zone = zoneUnder(drag.x, drag.y);
    if (!zone) return;
    var bounds = zoneNode(zone).getBoundingClientRect();
    var row = rowNode(zone);
    if (!row) return;
    var delta = 0;
    if (drag.x < bounds.left + EDGE_PX) delta = -EDGE_STEP;
    else if (drag.x > bounds.right - EDGE_PX) delta = EDGE_STEP;
    if (delta) row.scrollLeft += delta;
  }

  function startAutoScroll() {
    if (scrollTimer) return;
    scrollTimer = setInterval(function() {
      if (!drag) { stopAutoScroll(); return; }
      updateAutoScroll();
    }, SCROLL_TICK_MS);
  }

  function highlightZone(x, y) {
    var zone = zoneUnder(x, y);
    ["active", "floor"].forEach(function(name) {
      var node = zoneNode(name);
      if (node) node.classList.toggle("is-over", zone === name && !!drag);
    });
    var caption = captionNode();
    if (caption) caption.textContent = zone === "floor" ? LABELS.floorHintOver : LABELS.floorHint;
  }

  function moveGhost(x, y) {
    var ghost = ghostNode();
    if (!ghost) return;
    ghost.style.left = x + "px";
    ghost.style.top = y + "px";
  }

  function bindWindow() {
    if (windowBound) return;
    windowBound = true;
    window.addEventListener("pointermove", onPointerMove, { passive: false });
    window.addEventListener("pointerup", onPointerEnd);
    window.addEventListener("pointercancel", onPointerEnd);
    window.addEventListener("blur", onPointerEnd);
  }

  function unbindWindow() {
    if (!windowBound) return;
    windowBound = false;
    window.removeEventListener("pointermove", onPointerMove);
    window.removeEventListener("pointerup", onPointerEnd);
    window.removeEventListener("pointercancel", onPointerEnd);
    window.removeEventListener("blur", onPointerEnd);
    stopTouchGuard();
  }

  function startTouchGuard() {
    if (touchGuardBound) return;
    touchGuardBound = true;
    window.addEventListener("touchmove", onTouchMove, { passive: false });
  }

  function stopTouchGuard() {
    if (!touchGuardBound) return;
    touchGuardBound = false;
    window.removeEventListener("touchmove", onTouchMove);
  }

  function onTouchMove(event) {
    if (drag && event.cancelable) event.preventDefault();
  }

  function cancelGesture() {
    clearLongPress();
    stopAutoScroll();
    pending = null;
    if (dragCard) dragCard.classList.remove("is-dragging");
    dragCard = null;
    drag = null;
    root.classList.remove("is-dragging-active");
    ["active", "floor"].forEach(function(name) {
      var node = zoneNode(name);
      if (node) node.classList.remove("is-over");
    });
    var ghost = ghostNode();
    if (ghost) ghost.setAttribute("hidden", "");
    unbindWindow();
  }

  function beginDrag() {
    if (!pending) return;
    clearLongPress();
    drag = { id: pending.id, fromZone: pending.zone, x: pending.x, y: pending.y, pointerId: pending.pointerId };
    dragCard = pending.card;
    pending = null;
    suppressClickUntil = Date.now() + 500;
    dragCard.classList.add("is-dragging");
    root.classList.add("is-dragging-active");
    try { if (navigator.vibrate) navigator.vibrate(12); } catch (_) { /* sem vibração */ }
    var ghost = ghostNode();
    if (ghost) {
      var titleNode = dragCard.querySelector(".editor-card-title");
      ghost.textContent = titleNode ? titleNode.textContent : dragCard.getAttribute("data-organizer-card");
      ghost.removeAttribute("hidden");
      moveGhost(drag.x, drag.y);
    }
    startTouchGuard();
    startAutoScroll();
    highlightZone(drag.x, drag.y);
  }

  function insertionIndex(x) {
    var active = zoneNode("active");
    if (!active) return 0;
    var cards = active.querySelectorAll("[data-organizer-card]");
    for (var i = 0; i < cards.length; i += 1) {
      var rect = cards[i].getBoundingClientRect();
      if (x < rect.left + rect.width / 2) return i;
    }
    return cards.length;
  }

  function commitDrop() {
    if (!drag) return;
    var id = drag.id;
    var fromZone = drag.fromZone;
    var x = drag.x;
    var y = drag.y;
    var before = JSON.stringify(editor.getState());
    var zone = zoneUnder(x, y);
    var from = editor.getState().visibleCardIds.indexOf(id);

    if (zone === "floor" && fromZone === "active") {
      editor.removeCard(id);
    } else if (zone === "active") {
      var insertion = insertionIndex(x);
      if (from >= 0) {
        var target = (insertion > from ? insertion - 1 : insertion);
        editor.moveCardToIndex(id, Math.max(0, target));
      } else if (editor.addCard(id)) {
        editor.moveCardToIndex(id, Math.min(insertion, editor.getState().visibleCardIds.length - 1));
      }
    }

    var changed = before !== JSON.stringify(editor.getState());
    cancelGesture();
    if (!changed) return;
    onChange && onChange(editor.getState());
    rerender();
  }

  function onPointerDown(event) {
    if (event.button != null && event.button !== 0) return;
    var card = findCard(event.target, root);
    if (!card || findAction(event.target, root)) return;
    if (pending || drag) cancelGesture();
    pending = {
      id: card.getAttribute("data-organizer-card"),
      zone: card.getAttribute("data-card-zone") || "active",
      card: card,
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      x: event.clientX,
      y: event.clientY,
    };
    bindWindow();
    clearLongPress();
    longPressTimer = setTimeout(function() { longPressTimer = 0; beginDrag(); }, LONG_PRESS_MS);
  }

  function onPointerMove(event) {
    if (!root.isConnected) { cancelGesture(); return; }
    if (pending) {
      if (event.pointerId != null && pending.pointerId != null && event.pointerId !== pending.pointerId) return;
      var moved = Math.abs(event.clientX - pending.startX) + Math.abs(event.clientY - pending.startY);
      if (moved > MOVE_TOLERANCE) cancelGesture();
      else { pending.x = event.clientX; pending.y = event.clientY; }
      return;
    }
    if (!drag) return;
    if (event.pointerId != null && drag.pointerId != null && event.pointerId !== drag.pointerId) return;
    if (event.cancelable) event.preventDefault();
    drag.x = event.clientX;
    drag.y = event.clientY;
    moveGhost(drag.x, drag.y);
    highlightZone(drag.x, drag.y);
  }

  function onPointerEnd() {
    if (!root.isConnected) { cancelGesture(); return; }
    if (!drag) { cancelGesture(); return; }
    commitDrop();
  }

  root.addEventListener("pointerdown", onPointerDown);

  root.addEventListener("click", function(e) {
    if (Date.now() < suppressClickUntil) {
      e.preventDefault();
      e.stopPropagation();
      return;
    }
    var target = e.target;
    while (target && target !== root) {
      var action = target.getAttribute && target.getAttribute("data-action");
      var cardId = target.getAttribute && target.getAttribute("data-card-id");
      if (action && cardId) {
        e.preventDefault();
        if (!target.disabled) handleAction(action, cardId, editor, registry, rerender, onChange);
        return;
      }
      target = target.parentNode;
    }
  });

  return function dispose() { cancelGesture(); };
}

/* ================================================================
   EXPORTACAO
   ================================================================ */

global.SimplificaCarouselEditorView = Object.freeze({
  createView: createView,
  buildViewStructure: buildViewStructure,
  materialize: materialize,
  LABELS: LABELS,
  MIN_CARDS: MIN_CARDS,
  MAX_CARDS: MAX_CARDS,
});

if (typeof module !== "undefined" && module.exports) {
  module.exports = global.SimplificaCarouselEditorView;
}

})(typeof window !== "undefined" ? window : globalThis);
