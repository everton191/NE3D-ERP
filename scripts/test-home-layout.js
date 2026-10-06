"use strict";

const assert = require("assert");
const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const layoutApi = require(path.join(root, "src", "features", "home", "home-layout.js"));
const appSource = fs.readFileSync(path.join(root, "app.js"), "utf8");
const indexSource = fs.readFileSync(path.join(root, "index.html"), "utf8");
const prepareSource = fs.readFileSync(path.join(root, "scripts", "prepare-web.js"), "utf8");
const appUiSource = fs.readFileSync(path.join(root, "src", "features", "app-ui", "app-ui-renderers.js"), "utf8");

const tests = [];
function test(name, fn) { tests.push({ name, fn }); }

test("novos usuários recebem Home simples", () => {
  assert.strictEqual(layoutApi.resolve(), "simple");
  assert.strictEqual(layoutApi.normalize("desconhecido"), "simple");
});

test("os dois layouts aceitos permanecem explícitos", () => {
  assert.strictEqual(layoutApi.normalize("simple"), "simple");
  assert.strictEqual(layoutApi.normalize("carousel"), "carousel");
});

test("preferência local válida vence o fallback da configuração", () => {
  assert.strictEqual(layoutApi.resolve({ storedValue: "carousel", configValue: "simple" }), "carousel");
});

test("persistência não altera preferências existentes do carrossel", () => {
  const writes = [];
  const config = { homeCarouselPreferences: { visibleCardIds: ["orders", "cash"] } };
  layoutApi.persist("simple", { storage: { setItem: (...args) => writes.push(args) }, config });
  assert.deepStrictEqual(config.homeCarouselPreferences, { visibleCardIds: ["orders", "cash"] });
  assert.strictEqual(config.homeLayout, "simple");
  assert.deepStrictEqual(writes, [[layoutApi.STORAGE_KEY, "simple"]]);
});

test("integração carrega o módulo antes do aplicativo e inclui o build", () => {
  assert(indexSource.indexOf("/src/features/home/home-layout.js") < indexSource.indexOf("/app.js"));
  assert(prepareSource.includes('"src/features/home/home-layout.js"'));
  assert(appSource.includes('homeLayout: "simple"'));
  assert(appSource.includes('function renderHomeShell(payload)'));
});

test("Home simples preserva o cabeçalho real e não cria outro menu inferior", () => {
  assert(appSource.includes('${renderDashboardHomeHeader()}'));
  assert(appSource.includes('data-home-layout="simple"'));
  assert(!appSource.includes('home-simple-bottom-nav'));
  assert(appSource.includes('class="home-date-card"'));
});

test("Home simples usa ações, módulos e indicadores operacionais reais", () => {
  ["Novo pedido", "Calculadora", "Adicionar material", "Iniciar produção", "Novo cliente", "Nova venda"].forEach((label) => assert(appSource.includes(label)));
  ["Pedidos abertos", "Em produção", "Vendas hoje", "Estoque baixo"].forEach((label) => assert(appSource.includes(label)));
  assert(appSource.includes("getPedidoRecenteDashboard().slice(0, 4)"));
  assert(appSource.includes("canAccessScreen(item.screen)"));
});

test("Aparência oferece escolha imediata entre os dois layouts", () => {
  assert(appSource.includes('id: "aparencia-home"'));
  assert(appSource.includes('name="homeLayout" value="simple"'));
  assert(appSource.includes('name="homeLayout" value="carousel"'));
  assert(appSource.includes('onchange="alterarHomeLayout(this.value)"'));
  assert(appSource.includes('Editar e organizar cartões'));
});

test("carrossel só monta quando o layout selecionado fornece um host", () => {
  assert(appUiSource.includes('if (deps.getHomeLayout() !== "carousel") return ""'));
  assert(appUiSource.includes('const carouselHost = isDashboard ? app.querySelector("[data-home-carousel-host]") : null'));
  assert(appUiSource.includes("if (!carouselHost) deps.unmountHomeCarousel()"));
  assert(appUiSource.includes("else if (interfaceChanged) deps.mountHomeCarousel(carouselHost)"));
  assert(!appUiSource.includes('deps.mountHomeCarousel(app.querySelector("[data-home-carousel-host]"))'));
});

let passed = 0;
for (const { name, fn } of tests) {
  fn();
  passed += 1;
  console.log(`PASS ${name}`);
}
console.log(`PASS home layout: ${passed}/${tests.length}`);
