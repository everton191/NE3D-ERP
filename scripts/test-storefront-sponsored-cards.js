const fs = require("fs");

const app = fs.readFileSync("app.js", "utf8");
const renderer = fs.readFileSync("src/storefront/renderers/publicV3.js", "utf8");
const service = fs.readFileSync("src/services/adSenseService.js", "utf8");
const layouts = fs.readFileSync("src/storefront/styles/layouts.css", "utf8");
const futureSlots = fs.readFileSync("src/storefront/shared/ad-slots.ts", "utf8");
const assert = (condition, message) => { if (!condition) throw new Error(message); };

assert(renderer.includes("api.sponsoredCard"), "Card patrocinado ausente no renderer público");
assert(renderer.includes('data-store-ad-slot="product-grid"'), "Slot patrocinado não está identificado");
assert(renderer.includes("(index + 1) % 6 === 0"), "Anúncio deve entrar somente após cada 6 produtos");
assert(renderer.includes("adCount < 3"), "Grade pública deve limitar anúncios por página");
assert(renderer.includes("if (modeOf(vm).admin)"), "Editor/admin não deve receber anúncio na grade");
assert(service.includes("syncStorefrontCards"), "Serviço AdSense não sincroniza cards da loja");
assert(service.includes("MAX_STOREFRONT_SLOTS = 3"), "Serviço deve impor limite modesto de anúncios");
assert(service.includes('data-ad-format="auto"'), "Modelo responsivo configurado não foi preservado");
assert(service.includes("hideStorefrontSlots"), "Falhas do AdSense devem remover espaços vazios");
assert(app.includes("sincronizarAnunciosLojaPublica();"), "Render principal não sincroniza anúncios da loja");
assert(layouts.includes(".sfv3-sponsored-card__body"), "Card patrocinado não possui layout próprio");
assert(layouts.includes("max-height:280px"), "Card patrocinado não possui limite visual modesto");
assert(futureSlots.includes("StoreAdSlot"), "Base futura de slots foi removida indevidamente");

console.log("Storefront sponsored cards: intervalo, limite, isolamento e fallback validados.");
