const assert = require("assert");
const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const app = fs.readFileSync(path.join(root, "app.js"), "utf8");
const editor = fs.readFileSync(path.join(root, "src", "storefront", "renderers", "editorV3.js"), "utf8");
const css = fs.readFileSync(path.join(root, "style.css"), "utf8");
const layouts = fs.readFileSync(path.join(root, "src", "storefront", "styles", "layouts.css"), "utf8");
const sw = fs.readFileSync(path.join(root, "sw.js"), "utf8");

[
  ["Dinossauro Flex", "product-dino.jpg"],
  ["Luminária Eiffel", "product-eiffel.jpg"],
  ["Suporte de Celular", "product-support.jpg"],
  ["Vaso Geométrico", "product-vase.jpg"],
  ["Chaveiro Personalizado", "product-keychain.jpg"],
  ["Dragão Articulado", "product-dragon.jpg"]
].forEach(([name, file]) => {
  assert(app.includes(name), `modelo demonstrativo ausente: ${name}`);
  assert(fs.existsSync(path.join(root, "assets", "storefront-v3", "examples", file)), `asset local ausente: ${file}`);
  assert(sw.includes(`./assets/storefront-v3/examples/${file}`), `asset nao precacheado: ${file}`);
});

["Organizador Modular", "Presilha Técnica Sob Medida"].forEach((name) => {
  assert(app.includes(name), `modelo demonstrativo real ausente: ${name}`);
});

assert(app.includes("const rawProducts = [...storedProducts, ...demoProducts]"), "editor deve somar modelos fotograficos sem persistir dados ficticios");
assert(app.includes("getStorefrontDemoBannerImage()"), "preview vazio deve receber banner fotografico local");
assert(app.includes('hero: "/assets/storefront-v3/examples/hero-3d-products.jpg'), "assets de exemplo devem funcionar em rotas internas da loja");
assert(app.includes("category.product_count = demoProducts.filter"), "categorias demonstrativas devem exibir a quantidade real de modelos");
assert(editor.includes("Trocar foto do modelo"), "produto demonstrativo deve oferecer troca de foto amigavel");
assert(app.includes("const fallback = adminFallback || cached || getStorefrontPublicFallback(route.slug)"), "modo admin deve priorizar preview local sobre cache publico vazio");
assert(app.includes("products: vm.products.filter((product) => !storefrontIsDemoProduct(product))"), "loja publica deve filtrar produtos demonstrativos");
assert(app.includes("categories: vm.categories.filter((category) => !category.__demo && !category.__template)"), "loja publica deve filtrar categorias demonstrativas");
assert(app.includes("Usar este exemplo como modelo"), "editor deve explicar que o exemplo cria um modelo");
assert(app.includes("function processarImagemExemploLojaOnline"), "editor deve permitir trocar foto de exemplo sem criar produto real");
assert(editor.includes("Trocar foto do modelo"), "produto demonstrativo deve oferecer troca de foto amigavel");
assert(app.includes("local_demo_override"), "foto de exemplo deve ficar marcada como substituicao local");
assert(app.includes("sort((a, b) => Number(a.order_index || 0) - Number(b.order_index || 0))"), "foto customizada do exemplo deve ter prioridade no preview");
assert(app.includes("O produto será criado como rascunho e não será publicado automaticamente."), "modelo deve permanecer rascunho invisivel");
assert(app.includes('category_id: null'), "modelo nao pode persistir categoria demonstrativa");
assert(app.includes('image_url: ""'), "modelo deve solicitar revisao da foto antes de salvar");
assert(app.includes("Sua loja começará a aparecer aqui quando os produtos forem publicados."), "editor vazio deve orientar o lojista");
assert(app.includes("Substitua os produtos de exemplo"), "cada modelo deve explicar que nao e produto real");
assert(css.includes(".store-demo-product-note"), "produto demonstrativo deve ter aviso visual isolado");
assert(layouts.includes("@keyframes sfv3-rise-in"), "vitrine demonstrativa deve usar movimento leve e progressivo");

console.log("Storefront demo products: fotos locais, preview vazio, filtro publico e CTA de modelo validados.");
