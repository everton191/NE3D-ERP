const fs = require("fs");

const app = fs.readFileSync("app.js", "utf8");
const css = fs.readFileSync("style.css", "utf8");

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

[
  "function renderStorefrontImageFallbackMarkup",
  "function renderStorefrontResponsiveImage",
  "function handleStorefrontImageError",
  'data-store-image-fallback',
  "renderStorefrontResponsiveImage(previewImage, { alt: product.title || \"Produto\""
].forEach((marker) => assert(app.includes(marker), `Fallback de imagem ausente em app.js: ${marker}`));

[
  ".store-image-fallback",
  ".store-image-fallback i",
  ".store-image-fallback span"
].forEach((marker) => assert(css.includes(marker), `Fallback de imagem ausente em style.css: ${marker}`));

console.log("Storefront V3 image fallbacks: helper unico e preview compacto do editor validados.");
