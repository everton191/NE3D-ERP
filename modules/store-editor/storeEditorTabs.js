(function attachStoreEditorTabs(root) {
  const namespace = root.SimplificaStoreEditor = root.SimplificaStoreEditor || {};
  const inlinePreviewTabs = new Set(["overview", "appearance", "banner"]);
  const previewTitles = {
    products: ["Visualização do catálogo", "Confira a vitrine enquanto ajusta produtos."],
    categories: ["Visualização das categorias", "Veja como a navegação da loja se organiza."],
    leads: ["Visualização da experiência do cliente", "Contatos e carrinho continuam separados da loja pública."],
    qrcode: ["Visualização compartilhável", "Confirme a vitrine antes de divulgar o link."],
    settings: ["Visualização de publicação", "Status e ajustes sem alterar checkout ou pagamentos."]
  };

  function sanitizeTab(tab) {
    return String(tab || "overview").replace(/[^a-z0-9_-]/gi, "");
  }

  function hasInlinePreview(tab) {
    return inlinePreviewTabs.has(sanitizeTab(tab));
  }

  function getPreviewCopy(tab) {
    const safeTab = sanitizeTab(tab);
    const copy = previewTitles[safeTab] || ["Visualização da loja", "Visual isolado do editor administrativo."];
    return { title: copy[0], subtitle: copy[1] };
  }

  namespace.tabs = {
    getPreviewCopy,
    hasInlinePreview,
    sanitizeTab
  };
})(typeof window !== "undefined" ? window : globalThis);
