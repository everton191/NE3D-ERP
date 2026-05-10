const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const appPath = path.join(__dirname, "..", "app.js");
const source = fs.readFileSync(appPath, "utf8");
const stylePath = path.join(__dirname, "..", "style.css");
const styleSource = fs.readFileSync(stylePath, "utf8");

function extractFunction(name) {
  const start = source.indexOf(`function ${name}`);
  assert.notEqual(start, -1, `${name} deve existir`);
  const open = source.indexOf("{", start);
  let depth = 0;
  for (let i = open; i < source.length; i += 1) {
    const char = source[i];
    if (char === "{") depth += 1;
    if (char === "}") depth -= 1;
    if (depth === 0) return source.slice(start, i + 1);
  }
  throw new Error(`Nao foi possivel extrair ${name}`);
}

function bodyOf(name) {
  return extractFunction(name);
}

function extractAuthMethod(name) {
  const start = source.indexOf(`  async ${name}(`);
  assert.notEqual(start, -1, `AuthService.${name} deve existir`);
  const paren = source.indexOf("(", start);
  let parenDepth = 0;
  let open = -1;
  for (let i = paren; i < source.length; i += 1) {
    const char = source[i];
    if (char === "(") parenDepth += 1;
    if (char === ")") parenDepth -= 1;
    if (parenDepth === 0) {
      open = source.indexOf("{", i);
      break;
    }
  }
  assert.notEqual(open, -1, `AuthService.${name} deve ter corpo`);
  let depth = 0;
  for (let i = open; i < source.length; i += 1) {
    const char = source[i];
    if (char === "{") depth += 1;
    if (char === "}") depth -= 1;
    if (depth === 0) return source.slice(start, i + 1);
  }
  throw new Error(`Nao foi possivel extrair AuthService.${name}`);
}

const sandbox = {};
vm.runInNewContext(
  [
    extractFunction("normalizePhoneBR"),
    extractFunction("normalizarTelefoneWhatsapp"),
    "result = { normalizePhoneBR, normalizarTelefoneWhatsapp };"
  ].join("\n"),
  sandbox
);

const { normalizePhoneBR, normalizarTelefoneWhatsapp } = sandbox.result;
const cases = [
  ["85999999999", "+5585999999999"],
  ["5585999999999", "+5585999999999"],
  ["+5585999999999", "+5585999999999"],
  ["(85) 99999-9999", "+5585999999999"],
  ["85 3333-4444", "+558533334444"],
  ["abc", ""]
];

for (const [input, expected] of cases) {
  assert.equal(normalizePhoneBR(input), expected, `normalizePhoneBR(${input})`);
}
assert.equal(normalizarTelefoneWhatsapp("(85) 99999-9999"), "5585999999999", "wa.me deve usar numero sem +");

assert.match(source, /const WHATSAPP_2FA_BACKEND_ENABLED = false;/, "2FA WhatsApp deve ficar desligado sem backend real");
assert.match(bodyOf("precisa2FA"), /!whatsapp2FABackendDisponivel\(\)[\s\S]*return false;/, "2FA nao pode bloquear login sem backend");
assert.match(bodyOf("iniciarVerificacao2FA"), /!whatsapp2FABackendDisponivel\(\)[\s\S]*return false;/, "fluxo 2FA sem backend deve encerrar sem pendencia");
assert.match(bodyOf("abrirWhats2FA"), /!whatsapp2FABackendDisponivel\(\)[\s\S]*return;/, "wa.me nao pode abrir 2FA sem backend");

assert.match(bodyOf("verificarSuperadminSupabaseSilencioso"), /\/rest\/v1\/rpc\/erp_is_superadmin/, "Superadmin deve validar RPC do banco");
assert.match(bodyOf("verificarSuperadminSupabaseSilencioso"), /\/rest\/v1\/profiles\?select=role,status&user_id=eq\./, "Superadmin deve aceitar perfil do proprio user_id");
assert.doesNotMatch(bodyOf("loginUsuarioSupabase"), /perfil\?\.role \|\| "operador"/, "login Supabase nao deve criar usuario como operador/admin por fallback");
assert.doesNotMatch(bodyOf("processarRetornoOAuthSupabase"), /papel:\s*"admin"/, "OAuth nao deve criar admin por fallback");
assert.match(bodyOf("concluirLoginUsuario"), /telaAtual = "superadmin"/, "superadmin deve ir para painel superadmin");
assert.match(bodyOf("concluirLoginUsuario"), /"admin"/, "login comum/admin deve sair da tela de login");
assert.doesNotMatch(extractAuthMethod("login"), /verificarSenhaUsuario/, "login comum nao deve validar senha local como fonte de verdade");
assert.doesNotMatch(extractAuthMethod("login"), /recoverOnlineAccount/, "login comum nao deve recriar conta online a partir de bypass local");
assert.match(extractAuthMethod("signupSaas"), /Conexão necessária para criar sua conta/, "signup offline deve ser bloqueado antes de criar conta local");
assert.match(extractAuthMethod("signupSaas"), /criarClienteSaasLocal/, "signup so cria estrutura local depois do fluxo Supabase");
assert.match(source, /function prepararRegistroOnline[\s\S]*sync_status/, "dados operacionais novos devem carregar sync_status");
assert.match(source, /upsert_erp_record_if_newer/, "fila offline deve usar RPC de upsert autoritativo por timestamp");
assert.match(bodyOf("lerConfigAppCampos"), /twoFactorEnabled:\s*whatsapp2FABackendDisponivel\(\) &&/, "config publica nao deve reativar 2FA sem backend");
assert.doesNotMatch(bodyOf("prepararSelecaoClienteSaas"), /selecionarClienteSaasResultado/, "touchstart/pointerdown nao deve abrir edicao durante rolagem");
assert.match(bodyOf("selecionarResultadoClienteSaas"), /selecaoClienteSaasFoiArrasto/, "click da linha deve ignorar gesto de rolagem");
assert.match(source, /onpointermove="atualizarMovimentoClienteSaas/, "linha de cliente deve rastrear movimento pointer");
assert.match(source, /ontouchmove="atualizarMovimentoClienteSaas/, "linha de cliente deve rastrear movimento touch");
assert.match(styleSource, /\.client-admin-row\{[\s\S]*touch-action:pan-y;/, "linha de cliente deve permitir rolagem vertical no mobile");

const gestureSandbox = {
  window: {},
  selecionados: []
};
vm.runInNewContext(
  [
    "function selecionarClienteSaasResultado(id) { selecionados.push(id); }",
    extractFunction("alvoInterativoClienteSaas"),
    extractFunction("prepararSelecaoClienteSaas"),
    extractFunction("getPontoInteracaoClienteSaas"),
    extractFunction("atualizarMovimentoClienteSaas"),
    extractFunction("cancelarSelecaoClienteSaas"),
    extractFunction("selecaoClienteSaasFoiArrasto"),
    extractFunction("selecionarResultadoClienteSaas")
  ].join("\n"),
  gestureSandbox
);

const alvoLinha = { closest: () => null };
let preventidos = 0;
let propagacoesParadas = 0;
gestureSandbox.prepararSelecaoClienteSaas({ target: alvoLinha, clientX: 10, clientY: 10 }, "cliente-1");
gestureSandbox.atualizarMovimentoClienteSaas({ target: alvoLinha, clientX: 10, clientY: 48 }, "cliente-1");
gestureSandbox.selecionarResultadoClienteSaas({
  target: alvoLinha,
  clientX: 10,
  clientY: 48,
  preventDefault: () => { preventidos += 1; },
  stopPropagation: () => { propagacoesParadas += 1; }
}, "cliente-1");
assert.deepEqual(gestureSandbox.selecionados, [], "arrastar a lista nao deve abrir edicao do cliente");
assert.equal(preventidos, 1, "click sintetico apos arrasto deve ser cancelado");
assert.equal(propagacoesParadas, 1, "click sintetico apos arrasto nao deve propagar");

gestureSandbox.prepararSelecaoClienteSaas({ target: alvoLinha, clientX: 20, clientY: 20 }, "cliente-2");
gestureSandbox.selecionarResultadoClienteSaas({
  target: alvoLinha,
  clientX: 21,
  clientY: 22,
  preventDefault: () => {},
  stopPropagation: () => {}
}, "cliente-2");
assert.deepEqual(gestureSandbox.selecionados, ["cliente-2"], "tap sem arrasto deve abrir edicao do cliente");

console.log("Auth hotfix checks passed");
