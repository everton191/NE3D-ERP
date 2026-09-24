(function attachStorefrontProductEditor(global) {
  "use strict";



function getStorefrontProductDraftState(context = {}) {
  const { storefrontProductDraftEnsureState } = context;
  return { ...storefrontProductDraftEnsureState };
}

function gerarChaveRascunhoLojaOnline(context = {}) {
  const { Uint32Array, window } = context;
  try {
    if (window.crypto?.getRandomValues) {
      const bytes = new Uint32Array(1);
      window.crypto.getRandomValues(bytes);
      return `draft-${bytes[0].toString(36)}`;
    }
  } catch (_) {}
  return `draft-${Date.now().toString(36)}-${Math.floor(Math.random() * 1296).toString(36)}`;
}

function gerarChaveRascunhoProdutoLojaOnline(context = {}) {
  return gerarChaveRascunhoLojaOnline(context);
}

function isProdutoNovoSemIdLojaOnline(context = {}) {
  const { STOREFRONT_ADMIN_KEYS, document, getRascunhoProdutoGuiadoDoFormulario, getStorefrontAdminProductsLocal, getStorefrontGuidedSelection, storefrontAdminIsLocalId, storefrontAdminRead } = context;
  const selection = getStorefrontGuidedSelection();
  if (selection.type !== "product") return false;
  const seed = storefrontAdminRead(STOREFRONT_ADMIN_KEYS.editingProductSeed, null) || {};
  const form = typeof document !== "undefined" ? document.getElementById("storefrontProductForm") : null;
  const formId = String(getRascunhoProdutoGuiadoDoFormulario(form)?.id || seed.id || selection.id || "");
  if (!formId || storefrontAdminIsLocalId(formId, "prod-")) return true;
  const found = getStorefrontAdminProductsLocal().find((item) => String(item.id) === formId);
  if (!found || found.__demo || found.__template) return true;
  return false;
}


function isStorefrontProductMobileFlow(context = {}) {
  const { window } = context;
  return window.innerWidth <= 768;
}

function getStorefrontProductFormField(form, name, context = {}) {
  return form?.elements?.namedItem?.(name) || form?.querySelector?.(`[name="${name}"]`) || null;
}

function limparErroCampoProdutoLojaOnline(field, context = {}) {
  if (!field?.removeAttribute) return;
  field.removeAttribute("aria-invalid");
  field.closest("label")?.querySelector(".store-product-field-error")?.remove();
}

function mostrarErroCampoProdutoLojaOnline(field, message, context = {}) {
  const { document, mostrarToast } = context;
  if (!field) return false;
  limparErroCampoProdutoLojaOnline(field, context);
  field.setAttribute("aria-invalid", "true");
  const error = document.createElement("small");
  error.className = "store-product-field-error";
  error.textContent = message;
  field.closest("label")?.append(error);
  field.focus?.();
  field.scrollIntoView?.({ block: "center", behavior: "smooth" });
  mostrarToast(message, "erro", 3400);
  return false;
}

function validarEtapaProdutoLojaOnline(step, form, context = {}) {
  const { document } = context;
  if (form === undefined) form = document.getElementById("storefrontProductForm");
  if (!form) return false;
  if (Number(step) === 1) {
    const title = getStorefrontProductFormField(form, "productTitle", context);
    limparErroCampoProdutoLojaOnline(title, context);
    if (!String(title?.value || "").trim()) return mostrarErroCampoProdutoLojaOnline(title, "Informe o título público do produto.", context);
  }
  if (Number(step) === 2) {
    const price = getStorefrontProductFormField(form, "productPrice", context);
    const compare = getStorefrontProductFormField(form, "productComparePriceVisible", context);
    limparErroCampoProdutoLojaOnline(price, context);
    limparErroCampoProdutoLojaOnline(compare, context);
    const mode = getStorefrontProductFormField(form, "productPriceMode", context)?.value || "fixed";
    const value = Number(String(price?.value || "0").replace(",", ".")) || 0;
    const compareValue = Number(String(compare?.value || "0").replace(",", ".")) || 0;
    if (mode !== "quote" && value <= 0) return mostrarErroCampoProdutoLojaOnline(price, "Informe um preço válido.", context);
    if (mode === "promo" && compareValue <= value) return mostrarErroCampoProdutoLojaOnline(compare, "O preço anterior deve ser maior que o preço atual.", context);
  }
  return true;
}

function validarTodasEtapasProdutoLojaOnline(form, context = {}) {
  const { document, setStorefrontProductMobileStep } = context;
  if (form === undefined) form = document.getElementById("storefrontProductForm");
  for (const step of [1, 2, 3, 4]) {
    if (!validarEtapaProdutoLojaOnline(step, form, context)) {
      setStorefrontProductMobileStep(step, { focus: false });
      return false;
    }
  }
  return true;
}

function atualizarResumoRevisaoProdutoLojaOnline(form, context = {}) {
  const { document, formatarMoeda } = context;
  if (form === undefined) form = document.getElementById("storefrontProductForm");
  if (!form) return;
  const setText = (selector, text) => {
    const target = form.querySelector(selector);
    if (target) target.textContent = text;
  };
  const category = getStorefrontProductFormField(form, "productCategory", context)?.selectedOptions?.[0]?.textContent || "Sem categoria";
  const priceMode = getStorefrontProductFormField(form, "productPriceMode", context)?.value || "fixed";
  const price = Number(String(getStorefrontProductFormField(form, "productPrice", context)?.value || "0").replace(",", ".")) || 0;
  setText("[data-product-review-title]", getStorefrontProductFormField(form, "productTitle", context)?.value?.trim() || "Produto sem título");
  setText("[data-product-review-category]", category);
  setText("[data-product-review-price]", priceMode === "quote" ? "Sob orçamento" : formatarMoeda(price));
  setText("[data-product-review-visibility]", getStorefrontProductFormField(form, "productVisible", context)?.checked ? "Visível na loja ativa" : "Oculto");
}

function avancarEtapaProdutoLojaOnline(context = {}) {
  const { document, setStorefrontProductMobileStep, storefrontProductMobileStep } = context;
  const form = document.getElementById("storefrontProductForm");
  if (!validarEtapaProdutoLojaOnline(storefrontProductMobileStep, form, context)) return;
  setStorefrontProductMobileStep(storefrontProductMobileStep + 1);
}

function voltarEtapaProdutoLojaOnline(context = {}) {
  const { cancelarEdicaoProdutoLojaOnline, setStorefrontProductMobileStep, storefrontProductMobileStep } = context;
  if (storefrontProductMobileStep <= 1) return cancelarEdicaoProdutoLojaOnline();
  setStorefrontProductMobileStep(storefrontProductMobileStep - 1);
}

function ajustarQuantidadeProdutoLojaOnline(delta = 0, context = {}) {
  const { Event, document } = context;
  const input = document.querySelector("#storefrontProductForm [name='productStockQuantity']");
  if (!input) return;
  input.value = String(Math.max(0, (Number(input.value) || 0) + Number(delta || 0)));
  input.dispatchEvent(new Event("input", { bubbles: true }));
}

async function alternarProdutoLojaOnline(id, field, context = {}) {
  const { STOREFRONT_ADMIN_KEYS, confirmarStorefrontSalvamentoLocal, getStorefrontAdminProductsLocal, getStorefrontAdminStoreLocal, mostrarToast, registrarStorefrontActivity, registrarStorefrontDebugLeve, renderApp, requestSensitiveActionConfirmation, storefrontAdminIsLocalId, storefrontAdminRemoteReady, storefrontAdminRequest, storefrontAdminWrite, storefrontQueuePendingAction } = context;
  if (!await requestSensitiveActionConfirmation({
    actionLabel: field === "visible" ? "alterar visibilidade do produto na loja" : "alterar destaque do produto na loja",
    titulo: field === "visible" ? "Autorizar visibilidade do produto" : "Autorizar destaque do produto",
    mensagem: "Confirme sua senha antes de alterar como este produto aparece para clientes.",
    confirmar: "Autorizar alteração",
    cancelar: "Cancelar",
    exigirConfirmacaoVisual: true
  })) return;
  const store = getStorefrontAdminStoreLocal();
  let changed = null;
  const products = getStorefrontAdminProductsLocal().map((product) => {
    if (product.id !== id) return product;
    if (field === "visible" && !store.active) {
      mostrarToast("Ative a loja antes de deixar produtos visíveis.", "erro", 3600);
      return { ...product, visible: false };
    }
    changed = { ...product, [field]: !product[field] };
    return changed;
  });
  storefrontAdminWrite(STOREFRONT_ADMIN_KEYS.products, products);
  try {
    if (changed && storefrontAdminRemoteReady() && !storefrontAdminIsLocalId(id, "prod-")) {
      await storefrontAdminRequest(`/rest/v1/store_products?id=eq.${encodeURIComponent(id)}`, {
        method: "PATCH",
        headers: { Prefer: "return=minimal" },
        body: JSON.stringify({ [field]: changed[field] })
      });
    } else if (changed) {
      storefrontQueuePendingAction("product-upsert", changed);
    }
    if (changed) registrarStorefrontActivity(field === "visible" ? (changed.visible ? "Produto publicado" : "Produto ocultado") : "Destaque atualizado", changed.title || "Produto");
    renderApp();
  } catch (error) {
    if (changed) storefrontQueuePendingAction("product-upsert", changed);
    registrarStorefrontDebugLeve("persistencia_falhou", "Produto atualizado localmente e aguardando sincronização.", { message: error?.message || String(error) });
    confirmarStorefrontSalvamentoLocal("Produto atualizado neste aparelho.");
    renderApp();
  }
}

async function removerProdutoLojaOnline(id, context = {}) {
  const { STOREFRONT_ADMIN_KEYS, confirmarStorefrontSalvamentoLocal, getStorefrontAdminImagesLocal, getStorefrontAdminProductsLocal, getStorefrontGuidedSelection, mostrarToast, registrarStorefrontActivity, registrarStorefrontDebugLeve, renderApp, requestSensitiveActionConfirmation, restoreStorefrontGuidedCatalogState, returnToStorefrontGuidedCatalog, storefrontAdminIsLocalId, storefrontAdminRemoteReady, storefrontAdminRequest, storefrontAdminWrite, storefrontQueuePendingAction } = context;
  let shouldRestoreCatalog = false;
  if (!await requestSensitiveActionConfirmation({
    actionLabel: "excluir produto da loja",
    titulo: "Autorizar exclusão de produto",
    mensagem: "O cadastro principal do produto não será apagado, mas ele sairá da loja pública. Confirme sua senha para continuar.",
    confirmar: "Excluir produto da loja",
    cancelar: "Cancelar",
    perigo: true,
    exigirConfirmacaoVisual: true
  })) return;
  const nextProducts = getStorefrontAdminProductsLocal().filter((product) => product.id !== id);
  const nextImages = getStorefrontAdminImagesLocal().filter((image) => image.product_id !== id);
  storefrontAdminWrite(STOREFRONT_ADMIN_KEYS.products, nextProducts);
  storefrontAdminWrite(STOREFRONT_ADMIN_KEYS.images, nextImages);
  try {
    if (storefrontAdminRemoteReady() && !storefrontAdminIsLocalId(id, "prod-")) {
      await storefrontAdminRequest(`/rest/v1/store_products?id=eq.${encodeURIComponent(id)}`, {
        method: "DELETE",
        headers: { Prefer: "return=minimal" }
      });
    } else {
      storefrontQueuePendingAction("product-delete", { id });
    }
    if (getStorefrontGuidedSelection().type === "product" && String(getStorefrontGuidedSelection().id) === String(id)) {
      shouldRestoreCatalog = true;
      returnToStorefrontGuidedCatalog("products", { source: "guided-product-delete" });
    }
    registrarStorefrontActivity("Produto removido da loja", "O cadastro principal do produto foi preservado.");
    mostrarToast("Produto removido da loja.", "sucesso");
    renderApp();
    if (shouldRestoreCatalog) restoreStorefrontGuidedCatalogState("products");
  } catch (error) {
    storefrontQueuePendingAction("product-delete", { id });
    registrarStorefrontDebugLeve("persistencia_falhou", "Produto removido localmente e aguardando sincronização.", { message: error?.message || String(error) });
    confirmarStorefrontSalvamentoLocal("Produto removido neste aparelho.");
    renderApp();
  }
}

function moverProdutoLojaOnline(id, direction = 0, context = {}) {
  const { STOREFRONT_ADMIN_KEYS, getStorefrontAdminProductsLocal, marcarStorefrontAlteracoesPendentes, mostrarToast, registrarStorefrontActivity, renderApp, storefrontAdminWrite } = context;
  const products = getStorefrontAdminProductsLocal();
  const index = products.findIndex((product) => String(product.id) === String(id));
  if (index < 0) return;
  const target = Math.max(0, Math.min(products.length - 1, index + Number(direction || 0)));
  if (target === index) return;
  const next = [...products];
  const [item] = next.splice(index, 1);
  next.splice(target, 0, item);
  storefrontAdminWrite(STOREFRONT_ADMIN_KEYS.products, next);
  marcarStorefrontAlteracoesPendentes("Ordem visual dos produtos alterada");
  registrarStorefrontActivity("Produto reorganizado", item.title || "Produto da loja");
  mostrarToast("Ordem visual atualizada na loja.", "info", 2400);
  renderApp();
}

async function moverCategoriaLojaOnline(id, direction = 0, context = {}) {
  const { STOREFRONT_ADMIN_KEYS, confirmarStorefrontSalvamentoLocal, getStorefrontAdminCategoriesLocal, limparStorefrontAlteracoesPendentes, mostrarToast, registrarStorefrontActivity, registrarStorefrontDebugLeve, renderApp, storefrontAdminIsLocalId, storefrontAdminRemoteReady, storefrontAdminRequest, storefrontAdminWrite, storefrontQueuePendingAction } = context;
  const categories = getStorefrontAdminCategoriesLocal().sort((a, b) => Number(a.order_index || 0) - Number(b.order_index || 0));
  const index = categories.findIndex((cat) => String(cat.id) === String(id));
  if (index < 0) return;
  const target = Math.max(0, Math.min(categories.length - 1, index + Number(direction || 0)));
  if (target === index) return;
  const next = [...categories];
  const [item] = next.splice(index, 1);
  next.splice(target, 0, item);
  const normalized = next.map((cat, idx) => ({ ...cat, order_index: idx + 1 }));
  storefrontAdminWrite(STOREFRONT_ADMIN_KEYS.categories, normalized);
  try {
    if (storefrontAdminRemoteReady()) {
      await Promise.all(normalized
        .filter((cat) => !storefrontAdminIsLocalId(cat.id, "cat-") && !cat.__demo)
        .map((cat) => storefrontAdminRequest(`/rest/v1/store_categories?id=eq.${encodeURIComponent(cat.id)}`, {
          method: "PATCH",
          headers: { Prefer: "return=minimal" },
          body: JSON.stringify({ order_index: Number(cat.order_index || 0) })
        })));
    } else {
      storefrontQueuePendingAction("category-order", { entityId: "all", items: normalized });
    }
    limparStorefrontAlteracoesPendentes("Ordem de categorias salva");
    registrarStorefrontActivity("Categoria reorganizada", item.name || "Categoria da loja");
    mostrarToast("Ordem de categorias atualizada.", "sucesso", 2400);
  } catch (error) {
    storefrontQueuePendingAction("category-order", { entityId: "all", items: normalized });
    limparStorefrontAlteracoesPendentes("Ordem salva; atualização online automática");
    registrarStorefrontDebugLeve("save_falhou", "Falha ao persistir ordem de categorias.", { message: error?.message || String(error) });
    confirmarStorefrontSalvamentoLocal("Ordem atualizada neste aparelho.");
  }
  renderApp();
}

function duplicarProdutoLojaOnline(id, context = {}) {
  const { STOREFRONT_ADMIN_KEYS, getStorefrontAdminProductsLocal, getStorefrontPublicMode, getStorefrontPublicViewModel, mostrarToast, patchStorefrontGuidedCatalogState, registrarStorefrontActivity, selecionarItemLojaVisual, setStorefrontAdminTab, storefrontAdminSlugify, storefrontAdminStorageSet, storefrontAdminWrite, telaAtual } = context;
  const product = getStorefrontAdminProductsLocal().find((item) => String(item.id) === String(id));
  if (!product || product.__demo) return mostrarToast("Crie um produto real para duplicar.", "info", 3200);
  const copy = {
    ...product,
    id: `prod-${Date.now()}`,
    title: `${product.title || "Produto"} cópia`,
    slug: `${storefrontAdminSlugify(product.slug || product.title || "produto")}-copia-${Date.now().toString().slice(-4)}`,
    visible: false,
    featured: false,
    created_at: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  storefrontAdminWrite(STOREFRONT_ADMIN_KEYS.products, [copy, ...getStorefrontAdminProductsLocal()]);
  storefrontAdminStorageSet(STOREFRONT_ADMIN_KEYS.editingProduct, copy.id);
  registrarStorefrontActivity("Produto duplicado", copy.title);
  mostrarToast("Produto duplicado como rascunho oculto.", "sucesso", 2800);
  const vm = getStorefrontPublicViewModel();
  if (telaAtual === "lojaPublica" && getStorefrontPublicMode(vm).admin) {
    patchStorefrontGuidedCatalogState("products", { highlightId: String(copy.id || "") });
    selecionarItemLojaVisual("product", copy.id);
    return;
  }
  setStorefrontAdminTab("products");
}

function abrirProdutoLojaPublica(productId = "", context = {}) {
  const { getStorefrontAdminProductsLocal, getStorefrontAdminStoreLocal, getStorefrontPublicRoutePath, location, mostrarToast, window } = context;
  const product = getStorefrontAdminProductsLocal().find((item) => String(item.id) === String(productId));
  if (!product?.slug) return mostrarToast("Produto sem endereço público.", "erro", 3200);
  const store = getStorefrontAdminStoreLocal();
  const url = `${location.origin}${getStorefrontPublicRoutePath({ slug: store.slug || "loja", view: "product", productSlug: product.slug })}`;
  window.open(url, "_blank", "noopener");
}

function copiarLinkProdutoLojaOnline(productId = "", context = {}) {
  const { copiarLinkLojaPublica, getStorefrontAdminProductsLocal, getStorefrontAdminStoreLocal, getStorefrontPublicRoutePath, location, mostrarToast } = context;
  const product = getStorefrontAdminProductsLocal().find((item) => String(item.id) === String(productId));
  if (!product?.slug) return mostrarToast("Produto sem endereço público.", "erro", 3200);
  const store = getStorefrontAdminStoreLocal();
  const url = `${location.origin}${getStorefrontPublicRoutePath({ slug: store.slug || "loja", view: "product", productSlug: product.slug })}`;
  copiarLinkLojaPublica(url);
}

function abrirSeletorFotoProdutoLojaOnline(productId = "", context = {}) {
  const { closeDrawer, document, mostrarToast, storefrontAdminSlugify } = context;
  closeDrawer();
  const slug = storefrontAdminSlugify(productId);
  const input = document.getElementById(`storefrontProductPhoto-${slug}`)
    || document.querySelector(`[data-storefront-product-photo="${String(productId || "").replace(/"/g, '\\"')}"]`)
    || document.querySelector(`input[name="productPhoto"]`);
  if (!input) return mostrarToast("Abra a edição do produto para incluir fotos.", "info", 3000);
  input.click();
}

function abrirSeletorImagemStorefront(input, context = {}) {
  const { mostrarToast } = context;
  if (!input || input.type !== "file") {
    mostrarToast("Não foi possível abrir a seleção de imagem.", "erro", 3200);
    return false;
  }
  if (input.hasAttribute && input.hasAttribute("hidden")) input.removeAttribute("hidden");
  if (input.style) {
    if (input.style.display === "none") input.style.display = "";
  }
  if (input.disabled) {
    mostrarToast("Não foi possível abrir a seleção de imagem.", "erro", 3200);
    return false;
  }
  input.value = "";
  input.click();
  return true;
}

async function processarImagemCategoriaLojaOnline(categoryId, input, context = {}) {
  const { getStorefrontAdminCategoriesLocal, mostrarToast, storefrontAdminIsLocalId } = context;
  const category = getStorefrontAdminCategoriesLocal().find((item) => String(item.id) === String(categoryId));
  if (!category || storefrontAdminIsLocalId(category.id, "cat-")) {
    input && (input.value = "");
    mostrarToast("Salve a categoria antes de adicionar a foto.", "aviso", 3600);
    return;
  }
  input.dataset.categoryId = String(category.id);
  await abrirCropImagemLojaOnline("categoria", input, context);
}

async function processarImagemExemploLojaOnline(productId, input, context = {}) {
  const { STOREFRONT_ADMIN_KEYS, getStorefrontAdminImagesLocal, getStorefrontAdminStoreLocal, lerArquivoComoDataUrl, marcarStorefrontAlteracoesPendentes, mostrarToast, otimizarArquivoStorefrontImagem, registrarStorefrontActivity, renderApp, setStorefrontUploadStatus, storefrontAdminSlugify, storefrontAdminWrite } = context;
  const file = Array.from(input?.files || [])[0];
  if (!file || !productId) return;
  try {
    setStorefrontUploadStatus({
      type: "info",
      title: "Preparando foto",
      message: "Ajustando a imagem do exemplo para o preview da loja."
    });
    const preparedFile = await otimizarArquivoStorefrontImagem(file, "produto");
    const dataUrl = await lerArquivoComoDataUrl(preparedFile);
    const current = getStorefrontAdminImagesLocal();
    const withoutPrevious = current.filter((image) => String(image.product_id) !== String(productId) || !String(image.id || "").startsWith("demo-img-"));
    const next = [
      ...withoutPrevious,
      {
        id: `demo-img-${storefrontAdminSlugify(productId)}`,
        product_id: productId,
        store_id: getStorefrontAdminStoreLocal().id,
        owner_id: getStorefrontAdminStoreLocal().owner_id,
        image_url: dataUrl,
        alt_text: file.name.replace(/\.[^.]+$/, "") || "Foto do exemplo",
        order_index: -1,
        local_demo_override: true
      }
    ];
    storefrontAdminWrite(STOREFRONT_ADMIN_KEYS.images, next);
    marcarStorefrontAlteracoesPendentes("Foto do exemplo atualizada");
    setStorefrontUploadStatus({
      type: "success",
      title: "Foto do exemplo atualizada",
      message: "A imagem foi aplicada no preview deste aparelho.",
      detail: `${file.name} · ${Math.max(1, Math.round(preparedFile.size / 1024))} KB`
    });
    registrarStorefrontActivity("Foto de exemplo atualizada", file.name);
    mostrarToast("Foto do exemplo atualizada.", "sucesso", 2600);
  } catch (error) {
    setStorefrontUploadStatus({
      type: "error",
      title: "Falha ao trocar foto",
      message: error?.message || "Não foi possível usar esta imagem.",
      detail: "Escolha JPG, PNG ou WebP em tamanho adequado."
    });
    mostrarToast("Não foi possível trocar a foto agora.", "erro", 4200);
  } finally {
    if (input) input.value = "";
    renderApp();
  }
}

function fecharMenusContextuaisProdutosLoja(except = null, context = {}) {
  fecharMenusContextuaisUi(except, context);
}

function getUiContextMenuTimers(context = {}) {
  const { window } = context;
  if (!window.__simplificaUiContextMenuTimers) window.__simplificaUiContextMenuTimers = new WeakMap();
  return window.__simplificaUiContextMenuTimers;
}

function limparTimerMenuContextualUi(details, context = {}) {
  const timers = getUiContextMenuTimers(context);
  const timer = timers.get(details);
  if (timer) clearTimeout(timer);
  timers.delete(details);
}

function sincronizarAcessibilidadeMenuContextualUi(details, context = {}) {
  const { window } = context;
  if (!details?.matches?.(".ui-context-menu")) return;
  const summary = details.querySelector(":scope > summary");
  const panel = details.querySelector(":scope > .ui-context-menu-panel");
  if (!summary || !panel) return;
  if (!panel.id) {
    window.__simplificaUiContextMenuId = Number(window.__simplificaUiContextMenuId || 0) + 1;
    panel.id = `ui-context-menu-${window.__simplificaUiContextMenuId}`;
  }
  summary.setAttribute("aria-expanded", details.open ? "true" : "false");
  summary.setAttribute("aria-controls", panel.id);
  summary.setAttribute("aria-haspopup", "menu");
  panel.setAttribute("role", "menu");
  panel.querySelectorAll("button,a").forEach((item) => item.setAttribute("role", "menuitem"));
}

function abrirMenuContextualUi(details, delay = 0, context = {}) {
  if (!details?.matches?.(".ui-context-menu")) return;
  limparTimerMenuContextualUi(details, context);
  const abrir = () => {
    fecharMenusContextuaisUi(details, context);
    details.open = true;
    sincronizarAcessibilidadeMenuContextualUi(details, context);
  };
  if (!delay) return abrir();
  getUiContextMenuTimers(context).set(details, setTimeout(abrir, delay));
}

function fecharMenuContextualUi(details, delay = 0, devolverFoco = false, context = {}) {
  const { document } = context;
  if (!details?.matches?.(".ui-context-menu")) return;
  limparTimerMenuContextualUi(details, context);
  const fechar = () => {
    if (delay && (details.matches(":hover") || details.contains(document.activeElement))) return;
    details.open = false;
    sincronizarAcessibilidadeMenuContextualUi(details, context);
    if (devolverFoco) details.querySelector(":scope > summary")?.focus?.();
  };
  if (!delay) return fechar();
  getUiContextMenuTimers(context).set(details, setTimeout(fechar, delay));
}

function fecharMenusContextuaisUi(except = null, context = {}) {
  const { document } = context;
  let fechou = false;
  document.querySelectorAll(".ui-context-menu[open]").forEach((menu) => {
    if (menu === except) return;
    fechou = true;
    fecharMenuContextualUi(menu, undefined, undefined, context);
  });
  return fechou;
}

function alternarMenuContextualUi(details, event = null, context = {}) {
  if (!details?.matches?.(".ui-context-menu")) return;
  event?.preventDefault?.();
  event?.stopPropagation?.();
  if (details.open) {
    fecharMenuContextualUi(details, undefined, undefined, context);
  } else {
    abrirMenuContextualUi(details, undefined, context);
  }
}

function sincronizarMenuContextualProduto(details, context = {}) {
  const { requestAnimationFrame, window } = context;
  if (!details) return;
  sincronizarAcessibilidadeMenuContextualUi(details, context);
  const summary = details.querySelector(":scope > summary");
  details.classList.remove("open-up");
  if (!details.open) return;
  fecharMenusContextuaisProdutosLoja(details, context);
  requestAnimationFrame(() => {
    const panel = details.querySelector(".ui-context-menu-panel");
    const trigger = summary?.getBoundingClientRect?.();
    const panelHeight = panel?.offsetHeight || 260;
    if (trigger && trigger.bottom + panelHeight + 16 > window.innerHeight && trigger.top > panelHeight) {
      details.classList.add("open-up");
    }
  });
}

function executarAcaoProdutoLojaOnline(action, productId = "", context = {}) {
  const { closeDrawer } = context;
  closeDrawer();
  fecharMenusContextuaisProdutosLoja(undefined, context);
  if (action === "view") return abrirProdutoLojaPublica(productId, context);
  if (action === "duplicate") return duplicarProdutoLojaOnline(productId, context);
  if (action === "copy") return copiarLinkProdutoLojaOnline(productId, context);
  if (action === "visible") return alternarProdutoLojaOnline(productId, "visible", context);
  if (action === "featured") return alternarProdutoLojaOnline(productId, "featured", context);
  if (action === "up") return moverProdutoLojaOnline(productId, -1, context);
  if (action === "down") return moverProdutoLojaOnline(productId, 1, context);
  if (action === "photo") return abrirSeletorFotoProdutoLojaOnline(productId, context);
  if (action === "delete") return removerProdutoLojaOnline(productId, context);
}

function renderAcoesProdutoLojaOnline(product, options = {}, context = {}) {
  const { escaparAttr } = context;
  const productId = escaparAttr(product.id);
  const asSheet = options.asSheet === true;
  const actionClass = asSheet ? "store-product-sheet-action" : "btn ghost";
  return `
    <button class="${actionClass}" type="button" onclick="executarAcaoProdutoLojaOnline('view','${productId}')">Visualizar produto</button>
    <button class="${actionClass}" type="button" onclick="executarAcaoProdutoLojaOnline('duplicate','${productId}')">Duplicar produto</button>
    <button class="${actionClass}" type="button" onclick="executarAcaoProdutoLojaOnline('visible','${productId}')">${product.visible ? "Ocultar produto" : "Exibir produto"}</button>
    <button class="${actionClass}" type="button" onclick="executarAcaoProdutoLojaOnline('copy','${productId}')">Copiar link do produto</button>
    <button class="${actionClass}" type="button" onclick="executarAcaoProdutoLojaOnline('featured','${productId}')">${product.featured ? "Remover destaque" : "Destacar produto"}</button>
    <button class="${actionClass}" type="button" onclick="executarAcaoProdutoLojaOnline('up','${productId}')">Mover para cima</button>
    <button class="${actionClass}" type="button" onclick="executarAcaoProdutoLojaOnline('down','${productId}')">Mover para baixo</button>
    ${asSheet ? `<button class="${actionClass}" type="button" onclick="executarAcaoProdutoLojaOnline('photo','${productId}')">Adicionar foto</button>` : ""}
    <button class="${asSheet ? "store-product-sheet-action danger" : "btn danger"}" type="button" onclick="executarAcaoProdutoLojaOnline('delete','${productId}')">Excluir produto</button>
  `;
}

function abrirAcoesProdutoLojaOnline(productId = "", context = {}) {
  const { document, escaparHtml, getStorefrontAdminProductsLocal, openDrawer } = context;
  const product = getStorefrontAdminProductsLocal().find((item) => String(item.id) === String(productId));
  if (!product || product.__demo) return;
  openDrawer({
    label: "Ações do produto",
    content: `
      <section id="store-product-action-sheet" class="store-product-action-sheet" role="dialog" aria-modal="true" aria-labelledby="store-product-action-sheet-title">
        <span class="store-product-sheet-handle" aria-hidden="true"></span>
        <header>
          <div>
            <small>Ações do produto</small>
            <h3 id="store-product-action-sheet-title">${escaparHtml(product.title || "Produto")}</h3>
          </div>
          <button class="btn ghost ui-icon-button" type="button" onclick="closeDrawer()" aria-label="Fechar ações do produto" title="Fechar">×</button>
        </header>
        <div class="store-product-sheet-actions">
          ${renderAcoesProdutoLojaOnline(product, { asSheet: true }, context)}
        </div>
        <button class="btn secondary store-product-sheet-cancel" type="button" onclick="closeDrawer()">Cancelar</button>
      </section>
    `
  });
  setTimeout(() => document.querySelector(".store-product-action-sheet button")?.focus?.(), 0);
}

function configurarMenusContextuaisProdutosLoja(context = {}) {
  const { closeDrawer, document, window } = context;
  if (window.__simplificaStoreProductMenusConfigured) return;
  window.__simplificaStoreProductMenusConfigured = true;
  const desktopHover = () => window.matchMedia?.("(hover: hover) and (pointer: fine)")?.matches === true;
  document.addEventListener("toggle", (event) => {
    const menu = event.target?.closest?.(".ui-context-menu");
    if (menu) sincronizarAcessibilidadeMenuContextualUi(menu, context);
  }, true);
  document.addEventListener("click", (event) => {
    const menu = event.target?.closest?.(".ui-context-menu");
    if (!menu) fecharMenusContextuaisUi(undefined, context);
  });
  document.addEventListener("pointerover", (event) => {
    if (!desktopHover()) return;
    const menu = event.target?.closest?.(".ui-context-menu");
    if (!menu || menu.contains(event.relatedTarget)) return;
    abrirMenuContextualUi(menu, 100, context);
  });
  document.addEventListener("pointerout", (event) => {
    if (!desktopHover()) return;
    const menu = event.target?.closest?.(".ui-context-menu");
    if (!menu || menu.contains(event.relatedTarget)) return;
    fecharMenuContextualUi(menu, 180, undefined, context);
  });
  document.addEventListener("focusin", (event) => {
    const menu = event.target?.closest?.(".ui-context-menu");
    if (!menu) return;
    const isSummary = event.target?.matches?.("summary");
    if (isSummary) return;
    abrirMenuContextualUi(menu, undefined, context);
  });
  document.addEventListener("focusout", (event) => {
    const menu = event.target?.closest?.(".ui-context-menu");
    if (!menu || menu.contains(event.relatedTarget)) return;
    fecharMenuContextualUi(menu, 180, undefined, context);
  });
  document.addEventListener("keydown", (event) => {
    if (event.key !== "Escape") return;
    const aberto = document.querySelector(".ui-context-menu[open]");
    if (aberto) {
      event.preventDefault();
      fecharMenuContextualUi(aberto, 0, true, context);
    }
    if (document.querySelector(".store-product-action-sheet")) closeDrawer();
  });
  document.querySelectorAll(".ui-context-menu").forEach((...__args) => sincronizarAcessibilidadeMenuContextualUi(...__args.slice(0, 1), context));
}

async function processarImagemProdutoLojaOnline(productId, input, context = {}) {
  const { STOREFRONT_ADMIN_KEYS, confirmarStorefrontSalvamentoLocal, getPlanoAtual, getStorefrontAdminImagesLocal, getStorefrontAdminStoreLocal, getStorefrontLimitsLocal, lerArquivoComoDataUrl, mostrarToast, otimizarArquivoStorefrontImagem, registrarStorefrontActivity, registrarStorefrontDebugLeve, renderApp, setStorefrontUploadStatus, storefrontAdminCurrentOwnerId, storefrontAdminIsLocalId, storefrontAdminRemoteReady, storefrontAdminRequest, storefrontAdminWrite, storefrontBeginOperation, storefrontEndOperation, storefrontQueuePendingAction, storefrontUploadPodeUsarFallbackLocal, uploadStorefrontAsset } = context;
  const files = Array.from(input?.files || []);
  if (!files.length) return;
  setStorefrontUploadStatus({
    type: "info",
    title: "Enviando imagem",
    message: "Validando arquivo e preparando a foto do produto."
  });
  const limits = getStorefrontLimitsLocal(getPlanoAtual()?.slug);
  const maxImages = limits.customThemeEnabled ? 5 : 1;
  const images = getStorefrontAdminImagesLocal();
  const productImages = images
    .filter((image) => String(image.product_id) === String(productId))
    .sort((left, right) => Number(left.order_index || 0) - Number(right.order_index || 0));
  const replaceExisting = input?.dataset?.replaceImage === "true" && productImages.length > 0;
  const replacementTarget = replaceExisting ? productImages[0] : null;
  const atuais = productImages.length - (replacementTarget ? 1 : 0);
  if (atuais + files.length > maxImages) {
    input.value = "";
    return mostrarToast(`Limite de ${maxImages} foto(s) por produto neste plano.`, "erro", 4200);
  }
  if (!storefrontBeginOperation(`storefront-product-image:${productId}`)) return;
  for (const file of files.slice(0, maxImages - atuais)) {
    try {
      const preparedFile = await otimizarArquivoStorefrontImagem(file, "produto");
      if (storefrontAdminRemoteReady() && !storefrontAdminIsLocalId(productId, "prod-")) {
        const url = await uploadStorefrontAsset(preparedFile, { tipo: "produto", productId });
        const store = getStorefrontAdminStoreLocal();
        const order = replacementTarget
          ? Number(replacementTarget.order_index || 0)
          : getStorefrontAdminImagesLocal().filter((image) => String(image.product_id) === String(productId)).length;
        const rows = await storefrontAdminRequest("/rest/v1/store_product_images", {
          method: "POST",
          headers: { Prefer: "return=representation" },
          body: JSON.stringify({
            product_id: productId,
            store_id: store.id,
            owner_id: storefrontAdminCurrentOwnerId(),
            image_url: url,
            alt_text: file.name.replace(/\.[^.]+$/, ""),
            order_index: order
          })
        });
        const next = getStorefrontAdminImagesLocal();
        next.push(rows?.[0] || {
          id: `img-${Date.now()}-${Math.random().toString(16).slice(2)}`,
          product_id: productId,
          store_id: store.id,
          owner_id: storefrontAdminCurrentOwnerId(),
          image_url: url,
          alt_text: file.name.replace(/\.[^.]+$/, ""),
          order_index: order
        });
        storefrontAdminWrite(STOREFRONT_ADMIN_KEYS.images, next);
        if (replacementTarget) await removerImagemProdutoLojaOnline(replacementTarget.id, context);
        setStorefrontUploadStatus({
          type: "success",
          title: "Foto enviada",
          message: "Imagem ajustada, salva e vinculada ao produto.",
          detail: `${file.name} · ${Math.max(1, Math.round(preparedFile.size / 1024))} KB`
        });
        registrarStorefrontActivity("Foto de produto enviada", file.name);
        mostrarToast("Imagem enviada com sucesso.", "sucesso", 2800);
        continue;
      }
      const dataUrl = await lerArquivoComoDataUrl(preparedFile);
      const next = getStorefrontAdminImagesLocal();
      const localImage = {
        id: `img-${Date.now()}-${Math.random().toString(16).slice(2)}`,
        product_id: productId,
        store_id: getStorefrontAdminStoreLocal().id,
        owner_id: getStorefrontAdminStoreLocal().owner_id,
        image_url: dataUrl,
        alt_text: file.name.replace(/\.[^.]+$/, ""),
        order_index: replacementTarget
          ? Number(replacementTarget.order_index || 0)
          : next.filter((image) => String(image.product_id) === String(productId)).length
      };
      next.push(localImage);
      storefrontAdminWrite(STOREFRONT_ADMIN_KEYS.images, next);
      if (replacementTarget) await removerImagemProdutoLojaOnline(replacementTarget.id, context);
      storefrontQueuePendingAction("product-image-upload", { id: localImage.id, fileName: file.name });
      setStorefrontUploadStatus({
        type: "success",
        title: "Foto salva neste aparelho",
        message: "Imagem ajustada. A atualização online será feita automaticamente.",
        detail: `${file.name} · ${Math.max(1, Math.round(preparedFile.size / 1024))} KB`
      });
      registrarStorefrontActivity("Foto de produto adicionada", file.name);
      confirmarStorefrontSalvamentoLocal("Foto salva neste aparelho.");
      renderApp();
    } catch (error) {
      if (storefrontUploadPodeUsarFallbackLocal(error)) {
        try {
          const preparedFile = await otimizarArquivoStorefrontImagem(file, "produto");
          const dataUrl = await lerArquivoComoDataUrl(preparedFile);
          const next = getStorefrontAdminImagesLocal();
          const localImage = {
            id: `img-${Date.now()}-${Math.random().toString(16).slice(2)}`,
            product_id: productId,
            store_id: getStorefrontAdminStoreLocal().id,
            owner_id: getStorefrontAdminStoreLocal().owner_id,
            image_url: dataUrl,
            alt_text: file.name.replace(/\.[^.]+$/, ""),
            order_index: replacementTarget
              ? Number(replacementTarget.order_index || 0)
              : next.filter((image) => String(image.product_id) === String(productId)).length
          };
          next.push(localImage);
          storefrontAdminWrite(STOREFRONT_ADMIN_KEYS.images, next);
          if (replacementTarget) await removerImagemProdutoLojaOnline(replacementTarget.id, context);
          storefrontQueuePendingAction("product-image-upload", { id: localImage.id, fileName: file.name });
          setStorefrontUploadStatus({
            type: "success",
            title: "Foto salva localmente",
            message: "A imagem foi preservada e será atualizada online automaticamente.",
            detail: `${file.name} · ${Math.max(1, Math.round(preparedFile.size / 1024))} KB`
          });
          registrarStorefrontActivity("Foto de produto salva localmente", file.name);
          confirmarStorefrontSalvamentoLocal("Foto salva neste aparelho.");
          continue;
        } catch (fallbackError) {
          registrarStorefrontDebugLeve("persistencia_falhou", "Fallback local de foto de produto falhou.", { message: fallbackError?.message || String(fallbackError) });
        }
      }
      setStorefrontUploadStatus({
        type: "error",
        title: "Falha ao enviar foto",
        message: error?.message || "Erro ao enviar imagem. Tente novamente.",
        detail: "Confira sua conexão, o tamanho do arquivo e tente novamente."
      });
      registrarStorefrontDebugLeve("upload_falhou", "Falha ao processar foto de produto.", { productId, message: error?.message || String(error) });
      mostrarToast("Não foi possível enviar a imagem. Tente novamente.", "erro", 4200);
      console.error("[Storefront admin] imagem produto", error);
    }
  }
  input.value = "";
  renderApp();
  storefrontEndOperation(`storefront-product-image:${productId}`);
}

function getStorefrontCropConfig(tipo = "banner", context = {}) {
  if (tipo === "logo") return { aspect: 1, width: 720, height: 720, title: "Ajustar logo", help: "Use enquadramento quadrado para a marca aparecer bem na loja e no ícone." };
  if (tipo === "categoria") return { aspect: 1, width: 900, height: 900, title: "Ajustar foto da categoria", help: "Use enquadramento quadrado para a categoria aparecer bem no celular e no computador." };
  return { aspect: 16 / 9, width: 1600, height: 900, title: "Ajustar banner", help: "Use enquadramento 16:9 para evitar cortes no celular e no computador." };
}

function readStorefrontFileAsDataUrl(file, context = {}) {
  const { FileReader } = context;
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

async function abrirCropImagemLojaOnline(tipo, input, context = {}) {
  const { document, escaparAttr, escaparHtml, mostrarToast, validarArquivoStorefrontImagem, window } = context;
  const file = input?.files?.[0];
  if (!file) return;
  try {
    validarArquivoStorefrontImagem(file, tipo);
    const dataUrl = await readStorefrontFileAsDataUrl(file, context);
    const config = getStorefrontCropConfig(tipo, context);
    const popup = document.getElementById("popup");
    if (!popup) {
      await processarImagemLojaOnlineComArquivo(tipo, file, input, context);
      return;
    }
    popup.innerHTML = `
      <div class="modal-backdrop storefront-crop-backdrop" role="dialog" aria-modal="true">
        <section class="modal-card storefront-crop-modal">
          <div class="modal-header">
            <div>
              <span class="status-badge">Enquadramento ${tipo === "logo" ? "1:1" : "16:9"}</span>
              <h2>${escaparHtml(config.title)}</h2>
              <p class="muted">${escaparHtml(config.help)}</p>
            </div>
            <button class="icon-button" type="button" onclick="fecharPopup()" title="Fechar">✕</button>
          </div>
          <div class="storefront-crop-grid">
            <div class="storefront-crop-stage ${tipo === "logo" ? "is-logo" : ""}">
              <img src="${escaparAttr(dataUrl)}" alt="Visualização do enquadramento" data-storefront-crop-image>
            </div>
            <div class="storefront-crop-controls">
              <label>Ampliação<input type="range" min="1" max="2.4" step="0.05" value="1" data-storefront-crop-zoom oninput="atualizarPreviewCropLojaOnline()"></label>
              <label>Horizontal<input type="range" min="-40" max="40" step="1" value="0" data-storefront-crop-x oninput="atualizarPreviewCropLojaOnline()"></label>
              <label>Vertical<input type="range" min="-40" max="40" step="1" value="0" data-storefront-crop-y oninput="atualizarPreviewCropLojaOnline()"></label>
              <p class="muted">A imagem será compactada após o recorte para reduzir espaço no PWA/APK.</p>
            </div>
          </div>
          <div class="modal-actions">
            <button class="btn ghost" type="button" onclick="fecharPopup()">Cancelar</button>
            <button class="btn" type="button" onclick="confirmarCropImagemLojaOnline('${escaparAttr(tipo)}')">Usar imagem recortada</button>
          </div>
        </section>
      </div>
    `;
    window.__storefrontCropState = { tipo, fileName: file.name, dataUrl, input };
    atualizarPreviewCropLojaOnline(context);
  } catch (error) {
    mostrarToast("Não foi possível abrir o editor da imagem.", "erro", 3800);
    if (input) input.value = "";
  }
}

function atualizarPreviewCropLojaOnline(context = {}) {
  const { document } = context;
  const image = document.querySelector("[data-storefront-crop-image]");
  if (!image) return;
  const zoom = Number(document.querySelector("[data-storefront-crop-zoom]")?.value || 1);
  const x = Number(document.querySelector("[data-storefront-crop-x]")?.value || 0);
  const y = Number(document.querySelector("[data-storefront-crop-y]")?.value || 0);
  image.style.transform = `translate(${x}%, ${y}%) scale(${zoom})`;
}

async function confirmarCropImagemLojaOnline(tipo, context = {}) {
  const { File, Image, document, fecharPopup, mostrarToast, window } = context;
  const state = window.__storefrontCropState || {};
  const config = getStorefrontCropConfig(tipo || state.tipo, context);
  const zoom = Number(document.querySelector("[data-storefront-crop-zoom]")?.value || 1);
  const offsetX = Number(document.querySelector("[data-storefront-crop-x]")?.value || 0) / 100;
  const offsetY = Number(document.querySelector("[data-storefront-crop-y]")?.value || 0) / 100;
  const image = new Image();
  image.src = state.dataUrl;
  await new Promise((resolve, reject) => {
    image.onload = resolve;
    image.onerror = reject;
  });
  const canvas = document.createElement("canvas");
  canvas.width = config.width;
  canvas.height = config.height;
  const ctx = canvas.getContext("2d");
  const sourceAspect = image.naturalWidth / image.naturalHeight;
  let sx = 0;
  let sy = 0;
  let sw = image.naturalWidth;
  let sh = image.naturalHeight;
  if (sourceAspect > config.aspect) {
    sw = image.naturalHeight * config.aspect;
    sx = (image.naturalWidth - sw) / 2;
  } else {
    sh = image.naturalWidth / config.aspect;
    sy = (image.naturalHeight - sh) / 2;
  }
  sw = sw / zoom;
  sh = sh / zoom;
  sx = Math.max(0, Math.min(image.naturalWidth - sw, sx + offsetX * (image.naturalWidth - sw)));
  sy = Math.max(0, Math.min(image.naturalHeight - sh, sy + offsetY * (image.naturalHeight - sh)));
  ctx.drawImage(image, sx, sy, sw, sh, 0, 0, canvas.width, canvas.height);
  const blob = await new Promise((resolve) => canvas.toBlob(resolve, "image/webp", 0.84));
  if (!blob) {
    mostrarToast("Não foi possível recortar a imagem.", "erro", 3200);
    return;
  }
  const file = new File([blob], `${String(state.fileName || "storefront").replace(/\.[^.]+$/, "")}-crop.webp`, { type: "image/webp" });
  fecharPopup();
  await processarImagemLojaOnlineComArquivo(tipo || state.tipo, file, state.input, context);
}

async function processarImagemLojaOnline(tipo, input, context = {}) {
  await abrirCropImagemLojaOnline(tipo, input, context);
}

async function processarImagemLojaOnlineComArquivo(tipo, file, input, context = {}) {
  const { getStorefrontAdminCategoriesLocal, getStorefrontAdminStoreLocal, lerArquivoComoDataUrl, limparStorefrontAlteracoesPendentes, mostrarToast, otimizarArquivoStorefrontImagem, registrarStorefrontActivity, registrarStorefrontDebugLeve, renderApp, setStorefrontUploadStatus, storefrontAdminIsLocalId, storefrontAdminPersistStoreRemote, storefrontAdminRemoteReady, storefrontAdminSaveStore, storefrontBeginOperation, storefrontEndOperation, storefrontQueuePendingAction, storefrontUploadPodeUsarFallbackLocal, uploadStorefrontAsset } = context;
  if (!file) return;
  if (!storefrontBeginOperation(`storefront-store-image:${tipo}`)) return;
  const isCategory = tipo === "categoria";
  try {
    setStorefrontUploadStatus({
      type: "info",
      title: tipo === "logo" ? "Enviando logo" : isCategory ? "Enviando foto da categoria" : "Enviando banner",
      message: "Validando arquivo e otimizando a imagem."
    });
    const preparedFile = await otimizarArquivoStorefrontImagem(file, tipo);
    const store = getStorefrontAdminStoreLocal();
    if (!storefrontAdminRemoteReady()) throw new Error("Conecte sua conta para concluir o envio da imagem.");
    if (!store?.id || storefrontAdminIsLocalId(store.id, "store-")) throw new Error("Salve a aparência da loja antes de enviar imagens.");
    const categoryId = String(input?.dataset?.categoryId || "");
    const category = isCategory
      ? getStorefrontAdminCategoriesLocal().find((item) => String(item.id) === categoryId)
      : null;
    if (isCategory && !category) throw new Error("Não foi possível localizar a categoria selecionada.");
    const url = await uploadStorefrontAsset(preparedFile, { tipo, categoryId, assetKey: isCategory ? categoryId : "" });
    if (isCategory) {
      const categoryImages = { ...(store.theme_config?.category_images || {}) };
      categoryImages[categoryId] = url;
      if (category.slug) categoryImages[String(category.slug)] = url;
      const next = {
        ...store,
        theme_config: { ...(store.theme_config || {}), category_images: categoryImages }
      };
      storefrontAdminSaveStore(next);
      await storefrontAdminPersistStoreRemote(next);
      limparStorefrontAlteracoesPendentes("Foto da categoria salva");
      setStorefrontUploadStatus({
        type: "success",
        title: "Foto da categoria enviada",
        message: "Imagem ajustada e salva com segurança na loja.",
        detail: `${file.name} · ${Math.max(1, Math.round(preparedFile.size / 1024))} KB`
      });
      registrarStorefrontActivity("Foto da categoria atualizada", category.name || file.name);
      mostrarToast("Foto da categoria enviada.", "sucesso", 2600);
      renderApp();
      return;
    }
    const field = tipo === "logo" ? "logo_url" : "banner_url";
    const next = { ...store, [field]: url };
    storefrontAdminSaveStore(next);
    await storefrontAdminPersistStoreRemote(next);
    limparStorefrontAlteracoesPendentes(tipo === "logo" ? "Logo salva" : "Banner salvo");
    setStorefrontUploadStatus({
      type: "success",
      title: tipo === "logo" ? "Logo enviado" : "Banner enviado",
      message: "Imagem ajustada e salva com sucesso na loja.",
      detail: `${file.name} · ${Math.max(1, Math.round(preparedFile.size / 1024))} KB`
    });
    registrarStorefrontActivity(tipo === "logo" ? "Logo atualizada" : "Banner alterado", file.name);
    mostrarToast(tipo === "logo" ? "Logo enviado." : "Banner enviado.", "sucesso", 2600);
    renderApp();
  } catch (error) {
    if (!isCategory && storefrontUploadPodeUsarFallbackLocal(error)) {
      try {
        const preparedFile = await otimizarArquivoStorefrontImagem(file, tipo);
        const dataUrl = await lerArquivoComoDataUrl(preparedFile);
        const field = tipo === "logo" ? "logo_url" : "banner_url";
        const next = { ...getStorefrontAdminStoreLocal(), [field]: dataUrl };
        storefrontAdminSaveStore(next);
        storefrontQueuePendingAction("store-image-upload", { id: next.id, tipo, fileName: file.name });
        limparStorefrontAlteracoesPendentes(tipo === "logo" ? "Logo salva localmente" : "Banner salvo localmente");
        setStorefrontUploadStatus({
          type: "warning",
          title: tipo === "logo" ? "Logo salvo localmente" : "Banner salvo localmente",
          message: "A imagem foi ajustada e mantida neste aparelho.",
          detail: "Tente sincronizar novamente quando a conexão estiver estável."
        });
        registrarStorefrontActivity(tipo === "logo" ? "Logo salva localmente" : "Banner salvo localmente", file.name);
        mostrarToast("Imagem mantida neste aparelho. Tente sincronizar novamente.", "aviso", 4200);
        renderApp();
        return;
      } catch (fallbackError) {
        registrarStorefrontDebugLeve("persistencia_falhou", `Fallback local de ${tipo} falhou.`, { message: fallbackError?.message || String(fallbackError) });
      }
    }
    setStorefrontUploadStatus({
      type: "error",
      title: tipo === "logo" ? "Falha ao enviar logo" : isCategory ? "Falha ao enviar foto da categoria" : "Falha ao enviar banner",
      message: error?.message || "Erro ao enviar imagem. Tente novamente.",
      detail: "Confira sua conexão, o tamanho do arquivo e tente novamente."
    });
    registrarStorefrontDebugLeve("upload_falhou", `Falha ao enviar ${tipo} da Loja Online.`, { message: error?.message || String(error) });
    mostrarToast("Não foi possível enviar a imagem. Tente novamente.", "erro", 4200);
    console.error("[Storefront admin] imagem loja", error);
    renderApp();
  } finally {
    if (input) input.value = "";
    storefrontEndOperation(`storefront-store-image:${tipo}`);
  }
}

async function removerImagemProdutoLojaOnline(id, context = {}) {
  const { STOREFRONT_ADMIN_KEYS, confirmarStorefrontSalvamentoLocal, getStorefrontAdminImagesLocal, registrarStorefrontActivity, registrarStorefrontDebugLeve, renderApp, storefrontAdminIsLocalId, storefrontAdminRemoteReady, storefrontAdminRequest, storefrontAdminWrite, storefrontQueuePendingAction } = context;
  storefrontAdminWrite(STOREFRONT_ADMIN_KEYS.images, getStorefrontAdminImagesLocal().filter((image) => image.id !== id));
  try {
    if (storefrontAdminRemoteReady() && !storefrontAdminIsLocalId(id, "img-")) {
      await storefrontAdminRequest(`/rest/v1/store_product_images?id=eq.${encodeURIComponent(id)}`, {
        method: "DELETE",
        headers: { Prefer: "return=minimal" }
      });
    } else {
      storefrontQueuePendingAction("image-delete", { id });
    }
    registrarStorefrontActivity("Imagem removida", "Galeria do produto atualizada.");
    renderApp();
  } catch (error) {
    storefrontQueuePendingAction("image-delete", { id });
    registrarStorefrontDebugLeve("persistencia_falhou", "Imagem removida localmente e aguardando sincronização.", { message: error?.message || String(error) });
    confirmarStorefrontSalvamentoLocal("Imagem removida neste aparelho.");
    renderApp();
  }
}
  const api = Object.freeze({ getStorefrontProductDraftState, gerarChaveRascunhoLojaOnline, gerarChaveRascunhoProdutoLojaOnline, isProdutoNovoSemIdLojaOnline, isStorefrontProductMobileFlow, getStorefrontProductFormField, limparErroCampoProdutoLojaOnline, mostrarErroCampoProdutoLojaOnline, validarEtapaProdutoLojaOnline, validarTodasEtapasProdutoLojaOnline, atualizarResumoRevisaoProdutoLojaOnline, avancarEtapaProdutoLojaOnline, voltarEtapaProdutoLojaOnline, ajustarQuantidadeProdutoLojaOnline, alternarProdutoLojaOnline, removerProdutoLojaOnline, moverProdutoLojaOnline, moverCategoriaLojaOnline, duplicarProdutoLojaOnline, abrirProdutoLojaPublica, copiarLinkProdutoLojaOnline, abrirSeletorFotoProdutoLojaOnline, abrirSeletorImagemStorefront, processarImagemCategoriaLojaOnline, processarImagemExemploLojaOnline, fecharMenusContextuaisProdutosLoja, getUiContextMenuTimers, limparTimerMenuContextualUi, sincronizarAcessibilidadeMenuContextualUi, abrirMenuContextualUi, fecharMenuContextualUi, fecharMenusContextuaisUi, alternarMenuContextualUi, sincronizarMenuContextualProduto, executarAcaoProdutoLojaOnline, renderAcoesProdutoLojaOnline, abrirAcoesProdutoLojaOnline, configurarMenusContextuaisProdutosLoja, processarImagemProdutoLojaOnline, getStorefrontCropConfig, readStorefrontFileAsDataUrl, abrirCropImagemLojaOnline, atualizarPreviewCropLojaOnline, confirmarCropImagemLojaOnline, processarImagemLojaOnline, processarImagemLojaOnlineComArquivo, removerImagemProdutoLojaOnline });
  global.SimplificaStorefrontProductEditor = api;
  if (typeof module !== "undefined" && module.exports) module.exports = api;
})(typeof window !== "undefined" ? window : globalThis);
