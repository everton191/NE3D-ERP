const assert = require("assert");
const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const app = fs.readFileSync(path.join(root, "app.js"), "utf8");
const css = fs.readFileSync(path.join(root, "themes", "base", "design-system-v2.css"), "utf8");
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

assert(app.includes("const rawProducts = [...storedProducts, ...demoProducts]"), "editor deve somar modelos fotograficos sem persistir dados ficticios");
assert(app.includes("getStorefrontDemoBannerImage()"), "preview vazio deve receber banner fotografico local");
assert(app.includes("const fallback = adminFallback || cached || getStorefrontPublicFallback(route.slug)"), "modo admin deve priorizar preview local sobre cache publico vazio");
assert(app.includes("products: vm.products.filter((product) => !storefrontIsDemoProduct(product))"), "loja publica deve filtrar produtos demonstrativos");
assert(app.includes("categories: vm.categories.filter((category) => !category.__demo && !category.__template)"), "loja publica deve filtrar categorias demonstrativas");
assert(app.includes("Usar este exemplo como modelo"), "editor deve explicar que o exemplo cria um modelo");
assert(app.includes("function processarImagemExemploLojaOnline"), "editor deve permitir trocar foto de exemplo sem criar produto real");
assert(app.includes("Trocar foto do exemplo"), "produto demonstrativo deve oferecer troca de foto amigavel");
assert(app.includes("local_demo_override"), "foto de exemplo deve ficar marcada como substituicao local");
assert(app.includes("sort((a, b) => Number(a.order_index || 0) - Number(b.order_index || 0))"), "foto customizada do exemplo deve ter prioridade no preview");
assert(app.includes("O produto será criado como rascunho e não será publicado automaticamente."), "modelo deve permanecer rascunho invisivel");
assert(app.includes('category_id: null'), "modelo nao pode persistir categoria demonstrativa");
assert(app.includes('image_url: ""'), "modelo deve solicitar revisao da foto antes de salvar");
assert(app.includes("Sua loja começa aqui"), "editor vazio deve orientar o lojista");
assert(app.includes("Substitua por um produto seu."), "cada modelo deve explicar que nao e produto real");
assert(css.includes(".store-demo-product-note"), "produto demonstrativo deve ter aviso visual isolado");
assert(css.includes(".store-demo-use-model"), "CTA demonstrativo deve possuir estilo isolado");

console.log("Storefront demo products: fotos locais, preview vazio, filtro publico e CTA de modelo validados.");
