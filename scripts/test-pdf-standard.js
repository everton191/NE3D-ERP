const fs = require("fs");
const app = fs.readFileSync("app.js", "utf8");

if (!/const PDF_THEME_PRESETS = Object\.freeze\(\{\s*clean_white:\s*\{[\s\S]*?\}\s*\}\);/.test(app)) {
  throw new Error("PDF deve manter somente o preset clean_white.");
}
["modern_dark:", "neon_dark:", "compact_business:", "PDF_THEME_PRESETS.modern_dark"].forEach((marker) => {
  if (app.includes(marker)) throw new Error(`Preset antigo ainda ativo: ${marker}`);
});
if ((app.match(/<option value="clean_white" selected>Novo padrão claro<\/option>/g) || []).length < 2) {
  throw new Error("Configurações de PDF não estão unificadas no novo padrão.");
}
[
  "function desenharCabecalhoComercialPdf",
  "function desenharRodapeComercialPdf",
  "function gerarPDF",
  "empresa.pixKey",
  "quoteValidityDays",
  "companyLogoDataUrl"
].forEach((marker) => { if (!app.includes(marker)) throw new Error(`Estrutura PDF ausente: ${marker}`); });

console.log("PDF standard: preset único claro e estrutura comercial validados.");
