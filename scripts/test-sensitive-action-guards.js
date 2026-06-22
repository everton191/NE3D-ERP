const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const app = fs.readFileSync(path.join(root, "app.js"), "utf8");
const css = fs.readFileSync(path.join(root, "style.css"), "utf8");

function getFunctionBody(name) {
  const start = app.indexOf(`function ${name}`);
  const asyncStart = app.indexOf(`async function ${name}`);
  const index = start === -1 ? asyncStart : asyncStart === -1 ? start : Math.min(start, asyncStart);
  if (index === -1) throw new Error(`Função não encontrada: ${name}`);
  const braceStart = app.indexOf("{", index);
  let depth = 0;
  for (let i = braceStart; i < app.length; i += 1) {
    if (app[i] === "{") depth += 1;
    if (app[i] === "}") depth -= 1;
    if (depth === 0) return app.slice(braceStart, i + 1);
  }
  throw new Error(`Não foi possível ler o corpo de ${name}`);
}

const protectedFunctions = [
  "adicionarMovimentoCaixa",
  "abrirSessaoCaixaManual",
  "fecharSessaoCaixaBasica",
  "salvarStorefrontAparencia",
  "alternarStatusLojaOnline",
  "salvarProdutoLojaOnline",
  "alternarProdutoLojaOnline",
  "removerProdutoLojaOnline",
  "excluirCategoriaLojaOnline",
  "salvarStorefrontContatos"
];

const missingProtection = protectedFunctions.filter((name) => !getFunctionBody(name).includes("requestSensitiveActionConfirmation"));

const requiredSnippets = [
  "Fase atual: editor liberado para qualquer usuário autenticado.",
  "if (!botao.dataset.textoOriginal) botao.dataset.textoOriginal = botao.textContent;",
  "delete botao.dataset.textoOriginal;",
  "data-preserve-focus=\"true\"",
  "enterkeyhint=\"done\"",
  "validatePassword: async",
  "Digite sua senha e toque em confirmar. O campo permanece aberto se houver erro.",
  "SENSITIVE_ACTION_PIN_STORAGE_PREFIX",
  "O PIN deve ter de 4 a 12 dígitos numéricos.",
  "renderConfiguracaoPinAcoesSensiveis()",
  "Segurança da conta",
  "PIN de alterações importantes e senha de acesso",
  "SENSITIVE_ACTION_PIN_MAX_ATTEMPTS",
  "Muitas tentativas incorretas.",
  "Escolha um PIN menos previsível.",
  "A nova senha deve ser diferente da senha atual.",
  "MANUAL_HELP_ASSISTANT_ENABLED",
  "como fazer um pedido",
  "podeMostrarAssistenteAjuda()",
  "Usar senha do aplicativo",
  "isAndroidNativeApp()",
  "pin_admin_validado",
  "data-preserve-focus-key=\"pedidos-busca\"",
  "data-preserve-focus-key=\"clientes-busca\"",
  "data-preserve-focus-key=\"estoque-busca\"",
  "capturarFocoInterface()",
  "restaurarFocoInterface(foco)"
];

const missingSnippets = requiredSnippets.filter((snippet) => !app.includes(snippet));

const cssSnippets = [
  ".cash-cancel-modal :where(input, textarea, select)",
  ".password-confirm-card :where(input, textarea, select)",
  "-webkit-text-fill-color",
  ".password-confirm-card .actions",
  "position:sticky"
];

const missingCss = cssSnippets.filter((snippet) => !css.includes(snippet));

if (app.includes("if (adminAuthValidUntil && adminAuthValidUntil > agora) return true;")) {
  missingSnippets.push("cache de autorização sensível removido");
}

const failures = [
  ...missingProtection.map((name) => `${name}: sem confirmação sensível`),
  ...missingSnippets,
  ...missingCss
];

if (failures.length) {
  console.error("Proteções sensíveis incompletas:", failures);
  process.exit(1);
}

console.log("Sensitive action guards: ações críticas, loading e inputs de modal validados.");
