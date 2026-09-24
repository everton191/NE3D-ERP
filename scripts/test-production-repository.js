"use strict";

const assert = require("node:assert/strict");
const repo = require("../src/features/production/production-repository.js");

const isUuid = (value) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(String(value || ""));

assert.equal(
  repo.gerarUuidProducao({ crypto: { randomUUID: () => "11111111-1111-4111-8111-111111111111" } }),
  "11111111-1111-4111-8111-111111111111"
);
assert.match(
  repo.gerarUuidProducao({ crypto: {} }),
  /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/,
  "Fallback sem crypto.randomUUID deve gerar UUID v4 válido"
);

const productionPrinters = [{ id: "old-printer" }];
const productionJobs = [{ id: "old-job", printerId: "old-printer", printer_id: "old-printer", parentJobId: "", parent_job_id: "" }];
const productionEvents = [{ id: "evt-local", productionJobId: "old-job", production_job_id: "old-job" }];
repo.normalizarIdsProducaoParaSupabase({ pareceUuid: isUuid, productionPrinters, productionJobs, productionEvents, crypto: {} });
assert.notEqual(productionPrinters[0].id, "old-printer", "Impressora local sem UUID deve ser remapeada");
assert.equal(productionJobs[0].printerId, productionPrinters[0].id, "Referência de impressora deve seguir o novo id");
assert.equal(productionJobs[0].printer_id, productionPrinters[0].id);
assert.notEqual(productionEvents[0].id, "evt-local", "Evento local sem UUID deve ser remapeado");
assert.equal(productionEvents[0].productionJobId, productionJobs[0].id, "Referência de tarefa deve seguir o novo id");

const syncConfig = { supabaseUserId: "33333333-3333-4333-8333-333333333333" };
const printerPayload = repo.payloadImpressoraProducao(
  { id: "p1", name: " Bambu ", bedSize: "256 × 256 × 256", isActive: true, status: "disponivel" },
  "company-1",
  { pareceUuid: isUuid, syncConfig }
);
assert.equal(printerPayload.company_id, "company-1");
assert.equal(printerPayload.name, "Bambu");
assert.equal(printerPayload.bed_size_x, 256);
assert.equal(printerPayload.bed_size_y, 256);
assert.equal(printerPayload.is_active, true);
assert.equal(printerPayload.created_by, syncConfig.supabaseUserId);

const jobPayload = repo.payloadTarefaProducao(
  { id: "j1", orderId: "o1", itemName: " Peça ", quantity: 2, productionCode: "PROD-1", printerId: "not-a-uuid", actualPrintTimeMinutes: 12, priority: "alta", priority_reason: "cliente" },
  "c1",
  { pareceUuid: isUuid, syncConfig }
);
assert.equal(jobPayload.order_id, "o1");
assert.equal(jobPayload.item_name, " Peça ", "item_name preserva o valor original sem trim (contrato existente)");
assert.equal(jobPayload.printer_id, null, "printer_id não-UUID deve ir como null");
assert.equal(jobPayload.actual_print_time_minutes, 12);
assert.equal(jobPayload.priority, "alta");
assert.equal(jobPayload.updated_by, syncConfig.supabaseUserId);

const eventPayload = repo.payloadEventoProducao(
  { id: "e1", productionJobId: "j1", eventType: "status_alterado", oldStatus: "a", newStatus: "b", note: " x " },
  "c1",
  { pareceUuid: isUuid, syncConfig, getProductionJob: () => ({ orderId: "order-9" }) }
);
assert.equal(eventPayload.production_job_id, "j1");
assert.equal(eventPayload.order_id, "order-9");
assert.equal(eventPayload.event_type, "status_alterado");
assert.equal(eventPayload.note, "x");

assert.deepEqual(repo.extrairDimensoesMesaProducao("256 × 256 × 256"), { x: 256, y: 256, z: 256 });
assert.deepEqual(repo.extrairDimensoesMesaProducao(""), { x: null, y: null, z: null });

const mappedJob = repo.mapearTarefaProducaoRemota({ id: "x", company_id: "c", order_id: "o1", item_index: 2, waste_records: null, priority_reason: "just" });
assert.equal(mappedJob.orderId, "o1");
assert.equal(mappedJob.itemIndex, 2);
assert.deepEqual(mappedJob.wasteRecords, []);
assert.equal(mappedJob.priorityReason, "just");
const mappedPrinter = repo.mapearImpressoraProducaoRemota({ company_id: "c", printer_type: "fdm", bed_size_x: 1, bed_size_y: 2, bed_size_z: 3, is_active: false });
assert.equal(mappedPrinter.companyId, "c");
assert.equal(mappedPrinter.bedSize, "1 × 2 × 3");
assert.equal(mappedPrinter.isActive, false);
const mappedEvent = repo.mapearEventoProducaoRemoto({ company_id: "c", production_job_id: "j", event_type: "x", old_status: "a", new_status: "b" });
assert.equal(mappedEvent.eventType, "x");
assert.equal(mappedEvent.newStatus, "b");

(async () => {
  const requestLog = [];
  const guardOff = await repo.sincronizarProducaoManualSupabaseSilencioso({
    getProductionCompanyId: () => "11111111-1111-4111-8111-111111111111",
    pareceUuid: isUuid,
    syncConfig: { supabaseAccessToken: "", supabaseUserId: "" },
    estaOnline: () => true,
    requisicaoSupabase: async (url) => { requestLog.push(url); return []; },
    productionPrinters: [], productionJobs: [], productionEvents: [],
    salvarDados: () => {}, crypto: {}
  });
  assert.equal(guardOff, false, "Sem token/usuário a sincronização deve retornar false");
  assert.equal(requestLog.length, 0, "Nenhuma requisição pode ocorrer sem credenciais");

  const online = await repo.sincronizarProducaoManualSupabaseSilencioso({
    getProductionCompanyId: () => "11111111-1111-4111-8111-111111111111",
    pareceUuid: isUuid,
    syncConfig: { supabaseAccessToken: "token", supabaseUserId: "33333333-3333-4333-8333-333333333333" },
    estaOnline: () => true,
    requisicaoSupabase: async (url) => { requestLog.push(url); return []; },
    productionPrinters: [{ id: "11111111-1111-4111-8111-111111111111", name: "P" }],
    productionJobs: [{ id: "22222222-2222-4222-8222-222222222222", orderId: "o1" }],
    productionEvents: [{ id: "44444444-4444-4444-8444-444444444444", productionJobId: "22222222-2222-4222-8222-222222222222" }],
    getProductionJob: () => null,
    salvarDados: () => {}, crypto: {}
  });
  assert.equal(online, true);
  assert.ok(requestLog.some((url) => url.includes("/rest/v1/production_printers?on_conflict=id")));
  assert.ok(requestLog.some((url) => url.includes("/rest/v1/production_jobs?on_conflict=id")));
  assert.ok(requestLog.some((url) => url.includes("/rest/v1/production_events?on_conflict=id")));

  const loadGuard = await repo.carregarProducaoManualSupabaseSilencioso({
    getProductionCompanyId: () => "not-uuid",
    pareceUuid: isUuid,
    syncConfig: { supabaseAccessToken: "t", supabaseUserId: "u" },
    estaOnline: () => true,
    requisicaoSupabase: async () => [],
    productionPrinters: [], productionJobs: [], productionEvents: [],
    mesclarListas: (a, b) => [...a, ...b],
    sincronizarImpressorasMonitoradasComProducao: () => {},
    salvarDados: () => {},
    setProductionPrinters: () => {}, setProductionJobs: () => {}, setProductionEvents: () => {}
  });
  assert.equal(loadGuard, false, "Sem UUID de empresa a carga deve retornar false");

  let setPrinters, setJobs, setEvents, mergedPrinters = false, savedAfterLoad = false, printerSynced = false;
  const loadOk = await repo.carregarProducaoManualSupabaseSilencioso({
    getProductionCompanyId: () => "11111111-1111-4111-8111-111111111111",
    pareceUuid: isUuid,
    syncConfig: { supabaseAccessToken: "token", supabaseUserId: "33333333-3333-4333-8333-333333333333" },
    estaOnline: () => true,
    requisicaoSupabase: async (url) => {
      if (url.includes("production_printers")) return [{ id: "r-printer", company_id: "c", is_active: true }];
      if (url.includes("production_jobs")) return [{ id: "r-job", company_id: "c", order_id: "o1" }];
      return [{ id: "r-event", company_id: "c", production_job_id: "r-job" }];
    },
    productionPrinters: [{ id: "local-p" }],
    productionJobs: [{ id: "local-j" }],
    productionEvents: [],
    mesclarListas: (local, remote) => { mergedPrinters = true; return [...local, ...remote]; },
    sincronizarImpressorasMonitoradasComProducao: () => { printerSynced = true; },
    salvarDados: () => { savedAfterLoad = true; },
    setProductionPrinters: (valor) => { setPrinters = valor; },
    setProductionJobs: (valor) => { setJobs = valor; },
    setProductionEvents: (valor) => { setEvents = valor; }
  });
  assert.equal(loadOk, true);
  assert.ok(mergedPrinters);
  assert.ok(printerSynced, "Carga deve sincronizar impressoras monitoradas");
  assert.ok(savedAfterLoad, "Carga deve salvar dados locais");
  assert.equal(setPrinters.length, 2, "Impressoras remotas devem ser mescladas às locais");
  assert.equal(setJobs.length, 2);
  assert.equal(setEvents.length, 1);
  assert.equal(setJobs[1].orderId, "o1", "Tarefa remota deve ser mapeada para o formato local");

  const saveCalls = [];
  const fakeWindow = {};
  repo.salvarProducaoManual("motivo-teste", {
    salvarDados: () => saveCalls.push("salvarDados"),
    agendarSyncSilenciosoDados: (motivo) => saveCalls.push(`sync:${motivo}`),
    registrarDiagnostico: () => {},
    window: fakeWindow
  });
  assert.deepEqual(saveCalls, ["salvarDados", "sync:motivo-teste"]);
  assert.ok(fakeWindow.__productionRemoteSyncTimer, "Salvar deve agendar o sync remoto");
  clearTimeout(fakeWindow.__productionRemoteSyncTimer);

  console.log("Production repository: uuid, ids, payloads, mapeamentos, guards, carga e save validados.");
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
