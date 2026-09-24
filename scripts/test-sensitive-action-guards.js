const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const app = fs.readFileSync(path.join(root, "app.js"), "utf8");
const css = fs.readFileSync(path.join(root, "style.css"), "utf8");
const cashCommandsPath = path.join(root, "src", "features", "cash", "cash-commands.js");
const cashCommands = fs.existsSync(cashCommandsPath) ? fs.readFileSync(cashCommandsPath, "utf8") : "";
const ordersRendererPath = path.join(root, "src", "features", "orders", "orders-renderer.js");
const customersRendererPath = path.join(root, "src", "features", "customers", "customers-renderer.js");
const storefrontAccessPath = path.join(root, "src", "features", "storefront", "storefront-access.js");
const storefrontRemotePath = path.join(root, "src", "features", "storefront", "storefront-admin-remote.js");
const storefrontRemote = fs.existsSync(storefrontRemotePath) ? fs.readFileSync(storefrontRemotePath, "utf8") : "";
const storefrontProductEditorPath = path.join(root, "src", "features", "storefront", "storefront-product-editor.js");
const storefrontProductEditor = fs.existsSync(storefrontProductEditorPath) ? fs.readFileSync(storefrontProductEditorPath, "utf8") : "";
const storefrontEditorPath = path.join(root, "src", "features", "storefront", "storefront-editor.js");
const storefrontEditor = fs.existsSync(storefrontEditorPath) ? fs.readFileSync(storefrontEditorPath, "utf8") : "";
const moduleSnippets = [
  fs.existsSync(ordersRendererPath) ? fs.readFileSync(ordersRendererPath, "utf8") : "",
  fs.existsSync(customersRendererPath) ? fs.readFileSync(customersRendererPath, "utf8") : "",
  fs.existsSync(storefrontAccessPath) ? fs.readFileSync(storefrontAccessPath, "utf8") : "",
  storefrontRemote,
  storefrontProductEditor,
  storefrontEditor,
  cashCommands
].join("\n");

function extractFunctionBody(source, name) {
  const start = source.indexOf(`function ${name}`);
  const asyncStart = source.indexOf(`async function ${name}`);
  const index = start === -1 ? asyncStart : asyncStart === -1 ? start : Math.min(start, asyncStart);
  if (index === -1) return null;
  const parenStart = source.indexOf("(", index);
  if (parenStart === -1) return null;
  let parenDepth = 0;
  let parenEnd = -1;
  for (let i = parenStart; i < source.length; i += 1) {
    if (source[i] === "(") parenDepth += 1;
    if (source[i] === ")") parenDepth -= 1;
    if (parenDepth === 0) { parenEnd = i; break; }
  }
  if (parenEnd === -1) return null;
  const braceStart = source.indexOf("{", parenEnd);
  if (braceStart === -1) return null;
  let depth = 0;
  for (let i = braceStart; i < source.length; i += 1) {
    if (source[i] === "{") depth += 1;
    if (source[i] === "}") depth -= 1;
    if (depth === 0) return source.slice(braceStart, i + 1);
  }
  return null;
}

function getFunctionBody(name) {
  const bodies = [extractFunctionBody(app, name), extractFunctionBody(storefrontRemote, name), extractFunctionBody(storefrontProductEditor, name), extractFunctionBody(storefrontEditor, name)].filter(Boolean);
  if (!bodies.length) throw new Error(`Função não encontrada: ${name}`);
  const guarded = bodies.find((body) => body.includes("requestSensitiveActionConfirmation"));
  return guarded || bodies.sort((a, b) => b.length - a.length)[0];
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

const missingProtection = protectedFunctions.filter((name) => {
  const body = getFunctionBody(name);
  if (body.includes("requestSensitiveActionConfirmation")) return false;
  if (/SimplificaCashCommands\./.test(body)) return !cashCommands.includes("requestSensitiveActionConfirmation");
  return true;
});

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
  "PIN de ações importantes",
  "SENSITIVE_ACTION_PIN_MAX_ATTEMPTS",
  "Muitas tentativas incorretas.",
  "Escolha um PIN menos previsível.",
  "A nova senha deve ser diferente da senha atual.",
  "Usar senha do aplicativo",
  "isAndroidNativeApp()",
  "pin_admin_validado",
  "data-preserve-focus-key=\"pedidos-busca\"",
  "data-preserve-focus-key=\"clientes-busca\"",
  "data-preserve-focus-key=\"estoque-busca\"",
  "capturarFocoInterface()",
  "restaurarFocoInterface(foco)"
];

const missingSnippets = requiredSnippets.filter((snippet) => !(app.includes(snippet) || moduleSnippets.includes(snippet)));

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
