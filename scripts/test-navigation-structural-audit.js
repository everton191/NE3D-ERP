const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "..");
const app = fs.readFileSync(path.join(root, "app.js"), "utf8");
const screenRegistry = fs.readFileSync(path.join(root, "src", "navigation", "screen-registry.js"), "utf8");

let passed = 0;
let failed = 0;
const failures = [];

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

function extractScreenIds(registryBlock) {
  const matches = [...registryBlock.matchAll(/^\s{2}([A-Za-z][A-Za-z0-9]*): Object\.freeze\(/gm)];
  return matches.map((m) => m[1]);
}

function extractRenderTelaBlock(appSource) {
  const start = appSource.indexOf("function renderTela(tela) {");
  assert.notEqual(start, -1, "renderTela deve existir");
  const end = appSource.indexOf("\nfunction ", start + 1);
  return appSource.slice(start, end === -1 ? start + 8000 : end);
}

function extractRenderersMap(appSource) {
  const block = extractRenderTelaBlock(appSource);
  assert.match(block, /SimplificaScreenDispatcher\.render/, "renderTela deve delegar ao dispatcher canônico");
  const match = block.match(/renderers:\s*\{([^}]+)\}/);
  assert.ok(match, "renderTela deve expor mapa de renderers");
  return [...match[1].matchAll(/([A-Za-z][A-Za-z0-9]*)\s*:\s*([A-Za-z][A-Za-z0-9]*)/g)].map(([, key, fn]) => ({ key, fn }));
}

function extractRenderTelaCases(appSource) {
  return extractRenderersMap(appSource).map(({ key }) => key);
}

function extractQuickActionTargets(appSource) {
  const block = sectionBetween(appSource, "const QUICK_ACTIONS_CATALOG = Object.freeze([", "]);");
  const targets = [...block.matchAll(/tela:\s*"([^"]+)"/g)];
  const customs = [...block.matchAll(/customAction:\s*"([^"]+)"/g)];
  return { screens: targets.map((m) => m[1]), customs: customs.map((m) => m[1]) };
}

function extractMenuTargets(appSource) {
  const block = sectionBetween(appSource, "function getMenuGroups()", "function renderGrupoMenuLateral");
  const targets = [...block.matchAll(/tela:\s*"([^"]+)"/g)];
  return targets.map((m) => m[1]);
}

function extractBottomNavTargets(appSource) {
  const block = sectionBetween(appSource, "function getMobileBottomNavItems()", "function renderMobileBottomNav");
  const targets = [...block.matchAll(/tela:\s*"([^"]+)"/g)];
  return targets.map((m) => m[1]);
}

function extractRenderFunctions(appSource) {
  const funcDefs = [...appSource.matchAll(/function\s+(render\w+)\s*\(/g)];
  return new Set(funcDefs.map((m) => m[1]));
}

// ============================================================
// A) UI_SCREEN_RELATIONS: existência e campos obrigatórios
// ============================================================
test("A1: UI_SCREEN_RELATIONS existe e tem >= 30 entradas", () => {
  assert.ok(app.includes('const UI_SCREEN_RELATIONS = Object.freeze({'), "UI_SCREEN_RELATIONS deve existir");
  const block = sectionBetween(app, "const UI_SCREEN_RELATIONS = Object.freeze({", "const telas = Object.freeze");
  const ids = extractScreenIds(block);
  assert.ok(ids.length >= 30, `UI_SCREEN_RELATIONS deve ter >= 30 entradas (encontrou ${ids.length})`);
});

test("A2: todas as telas em UI_SCREEN_RELATIONS têm label, icon e tokenSet", () => {
  const block = sectionBetween(app, "const UI_SCREEN_RELATIONS = Object.freeze({", "const telas = Object.freeze");
  const entries = [...block.matchAll(/^\s{2}([A-Za-z][A-Za-z0-9]*): Object\.freeze\(\{([^}]+)\}\)/gm)];
  entries.forEach(([, screen, relation]) => {
    assert.match(relation, /label:\s*"/, `${screen} precisa de label`);
    assert.match(relation, /icon:\s*"/, `${screen} precisa de icon`);
    assert.match(relation, /tokenSet:\s*"/, `${screen} precisa de tokenSet`);
  });
});

// ============================================================
// B) NAVIGATION_AUDIT_REGISTRY: existência e campos obrigatórios
// ============================================================
test("B1: NAVIGATION_AUDIT_REGISTRY existe", () => {
  assert.ok(app.includes('const NAVIGATION_AUDIT_REGISTRY = Object.freeze({'), "NAVIGATION_AUDIT_REGISTRY deve existir");
});

test("B2: todas as entradas de auditoria têm category, component, status, permission", () => {
  const block = sectionBetween(app, "const NAVIGATION_AUDIT_REGISTRY = Object.freeze({", "function getUiScreenRelation");
  const entries = [...block.matchAll(/^\s{2}([A-Za-z][A-Za-z0-9]*): Object\.freeze\(\{([^}]+)\}\)/gm)];
  entries.forEach(([, screen, relation]) => {
    assert.match(relation, /category:\s*"/, `${screen} precisa de category`);
    assert.match(relation, /component:\s*"/, `${screen} precisa de component`);
    assert.match(relation, /status:\s*"/, `${screen} precisa de status`);
    assert.match(relation, /permission:\s*"/, `${screen} precisa de permission`);
  });
});

// ============================================================
// C) renderTela: case IDs existem em UI_SCREEN_RELATIONS
// ============================================================
test("C1: todos os case IDs em renderTela existem em UI_SCREEN_RELATIONS", () => {
  const screenBlock = sectionBetween(app, "const UI_SCREEN_RELATIONS = Object.freeze({", "const telas = Object.freeze");
  const registeredIds = extractScreenIds(screenBlock);
  const caseIds = extractRenderTelaCases(app);
  caseIds.forEach((id) => {
    assert.ok(registeredIds.includes(id), `case "${id}" em renderTela não está em UI_SCREEN_RELATIONS`);
  });
});

test("C2: telas públicas em UI_SCREEN_RELATIONS não precisam de case explícito em renderTela", () => {
  const screenBlock = sectionBetween(app, "const UI_SCREEN_RELATIONS = Object.freeze({", "const telas = Object.freeze");
  const registeredIds = extractScreenIds(screenBlock);
  const caseIds = extractRenderTelaCases(app);
  const publicScreens = ["onboarding", "privacy", "terms", "acessoNegado"];
  const defaultScreens = ["dashboard"];
  registeredIds.forEach((id) => {
    if (publicScreens.includes(id) || defaultScreens.includes(id)) return;
    assert.ok(caseIds.includes(id), `tela "${id}" em UI_SCREEN_RELATIONS não tem case em renderTela`);
  });
});

// ============================================================
// D) QUICK_ACTIONS_CATALOG: targets apontam para telas ou customActions válidos
// ============================================================
test("D1: todas as ações rápidas apontam para telas ou customAction válidos", () => {
  const { screens, customs } = extractQuickActionTargets(app);
  const screenBlock = sectionBetween(app, "const UI_SCREEN_RELATIONS = Object.freeze({", "const telas = Object.freeze");
  const registeredIds = extractScreenIds(screenBlock);
  screens.forEach((tela) => {
    assert.ok(registeredIds.includes(tela), `QUICK_ACTION aponta para tela "${tela}" que não existe em UI_SCREEN_RELATIONS`);
  });
  const validCustoms = ["secretaria_ia", "whatsapp", "pdf"];
  customs.forEach((c) => {
    assert.ok(validCustoms.includes(c), `QUICK_ACTION customAction "${c}" não é reconhecido`);
  });
});

// ============================================================
// E) Menu groups: targets apontam para telas válidas
// ============================================================
test("E1: todos os itens do menu apontam para telas válidas", () => {
  const targets = extractMenuTargets(app);
  const screenBlock = sectionBetween(app, "const UI_SCREEN_RELATIONS = Object.freeze({", "const telas = Object.freeze");
  const registeredIds = extractScreenIds(screenBlock);
  targets.forEach((tela) => {
    assert.ok(registeredIds.includes(tela), `menu item aponta para tela "${tela}" que não existe em UI_SCREEN_RELATIONS`);
  });
});

// ============================================================
// F) Bottom nav: targets apontam para telas válidas
// ============================================================
test("F1: todos os itens da bottom nav apontam para telas válidas", () => {
  const targets = extractBottomNavTargets(app);
  const screenBlock = sectionBetween(app, "const UI_SCREEN_RELATIONS = Object.freeze({", "const telas = Object.freeze");
  const registeredIds = extractScreenIds(screenBlock);
  targets.forEach((tela) => {
    assert.ok(registeredIds.includes(tela), `bottom nav aponta para tela "${tela}" que não existe em UI_SCREEN_RELATIONS`);
  });
});

// ============================================================
// G) renderTela tem função de render para cada case
// ============================================================
test("G1: todas as telas em renderTela têm função de render chamada", () => {
  const renderFuncs = extractRenderFunctions(app);
  extractRenderersMap(app).forEach(({ key, fn }) => {
    assert.ok(renderFuncs.has(fn), `função ${fn} do renderer "${key}" mas não definida no arquivo`);
  });
});

// ============================================================
// H) NAVIGATION_AUDIT_REGISTRY: componentes apontam para funções existentes
// ============================================================
test("H1: todos os componentes em NAVIGATION_AUDIT_REGISTRY existem como funções", () => {
  const renderFuncs = extractRenderFunctions(app);
  const block = sectionBetween(app, "const NAVIGATION_AUDIT_REGISTRY = Object.freeze({", "function getUiScreenRelation");
  const components = [...block.matchAll(/component:\s*"(render\w+)"/g)];
  components.forEach(([, fn]) => {
    assert.ok(renderFuncs.has(fn), `componente "${fn}" em NAVIGATION_AUDIT_REGISTRY mas função não definida`);
  });
});

// ============================================================
// I) UI_SCREEN_RELATIONS e NAVIGATION_AUDIT_REGISTRY consistência
// ============================================================
test("I1: telas não-públicas em UI_SCREEN_RELATIONS devem ter entrada de auditoria (exceto aliases/subtelas)", () => {
  const screenBlock = sectionBetween(app, "const UI_SCREEN_RELATIONS = Object.freeze({", "const telas = Object.freeze");
  const auditBlock = sectionBetween(app, "const NAVIGATION_AUDIT_REGISTRY = Object.freeze({", "function getUiScreenRelation");
  const screenIds = extractScreenIds(screenBlock);
  const auditIds = extractScreenIds(auditBlock);
  const skipAudit = ["onboarding", "privacy", "terms", "acessoNegado", "lojaPublica", "lojaAdmin",
    "preferencias", "personalizacao", "pdf", "assinatura", "minhaAssinatura", "planos", "admin"];
  screenIds.forEach((id) => {
    if (skipAudit.includes(id)) return;
    assert.ok(auditIds.includes(id), `tela "${id}" em UI_SCREEN_RELATIONS mas sem entrada em NAVIGATION_AUDIT_REGISTRY`);
  });
});

// ============================================================
// J) Home/carrossel não foram alterados
// ============================================================
test("J1: renderDashboard e QUICK_ACTIONS_CATALOG permanecem intactos", () => {
  assert.ok(app.includes("function renderDashboard"), "renderDashboard deve existir");
  assert.ok(app.includes("function renderDashboardOrganizavel"), "renderDashboardOrganizavel deve existir");
  assert.ok(app.includes("QUICK_ACTIONS_CATALOG"), "QUICK_ACTIONS_CATALOG deve permanecer");
  const block = sectionBetween(app, "const QUICK_ACTIONS_CATALOG = Object.freeze([", "]);");
  assert.ok(block.includes('novo_pedido'), "QUICK_ACTIONS_CATALOG deve manter novo_pedido");
  assert.ok(block.includes('secretaria_ia'), "QUICK_ACTIONS_CATALOG deve manter secretaria_ia");
  assert.ok(block.includes('calculadora'), "QUICK_ACTIONS_CATALOG deve manter calculadora");
});

// ============================================================
// K) rotasMigradas em renderTelaComUiV3 são consistentes
// ============================================================
test("K1: rotasMigradas apontam para telas com case em renderTela", () => {
  const caseIds = extractRenderTelaCases(app);
  const migrated = ["mais", "conta", "administracao", "promocoes", "pedido", "producao", "estoque", "pedidos", "clientes", "caixa", "relatorios",
    "backup", "config", "empresa", "preferencias", "personalizacao", "pdf", "seguranca", "usuarios", "sobre", "superadmin"];
  migrated.forEach((id) => {
    assert.ok(caseIds.includes(id), `rota migrada "${id}" não tem case em renderTela`);
  });
});

// ============================================================
// L) FEATURE_ACCESS_REGISTRY: telas com feature keys existem
// ============================================================
test("L1: FEATURE_ACCESS_REGISTRY referencia telas que existem em UI_SCREEN_RELATIONS", () => {
  const screenBlock = sectionBetween(app, "const UI_SCREEN_RELATIONS = Object.freeze({", "const telas = Object.freeze");
  const registeredIds = extractScreenIds(screenBlock);
  const featureBlock = sectionBetween(app, "const FEATURE_ACCESS_REGISTRY = Object.freeze({", "]);");
  const screenRefs = [...featureBlock.matchAll(/screens:\s*\[([^\]]+)\]/g)];
  screenRefs.forEach(([, list]) => {
    const screens = [...list.matchAll(/"([^"]+)"/g)].map((m) => m[1]);
    screens.forEach((s) => {
      assert.ok(registeredIds.includes(s), `FEATURE_ACCESS_REGISTRY referencia tela "${s}" que não existe em UI_SCREEN_RELATIONS`);
    });
  });
});

// ============================================================
// M) canAccessScreen é chamado antes de renderTela
// ============================================================
test("M1: renderTela verifica permissão via canAccessScreen", () => {
  assert.ok(
    app.includes("SimplificaScreenDispatcher.render(tela, { canAccessScreen, renderAcessoNegado"),
    "renderTela deve passar canAccessScreen ao dispatcher"
  );
  const dispatcher = fs.readFileSync(path.join(root, "src", "navigation", "screen-dispatcher.js"), "utf8");
  assert.match(dispatcher, /context\.canAccessScreen/, "dispatcher deve verificar permissão");
  assert.match(dispatcher, /context\.renderAcessoNegado/, "dispatcher deve renderizar acesso negado");
});

// ============================================================
// N) ScreenRegistry externo lista telas principais
// ============================================================
test("N1: screen-registry.js lista as 10 telas principais", () => {
  const expected = ["dashboard", "pedidos", "producao", "caixa", "estoque", "clientes", "calculadora", "impressoras", "relatorios", "config"];
  expected.forEach((id) => {
    assert.ok(screenRegistry.includes(`"${id}"`), `tela principal "${id}" não está no ScreenRegistry externo`);
  });
});

// ============================================================
// O) actionId duplicados em QUICK_ACTIONS_CATALOG
// ============================================================
test("O1: não há actionIds duplicados em QUICK_ACTIONS_CATALOG", () => {
  const block = sectionBetween(app, "const QUICK_ACTIONS_CATALOG = Object.freeze([", "]);");
  const ids = [...block.matchAll(/id:\s*"([^"]+)"/g)].map((m) => m[1]);
  const unique = new Set(ids);
  assert.equal(ids.length, unique.size, `actionIds duplicados encontrados: ${ids.filter((id, i) => ids.indexOf(id) !== i).join(", ")}`);
});

// ============================================================
// P) lojaPublica está em UI_SCREEN_RELATIONS
// ============================================================
test("P1: lojaPublica está registrado em UI_SCREEN_RELATIONS", () => {
  const screenBlock = sectionBetween(app, "const UI_SCREEN_RELATIONS = Object.freeze({", "const telas = Object.freeze");
  const ids = extractScreenIds(screenBlock);
  assert.ok(ids.includes("lojaPublica"), "lojaPublica deve estar em UI_SCREEN_RELATIONS");
});

// ============================================================
// Q) producao está em NAVIGATION_AUDIT_REGISTRY
// ============================================================
test("Q1: producao está registrado em NAVIGATION_AUDIT_REGISTRY", () => {
  const auditBlock = sectionBetween(app, "const NAVIGATION_AUDIT_REGISTRY = Object.freeze({", "function getUiScreenRelation");
  const ids = extractScreenIds(auditBlock);
  assert.ok(ids.includes("producao"), "producao deve estar em NAVIGATION_AUDIT_REGISTRY");
});

// ============================================================
// R) Aliases: todo alias aponta para screenId existente
// ============================================================
test("R1: aliases em renderTela apontam para screenIds com case válido", () => {
  const byFn = new Map();
  for (const { key, fn } of extractRenderersMap(app)) {
    if (!byFn.has(fn)) byFn.set(fn, []);
    byFn.get(fn).push(key);
  }
  const screenBlock = sectionBetween(app, "const UI_SCREEN_RELATIONS = Object.freeze({", "const telas = Object.freeze");
  const registeredIds = extractScreenIds(screenBlock);
  for (const keys of byFn.values()) {
    if (keys.length < 2) continue;
    keys.forEach((alias) => {
      assert.ok(registeredIds.includes(alias), `alias "${alias}" não existe em UI_SCREEN_RELATIONS`);
    });
  }
});

test("R2: não há aliases que formam loops", () => {
  const byFn = new Map();
  for (const { key, fn } of extractRenderersMap(app)) {
    if (!byFn.has(fn)) byFn.set(fn, []);
    byFn.get(fn).push(key);
  }
  for (const keys of byFn.values()) {
    assert.equal(new Set(keys).size, keys.length, `aliases duplicados para o mesmo renderer: ${keys.join(", ")}`);
  }
});

test("R3: todas as telas em NAVIGATION_AUDIT_REGISTRY têm componentes que existem", () => {
  const renderFuncs = extractRenderFunctions(app);
  const auditBlock = sectionBetween(app, "const NAVIGATION_AUDIT_REGISTRY = Object.freeze({", "function getUiScreenRelation");
  const components = [...auditBlock.matchAll(/component:\s*"(render\w+)"/g)];
  components.forEach(([, fn]) => {
    assert.ok(renderFuncs.has(fn), `componente "${fn}" em NAVIGATION_AUDIT_REGISTRY mas função não definida`);
  });
});

// ============================================================
// RESUMO
// ============================================================
console.log(`\n${"=".repeat(60)}`);
console.log(`ESTRUCTURAL NAVIGATION AUDIT — ${passed} PASS / ${failed} FAIL`);
console.log(`${"=".repeat(60)}`);
if (failures.length) {
  console.log("\nFALHAS:");
  failures.forEach(({ label, error }) => console.log(`  FAIL: ${label}\n         ${error}`));
  process.exit(1);
} else {
  console.log("Todos os testes estruturais de navegação passaram.");
}
