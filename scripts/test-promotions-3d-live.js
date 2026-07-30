const assert = require("node:assert/strict");
const endpoint = require("../api/promocoes-3d.js");

async function main() {
  const offers = await endpoint.loadOffers();
  assert(offers.length > 0, "Nenhuma oferta ativa foi encontrada nas lojas oficiais.");
  assert(offers.every((offer) => offer.url.startsWith("https://")), "Toda oferta precisa usar link seguro.");
  assert(offers.every((offer) => offer.currentPrice > 0), "Toda oferta precisa ter preço válido.");
  assert(offers.every((offer) => Number.isFinite(Date.parse(offer.updatedAt))), "Toda oferta precisa informar sua última atualização.");
  assert(offers.every((offer) => ["impressoras", "filamentos", "resinas", "materiais"].includes(offer.category)), "Categoria inválida encontrada.");
  assert(offers.every((offer, index) => index === 0 || Date.parse(offers[index - 1].updatedAt) >= Date.parse(offer.updatedAt)), "Ofertas precisam estar ordenadas das mais recentes para as mais antigas.");
  console.log(`Promoções 3D ao vivo: ${offers.length} oferta(s) ativa(s) confirmada(s) em lojas oficiais.`);
}

main().catch((error) => {
  console.error(error.message || error);
  process.exit(1);
});
