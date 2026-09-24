(function attachProductionRepository(global) {
  "use strict";


function gerarUuidProducao(context = {}) {
  const { crypto } = context;
  try {
    if (crypto?.randomUUID) return crypto.randomUUID();
  } catch (_) {}
  const bytes = Array.from({ length: 16 }, () => Math.floor(Math.random() * 256));
  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  const hex = bytes.map((value) => value.toString(16).padStart(2, "0")).join("");
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

function normalizarIdsProducaoParaSupabase(context = {}) {
  const { pareceUuid, productionEvents, productionJobs, productionPrinters } = context;
  const printerIds = new Map();
  productionPrinters.forEach((printer) => {
    const anterior = String(printer.id || "");
    const atual = pareceUuid(anterior) ? anterior : gerarUuidProducao(context);
    printer.id = atual;
    if (anterior && anterior !== atual) printerIds.set(anterior, atual);
  });

  const jobIds = new Map();
  productionJobs.forEach((job) => {
    const anterior = String(job.id || "");
    const atual = pareceUuid(anterior) ? anterior : gerarUuidProducao(context);
    job.id = atual;
    if (anterior && anterior !== atual) jobIds.set(anterior, atual);
  });

  productionJobs.forEach((job) => {
    const printerId = String(job.printerId || job.printer_id || "");
    const parentId = String(job.parentJobId || job.parent_job_id || "");
    if (printerIds.has(printerId)) job.printerId = job.printer_id = printerIds.get(printerId);
    if (jobIds.has(parentId)) job.parentJobId = job.parent_job_id = jobIds.get(parentId);
  });

  productionEvents.forEach((event) => {
    const jobId = String(event.productionJobId || event.production_job_id || "");
    event.id = pareceUuid(event.id) ? event.id : gerarUuidProducao(context);
    if (jobIds.has(jobId)) event.productionJobId = event.production_job_id = jobIds.get(jobId);
  });
}

function extrairDimensoesMesaProducao(valor = "", context = {}) {
  const dimensoes = String(valor || "").replace(",", ".").match(/\d+(?:\.\d+)?/g) || [];
  return {
    x: dimensoes[0] ? Number(dimensoes[0]) : null,
    y: dimensoes[1] ? Number(dimensoes[1]) : null,
    z: dimensoes[2] ? Number(dimensoes[2]) : null
  };
}

function payloadImpressoraProducao(printer, companyId, context = {}) {
  const { pareceUuid, syncConfig } = context;
  const mesa = extrairDimensoesMesaProducao(printer.bedSize || printer.bed_size || "", context);
  return {
    id: printer.id,
    company_id: companyId,
    name: String(printer.name || "").trim(),
    description: String(printer.description || "").trim() || null,
    printer_type: printer.printerType || printer.printer_type || "fdm",
    nozzle_size: String(printer.nozzleSize || printer.nozzle_size || "").trim() || null,
    bed_size_x: mesa.x,
    bed_size_y: mesa.y,
    bed_size_z: mesa.z,
    supported_materials: Array.isArray(printer.supportedMaterials) ? printer.supportedMaterials : [],
    status: printer.status || "disponivel",
    is_active: printer.isActive !== false && printer.is_active !== false,
    notes: String(printer.notes || "").trim() || null,
    created_by: pareceUuid(syncConfig.supabaseUserId) ? syncConfig.supabaseUserId : null,
    updated_by: pareceUuid(syncConfig.supabaseUserId) ? syncConfig.supabaseUserId : null,
    created_at: printer.created_at || new Date().toISOString(),
    updated_at: printer.updated_at || new Date().toISOString()
  };
}

function payloadTarefaProducao(job, companyId, context = {}) {
  const { pareceUuid, syncConfig } = context;
  const printerId = job.printerId || job.printer_id || null;
  const parentId = job.parentJobId || job.parent_job_id || null;
  return {
    id: job.id,
    company_id: companyId,
    order_id: String(job.orderId || job.order_id || ""),
    item_index: Math.max(0, Number(job.itemIndex ?? job.item_index) || 0),
    item_name: String(job.itemName || job.item_name || "Item de produção"),
    quantity: Math.max(0.001, Number(job.quantity) || 1),
    production_code: String(job.productionCode || job.production_code || ""),
    status: job.status || "novo_pedido",
    printer_id: pareceUuid(printerId) ? printerId : null,
    parent_job_id: pareceUuid(parentId) ? parentId : null,
    material: String(job.material || "").trim() || null,
    color: String(job.color || "").trim() || null,
    filament_weight_grams: Number(job.filamentWeightGrams ?? job.filament_weight_grams) || null,
    estimated_print_time_minutes: Number(job.estimatedPrintTimeMinutes ?? job.estimated_print_time_minutes) || null,
    actual_print_time_minutes: Number(job.actualPrintTimeMinutes ?? job.actual_print_time_minutes) || null,
    waste_grams: Number(job.wasteGrams ?? job.waste_grams) || 0,
    waste_time_minutes: Number(job.wasteTimeMinutes ?? job.waste_time_minutes) || 0,
    waste_cost: Number(job.wasteCost ?? job.waste_cost) || 0,
    waste_records: Array.isArray(job.wasteRecords) ? job.wasteRecords : [],
    priority: job.priority || "normal",
    priority_reason: String(job.priorityReason || job.priority_reason || "").trim() || null,
    blocked_reason: String(job.blockedReason || job.blocked_reason || "").trim() || null,
    queue_position: Number(job.queuePosition ?? job.queue_position) || null,
    due_date: job.dueDate || job.due_date || null,
    production_notes: String(job.productionNotes || job.production_notes || "").trim() || null,
    released_at: job.releasedAt || job.released_at || null,
    assigned_at: job.assignedAt || job.assigned_at || null,
    started_at: job.started_at || null,
    paused_at: job.paused_at || null,
    finished_at: job.finished_at || null,
    failed_at: job.failed_at || null,
    created_by: pareceUuid(syncConfig.supabaseUserId) ? syncConfig.supabaseUserId : null,
    updated_by: pareceUuid(syncConfig.supabaseUserId) ? syncConfig.supabaseUserId : null,
    created_at: job.created_at || new Date().toISOString(),
    updated_at: job.updated_at || new Date().toISOString()
  };
}

function payloadEventoProducao(event, companyId, context = {}) {
  const { getProductionJob, pareceUuid, syncConfig } = context;
  return {
    id: event.id,
    company_id: companyId,
    production_job_id: event.productionJobId || event.production_job_id,
    order_id: String(event.orderId || event.order_id || getProductionJob(event.productionJobId || event.production_job_id)?.orderId || "") || null,
    event_type: event.eventType || event.event_type || "atualizacao",
    old_status: String(event.oldStatus || event.old_status || "").trim() || null,
    new_status: String(event.newStatus || event.new_status || "").trim() || null,
    note: String(event.note || "").trim() || null,
    created_by: pareceUuid(syncConfig.supabaseUserId) ? syncConfig.supabaseUserId : null,
    created_at: event.created_at || new Date().toISOString()
  };
}

async function sincronizarProducaoManualSupabaseSilencioso(context = {}) {
  const { estaOnline, getProductionCompanyId, pareceUuid, productionEvents, productionJobs, productionPrinters, requisicaoSupabase, salvarDados, syncConfig } = context;
  const companyId = getProductionCompanyId();
  if (!pareceUuid(companyId) || !syncConfig.supabaseAccessToken || !syncConfig.supabaseUserId || !estaOnline()) return false;
  normalizarIdsProducaoParaSupabase(context);
  salvarDados();
  const headers = { Prefer: "resolution=merge-duplicates,return=minimal" };
  if (productionPrinters.length) {
    await requisicaoSupabase("/rest/v1/production_printers?on_conflict=id", {
      method: "POST",
      headers,
      body: JSON.stringify(productionPrinters.map((printer) => payloadImpressoraProducao(printer, companyId, context))),
      telemetry: false
    });
  }
  if (productionJobs.length) {
    await requisicaoSupabase("/rest/v1/production_jobs?on_conflict=id", {
      method: "POST",
      headers,
      body: JSON.stringify(productionJobs.map((job) => payloadTarefaProducao(job, companyId, context))),
      telemetry: false
    });
  }
  if (productionEvents.length) {
    await requisicaoSupabase("/rest/v1/production_events?on_conflict=id", {
      method: "POST",
      headers,
      body: JSON.stringify(productionEvents.map((event) => payloadEventoProducao(event, companyId, context))),
      telemetry: false
    });
  }
  return true;
}

function mapearImpressoraProducaoRemota(printer = {}, context = {}) {
  return {
    ...printer,
    companyId: printer.company_id,
    printerType: printer.printer_type,
    nozzleSize: printer.nozzle_size,
    bedSize: [printer.bed_size_x, printer.bed_size_y, printer.bed_size_z].filter((value) => value != null).join(" × "),
    supportedMaterials: printer.supported_materials || [],
    isActive: printer.is_active
  };
}

function mapearTarefaProducaoRemota(job = {}, context = {}) {
  return {
    ...job,
    companyId: job.company_id,
    orderId: job.order_id,
    itemIndex: job.item_index,
    itemName: job.item_name,
    productionCode: job.production_code,
    printerId: job.printer_id || "",
    parentJobId: job.parent_job_id || "",
    filamentWeightGrams: job.filament_weight_grams,
    estimatedPrintTimeMinutes: job.estimated_print_time_minutes,
    actualPrintTimeMinutes: job.actual_print_time_minutes,
    wasteGrams: job.waste_grams,
    wasteTimeMinutes: job.waste_time_minutes,
    wasteCost: job.waste_cost,
    wasteRecords: Array.isArray(job.waste_records) ? job.waste_records : [],
    priorityReason: job.priority_reason,
    blockedReason: job.blocked_reason,
    queuePosition: job.queue_position,
    dueDate: job.due_date,
    productionNotes: job.production_notes,
    releasedAt: job.released_at,
    assignedAt: job.assigned_at
  };
}

function mapearEventoProducaoRemoto(event = {}, context = {}) {
  return {
    ...event,
    companyId: event.company_id,
    productionJobId: event.production_job_id,
    orderId: event.order_id,
    eventType: event.event_type,
    oldStatus: event.old_status,
    newStatus: event.new_status
  };
}

async function carregarProducaoManualSupabaseSilencioso(context = {}) {
  const {
    getProductionCompanyId, pareceUuid, syncConfig, estaOnline, requisicaoSupabase,
    productionPrinters, productionJobs, productionEvents, mesclarListas,
    sincronizarImpressorasMonitoradasComProducao, salvarDados,
    setProductionPrinters, setProductionJobs, setProductionEvents
  } = context;
  const companyId = getProductionCompanyId();
  if (!pareceUuid(companyId) || !syncConfig.supabaseAccessToken || !syncConfig.supabaseUserId || !estaOnline()) return false;
  const filtro = `company_id=eq.${encodeURIComponent(companyId)}`;
  const [printers, jobs, events] = await Promise.all([
    requisicaoSupabase(`/rest/v1/production_printers?${filtro}&order=updated_at.asc`, { telemetry: false }),
    requisicaoSupabase(`/rest/v1/production_jobs?${filtro}&order=updated_at.asc`, { telemetry: false }),
    requisicaoSupabase(`/rest/v1/production_events?${filtro}&order=created_at.asc&limit=800`, { telemetry: false })
  ]);
  setProductionPrinters(mesclarListas(productionPrinters, (printers || []).map((item) => mapearImpressoraProducaoRemota(item, context))).slice(-100));
  setProductionJobs(mesclarListas(productionJobs, (jobs || []).map((item) => mapearTarefaProducaoRemota(item, context))).slice(-1000));
  setProductionEvents(mesclarListas(productionEvents, (events || []).map((item) => mapearEventoProducaoRemoto(item, context))).slice(-800));
  sincronizarImpressorasMonitoradasComProducao();
  salvarDados();
  return true;
}

function salvarProducaoManual(motivo = "producao-manual", context = {}) {
  const { salvarDados, agendarSyncSilenciosoDados, registrarDiagnostico, window: win } = context;
  salvarDados();
  agendarSyncSilenciosoDados(motivo);
  if (typeof win !== "undefined") {
    clearTimeout(win.__productionRemoteSyncTimer);
    win.__productionRemoteSyncTimer = setTimeout(() => {
      sincronizarProducaoManualSupabaseSilencioso(context).catch((erro) => {
        registrarDiagnostico("produção", "Sincronização da produção manual falhou", erro.message);
      });
    }, 900);
  }
}
  const api = Object.freeze({ gerarUuidProducao, normalizarIdsProducaoParaSupabase, extrairDimensoesMesaProducao, payloadImpressoraProducao, payloadTarefaProducao, payloadEventoProducao, sincronizarProducaoManualSupabaseSilencioso, mapearImpressoraProducaoRemota, mapearTarefaProducaoRemota, mapearEventoProducaoRemoto, carregarProducaoManualSupabaseSilencioso, salvarProducaoManual });
  global.SimplificaProductionRepository = api;
  if (typeof module !== "undefined" && module.exports) module.exports = api;
})(typeof window !== "undefined" ? window : globalThis);
