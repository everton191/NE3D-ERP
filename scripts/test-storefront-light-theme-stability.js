const fs = require("fs");
const app = fs.readFileSync("app.js", "utf8");
const index = fs.readFileSync("index.html", "utf8");
const manifest = fs.readFileSync("manifest.webmanifest", "utf8");
const sw = fs.readFileSync("sw.js", "utf8");
const visualCss = ["tokens.css", "components.css", "layouts.css"].map((file) => fs.readFileSync(`src/storefront/styles/${file}`, "utf8")).join("\n");
const assert = (condition, message) => { if (!condition) throw new Error(message); };

assert(app.includes('function applyStoreTheme(theme = "light"'), "Aplicacao light-only ausente");
assert(!app.includes('${["light", "system", "dark"].map'), "Editor ainda oferece tema escuro/sistema");
assert(!/linear-gradient|radial-gradient|conic-gradient/.test(visualCss), "Gradiente visual ainda existe no rebuilt");
assert(index.includes("1.0.48-rc-settings-pane-fit-20260625"), "Cache-bust rebuilt ausente");
assert(sw.includes("simplifica-3d-v190-settings-pane-fit-20260625"), "Cache PWA rebuilt ausente");
assert(manifest.includes('"background_color": "#ffffff"'), "PWA nao possui fundo claro");
assert(manifest.includes('"theme_color": "#ffffff"'), "PWA nao possui theme-color claro");
assert(!fs.existsSync("storefront-v3.css"), "Folha visual antiga ainda existe");
console.log("Storefront light theme stability: light-only, sem gradientes e com PWA versionado.");
