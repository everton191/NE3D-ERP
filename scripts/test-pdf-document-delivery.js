"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const root = path.resolve(__dirname, "..");
const app = fs.readFileSync(path.join(root, "app.js"), "utf8");
const delivery = fs.readFileSync(path.join(root, "src", "features", "company", "pdf-document-delivery.js"), "utf8");

[
  "saveOrSharePdf", "printOrOfferPdf", "ensureAndroidStoragePermission",
  "savePdfAndroidNative", "printPdfAndroidNative", "printPdfBrowser"
].forEach((name) => assert.match(delivery, new RegExp(`function\\s+${name}|async function\\s+${name}`), `entrega PDF ausente: ${name}`));
assert.match(app, /function\s+salvarOuCompartilharPdf[\s\S]{0,240}SimplificaPdfDocumentDelivery\.saveOrSharePdf/, "salvar PDF deve ser bridge");
assert.match(app, /function\s+imprimirOuOferecerPdf[\s\S]{0,240}SimplificaPdfDocumentDelivery\.printOrOfferPdf/, "impressão PDF deve ser bridge");
assert.match(app, /function\s+salvarPdfAndroidNativo[\s\S]{0,240}SimplificaPdfDocumentDelivery\.savePdfAndroidNative/, "salvamento Android deve ser bridge");
assert.match(app, /function\s+imprimirPdfNavegador[\s\S]{0,240}SimplificaPdfDocumentDelivery\.printPdfBrowser/, "impressão navegador deve ser bridge");
assert.match(delivery, /context\.confirmRef\("Nenhuma impressora disponível\. Deseja gerar PDF\?"\)/, "fallback de impressão deve ser preservado");
console.log("PDF DOCUMENT DELIVERY: bridges e fallback de entrega preservados.");
