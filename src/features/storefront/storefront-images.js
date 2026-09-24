(function attachStorefrontImages(global) {
  "use strict";




function validarArquivoStorefrontImagem(file, tipo = "produto", context = {}) {
  const mime = String(file?.type || "").toLowerCase();
  const permitido = ["image/jpeg", "image/jpg", "image/png", "image/webp"].includes(mime);
  if (!permitido) throw new Error("Formato não permitido. Use JPG, PNG ou WebP.");
  const limites = { logo: 15 * 1024 * 1024, banner: 18 * 1024 * 1024, produto: 18 * 1024 * 1024, categoria: 18 * 1024 * 1024 };
  const limite = limites[tipo] || limites.produto;
  if (file.size > limite) throw new Error("Imagem muito grande para preparar neste aparelho. Escolha um arquivo menor.");
}

function getStorefrontImagePreset(tipo = "produto", context = {}) {
  const presets = {
    logo: { maxSide: 1200, quality: 0.86, maxBytes: 1536 * 1024, preserveAlpha: true, label: "logo" },
    banner: { maxSide: 1920, quality: 0.84, maxBytes: 1536 * 1024, preserveAlpha: false, label: "banner" },
    produto: { maxSide: 1600, quality: 0.84, maxBytes: 1536 * 1024, preserveAlpha: false, label: "produto" },
    categoria: { maxSide: 1600, quality: 0.84, maxBytes: 1536 * 1024, preserveAlpha: false, label: "categoria" }
  };
  return presets[tipo] || presets.produto;
}
  const api = Object.freeze({ validarArquivoStorefrontImagem, getStorefrontImagePreset });
  global.SimplificaStorefrontImages = api;
  if (typeof module !== "undefined" && module.exports) module.exports = api;
})(typeof window !== "undefined" ? window : globalThis);
