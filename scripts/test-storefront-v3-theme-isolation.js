const fs = require("fs");
const app = fs.readFileSync("app.js", "utf8");
const publicRenderer = fs.readFileSync("src/storefront/renderers/publicV3.js", "utf8");
const editorRenderer = fs.readFileSync("src/storefront/renderers/editorV3.js", "utf8");
const css = ["tokens.css", "components.css", "layouts.css"].map((file) => fs.readFileSync(`src/storefront/styles/${file}`, "utf8")).join("\n");
const assert = (condition, message) => { if (!condition) throw new Error(message); };

["function normalizarTemaLojaOnline", 'return "light";', "function getStoreThemeSaved", "data-store-theme=\"light\""].forEach((marker) => assert(app.includes(marker) || publicRenderer.includes(marker) || editorRenderer.includes(marker), `Contrato light-only ausente: ${marker}`));
assert(publicRenderer.includes("storefront-app storefront-public storefront-v3 sfv3"), "Raiz publica isolada ausente");
assert(editorRenderer.includes("storefront-editor storefront-mobile-editor sfe-shell"), "Raiz editor isolada ausente");
assert(!/\[data-store-theme=["']dark["']\]|prefers-color-scheme\s*:\s*dark/.test(css + publicRenderer + editorRenderer), "Loja/editor ainda possuem dark mode");
assert(!/linear-gradient|radial-gradient|conic-gradient/.test(css), "Camada rebuilt nao deve usar gradientes");
assert(!publicRenderer.includes("data-theme"), "Renderer publico nao pode herdar tema ERP");
assert(!editorRenderer.includes("data-theme"), "Renderer editor nao pode herdar tema ERP");
console.log("Storefront V3 theme isolation: loja e editor light-only isolados do ERP.");
