(function attachStoreEditorProducts(root) {
  const namespace = root.SimplificaStoreEditor = root.SimplificaStoreEditor || {};

  function getStats(vm = {}) {
    const products = Array.isArray(vm.products) ? vm.products : [];
    return {
      total: products.length,
      visible: products.filter((product) => product && product.visible !== false).length,
      featured: products.filter((product) => product && product.featured).length
    };
  }

  function renderEmptyState({ renderEmptyState } = {}) {
    const payload = {
      title: "Nenhum produto",
      description: "Crie o primeiro item da vitrine para testar preview, publicação e link público.",
      icon: "▣",
      action: `<button class="btn" type="button" onclick="abrirEditorProdutoLojaOnline()">Adicionar produto</button>`
    };
    if (typeof renderEmptyState === "function") return renderEmptyState(payload);
    return `
      <div class="store-empty-state">
        <strong>${payload.title}</strong>
        <p>${payload.description}</p>
        ${payload.action}
      </div>
    `;
  }

  namespace.products = {
    getStats,
    renderEmptyState
  };
})(typeof window !== "undefined" ? window : globalThis);
