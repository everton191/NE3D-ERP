const fs = require("fs");

const app = fs.readFileSync("app.js", "utf8");
const css = fs.readFileSync("style.css", "utf8");

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

[
  "function renderStorePublicMainNav",
  "function renderStoreGuidedCategoryForm",
  "function renderStorefrontUnsavedChangesModal",
  "function solicitarNavegacaoSeguraLoja",
  "function salvarEdicaoVisualAtualLoja",
  "function alinharSelecaoLojaVisual",
  '"#app-content"',
  "renderizarPreservandoScroll();",
  "requestAnimationFrame(() => requestAnimationFrame(alinharSelecaoLojaVisual))",
  "window.setTimeout(alinharSelecaoLojaVisual, 180)",
  "focus?.({ preventScroll: true })",
  "if (changed) storefrontFlushAutosaveNow();",
  "let storefrontDirtyRuntime = false",
  "function ocultarExemploLojaVisual",
  "function restaurarExemplosLojaVisual",
  "productTemplateSourceId",
  "Item de exemplo.</strong> Edite os dados e salve",
  "Sua loja está",
  "Compartilhar loja",
  "Restaurar exemplos",
  "Peça técnica flexível",
  "Maquete arquitetônica"
].forEach((marker) => assert(app.includes(marker), `Editor visual simples incompleto: ${marker}`));

[
  ".store-guided-selected",
  'content:"Editando agora"',
  "padding-bottom:clamp(220px, 45vh, 480px)",
  "overflow-x:clip",
  ".store-guided-product-photo",
  ".store-visual-mobile-actions",
  "grid-template-columns:clamp(320px, 26vw, 380px)",
  "grid-template-columns:repeat(4, minmax(240px, 1fr))",
  "min-height:clamp(300px, 31vw, 420px)",
  "min-height:clamp(220px, 72vw, 320px)",
  "padding:8px 8px calc(8px + var(--app-safe-bottom))"
].forEach((marker) => assert(css.includes(marker), `Contrato visual simples ausente: ${marker}`));

assert(!app.includes(">Copiar link da loja</button>"), "Toolbar visual nao deve duplicar compartilhamento com copiar link");
assert(!app.includes(">Copiar link público</button>"), "Resumo da loja nao deve duplicar compartilhar e copiar link");
assert(!app.includes(">Abrir configurações detalhadas</button>"), "Editor simples nao deve empurrar usuario para formulario antigo");
assert(app.includes("if (!options.ignoreDirty && getStorefrontPublicMode().admin && getStorefrontDirtyState().dirty)"), "Navegacao interna deve proteger alteracoes nao salvas");
assert(app.includes("category_id: templateSourceId ? null"), "Produto criado a partir de exemplo nao pode persistir categoria demonstrativa");
assert(app.includes("!storefrontIsDemoProduct(product) && product.slug === slug"), "Produto de exemplo nao pode causar falso conflito na criacao real");

console.log("Storefront visual simple editor: menu real, edicao guiada, exemplos, navegacao segura e mobile validados.");
