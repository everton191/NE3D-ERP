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
if (!app.includes("assistant-fab assistant-fab-open")) {
  throw new Error("Assistente deve manter a bolinha flutuante no mobile.");
}
if (!/body\.mobile-mode \.assistant-fab\s*\{[\s\S]*?display:inline-flex !important;[\s\S]*?position:fixed !important;/.test(css)) {
  throw new Error("Bolinha flutuante do assistente deve permanecer fixa e visivel no mobile.");
}
if (!app.includes("const PRINTER_FEATURE_ENABLED = false")) {
  throw new Error("Impressoras devem permanecer desativadas nesta fase.");
}
if (app.includes('tela: "impressoras", icone: "impressoras", texto: "Impressoras 3D"')) {
  throw new Error("Menu Mais do mobile não deve expor impressoras enquanto o recurso estiver desativado.");
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
if (!app.includes("<span>Sugestão</span>") || app.includes("<span>Sugestão discreta</span>")) {
  throw new Error("Card inteligente da Home deve usar apenas o rotulo Sugestão.");
}
if (!css.includes(".dashboard-search.search-compact .search-ai-button") ||
    !css.includes("body.theme-light .cash-top-search input")) {
  throw new Error("Pesquisas devem manter um unico fundo, sem botao ou campo interno duplicado.");
}
if (!css.includes("height: 60px !important") ||
    !css.includes("body.mobile-mode .dashboard-mobile-advanced-panel")) {
  throw new Error("Cards da operacao avancada devem manter densidade compacta no mobile.");
}
if (!/body\.mobile-mode \.mobile-bottom-nav\s*\{[\s\S]*?display:\s*grid !important;[\s\S]*?z-index:\s*80 !important;/.test(css)) {
  throw new Error("Navegacao inferior deve permanecer visivel, fixa e acima do conteudo mobile.");
}
const inicioProducao = app.indexOf("function renderProducao()");
const fimProducao = app.indexOf("function renderClientes()", inicioProducao);
const producao = app.slice(inicioProducao, fimProducao);
if (producao.includes("trocarTela('impressoras')") ||
    producao.includes("getImpressorasAtivas()") ||
    !app.includes("As impressoras são controladas manualmente.")) {
  throw new Error("Producao deve permitir apenas impressoras manuais, sem reativar monitoramento automatico.");
}
if (!app.includes(`{ action: "trocarTela('lojaOnline')", icon: "lojaOnline", title: "Loja online"`) ||
    !app.includes(`{ action: "trocarTela('config')", icon: "backup", title: "Backup da empresa"`) ||
    !app.includes(`{ action: "trocarTela('relatorios')", icon: "relatorios", title: "Logs e relatórios"`)) {
  throw new Error("Administracao deve abrir diretamente os modulos funcionais existentes.");
}

console.log("Mobile visual stability: viewport, safe-area, touch e menu mobile verificados.");
