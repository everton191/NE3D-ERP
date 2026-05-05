const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const appPath = path.join(__dirname, "..", "app.js");
const source = fs.readFileSync(appPath, "utf8");

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
assert.match(bodyOf("lerConfigAppCampos"), /twoFactorEnabled:\s*whatsapp2FABackendDisponivel\(\) &&/, "config publica nao deve reativar 2FA sem backend");

console.log("Auth hotfix checks passed");
