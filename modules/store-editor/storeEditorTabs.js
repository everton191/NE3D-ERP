(function attachStoreEditorTabs(root) {
  const namespace = root.SimplificaStoreEditor = root.SimplificaStoreEditor || {};
  const inlinePreviewTabs = new Set(["overview", "appearance", "banner"]);
  const previewTitles = {
    products: ["Preview do catálogo", "Confira a vitrine enquanto ajusta produtos."],
    categories: ["Preview das categorias", "Veja como a navegação da loja se organiza."],
    leads: ["Preview da experiência do cliente", "Leads e carrinho continuam separados da loja pública."],
    qrcode: ["Preview compartilhável", "Confirme a vitrine antes de divulgar o link."],
    settings: ["Preview de publicação", "Status e ajustes sem alterar checkout ou pagamentos."]
  };

  function sanitizeTab(tab) {
    return String(tab || "overview").replace(/[^a-z0-9_-]/gi, "");
  }

  function hasInlinePreview(tab) {
    return inlinePreviewTabs.has(sanitizeTab(tab));
  }

  function getPreviewCopy(tab) {
    const safeTab = sanitizeTab(tab);
    const copy = previewTitles[safeTab] || ["Preview da loja", "Visual isolado do editor administrativo."];
    return { title: copy[0], subtitle: copy[1] };
  }

  namespace.tabs = {
    getPreviewCopy,
    hasInlinePreview,
    sanitizeTab
  };
})(typeof window !== "undefined" ? window : globalThis);
