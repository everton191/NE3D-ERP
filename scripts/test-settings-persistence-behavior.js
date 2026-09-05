const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { test } = require('node:test');
const source = fs.readFileSync(path.join(__dirname, '..', 'app.js'), 'utf8');

function section(start, end) {
  const from = source.indexOf(start);
  const to = source.indexOf(end, from);
  assert.ok(from >= 0 && to > from);
  return source.slice(from, to);
}

function harness() {
  const storage = new Map([['theme', 'light']]);
  const ctx = vm.createContext({
    appConfig: { theme: 'light', interfaceDensity: 'compact', compactMode: true,
      showBrandInHeader: true, screenFit: 'manual', uiScale: 110 },
    ERP_THEME_PREFERENCE_STORAGE_KEY: 'theme',
    localStorage: { getItem: key => storage.get(key), setItem: (key, value) => storage.set(key, value) },
    normalizarPreferenciaTemaInterface: value => value === 'auto' ? 'system' : value,
    normalizarCorTemaControlado: value => value,
    normalizarPdfTheme: () => 'clean_white', limitarCorPdf: value => value,
    resolverInterfaceModePreferida: value => value,
    aplicarPersonalizacao() {}, salvarDados() {}, registrarHistorico() {}, registrarFluxoSalvamento() {},
    registrarDiagnostico() {}, document: { getElementById: () => null },
    syncConfig: { supabaseAccessToken: 'fake-test-token', supabaseUserId: 'user-a' },
    estaOnline: () => true,
    salvarPersonalizacaoRemotaSilencioso: async () => false
  });
  vm.runInContext([
    section('function normalizarAppearanceSettings(', 'const PDF_THEME_PRESETS'),
    section('function aplicarLinhaPersonalizacaoRemota(', 'async function sincronizarPersonalizacaoInicialSilencioso'),
    section('async function salvarPreferenciasBasicasFree(', 'async function salvarPersonalizacao()')
  ].join('\n'), ctx);
  return { ctx, storage };
}

test('default substitui compact sem perder false ou remoções explícitas', () => {
  const { ctx } = harness();
  const result = ctx.normalizarAppearanceSettings({ interface_density: 'default', compact_mode: false, logo_url: '' });
  assert.equal(result.interface_density, 'default');
  assert.equal(result.compact_mode, false);
  assert.equal(result.logo_url, '');
});

test('preferência remota substitui tema antigo do aparelho e sobrevive ao bootstrap', () => {
  const { ctx, storage } = harness();
  ctx.aplicarLinhaPersonalizacaoRemota({ settings: { theme_mode: 'dark', interface_density: 'default' } });
  assert.equal(ctx.appConfig.theme, 'dark');
  assert.equal(storage.get('theme'), 'dark');
  assert.equal(ctx.appConfig.interfaceDensity, 'default');
});

test('registro legado sem campos novos preserva escolhas existentes', () => {
  const { ctx } = harness();
  ctx.aplicarLinhaPersonalizacaoRemota({ settings: {} });
  assert.equal(ctx.appConfig.interfaceDensity, 'compact');
  assert.equal(ctx.appConfig.screenFit, 'manual');
  assert.equal(ctx.appConfig.uiScale, 110);
});

test('resposta remota atrasada preserva edição local pendente', () => {
  const { ctx, storage } = harness();
  ctx.appConfig.customizationSyncPending = true;
  assert.equal(ctx.aplicarLinhaPersonalizacaoRemota({ settings: { theme_mode: 'dark' } }), false);
  assert.equal(ctx.appConfig.theme, 'light');
  assert.equal(storage.get('theme'), 'light');
});

test('salvar formulário parcial offline preserva checkboxes e marca pendência antes da rede', async () => {
  const { ctx } = harness();
  ctx.salvarPersonalizacaoRemotaSilencioso = async () => {
    assert.equal(ctx.appConfig.customizationSyncPending, true);
    return false;
  };
  assert.equal(await ctx.salvarPreferenciasBasicasFree(), false);
  assert.equal(ctx.appConfig.compactMode, true);
  assert.equal(ctx.appConfig.showBrandInHeader, true);
  assert.equal(ctx.appConfig.customizationSyncPending, true);
});

test('resposta de outra sessão não aplica preferências após troca de usuário', async () => {
  const { ctx } = harness();
  ctx.requisicaoSupabase = async () => {
    ctx.syncConfig.supabaseUserId = 'user-b';
    return [{ settings: { theme_mode: 'dark' } }];
  };
  assert.equal(await ctx.carregarPersonalizacaoRemotaSilencioso(), false);
  assert.equal(ctx.appConfig.theme, 'light');
});
