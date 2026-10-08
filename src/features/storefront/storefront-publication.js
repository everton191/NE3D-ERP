(function attachStorefrontPublication(global) {
  "use strict";



function isStorefrontPubliclyAccessible(store = {}, access, context = {}) {
  const { STOREFRONT_PUBLICATION_STATUS, getStorefrontPublicationAccess, getStorefrontPublicationStatus } = context;
  if (access === undefined) access = getStorefrontPublicationAccess();
  const status = getStorefrontPublicationStatus(store, access);
  return store?.active === true
    && access.canPublish === true
    && status === STOREFRONT_PUBLICATION_STATUS.PUBLISHED;
}

function isStorefrontRemotePubliclyAccessible(store = {}, context = {}) {
  const { STOREFRONT_PUBLICATION_STATUS } = context;
  const status = String(store.publication_status || store.publicationStatus || store.status || "").toLowerCase().trim();
  return store?.active === true
    && status === STOREFRONT_PUBLICATION_STATUS.PUBLISHED;
}


async function storefrontPersistPendingAction(item = {}, context = {}) {
  const { STOREFRONT_ADMIN_KEYS, getStorefrontAdminCategoriesLocal, getStorefrontAdminImagesLocal, getStorefrontAdminProductsLocal, getStorefrontAdminStoreLocal, storefrontAdminCurrentOwnerId, storefrontAdminIsLocalId, storefrontAdminPersistStoreRemote, storefrontAdminRequest, storefrontAdminRequireRemoteStore, storefrontAdminSaveStore, storefrontAdminUpsertCategory, storefrontAdminUpsertProduct, storefrontAdminWrite, storefrontDataUrlToFile, uploadStorefrontAsset } = context;
  const payload = item.payload && typeof item.payload === "object" ? item.payload : {};
  if (String(item.type || "").startsWith("autosave:") || item.type === "session-offline-recovery") return;
  if (item.type === "store-upsert") {
    await storefrontAdminPersistStoreRemote(payload);
    return;
  }
  if (item.type === "store-status") {
    const store = getStorefrontAdminStoreLocal();
    await storefrontAdminPersistStoreRemote({ ...store, active: payload.active === true });
    return;
  }
  if (item.type === "category-upsert") {
    const store = storefrontAdminRequireRemoteStore();
    const saved = await storefrontAdminUpsertCategory({ ...payload, store_id: store.id, owner_id: storefrontAdminCurrentOwnerId() });
    const categories = getStorefrontAdminCategoriesLocal().map((category) => String(category.id) === String(payload.id) ? { ...category, ...saved } : category);
    storefrontAdminWrite(STOREFRONT_ADMIN_KEYS.categories, categories);
    if (saved?.id && String(saved.id) !== String(payload.id)) {
      storefrontAdminWrite(STOREFRONT_ADMIN_KEYS.products, getStorefrontAdminProductsLocal().map((product) => String(product.category_id || "") === String(payload.id) ? { ...product, category_id: saved.id } : product));
    }
    return;
  }
  if (item.type === "category-delete") {
    if (!storefrontAdminIsLocalId(payload.id, "cat-")) {
      await storefrontAdminRequest(`/rest/v1/store_categories?id=eq.${encodeURIComponent(payload.id)}`, {
        method: "DELETE",
        headers: { Prefer: "return=minimal" }
      });
    }
    return;
  }
  if (item.type === "category-order") {
    await Promise.all((Array.isArray(payload.items) ? payload.items : [])
      .filter((category) => !storefrontAdminIsLocalId(category.id, "cat-"))
      .map((category) => storefrontAdminRequest(`/rest/v1/store_categories?id=eq.${encodeURIComponent(category.id)}`, {
        method: "PATCH",
        headers: { Prefer: "return=minimal" },
        body: JSON.stringify({ order_index: Number(category.order_index || 0) })
      })));
    return;
  }
  if (item.type === "product-upsert") {
    const store = storefrontAdminRequireRemoteStore();
    const currentProduct = getStorefrontAdminProductsLocal().find((product) => String(product.id) === String(payload.id) || String(product.slug) === String(payload.slug));
    const saved = await storefrontAdminUpsertProduct({ ...payload, ...(currentProduct || {}), store_id: store.id, owner_id: storefrontAdminCurrentOwnerId() });
    const products = getStorefrontAdminProductsLocal().map((product) => String(product.id) === String(payload.id) ? { ...product, ...saved } : product);
    storefrontAdminWrite(STOREFRONT_ADMIN_KEYS.products, products);
    if (saved?.id && String(saved.id) !== String(payload.id)) {
      storefrontAdminWrite(STOREFRONT_ADMIN_KEYS.images, getStorefrontAdminImagesLocal().map((image) => String(image.product_id || "") === String(payload.id) ? { ...image, product_id: saved.id, store_id: store.id, owner_id: storefrontAdminCurrentOwnerId() } : image));
    }
    return;
  }
  if (item.type === "product-delete") {
    if (!storefrontAdminIsLocalId(payload.id, "prod-")) {
      await storefrontAdminRequest(`/rest/v1/store_products?id=eq.${encodeURIComponent(payload.id)}`, {
        method: "DELETE",
        headers: { Prefer: "return=minimal" }
      });
    }
    return;
  }
  if (item.type === "store-image-upload") {
    const store = storefrontAdminRequireRemoteStore();
    const field = payload.tipo === "logo" ? "logo_url" : "banner_url";
    const dataUrl = String(store[field] || "");
    if (!dataUrl.startsWith("data:")) return;
    const file = await storefrontDataUrlToFile(dataUrl, payload.fileName || `${payload.tipo || "imagem"}-loja.webp`);
    const url = await uploadStorefrontAsset(file, {
      tipo: payload.tipo === "logo" ? "logo" : "banner",
      assetKey: `${store.id}-${payload.tipo || "imagem"}`
    });
    const next = { ...store, [field]: url };
    storefrontAdminSaveStore(next);
    await storefrontAdminPersistStoreRemote(next);
    return;
  }
  if (item.type === "product-image-upload") {
    const image = getStorefrontAdminImagesLocal().find((entry) => String(entry.id) === String(payload.id));
    if (!image || !String(image.image_url || "").startsWith("data:")) return;
    const product = getStorefrontAdminProductsLocal().find((entry) => String(entry.id) === String(image.product_id));
    if (!product || storefrontAdminIsLocalId(product.id, "prod-")) throw new Error("Produto ainda aguarda sincronização.");
    const file = await storefrontDataUrlToFile(image.image_url, payload.fileName || `${image.alt_text || "produto"}.webp`);
    const existingPath = `/rest/v1/store_product_images?select=*&product_id=eq.${encodeURIComponent(product.id)}&order_index=eq.${encodeURIComponent(Number(image.order_index || 0))}&alt_text=eq.${encodeURIComponent(image.alt_text || "")}&limit=1`;
    const existingRows = await storefrontAdminRequest(existingPath);
    if (existingRows?.[0]) {
      storefrontAdminWrite(STOREFRONT_ADMIN_KEYS.images, getStorefrontAdminImagesLocal().map((entry) => String(entry.id) === String(image.id) ? { ...entry, ...existingRows[0] } : entry));
      return;
    }
    const url = await uploadStorefrontAsset(file, { tipo: "produto", productId: product.id, assetKey: image.id });
    const rows = await storefrontAdminRequest("/rest/v1/store_product_images", {
      method: "POST",
      headers: { Prefer: "return=representation" },
      body: JSON.stringify({
        product_id: product.id,
        store_id: product.store_id,
        owner_id: storefrontAdminCurrentOwnerId(),
        image_url: url,
        alt_text: image.alt_text || null,
        order_index: Number(image.order_index || 0)
      })
    });
    storefrontAdminWrite(STOREFRONT_ADMIN_KEYS.images, getStorefrontAdminImagesLocal().map((entry) => String(entry.id) === String(image.id) ? { ...entry, ...(rows?.[0] || {}), image_url: url, product_id: product.id } : entry));
    return;
  }
  if (item.type === "image-delete") {
    if (!storefrontAdminIsLocalId(payload.id, "img-")) {
      await storefrontAdminRequest(`/rest/v1/store_product_images?id=eq.${encodeURIComponent(payload.id)}`, {
        method: "DELETE",
        headers: { Prefer: "return=minimal" }
      });
    }
    return;
  }
  throw new Error(`Ação pendente da loja não reconhecida: ${item.type || "sem tipo"}`);
}

function confirmarStorefrontSalvamentoLocal(mensagem = "Alterações salvas neste aparelho.", context = {}) {
  const { estaOnline, mostrarToast, registrarStorefrontDebugLeve, storefrontFlushPendingQueue, window } = context;
  mostrarToast(`${mensagem} A atualização online será feita automaticamente.`, "sucesso", 3800);
  if (!estaOnline()) return;
  window.setTimeout(() => {
    storefrontFlushPendingQueue({ notify: false }).catch((error) => {
      registrarStorefrontDebugLeve("sincronizacao_automatica_falhou", "A loja continuará tentando sincronizar.", {
        message: error?.message || String(error)
      });
    });
  }, 1200);
}

function storefrontIsDefaultText(value = "", defaults = [], context = {}) {
  const { normalizarTextoBusca } = context;
  const text = normalizarTextoBusca(value);
  if (!text) return true;
  return defaults.some((item) => text === normalizarTextoBusca(item));
}

function storefrontIsDemoImage(value = "", context = {}) {
  const text = String(value || "").toLowerCase();
  return !text || text.includes("storefront-demo") || text.startsWith("data:image/svg+xml");
}

function storefrontIsDemoProduct(product = {}, context = {}) {
  const id = String(product.id || "");
  const title = String(product.title || product.name || "");
  return !!(
    product.__demo
    || product.__template
    || id.startsWith("demo-")
    || id.startsWith("template-")
    || storefrontIsDefaultText(title, ["Produto exemplo", "Produto da loja", "Peça sob encomenda"], context)
  );
}

function createStorefrontCompletionItem({
  id,
  type = "storefront",
  entityType = "storefront",
  entityId = null,
  severity = "required",
  done = false,
  title = "",
  description = "",
  actionLabel = "Corrigir",
  area = "appearance",
  target = {}
} = {}, context = {}) {
  const status = done ? "done" : "pending";
  return {
    id,
    type,
    entityType,
    entityId,
    severity,
    status,
    done: status === "done",
    title,
    description,
    actionLabel,
    area,
    target: {
      panel: target.panel || area,
      step: target.step || "",
      fieldId: target.fieldId || "",
      entityType,
      entityId
    }
  };
}

function getStorefrontCompletion(vm, context = {}) {
  const { getStorefrontAdminViewModel, getStorefrontContactConfig, getStorefrontProductImage } = context;
  if (vm === undefined) vm = getStorefrontAdminViewModel();
  const store = vm.store || {};
  const contact = getStorefrontContactConfig(store);
  const theme = store.theme_config || {};
  const visibleProducts = (vm.products || []).filter((product) => product.visible !== false);
  const realProducts = visibleProducts.filter((product) => !storefrontIsDemoProduct(product, context));
  const validCategories = (vm.categories || []).filter((cat) => cat.visible !== false && !cat.__demo && !cat.__template && String(cat.name || "").trim());
  const demoProducts = visibleProducts.filter((...__args) => storefrontIsDemoProduct(...__args.slice(0, 1), context));
  const invalidPriceProducts = realProducts.filter((product) => {
    const mode = String(product.price_mode || "fixed");
    if (mode === "quote" || product.show_price === false) return false;
    return Number(product.price || 0) <= 0;
  });
  const genericStoreName = storefrontIsDefaultText(store.name, ["Minha loja 3D", "Minha loja criativa", "Minha empresa 3D", "Loja Online", "NE3D", "Simplifica 3D"], context);
  const genericDescription = storefrontIsDefaultText(store.description, [
    "Produtos personalizados, brindes e peças sob encomenda em impressão 3D.",
    "Produtos personalizados, utilidades e peças sob encomenda com acabamento profissional.",
      "Sua loja de impressão 3D integrada ao ERP."
  ], context);
  const required = [
    createStorefrontCompletionItem({
      id: "store-name",
      type: "identity",
      title: "Nome da loja",
      description: genericStoreName ? "Troque o nome padrão pelo nome público da sua marca." : "Informe o nome público da loja.",
      actionLabel: "Editar nome",
      area: "appearance",
      target: { panel: "identity", step: "store-name", fieldId: "storeName" },
      done: !!String(store.name || "").trim() && !genericStoreName
    }, context),
    createStorefrontCompletionItem({
      id: "store-logo",
      type: "identity",
      title: "Logo personalizada",
      description: "Adicione uma logo própria para a loja representar sua marca.",
      actionLabel: "Adicionar logo",
      area: "appearance",
      target: { panel: "identity", step: "store-logo", fieldId: "storeLogoUrl" },
      done: !storefrontIsDemoImage(store.logo_url, context)
    }, context),
    createStorefrontCompletionItem({
      id: "store-banner",
      type: "banner",
      title: "Banner principal personalizado",
      description: "Substitua o banner padrão por uma imagem da marca, produto ou loja.",
      actionLabel: "Editar banner",
      area: "banner",
      target: { panel: "banner", step: "store-banner", fieldId: "storeBannerUrl" },
      done: !storefrontIsDemoImage(store.banner_url, context)
    }, context),
    createStorefrontCompletionItem({
      id: "store-whatsapp",
      type: "contact",
      title: "WhatsApp de contato",
      description: "Configure o WhatsApp para clientes solicitarem orçamento.",
      actionLabel: "Adicionar contato",
      area: "contacts",
      target: { panel: "contacts", step: "whatsapp", fieldId: "storeWhatsApp" },
      done: String(contact.whatsapp || "").replace(/\D/g, "").length >= 10
    }, context),
    createStorefrontCompletionItem({
      id: "store-social",
      type: "contact",
      title: "E-mail ou rede social",
      description: "Adicione e-mail, Instagram ou Facebook para dar confiança ao cliente.",
      actionLabel: "Adicionar canal",
      area: "contacts",
      target: { panel: "contacts", step: "social", fieldId: "storeInstagram" },
      done: !!(contact.email || contact.instagram || contact.facebook)
    }, context),
    createStorefrontCompletionItem({
      id: "store-products",
      type: "product",
      title: "Produto real publicado",
      description: demoProducts.length ? "Substitua os produtos de exemplo por pelo menos 1 produto real." : "Adicione pelo menos 1 produto real visível.",
      actionLabel: "Adicionar produto",
      area: "products",
      target: { panel: "products", step: "product-list", fieldId: "storefrontProductForm" },
      done: realProducts.length >= 1
    }, context),
    createStorefrontCompletionItem({
      id: "store-product-prices",
      type: "product",
      title: "Preços dos produtos válidos",
      description: invalidPriceProducts.length ? `Corrija ${invalidPriceProducts.length} produto(s) com preço zerado ou inválido.` : "Produtos com preço exibido precisam ter valor maior que zero.",
      actionLabel: "Corrigir preço",
      area: "products",
      entityType: "product",
      entityId: invalidPriceProducts[0]?.id || null,
      target: { panel: "product", step: "price", fieldId: "productPrice" },
      done: invalidPriceProducts.length === 0
    }, context),
    createStorefrontCompletionItem({
      id: "store-categories",
      type: "category",
      title: "Categorias válidas",
      description: "Crie ou confirme categorias reais para organizar a loja.",
      actionLabel: "Editar categorias",
      area: "categories",
      target: { panel: "categories", step: "category-list", fieldId: "storeCategoryName" },
      done: validCategories.length >= 1
    }, context),
    createStorefrontCompletionItem({
      id: "store-description",
      type: "identity",
      title: "Descrição da loja",
      description: "Escreva uma descrição curta que represente a marca e o tipo de produto.",
      actionLabel: "Editar descrição",
      area: "appearance",
      target: { panel: "identity", step: "store-description", fieldId: "storeDescription" },
      done: !!String(store.description || "").trim() && !genericDescription
    }, context),
    createStorefrontCompletionItem({
      id: "store-primary-color",
      type: "theme",
      title: "Cor principal definida",
      description: "Escolha uma cor principal para padronizar botões e destaques.",
      actionLabel: "Escolher cor",
      area: "appearance",
      target: { panel: "identity", step: "store-theme", fieldId: "storePrimary" },
      done: !!String(theme.primary || "").trim()
    }, context)
  ];
  const warnings = [
    createStorefrontCompletionItem({
      id: "store-favicon",
      severity: "recommended",
      type: "identity",
      title: "Favicon/ícone da loja",
      description: "Recomendado para reforçar a marca quando a loja for compartilhada.",
      actionLabel: "Adicionar ícone",
      area: "appearance",
      target: { panel: "identity", step: "store-favicon", fieldId: "storeFaviconUrl" },
      done: !!(store.favicon_url || theme.favicon_url || store.logo_url)
    }, context),
    createStorefrontCompletionItem({
      id: "store-hours",
      severity: "recommended",
      type: "contact",
      title: "Horário de atendimento",
      description: "Opcional, mas ajuda o cliente a entender quando será respondido.",
      actionLabel: "Adicionar horário",
      area: "contacts",
      target: { panel: "contacts", step: "hours", fieldId: "storeHours" },
      done: !!contact.hours
    }, context),
    createStorefrontCompletionItem({
      id: "store-address",
      severity: "recommended",
      type: "contact",
      title: "Endereço ou atendimento online",
      description: "Opcional, útil para lojas com retirada local ou região definida.",
      actionLabel: "Adicionar endereço",
      area: "contacts",
      target: { panel: "contacts", step: "address", fieldId: "storeAddress" },
      done: !!contact.address
    }, context),
    createStorefrontCompletionItem({
      id: "store-images",
      severity: "recommended",
      type: "product",
      title: "Imagens dos produtos",
      description: "Use fotos reais para melhorar a percepção profissional da loja.",
      actionLabel: "Revisar fotos",
      area: "products",
      target: { panel: "products", step: "photos", fieldId: "storefrontProductForm" },
      done: realProducts.every((product) => !storefrontIsDemoImage(getStorefrontProductImage(product, vm.images || []), context))
    }, context)
  ];
  const demoItems = [
    demoProducts.length ? `${demoProducts.length} produto(s) de exemplo` : "",
    storefrontIsDemoImage(store.banner_url, context) ? "banner padrão" : "",
    storefrontIsDemoImage(store.logo_url, context) ? "logo padrão" : "",
    (vm.categories || []).some((cat) => cat.__demo || cat.__template) ? "categorias de modelo" : "",
    genericDescription ? "texto genérico da loja" : ""
  ].filter(Boolean);
  const items = [...required, ...warnings];
  const requiredDone = required.filter((item) => item.done).length;
  const recommendedDone = warnings.filter((item) => item.done).length;
  const completionPercent = Math.round((requiredDone / Math.max(1, required.length)) * 100);
  const overallPercent = Math.round(((requiredDone * 2) + recommendedDone) / Math.max(1, (required.length * 2) + warnings.length) * 100);
  return {
    completionPercent,
    overallPercent,
    requiredPendingCount: required.filter((item) => !item.done).length,
    recommendedPendingCount: warnings.filter((item) => !item.done).length,
    canPublish: required.every((item) => item.done) && !demoItems.length,
    items,
    required,
    recommendedItems: warnings,
    demoItems
  };
}

function abrirCorrecaoChecklistLoja(area = "appearance", context = {}) {
  const { abrirStoreVisualPanel, abrirStorefrontAdminRoute, fecharPopup } = context;
  fecharPopup();
  if (area === "contacts" || area === "publish" || area === "theme") {
    abrirStoreVisualPanel(area === "theme" ? "theme" : area);
    return;
  }
  abrirStorefrontAdminRoute(area || "appearance");
}

function renderStorefrontPublicationChecklistModal(checklist, { intent = "publicar" } = {}, context = {}) {
  const { escaparAttr, escaparHtml, getStorefrontDisplayName, getStorefrontPublicViewModel, getStorefrontPublicationChecklist } = context;
  if (checklist === undefined) checklist = getStorefrontPublicationChecklist();
  const primaryArea = checklist.missing[0]?.area || checklist.recommended[0]?.area || "appearance";
  const completed = checklist.required.filter((item) => item.done).length;
  const progress = Math.round((completed / Math.max(1, checklist.required.length)) * 100);
  const vm = getStorefrontPublicViewModel();
  const previewImage = vm.store?.banner_url || vm.store?.logo_url || "/assets/simplifica-brand-cover.jpg";
  const actionLabel = {
    appearance: "Ir para aparência",
    banner: "Ir para banner",
    products: "Ir para produtos",
    categories: "Ir para categorias",
    contacts: "Ir para contato",
    settings: "Ir para configurações"
  }[primaryArea] || "Corrigir agora";
  return `
    <div class="modal-backdrop store-publication-check-backdrop store-editor-v3-portal" data-store-editor-theme="light" role="dialog" aria-modal="true">
      <section class="modal-card store-publication-check-modal">
        <div class="modal-header">
          <div>
            <span class="status-badge badge-warning">Checklist obrigatório</span>
            <h2>Finalize sua loja antes de ${escaparHtml(intent)}</h2>
            <p class="muted">A loja precisa representar sua marca antes de ser compartilhada com clientes.</p>
          </div>
          <button class="icon-button" type="button" onclick="fecharPopup()" title="Fechar">✕</button>
        </div>
        <div class="store-publication-progress">
          <div><strong>Loja pronta: ${progress}%</strong><span>${completed}/${checklist.required.length} itens essenciais</span></div>
          <i aria-hidden="true"><b style="width:${progress}%"></b></i>
        </div>
        <div class="store-publication-preview">
          <div>
            <span>Visualização final</span>
            <strong>${escaparHtml(getStorefrontDisplayName(vm.store))}</strong>
            <small>${escaparHtml(vm.store?.description || "Confira a identidade, produtos e contatos antes de compartilhar.")}</small>
          </div>
          <img src="${escaparAttr(previewImage)}" alt="${escaparAttr(getStorefrontDisplayName(vm.store))}" loading="lazy" decoding="async">
        </div>
        ${checklist.demoItems.length ? `
          <div class="store-publication-demo-alert">
            <strong>Você ainda está utilizando conteúdo de demonstração:</strong>
            <ul>${checklist.demoItems.map((item) => `<li>${escaparHtml(item)}</li>`).join("")}</ul>
          </div>
        ` : ""}
        <div class="store-publication-check-list">
          ${checklist.required.map((item) => `
            <button type="button" class="${item.done ? "done" : "pending"}" onclick="abrirCorrecaoChecklistLoja('${escaparAttr(item.area)}')">
              <i>${item.done ? "✓" : "!"}</i>
              <span><strong>${escaparHtml(item.title)}</strong><small>${escaparHtml(item.done ? "Tudo certo." : item.description)}</small></span>
            </button>
          `).join("")}
        </div>
        ${checklist.recommended.length ? `
          <details class="store-publication-recommended">
            <summary>Itens recomendados para uma publicação mais profissional</summary>
            ${checklist.recommended.map((item) => `<button type="button" onclick="abrirCorrecaoChecklistLoja('${escaparAttr(item.area)}')">${escaparHtml(item.title)}</button>`).join("")}
          </details>
        ` : ""}
        <div class="actions">
          <button class="btn secondary" type="button" onclick="fecharPopup()">Depois</button>
          <button class="btn" type="button" onclick="abrirCorrecaoChecklistLoja('${escaparAttr(primaryArea)}')">${escaparHtml(actionLabel)}</button>
        </div>
      </section>
    </div>
  `;
}

function renderStorefrontPublishedModal(store, context = {}) {
  const { escaparAttr, escaparHtml, getStorefrontAdminStoreLocal, getStorefrontPublicRoutePath, getStorefrontPublicUrl } = context;
  if (store === undefined) store = getStorefrontAdminStoreLocal();
  const shareUrl = getStorefrontPublicUrl({ slug: store.slug, view: "home" });
  return `
    <div class="modal-backdrop store-publication-check-backdrop store-editor-v3-portal" data-store-editor-theme="light" role="dialog" aria-modal="true">
      <section class="modal-card store-publication-check-modal store-publication-success-modal">
        <div class="store-publication-success-mark">✓</div>
        <h2>Loja publicada com sucesso</h2>
        <p>Seu link já pode ser compartilhado. A Loja continua usando a mesma estrutura segura do ERP e você pode voltar para editar quando quiser.</p>
        <div class="store-publication-share-box">
          <span>Link da loja</span>
          <strong>${escaparHtml(shareUrl)}</strong>
        </div>
        <div class="actions">
          <button class="btn secondary" type="button" onclick="fecharPopup(); window.location.href='${escaparAttr(getStorefrontPublicRoutePath({ slug: store.slug, view: "home" }))}'">Ver como cliente</button>
          <button class="btn" type="button" onclick="compartilharLojaPublica('${escaparAttr(shareUrl)}')">Compartilhar loja</button>
        </div>
      </section>
    </div>
  `;
}

function exigirChecklistPublicacaoLoja({ intent = "publicar", silent = false } = {}, context = {}) {
  const { document, getStorefrontPublicationAccess, getStorefrontPublicationChecklist, mostrarModalLimitePlano, mostrarToast } = context;
  const publicationAccess = getStorefrontPublicationAccess();
  if (!publicationAccess.canPublish) {
    if (!silent) {
      const mensagem = intent === "compartilhar"
        ? "O link público e o compartilhamento da loja ficam disponíveis nos planos Start e Pro ativos."
        : publicationAccess.reason === "subscription_inactive"
          ? "Regularize sua assinatura para publicar a loja novamente."
          : "Publicação da loja disponível nos planos Start e Pro.";
      if (typeof mostrarModalLimitePlano === "function") {
        mostrarModalLimitePlano(`${mensagem}<br><br><strong>Seus produtos e configurações continuam salvos.</strong><br>Você pode editar e visualizar a loja internamente, mas o link público fica bloqueado até o plano permitir publicação.`);
      } else {
        mostrarToast(mensagem, "aviso", 5200);
      }
    }
    return false;
  }
  const checklist = getStorefrontPublicationChecklist();
  if (checklist.ready) return true;
  if (!silent) {
    const popup = document.getElementById("popup");
    if (popup) popup.innerHTML = renderStorefrontPublicationChecklistModal(checklist, { intent }, context);
    else mostrarToast("Finalize o checklist da loja antes de publicar ou compartilhar.", "aviso", 4200);
  }
  return false;
}

function getStorefrontOwnerIdLocal(context = {}) {
  const { getUsuarioAtual, syncConfig, usuarioAtualEmail } = context;
  return String(syncConfig.supabaseUserId || getUsuarioAtual()?.supabaseUserId || getUsuarioAtual()?.id || getUsuarioAtual()?.email || usuarioAtualEmail || "local").trim();
}

function isStorefrontStagingEnvironment(context = {}) {
  const { location, syncConfig } = context;
  const url = String(syncConfig.supabaseUrl || "").toLowerCase();
  const host = String(location.hostname || "").toLowerCase();
  return url.includes("dcaqiatgftkjxyewlhgi") || host.includes("staging") || host.includes("homolog");
}

function isStorefrontDemoPreviewAllowed(context = {}) {
  const { isAmbienteLocal } = context;
  return isAmbienteLocal() || isStorefrontStagingEnvironment(context);
}
  const api = Object.freeze({ isStorefrontPubliclyAccessible, isStorefrontRemotePubliclyAccessible, storefrontPersistPendingAction, confirmarStorefrontSalvamentoLocal, storefrontIsDefaultText, storefrontIsDemoImage, storefrontIsDemoProduct, createStorefrontCompletionItem, getStorefrontCompletion, abrirCorrecaoChecklistLoja, renderStorefrontPublicationChecklistModal, renderStorefrontPublishedModal, exigirChecklistPublicacaoLoja, getStorefrontOwnerIdLocal, isStorefrontStagingEnvironment, isStorefrontDemoPreviewAllowed });
  global.SimplificaStorefrontPublication = api;
  if (typeof module !== "undefined" && module.exports) module.exports = api;
})(typeof window !== "undefined" ? window : globalThis);
