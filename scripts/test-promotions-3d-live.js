const assert = require("node:assert/strict");
const endpoint = require("../api/promocoes-3d.js");

async function main() {
  const offers = await endpoint.loadOffers();
  assert(offers.length > 0, "Nenhuma oferta ativa foi encontrada nas lojas oficiais.");
  assert(offers.every((offer) => offer.url.startsWith("https://")), "Toda oferta precisa usar link seguro.");
  assert(offers.every((offer) => offer.currentPrice > 0), "Toda oferta precisa ter preço válido.");
  assert(offers.every((offer) => ["impressoras", "filamentos", "resinas", "materiais"].includes(offer.category)), "Categoria inválida encontrada.");
  const stores = new Set(offers.map((offer) => offer.host));
  assert(stores.size >= 2, "A resposta não pode ser monopolizada por uma única loja.");
  console.log(`Promoções 3D ao vivo: ${offers.length} oferta(s) ativa(s) confirmada(s) em ${stores.size} lojas.`);
}

main().catch((error) => {
  console.error(error.message || error);
  process.exit(1);
});
