const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");

const app = fs.readFileSync("app.js", "utf8");
const migration = fs.readFileSync("supabase/migrations/20260701203000_user_preferences_interface_mode.sql", "utf8");

assert.ok(app.includes("function renderAdministracaoEmpresa()"), "administração da empresa deve ser módulo próprio");
assert.ok(app.includes("function podeAcessarAdministracaoEmpresa"), "administração deve validar cargo ou permissão");
assert.ok(app.includes("function voltarAdministracaoEmpresa()"), "administração deve ter retorno contextual próprio");
assert.ok(app.includes('if (isSuperAdmin(usuario)) return true;'), "Superadmin deve ignorar bloqueio comercial de funcionários");
assert.ok(app.includes('if (tela === "administracao") return podeAcessarAdministracaoEmpresa(usuario)'), "rota administrativa deve bloquear acesso direto");
assert.ok(app.includes("Administração da empresa"), "avatar deve oferecer administração apenas quando permitida");
assert.ok(app.includes("Modo de uso"), "perfil deve expor modo de uso");
assert.ok(app.includes("Preferências da interface"), "perfil deve agrupar preferências pessoais de interface");
assert.doesNotMatch(app, /<span><small>Modo atual<\/small>/, "menu do avatar não deve exibir modo de uso");
assert.ok(app.includes("Meu perfil"), "menu do avatar deve manter acesso pessoal");
assert.ok(app.includes("Segurança da conta"), "menu do avatar deve manter segurança pessoal");
assert.doesNotMatch(app, /<strong>\$\{renderUiIcon\("assinatura"\)\} Meu plano/, "perfil pessoal não deve conter plano da empresa");
assert.doesNotMatch(app, /<h3>Assinatura<\/h3>[\s\S]{0,300}Planos e forma de pagamento/, "perfil pessoal não deve conter assinatura");
assert.ok(app.includes("trocarTela('superadmin')"), "atalho de superadmin deve permanecer separado");

// Since d5e2d22, Appearance is intentionally enabled. Protect the current
// route/render contract, rather than requiring the former disabled flag.
function extractFunction(name) {
  const start = app.indexOf(`function ${name}(`);
  assert.notEqual(start, -1, `funcao ausente: ${name}`);
  const next = /\n(?:async )?function \w+\(/g;
  next.lastIndex = start;
  const end = next.exec(app);
  assert.ok(end, `fim da funcao ausente: ${name}`);
  return app.slice(start, end.index);
}
const flag = app.match(/^const PERSONALIZATION_SCREEN_ENABLED = (true|false);/m);
assert.ok(flag, "flag de aparência deve continuar declarada");
let user = { papel: "owner" };
let blocked = false;
let featureAllowed = true;
let renderCount = 0;
const screenSource = extractFunction("renderTela");
const sandbox = {
  window: {}, adminLogado: false, PRINTER_FEATURE_ENABLED: true,
  PERSONALIZATION_SCREEN_ENABLED: flag[1] === "true",
  FEATURE_ACCESS_STATES: { HIDDEN_BY_MODE: "hidden-by-mode" },
  getUsuarioAtual: () => user,
  isSuperAdmin: (account) => account?.papel === "superadmin",
  isModoErpSuperadminAtivo: () => false,
  getUserAccessRole: (account) => account.papel,
  licencaEfetivaBloqueada: () => blocked,
  getFeatureForScreen: () => "theme_settings",
  canAccessFeature: () => ({ allowed: featureAllowed, state: featureAllowed ? "enabled" : "blocked" }),
  canUseStorefrontLocal: () => false,
  appConfig: { theme: "light" },
  normalizarCorTemaControlado: (color) => color,
  normalizarPreferenciaTemaInterface: (theme) => theme,
  getHomeLayout: () => "simple",
  renderUiSection: ({ title, content }) => `<section><h3>${title}</h3>${content}</section>`,
  renderUiIcon: () => "",
  renderThemePaletteButtons: () => "",
  renderAcoesSalvarConfiguracao: (label) => `<button>${label}</button>`,
  escaparHtml: String, escaparAttr: String
};
// Other dispatcher destinations must not run in this focused route test.
for (const name of new Set(screenSource.match(/\brender[A-Z]\w*/g))) {
  sandbox[name] = () => { throw new Error(`renderer inesperado: ${name}`); };
}
sandbox.renderAcessoNegado = () => "access-denied";
vm.createContext(sandbox);
vm.runInContext(fs.readFileSync("src/navigation/screen-dispatcher.js", "utf8"), sandbox);
vm.runInContext([
  extractFunction("isTelaPublica"), extractFunction("podeAcessarAdministracaoEmpresa"),
  extractFunction("canAccessScreen"), extractFunction("renderAparenciaConfig"), screenSource
].join("\n"), sandbox);
const appearanceRenderer = sandbox.renderAparenciaConfig;
sandbox.renderAparenciaConfig = () => { renderCount += 1; return appearanceRenderer(); };
const appearance = sandbox.renderTela("personalizacao");
assert.match(appearance, /data-ui3-screen="aparencia"/, "rota deve renderizar a página Aparência atual");
assert.match(appearance, /id="themeConfig"/, "página autorizada deve conter configuração de tema");
assert.match(appearance, /id="interfaceDensityConfig"/, "página autorizada deve conter densidade");
assert.match(appearance, /Salvar aparência/, "página autorizada deve manter a ação de salvar");
assert.doesNotMatch(appearance, /companyNameConfig|pdfThemeConfig|defaultMarginConfig/, "Aparência não deve reunir os formulários de empresa, PDF ou calculadora");
assert.equal(renderCount, 1);
user = null;
assert.equal(sandbox.renderTela("personalizacao"), "access-denied", "visitante não acessa aparência");
user = { papel: "viewer" };
assert.equal(sandbox.renderTela("personalizacao"), "access-denied", "papel sem permissão não acessa aparência");
user = { papel: "owner" };
blocked = true;
assert.equal(sandbox.renderTela("personalizacao"), "access-denied", "licença bloqueada impede o acesso");
blocked = false;
featureAllowed = false;
assert.equal(sandbox.renderTela("personalizacao"), "access-denied", "negação efetiva do recurso deve ser respeitada");
assert.equal(renderCount, 1, "acessos negados não podem executar o renderer de aparência");

assert.ok(migration.includes("create table if not exists public.user_preferences"), "migração deve criar user_preferences");
assert.ok(migration.includes("interface_mode text not null default 'simple'"), "modo padrão remoto deve ser simple");
assert.ok(migration.includes("check (interface_mode in ('simple', 'advanced'))"), "banco deve aceitar somente simple/advanced");
assert.ok(migration.includes("auth.uid() = user_id"), "RLS deve limitar preferências ao próprio usuário");

console.log("profile_admin_separation_tests_ok");
