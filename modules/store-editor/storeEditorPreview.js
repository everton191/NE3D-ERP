(function attachStoreEditorPreview(root) {
  const namespace = root.SimplificaStoreEditor = root.SimplificaStoreEditor || {};

  function renderPreviewForTab({ tab = "overview", vm = {}, renderPreview } = {}) {
    const tabs = namespace.tabs || {};
    const safeTab = typeof tabs.sanitizeTab === "function" ? tabs.sanitizeTab(tab) : String(tab || "overview").replace(/[^a-z0-9_-]/gi, "");
    const hasInlinePreview = typeof tabs.hasInlinePreview === "function" ? tabs.hasInlinePreview(safeTab) : ["overview", "appearance", "banner"].includes(safeTab);
    if (hasInlinePreview || typeof renderPreview !== "function") return "";
    const copy = typeof tabs.getPreviewCopy === "function"
      ? tabs.getPreviewCopy(safeTab)
      : { title: "Visualização da loja", subtitle: "Visual isolado do editor administrativo." };
    return renderPreview(vm, copy);
  }

  namespace.preview = {
    renderPreviewForTab
  };
})(typeof window !== "undefined" ? window : globalThis);
