const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const app = fs.readFileSync(path.join(__dirname, "..", "app.js"), "utf8");
const css = fs.readFileSync(path.join(__dirname, "..", "style.css"), "utf8");
const renderers = fs.readFileSync(path.join(__dirname, "..", "src", "features", "app-ui", "app-ui-renderers.js"), "utf8");
const bootstrap = fs.readFileSync(path.join(__dirname, "..", "src", "app", "bootstrap.js"), "utf8");
const index = fs.readFileSync(path.join(__dirname, "..", "index.html"), "utf8");
const serviceWorker = fs.readFileSync(path.join(__dirname, "..", "sw.js"), "utf8");

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
assert.match(authPublica, /<\/div>\s*\$\{verificandoSessao \? `[\s\S]*auth-session-dock/, "o status deve ser renderizado depois do card de login");
assert.match(app, /auth-session-progress/, "a verificação deve exibir o progresso do login");
assert.match(css, /\.auth-page\.auth-session-check::before[\s\S]*background:#071019;/, "a verificação não deve usar imagem de fundo");
assert.match(css, /body\.theme-light \.auth-page\.auth-session-check::before[\s\S]*background:#f7f9fc;/, "o tema claro deve usar fundo branco na verificação");
assert.match(css, /\.auth-session-dock\{[\s\S]*position:fixed;[\s\S]*bottom:calc\(var\(--app-safe-bottom, 0px\) \+ 14px\);[\s\S]*pointer-events:none;/, "o status deve ficar abaixo sem interceptar o login");
assert.match(bootstrap, /\[700, 1500, 2300\]/, "as etapas devem continuar informativas quando a autenticação estiver pendente");
assert.doesNotMatch(bootstrap, /setTimeoutRef\(resolve, 3000\)/, "a abertura não deve impor a antiga espera de três segundos");
assert.match(bootstrap, /etapasVerificacao/, "a abertura deve atualizar as etapas de verificação");
assert.match(app, /ativarTravaLocal\(motivo\);[\s\S]*renderApp\(\);[\s\S]*tentarDesbloqueioLocalComBiometria\(\{ silencioso: true \}\)/, "a tela de verificação deve aparecer antes da biometria nativa");
assert.match(index, /style\.css\?v=auth-status-dock-20261008/, "o CSS do login deve ter versão nova");
assert.match(index, /src\/app\/bootstrap\.js\?v=fast-startup-20261017/, "o bootstrap deve invalidar a versão com espera fixa");
assert.match(index, /src\/features\/app-ui\/app-ui-renderers\.js\?v=bootstrap-failure-20261017/, "o renderizador do login deve ter versão nova");
assert.match(index, /app\.js\?v=1\.0\.41-bootstrap-failure-20261017/, "o app principal deve ter versão nova");
assert.match(serviceWorker, /simplifica-3d-v1042-auth-status-build-__SIMPLIFICA_BUILD_ID__/, "o cache deve ser renovado para a nova tela de login");
assert(index.indexOf('id="app-shell"') < index.indexOf('/assets/vendor/jspdf.umd.min.js'), "o shell inicial deve ser montado antes das bibliotecas de PDF e QR");
assert(index.indexOf('/assets/vendor/jspdf.umd.min.js') < index.indexOf('/app.js?'), "a biblioteca de PDF deve continuar disponível antes do app principal");
assert(index.indexOf('/assets/vendor/qrcode.min.js') < index.indexOf('/app.js?'), "a biblioteca de QR deve continuar disponível antes do app principal");
for (const resource of ["/src/app/bootstrap.js", "/src/features/app-ui/app-ui-renderers.js"]) {
  assert.match(serviceWorker, new RegExp(resource.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")), `${resource} deve ignorar cache antigo`);
}

console.log("Auth UI checks passed");
