const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const app = fs.readFileSync(path.join(root, "app.js"), "utf8");
const css = fs.readFileSync(path.join(root, "style.css"), "utf8");

const appContracts = [
  'id="tempo" type="number"',
  'id="tempoMinutos" type="number"',
  'max="59"',
  'class="calc-time-split"',
  'aria-hidden="true">:</b>',
  'id="taxaExtraAtiva" type="checkbox"',
  'id="impressaoLote" type="checkbox"',
  'name="calcBatchMode" value="per_piece"',
  'name="calcBatchMode" value="whole_batch"',
  'name="calcExtraFeeType" value="percent"',
  'name="calcExtraFeeType" value="fixed"',
  'class="calc-stepper-row"',
  "let calculatorDraftState = {",
  "calculatorDraftState.batchMode='per_piece'",
  "calculatorDraftState.batchMode='whole_batch'",
  "function sincronizarTempoSeparadoCalculadora()",
  "function atualizarResumoLoteCalculadora()",
  "function alternarTaxaExtraAtiva(ativa = false)"
  ,"release-notes-list"
];

const cssContracts = [
  ".calc-time-split",
  ".calc-option-block",
  ".calc-fee-stepper",
  "accent-color:var(--primary)"
  ,".mobile-panel-calculator .calc-modern-grid"
  ,"grid-template-columns:repeat(2, minmax(0, 1fr)) !important"
  ,".calc-batch-summary"
  ,".release-notes-modal"
  ,".release-notes-list li + li"
  ,'body.mobile-mode .mobile-panel-calculator:focus-within .calc-active-profile'
  ,"display:grid !important"
];

const failures = [
  ...appContracts.filter((contract) => !app.includes(contract)).map((contract) => `app.js: ${contract}`),
  ...cssContracts.filter((contract) => !css.includes(contract)).map((contract) => `style.css: ${contract}`)
];

if (failures.length) {
  failures.forEach((failure) => console.error(`FALHA: ${failure}`));
  process.exit(1);
}

console.log("Calculadora: tempo, lote por modo e taxa percentual/fixa verificados.");
