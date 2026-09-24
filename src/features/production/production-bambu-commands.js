(function attachProductionBambuCommands(global) {
  "use strict";


function getImpressoesExternasMonitoradas(context = {}) {
  const { getImpressorasAtivas, getPrinterCurrentStatus, getRegisteredPrinterForProductionJob, productionJobs } = context;
  return getImpressorasAtivas().filter((printer) => {
    if (getPrinterCurrentStatus(printer) !== "printing") return false;
    return !productionJobs.some((job) => {
      if (!["em_impressao", "pausado"].includes(job.status)) return false;
      return String(getRegisteredPrinterForProductionJob(job)?.id || "") === String(printer.id);
    });
  });
}

function renderImpressaoExternaMonitorada(impressora = {}, context = {}) {
  const { escaparAttr, escaparHtml, getPrinterMonitoringService, getPrinterProgressValue } = context;
  const latest = impressora.latest_status || {};
  const progresso = getPrinterProgressValue(latest.progress_percent);
  return `<article class="production-job-card production-status-em_impressao" data-printer-live-id="${escaparAttr(impressora.id)}">
    <div class="production-job-head"><div><span class="eyebrow">Impressão detectada</span><h3 data-printer-live="production-task">${escaparHtml(latest.current_file || "Impressão em andamento")}</h3></div><span class="status-badge">Imprimindo</span></div>
    <div class="production-job-meta"><span><small>Impressora</small><strong>${escaparHtml(impressora.name || "Bambu")}</strong></span><span><small>Progresso</small><strong data-printer-live="progress-text">${Number.isFinite(progresso) ? `${Math.round(progresso)}%` : "—"}</strong></span><span><small>Tempo restante</small><strong data-printer-live="remaining">${escaparHtml(getPrinterMonitoringService()?.formatDuration(latest.remaining_seconds) || "—")}</strong></span></div>
    <p class="muted">Impressão iniciada fora do Simplifica · nenhum pedido vinculado.</p>
    <div class="production-job-actions"><button class="btn" type="button" onclick="abrirVinculoImpressaoBambuPedido('${escaparAttr(impressora.id)}')">Vincular ao pedido</button><button class="btn secondary" type="button" onclick="abrirPainelImpressora('${escaparAttr(impressora.id)}')">Abrir monitoramento</button></div>
  </article>`;
}

function getTarefaVinculadaImpressoraBambu(printerId = "", context = {}) {
  const { productionJobs } = context;
  return productionJobs.find((job) => String(job.bambuPrinterId || job.bambu_printer_id || "") === String(printerId)
    && !["pronto_para_entrega", "entregue", "cancelado"].includes(job.status)) || null;
}

function abrirVinculoImpressaoBambuPedido(printerId = "", jobId = "", context = {}) {
  const { document, escaparAttr, escaparHtml, getPrinterById, getProductionJob, mostrarToast, productionJobs } = context;
  const impressora = getPrinterById(printerId);
  const vinculoAtual = getProductionJob(jobId);
  const candidatas = productionJobs.filter((job) => !["pronto_para_entrega", "entregue", "cancelado"].includes(job.status));
  const popup = document.getElementById("popup");
  if (!impressora || !popup) return;
  if (!candidatas.length) return mostrarToast("Não há pedidos ativos na fila para vincular.", "info", 3600);
  const arquivo = impressora.latest_status?.current_file || "Impressão em andamento";
  const totalAtual = Math.max(1, Number(vinculoAtual?.printPlatesTotal || vinculoAtual?.print_plates_total) || 1);
  const variasMesas = totalAtual > 1;
  popup.innerHTML = `<div class="modal-backdrop" role="dialog" aria-modal="true" onclick="fecharPopup()"><form class="modal-card printer-link-print-modal" id="bambuOrderLinkForm" onclick="event.stopPropagation()"><div class="modal-header"><div><span class="eyebrow">${vinculoAtual ? "Editar vínculo" : "Vincular impressão"}</span><h2>${escaparHtml(arquivo)}</h2></div><button class="icon-button" type="button" onclick="fecharPopup()">✕</button></div><label class="field"><span>Pedido da fila</span><select id="bambuOrderJob" required ${vinculoAtual ? "disabled" : ""}><option value="">Selecione</option>${candidatas.map((job) => `<option value="${escaparAttr(job.id)}" ${String(job.id) === String(vinculoAtual?.id || "") ? "selected" : ""}>Pedido #${escaparHtml(job.orderId || "-")} · ${escaparHtml(job.itemName || "Item")}</option>`).join("")}</select></label><label class="printer-bambu-consent"><input id="bambuOrderMultiPlate" type="checkbox" ${variasMesas ? "checked" : ""} onchange="document.getElementById('bambuOrderPlatesField')?.toggleAttribute('hidden',!this.checked)"><span>Este pedido usa várias mesas/placas</span></label><label class="field" id="bambuOrderPlatesField" ${variasMesas ? "" : "hidden"}><span>Quantidade de mesas/placas</span><input id="bambuOrderPlates" type="number" min="2" max="999" value="${variasMesas ? totalAtual : 2}"></label><p class="muted">Com uma placa, a conclusão da máquina marca o pedido como impresso. Com várias, cada placa precisa ser confirmada até atingir a quantidade definida.</p><div class="printer-wizard-actions"><button class="btn ghost" type="button" onclick="fecharPopup()">Cancelar</button><button class="btn" type="submit">${vinculoAtual ? "Salvar vínculo" : "Vincular e acompanhar"}</button></div></form></div>`;
  document.getElementById("bambuOrderLinkForm")?.addEventListener("submit", (event) => vincularImpressaoBambuPedido(event, printerId, jobId, context));
}

function vincularImpressaoBambuPedido(event, printerId = "", jobId = "", context = {}) {
  const { document, fecharPopup, getPrinterById, getProductionJob, getRegisteredPrinterForProductionPrinter, mostrarToast, productionPrinters, registrarEventoProducao, renderizarPreservandoScroll, salvarProducaoManual } = context;
  event.preventDefault();
  const job = getProductionJob(jobId || document.getElementById("bambuOrderJob")?.value || "");
  const impressora = getPrinterById(printerId);
  if (!job || !impressora) return;
  const productionPrinter = productionPrinters.find((printer) => String(getRegisteredPrinterForProductionPrinter(printer)?.id || "") === String(printerId));
  job.printerId = job.printer_id = productionPrinter?.id || job.printerId || "";
  job.bambuPrinterId = job.bambu_printer_id = printerId;
  job.bambuCurrentFile = job.bambu_current_file = impressora.latest_status?.current_file || "";
  const variasMesas = document.getElementById("bambuOrderMultiPlate")?.checked === true;
  job.printPlatesTotal = job.print_plates_total = variasMesas ? Math.max(2, Number(document.getElementById("bambuOrderPlates")?.value) || 2) : 1;
  job.printPlatesCompleted = job.print_plates_completed = Number(job.printPlatesCompleted || job.print_plates_completed) || 0;
  const old = job.status;
  job.status = "em_impressao";
  job.updated_at = new Date().toISOString();
  registrarEventoProducao(job.id, jobId ? "bambu_vinculo_editado" : "bambu_vinculada", old, job.status, `${job.printPlatesTotal} placa(s) · Arquivo: ${job.bambuCurrentFile || "não informado"}`);
  salvarProducaoManual("bambu-vinculada-pedido");
  fecharPopup();
  renderizarPreservandoScroll();
  mostrarToast(jobId ? "Vínculo de impressão atualizado." : "Impressão vinculada ao pedido.", "sucesso");
}

function abrirConfirmacaoConclusaoImpressaoBambu(printerId = "", context = {}) {
  const { document, escaparAttr, escaparHtml } = context;
  const job = getTarefaVinculadaImpressoraBambu(printerId, context);
  const popup = document.getElementById("popup");
  if (!job || !popup) return;
  const concluidas = (Number(job.printPlatesCompleted || job.print_plates_completed) || 0) + 1;
  const total = Math.max(1, Number(job.printPlatesTotal || job.print_plates_total) || 1);
  if (total === 1) return confirmarConclusaoImpressaoBambu(job.id, context);
  popup.innerHTML = `<div class="modal-backdrop" role="dialog" aria-modal="true"><section class="modal-card printer-print-finish-modal"><div class="modal-header"><div><span class="eyebrow">Impressão finalizada</span><h2>${escaparHtml(job.itemName || "Pedido")}</h2></div></div><p>A Bambu terminou a placa ${Math.min(concluidas, total)} de ${total}. Confirme esta conclusão para atualizar a produção.</p><div class="printer-wizard-actions"><button class="btn ghost" type="button" onclick="fecharPopup();renderizarPreservandoScroll()">Ainda não</button><button class="btn" type="button" onclick="confirmarConclusaoImpressaoBambu('${escaparAttr(job.id)}')">Confirmar placa concluída</button></div></section></div>`;
}

function getResumoDesperdicioImpressora(printerId = "", context = {}) {
  const { productionJobs } = context;
  const jobs = productionJobs.filter((job) => String(job.bambuPrinterId || job.bambu_printer_id || "") === String(printerId));
  return jobs.reduce((total, job) => ({
    grams: total.grams + Math.max(0, Number(job.wasteGrams || job.waste_grams) || 0),
    minutes: total.minutes + Math.max(0, Number(job.wasteTimeMinutes || job.waste_time_minutes) || 0),
    cost: total.cost + Math.max(0, Number(job.wasteCost || job.waste_cost) || 0),
    attempts: total.attempts + (Array.isArray(job.wasteRecords) ? job.wasteRecords.length : 0)
  }), { grams: 0, minutes: 0, cost: 0, attempts: 0 });
}

function renderResumoDesperdicioImpressora(printerId = "", context = {}) {
  const { formatarMoeda, getPrinterMonitoringService } = context;
  const resumo = getResumoDesperdicioImpressora(printerId, context);
  if (!resumo.attempts) return "";
  const tempo = resumo.minutes > 0 ? (getPrinterMonitoringService()?.formatDuration(Math.round(resumo.minutes * 60)) || `${Math.round(resumo.minutes)} min`) : "—";
  return `<section class="printer-waste-summary"><div><span class="eyebrow">Resumo de perdas</span><strong>${resumo.attempts} ocorrência(s) registrada(s)</strong></div><div><span>Material</span><strong>${resumo.grams.toLocaleString("pt-BR", { maximumFractionDigits: 1 })} g</strong></div><div><span>Tempo</span><strong>${tempo}</strong></div><div><span>Custo estimado</span><strong>${formatarMoeda(resumo.cost)}</strong></div></section>`;
}

function getMaterialPerdidoImpressao(job = {}, context = {}) {
  const { getMaterialEstoque, getProductionItemMaterial, getProductionOrder, normalizarEstoque, normalizarItensPedido } = context;
  const pedido = getProductionOrder(job);
  const item = normalizarItensPedido(pedido || {})[Number(job.itemIndex ?? job.item_index) || 0] || {};
  const base = getProductionItemMaterial(item);
  const material = getMaterialEstoque(job.materialId || job.material_id || base.id) || normalizarEstoque().find((entry) => String(entry.nome || "").toLowerCase() === String(job.material || base.name || "").toLowerCase()) || {};
  return {
    ...material,
    id: material.id || job.materialId || job.material_id || base.id || "",
    nome: material.nome || job.material || base.name || "Material da impressão",
    unidade: material.unidade || material.unit || base.unit || "kg",
    custoUnitario: Math.max(0, Number(material.custoUnitario || material.unit_cost || base.unitCost) || 0),
    estimatedGrams: Math.max(0, Number(job.filamentWeightGrams || job.filament_weight_grams || base.grams) || 0)
  };
}

function calcularCustoDesperdicioImpressao(material = {}, grams = 0, minutes = 0, printerId = "", context = {}) {
  const { getBambuLanPrinter, getPrinterById, window } = context;
  const printer = getPrinterById(printerId) || getBambuLanPrinter(printerId) || {};
  return window.SimplificaPrinterPresentation.calcularCustoDesperdicioImpressao(material, grams, minutes, printer);
}

function abrirRegistroDesperdicioImpressao(printerId = "", jobId = "", context = {}) {
  const { document, escaparAttr, escaparHtml, getProductionJob, promoverPopupParaDialogUiV3 } = context;
  const job = getProductionJob(jobId) || getTarefaVinculadaImpressoraBambu(printerId, context);
  const popup = document.getElementById("popup");
  if (!job || !popup) return;
  const material = getMaterialPerdidoImpressao(job, context);
  const placas = Math.max(1, Number(job.printPlatesTotal || job.print_plates_total) || 1);
  const grams = Math.max(0, material.estimatedGrams / placas);
  const minutes = Math.max(0, (Number(job.estimatedPrintTimeMinutes || job.estimated_print_time_minutes) || 0) / placas);
  popup.innerHTML = `<div class="modal-backdrop" role="dialog" aria-modal="true"><form class="modal-card printer-print-finish-modal printer-waste-modal" id="printerWasteForm"><div class="modal-header"><div><span class="eyebrow">Impressão interrompida</span><h2>Registrar perda desta tentativa</h2></div></div><p>Confirme a estimativa para manter o histórico e o estoque coerentes. O material já foi baixado ao liberar o pedido; este registro o classifica como desperdício, sem uma segunda baixa.</p><div class="printer-waste-inputs"><label class="field"><span>Material perdido (g)</span><input id="printerWasteGrams" type="number" min="0" step="0.1" value="${escaparAttr(grams.toFixed(1))}"></label><label class="field"><span>Tempo perdido (min)</span><input id="printerWasteMinutes" type="number" min="0" step="1" value="${escaparAttr(Math.round(minutes))}"></label></div><p class="printer-waste-estimate" id="printerWasteEstimate">Material: ${escaparHtml(material.nome)} · custo estimado será calculado ao registrar.</p><label class="field"><span>Observação</span><input id="printerWasteReason" maxlength="280" placeholder="Ex.: descolou da mesa"></label><div class="printer-wizard-actions"><button class="btn ghost" type="button" onclick="fecharPopup();renderizarPreservandoScroll()">Ignorar por agora</button><button class="btn" type="submit">Registrar desperdício</button></div></form></div>`;
  promoverPopupParaDialogUiV3(popup, { title: "Registrar desperdício" });
  document.getElementById("printerWasteForm")?.addEventListener("submit", (event) => confirmarDesperdicioImpressao(event, printerId, job.id, context));
}

function confirmarDesperdicioImpressao(event, printerId = "", jobId = "", context = {}) {
  const { InventoryService, document, fecharPopup, formatarMoeda, getProductionJob, mostrarToast, registrarEventoProducao, renderizarPreservandoScroll, salvarProducaoManual } = context;
  event.preventDefault();
  const job = getProductionJob(jobId);
  if (!job) return;
  const grams = Math.max(0, Number(document.getElementById("printerWasteGrams")?.value) || 0);
  const minutes = Math.max(0, Number(document.getElementById("printerWasteMinutes")?.value) || 0);
  const material = getMaterialPerdidoImpressao(job, context);
  const reason = String(document.getElementById("printerWasteReason")?.value || "Falha ou cancelamento da impressão").trim();
  const cost = calcularCustoDesperdicioImpressao(material, grams, minutes, printerId, context);
  const key = `printer_waste:${job.id}:${Number(job.printFailedAttempts || job.print_failed_attempts) || 1}`;
  if (Array.isArray(job.wasteRecords) && job.wasteRecords.some((item) => item.idempotencyKey === key)) return;
  const now = new Date().toISOString();
  const record = { idempotencyKey: key, grams, minutes, cost, reason, created_at: now, printerId };
  job.wasteRecords = [...(Array.isArray(job.wasteRecords) ? job.wasteRecords : []), record];
  job.wasteGrams = job.waste_grams = (Number(job.wasteGrams || job.waste_grams) || 0) + grams;
  job.wasteTimeMinutes = job.waste_time_minutes = (Number(job.wasteTimeMinutes || job.waste_time_minutes) || 0) + minutes;
  job.wasteCost = job.waste_cost = (Number(job.wasteCost || job.waste_cost) || 0) + cost;
  job.updated_at = now;
  InventoryService.recordMovement(`Desperdício de impressão: ${material.nome} (${grams.toLocaleString("pt-BR", { maximumFractionDigits: 1 })} g)`, InventoryService.createMovementMetadata({ movementType: "desperdicio_impressao", material, quantity: 0, before: Number(material.qtd) || 0, after: Number(material.qtd) || 0, reason, orderId: job.orderId || job.order_id || "", orderItemId: job.itemIndex ?? job.item_index ?? "", printerId, productionId: job.id, wasteGrams: grams, wasteMinutes: minutes, wasteCost: cost, idempotencyKey: key }));
  registrarEventoProducao(job.id, "desperdicio_impressao_registrado", "reimpressao_necessaria", "reimpressao_necessaria", `${grams.toLocaleString("pt-BR", { maximumFractionDigits: 1 })} g · ${Math.round(minutes)} min · ${formatarMoeda(cost)} · ${reason}`);
  salvarProducaoManual("desperdicio-impressao-registrado");
  fecharPopup();
  renderizarPreservandoScroll();
  mostrarToast("Desperdício registrado no histórico e no estoque.", "sucesso", 4200);
}

function registrarFalhaImpressaoBambu(printerId = "", context = {}) {
  const { document, registrarEventoProducao, salvarProducaoManual } = context;
  const job = getTarefaVinculadaImpressoraBambu(printerId, context);
  const popup = document.getElementById("popup");
  if (!job) return;
  const old = job.status;
  job.printFailedAttempts = job.print_failed_attempts = (Number(job.printFailedAttempts || job.print_failed_attempts) || 0) + 1;
  job.status = "reimpressao_necessaria";
  job.updated_at = new Date().toISOString();
  registrarEventoProducao(job.id, "falha_bambu_detectada", old, job.status, "Impressão cancelada ou com erro; nenhuma mesa foi contabilizada");
  salvarProducaoManual("bambu-falha-detectada");
  if (!popup) return;
  abrirRegistroDesperdicioImpressao(printerId, job.id, context);
}

function prepararReimpressaoBambu(jobId = "", context = {}) {
  const { fecharPopup, getProductionJob, mostrarToast, registrarEventoProducao, renderizarPreservandoScroll, salvarProducaoManual } = context;
  const job = getProductionJob(jobId);
  if (!job) return;
  const old = job.status;
  job.status = "na_fila";
  job.updated_at = new Date().toISOString();
  registrarEventoProducao(job.id, "reimpressao_bambu_solicitada", old, job.status, "Mesma mesa aguardando nova tentativa");
  salvarProducaoManual("bambu-reimpressao-fila");
  fecharPopup();
  renderizarPreservandoScroll();
  mostrarToast("Mesa devolvida para a fila sem alterar as concluídas.", "sucesso");
}

function confirmarConclusaoImpressaoBambu(jobId = "", context = {}) {
  const { fecharPopup, getProductionJob, mostrarToast, registrarEventoProducao, renderizarPreservandoScroll, salvarProducaoManual } = context;
  const job = getProductionJob(jobId);
  if (!job) return;
  const old = job.status;
  const total = Math.max(1, Number(job.printPlatesTotal || job.print_plates_total) || 1);
  const completed = Math.min(total, (Number(job.printPlatesCompleted || job.print_plates_completed) || 0) + 1);
  job.printPlatesCompleted = job.print_plates_completed = completed;
  const concluido = completed >= total;
  job.status = concluido ? "pronto_para_entrega" : "na_fila";
  job.updated_at = new Date().toISOString();
  registrarEventoProducao(job.id, "mesa_bambu_finalizada", old, job.status, concluido ? `${completed}/${total} placa(s) confirmadas · Pedido marcado como impresso` : `${completed}/${total} placa(s) confirmadas · Aguardando as demais`);
  salvarProducaoManual("bambu-conclusao-confirmada");
  fecharPopup();
  renderizarPreservandoScroll();
  mostrarToast(concluido ? "Pedido movido para Pronto." : `Placa ${completed} de ${total} confirmada.`, "sucesso");
}
  const api = Object.freeze({ getImpressoesExternasMonitoradas, renderImpressaoExternaMonitorada, getTarefaVinculadaImpressoraBambu, abrirVinculoImpressaoBambuPedido, vincularImpressaoBambuPedido, abrirConfirmacaoConclusaoImpressaoBambu, getResumoDesperdicioImpressora, renderResumoDesperdicioImpressora, getMaterialPerdidoImpressao, calcularCustoDesperdicioImpressao, abrirRegistroDesperdicioImpressao, confirmarDesperdicioImpressao, registrarFalhaImpressaoBambu, prepararReimpressaoBambu, confirmarConclusaoImpressaoBambu });
  global.SimplificaProductionBambuCommands = api;
  if (typeof module !== "undefined" && module.exports) module.exports = api;
})(typeof window !== "undefined" ? window : globalThis);
