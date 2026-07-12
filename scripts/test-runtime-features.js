const assert = require("node:assert/strict");
const fs = require("node:fs");

const runtime = fs.readFileSync("src/config/runtimeFeatures.js", "utf8");
const app = fs.readFileSync("app.js", "utf8");
const index = fs.readFileSync("index.html", "utf8");
const prepare = fs.readFileSync("scripts/prepare-web.js", "utf8");
const storefront = fs.readFileSync("src/storefront/renderers/publicV3.js", "utf8");

assert.match(runtime, /adsEnabled:\s*false/, "Anuncios devem permanecer desativados pela chave central.");
assert.match(runtime, /stockRollsEnabled:\s*true/, "Nucleo de rolos deve estar disponivel para a regra de plano.");
assert.match(runtime, /stockRollAutoConsumptionEnabled:\s*false/, "Baixa automatica por rolo deve continuar desativada nesta fase.");
assert.match(runtime, /enterpriseWarehousesEnabled:\s*false/, "Depositos empresariais devem continuar futuros.");
assert.match(index, /src\/config\/runtimeFeatures\.js[^<]*<\/script>/, "Config de runtime deve carregar antes dos servicos de anuncio.");
assert.ok(index.indexOf("runtimeFeatures.js") < index.indexOf("adMobService.js"), "Config de runtime deve preceder o AdMob.");
assert.match(prepare, /src\/config\/runtimeFeatures\.js/, "Build web deve copiar a configuracao de runtime.");
assert.match(app, /if \(!ADS_ENABLED\) return false;/, "Regra central deve impedir exibicao de anuncios.");
assert.match(app, /async function consumirCreditoAcaoFree[\s\S]*?if \(!ADS_ENABLED\) return true;/, "Acoes nao podem ser bloqueadas pela ausencia de anuncio.");
assert.match(storefront, /adsEnabled === false/, "Loja publica nao deve montar card patrocinado com anuncios desligados.");

console.log("Runtime features: anuncios desligados e modulos futuros protegidos.");
