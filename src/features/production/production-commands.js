(function attachProductionCommands(global) {
  "use strict";


function validarPedidoParaProducao(pedido = {}, context = {}) {
  const { clienteDoPedido, getProductionItemMaterial, normalizarItensPedido } = context;
  const faltas = [];
  const itens = normalizarItensPedido(pedido);
  if (!String(clienteDoPedido(pedido) || "").trim()) faltas.push("cliente");
  if (!itens.length) faltas.push("item");
  if (itens.some((item) => (Number(item.qtd) || 0) <= 0)) faltas.push("quantidade");
  if (!String(pedido.prazo || pedido.dataPrazo || "").trim()) faltas.push("prazo de entrega");
  if (itens.some((item) => {
    const exigeMaterial = /fdm|resina|impress/i.test(String(item.tipoImpressao || item.tipo || ""));
    return exigeMaterial && !getProductionItemMaterial(item).name;
  })) faltas.push("material");
  return faltas;
}

function pedidoTemPagamentoLiberadoProducao(pedido = {}, context = {}) {
  const { calcularResumoFinanceiroPedido } = context;
  const financeiro = calcularResumoFinanceiroPedido(pedido);
  return ["pago", "paid", "confirmado"].includes(String(pedido.statusPagamento || pedido.payment_status || pedido.status || "").toLowerCase())
    || financeiro.restante <= 0
    || pedido.productionPaymentAuthorized === true;
}

function abrirLiberacaoProducao(id, context = {}) {
  const { PRODUCTION_PENDING_REASONS, document, encontrarPedidoPorId, escaparAttr, escaparHtml, promoverPopupParaDialogUiV3 } = context;
  const pedido = encontrarPedidoPorId(id);
  if (!pedido) return;
  const faltas = validarPedidoParaProducao(pedido, context);
  const popup = document.getElementById("popup");
  if (!popup) return;
  popup.innerHTML = `
    <div class="modal-backdrop" role="dialog" aria-modal="true" onclick="fecharPopup()">
      <form class="modal-card production-release-modal" onsubmit="confirmarLiberacaoProducao(event,'${escaparAttr(pedido.id)}')" onclick="event.stopPropagation()">
        <div class="modal-header">
          <div><span class="eyebrow">Pedido #${escaparHtml(pedido.id)}</span><h2>Liberar para produção</h2></div>
          <button class="icon-button" type="button" onclick="fecharPopup()" title="Fechar">✕</button>
        </div>
        ${faltas.length ? `<p class="production-validation-error">Este pedido ainda não pode entrar na produção. Falta definir: ${escaparHtml(faltas.join(", "))}.</p>` : ""}
        <div class="production-check-list">
          <label><input id="productionPaymentAuthorized" type="checkbox" ${pedidoTemPagamentoLiberadoProducao(pedido, context) ? "checked" : ""}> <span>Pagamento confirmado ou autorizado</span></label>
          <label><input id="productionFileChecked" type="checkbox"> <span>Arquivo/modelo conferido, quando aplicável</span></label>
          <label><input id="productionMaterialSeparated" type="checkbox"> <span>Material disponível ou separado</span></label>
        </div>
        <label class="field"><span>Observação de produção</span><textarea id="productionReleaseNotes" rows="2" placeholder="Acabamento, orientação ou cuidado especial"></textarea></label>
        <label class="field"><span>Se ainda não estiver pronto, enviar para</span><select id="productionPendingReason">${Object.entries(PRODUCTION_PENDING_REASONS).map(([value, label]) => `<option value="${value}">${escaparHtml(label)}</option>`).join("")}</select></label>
        <div class="actions production-modal-actions">
          <button class="btn secondary" type="button" onclick="enviarPedidoPendenciaProducao('${escaparAttr(pedido.id)}')">Marcar pendente</button>
          <button class="btn" type="submit" ${faltas.length ? "disabled" : ""}>Liberar para produção</button>
        </div>
      </form>
    </div>`;
  promoverPopupParaDialogUiV3(popup, { title: "Liberar para produção" });
}

function enviarPedidoPendenciaProducao(orderId, context = {}) {
  const { PRODUCTION_PENDING_REASONS, clienteDoPedido, document, encontrarPedidoPorId, fecharPopup, gerarUuidProducao, getProductionCompanyId, normalizarItensPedido, productionJobs, registrarEventoProducao, salvarProducaoManual, trocarTela } = context;
  const pedido = encontrarPedidoPorId(orderId);
  if (!pedido) return;
  const motivo = document.getElementById("productionPendingReason")?.value || "outro";
  const agora = new Date().toISOString();
  const existente = productionJobs.find((job) => String(job.orderId) === String(orderId));
  if (existente) {
    const antigo = existente.status;
    Object.assign(existente, { status: "pendente", blockedReason: motivo, blocked_reason: motivo, updated_at: agora });
    registrarEventoProducao(existente.id, "pendencia_registrada", antigo, "pendente", PRODUCTION_PENDING_REASONS[motivo]);
  } else {
    const jobId = gerarUuidProducao();
    productionJobs.push({
      id: jobId,
      companyId: getProductionCompanyId(),
      company_id: getProductionCompanyId(),
      orderId: pedido.id,
      order_id: String(pedido.id),
      itemIndex: 0,
      itemName: normalizarItensPedido(pedido)[0]?.nome || "Pedido em preparação",
      quantity: 1,
      customer: clienteDoPedido(pedido),
      dueDate: pedido.prazo || pedido.dataPrazo || "",
      status: "pendente",
      blockedReason: motivo,
      blocked_reason: motivo,
      priority: "normal",
      created_at: agora,
      updated_at: agora
    });
    registrarEventoProducao(jobId, "pendencia_registrada", "", "pendente", PRODUCTION_PENDING_REASONS[motivo]);
  }
  pedido.productionStatus = "pendente";
  pedido.production_status = "pendente";
  salvarProducaoManual("producao-pendente");
  fecharPopup();
  trocarTela("producao");
}

function confirmarLiberacaoProducao(event, orderId, context = {}) {
  const { aplicarEstoquePedido, clienteDoPedido, document, encontrarPedidoPorId, fecharPopup, gerarCodigoProducao, gerarUuidProducao, getProductionCompanyId, getProductionItemMaterial, marcarRegistroLocalAlteradoParaSync, mostrarToast, normalizarItensPedido, productionJobs, registrarEventoProducao, salvarProducaoManual, trocarTela } = context;
  event?.preventDefault?.();
  const pedido = encontrarPedidoPorId(orderId);
  if (!pedido) return false;
  const faltas = validarPedidoParaProducao(pedido, context);
  const pagamento = document.getElementById("productionPaymentAuthorized")?.checked === true;
  const arquivo = document.getElementById("productionFileChecked")?.checked === true;
  const materialSeparado = document.getElementById("productionMaterialSeparated")?.checked === true;
  const notas = String(document.getElementById("productionReleaseNotes")?.value || "").trim();
  if (faltas.length || !pagamento || !arquivo || !materialSeparado) {
    mostrarToast(`Revise antes de liberar: ${[...faltas, !pagamento ? "pagamento" : "", !arquivo ? "arquivo" : "", !materialSeparado ? "material separado" : ""].filter(Boolean).join(", ")}.`, "aviso", 4200);
    return false;
  }
  const agora = new Date().toISOString();
  const itens = normalizarItensPedido(pedido);
  const ativos = productionJobs.filter((job) => String(job.orderId) === String(pedido.id) && job.status !== "cancelado");
  itens.forEach((item, itemIndex) => {
    if (ativos.some((job) => Number(job.itemIndex) === itemIndex && !["pendente", "novo_pedido"].includes(job.status))) return;
    const material = getProductionItemMaterial(item);
    const jobId = gerarUuidProducao();
    const productionCode = gerarCodigoProducao();
    productionJobs.push({
      id: jobId,
      companyId: getProductionCompanyId(),
      company_id: getProductionCompanyId(),
      orderId: pedido.id,
      order_id: String(pedido.id),
      itemIndex,
      item_index: itemIndex,
      itemName: item.nome || `Item ${itemIndex + 1}`,
      item_name: item.nome || `Item ${itemIndex + 1}`,
      quantity: Math.max(1, Number(item.qtd) || 1),
      customer: clienteDoPedido(pedido),
      material: material.name,
      materialId: material.id,
      material_id: material.id,
      color: material.color,
      filamentWeightGrams: material.grams,
      filament_weight_grams: material.grams,
      estimatedPrintTimeMinutes: Math.round((Number(item.tempoHoras) || 0) * 60),
      estimated_print_time_minutes: Math.round((Number(item.tempoHoras) || 0) * 60),
      dueDate: pedido.prazo || pedido.dataPrazo || "",
      due_date: pedido.prazo || pedido.dataPrazo || "",
      productionCode,
      production_code: productionCode,
      queuePosition: productionJobs.filter((job) => ["liberado_para_producao", "na_fila", "proximo", "aguardando_impressora"].includes(job.status)).length + 1,
      status: "na_fila",
      priority: "normal",
      productionNotes: notas,
      production_notes: notas,
      releasedAt: agora,
      released_at: agora,
      created_at: agora,
      updated_at: agora
    });
    registrarEventoProducao(jobId, "liberado_para_producao", "", "na_fila", notas);
  });
  const pedidoAtualizado = { ...pedido, status: "producao" };
  if (!aplicarEstoquePedido(pedidoAtualizado, pedido)) return false;
  marcarRegistroLocalAlteradoParaSync(pedido, {
    status: "producao",
    productionStatus: "na_fila",
    production_status: "na_fila",
    productionPaymentAuthorized: true,
    productionReleasedAt: agora,
    production_released_at: agora,
    stock_deducted_at: pedidoAtualizado.stock_deducted_at || "",
    estoqueBaixadoEm: pedidoAtualizado.estoqueBaixadoEm || ""
  });
  salvarProducaoManual("pedido-liberado-producao");
  fecharPopup();
  trocarTela("producao");
  mostrarToast("Pedido liberado e tarefas adicionadas à fila.", "sucesso", 3200);
  return true;
}

function compararTarefasProducao(a = {}, b = {}, context = {}) {
  const { hojeIsoData } = context;
  const hoje = hojeIsoData();
  const amanha = new Date(`${hoje}T12:00:00`);
  amanha.setDate(amanha.getDate() + 1);
  const amanhaIso = amanha.toISOString().slice(0, 10);
  const pesoPrazo = (job) => {
    const due = String(job.dueDate || job.due_date || "");
    if (due && due < hoje) return 0;
    if (due === hoje) return 1;
    if (due === amanhaIso) return 2;
    return 5;
  };
  const prioridade = { urgente: 0, alta: 1, normal: 2 };
  return pesoPrazo(a) - pesoPrazo(b)
    || (prioridade[a.priority] ?? 2) - (prioridade[b.priority] ?? 2)
    || String(a.releasedAt || a.released_at || a.created_at || "").localeCompare(String(b.releasedAt || b.released_at || b.created_at || ""));
}

function reordenarFilaProducao(context = {}) {
  const { productionJobs } = context;
  const fila = productionJobs.filter((job) => ["liberado_para_producao", "na_fila", "proximo", "aguardando_impressora"].includes(job.status)).sort((...__args) => compararTarefasProducao(...__args.slice(0, 2), context));
  fila.forEach((job, index) => {
    job.queuePosition = index + 1;
    job.queue_position = index + 1;
    if (index === 0 && job.status === "na_fila") job.status = "proximo";
    else if (index > 0 && job.status === "proximo") job.status = "na_fila";
  });
  return fila;
}

function alterarPrioridadeTarefaProducao(jobId, priority = "normal", context = {}) {
  const { getProductionJob, mostrarToast, prompt, registrarEventoProducao, renderizarPreservandoScroll, salvarProducaoManual } = context;
  const job = getProductionJob(jobId);
  if (!job) return;
  let reason = "";
  if (priority !== "normal") {
    reason = String(prompt("Informe a justificativa da prioridade:") || "").trim();
    if (!reason) {
      mostrarToast("A prioridade só pode ser alterada com justificativa.", "aviso");
      renderizarPreservandoScroll();
      return;
    }
  }
  const old = job.priority || "normal";
  job.priority = priority;
  job.priorityReason = reason;
  job.priority_reason = reason;
  job.updated_at = new Date().toISOString();
  registrarEventoProducao(job.id, "prioridade_alterada", old, priority, reason);
  reordenarFilaProducao(context);
  salvarProducaoManual("prioridade-producao");
  renderizarPreservandoScroll();
}

function atribuirImpressoraTarefa(jobId, printerId = "", context = {}) {
  const { getProductionJob, getProductionPrinterLabel, registrarEventoProducao, renderizarPreservandoScroll, salvarProducaoManual } = context;
  const job = getProductionJob(jobId);
  if (!job) return;
  const old = job.printerId || "";
  job.printerId = printerId;
  job.printer_id = printerId || null;
  job.assignedAt = printerId ? new Date().toISOString() : "";
  job.assigned_at = job.assignedAt;
  if (!printerId && job.status === "em_impressao") job.status = "aguardando_impressora";
  registrarEventoProducao(job.id, "impressora_atribuida", old, printerId, getProductionPrinterLabel(printerId));
  salvarProducaoManual("impressora-atribuida");
  renderizarPreservandoScroll();
}

function atualizarPedidoQuandoProducaoPronta(orderId, context = {}) {
  const { encontrarPedidoPorId, marcarRegistroLocalAlteradoParaSync, productionJobs } = context;
  const jobs = productionJobs.filter((job) => String(job.orderId) === String(orderId) && job.status !== "cancelado");
  if (!jobs.length || jobs.some((job) => !["pronto_para_entrega", "entregue"].includes(job.status))) return;
  const pedido = encontrarPedidoPorId(orderId);
  if (!pedido) return;
  marcarRegistroLocalAlteradoParaSync(pedido, { status: "pronto", productionStatus: "pronto_para_entrega", production_status: "pronto_para_entrega" });
}

function getPlacasConcluidasProducao(job = {}, context = {}) {
  const { productionEvents } = context;
  const salvas = Math.max(0, Number(job.completedQuantity || job.completed_quantity) || 0);
  const eventos = productionEvents.filter((event) =>
    String(event.productionJobId || event.production_job_id) === String(job.id)
    && String(event.eventType || event.event_type) === "placa_concluida"
  ).length;
  return Math.max(salvas, eventos);
}

function registrarPlacaConcluidaProducao(jobId, context = {}) {
  const { getProductionJob, getProductionPrinter, mostrarToast, registrarEventoProducao, renderizarPreservandoScroll, salvarProducaoManual } = context;
  const job = getProductionJob(jobId);
  if (!job || ["cancelado", "falhou", "entregue"].includes(job.status)) return false;
  const total = Math.max(1, Number(job.quantity) || 1);
  const concluidas = Math.min(total, getPlacasConcluidasProducao(job, context));
  if (concluidas >= total) {
    mostrarToast("Todas as placas desta impressão já foram concluídas.", "info", 3000);
    return false;
  }
  const agora = new Date().toISOString();
  const novoTotal = concluidas + 1;
  job.completedQuantity = job.completed_quantity = novoTotal;
  job.remainingQuantity = job.remaining_quantity = Math.max(0, total - novoTotal);
  job.updated_at = agora;
  if (novoTotal >= total && ["na_fila", "proximo", "aguardando_impressora", "em_impressao", "pausado"].includes(job.status)) {
    job.status = "pos_processamento";
    job.finished_at = job.finished_at || agora;
    const printer = getProductionPrinter(job.printerId);
    if (printer) printer.status = "disponivel";
  }
  registrarEventoProducao(job.id, "placa_concluida", job.status, job.status, `Placa ${novoTotal} de ${total}`);
  atualizarPedidoQuandoProducaoPronta(job.orderId, context);
  salvarProducaoManual("placa-concluida");
  renderizarPreservandoScroll();
  mostrarToast(novoTotal >= total ? "Todas as placas concluídas. Enviado para pós-processamento." : `Placa ${novoTotal} de ${total} concluída.`, "sucesso", 3200);
  return true;
}

function atualizarStatusTarefaProducao(jobId, status = "na_fila", context = {}) {
  const { PRODUCTION_STATUS_META, confirm, getDataEventoOperacionalPedido, getPesoPlanejadoTarefaProducao, getProductionJob, getProductionPrinter, mostrarToast, prompt, registrarEventoProducao, renderizarPreservandoScroll, salvarProducaoManual } = context;
  const job = getProductionJob(jobId);
  if (!job || !PRODUCTION_STATUS_META[status]) return false;
  if (status === "em_impressao" && !job.printerId) {
    mostrarToast("Selecione uma impressora antes de iniciar a impressão.", "aviso", 3200);
    renderizarPreservandoScroll();
    return false;
  }
  let note = "";
  if (status === "falhou") {
    note = String(prompt("Informe o motivo da falha:") || "").trim();
    if (!note) {
      mostrarToast("Informe o motivo da falha.", "aviso");
      renderizarPreservandoScroll();
      return false;
    }
  }
  const old = job.status || "novo_pedido";
  const agora = new Date().toISOString();
  job.status = status;
  job.updated_at = agora;
  if (status === "em_impressao") job.started_at = job.started_at || agora;
  if (status === "pausado") job.paused_at = agora;
  if (status === "falhou") {
    job.failed_at = agora;
    job.failureReason = note;
    job.failure_reason = note;
  }
  if (["pos_processamento", "controle_qualidade", "pronto_para_entrega"].includes(status)) {
    job.finished_at = job.finished_at || agora;
    const inicio = getDataEventoOperacionalPedido(job.started_at);
    const fim = getDataEventoOperacionalPedido(job.finished_at);
    if (inicio && fim && fim > inicio && !Number(job.actualPrintTimeMinutes || job.actual_print_time_minutes)) {
      const minutosReais = Math.max(1, Math.round((fim.getTime() - inicio.getTime()) / 60000));
      job.actualPrintTimeMinutes = minutosReais;
      job.actual_print_time_minutes = minutosReais;
    }
  }
  if (["falhou", "cancelado"].includes(status)) {
    const inicio = getDataEventoOperacionalPedido(job.started_at);
    if (inicio && !Number(job.actualPrintTimeMinutes || job.actual_print_time_minutes)) {
      const minutosUsados = Math.max(1, Math.round((Date.now() - inicio.getTime()) / 60000));
      job.actualPrintTimeMinutes = job.actual_print_time_minutes = minutosUsados;
    }
    const estimado = Number(job.estimatedPrintTimeMinutes || job.estimated_print_time_minutes) || 0;
    const planejado = getPesoPlanejadoTarefaProducao(job);
    if (planejado > 0 && estimado > 0) {
      const proporcao = Math.min(1, (Number(job.actualPrintTimeMinutes || job.actual_print_time_minutes) || 0) / estimado);
      const consumido = Math.round(planejado * proporcao * 100) / 100;
      job.filamentWeightGrams = job.filament_weight_grams = consumido;
    }
    job.finished_at = job.finished_at || agora;
  }
  const printer = getProductionPrinter(job.printerId);
  if (printer && status === "em_impressao") printer.status = "ocupada";
  if (printer && ["pos_processamento", "controle_qualidade", "pronto_para_entrega", "falhou", "pausado"].includes(status)) {
    if (confirm("Deseja liberar a impressora agora?")) printer.status = "disponivel";
  }
  registrarEventoProducao(job.id, "status_alterado", old, status, note);
  atualizarPedidoQuandoProducaoPronta(job.orderId, context);
  reordenarFilaProducao(context);
  salvarProducaoManual("status-producao");
  renderizarPreservandoScroll();
  return true;
}

function criarReimpressaoProducao(jobId, context = {}) {
  const { gerarCodigoProducao, gerarUuidProducao, getProductionJob, productionJobs, registrarEventoProducao, renderizarPreservandoScroll, salvarProducaoManual } = context;
  const job = getProductionJob(jobId);
  if (!job) return;
  const novoId = gerarUuidProducao();
  const agora = new Date().toISOString();
  const productionCode = gerarCodigoProducao();
  productionJobs.push({
    ...job,
    id: novoId,
    parentJobId: job.id,
    parent_job_id: job.id,
    productionCode,
    production_code: productionCode,
    status: "na_fila",
    printerId: "",
    printer_id: null,
    priority: "alta",
    priorityReason: "Reimpressão por falha",
    priority_reason: "Reimpressão por falha",
    releasedAt: agora,
    released_at: agora,
    created_at: agora,
    updated_at: agora
  });
  job.status = "falhou";
  registrarEventoProducao(job.id, "reimpressao_criada", job.status, "falhou", `Nova tarefa ${novoId}`);
  registrarEventoProducao(novoId, "reimpressao_criada", "", "na_fila", `Origem ${job.id}`);
  reordenarFilaProducao(context);
  salvarProducaoManual("reimpressao-criada");
  renderizarPreservandoScroll();
}

function avaliarQualidadeProducao(jobId, result = "aprovado", context = {}) {
  const { getProductionJob } = context;
  const job = getProductionJob(jobId);
  if (!job) return;
  if (result === "aprovado") atualizarStatusTarefaProducao(jobId, "pronto_para_entrega", context);
  if (result === "ajuste") atualizarStatusTarefaProducao(jobId, "pos_processamento", context);
  if (result === "reimpressao") criarReimpressaoProducao(jobId, context);
}

function abrirCadastroImpressoraProducao(id = "", context = {}) {
  const { PRODUCTION_PRINTER_STATUS, document, escaparAttr, escaparHtml, getProductionPrinter, promoverPopupParaDialogUiV3 } = context;
  const printer = getProductionPrinter(id) || {};
  const popup = document.getElementById("popup");
  if (!popup) return;
  popup.innerHTML = `
    <div class="modal-backdrop" role="dialog" aria-modal="true" onclick="fecharPopup()">
      <form class="modal-card production-printer-modal" onsubmit="salvarImpressoraProducao(event,'${escaparAttr(id)}')" onclick="event.stopPropagation()">
        <div class="modal-header"><h2>${id ? "Editar" : "Adicionar"} impressora</h2><button class="icon-button" type="button" onclick="fecharPopup()" title="Fechar">✕</button></div>
        <p class="muted">Cadastro manual. O sistema não envia comandos para a impressora.</p>
        <div class="production-form-grid">
          <label class="field"><span>Nome</span><input id="productionPrinterName" required maxlength="120" value="${escaparAttr(printer.name || "")}" placeholder="Ex.: Ender 3"></label>
          <label class="field"><span>Tipo</span><select id="productionPrinterType">${[["fdm","FDM"],["resina","Resina"],["outro","Outro"]].map(([value,label]) => `<option value="${value}" ${printer.printerType === value ? "selected" : ""}>${label}</option>`).join("")}</select></label>
          <label class="field"><span>Bico</span><input id="productionPrinterNozzle" value="${escaparAttr(printer.nozzleSize || "")}" placeholder="0,4 mm"></label>
          <label class="field"><span>Mesa (X × Y × Z)</span><input id="productionPrinterBed" value="${escaparAttr(printer.bedSize || "")}" placeholder="220 × 220 × 250 mm"></label>
          <label class="field"><span>Materiais compatíveis</span><input id="productionPrinterMaterials" value="${escaparAttr((printer.supportedMaterials || []).join(", "))}" placeholder="PLA, PETG, ABS"></label>
          <label class="field"><span>Status</span><select id="productionPrinterStatus">${Object.entries(PRODUCTION_PRINTER_STATUS).map(([value,label]) => `<option value="${value}" ${String(printer.status || "disponivel") === value ? "selected" : ""}>${label}</option>`).join("")}</select></label>
          <label class="field production-field-wide"><span>Observações</span><textarea id="productionPrinterNotes" rows="2">${escaparHtml(printer.notes || "")}</textarea></label>
        </div>
        <div class="actions production-modal-actions"><button class="btn ghost" type="button" onclick="fecharPopup()">Cancelar</button><button class="btn" type="submit">Salvar impressora</button></div>
      </form>
    </div>`;
  promoverPopupParaDialogUiV3(popup, { title: id ? "Editar impressora" : "Cadastrar impressora" });
}

function salvarImpressoraProducao(event, id = "", context = {}) {
  const { document, fecharPopup, gerarUuidProducao, getProductionCompanyId, getProductionPrinter, productionPrinters, renderizarPreservandoScroll, salvarProducaoManual, window } = context;
  event?.preventDefault?.();
  const name = String(document.getElementById("productionPrinterName")?.value || "").trim();
  if (!name) return false;
  const agora = new Date().toISOString();
  const data = {
    name,
    description: "",
    printerType: document.getElementById("productionPrinterType")?.value || "fdm",
    printer_type: document.getElementById("productionPrinterType")?.value || "fdm",
    nozzleSize: String(document.getElementById("productionPrinterNozzle")?.value || "").trim(),
    bedSize: String(document.getElementById("productionPrinterBed")?.value || "").trim(),
    supportedMaterials: String(document.getElementById("productionPrinterMaterials")?.value || "").split(",").map((item) => item.trim()).filter(Boolean),
    status: document.getElementById("productionPrinterStatus")?.value || "disponivel",
    notes: String(document.getElementById("productionPrinterNotes")?.value || "").trim(),
    isActive: true,
    is_active: true,
    updated_at: agora
  };
  const existente = getProductionPrinter(id);
  if (existente) Object.assign(existente, data);
  else productionPrinters.push({ id: gerarUuidProducao(), companyId: getProductionCompanyId(), company_id: getProductionCompanyId(), ...data, created_at: agora });
  salvarProducaoManual("impressora-manual");
  fecharPopup();
  window.__productionTab = "impressoras";
  renderizarPreservandoScroll();
  return true;
}

function alterarStatusImpressoraProducao(id, status = "disponivel", context = {}) {
  const { PRODUCTION_PRINTER_STATUS, getProductionPrinter, renderizarPreservandoScroll, salvarProducaoManual } = context;
  const printer = getProductionPrinter(id);
  if (!printer || !PRODUCTION_PRINTER_STATUS[status]) return;
  printer.status = status;
  printer.updated_at = new Date().toISOString();
  salvarProducaoManual("status-impressora-manual");
  renderizarPreservandoScroll();
}

function desativarImpressoraProducao(id, context = {}) {
  const { confirm, getProductionPrinter, renderizarPreservandoScroll, salvarProducaoManual } = context;
  const printer = getProductionPrinter(id);
  if (!printer || !confirm(`Desativar ${printer.name}?`)) return;
  printer.status = "inativa";
  printer.isActive = false;
  printer.is_active = false;
  printer.updated_at = new Date().toISOString();
  salvarProducaoManual("impressora-manual-desativada");
  renderizarPreservandoScroll();
}

function registrarEventoProducao(jobId, eventType, oldStatus = "", newStatus = "", note = "", context = {}) {
  const { gerarUuidProducao, getProductionCompanyId, getUsuarioAtual, productionEvents, setProductionEvents } = context;
  productionEvents.push({
    id: gerarUuidProducao(),
    companyId: getProductionCompanyId(),
    company_id: getProductionCompanyId(),
    productionJobId: jobId,
    production_job_id: jobId,
    eventType,
    event_type: eventType,
    oldStatus,
    old_status: oldStatus,
    newStatus,
    new_status: newStatus,
    note: String(note || "").trim(),
    createdBy: getUsuarioAtual()?.email || "",
    created_at: new Date().toISOString()
  });
  setProductionEvents(productionEvents.slice(-800));
}


function getProductionCodeSequence(date, context = {}) {
  const { hojeIsoData, productionJobs } = context;
  if (date === undefined) date = hojeIsoData();
  const prefix = `PROD-${String(date).replaceAll("-", "-")}-`;
  return productionJobs.filter((job) => String(job.productionCode || job.production_code || "").startsWith(prefix)).length + 1;
}

function gerarCodigoProducao(date, context = {}) {
  const { hojeIsoData } = context;
  if (date === undefined) date = hojeIsoData();
  return `PROD-${date}-${String(getProductionCodeSequence(date, context)).padStart(3, "0")}`;
}

function getProductionItemMaterial(item = {}, context = {}) {
  const { getMateriaisItem, getMaterialEstoque } = context;
  const materialLink = getMateriaisItem(item)[0] || {};
  const material = getMaterialEstoque(materialLink.materialId) || {};
  return {
    id: materialLink.materialId || material.id || "",
    name: materialLink.nome || material.nome || "",
    color: materialLink.cor || material.cor || item.cor || "",
    grams: Number(materialLink.gramas || materialLink.quantidade || item.pesoGramas || item.gramas || 0) || 0,
    unit: material.unidade || material.unit || "kg",
    unitCost: Math.max(0, Number(material.custoUnitario || material.unit_cost) || 0)
  };
}
  const api = Object.freeze({ validarPedidoParaProducao, pedidoTemPagamentoLiberadoProducao, abrirLiberacaoProducao, enviarPedidoPendenciaProducao, confirmarLiberacaoProducao, compararTarefasProducao, reordenarFilaProducao, alterarPrioridadeTarefaProducao, atribuirImpressoraTarefa, atualizarPedidoQuandoProducaoPronta, getPlacasConcluidasProducao, registrarPlacaConcluidaProducao, atualizarStatusTarefaProducao, criarReimpressaoProducao, avaliarQualidadeProducao, abrirCadastroImpressoraProducao, salvarImpressoraProducao, alterarStatusImpressoraProducao, desativarImpressoraProducao, registrarEventoProducao, getProductionCodeSequence, gerarCodigoProducao, getProductionItemMaterial });
  global.SimplificaProductionCommands = api;
  if (typeof module !== "undefined" && module.exports) module.exports = api;
})(typeof window !== "undefined" ? window : globalThis);
