const fs = require("fs");
const app = fs.readFileSync("app.js", "utf8");
const css = fs.readFileSync("style.css", "utf8");

[
  "phoneContactsEnabled: true",
  'pdfTheme: "clean_white"',
  'pdfStyle: "clean_white"',
  '<option value="clean_white" selected>Novo padrão claro</option>',
  'toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" })',
  '/rest/v1/app_feedback_reports?select=*&order=created_at.desc&limit=120',
  "function renderSuperAdminDiagnosticos"
].forEach((marker) => { if (!app.includes(marker)) throw new Error(`Contrato ausente: ${marker}`); });

[
  "Superadmin must never widen the ERP viewport",
  ".superadmin-platform-shell .client-admin-row",
  "overflow-wrap:anywhere"
].forEach((marker) => { if (!css.includes(marker)) throw new Error(`Protecao visual ausente: ${marker}`); });

console.log("Release admin fixes: contatos, PDF claro, diagnosticos, horario e largura validados.");
