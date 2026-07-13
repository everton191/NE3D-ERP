const fs = require("node:fs");
const assert = require("node:assert/strict");
const app = fs.readFileSync("app.js", "utf8");
const allowed = new Set([
  "fecharCamadaAtualSeExistir",
  "solicitarNavegacaoSeguraLoja",
  "exigirChecklistPublicacaoLoja",
  "alternarStatusLojaOnline",
  "abrirCropImagemLojaOnline",
  "abrirCarrinhoLojaPublica",
  "abrirStoreLeadModal",
  "abrirPreviewCompartilhamentoLoja",
  "fecharPopup",
  "solicitarConfirmacaoAcao",
  "solicitarPlanoSuperadmin"
]);
const functions = [...app.matchAll(/(?:async )?function\s+([\w$]+)\b[\s\S]*?(?=\n(?:async )?function\s+|$)/g)];
const offenders = functions
  .filter((match) => match[0].includes("popup.innerHTML") && !match[0].includes("promoverPopupParaDialogUiV3") && !allowed.has(match[1]))
  .map((match) => match[1]);
assert.deepEqual(offenders, [], `Fluxos ERP ainda renderizam no popup legado: ${offenders.join(", ")}`);
assert.ok(app.includes('options.cardSelector || ".modal-card"'), "Adaptador de migração de conteúdo legado ausente.");
console.log("UI V3 legacy boundary: popup visual limitado a Loja/Superadmin e fallbacks explícitos.");
