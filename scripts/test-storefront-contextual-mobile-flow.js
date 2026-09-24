const fs = require("fs");

const app = fs.readFileSync("app.js", "utf8");
const css = fs.readFileSync("style.css", "utf8");
const renderer = fs.readFileSync("src/storefront/renderers/editorV3.js", "utf8");
const publicRenderer = fs.readFileSync("src/storefront/renderers/publicV3.js", "utf8");
const guidedModule = fs.readFileSync("src/features/storefront/storefront-guided.js", "utf8");
const publicModule = fs.readFileSync("src/features/storefront/storefront-public.js", "utf8");
const hay = `${app}\n${guidedModule}\n${publicModule}`;

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function extractFunction(name) {
  let best = "";
  let searchFrom = 0;
  while (true) {
    const start = hay.indexOf(`function ${name}`, searchFrom);
    if (start < 0) break;
    const signatureEnd = hay.indexOf(") {", start);
    const braceStart = signatureEnd >= 0 ? signatureEnd + 2 : hay.indexOf("{", start);
    let depth = 0;
    let body = "";
    for (let index = braceStart; index < hay.length; index += 1) {
      if (hay[index] === "{") depth += 1;
      if (hay[index] === "}") depth -= 1;
      if (depth === 0) {
        body = hay.slice(start, index + 1);
        break;
      }
    }
    if (body.length > best.length) best = body;
    searchFrom = start + 1;
  }
  assert(best, `Funcao ausente: ${name}`);
  return best;
}

[
  "function getStorefrontContextualEditorState",
  "function setStorefrontContextualEditorState",
  "function isStorefrontContextualEditorRoute",
  "function sincronizarHistoricoPainelGuiadoLoja",
  "function fecharPainelGuiadoLojaPorHistorico",
  "function selecionarItemLojaVisual",
  "function fecharPainelEdicaoGuiadaLoja",
  "function voltarPainelLojaVisual",
  "function abrirLojaPublicaAdminContextual",
  "function renderStoreVisualEditorSidebar",
  "function renderStoreVisualMobileActions",
  "function renderStoreGuidedChecklistPanel",
  "function navigateToStorefrontCompletionItem"
].forEach((marker) => assert(hay.includes(marker), `Contrato contextual ausente: ${marker}`));

const openAdmin = extractFunction("abrirLojaPublicaAdminContextual");
assert(openAdmin.includes("const abrirGuiaPwa = isWebPwaProfile() && !isMobile()"), "Abrir /admin=1 deve abrir guia automaticamente apenas no PWA desktop");
assert(openAdmin.includes("panelOpen: abrirGuiaPwa"), "PWA desktop deve iniciar com painel guiado aberto e mobile/APK devem preservar vitrine inicial");
assert(openAdmin.includes('history.pushState({ simplifica: true, tela: "lojaPublica", loja: publicRoute, admin: true }'), "Rota admin contextual deve permanecer como lojaPublica com admin=1");
assert(!openAdmin.includes('trocarTela("lojaOnline"'), "Abrir admin contextual nao pode redirecionar para resumo da loja");

const selectVisual = extractFunction("selecionarItemLojaVisual");
assert(selectVisual.includes("normalizeStorefrontGuidedSelection({ type, id, ...options }"), "Selecao contextual deve normalizar entidade, campo e etapa");
assert(selectVisual.includes("setStorefrontContextualEditorState({ selection: nextSelection, panelOpen: true })"), "Selecao contextual deve usar autoridade central e abrir painel");
assert(selectVisual.includes("renderizarPreservandoScroll()"), "Selecao contextual deve preservar a vitrine durante render");
assert(selectVisual.includes("alinharSelecaoLojaVisual"), "Selecao contextual deve centralizar o item editado");
assert(selectVisual.includes("selection.targetField"), "Selecao contextual deve focar campo especifico quando houver alvo");

const contextualState = extractFunction("setStorefrontContextualEditorState");
assert(contextualState.includes("wasPanelOpen"), "Estado contextual deve saber quando o painel acabou de abrir");
assert(contextualState.includes("sincronizarHistoricoPainelGuiadoLoja"), "Abertura do painel deve sincronizar historico interno");

const historySync = extractFunction("sincronizarHistoricoPainelGuiadoLoja");
assert(historySync.includes("window.history.pushState"), "Painel guiado mobile deve criar entrada de historico para o botao Voltar");
assert(historySync.includes("storefrontGuidedPanel: true"), "Historico do painel deve ser identificavel");
assert(historySync.includes("window.history.replaceState"), "Fechamento manual do painel deve limpar o marcador de historico");

const historyClose = extractFunction("fecharPainelGuiadoLojaPorHistorico");
assert(historyClose.includes("fecharPainelEdicaoGuiadaLoja({ syncHistory: false })"), "Popstate deve fechar painel sem recriar historico");
assert(app.includes("if (fecharPainelGuiadoLojaPorHistorico()) return;"), "Popstate deve fechar painel contextual antes de renderizar/voltar rota");

const closePanel = extractFunction("fecharPainelEdicaoGuiadaLoja");
assert(closePanel.includes("panelOpen: false"), "Fechar painel deve apenas fechar o contexto interno");
assert(closePanel.includes('selection: { type: "overview"'), "Fechar painel deve neutralizar a seleção para evitar reabertura por clique atravessado");
assert(closePanel.includes("syncHistory: options.syncHistory !== false"), "Fechar painel deve permitir origem historico sem loop");
assert(!closePanel.includes('trocarTela("lojaOnline"'), "Fechar painel nao deve voltar para resumo da loja");

const backPanel = extractFunction("voltarPainelLojaVisual");
assert(backPanel.includes("isStorefrontContextualEditorRoute(context) && storefrontGuidedPanelOpen"), "Voltar deve fechar primeiro o painel contextual aberto");
assert(backPanel.includes("event?.stopPropagation?.()"), "Voltar deve bloquear propagacao para a vitrine clicavel");
assert(backPanel.includes("fecharPainelEdicaoGuiadaLoja(undefined, context);"), "Voltar interno deve reaproveitar fechamento seguro do painel");
assert(backPanel.includes('trocarTela("lojaOnline")'), "Voltar sem contexto ainda pode retornar ao resumo da loja");

[
  'onclick="abrirChecklistGuiadoLoja()"',
  "navigateToStorefrontCompletionItem",
  "getStorefrontCompletion(vm)",
  "getStorefrontPublicationChecklist",
  "completion",
  "canPublish"
].forEach((marker) => assert(app.includes(marker) || renderer.includes(marker), `Checklist contextual desacoplado do motor central: ${marker}`));

[
  'edit("banner", "", "banner", "storeBannerTitle", "hero")',
  'edit("identity", "", "logo", "storeLogoUrl", "brand")',
  'edit("contacts", "", "contacts", "whatsapp", "contact")',
  'edit("category", category.id, "category", "categoryName", "category-card")',
  'edit("product", product.id, "basic", "productTitle", "product-card")',
  'name="productPrice"',
  'name="productPhotoGallery"',
  'name="whatsapp"',
  'name="instagram"'
].forEach((marker) => assert(app.includes(marker) || renderer.includes(marker) || publicRenderer.includes(marker), `Clique contextual nao mapeado: ${marker}`));

[
  ".store-guided-editor-sidebar.is-open",
  "bottom:var(--app-safe-bottom) !important",
  ".store-context-edit-fab",
  "z-index:84",
  ":has(.store-guided-editor-sidebar.is-open) .store-context-edit-fab",
  "@media (max-width:860px)",
  "position:fixed",
  "bottom:calc(var(--bottom-nav-height, 72px) + var(--app-safe-bottom, 0px) + 16px) !important",
  "bottom:calc(var(--bottom-nav-height, 72px) + var(--app-safe-bottom, 0px) + 8px) !important",
  "max-height:min(52dvh, 520px) !important",
  "max-height:min(68dvh, 600px)",
  "padding-bottom:calc(44vh + 78px + var(--app-safe-bottom))"
].forEach((marker) => assert(css.includes(marker), `Contrato mobile contextual ausente: ${marker}`));

const contextualRender = [
  extractFunction("renderStoreVisualEditorSidebar"),
  extractFunction("renderStoreVisualEditorTopbar"),
  extractFunction("renderStoreVisualMobileActions"),
  extractFunction("renderStoreGuidedContextPanel")
].join("\n");
assert(!contextualRender.includes("entitlement"), "Fluxo contextual nao deve expor termo tecnico entitlement");
assert(!contextualRender.includes("loja real"), "Fluxo contextual nao deve reintroduzir texto loja real");

console.log("Storefront contextual mobile flow: rota admin, painel, checklist, contatos, voltar e safe area validados por contrato.");
