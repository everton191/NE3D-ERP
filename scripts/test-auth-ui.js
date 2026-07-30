const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const app = fs.readFileSync(path.join(__dirname, "..", "app.js"), "utf8");
const css = fs.readFileSync(path.join(__dirname, "..", "style.css"), "utf8");

function extractFunction(source, name) {
  const match = new RegExp(`function\\s+${name}\\s*\\(`).exec(source);
  const start = match?.index ?? -1;
  assert.notEqual(start, -1, `${name} deve existir`);
  const open = source.indexOf("{", start);
  let depth = 0;
  for (let i = open; i < source.length; i += 1) {
    if (source[i] === "{") depth += 1;
    if (source[i] === "}") depth -= 1;
    if (depth === 0) return source.slice(start, i + 1);
  }
  throw new Error(`Nao foi possivel extrair ${name}`);
}

const authPublica = extractFunction(app, "renderAuthPublica");
const authEntrar = extractFunction(app, "renderAuthEntrar");
const authCriarConta = extractFunction(app, "renderAuthCriarConta");
const renderCalculadora = extractFunction(app, "renderCalculadoraFlutuante");
const authCode = [authPublica, authEntrar, authCriarConta].join("\n");

for (const text of ["Entrar", "Criar conta", "Organize seus pedidos sem complicação", "Salvar e-mail e senha neste navegador", "Esqueci minha senha", "Ver planos e benefícios"]) {
  assert.match(authCode, new RegExp(text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")), `auth deve conter ${text}`);
}

for (const id of ["usuarioLoginEmail", "usuarioLoginSenha", "signupNome", "signupEmail", "signupSenha", "signupConfirmarSenha", "signupNegocio", "signupTelefone", "signupAceite"]) {
  assert.match(authCode, new RegExp(id), `auth deve conter ${id}`);
}

for (const forbidden of [
  "Acesso local",
  "Entrar manutenção local",
  "entrarComCredencialSalva",
  "adminSenha",
  "loginAdminBtn",
  "Senha salva/digital"
]) {
  assert.doesNotMatch(authCode, new RegExp(forbidden.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i"), `auth publico nao deve conter ${forbidden}`);
}

assert.match(app, /const GOOGLE_AUTH_ENABLED = false;/, "login Google deve permanecer desligado até a configuração oficial");
assert.doesNotMatch(app, /GOCSPX-|external_google_secret|client_secret\s*[:=]/i, "frontend nao deve conter segredo Google");

assert.doesNotMatch(app, /renderAssistenteVirtual|MANUAL_HELP_ASSISTANT_ENABLED|podeMostrarAssistenteAjuda/, "produto padrão não deve carregar o assistente aposentado");
assert.match(renderCalculadora, /root\.innerHTML = "";/, "calculadora flutuante deve limpar DOM sem login");
assert.match(css, /body\.auth-screen-active header[\s\S]*display:none;/, "header deve sumir na tela de auth");
assert.match(css, /\.auth-card[\s\S]*width:430px;[\s\S]*max-width:100%;/, "auth deve ter card central controlado");

console.log("Auth UI checks passed");
