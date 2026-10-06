"use strict";

const assert = require("assert");
const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const searchApi = require(path.join(root, "src", "features", "home", "global-search.js"));
const appSource = fs.readFileSync(path.join(root, "app.js"), "utf8");
const indexSource = fs.readFileSync(path.join(root, "index.html"), "utf8");
const styleSource = fs.readFileSync(path.join(root, "style.css"), "utf8");
const prepareSource = fs.readFileSync(path.join(root, "scripts", "prepare-web.js"), "utf8");

const sources = {
  orders: [{ id: "42", clienteNome: "Maria Silva", status: "aberto", itens: [{ nome: "Dragão articulado" }] }],
  customers: [{ nome: "Maria Silva", phone: "85999990000", email: "maria@privado.test", cpf: "12345678900", notes: "segredo" }],
  inventory: [{ id: "fil-1", nome: "Filamento PLA Azul", codigo: "PLA-AZ", cor: "Azul", material: "PLA" }],
  products: [{ id: "prod-1", title: "Vaso Voronoi", slug: "vaso-voronoi", category: "Decoração" }],
  production: [{ id: "job-1", title: "Lote Dragão", status: "imprimindo", orderId: "42" }],
  screens: [{ route: "estoque", title: "Estoque", aliases: ["inventory", "materiais"] }],
  saasClients: [{ nome: "Cliente da plataforma Simplifica", email: "saas@plataforma.test" }]
};
const originalSources = JSON.parse(JSON.stringify(sources));
const index = searchApi.buildIndex(sources);

const tests = [];
function test(name, fn) { tests.push({ name, fn }); }

test("1. encontra cliente operacional somente pelo nome", () => {
  const results = searchApi.search(index, "Maria Silva");
  assert(results.some((item) => item.type === "cliente" && item.title === "Maria Silva"));
});

test("2. resultado de cliente não contém contato ou dado privado", () => {
  const customer = index.find((item) => item.type === "cliente");
  const serialized = JSON.stringify(customer);
  ["85999990000", "maria@privado.test", "12345678900", "segredo"].forEach((secret) => assert(!serialized.includes(secret)));
});

test("3. telefone não localiza cliente", () => {
  assert.strictEqual(searchApi.search(index, "85999990000").some((item) => item.type === "cliente"), false);
});

test("4. email não localiza cliente", () => {
  assert.strictEqual(searchApi.search(index, "maria@privado.test").some((item) => item.type === "cliente"), false);
});

test("5. cliente SaaS da plataforma é ignorado", () => {
  assert.strictEqual(searchApi.search(index, "Cliente da plataforma Simplifica").length, 0);
});

test("6. encontra pedido por número, cliente e item", () => {
  assert(searchApi.search(index, "42").some((item) => item.type === "pedido"));
  assert(searchApi.search(index, "Dragão articulado").some((item) => item.type === "pedido"));
});

test("7. encontra material do estoque", () => {
  assert(searchApi.search(index, "PLA Azul").some((item) => item.type === "estoque"));
});

test("8. encontra produto, produção e tela", () => {
  assert(searchApi.search(index, "Voronoi").some((item) => item.type === "produto"));
  assert(searchApi.search(index, "Lote Dragão").some((item) => item.type === "producao"));
  assert(searchApi.search(index, "materiais").some((item) => item.type === "tela"));
});

test("9. consulta vazia retorna lista vazia", () => {
  assert.deepStrictEqual(searchApi.search(index, "   "), []);
});

test("10. estado da busca global é dedicado e pode ser limpo", () => {
  const state = searchApi.createState();
  searchApi.updateState(state, "Maria", searchApi.search(index, "Maria"));
  assert.strictEqual(state.open, true);
  assert.strictEqual(state.query, "Maria");
  searchApi.resetState(state);
  assert.deepStrictEqual(state, { open: false, query: "", results: [] });
});

test("11. indexação e busca não alteram as coleções de origem", () => {
  assert.deepStrictEqual(sources, originalSources);
  assert(Object.isFrozen(index));
});

test("12. contrato é somente leitura e destinos são explícitos", () => {
  assert(index.length > 0 && index.every((item) => item.access === "READ"));
  assert(index.find((item) => item.type === "pedido" && item.route === "pedidos"));
  assert(index.find((item) => item.type === "cliente" && item.route === "clientes"));
  assert(index.find((item) => item.type === "estoque" && item.route === "estoque"));
});

test("13. integração web usa o módulo seguro e corrige o cabeçalho móvel", () => {
  assert(indexSource.indexOf("/src/features/home/global-search.js") < indexSource.indexOf("/app.js"));
  assert(prepareSource.includes('"src/features/home/global-search.js"'));
  assert(appSource.includes("customers: coletarClientesOperacionaisParaSync().map((cliente) => ({ nome: cliente.nome }))"));
  assert(appSource.includes("if (contexto === \"global\")"));
  assert(appSource.includes("encerrarPesquisaGlobalControlada"));
  assert(!fs.readFileSync(path.join(root, "src", "features", "home", "global-search.js"), "utf8").includes("Object.values"));
  assert(styleSource.includes(".dashboard-home-header.is-global-search-open"));
  assert(styleSource.includes("grid-template-columns:40px minmax(0,1fr)"));
  assert(styleSource.includes(".dashboard-home-header.is-global-search-open .search-autocomplete-panel"));
  assert(styleSource.includes(".dashboard-home-header.is-global-search-open .dashboard-search .search-action-button"));
  assert(appSource.includes('tabindex="-1" onpointerdown="event.preventDefault()"'));
});

let passed = 0;
tests.forEach(({ name, fn }) => {
  fn();
  passed += 1;
  console.log(`PASS ${name}`);
});
console.log(`PASS home global search: ${passed}/${tests.length}`);
