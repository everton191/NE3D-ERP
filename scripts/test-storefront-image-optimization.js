const fs = require("fs");

const app = fs.readFileSync("app.js", "utf8");

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

[
  "function getStorefrontImagePreset",
  "function carregarImagemStorefrontArquivo",
  "function carregarImagemStorefrontArquivoHtml",
  "async function otimizarArquivoStorefrontImagem",
  "storefrontImageOutputMime",
  "storefrontCanvasToBlob",
  "imageOrientation: \"from-image\"",
  "Math.min(1, preset.maxSide / Math.max(loaded.width, loaded.height))",
  "optimized.__storefrontImageMeta",
  "if (file?.__storefrontImageMeta) return Promise.resolve(file);"
].forEach((marker) => assert(app.includes(marker), `Pipeline de imagem da loja incompleto: ${marker}`));

[
  "logo: { maxSide: 1200",
  "banner: { maxSide: 1920",
  "produto: { maxSide: 1600",
  "categoria: { maxSide: 1600",
  "maxBytes: 1536 * 1024",
  "preserveAlpha: true"
].forEach((marker) => assert(app.includes(marker), `Preset de imagem ausente: ${marker}`));

[
  "const preparedFile = await otimizarArquivoStorefrontImagem(file, \"produto\")",
  "const preparedFile = await otimizarArquivoStorefrontImagem(file, tipo)",
  "uploadStorefrontAsset(preparedFile",
  "lerArquivoComoDataUrl(preparedFile)",
  "Imagem ajustada",
  "accept=\"image/jpeg,image/png,image/webp\""
].forEach((marker) => assert(app.includes(marker), `Uso do arquivo otimizado ausente: ${marker}`));

assert(!app.includes("Imagem muito grande. Use até 3 MB."), "Upload da loja nao deve falhar apenas pelo limite antigo de 3 MB antes de otimizar");
assert(!app.includes("Imagem muito grande. Use logo até 1 MB."), "Logo nao deve falhar pelo limite antigo de 1 MB antes de otimizar");

console.log("Storefront image optimization: validação, redimensionamento, compressão e fallback local cobertos por contrato.");
