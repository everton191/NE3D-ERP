(function attachCarouselEditorView(global) { "use strict";

/**
 * Carousel Editor View — UI isolada do editor do carrossel.
 *
 * CONTRATO:
 *   createView(container, editor, registry) -> view
 *   view.render() -> void
 *   view.destroy() -> void
 *
 * REGRAS:
 *   - Nao monta na Home
 *   - Nao usa app.js
 *   - Nao persiste em appConfig
 *   - Usa EditorCore para operacoes
 *   - Linguagem: "Remover do carrossel", nao "Excluir"
 *   - Cards futuros nao podem ser adicionados
 *   - Sem dependencia de Supabase
 */

/* ================================================================
   LABELS
   ================================================================ */

var LABELS = {
  title: "Editar Carrossel",
  activeCards: "Cards no carrossel",
  availableCards: "Cards disponiveis",
  add: "Adicionar ao carrossel",
  remove: "Remover do carrossel",
  moveUp: "Mover para cima",
  moveDown: "Mover para baixo",
  autoplay: "Reproduzir automaticamente",
  autoplayOn: "Ligado",
  autoplayOff: "Desligado",
  interval: "Intervalo (ms)",
  restore: "Restaurar padrao",
  empty: "Nenhum card disponivel",
  noActive: "Nenhum card no carrossel",
  futureHint: "Em breve",
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
   CARD ITEM RENDERER
   ================================================================ */

function renderActiveCard(item, editor) {
  var canMoveUp = editor.getState().visibleCardIds.indexOf(item.id) > 0;
  var canMoveDown = editor.getState().visibleCardIds.indexOf(item.id) <
    editor.getState().visibleCardIds.length - 1;

  return el("div", { class: "editor-card active", "data-card-id": item.id }, [
    el("div", { class: "editor-card-info" }, [
      el("span", { class: "editor-card-title" }, [text(item.title)]),
      el("span", { class: "editor-card-id" }, [text(item.id)]),
    ]),
    el("div", { class: "editor-card-actions" }, [
      el("button", {
        class: "editor-btn editor-btn-move-up",
        "data-action": "move-up",
        "data-card-id": item.id,
        disabled: !canMoveUp,
        title: LABELS.moveUp,
        "aria-label": LABELS.moveUp + " " + item.title,
      }, [text("\u2191")]),
      el("button", {
        class: "editor-btn editor-btn-move-down",
        "data-action": "move-down",
        "data-card-id": item.id,
        disabled: !canMoveDown,
        title: LABELS.moveDown,
        "aria-label": LABELS.moveDown + " " + item.title,
      }, [text("\u2193")]),
      el("button", {
        class: "editor-btn editor-btn-remove",
        "data-action": "remove",
        "data-card-id": item.id,
        title: LABELS.remove,
        "aria-label": LABELS.remove + " " + item.title,
      }, [text("\u2715")]),
    ]),
  ]);
}

function renderAvailableCard(item, canAdd) {
  return el("div", { class: "editor-card available", "data-card-id": item.id }, [
    el("div", { class: "editor-card-info" }, [
      el("span", { class: "editor-card-title" }, [text(item.title)]),
      el("span", { class: "editor-card-id" }, [text(item.id)]),
    ]),
    el("div", { class: "editor-card-actions" }, [
      el("button", {
        class: "editor-btn editor-btn-add",
        "data-action": "add",
        "data-card-id": item.id,
        disabled: !canAdd,
        title: LABELS.add,
        "aria-label": LABELS.add + " " + item.title,
      }, [text("+")]),
    ]),
  ]);
}

function renderFutureCard(item) {
  return el("div", { class: "editor-card future", "data-card-id": item.id }, [
    el("div", { class: "editor-card-info" }, [
      el("span", { class: "editor-card-title" }, [text(item.title)]),
      el("span", { class: "editor-card-hint" }, [text(LABELS.futureHint)]),
    ]),
  ]);
}

/* ================================================================
   VIEW STRUCTURE BUILDER
   ================================================================ */

function buildViewStructure(editor, registry) {
  var state = editor.getState();
  var activeIds = state.visibleCardIds;
  var allCards = registry.all || [];
  var activeCards = [];
  var availableCards = [];
  var futureCards = [];

  allCards.forEach(function(card) {
    if (card.future) {
      futureCards.push(card);
    } else if (activeIds.indexOf(card.id) !== -1) {
      activeCards.push(card);
    } else if (card.available) {
      availableCards.push(card);
    }
  });

  var children = [];

  children.push(el("h2", { class: "editor-title" }, [text(LABELS.title)]));

  var activeSection = el("div", { class: "editor-section editor-active-section" }, [
    el("h3", {}, [text(LABELS.activeCards + " (" + activeCards.length + ")")]),
  ]);

  if (activeCards.length === 0) {
    activeSection.children.push(el("p", { class: "editor-empty" }, [text(LABELS.noActive)]));
  } else {
    activeCards.forEach(function(card) {
      activeSection.children.push(renderActiveCard(card, editor));
    });
  }

  children.push(activeSection);

  var availSection = el("div", { class: "editor-section editor-available-section" }, [
    el("h3", {}, [text(LABELS.availableCards + " (" + availableCards.length + ")")]),
  ]);

  if (availableCards.length === 0) {
    availSection.children.push(el("p", { class: "editor-empty" }, [text(LABELS.empty)]));
  } else {
    availableCards.forEach(function(card) {
      availSection.children.push(renderAvailableCard(card, editor.canAdd(card.id)));
    });
  }

  children.push(availSection);

  if (futureCards.length > 0) {
    var futureSection = el("div", { class: "editor-section editor-future-section" }, [
      el("h3", {}, [text(LABELS.futureHint)]),
    ]);
    futureCards.forEach(function(card) {
      futureSection.children.push(renderFutureCard(card));
    });
    children.push(futureSection);
  }

  var controls = el("div", { class: "editor-controls" }, [
    el("label", { class: "editor-toggle" }, [
      el("input", {
        type: "checkbox",
        class: "editor-autoplay-toggle",
        checked: state.autoplay,
      }, []),
      text(" " + LABELS.autoplay),
    ]),
    el("div", { class: "editor-interval" }, [
      el("label", { for: "editor-interval-input" }, [text(LABELS.interval + ": ")]),
      el("input", {
        type: "number",
        id: "editor-interval-input",
        class: "editor-interval-input",
        min: "3000",
        max: "60000",
        step: "1000",
        value: String(state.autoplayInterval),
      }, []),
    ]),
    el("button", {
      class: "editor-btn editor-btn-restore",
      "data-action": "restore",
    }, [text(LABELS.restore)]),
  ]);

  children.push(controls);

  return el("div", { class: "editor-container" }, children);
}

/* ================================================================
   VIEW FACTORY
   ================================================================ */

function createView(container, editor, registry) {
  function render() {
    var tree = buildViewStructure(editor, registry);
    container.innerHTML = "";
    var dom = materialize(tree);
    container.appendChild(dom);
    attachListeners(container, editor, registry);
  }

  function destroy() {
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
      if (val) element.disabled = true;
    } else if (key === "value") {
      element.value = val;
    } else if (key.indexOf("data-") === 0) {
      element.setAttribute(key, val);
    } else if (key === "aria-label") {
      element.setAttribute("aria-label", val);
    } else if (key === "title") {
      element.title = val;
    } else if (key === "for") {
      element.setAttribute("for", val);
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

function attachListeners(root, editor, registry) {
  root.addEventListener("click", function(e) {
    var target = e.target;
    while (target && target !== root) {
      var action = target.getAttribute("data-action");
      var cardId = target.getAttribute("data-card-id");
      if (action && cardId) {
        e.preventDefault();
        handleAction(action, cardId, editor, registry, root);
        return;
      }
      target = target.parentNode;
    }
  });

  var toggle = root.querySelector(".editor-autoplay-toggle");
  if (toggle) {
    toggle.addEventListener("change", function() {
      editor.setAutoplay(toggle.checked);
    });
  }

  var intervalInput = root.querySelector(".editor-interval-input");
  if (intervalInput) {
    intervalInput.addEventListener("change", function() {
      var val = parseInt(intervalInput.value, 10);
      if (!isNaN(val)) editor.setAutoplayInterval(val);
    });
  }
}

function handleAction(action, cardId, editor, registry, root) {
  if (action === "add") {
    editor.addCard(cardId);
  } else if (action === "remove") {
    editor.removeCard(cardId);
  } else if (action === "move-up") {
    editor.moveCard(cardId, -1);
  } else if (action === "move-down") {
    editor.moveCard(cardId, 1);
  } else if (action === "restore") {
    editor.restoreDefaults();
  }
  render();
}

/* ================================================================
   EXPORTACAO
   ================================================================ */

global.SimplificaCarouselEditorView = Object.freeze({
  createView: createView,
  LABELS: LABELS,
  buildViewStructure: buildViewStructure,
  materialize: materialize,
});

if (typeof module !== "undefined" && module.exports) {
  module.exports = global.SimplificaCarouselEditorView;
}

})(typeof window !== "undefined" ? window : globalThis);
