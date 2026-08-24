const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const root = path.join(__dirname, "..");
const appSource = fs.readFileSync(path.join(root, "app.js"), "utf8");
const telemetrySource = fs.readFileSync(path.join(root, "src", "services", "errorTelemetry.js"), "utf8");
const restTestSource = fs.readFileSync(path.join(root, "scripts", "test-telemetry-rest.js"), "utf8");

function extractFunction(name) {
  const start = appSource.indexOf(`function ${name}`);
  assert.notEqual(start, -1, `${name} deve existir`);
  const paren = appSource.indexOf("(", start);
  let parenDepth = 0;
  let open = -1;
  for (let index = paren; index < appSource.length; index += 1) {
    if (appSource[index] === "(") parenDepth += 1;
    if (appSource[index] === ")") parenDepth -= 1;
    if (parenDepth === 0) {
      open = appSource.indexOf("{", index);
      break;
    }
  }
  assert.notEqual(open, -1, `${name} deve ter corpo`);
  let depth = 0;
  for (let index = open; index < appSource.length; index += 1) {
    if (appSource[index] === "{") depth += 1;
    if (appSource[index] === "}") depth -= 1;
    if (depth === 0) return appSource.slice(start, index + 1);
  }
  throw new Error(`Não foi possível extrair ${name}`);
}

const sandbox = {
  APP_VERSION: "1.0.37",
  TELEMETRY_INFORMATIONAL_KEYS: new Set(["ADMOB_INITIALIZED", "ADMOB_BANNER_SHOWN", "AUTH_EMAIL_CONFIRMATION_REQUIRED"])
};
vm.runInNewContext([
  extractFunction("erroTelemetriaEhInformativo"),
  extractFunction("registroTelemetriaEhTeste"),
  extractFunction("registroTelemetriaEhInformativo"),
  extractFunction("registroPertenceVersaoAtual"),
  extractFunction("capturarPonteiroSemFalhar"),
  "result = { erroTelemetriaEhInformativo, registroTelemetriaEhTeste, registroTelemetriaEhInformativo, registroPertenceVersaoAtual, capturarPonteiroSemFalhar };"
].join("\n"), sandbox);

const helpers = sandbox.result;
assert.equal(helpers.registroTelemetriaEhTeste({ platform: "script" }), true, "telemetria de script deve ser teste");
assert.equal(helpers.registroTelemetriaEhTeste({ metadata_json: { test: true } }), true, "fixture marcada deve ser teste");
assert.equal(helpers.registroTelemetriaEhTeste({ error_message: "FAULT_BEFORE_LOCAL_PERSIST" }), true, "injeção de falha não deve virar bug real");
assert.equal(helpers.registroTelemetriaEhInformativo({ error_key: "ADMOB_INITIALIZED" }), true, "evento de inicialização não deve virar bug");
assert.equal(helpers.registroPertenceVersaoAtual({ affected_versions: ["1.0.36", "1.0.37"] }), true, "cluster deve usar affected_versions");
assert.equal(helpers.registroPertenceVersaoAtual({ affected_versions: ["1.0.36"] }), false, "cluster antigo não deve entrar na versão atual");

assert.equal(helpers.capturarPonteiroSemFalhar({ setPointerCapture() { throw new Error("invalid pointer"); } }, { pointerId: 7 }), false, "WebView não pode propagar erro de pointer capture");
assert.equal(helpers.capturarPonteiroSemFalhar({ setPointerCapture() {}, hasPointerCapture() { return false; } }, { pointerId: 7 }), true, "captura válida deve continuar funcionando");
assert.doesNotMatch(appSource, /\.setPointerCapture\?\.\(/, "capturas diretas inseguras devem usar o helper");

const signupStart = appSource.indexOf("  async signupSaas(");
const signupEnd = appSource.indexOf("\n  }\n};", signupStart);
const signupSource = appSource.slice(signupStart, signupEnd);
assert.match(signupSource, /cadastroAguardandoConfirmacao = true;/, "confirmação de e-mail deve ser estado esperado");
assert.match(signupSource, /syncStatusCadastro = cadastroAguardandoConfirmacao \? "pending_confirmation" : "synced"/, "cadastro pendente deve ser persistido corretamente");
assert.doesNotMatch(signupSource, /throw new AppError\("Conta criada no Supabase aguardando confirmação/, "confirmação não deve ser registrada como falha");

assert.match(telemetrySource, /NETWORK_THROTTLE_MS = 5 \* 60 \* 1000/, "falhas de rede devem ter janela maior de deduplicação");
assert.match(telemetrySource, /semDuplicado = queue\.filter/, "fila offline deve substituir duplicatas");
assert.match(restTestSource, /status: "ignored"/, "fixture de feedback remoto deve nascer ignorada");
assert.match(restTestSource, /test: true/, "fixture remota deve ser identificável como teste");

console.log("Telemetria: testes/eventos informativos filtrados, rede deduplicada, signup pendente e pointer capture seguro.");
