const assert = require("assert");
const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const app = fs.readFileSync(path.join(root, "app.js"), "utf8");

function bodyOfFunction(source, name) {
  const start = source.indexOf(`function ${name}`);
  assert(start >= 0, `funcao ausente: ${name}`);
  const brace = source.indexOf("{", start);
  let depth = 0;
  for (let index = brace; index < source.length; index += 1) {
    if (source[index] === "{") depth += 1;
    if (source[index] === "}") depth -= 1;
    if (depth === 0) return source.slice(start, index + 1);
  }
  throw new Error(`nao foi possivel ler funcao: ${name}`);
}

const registryStart = app.indexOf("const PLAN_REGISTRY");
const registryEnd = app.indexOf("const DEFAULT_SAAS_PLANS", registryStart);
assert(registryStart >= 0 && registryEnd > registryStart, "catalogo central de planos ausente");
const registry = app.slice(registryStart, registryEnd);

assert.match(registry, /free:\s*Object\.freeze/);
assert.match(registry, /start:\s*Object\.freeze/);
assert.match(registry, /pro:\s*Object\.freeze/);
assert(!registry.includes("premium_trial"), "catalogo comercial nao pode publicar trial");
assert(app.includes("const DEFAULT_TRIAL_DAYS = 0"), "novas contas devem manter trial desativado");
assert(app.includes('if (["trial", "premium_trial"].includes(valor)) return "pro";'), "aliases antigos devem convergir para Pro");

[
  "Assine o Premium",
  "PDF premium",
  "Recurso premium",
  "Usuários premium",
  "Premium liberado",
  "Liberar Premium",
  "plano Premium",
  "tema premium",
  "Sync Premium",
  'value="premium"',
  'planSlug: "premium_trial"',
  'planCode: "PREMIUM"'
].forEach((texto) => assert(!app.includes(texto), `conteudo comercial legado encontrado: ${texto}`));

const iniciarTeste = bodyOfFunction(app, "iniciarTesteGratis");
assert(iniciarTeste.includes("A ativação temporária foi removida"), "acionador antigo deve explicar a indisponibilidade");
assert(iniciarTeste.includes('trocarTela("assinatura")'), "acionador antigo deve encaminhar para os planos atuais");
assert(!iniciarTeste.includes("billingConfig"), "acionador antigo nao pode conceder acesso local");
assert(!iniciarTeste.includes("salvarDados"), "acionador antigo nao pode persistir trial");

const cadastroOnline = bodyOfFunction(app, "garantirCadastroSaasOnlineAposLogin");
assert(!cadastroOnline.includes("premium_trial"), "cadastro online nao pode solicitar trial");

const acessoManual = bodyOfFunction(app, "salvarAcessoSuperAdmin");
assert(!acessoManual.includes('tipo === "trial"'), "superadmin nao pode criar trial local");
assert(acessoManual.includes('tipo === "pro"'), "superadmin deve oferecer acesso Pro");

console.log("Commercial plan UI contract tests OK");
