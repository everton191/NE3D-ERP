const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const app = fs.readFileSync(path.join(__dirname, "..", "app.js"), "utf8");
const css = fs.readFileSync(path.join(__dirname, "..", "style.css"), "utf8");
const renderers = fs.readFileSync(path.join(__dirname, "..", "src", "features", "app-ui", "app-ui-renderers.js"), "utf8");
const bootstrap = fs.readFileSync(path.join(__dirname, "..", "src", "app", "bootstrap.js"), "utf8");

function extractFunction(source, name) {
  const match = new RegExp(`function\\s+${name}\\s*\\(`).exec(source);
  const start = match?.index ?? -1;
  assert.notEqual(start, -1, `${name} deve existir`);
  const open = source.indexOf("{", source.indexOf(")", start));
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
assert.match(renderers, /renderAuthPublica\(\{[\s\S]*verificacaoSessao/, "a verificação deve reutilizar a tela de login existente");
assert.match(renderers, /Fazendo login/, "sessão válida deve informar o login automático");
assert.match(renderers, /Solicitando sua digital para continuar/, "sessão fora do intervalo deve informar a verificação biométrica");
assert.match(app, /function renderAuthPublica\(\{ verificacaoSessao = null \} = \{\}\)/, "o formulário de login deve aceitar o estado de verificação");
assert.match(app, /data-auth-session-check/, "o formulário deve marcar a verificação de sessão para leitores de tela");
assert.match(app, /auth-session-progress/, "a verificação deve exibir o progresso do login");
assert.match(css, /\.auth-page\.auth-session-check::before[\s\S]*background:#071019;/, "a verificação não deve usar imagem de fundo");
assert.match(css, /body\.theme-light \.auth-page\.auth-session-check::before[\s\S]*background:#f7f9fc;/, "o tema claro deve usar fundo branco na verificação");
assert.match(bootstrap, /renderApp\(\);[\s\S]*setTimeoutRef\(resolve, 5000\)/, "a tela de verificação deve ser exibida antes de restaurar a sessão");
assert.match(bootstrap, /etapasVerificacao/, "a abertura deve atualizar as etapas de verificação");
assert.match(app, /ativarTravaLocal\(motivo\);[\s\S]*renderApp\(\);[\s\S]*tentarDesbloqueioLocalComBiometria\(\{ silencioso: true \}\)/, "a tela de verificação deve aparecer antes da biometria nativa");

console.log("Auth UI checks passed");
