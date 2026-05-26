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
  "delete botao.dataset.textoOriginal;"
];

const missingSnippets = requiredSnippets.filter((snippet) => !app.includes(snippet));

const cssSnippets = [
  ".cash-cancel-modal :where(input, textarea, select)",
  ".password-confirm-card :where(input, textarea, select)",
  "-webkit-text-fill-color"
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
