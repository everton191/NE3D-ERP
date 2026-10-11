const assert = require("assert");
const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const app = fs.readFileSync(path.join(root, "app.js"), "utf8");
const editor = fs.readFileSync(path.join(root, "src", "storefront", "renderers", "editorV3.js"), "utf8");
const css = fs.readFileSync(path.join(root, "style.css"), "utf8");
const layouts = fs.readFileSync(path.join(root, "src", "storefront", "styles", "layouts.css"), "utf8");
const sw = fs.readFileSync(path.join(root, "sw.js"), "utf8");
const adminStore = fs.readFileSync(path.join(root, "src", "features", "storefront", "storefront-admin-store.js"), "utf8");
const adminRemote = fs.readFileSync(path.join(root, "src", "features", "storefront", "storefront-admin-remote.js"), "utf8");
const editorModule = fs.readFileSync(path.join(root, "src", "features", "storefront", "storefront-editor.js"), "utf8");
const publication = fs.readFileSync(path.join(root, "src", "features", "storefront", "storefront-publication.js"), "utf8");
const publicModule = fs.readFileSync(path.join(root, "src", "features", "storefront", "storefront-public.js"), "utf8");
const productEditor = fs.readFileSync(path.join(root, "src", "features", "storefront", "storefront-product-editor.js"), "utf8");
const adminRender = fs.readFileSync(path.join(root, "src", "features", "storefront", "storefront-admin-render.js"), "utf8");
const hay = [app, adminStore, adminRemote, editorModule, publication, publicModule, productEditor, adminRender].join("\n");

[
  ["Dinossauro Flex", "product-dino.jpg"],
  ["Luminária Eiffel", "product-eiffel.jpg"],
  ["Suporte de Celular", "product-support.jpg"],
  ["Vaso Geométrico", "product-vase.jpg"],
  ["Chaveiro Personalizado", "product-keychain.jpg"],
  ["Dragão Articulado", "product-dragon.jpg"]
].forEach(([name, file]) => {
  assert(hay.includes(name), `modelo demonstrativo ausente: ${name}`);
  assert(fs.existsSync(path.join(root, "assets", "storefront-v3", "examples", file)), `asset local ausente: ${file}`);
  assert(sw.includes(`./assets/storefront-v3/examples/${file}`), `asset nao precacheado: ${file}`);
});

["Organizador Modular", "Presilha Técnica Sob Medida"].forEach((name) => {
  assert(hay.includes(name), `modelo demonstrativo real ausente: ${name}`);
});

assert(hay.includes("const rawProducts = [...storedProducts, ...demoProducts]"), "editor deve somar modelos fotograficos sem persistir dados ficticios");
assert(hay.includes("getStorefrontDemoBannerImage()"), "preview vazio deve receber banner fotografico local");
assert(hay.includes('hero: "/assets/storefront-v3/examples/hero-3d-products.jpg'), "assets de exemplo devem funcionar em rotas internas da loja");
assert(hay.includes("category.product_count = demoProducts.filter"), "categorias demonstrativas devem exibir a quantidade real de modelos");
assert(editor.includes("Trocar foto do modelo"), "produto demonstrativo deve oferecer troca de foto amigavel");
assert(hay.includes("const adminPreview = adminRequested ? getStorefrontPublicFallback(route.slug, context) : null")
  && hay.includes("getStorefrontPublicMode({ store: adminPreview.store, route, source: adminPreview.source }, context).admin")
  && hay.includes("const fallback = adminFallback || localFallback"),
"preview local deve exigir proprietário e não usar cache público");
assert(hay.includes("products: vm.products.filter((product) => !storefrontIsDemoProduct(product))"), "loja publica deve filtrar produtos demonstrativos");
assert(hay.includes("categories: vm.categories.filter((category) => !category.__demo && !category.__template)"), "loja publica deve filtrar categorias demonstrativas");
assert(hay.includes("Usar este exemplo como modelo"), "editor deve explicar que o exemplo cria um modelo");
assert(hay.includes("function processarImagemExemploLojaOnline"), "editor deve permitir trocar foto de exemplo sem criar produto real");
assert(editor.includes("Trocar foto do modelo"), "produto demonstrativo deve oferecer troca de foto amigavel");
assert(hay.includes("local_demo_override"), "foto de exemplo deve ficar marcada como substituicao local");
assert(hay.includes("sort((a, b) => Number(a.order_index || 0) - Number(b.order_index || 0))"), "foto customizada do exemplo deve ter prioridade no preview");
assert(hay.includes("O produto será criado como rascunho e não será publicado automaticamente."), "modelo deve permanecer rascunho invisivel");
assert(hay.includes('category_id: null'), "modelo nao pode persistir categoria demonstrativa");
assert(hay.includes('image_url: ""'), "modelo deve solicitar revisao da foto antes de salvar");
assert(hay.includes("Sua loja começará a aparecer aqui quando os produtos forem publicados."), "editor vazio deve orientar o lojista");
assert(hay.includes("Substitua os produtos de exemplo"), "cada modelo deve explicar que nao e produto real");
assert(css.includes(".store-demo-product-note"), "produto demonstrativo deve ter aviso visual isolado");
assert(layouts.includes("@keyframes sfv3-rise-in"), "vitrine demonstrativa deve usar movimento leve e progressivo");

console.log("Storefront demo products: fotos locais, preview vazio, filtro publico e CTA de modelo validados.");
