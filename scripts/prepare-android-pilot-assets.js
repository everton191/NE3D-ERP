const fs = require("node:fs");
const path = require("node:path");

const asset = path.resolve(__dirname, "..", "android", "app", "src", "main", "assets", "public", "app.js");
if (!fs.existsSync(asset)) throw new Error(`Asset Android nao encontrado: ${asset}`);
const original = fs.readFileSync(asset, "utf8");
const prepared = original
  .replace('const APP_VERSION = "1.0.28";', 'const APP_VERSION = "0.9.0-pilot";')
  .replace("const APP_VERSION_CODE = 29;", "const APP_VERSION_CODE = 10;");
if (prepared === original || !prepared.includes('const APP_VERSION = "0.9.0-pilot";') || !prepared.includes("const APP_VERSION_CODE = 10;")) {
  throw new Error("Marcadores de versao do piloto nao foram aplicados.");
}
fs.writeFileSync(asset, prepared);
console.log("Assets Android identificados como piloto 0.9.0-pilot (10).");
