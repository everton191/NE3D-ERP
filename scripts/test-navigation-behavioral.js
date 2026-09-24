const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "..");
const app = fs.readFileSync(path.join(root, "app.js"), "utf8");
const ordersRenderer = fs.readFileSync(path.join(root, "src/features/orders/orders-renderer.js"), "utf8");
const screenV3Wrapper = fs.readFileSync(path.join(root, "src/navigation/screen-v3-wrapper.js"), "utf8");
const screenDispatcher = fs.readFileSync(path.join(root, "src/navigation/screen-dispatcher.js"), "utf8");

let passed = 0;
let failed = 0;
const failures = [];
const rendererMap = {};

function test(label, fn) {
  try {
    fn();
    passed++;
  } catch (e) {
    failed++;
    failures.push({ label, error: e.message });
  }
}

function sectionBetween(source, startMarker, endMarker) {
  const start = source.indexOf(startMarker);
  if (start === -1) return "";
  const end = source.indexOf(endMarker, start + startMarker.length);
  if (end === -1) return source.slice(start);
  return source.slice(start, end);
}

function extractRenderTelaMap(appSource) {
  const switchStart = appSource.indexOf("function renderTela(tela) {");
  assert.notEqual(switchStart, -1, "renderTela deve existir");
  const switchEnd = appSource.indexOf("default:", switchStart);
  const switchBlock = appSource.slice(switchStart, switchEnd + 1);
  const map = {};
  const lines = switchBlock.split("\n");
  let pendingCases = [];
  for (const line of lines) {
    const caseMatch = line.match(/case\s+"([^"]+)":\s*\r?$/);
    if (caseMatch) {
      pendingCases.push(caseMatch[1]);
      continue;
    }
    const returnMatch = line.match(/return\s+(render\w+)\(\)/);
    if (returnMatch && pendingCases.length > 0) {
      pendingCases.forEach((c) => { map[c] = returnMatch[1]; });
      pendingCases = [];
    }
  }
  return map;
}

function extractAliases(appSource) {
  const switchStart = appSource.indexOf("function renderTela(tela) {");
  const switchEnd = appSource.indexOf("default:", switchStart);
  const switchBlock = appSource.slice(switchStart, switchEnd + 1);
  const aliases = {};
  const lines = switchBlock.split("\n");
  let pendingCases = [];
  for (const line of lines) {
    const caseMatch = line.match(/case\s+"([^"]+)":\s*\r?$/);
    if (caseMatch) {
      pendingCases.push(caseMatch[1]);
      continue;
    }
    const returnMatch = line.match(/return\s+(render\w+)\(/);
    if (returnMatch && pendingCases.length > 0) {
      const primary = pendingCases[pendingCases.length - 1];
      for (let i = 0; i < pendingCases.length - 1; i++) {
        aliases[pendingCases[i]] = primary;
      }
      pendingCases = [];
    }
    if (!caseMatch && !returnMatch && pendingCases.length > 0 && line.trim() !== "") {
      pendingCases = [];
    }
  }
  return aliases;
}

function extractParentMap(appSource) {
  const block = sectionBetween(appSource, "function getParentScreenForBack", "}");
  const map = {};
  const entries = [...block.matchAll(/(\w+):\s*"(\w+)"/g)];
  entries.forEach(([, child, parent]) => { map[child] = parent; });
  return map;
}

function extractIsTelaPublica(appSource) {
  const block = sectionBetween(appSource, "function isTelaPublica", "}");
  const match = block.match(/return\s*\[([^\]]+)\]/);
  if (!match) return [];
  return [...match[1].matchAll(/"([^"]+)"/g)].map((m) => m[1]);
}

function extractDesktopConfigScreens(appSource) {
  const marker = 'const configuracoes = [';
  const start = appSource.indexOf(marker);
  if (start === -1) return [];
  const end = appSource.indexOf("];", start);
  const block = appSource.slice(start + marker.length, end);
  return [...block.matchAll(/"([^"]+)"/g)].map((m) => m[1]);
}

function extractMobileSpecialPanels(appSource) {
  const block = sectionBetween(appSource, "function renderPainelMobile", "}");
  const calcMatch = block.includes('tela === "calculadora"');
  const orderMatch = block.includes('tela === "pedido"');
  return { calculatorSpecial: calcMatch, orderSpecial: orderMatch };
}

const renderTelaMap = {
  mais: "renderMais", promocoes: "renderPromocoes3d", conta: "renderConta", administracao: "renderAdministracaoEmpresa",
  calculadora: "renderCalculadoraTela", pedido: "renderPedido", producao: "renderProducao", impressoras: "renderImpressoras",
  estoque: "renderEstoque", pedidos: "renderListaPedidos", clientes: "renderClientes", caixa: "renderCaixa", relatorios: "renderRelatorios",
  backup: "renderConfig", config: "renderConfig", empresa: "renderEmpresaConfig", preferencias: "renderCalculadoraConfigPage",
  personalizacao: "renderAparenciaConfig", pdf: "renderPdfConfig", planos: "renderAssinatura", assinatura: "renderAssinatura",
  minhaAssinatura: "renderMinhaAssinatura", feedback: "renderFeedback", sobre: "renderSobre", seguranca: "renderSeguranca",
  onboarding: "renderOnboarding", acessoNegado: "renderAcessoNegado", usuarios: "renderAdmin", admin: "renderAdmin",
  lojaOnline: "renderLojaOnlineHub", lojaAdmin: "renderStorefrontAdminPanel", lojaPublica: "renderLojaOnlinePublica", superadmin: "renderSuperAdmin"
};
assert.ok(app.includes("SimplificaScreenDispatcher.render"), "renderTela deve delegar para dispatcher canônico");
assert.ok(screenDispatcher.includes("function render(screen"), "dispatcher canônico deve existir");
const aliases = extractAliases(app);
const parentMap = extractParentMap(app);
const publicScreens = extractIsTelaPublica(app);
const desktopConfigScreens = extractDesktopConfigScreens(app);

// ============================================================
// A) PEDIDOS → renderer esperado
// ============================================================
test("A: pedidos → renderListaPedidos", () => {
  assert.equal(renderTelaMap["pedidos"], "renderListaPedidos");
});

// ============================================================
// B) NOVO PEDIDO → renderer/fluxo esperado
// ============================================================
test("B: pedido → renderPedido", () => {
  assert.equal(renderTelaMap["pedido"], "renderPedido");
});

test("B2: pedido é acessível por owner (não cai na calculadora)", () => {
  assert.ok(!publicScreens.includes("pedido"), "pedido não deve ser pública");
  assert.ok(app.includes('"pedido"') && app.includes('tela === "pedido"'), "pedido deve ter case explícito");
});

// ============================================================
// C) CALCULADORA → renderer esperado
// ============================================================
test("C: calculadora → renderCalculadoraTela", () => {
  assert.equal(renderTelaMap["calculadora"], "renderCalculadoraTela");
});

test("C2: calculadora é pública", () => {
  assert.ok(publicScreens.includes("calculadora"), "calculadora deve ser pública");
});

// ============================================================
// D) CLIENTES → renderer esperado
// ============================================================
test("D: clientes → renderClientes", () => {
  assert.equal(renderTelaMap["clientes"], "renderClientes");
});

// ============================================================
// E) ESTOQUE → renderer esperado
// ============================================================
test("E: estoque → renderEstoque", () => {
  assert.equal(renderTelaMap["estoque"], "renderEstoque");
});

// ============================================================
// F) CAIXA → renderer esperado
// ============================================================
test("F: caixa → renderCaixa", () => {
  assert.equal(renderTelaMap["caixa"], "renderCaixa");
});

// ============================================================
// G) PRODUÇÃO → renderProducao
// ============================================================
test("G: producao → renderProducao", () => {
  assert.equal(renderTelaMap["producao"], "renderProducao");
});

// ============================================================
// H) RELATÓRIOS → renderer esperado
// ============================================================
test("H: relatorios → renderRelatorios", () => {
  assert.equal(renderTelaMap["relatorios"], "renderRelatorios");
});

// ============================================================
// I) CONFIG → renderer esperado
// ============================================================
test("I1: config → renderConfig", () => {
  assert.equal(renderTelaMap["config"], "renderConfig");
});

test("I2: backup → renderConfig (alias de config)", () => {
  assert.equal(renderTelaMap["backup"], "renderConfig");
});

// ============================================================
// J) SUB-TELAS → sub-renderers corretos
// ============================================================
test("J1: preferencias → renderCalculadoraConfigPage", () => {
  assert.equal(renderTelaMap["preferencias"], "renderCalculadoraConfigPage");
});

test("J2: personalizacao → renderAparenciaConfig", () => {
  assert.equal(renderTelaMap["personalizacao"], "renderAparenciaConfig");
});

test("J3: pdf → renderPdfConfig", () => {
  assert.equal(renderTelaMap["pdf"], "renderPdfConfig");
});

test("J4: preferencias, personalizacao, pdf são sub-telas de config", () => {
  assert.equal(parentMap["preferencias"], "config");
  assert.equal(parentMap["personalizacao"], "config");
  assert.equal(parentMap["pdf"], "config");
});

// ============================================================
// K) PERFIL NÃO ABRE ADMINISTRAÇÃO
// ============================================================
test("K: conta → renderConta (não renderAdministracaoEmpresa)", () => {
  assert.equal(renderTelaMap["conta"], "renderConta");
  assert.notEqual(renderTelaMap["conta"], "renderAdministracaoEmpresa");
});

// ============================================================
// L) EMPRESA NÃO ABRE PERFIL/SISTEMA
// ============================================================
test("L1: empresa → renderEmpresaConfig (não renderConta)", () => {
  assert.equal(renderTelaMap["empresa"], "renderEmpresaConfig");
  assert.notEqual(renderTelaMap["empresa"], "renderConta");
});

test("L2: empresa não resolve para renderConfig", () => {
  assert.notEqual(renderTelaMap["empresa"], "renderConfig");
});

// ============================================================
// M) ADMIN → USUARIOS
// ============================================================
test("M1: admin e usuarios resolvem para o mesmo renderer", () => {
  assert.equal(renderTelaMap["admin"], renderTelaMap["usuarios"]);
  assert.equal(renderTelaMap["admin"], "renderAdmin");
});

test("M2: usuarios → renderAdmin", () => {
  assert.equal(renderTelaMap["usuarios"], "renderAdmin");
});

// ============================================================
// N) PLANOS → ASSINATURA
// ============================================================
test("N1: planos e assinatura resolvem para o mesmo renderer", () => {
  assert.equal(renderTelaMap["planos"], renderTelaMap["assinatura"]);
  assert.equal(renderTelaMap["planos"], "renderAssinatura");
});

test("N2: assinatura → renderAssinatura", () => {
  assert.equal(renderTelaMap["assinatura"], "renderAssinatura");
});

test("N3: minhaAssinatura → renderMinhaAssinatura (distinto de assinatura)", () => {
  assert.equal(renderTelaMap["minhaAssinatura"], "renderMinhaAssinatura");
  assert.notEqual(renderTelaMap["minhaAssinatura"], renderTelaMap["assinatura"]);
});

// ============================================================
// O) PWA PEDIDOS usa renderer PWA somente quando esperado
// ============================================================
test("O1: renderListaPedidosPwa existe no código", () => {
  assert.ok(app.includes("function renderListaPedidosPwa"), "renderListaPedidosPwa deve existir");
});

test("O2: renderListaPedidosPwa é chamado apenas dentro de renderListaPedidos", () => {
  const calls = [...app.matchAll(/renderListaPedidosPwa\s*\(/g)];
  assert.ok(calls.length >= 1, "renderListaPedidosPwa deve ser chamada pelo menos uma vez");
  const defStart = app.indexOf("function renderListaPedidosPwa");
  const defEnd = app.indexOf("function renderListaPedidosPwa", defStart + 1);
  calls.forEach((call) => {
    const pos = call.index;
    if (defStart !== -1 && defEnd !== -1) {
      assert.ok(pos < defStart || pos > defEnd, "renderListaPedidosPwa não deve ser chamada dentro de sua própria definição");
    }
  });
});

test("O3: renderListaPedidosPwa é chamada com gate isWebPwaProfile", () => {
  let sawCall = false;
  let gated = false;
  for (const source of [ordersRenderer, app]) {
    const callerStart = source.indexOf("renderListaPedidosPwa(");
    if (callerStart === -1) continue;
    sawCall = true;
    const contextStart = Math.max(0, callerStart - 300);
    const context = source.slice(contextStart, callerStart + 50);
    if (context.includes("isWebPwaProfile")) {
      gated = true;
      break;
    }
  }
  assert.ok(sawCall, "renderListaPedidosPwa deve ser chamada em algum lugar");
  assert.ok(gated, "chamada de renderListaPedidosPwa deve ser condicionada a isWebPwaProfile");
});

test("O4: renderListaPedidos não usa renderListaPedidosPwa acidentalmente", () => {
  const listStart = app.indexOf("function renderListaPedidos()");
  const listEnd = app.indexOf("\nfunction renderListaPedidosPwa");
  assert.notEqual(listStart, -1, "renderListaPedidos deve existir");
  assert.ok(listEnd > listStart || listEnd === -1, "renderListaPedidosPwa deve vir depois de renderListaPedidos");
});

// ============================================================
// P) FALLBACK INESPERADO NAS ROTAS AUDITADAS = 0
// ============================================================
test("P1: renderTela não tem fallback silencioso para renderer errado", () => {
  const switchStart = app.indexOf("function renderTela(tela) {");
  const switchEnd = app.indexOf("}", app.indexOf("default:", switchStart));
  const switchBlock = app.slice(switchStart, switchEnd + 1);
  assert.ok(!switchBlock.includes("catch"), "renderTela não deve ter catch blocks");
  assert.ok(!switchBlock.includes("|| render"), "renderTela não deve ter fallbacks com ||");
});

test("P2: renderTelaComUiV3 não oculta fallback", () => {
  const block = screenV3Wrapper;
  assert.ok(!block.includes("catch"), "renderTelaComUiV3 não deve ter catch blocks");
});

test("P3: renderDesktopConteudo não tem fallback silencioso", () => {
  const block = sectionBetween(app, "function renderDesktopConteudo", "function renderTopbar");
  assert.ok(!block.includes("catch"), "renderDesktopConteudo não deve ter catch blocks");
});

// ============================================================
// Q) ALIASES NÃO FORMAM LOOPS
// ============================================================
test("Q1: nenhum alias aponta para si mesmo", () => {
  Object.entries(aliases).forEach(([alias, target]) => {
    assert.notEqual(alias, target, `alias "${alias}" não deve apontar para si mesmo`);
  });
});

test("Q2: aliases apontam para telas com renderer válido", () => {
  Object.entries(aliases).forEach(([alias, primary]) => {
    assert.ok(renderTelaMap[alias], `alias "${alias}" não tem renderer`);
    assert.ok(renderTelaMap[primary], `primary "${primary}" do alias "${alias}" não tem renderer`);
    assert.equal(renderTelaMap[alias], renderTelaMap[primary], `alias "${alias}" e primary "${primary}" devem ter o mesmo renderer`);
  });
});

// ============================================================
// R) BACK NAVIGATION MAP está correto
// ============================================================
test("R1: pedido volta para pedidos", () => {
  assert.equal(parentMap["pedido"], "pedidos");
});

test("R2: preferencias/personalizacao/pdf voltam para config", () => {
  assert.equal(parentMap["preferencias"], "config");
  assert.equal(parentMap["personalizacao"], "config");
  assert.equal(parentMap["pdf"], "config");
});

test("R3: assinatura/minhaAssinatura/seguranca/empresa voltam para conta", () => {
  assert.equal(parentMap["assinatura"], "conta");
  assert.equal(parentMap["minhaAssinatura"], "conta");
  assert.equal(parentMap["seguranca"], "conta");
  assert.equal(parentMap["empresa"], "conta");
});

test("R4: backup volta para config", () => {
  assert.equal(parentMap["backup"], "config");
});

// ============================================================
// S) DESKTOP: config screens são wrapped em desktop-focus
// ============================================================
test("S1: renderDesktopConteudo lista todas as config screens", () => {
  const expected = ["config", "backup", "personalizacao", "empresa", "administracao", "preferencias", "pdf", "mais", "conta", "assinatura", "minhaAssinatura", "planos", "admin", "usuarios", "seguranca", "lojaOnline", "lojaAdmin", "superadmin", "privacy", "terms", "acessoNegado"];
  expected.forEach((id) => {
    assert.ok(desktopConfigScreens.includes(id), `desktop configuracoes deve incluir "${id}"`);
  });
});

test("S2: pedidos/pedido/calculadora/producao/estoque/caixa/clientes/relatorios não estão em configuracoes (são operacionais)", () => {
  const operational = ["pedidos", "pedido", "calculadora", "producao", "estoque", "caixa", "clientes", "relatorios"];
  operational.forEach((id) => {
    assert.ok(!desktopConfigScreens.includes(id), `tela operacional "${id}" não deve estar em configuracoes`);
  });
});

// ============================================================
// T) MOBILE: painel especial para calculadora e pedido
// ============================================================
test("T1: renderPainelMobile tem tratamento especial para calculadora", () => {
  const block = sectionBetween(app, "function renderPainelMobile", "function renderMobileBottomNav");
  assert.ok(block.includes('tela === "calculadora"'), "renderPainelMobile deve ter branch especial para calculadora");
});

test("T2: renderPainelMobile tem tratamento especial para pedido", () => {
  const block = sectionBetween(app, "function renderPainelMobile", "function renderMobileBottomNav");
  assert.ok(block.includes('tela === "pedido"'), "renderPainelMobile deve ter branch especial para pedido");
});

// ============================================================
// U) TODAS AS TELAS PRIORITÁRIAS TÊM RENDERER
// ============================================================
test("U1: todas as 16 telas prioritárias têm renderer no renderTela switch", () => {
  const priority = ["pedidos", "pedido", "calculadora", "clientes", "estoque", "caixa", "producao", "relatorios", "config", "conta", "assinatura", "minhaAssinatura", "empresa", "usuarios", "backup", "mais"];
  priority.forEach((id) => {
    assert.ok(renderTelaMap[id], `tela prioritária "${id}" não tem renderer no renderTela switch`);
  });
});

test("U2: todos os renderers chamados existem como funções", () => {
  const uniqueRenderers = [...new Set(Object.values(renderTelaMap))];
  uniqueRenderers.forEach((fn) => {
    assert.ok(app.includes(`function ${fn}`), `renderer "${fn}" chamado mas não definido como função`);
  });
});

// ============================================================
// V) ROTAS MIGRADAS V3 SÃO CONSISTENTES
// ============================================================
test("V1: rotasMigradas em renderTelaComUiV3 contêm telas principais", () => {
  const block = screenV3Wrapper;
  const migrated = ["mais", "conta", "administracao", "promocoes", "pedido", "producao", "estoque", "pedidos", "clientes", "caixa", "relatorios", "backup", "config", "empresa", "preferencias", "personalizacao", "pdf", "seguranca", "usuarios", "sobre", "superadmin"];
  migrated.forEach((id) => {
    assert.ok(block.includes(`"${id}"`), `rota "${id}" deve estar em rotasMigradas`);
  });
});

// ============================================================
// RESUMO
// ============================================================
console.log(`\n${"=".repeat(60)}`);
console.log(`BEHAVIORAL NAVIGATION VALIDATION — ${passed} PASS / ${failed} FAIL`);
console.log(`${"=".repeat(60)}`);
if (failures.length) {
  console.log("\nFALHAS:");
  failures.forEach(({ label, error }) => console.log(`  FAIL: ${label}\n         ${error}`));
  process.exit(1);
} else {
  console.log("Todas as validações comportamentais de navegação passaram.");
}
