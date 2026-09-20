(function attachCarouselEditorController(global) {
  "use strict";

  function createEditorController(options) {
    var editor = options.editor;
    var registry = options.registry;
    var persistence = options.persistence;
    var view = options.view;
    var root = options.root || null;

    function persist() { persistence.savePreferences(editor.getState()); }
    function render() {
      var html = view.renderEditorView(editor.getState(), registry);
      if (root) root.innerHTML = html;
      return html;
    }
    function handleAction(action, id, value) {
      var changed = false;
      if (action === "add") changed = editor.addCard(id);
      else if (action === "remove") changed = editor.removeCard(id);
      else if (action === "move-up") changed = editor.moveCard(id, -1);
      else if (action === "move-down") changed = editor.moveCard(id, 1);
      else if (action === "restore") changed = editor.restoreDefaults();
      else if (action === "autoplay") changed = editor.setAutoplay(value);
      else if (action === "interval") changed = editor.setAutoplayInterval(value);
      if (changed) persist();
      return { changed: changed, html: render() };
    }
    function mount(target) {
      root = target || root;
      if (!root) return render();
      render();
      root.addEventListener("click", function(event) {
        var button = event.target.closest("[data-carousel-action]");
        if (!button || button.disabled) return;
        var action = button.getAttribute("data-carousel-action");
        if (action === "autoplay" || action === "interval") return;
        handleAction(action, button.getAttribute("data-card-id"), action === "autoplay" ? button.checked : undefined);
      });
      root.addEventListener("change", function(event) {
        var input = event.target;
        var action = input.getAttribute && input.getAttribute("data-carousel-action");
        if (action === "autoplay") handleAction(action, null, input.checked);
        if (action === "interval") handleAction(action, null, input.value);
      });
      return root;
    }
    return Object.freeze({ render: render, mount: mount, handleAction: handleAction });
  }

  global.SimplificaCarouselEditorController = Object.freeze({ createEditorController: createEditorController });
  if (typeof module !== "undefined" && module.exports) module.exports = global.SimplificaCarouselEditorController;
})(typeof window !== "undefined" ? window : globalThis);
