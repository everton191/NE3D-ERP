(function attachStoreEditorRenderer(root) {
  const namespace = root.SimplificaStoreEditor = root.SimplificaStoreEditor || {};
  namespace.version = "4G";
  namespace.moduleVersion = "store-editor-4g";

  namespace.isStoreEditorModuleReady = function isStoreEditorModuleReady() {
    return Boolean(
      namespace.renderer?.renderTabContent &&
      namespace.tabs?.sanitizeTab &&
      namespace.preview?.renderPreviewForTab &&
      namespace.products?.getStats
    );
  };

  function fallbackEscapeAttr(value) {
    return String(value ?? "")
      .replace(/&/g, "&amp;")
      .replace(/"/g, "&quot;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
  }

  function renderTabContent({ tab = "overview", content = "", vm = {}, renderPreview, escapeAttr } = {}) {
    const tabs = namespace.tabs || {};
    const safeTab = typeof tabs.sanitizeTab === "function" ? tabs.sanitizeTab(tab) : String(tab || "overview").replace(/[^a-z0-9_-]/gi, "");
    const hasInlinePreview = typeof tabs.hasInlinePreview === "function" ? tabs.hasInlinePreview(safeTab) : ["overview", "appearance", "banner"].includes(safeTab);
    const needsPreview = !hasInlinePreview;
    const preview = needsPreview && namespace.preview && typeof namespace.preview.renderPreviewForTab === "function"
      ? namespace.preview.renderPreviewForTab({ tab: safeTab, vm, renderPreview })
      : "";
    const attr = typeof escapeAttr === "function" ? escapeAttr : fallbackEscapeAttr;

    return `
      <div class="store-editor-tab-panel store-editor-panel ${needsPreview ? "has-preview-panel" : "has-inline-preview"} store-editor-tab-${attr(safeTab)}" data-store-editor-section="${attr(safeTab)}" data-store-editor-renderer="module" data-store-editor-modules-ready="true" data-store-editor-module-version="${attr(namespace.moduleVersion || "store-editor-4g")}">
        ${needsPreview ? `<div class="store-editor-tab-main">${content}</div>${preview}` : content}
      </div>
    `;
  }

  namespace.renderer = {
    renderTabContent
  };
})(typeof window !== "undefined" ? window : globalThis);
