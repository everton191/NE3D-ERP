const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "..");
const read = (file) => fs.readFileSync(path.join(root, file), "utf8");

const app = read("app.js");
const style = read("style.css");
const service = read("src/services/printerMonitoringService.js");
const migration = read("supabase/migrations/20260630130000_printer_monitoring_read_only.sql");
const edge = read("supabase/functions/printer-monitor/index.ts");
const index = read("index.html");
const prepareWeb = read("scripts/prepare-web.js");
const serviceWorker = read("sw.js");
const localAgent = read("tools/simplifica-local-agent/agent.js");

[
  'impressoras: "Impressoras"',
  'case "impressoras"',
  "function renderImpressoras()",
  "function abrirCadastroImpressora",
  "function atualizarStatusImpressora",
  "function abrirStatusManualImpressora",
  "function abrirVinculoPedidoImpressora",
  "function abrirHistoricoImpressora",
  "function abrirAgentesLocais",
  "printer_registry",
  "printer_monitoring",
  "printer_remote_control"
].forEach((marker) => assert.ok(app.includes(marker), `app deve conter ${marker}`));

assert.ok(index.includes("printerMonitoringService.js"), "servico de impressoras deve carregar antes do app");
assert.ok(prepareWeb.includes("src/services/printerMonitoringService.js"), "build deve copiar o servico de impressoras");
assert.ok(serviceWorker.includes("./src/services/printerMonitoringService.js"), "PWA deve armazenar o servico de impressoras");
assert.ok(service.includes("PrinterMonitoringService"), "servico global deve existir");
assert.ok(service.includes("calculateCosts"), "servico deve calcular custos da impressora");
assert.ok(service.includes("testBrowserLocal"), "servico deve testar leitura na rede local");
assert.ok(style.includes(".printer-grid"), "layout de impressoras deve existir");
assert.ok(style.includes(".printer-wizard"), "fluxo de cadastro deve existir");
assert.ok(app.includes("printer-form-simple"), "cadastro padrão deve usar formulário simplificado");
assert.ok(app.includes("printer-simple-fields"), "campos essenciais devem aparecer primeiro");
assert.ok(app.includes("printer-advanced-settings"), "campos técnicos devem ficar em configuração avançada");
assert.ok(app.includes("getPrinterModelSuggestionOptions"), "modelo deve oferecer sugestões sem exigir seleção técnica");
assert.ok(app.includes('id="printerSaveButton"'), "ação de salvar deve estar sempre visível");
assert.ok(app.includes("const saved = await printerBackendRequest"), "cadastro deve usar resposta confirmada do backend");
assert.ok(app.includes("printerMonitoringState.items.unshift(saved)"), "cadastro confirmado deve atualizar a lista imediatamente");
assert.doesNotMatch(app, /data-printer-step=|moverEtapaCadastroImpressora|printerWizardNext/, "cadastro não deve exigir assistente de quatro etapas");
assert.ok(style.includes(".printer-advanced-settings"), "configuração avançada deve possuir layout próprio");
assert.ok(app.includes("renderAppButton({ label: id ? \"Salvar alterações\" : \"Adicionar impressora\""), "ação principal deve usar o botão-base ligado aos tokens");
assert.match(app, /Object\.assign\(window,\s*\{[\s\S]*abrirCadastroImpressora,[\s\S]*atualizarMarcaCadastroImpressora,[\s\S]*atualizarCamposConectorImpressora,[\s\S]*testarConexaoCadastroImpressora,/, "ações inline do cadastro devem estar ligadas explicitamente à interface global");

[
  "create table if not exists public.printer_brands",
  "create table if not exists public.printer_models",
  "create table if not exists public.printer_connector_types",
  "create table if not exists public.printer_brand_connector_suggestions",
  "create table if not exists public.printers",
  "create table if not exists public.printer_status_snapshots",
  "create table if not exists public.printer_order_links",
  "create table if not exists public.printer_events",
  "create table if not exists public.local_agents",
  "create table if not exists public.local_agent_printers",
  "credential_ciphertext text",
  "supports_remote_control is false",
  "alter table public.printers enable row level security",
  "grant insert, update, delete on public.printers",
  "to service_role",
  "'printer_remote_control'",
  '"enabled":false'
].forEach((marker) => assert.ok(migration.includes(marker), `migration deve conter ${marker}`));

assert.doesNotMatch(migration, /using\s*\(\s*true\s*\)|with check\s*\(\s*true\s*\)/i, "RLS nao pode ser aberta");
assert.doesNotMatch(migration, /grant\s+(insert|update|delete|all)[^;]+to\s+authenticated/i, "frontend nao pode escrever diretamente");

[
  'action === "list"',
  'action === "save"',
  'action === "test_connection"',
  'action === "fetch_status"',
  'action === "manual_status"',
  'action === "link_order"',
  'action === "history"',
  'action === "disable"',
  'action === "create_agent"',
  'action === "agent_status"',
  "AES-GCM",
  "PRINTER_CREDENTIALS_SECRET",
  "LOCAL_NETWORK_REQUIRES_AGENT",
  "local_agent_printers",
  "read_only: true"
].forEach((marker) => assert.ok(edge.includes(marker), `edge function deve conter ${marker}`));

const forbiddenActions = [
  "start_print",
  "pause_print",
  "resume_print",
  "cancel_print",
  "send_file",
  "set_temperature",
  "move_axis",
  "run_gcode"
];
forbiddenActions.forEach((action) => {
  assert.doesNotMatch(edge, new RegExp(`action\\s*===\\s*["']${action}["']`, "i"), `acao proibida encontrada: ${action}`);
  assert.doesNotMatch(app, new RegExp(`onclick=["'][^"']*${action}`, "i"), `botao proibido encontrado: ${action}`);
});

assert.doesNotMatch(edge, /fetch\([^)]*\/api\/(printer|job)[^)]*,\s*\{[^}]*method:\s*["']POST/i, "OctoPrint deve ser somente leitura");
assert.doesNotMatch(edge, /printer\/gcode\/script|move\/axis|temperature\/set/i, "Moonraker nao pode receber comandos");
assert.ok(localAgent.includes("Somente leitura"), "agente local deve declarar modo somente leitura");
assert.ok(localAgent.includes('action: "agent_status"'), "agente local deve enviar apenas snapshots");
assert.doesNotMatch(localAgent, /createServer|listen\s*\(/, "agente local nao deve abrir porta");

console.log("Printer monitoring read-only tests OK");
