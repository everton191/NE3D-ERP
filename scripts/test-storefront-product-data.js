const fs = require("fs");

const app = fs.readFileSync("app.js", "utf8");
const editor = fs.readFileSync("src/storefront/renderers/editorV3.js", "utf8");
const publicRenderer = fs.readFileSync("src/storefront/renderers/publicV3.js", "utf8");
const layouts = fs.readFileSync("src/storefront/styles/layouts.css", "utf8");
const migration = fs.readFileSync("supabase/migrations/20260620120000_storefront_product_short_description.sql", "utf8");

const assert = (condition, message) => {
  if (!condition) throw new Error(message);
};

[
  "short_description: product.short_description || \"\"",
  "short_description: shortDescription",
  "productShortDescription",
  "const priceMode = selectedPriceMode === \"quote\" ? \"quote\" : compare > price ? \"promo\" : \"fixed\"",
  "stock_mode: stockMode",
  "stock_quantity: stockMode === \"manual\"",
  "function selecionarImagemProdutoLojaPublica",
  "function confirmarStorefrontSalvamentoLocal"
].forEach((marker) => assert(app.includes(marker), `Contrato de produto ausente em app.js: ${marker}`));

[
  "Adicionar mais fotos",
  "Trocar foto principal",
  'multiple ? "multiple" : ""',
  'data-replace-image="false"',
  'name="productPriceMode"',
  'name="productStockMode"',
  'name="productShortDescription"'
].forEach((marker) => assert(editor.includes(marker), `Editor de produto incompleto: ${marker}`));

[
  "getStorefrontProductImages",
  "sfv3-product-gallery__thumb",
  "selecionarImagemProdutoLojaPublica(this)",
  "product.short_description",
  "product.compare_price"
].forEach((marker) => assert(publicRenderer.includes(marker), `Loja pública não exibe dados completos: ${marker}`));

[".sfe-image-gallery", ".sfv3-product-gallery__thumbs"].forEach((marker) => {
  assert(layouts.includes(marker), `Estilo de galeria ausente: ${marker}`);
});

assert(/alter table public\.store_products[\s\S]*add column if not exists short_description text/i.test(migration), "Migration idempotente de descrição curta ausente");
assert(!app.includes("Produto salvo neste aparelho. Sincronização pendente."), "Produto ainda mostra falso erro de sincronização");
assert(!app.includes("Contatos salvos neste aparelho. Sincronização pendente."), "Contatos ainda mostram falso erro de sincronização");

console.log("Storefront product data: descrições, preços, estoque, galeria e mensagens validados.");
