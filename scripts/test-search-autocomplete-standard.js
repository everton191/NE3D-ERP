const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const app = fs.readFileSync(path.join(root, "app.js"), "utf8");
const css = fs.readFileSync(path.join(root, "style.css"), "utf8");

const contexts = ["global", "pedidos", "estoque", "clientes", "caixa", "relatorios", "superadmin"];
const failures = [];

for (const context of contexts) {
  if (!app.includes(`data-search-context="${context}"`)) failures.push(`Contexto ausente: ${context}`);
}

[
  "function atualizarAutocompletePesquisa(input)",
  "function selecionarAutocompletePesquisa(input, index)",
  "function pesquisarAutocomplete(contexto",
  "function pontuarAutocomplete(item",
  "function distanciaEdicaoAutocomplete(",
  "function navegarAutocompletePesquisa(event)",
  "AUTOCOMPLETE_SYNONYMS",
  "AUTOCOMPLETE_RECENT_STORAGE_KEY",
  "function reabrirAutocompletePesquisaAposRender(input",
  "search-autocomplete-panel",
  "role=\"option\"",
  "aria-selected=\"false\""
].forEach((contract) => {
  if (!app.includes(contract)) failures.push(`Contrato ausente em app.js: ${contract}`);
});

["pedidos-busca", "estoque-busca", "clientes-busca", "caixa-busca"].forEach((focusKey) => {
  if (!app.includes(`data-preserve-focus-key="${focusKey}"`)) {
    failures.push(`Pesquisa com re-render não preserva foco: ${focusKey}`);
  }
});

if (!app.includes("const foco = capturarFocoInterface();") || !app.includes("restaurarFocoInterface(foco);")) {
  failures.push("Renderização incremental precisa restaurar foco e seleção do campo.");
}

[
  ".search-autocomplete-panel",
  "max-height:min(22rem, 50dvh)",
  "bottom:calc(var(--layout-bottom-nav-height)"
].forEach((contract) => {
  if (!css.includes(contract)) failures.push(`Contrato ausente em style.css: ${contract}`);
});

if (failures.length) {
  failures.forEach((failure) => console.error(`FALHA: ${failure}`));
  process.exit(1);
}

console.log("Autocomplete de pesquisa: contextos, seleção e comportamento mobile verificados.");
