(function attachStorefrontAdminRemote(global) {
  "use strict";



function storefrontBeginOperation(key = "storefront-save", context = {}) {
  const { mostrarToast, storefrontActiveOperations } = context;
  if (storefrontActiveOperations.has(key)) {
    mostrarToast("Esta alteração já está sendo salva.", "info", 2200);
    return false;
  }
  storefrontActiveOperations.add(key);
  return true;
}

function storefrontEndOperation(key = "storefront-save", context = {}) {
  const { storefrontActiveOperations } = context;
  storefrontActiveOperations.delete(key);
}

function storefrontAdminIsLocalId(id, prefix = "", context = {}) {
  const value = String(id || "");
  return !value || value.startsWith(prefix) || /^(cat|prod|img|store|draft)-/.test(value);
}

function storefrontAdminCurrentOwnerId(context = {}) {
  const { getStorefrontAdminStoreLocal, getUsuarioAtual, syncConfig } = context;
  return syncConfig.supabaseUserId || getStorefrontAdminStoreLocal().owner_id || getUsuarioAtual()?.id || "";
}

function storefrontAdminRequireRemoteStore(context = {}) {
  const { getStorefrontAdminStoreLocal } = context;
  const store = getStorefrontAdminStoreLocal();
  if (!store?.id || storefrontAdminIsLocalId(store.id, "store-", context)) {
    throw new Error("Salve a loja em Aparência antes de publicar categorias, produtos ou imagens.");
  }
  return store;
}

async function storefrontAdminUpsertCategory(category, context = {}) {
  const { storefrontAdminRequest } = context;
  const payload = {
    store_id: category.store_id,
    owner_id: storefrontAdminCurrentOwnerId(context),
    name: category.name,
    slug: category.slug,
    icon: category.icon || null,
    order_index: Number(category.order_index || 0),
    visible: category.visible !== false
  };
  const storeId = encodeURIComponent(payload.store_id);
  const slug = encodeURIComponent(payload.slug);
  const findExisting = async () => {
    if (category.id && !storefrontAdminIsLocalId(category.id, "cat-", context)) {
      const byId = await storefrontAdminRequest(`/rest/v1/store_categories?select=*&id=eq.${encodeURIComponent(category.id)}&store_id=eq.${storeId}&limit=1`);
      if (byId?.[0]) return byId[0];
    }
    const rows = await storefrontAdminRequest(`/rest/v1/store_categories?select=*&store_id=eq.${storeId}&slug=eq.${slug}&limit=1`);
    return rows?.[0] || null;
  };
  let remoteId = (await findExisting())?.id || "";
  if (!remoteId) {
    try {
      const rows = await storefrontAdminRequest("/rest/v1/store_categories", {
        method: "POST",
        headers: { Prefer: "return=representation" },
        body: JSON.stringify(payload)
      });
      return rows?.[0] || category;
    } catch (error) {
      const existing = await findExisting();
      if (!existing?.id) throw error;
      remoteId = existing.id;
    }
  }
  const rows = await storefrontAdminRequest(`/rest/v1/store_categories?id=eq.${encodeURIComponent(remoteId)}`, {
    method: "PATCH",
    headers: { Prefer: "return=representation" },
    body: JSON.stringify(payload)
  });
  return rows?.[0] || { ...category, ...payload, id: remoteId };
}

async function storefrontAdminUpsertProduct(product, context = {}) {
  const { storefrontAdminRequest } = context;
  const payload = {
    store_id: product.store_id,
    owner_id: storefrontAdminCurrentOwnerId(context),
    erp_product_id: product.erp_product_id || null,
    title: product.title,
    slug: product.slug,
    short_description: product.short_description || "",
    description: product.description || "",
    price: Number(product.price || 0),
    compare_price: product.compare_price || null,
    category_id: product.category_id || null,
    visible: product.visible === true,
    featured: product.featured === true,
    is_customizable: product.is_customizable === true,
    estimated_production_time: product.estimated_production_time || "",
    stock_mode: product.stock_mode || "unlimited",
    stock_quantity: product.stock_quantity === null || product.stock_quantity === undefined ? null : Number(product.stock_quantity || 0),
    price_mode: product.price_mode || "fixed",
    show_price: product.show_price !== false,
    public_observations: product.public_observations || null
  };
  const storeId = encodeURIComponent(payload.store_id);
  const slug = encodeURIComponent(payload.slug);
  const findExisting = async () => {
    if (product.id && !storefrontAdminIsLocalId(product.id, "prod-", context)) {
      const byId = await storefrontAdminRequest(`/rest/v1/store_products?select=*&id=eq.${encodeURIComponent(product.id)}&store_id=eq.${storeId}&limit=1`);
      if (byId?.[0]) return byId[0];
    }
    const rows = await storefrontAdminRequest(`/rest/v1/store_products?select=*&store_id=eq.${storeId}&slug=eq.${slug}&limit=1`);
    return rows?.[0] || null;
  };
  let remoteId = (await findExisting())?.id || "";
  if (!remoteId) {
    try {
      const rows = await storefrontAdminRequest("/rest/v1/store_products", {
        method: "POST",
        headers: { Prefer: "return=representation" },
        body: JSON.stringify(payload)
      });
      return rows?.[0] || product;
    } catch (error) {
      const existing = await findExisting();
      if (!existing?.id) throw error;
      remoteId = existing.id;
    }
  }
  const rows = await storefrontAdminRequest(`/rest/v1/store_products?id=eq.${encodeURIComponent(remoteId)}`, {
    method: "PATCH",
    headers: { Prefer: "return=representation" },
    body: JSON.stringify(payload)
  });
  return rows?.[0] || { ...product, ...payload, id: remoteId };
}

function storefrontImageOutputMime(file, preset, context = {}) {
  const { canvasSuportaMime } = context;
  const inputMime = String(file?.type || "").toLowerCase();
  if (typeof canvasSuportaMime === "function" && canvasSuportaMime("image/webp")) return "image/webp";
  if (preset.preserveAlpha && inputMime.includes("png")) return "image/png";
  return "image/jpeg";
}

function storefrontCanvasToBlob(canvas, mime = "image/webp", quality = 0.84, context = {}) {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => blob ? resolve(blob) : reject(new Error("Não foi possível preparar a imagem.")), mime, quality);
  });
}

function carregarImagemStorefrontArquivo(file, context = {}) {
  const { createImageBitmap } = context;
  if (typeof createImageBitmap === "function") {
    return createImageBitmap(file, { imageOrientation: "from-image" })
      .then((bitmap) => ({
        source: bitmap,
        width: bitmap.width,
        height: bitmap.height,
        close: () => bitmap.close?.()
      }))
      .catch(() => carregarImagemStorefrontArquivoHtml(file, context));
  }
  return carregarImagemStorefrontArquivoHtml(file, context);
}

function carregarImagemStorefrontArquivoHtml(file, context = {}) {
  const { Image, document } = context;
  if (typeof document === "undefined" || typeof URL === "undefined") return Promise.reject(new Error("Leitura de imagem indisponível neste aparelho."));
  return new Promise((resolve, reject) => {
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(objectUrl);
      const width = img.naturalWidth || img.width;
      const height = img.naturalHeight || img.height;
      if (!width || !height) return reject(new Error("Escolha uma imagem válida."));
      resolve({ source: img, width, height, close: () => {} });
    };
    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error("Não foi possível abrir esta imagem. Escolha outro arquivo."));
    };
    img.src = objectUrl;
  });
}

async function otimizarArquivoStorefrontImagem(file, tipo = "produto", context = {}) {
  const { File, document, extensaoImagemBlob, getStorefrontImagePreset, validarArquivoStorefrontImagem } = context;
  validarArquivoStorefrontImagem(file, tipo);
  const preset = getStorefrontImagePreset(tipo);
  const loaded = await carregarImagemStorefrontArquivo(file, context);
  try {
    const scale = Math.min(1, preset.maxSide / Math.max(loaded.width, loaded.height));
    const width = Math.max(1, Math.round(loaded.width * scale));
    const height = Math.max(1, Math.round(loaded.height * scale));
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d", { alpha: preset.preserveAlpha });
    if (!ctx) throw new Error("Não foi possível preparar a imagem neste aparelho.");
    if (!preset.preserveAlpha) {
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, width, height);
    }
    ctx.drawImage(loaded.source, 0, 0, width, height);
    const mime = storefrontImageOutputMime(file, preset, context);
    let blob = null;
    let workingCanvas = canvas;
    for (let attempt = 0; attempt < 8; attempt += 1) {
      const quality = Math.max(0.62, preset.quality - attempt * 0.04);
      blob = await storefrontCanvasToBlob(workingCanvas, mime, quality, context);
      if (blob.size <= preset.maxBytes || mime === "image/png") break;
      if (attempt >= 3) {
        const smaller = document.createElement("canvas");
        smaller.width = Math.max(1, Math.round(workingCanvas.width * 0.88));
        smaller.height = Math.max(1, Math.round(workingCanvas.height * 0.88));
        smaller.getContext("2d", { alpha: preset.preserveAlpha })?.drawImage(workingCanvas, 0, 0, smaller.width, smaller.height);
        workingCanvas = smaller;
      }
    }
    if (!blob) throw new Error("Não foi possível preparar a imagem.");
    const ext = extensaoImagemBlob(blob.type || mime);
    const fileName = `${String(file.name || preset.label).replace(/\.[^.]+$/, "")}-otimizada.${ext}`;
    const optimized = new File([blob], fileName, { type: blob.type || mime, lastModified: Date.now() });
    optimized.__storefrontImageMeta = {
      originalName: file.name,
      originalSize: file.size,
      width: workingCanvas.width,
      height: workingCanvas.height,
      size: blob.size,
      tipo
    };
    return optimized;
  } finally {
    loaded.close?.();
  }
}

function compressStorefrontImage(file, tipo = "produto", context = {}) {
  const { getStorefrontImagePreset } = context;
  if (file?.__storefrontImageMeta) return Promise.resolve(file);
  return otimizarArquivoStorefrontImagem(file, tipo, context).catch(() => compressStorefrontImageWithHtmlCanvas(file, getStorefrontImagePreset(tipo).maxSide, getStorefrontImagePreset(tipo).quality, context));
}

function compressStorefrontImageWithHtmlCanvas(file, maxSide = 1200, quality = 0.82, context = {}) {
  const { Image, document } = context;
  if (typeof document === "undefined" || typeof URL === "undefined") return Promise.reject(new Error("Canvas indisponível"));
  return new Promise((resolve, reject) => {
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);
    img.onload = () => {
      try {
        const scale = Math.min(1, maxSide / Math.max(img.naturalWidth || img.width, img.naturalHeight || img.height));
        const width = Math.max(1, Math.round((img.naturalWidth || img.width) * scale));
        const height = Math.max(1, Math.round((img.naturalHeight || img.height) * scale));
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, width, height);
        canvas.toBlob((blob) => {
          URL.revokeObjectURL(objectUrl);
          if (blob) resolve(blob);
          else reject(new Error("Não foi possível compactar a imagem."));
        }, "image/webp", quality);
      } catch (error) {
        URL.revokeObjectURL(objectUrl);
        reject(error);
      }
    };
    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error("Não foi possível carregar a imagem."));
    };
    img.src = objectUrl;
  });
}

async function uploadStorefrontAsset(file, { tipo = "produto", productId = "", categoryId = "", assetKey = "" } = {}, context = {}) {
  const { atualizarOperacaoUX, atualizarUploadOperacaoUX, cabecalhosSupabase, concluirOperacaoUX, extensaoImagemBlob, falharOperacaoUX, fetch, iniciarOperacaoUX, normalizarUrlSupabase, registrarStorefrontDebugLeve, segmentoStorageSeguro, validarArquivoStorefrontImagem } = context;
  const store = storefrontAdminRequireRemoteStore(context);
  const blob = await compressStorefrontImage(file, tipo, context);
  validarArquivoStorefrontImagem(blob, tipo);
  const operacaoUX = iniciarOperacaoUX({
    name: "upload-storefront-image",
    title: "Enviando imagem",
    message: "Preparando arquivo otimizado...",
    context: `loja:${tipo}`,
    steps: ["Preparando imagem", "Enviando arquivo", "Confirmando endereço público"],
    progress: 15
  });
  const base = normalizarUrlSupabase();
  const owner = segmentoStorageSeguro(storefrontAdminCurrentOwnerId(context), "owner");
  const storeId = segmentoStorageSeguro(store.id, "store");
  const ext = extensaoImagemBlob(blob.type || file.type || "image/webp");
  const safeName = segmentoStorageSeguro((file.name || tipo).replace(/\.[^.]+$/, ""), tipo);
  const unique = assetKey
    ? `${segmentoStorageSeguro(assetKey, tipo)}-${safeName}.${ext}`
    : `${Date.now()}-${Math.random().toString(16).slice(2)}-${safeName}.${ext}`;
  const path = tipo === "logo"
    ? `${owner}/${storeId}/logo/${unique}`
    : tipo === "banner"
      ? `${owner}/${storeId}/banner/${unique}`
      : tipo === "categoria"
        ? `${owner}/${storeId}/categories/${segmentoStorageSeguro(categoryId, "category")}/${unique}`
      : `${owner}/${storeId}/products/${segmentoStorageSeguro(productId, "product")}/${unique}`;
  registrarStorefrontDebugLeve("upload_iniciado", "Upload Storefront iniciado.", {
    bucket: "storefront-assets",
    path,
    tipo,
    size: blob.size,
    mime: blob.type || file.type || ""
  });
  atualizarOperacaoUX(operacaoUX, { stepIndex: 1, message: "Enviando imagem para a loja...", progress: 30 });
  atualizarUploadOperacaoUX(operacaoUX, {
    current: 1,
    total: 1,
    loaded: 0,
    totalBytes: blob.size,
    label: "Enviando imagem 1 de 1"
  });
  let resposta;
  try {
    resposta = await fetch(`${base}/storage/v1/object/storefront-assets/${path}`, {
      method: "POST",
      headers: cabecalhosSupabase(true, {
        "Content-Type": blob.type || "image/webp",
        "x-upsert": assetKey ? "true" : "false"
      }),
      body: blob
    });
  } catch (error) {
    falharOperacaoUX(operacaoUX, error, "Erro ao enviar");
    throw error;
  }
  if (!resposta.ok) {
    const text = await resposta.text().catch(() => "");
    registrarStorefrontDebugLeve("upload_falhou", "Falha ao enviar imagem da Loja Online.", {
      bucket: "storefront-assets",
      path,
      tipo,
      status: resposta.status,
      store_id: store.id,
      response: text.slice(0, 600)
    });
    falharOperacaoUX(operacaoUX, text || "Falha no upload", "Erro ao enviar");
    throw new Error(text || "Erro ao enviar imagem. Tente novamente.");
  }
  atualizarUploadOperacaoUX(operacaoUX, {
    current: 1,
    total: 1,
    loaded: blob.size,
    totalBytes: blob.size,
    progress: 100,
    label: "Imagem enviada"
  });
  atualizarOperacaoUX(operacaoUX, { stepIndex: 2, message: "Imagem disponível na loja.", progress: 100 });
  const url = `${base}/storage/v1/object/public/storefront-assets/${path}`;
  registrarStorefrontDebugLeve("upload_concluido", "Upload Storefront concluído.", {
    bucket: "storefront-assets",
    path,
    tipo,
    url
  });
  concluirOperacaoUX(operacaoUX, "Imagem enviada");
  return url;
}

function storefrontUploadPodeUsarFallbackLocal(error, context = {}) {
  const message = String(error?.message || error || "");
  return /bucket not found|storage|404|Upload real exige|Salve a aparência/i.test(message);
}

function lerArquivoComoDataUrl(file, context = {}) {
  const { FileReader } = context;
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = () => reject(reader.error || new Error("Não foi possível ler a imagem."));
    reader.readAsDataURL(file);
  });
}

async function storefrontDataUrlToFile(dataUrl = "", fileName = "storefront-image.webp", context = {}) {
  const { File, fetch } = context;
  const response = await fetch(String(dataUrl || ""));
  if (!response.ok) throw new Error("Não foi possível recuperar a imagem salva neste aparelho.");
  const blob = await response.blob();
  return new File([blob], fileName, { type: blob.type || "image/webp" });
}

async function prepararStorefrontImagemPreview(file, tipo = "produto", context = {}) {
  const blob = await compressStorefrontImage(file, tipo, context).catch(() => file);
  return lerArquivoComoDataUrl(blob, context);
}

function storefrontImagemRemotaOuNull(value = "", context = {}) {
  const texto = String(value || "").trim();
  if (!texto || texto.startsWith("data:")) return null;
  return texto;
}

async function sincronizarLojaOnlineAdminRemoto(force = false, context = {}) {
  const { STOREFRONT_ADMIN_KEYS, canUseStorefrontLocal, getStorefrontDirtyState, getStorefrontPendingQueue, mostrarToast, registrarStorefrontDebugLeve, renderApp, storefrontAdminRemoteReady, storefrontAdminRequest, storefrontAdminStorageGet, storefrontAdminStorageSet, storefrontAdminWrite, storefrontFlushPendingQueue, syncConfig } = context;
  if (!canUseStorefrontLocal() || !storefrontAdminRemoteReady()) return;
  const pendingBeforeSync = getStorefrontPendingQueue();
  if (pendingBeforeSync.length) {
    const flush = await storefrontFlushPendingQueue({ notify: force });
    if (flush.pending) return;
  }
  if (getStorefrontDirtyState().dirty) {
    if (force) mostrarToast("Salve ou descarte as alterações locais antes de baixar dados da loja.", "aviso", 3600);
    return;
  }
  const lastSync = Number(storefrontAdminStorageGet(STOREFRONT_ADMIN_KEYS.lastRemoteSync) || 0);
  if (!force && Date.now() - lastSync < 120000) return;
  try {
    const owner = encodeURIComponent(syncConfig.supabaseUserId);
    const stores = await storefrontAdminRequest(`/rest/v1/stores?select=*&owner_id=eq.${owner}&limit=1`);
    const store = stores?.[0];
    if (!store?.id) return;
    storefrontAdminWrite(STOREFRONT_ADMIN_KEYS.store, store);
    const storeId = encodeURIComponent(store.id);
    const [categories, products, leads, events, images] = await Promise.all([
      storefrontAdminRequest(`/rest/v1/store_categories?select=*&store_id=eq.${storeId}&order=order_index.asc`),
      storefrontAdminRequest(`/rest/v1/store_products?select=*&store_id=eq.${storeId}&order=featured.desc,updated_at.desc`),
      storefrontAdminRequest(`/rest/v1/store_cart_leads?select=*&store_id=eq.${storeId}&order=created_at.desc`),
      storefrontAdminRequest(`/rest/v1/store_events?select=*&store_id=eq.${storeId}&order=created_at.desc&limit=500`),
      storefrontAdminRequest(`/rest/v1/store_product_images?select=*&store_id=eq.${storeId}&order=order_index.asc`)
    ]);
    storefrontAdminWrite(STOREFRONT_ADMIN_KEYS.categories, categories || []);
    storefrontAdminWrite(STOREFRONT_ADMIN_KEYS.products, products || []);
    storefrontAdminWrite(STOREFRONT_ADMIN_KEYS.images, images || []);
    storefrontAdminWrite("simplifica-storefront-leads-preview-v1", leads || []);
    storefrontAdminWrite("simplifica-storefront-events-preview-v1", events || []);
    storefrontAdminStorageSet(STOREFRONT_ADMIN_KEYS.lastRemoteSync, String(Date.now()));
    if (force) {
      mostrarToast("Dados da Loja Online sincronizados.", "sucesso", 2600);
      renderApp();
    }
  } catch (error) {
    if (force) mostrarToast("Não foi possível sincronizar a Loja Online agora.", "erro", 3600);
    registrarStorefrontDebugLeve("persistencia_falhou", "Sincronização remota da Loja Online falhou.", { message: error?.message || String(error) });
    console.warn("[Storefront admin] sync failed", error);
  }
}

function getStorefrontAdminViewModel(context = {}) {
  const { STOREFRONT_ADMIN_KEYS, aplicarRegraPublicacaoLojaLocal, getPlanoAtual, getStorefrontAdminCategoriesLocal, getStorefrontAdminImagesLocal, getStorefrontAdminProductsLocal, getStorefrontAdminStoreLocal, getStorefrontDemoPreviewData, getStorefrontLimitsLocal, getStorefrontPreviewEventsLocal, getStorefrontPreviewLeadsLocal, getStorefrontProductRankingFromEvents, isStorefrontDemoPreviewAllowed, ordenarProdutosLojaInteligente, storefrontAdminHasStoredValue, storefrontAdminRead, storefrontIsDemoProduct } = context;
  aplicarRegraPublicacaoLojaLocal({ silent: true });
  const baseStore = getStorefrontAdminStoreLocal();
  const demoAllowed = isStorefrontDemoPreviewAllowed();
  const hasStoredStore = storefrontAdminHasStoredValue(STOREFRONT_ADMIN_KEYS.store);
  const demoPreview = demoAllowed ? getStorefrontDemoPreviewData(baseStore) : null;
  const store = demoAllowed && !hasStoredStore ? demoPreview.store : baseStore;
  const hasStoredCategories = storefrontAdminHasStoredValue(STOREFRONT_ADMIN_KEYS.categories);
  const hasStoredProducts = storefrontAdminHasStoredValue(STOREFRONT_ADMIN_KEYS.products);
  const hasStoredLeads = storefrontAdminHasStoredValue("simplifica-storefront-leads-preview-v1");
  const hasStoredEvents = storefrontAdminHasStoredValue("simplifica-storefront-events-preview-v1");
  const storedCategories = getStorefrontAdminCategoriesLocal();
  const storedProducts = getStorefrontAdminProductsLocal();
  const dismissedExamples = new Set(storefrontAdminRead(STOREFRONT_ADMIN_KEYS.dismissedExamples, []));
  const storedCategoryBySlug = new Map(storedCategories.map((category) => [String(category.slug || ""), category.id]));
  const storedProductKeys = new Set(storedProducts.flatMap((product) => [String(product.id || ""), String(product.slug || "")]).filter(Boolean));
  const demoCategorySlugById = new Map((demoPreview?.categories || []).map((category) => [String(category.id), String(category.slug || "")]));
  const useDemoCategories = demoAllowed && demoPreview.categories.length > 0;
  const useDemoProducts = demoAllowed && demoPreview.products.length > 0;
  const demoCategories = useDemoCategories
    ? demoPreview.categories.filter((category) => !dismissedExamples.has(String(category.id)) && !storedCategoryBySlug.has(String(category.slug || "")))
    : [];
  const demoProducts = useDemoProducts
    ? demoPreview.products.filter((product) => !dismissedExamples.has(String(product.id)) && !storedProductKeys.has(String(product.id || "")) && !storedProductKeys.has(String(product.slug || ""))).map((product) => {
      const demoCategorySlug = demoCategorySlugById.get(String(product.category_id || ""));
      return {
        ...product,
        category_id: storedCategoryBySlug.get(demoCategorySlug) || product.category_id
      };
    })
    : [];
  const categories = [...storedCategories, ...demoCategories].sort((a, b) => Number(a.order_index || 0) - Number(b.order_index || 0));
  const rawProducts = [...storedProducts, ...demoProducts];
  const images = getStorefrontAdminImagesLocal();
  const leads = getStorefrontPreviewLeadsLocal();
  const events = getStorefrontPreviewEventsLocal();
  const limits = getStorefrontLimitsLocal(getPlanoAtual()?.slug);
  const availableProducts = Number.isFinite(Number(limits.productLimit)) && Number(limits.productLimit) <= 0
    ? rawProducts.filter(storefrontIsDemoProduct)
    : rawProducts;
  const productRanking = getStorefrontProductRankingFromEvents(events);
  const products = ordenarProdutosLojaInteligente(availableProducts, productRanking);
  const demo = {
    enabled: (
      categories.some((item) => item.__demo)
      || products.some((item) => item.__demo)
      || (demoAllowed && leads.some((item) => item.__demo))
      || (demoAllowed && events.some((item) => item.__demo))
      || (demoAllowed && store.__demo)
    ),
    store: demoAllowed && !hasStoredStore,
    categories: demoAllowed && (!hasStoredCategories || useDemoCategories),
    products: demoAllowed && (!hasStoredProducts || useDemoProducts),
    leads: demoAllowed && !hasStoredLeads,
    events: demoAllowed && !hasStoredEvents
  };
  return { store, categories, products, images, leads, events, productRanking, limits, demo };
}

function storefrontAdminSaveStore(store, context = {}) {
  const { STOREFRONT_ADMIN_KEYS, getStorefrontPublicationAccess, getStorefrontPublicationStatus, isStorefrontPubliclyAccessible, storefrontAdminWrite } = context;
  const access = getStorefrontPublicationAccess();
  const normalizedStatus = getStorefrontPublicationStatus(store, access);
  storefrontAdminWrite(STOREFRONT_ADMIN_KEYS.store, {
    ...store,
    active: isStorefrontPubliclyAccessible(store, access) ? store.active === true : false,
    publication_status: normalizedStatus,
    updatedAt: new Date().toISOString()
  });
}

function storefrontIsPublicSlugConflict(error, context = {}) {
  const details = error?.details?.response || error?.details || "";
  const message = `${error?.message || error || ""} ${typeof details === "string" ? details : JSON.stringify(details)}`;
  return /stores_public_slug_unique|duplicate key value.*slug|slug.*already exists/i.test(message);
}

function storefrontIsPublicationSchemaMissing(error, context = {}) {
  const details = error?.details?.response || error?.details || "";
  const message = `${error?.message || error || ""} ${typeof details === "string" ? details : JSON.stringify(details)}`;
  return /publication_status|publication_suspended_reason|publication_suspended_at/i.test(message)
    && /column|schema cache|could not find|unknown/i.test(message);
}

function storefrontWithoutPublicationColumns(payload = {}, context = {}) {
  const {
    publication_status: _publicationStatus,
    publication_suspended_reason: _publicationSuspendedReason,
    publication_suspended_at: _publicationSuspendedAt,
    ...legacyPayload
  } = payload;
  return legacyPayload;
}

function storefrontBuildOwnedSlugCandidate(slug = "loja", attempt = 0, context = {}) {
  const { storefrontAdminSlugify } = context;
  const base = storefrontAdminSlugify(slug || "loja") || "loja";
  const ownerSuffix = storefrontAdminSlugify(storefrontAdminCurrentOwnerId(context)).slice(0, 8) || "online";
  return storefrontAdminSlugify(`${base}-${ownerSuffix}${attempt > 0 ? `-${attempt + 1}` : ""}`);
}

async function storefrontAdminFindRemoteStoreByOwner(context = {}) {
  const { storefrontAdminRequest } = context;
  const owner = encodeURIComponent(storefrontAdminCurrentOwnerId(context));
  if (!owner) return null;
  const rows = await storefrontAdminRequest(`/rest/v1/stores?select=*&owner_id=eq.${owner}&limit=1`);
  return rows?.[0] || null;
}

async function storefrontAdminFindRemoteStore(store = {}, context = {}) {
  const { storefrontAdminRequest } = context;
  if (store?.id && !storefrontAdminIsLocalId(store.id, "store-", context)) {
    const rows = await storefrontAdminRequest(`/rest/v1/stores?select=*&id=eq.${encodeURIComponent(store.id)}&owner_id=eq.${encodeURIComponent(storefrontAdminCurrentOwnerId(context))}&limit=1`);
    if (rows?.[0]) return rows[0];
  }
  return storefrontAdminFindRemoteStoreByOwner(context);
}

function storefrontAdminAdoptRemoteStore(remoteStore, context = {}) {
  const { STOREFRONT_ADMIN_KEYS, getStorefrontAdminCategoriesLocal, getStorefrontAdminProductsLocal, storefrontAdminWrite } = context;
  storefrontAdminSaveStore(remoteStore, context);
  storefrontAdminWrite(STOREFRONT_ADMIN_KEYS.categories, getStorefrontAdminCategoriesLocal().map((category) => ({ ...category, store_id: remoteStore.id, owner_id: remoteStore.owner_id })));
  storefrontAdminWrite(STOREFRONT_ADMIN_KEYS.products, getStorefrontAdminProductsLocal().map((product) => ({ ...product, store_id: remoteStore.id, owner_id: remoteStore.owner_id })));
  return remoteStore;
}

async function storefrontAdminPatchStoreRemote(storeId, payload, context = {}) {
  const { storefrontAdminRequest } = context;
  const rows = await storefrontAdminRequest(`/rest/v1/stores?id=eq.${encodeURIComponent(storeId)}`, {
    method: "PATCH",
    headers: { Prefer: "return=representation" },
    body: JSON.stringify(payload)
  });
  return rows?.[0] || { ...payload, id: storeId };
}

async function storefrontAdminPersistStoreRemote(store, context = {}) {
  const { getStorefrontAdminStoreLocal, getStorefrontDefaultSlugLocal, getStorefrontPublicationAccess, getStorefrontPublicationStatus, isStorefrontPubliclyAccessible, mostrarToast, storefrontAdminRequest, storefrontAdminSlugify, syncConfig } = context;
  if (store === undefined) store = getStorefrontAdminStoreLocal();
  const access = getStorefrontPublicationAccess();
  const publicActive = isStorefrontPubliclyAccessible(store, access);
  const mutablePayload = {
    name: store.name,
    description: store.description,
    logo_url: storefrontImagemRemotaOuNull(store.logo_url, context),
    banner_url: storefrontImagemRemotaOuNull(store.banner_url, context),
    whatsapp: store.whatsapp || null,
    instagram: store.instagram || null,
    active: publicActive,
    publication_status: getStorefrontPublicationStatus({ ...store, active: publicActive }, access),
    publication_suspended_reason: publicActive ? null : (store.publication_suspended_reason || store.publicationSuspendedReason || access.reason || null),
    publication_suspended_at: publicActive ? null : (store.publication_suspended_at || store.publicationSuspendedAt || new Date().toISOString()),
    theme_config: store.theme_config || {}
  };
  const existingStore = await storefrontAdminFindRemoteStore(store, context);
  if (existingStore?.id) {
    let remoteStore = null;
    try {
      remoteStore = await storefrontAdminPatchStoreRemote(existingStore.id, mutablePayload, context);
    } catch (error) {
      if (!storefrontIsPublicationSchemaMissing(error, context)) throw error;
      remoteStore = await storefrontAdminPatchStoreRemote(existingStore.id, storefrontWithoutPublicationColumns(mutablePayload, context), context);
    }
    return storefrontAdminAdoptRemoteStore({ ...existingStore, ...remoteStore, slug: existingStore.slug }, context);
  }
  const initialSlug = storefrontAdminSlugify(store.slug || store.name || getStorefrontDefaultSlugLocal());
  for (let attempt = -1; attempt < 4; attempt += 1) {
    const createPayload = {
      owner_id: syncConfig.supabaseUserId,
      slug: attempt < 0 ? initialSlug : storefrontBuildOwnedSlugCandidate(initialSlug, attempt, context),
      ...mutablePayload
    };
    try {
      let rows = null;
      try {
        rows = await storefrontAdminRequest("/rest/v1/stores", {
          method: "POST",
          headers: { Prefer: "return=representation" },
          body: JSON.stringify(createPayload)
        });
      } catch (error) {
        if (!storefrontIsPublicationSchemaMissing(error, context)) throw error;
        rows = await storefrontAdminRequest("/rest/v1/stores", {
          method: "POST",
          headers: { Prefer: "return=representation" },
          body: JSON.stringify(storefrontWithoutPublicationColumns(createPayload, context))
        });
      }
      if (rows?.[0]) return storefrontAdminAdoptRemoteStore(rows[0], context);
    } catch (error) {
      if (!storefrontIsPublicSlugConflict(error, context)) throw error;
      const remoteCreatedByAnotherSession = await storefrontAdminFindRemoteStoreByOwner(context);
      if (remoteCreatedByAnotherSession?.id) {
        let remoteStore = null;
        try {
          remoteStore = await storefrontAdminPatchStoreRemote(remoteCreatedByAnotherSession.id, mutablePayload, context);
        } catch (patchError) {
          if (!storefrontIsPublicationSchemaMissing(patchError, context)) throw patchError;
          remoteStore = await storefrontAdminPatchStoreRemote(remoteCreatedByAnotherSession.id, storefrontWithoutPublicationColumns(mutablePayload, context), context);
        }
        mostrarToast("A sincronização foi concluída sem duplicar informações.", "sucesso", 2800);
        return storefrontAdminAdoptRemoteStore({ ...remoteCreatedByAnotherSession, ...remoteStore, slug: remoteCreatedByAnotherSession.slug }, context);
      }
    }
  }
  throw new Error("Não foi possível concluir a criação da loja agora. Tente sincronizar novamente.");
}

async function salvarStorefrontAparencia(event, context = {}) {
  const { atualizarOperacaoUX, clearStorefrontUploadStatus, concluirNavegacaoPendenteLoja, concluirOperacaoUX, confirmarStorefrontSalvamentoLocal, document, falharOperacaoUX, getStorefrontAdminStoreLocal, getStorefrontDefaultSlugLocal, iniciarOperacaoUX, limparStorefrontAlteracoesPendentes, mostrarToast, normalizarCorTemaControlado, normalizarTelefoneWhatsapp, registrarStorefrontActivity, registrarStorefrontDebugLeve, renderApp, requestSensitiveActionConfirmation, setBotaoLoading, storefrontAdminRemoteReady, storefrontQueuePendingAction, validarTextoVisualLoja } = context;
  event?.preventDefault?.();
  const form = event?.target || document.getElementById("storefrontAppearanceForm");
  if (!form) return;
  if (!storefrontBeginOperation("storefront-appearance-save", context)) return;
  const botao = form.querySelector("button[type='submit']");
  let operacaoUX = "";
  try {
    const store = getStorefrontAdminStoreLocal();
    const name = validarTextoVisualLoja(form.storeName ? form.storeName.value : store.name, 50, "nome");
    if (!name) throw new Error("Informe o nome público da loja.");
    const description = validarTextoVisualLoja(form.storeDescription ? form.storeDescription.value : store.description, 100, "subtítulo");
    const bannerTitle = validarTextoVisualLoja(form.storeBannerTitle?.value || store.theme_config?.banner_title || "", 40, "título");
    const bannerSubtitle = validarTextoVisualLoja(form.storeBannerSubtitle?.value || store.theme_config?.banner_subtitle || description, 100, "subtítulo");
    const bannerCtaLabel = validarTextoVisualLoja(form.storeBannerCtaLabel?.value || store.theme_config?.banner_cta_label || "Ver catálogo", 24, "texto do botão");
    const whatsapp = normalizarTelefoneWhatsapp(form.storeWhatsApp?.value || "");
    if (whatsapp && whatsapp.length < 10) throw new Error("Informe um WhatsApp válido com DDD.");
    const slug = store.slug || getStorefrontDefaultSlugLocal();
    const next = {
      ...store,
      name,
      slug,
      description,
      whatsapp,
      instagram: form.storeInstagram?.value?.trim() || "",
      logo_url: form.storeLogoUrl?.value?.trim() || store.logo_url || "",
      banner_url: form.storeBannerUrl?.value?.trim() || store.banner_url || "",
      theme_config: {
        ...(store.theme_config || {}),
        primary: normalizarCorTemaControlado(form.storePrimary?.value || "#147F78", "light", "primary"),
        accent: normalizarCorTemaControlado(form.storeAccent?.value || "#4D9CA2", "light", "secondary"),
        mode: "light",
        banner_title: bannerTitle,
        banner_subtitle: bannerSubtitle,
        banner_cta_label: bannerCtaLabel,
        banner_cta_action: form.storeBannerCtaAction?.value || store.theme_config?.banner_cta_action || "catalog"
      }
    };
    if (!await requestSensitiveActionConfirmation({
      actionLabel: "alterar identidade visual da loja",
      titulo: "Autorizar identidade da loja",
      mensagem: "Confirme sua senha antes de alterar nome, logo, banner, cores ou identidade pública da loja.",
      confirmar: "Autorizar alteração",
      cancelar: "Cancelar",
      exigirConfirmacaoVisual: true
    })) return;
    setBotaoLoading(botao, true, "Salvando...");
    operacaoUX = iniciarOperacaoUX({
      name: "save-storefront-settings",
      title: "Salvando loja",
      message: "Validando identidade e contatos...",
      context: "loja-aparencia",
      steps: ["Validando dados", "Salvando configurações", "Atualizando loja", "Finalizando"],
      progress: 15
    });
    storefrontAdminSaveStore(next, context);
    atualizarOperacaoUX(operacaoUX, { stepIndex: 1, message: "Salvando configurações...", progress: 45 });
    let syncPending = false;
    if (storefrontAdminRemoteReady()) {
      try {
        atualizarOperacaoUX(operacaoUX, { stepIndex: 2, message: "Atualizando loja online...", progress: 70 });
        await storefrontAdminPersistStoreRemote(next, context);
      } catch (syncError) {
        syncPending = true;
        storefrontQueuePendingAction("store-upsert", next);
        registrarStorefrontDebugLeve("persistencia_falhou", "Aparência salva localmente e aguardando sincronização.", { message: syncError?.message || String(syncError) });
      }
    } else {
      syncPending = true;
      storefrontQueuePendingAction("store-upsert", next);
    }
    limparStorefrontAlteracoesPendentes(syncPending ? "Aparência salva; atualização online automática" : "Aparência salva");
    clearStorefrontUploadStatus();
    registrarStorefrontActivity("Aparência atualizada", "Nome, cores, links ou imagens da loja foram salvos.");
    if (syncPending) confirmarStorefrontSalvamentoLocal("Aparência salva neste aparelho.");
    else mostrarToast("Aparência da loja salva.", "sucesso", 3200);
    atualizarOperacaoUX(operacaoUX, { stepIndex: 3, message: "Configurações salvas.", progress: 100 });
    concluirOperacaoUX(operacaoUX, "Loja salva");
    renderApp();
    concluirNavegacaoPendenteLoja();
  } catch (error) {
    falharOperacaoUX(operacaoUX, error, "Erro ao salvar");
    mostrarToast("Não foi possível salvar a aparência agora.", "erro", 4200);
    registrarStorefrontDebugLeve("save_falhou", "Falha ao salvar aparência da loja.", { message: error?.message || String(error) });
    console.error("[Storefront admin] salvar aparência", error);
  } finally {
    setBotaoLoading(botao, false);
    storefrontEndOperation("storefront-appearance-save", context);
  }
}

async function alternarStatusLojaOnline(context = {}) {
  const { STOREFRONT_PUBLICATION_STATUS, atualizarOperacaoUX, concluirOperacaoUX, confirmarStorefrontSalvamentoLocal, document, exigirChecklistPublicacaoLoja, falharOperacaoUX, getStorefrontAdminStoreLocal, getStorefrontPublicationAccess, iniciarOperacaoUX, limparStorefrontAlteracoesPendentes, mostrarToast, registrarStorefrontActivity, registrarStorefrontDebugLeve, renderApp, renderStorefrontPublishedModal, requestSensitiveActionConfirmation, storefrontAdminRemoteReady, storefrontQueuePendingAction } = context;
  if (!storefrontBeginOperation("storefront-status-save", context)) return;
  let operacaoUX = "";
  try {
  const store = getStorefrontAdminStoreLocal();
  const publicationAccess = getStorefrontPublicationAccess();
  if (!store.active && !publicationAccess.canPublish) {
    exigirChecklistPublicacaoLoja({ intent: "publicar" });
    return;
  }
  if (!store.active && !exigirChecklistPublicacaoLoja({ intent: "publicar" })) return;
  if (!await requestSensitiveActionConfirmation({
    actionLabel: store.active ? "colocar loja em rascunho" : "publicar loja",
    titulo: store.active ? "Autorizar rascunho da loja" : "Autorizar publicação da loja",
    mensagem: store.active
      ? "Confirme sua senha antes de retirar a loja do ar."
      : "Confirme sua senha antes de liberar esta loja para clientes.",
    confirmar: store.active ? "Autorizar rascunho" : "Autorizar publicação",
    cancelar: "Cancelar",
    perigo: store.active,
    exigirConfirmacaoVisual: true
  })) return;
  operacaoUX = iniciarOperacaoUX({
    name: "storefront-publish",
    title: store.active ? "Atualizando publicação" : "Publicando loja",
    message: "Validando informações da loja...",
    context: "loja-online",
    steps: [
      "Validando logo e banner",
      "Validando contatos",
      "Validando produtos",
      "Atualizando catálogo",
      "Finalizando"
    ],
    progress: 10
  });
  atualizarOperacaoUX(operacaoUX, { stepIndex: 1, message: "Validando contatos...", progress: 25 });
  const nextActive = !store.active;
  const next = {
    ...store,
    active: nextActive,
    publication_status: nextActive ? STOREFRONT_PUBLICATION_STATUS.PUBLISHED : STOREFRONT_PUBLICATION_STATUS.UNPUBLISHED,
    publication_suspended_reason: null,
    publication_suspended_at: null
  };
  storefrontAdminSaveStore(next, context);
  atualizarOperacaoUX(operacaoUX, { stepIndex: 2, message: "Validando produtos...", progress: 45 });
  let syncPending = false;
  try {
    if (storefrontAdminRemoteReady()) {
      atualizarOperacaoUX(operacaoUX, { stepIndex: 3, message: "Atualizando catálogo online...", progress: 65 });
      await storefrontAdminPersistStoreRemote(next, context);
    } else {
      syncPending = true;
      storefrontQueuePendingAction("store-status", { id: next.id, active: next.active === true });
    }
    limparStorefrontAlteracoesPendentes(syncPending ? "Status salvo; atualização online automática" : (next.active ? "Loja publicada" : "Loja em rascunho"));
    registrarStorefrontActivity(next.active ? "Loja publicada" : "Loja colocada em rascunho", next.slug || "loja");
    if (next.active && !syncPending) {
      const popup = document.getElementById("popup");
      if (popup) popup.innerHTML = renderStorefrontPublishedModal(next);
      mostrarToast("Loja publicada com sucesso.", "sucesso", 2600);
    } else if (syncPending) {
      confirmarStorefrontSalvamentoLocal(next.active ? "Solicitação de publicação salva neste aparelho." : "Alteração de status salva neste aparelho.");
    } else {
      mostrarToast("Loja colocada em rascunho.", "sucesso", 2600);
    }
  } catch (error) {
    syncPending = true;
    storefrontQueuePendingAction("store-status", { id: next.id, active: next.active === true });
    limparStorefrontAlteracoesPendentes("Status salvo; atualização online automática");
    confirmarStorefrontSalvamentoLocal(next.active ? "Solicitação de publicação salva neste aparelho." : "Alteração de status salva neste aparelho.");
    registrarStorefrontDebugLeve("save_falhou", "Falha ao sincronizar status da loja.", { message: error?.message || String(error) });
  }
  atualizarOperacaoUX(operacaoUX, { stepIndex: 4, message: "Finalizando publicação...", progress: 100 });
  renderApp();
  } catch (error) {
    falharOperacaoUX(operacaoUX, error, "Não foi possível concluir");
    mostrarToast("Não foi possível atualizar a publicação agora.", "erro", 4200);
    registrarStorefrontDebugLeve("save_falhou", "Falha inesperada ao atualizar publicação.", { message: error?.message || String(error) });
  } finally {
    concluirOperacaoUX(operacaoUX, "Loja atualizada");
    storefrontEndOperation("storefront-status-save", context);
  }
}

function abrirEditorCategoriaLojaOnline(id = "", context = {}) {
  const { STOREFRONT_ADMIN_KEYS, setStorefrontAdminTab, storefrontAdminStorageRemove, storefrontAdminStorageSet } = context;
  if (id) storefrontAdminStorageSet(STOREFRONT_ADMIN_KEYS.editingCategory, id);
  else storefrontAdminStorageRemove(STOREFRONT_ADMIN_KEYS.editingCategory);
  setStorefrontAdminTab("categories");
}

async function excluirCategoriaLojaOnline(id, context = {}) {
  const { STOREFRONT_ADMIN_KEYS, confirmarStorefrontSalvamentoLocal, getStorefrontAdminCategoriesLocal, getStorefrontAdminProductsLocal, getStorefrontGuidedSelection, mostrarToast, registrarStorefrontActivity, registrarStorefrontDebugLeve, renderApp, requestSensitiveActionConfirmation, restoreStorefrontGuidedCatalogState, returnToStorefrontGuidedCatalog, storefrontAdminRemoteReady, storefrontAdminRequest, storefrontAdminWrite, storefrontQueuePendingAction } = context;
  let shouldRestoreCatalog = false;
  const products = getStorefrontAdminProductsLocal();
  if (products.some((product) => product.category_id === id)) return mostrarToast("Não é possível excluir categoria com produtos vinculados.", "erro", 4200);
  if (!await requestSensitiveActionConfirmation({
    actionLabel: "excluir categoria da loja",
    titulo: "Autorizar exclusão de categoria",
    mensagem: "Confirme sua senha antes de remover esta categoria da loja.",
    confirmar: "Excluir categoria",
    cancelar: "Cancelar",
    perigo: true,
    exigirConfirmacaoVisual: true
  })) return;
  const categories = getStorefrontAdminCategoriesLocal().filter((cat) => cat.id !== id);
  storefrontAdminWrite(STOREFRONT_ADMIN_KEYS.categories, categories);
  try {
    if (storefrontAdminRemoteReady() && !storefrontAdminIsLocalId(id, "cat-", context)) {
      await storefrontAdminRequest(`/rest/v1/store_categories?id=eq.${encodeURIComponent(id)}`, {
        method: "DELETE",
        headers: { Prefer: "return=minimal" }
      });
    } else {
      storefrontQueuePendingAction("category-delete", { id });
    }
    if (getStorefrontGuidedSelection().type === "category" && String(getStorefrontGuidedSelection().id) === String(id)) {
      shouldRestoreCatalog = true;
      returnToStorefrontGuidedCatalog("categories", { source: "guided-category-delete" });
    }
    registrarStorefrontActivity("Categoria removida", "Categoria sem produtos vinculados.");
    mostrarToast("Categoria removida.", "sucesso");
    renderApp();
    if (shouldRestoreCatalog) restoreStorefrontGuidedCatalogState("categories");
  } catch (error) {
    storefrontQueuePendingAction("category-delete", { id });
    registrarStorefrontDebugLeve("persistencia_falhou", "Categoria removida localmente e aguardando sincronização.", { message: error?.message || String(error) });
    confirmarStorefrontSalvamentoLocal("Categoria removida neste aparelho.");
    renderApp();
  }
}
  const api = Object.freeze({ storefrontBeginOperation, storefrontEndOperation, storefrontAdminIsLocalId, storefrontAdminCurrentOwnerId, storefrontAdminRequireRemoteStore, storefrontAdminUpsertCategory, storefrontAdminUpsertProduct, storefrontImageOutputMime, storefrontCanvasToBlob, carregarImagemStorefrontArquivo, carregarImagemStorefrontArquivoHtml, otimizarArquivoStorefrontImagem, compressStorefrontImage, compressStorefrontImageWithHtmlCanvas, uploadStorefrontAsset, storefrontUploadPodeUsarFallbackLocal, lerArquivoComoDataUrl, storefrontDataUrlToFile, prepararStorefrontImagemPreview, storefrontImagemRemotaOuNull, sincronizarLojaOnlineAdminRemoto, getStorefrontAdminViewModel, storefrontAdminSaveStore, storefrontIsPublicSlugConflict, storefrontIsPublicationSchemaMissing, storefrontWithoutPublicationColumns, storefrontBuildOwnedSlugCandidate, storefrontAdminFindRemoteStoreByOwner, storefrontAdminFindRemoteStore, storefrontAdminAdoptRemoteStore, storefrontAdminPatchStoreRemote, storefrontAdminPersistStoreRemote, salvarStorefrontAparencia, alternarStatusLojaOnline, abrirEditorCategoriaLojaOnline, excluirCategoriaLojaOnline });
  global.SimplificaStorefrontAdminRemote = api;
  if (typeof module !== "undefined" && module.exports) module.exports = api;
})(typeof window !== "undefined" ? window : globalThis);
