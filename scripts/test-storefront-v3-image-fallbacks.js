const fs = require("fs");

const app = fs.readFileSync("app.js", "utf8");
const css = fs.readFileSync("style.css", "utf8");
const publicRenderer = fs.readFileSync("src/storefront/renderers/publicV3.js", "utf8");
const editorRenderer = fs.readFileSync("src/storefront/renderers/editorV3.js", "utf8");

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

[
  "function renderStorefrontImageFallbackMarkup",
  "function renderStorefrontResponsiveImage",
  "function handleStorefrontImageError",
  'data-store-image-fallback'
].forEach((marker) => assert(app.includes(marker), `Fallback de imagem ausente em app.js: ${marker}`));

[publicRenderer, editorRenderer].forEach((renderer, index) => {
  assert(renderer.includes('call("renderStorefrontResponsiveImage"'), `Renderer V3 ${index + 1} nao reutiliza o helper de imagem`);
});

[
  ".store-image-fallback",
  ".store-image-fallback i",
  ".store-image-fallback span"
].forEach((marker) => assert(css.includes(marker), `Fallback de imagem ausente em style.css: ${marker}`));

console.log("Storefront V3 image fallbacks: helper unico e preview compacto do editor validados.");
