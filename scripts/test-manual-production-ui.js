const fs = require("fs");

const app = fs.readFileSync("app.js", "utf8");
const css = fs.readFileSync("style.css", "utf8");
const migration = fs.readFileSync("supabase/migrations/20260704170000_manual_production_foundation.sql", "utf8");

const appMarkers = [
  "const PRODUCTION_STATUS_META",
  "function abrirLiberacaoProducao",
  "function confirmarLiberacaoProducao",
  "function criarReimpressaoProducao",
  "function avaliarQualidadeProducao",
  "function abrirCadastroImpressoraProducao",
  "function sincronizarProducaoManualSupabaseSilencioso",
  "function carregarProducaoManualSupabaseSilencioso",
  "function normalizarIdsProducaoParaSupabase",
  "function getPaymentMethodsConfig",
  "function renderImpressorasProducao",
  "function renderTarefaProducao",
  "Fila manual por item, sem automação de impressoras.",
  "As impressoras são controladas manualmente.",
  "Liberar para produção"
];

const missingApp = appMarkers.filter((marker) => !app.includes(marker));
if (missingApp.length) {
  throw new Error(`Produção manual incompleta: ${missingApp.join(", ")}`);
}

if (!app.includes("status === \"em_impressao\" && !job.printerId")) {
  throw new Error("Uma tarefa não pode iniciar impressão sem impressora manual.");
}
if (!app.includes("A prioridade só pode ser alterada com justificativa.")) {
  throw new Error("Prioridade manual precisa exigir justificativa.");
}
if (!app.includes("productionJobs = atribuirDonoRemotoLista") ||
    !app.includes("productionPrinters = atribuirDonoRemotoLista")) {
  throw new Error("Produção manual precisa permanecer isolada pelo escopo da empresa.");
}
if (!app.includes("/rest/v1/production_printers?on_conflict=id") ||
    !app.includes("/rest/v1/production_jobs?on_conflict=id") ||
    !app.includes("/rest/v1/production_events?on_conflict=id")) {
  throw new Error("Produção manual precisa sincronizar diretamente com as tabelas protegidas por RLS.");
}
if (app.includes("Personalização do caixa será ajustada nas preferências.") ||
    app.includes("Notificações do caixa em breve.")) {
  throw new Error("Caixa não deve exibir ações sem função.");
}
if (!app.includes("abrirCardCaixaRapido('historico');setTimeout")) {
  throw new Error("Pesquisa do Caixa deve abrir o histórico e focar o campo real.");
}

const cssMarkers = [
  ".production-tabs",
  ".production-job-card",
  ".production-printer-card",
  ".production-job-controls",
  ".stock-row-main-button",
  "body.theme-light .stock-add-fab",
  "body.mobile-mode:has(.stock-page) .assistant-fab"
];
const missingCss = cssMarkers.filter((marker) => !css.includes(marker));
if (missingCss.length) {
  throw new Error(`Contrato visual operacional incompleto: ${missingCss.join(", ")}`);
}
if (!css.includes("grid-template-rows: repeat(2, 32px)") ||
    !css.includes("grid-auto-flow: column")) {
  throw new Error("Abas da Produção precisam usar carrossel móvel em duas linhas.");
}
if (!css.includes("grid-template-columns: repeat(3, max-content)")) {
  throw new Error("Ações PDF, Imprimir e WhatsApp do extrato precisam permanecer em uma linha.");
}

const migrationMarkers = [
  "create table if not exists public.production_printers",
  "create table if not exists public.production_jobs",
  "create table if not exists public.production_events",
  "production_jobs_printing_printer_check",
  "production_jobs_priority_reason_check",
  "public.s3d_is_company_member(company_id)"
];
const missingMigration = migrationMarkers.filter((marker) => !migration.includes(marker));
if (missingMigration.length) {
  throw new Error(`Migração da produção manual incompleta: ${missingMigration.join(", ")}`);
}

console.log("Produção manual, Estoque e ações do Caixa validados.");
