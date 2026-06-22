const fs = require("fs");

const css = fs.readFileSync("style.css", "utf8");
const app = fs.readFileSync("app.js", "utf8");

const checks = [
  "100dvh",
  "100svh",
  "env(safe-area-inset-bottom)",
  "-webkit-overflow-scrolling:touch",
  "touch-action:pan-y",
  "touch-action:auto",
  ".store-mobile-admin-actions",
  ".store-public-menu-toggle",
  ".store-public-header.mobile-open"
];

const missing = checks.filter((needle) => !css.includes(needle));
if (missing.length) {
  throw new Error(`Estabilidade visual mobile incompleta: ${missing.join(", ")}`);
}

if (/protegendoToque\s*=\s*toqueNaBorda/.test(app) || /protegendoToque\s*=.*isAndroidNativeApp/.test(app)) {
  throw new Error("Protecao de gestos nao pode bloquear o gesto de voltar nas bordas do Android.");
}
if (!app.includes("protegendoToque = !toqueNaBorda")) {
  throw new Error("Gesto lateral Android deve permanecer livre nas bordas.");
}
if (!app.includes("iniciarToqueLongoPedido(event")) {
  throw new Error("Lista de pedidos deve iniciar toque longo na propria linha.");
}
if (!app.includes("abrirMaisOpcoesPedido(Number(id))")) {
  throw new Error("Toque longo deve reutilizar o menu de acoes do pedido.");
}
if (!app.includes("Math.hypot(dx, dy) > 8")) {
  throw new Error("Rolagem deve cancelar o toque longo do pedido.");
}
if (!app.includes("toquePedidoSuprimidoAte = Date.now() + 700")) {
  throw new Error("Rolagem deve suprimir o clique residual que abriria o pedido.");
}
if (app.includes('class="icon-action-button smart-order-open"')) {
  throw new Error("Lista nao deve manter botao duplicado para abrir pedido.");
}
if (app.includes('class="smart-order-icon"')) {
  throw new Error("Lista de pedidos nao deve reservar bloco visual para foto ou icone.");
}
const inicioPedidosRecentes = app.indexOf("function renderPedidosRecentesDashboard");
const fimPedidosRecentes = app.indexOf("function renderMiniSparklineDashboard", inicioPedidosRecentes);
const pedidosRecentes = app.slice(inicioPedidosRecentes, fimPedidosRecentes);
if (pedidosRecentes.includes("dashboard-order-avatar") || pedidosRecentes.includes("dashboard-order-arrow")) {
  throw new Error("Pedidos recentes nao devem exibir avatar ou seta decorativa.");
}
if (!pedidosRecentes.includes("iniciarToqueLongoPedido(event")) {
  throw new Error("Pedidos recentes devem reutilizar toque longo seguro.");
}
if (app.includes('class="item-cube-icon"')) {
  throw new Error("Detalhe do pedido nao deve reservar quadrado decorativo para foto do item.");
}

console.log("Mobile visual stability: viewport, safe-area, touch e menu mobile verificados.");
