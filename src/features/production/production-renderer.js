(function attachProductionRenderer(global) {
  "use strict";



function renderProductionPrinterOptions(selected = "", context = {}) {
  const { PRODUCTION_PRINTER_STATUS, escaparAttr, escaparHtml, productionPrinters } = context;
  const items = productionPrinters.filter((printer) => printer.isActive !== false && printer.status !== "inativa");
  return `<option value="">Selecione</option>${items.map((printer) => `<option value="${escaparAttr(printer.id)}" ${String(selected) === String(printer.id) ? "selected" : ""}>${escaparHtml(printer.name)} · ${escaparHtml(PRODUCTION_PRINTER_STATUS[printer.status] || "Disponível")}</option>`).join("")}`;
}

function renderTarefaProducao(job = {}, context = {}) {
  const { PRODUCTION_PENDING_REASONS, PRODUCTION_STATUS_META, clienteDoPedido, escaparAttr, escaparHtml, formatarDataHora, getPlacasConcluidasProducao, getPrinterQueueStage, getProductionOrder, getProductionStatusLabel, productionEvents } = context;
  const order = getProductionOrder(job);
  const priority = job.priority || "normal";
  const events = productionEvents.filter((event) => String(event.productionJobId || event.production_job_id) === String(job.id)).slice(-4).reverse();
  const estimado = Number(job.estimatedPrintTimeMinutes || job.estimated_print_time_minutes) || 0;
  const real = Number(job.actualPrintTimeMinutes || job.actual_print_time_minutes) || 0;
  const peso = Number(job.filamentWeightGrams || job.filament_weight_grams) || 0;
  const variacaoTempo = estimado > 0 && real > 0 ? Math.round(((real - estimado) / estimado) * 100) : null;
  const totalPlacas = Math.max(1, Number(job.quantity) || 1);
  const placasConcluidas = Math.min(totalPlacas, getPlacasConcluidasProducao(job));
  const placasRestantes = Math.max(0, totalPlacas - placasConcluidas);
  return `
    <article class="production-job-card production-status-${escaparAttr(job.status || "novo_pedido")}">
      <div class="production-job-head">
        <div>
          <span class="production-queue-number">${job.queuePosition ? `#${job.queuePosition}` : "—"}</span>
          <div><strong>${escaparHtml(job.itemName || "Item")}</strong><small>${escaparHtml(job.productionCode || `Pedido #${job.orderId}`)} · ${escaparHtml(job.customer || clienteDoPedido(order || {}))}</small></div>
        </div>
        <span class="status-badge production-badge-${escaparAttr(PRODUCTION_STATUS_META[job.status]?.group || "preparacao")}">${escaparHtml(getProductionStatusLabel(job.status))}</span>
      </div>
      <div class="production-job-meta">
        <span><small>Material</small><strong>${escaparHtml(job.material || "Não informado")}${job.color ? ` · ${escaparHtml(job.color)}` : ""}</strong></span>
        <span><small>Placas</small><strong>${placasConcluidas}/${totalPlacas} concluídas${placasRestantes ? ` · faltam ${placasRestantes}` : ""}</strong></span>
        <span><small>Peso</small><strong>${peso ? `${peso.toLocaleString("pt-BR")} g` : "Não informado"}</strong></span>
        <span><small>Tempo estimado</small><strong>${estimado ? `${estimado} min` : "Não informado"}</strong></span>
        ${real ? `<span><small>Tempo real</small><strong>${real} min${variacaoTempo === null ? "" : ` • ${variacaoTempo > 0 ? "+" : ""}${variacaoTempo}%`}</strong></span>` : ""}
        <span><small>Prazo</small><strong>${escaparHtml(job.dueDate || "Sem prazo")}</strong></span>
        ${job.bambuPrinterId || job.bambu_printer_id ? `<span><small>Mesas concluídas</small><strong>${Number(job.printPlatesCompleted || job.print_plates_completed) || 0}/${Math.max(1, Number(job.printPlatesTotal || job.print_plates_total) || 1)}</strong></span><span><small>Falhas</small><strong>${Number(job.printFailedAttempts || job.print_failed_attempts) || 0}</strong></span>` : ""}
      </div>
      ${job.blockedReason ? `<p class="production-pending-note">${escaparHtml(PRODUCTION_PENDING_REASONS[job.blockedReason] || job.blockedReason)}</p>` : ""}
      <div class="production-job-controls">
        <label><span>Etapa da impressão</span><select onchange="atualizarStatusTarefaProducao('${escaparAttr(job.id)}',this.value)">${[["na_fila","Em fila"],["em_impressao","Imprimindo"],["pronto_para_entrega","Pronto"]].map(([value,label]) => `<option value="${value}" ${getPrinterQueueStage(job) === getPrinterQueueStage({ status: value }) ? "selected" : ""}>${label}</option>`).join("")}</select></label>
        <label><span>Impressora</span><select onchange="atribuirImpressoraTarefa('${escaparAttr(job.id)}',this.value)">${renderProductionPrinterOptions(job.printerId, context)}</select></label>
        <label><span>Prioridade</span><select onchange="alterarPrioridadeTarefaProducao('${escaparAttr(job.id)}',this.value)">${[["normal","Normal"],["alta","Alta"],["urgente","Urgente"]].map(([value,label]) => `<option value="${value}" ${priority === value ? "selected" : ""}>${label}</option>`).join("")}</select></label>
      </div>
      <div class="production-job-actions">
        <button class="btn secondary" type="button" onclick="visualizarPedido(${Number(job.orderId)})">Ver pedido</button>
        ${job.bambuPrinterId || job.bambu_printer_id ? `<button class="btn secondary" type="button" onclick="abrirVinculoImpressaoBambuPedido('${escaparAttr(job.bambuPrinterId || job.bambu_printer_id)}','${escaparAttr(job.id)}')">Editar vínculo</button>` : ""}
        ${job.status === "falhou" || job.status === "reimpressao_necessaria" ? `<button class="btn" type="button" onclick="criarReimpressaoProducao('${escaparAttr(job.id)}')">Criar reimpressão</button>` : ""}
        ${job.status === "controle_qualidade" ? `<button class="btn" type="button" onclick="avaliarQualidadeProducao('${escaparAttr(job.id)}','aprovado')">Aprovar</button><button class="btn secondary" type="button" onclick="avaliarQualidadeProducao('${escaparAttr(job.id)}','ajuste')">Precisa ajuste</button><button class="btn secondary" type="button" onclick="avaliarQualidadeProducao('${escaparAttr(job.id)}','reimpressao')">Reimprimir</button>` : ""}
      </div>
      ${events.length ? `<details class="production-history"><summary>Histórico recente</summary>${events.map((event) => `<p><strong>${escaparHtml(getProductionStatusLabel(event.newStatus || event.new_status))}</strong><span>${escaparHtml(event.note || "")}</span><small>${formatarDataHora(event.created_at)}</small></p>`).join("")}</details>` : ""}
    </article>
  `;
}

function getResumoCapacidadeProducao(context = {}) {
  const { getDataEventoOperacionalPedido, getImpressoesExternasMonitoradas, productionJobs, productionPrinters } = context;
  const minutosValidos = (valor) => Number.isFinite(Number(valor)) ? Math.max(0, Number(valor)) : 0;
  const ativos = productionJobs.filter((job) => !["pronto_para_entrega", "entregue", "cancelado"].includes(job.status));
  const externos = getImpressoesExternasMonitoradas();
  const minutosFila = ativos.reduce((total, job) => total + minutosValidos(job.estimatedPrintTimeMinutes ?? job.estimated_print_time_minutes), 0)
    + externos.reduce((total, item) => total + minutosValidos(item.latest_status?.remaining_seconds) / 60, 0);
  const impressorasAtivas = productionPrinters.filter((printer) => printer.isActive !== false && printer.is_active !== false && !["inativa", "manutencao", "manutenção"].includes(String(printer.status || "").toLowerCase()));
  const diasCapacidade = impressorasAtivas.length ? minutosFila / (impressorasAtivas.length * 24 * 60) : 0;
  const atrasados = ativos.filter((job) => {
    const prazo = getDataEventoOperacionalPedido(job.dueDate || job.due_date);
    return prazo && prazo.getTime() < Date.now();
  }).length;
  return {
    tarefas: ativos.length + externos.length,
    horas: minutosFila / 60,
    impressoras: impressorasAtivas.length,
    diasCapacidade,
    atrasados
  };
}

function renderResumoCapacidadeProducao(context = {}) {
  const { renderUiIcon } = context;
  const resumo = getResumoCapacidadeProducao(context);
  return `
    <section class="production-capacity-summary" aria-label="Resumo da capacidade produtiva">
      <div><i>${renderUiIcon("pedidos")}</i><span>Fila ativa</span><strong>${resumo.tarefas}</strong><small>tarefas</small></div>
      <div><i>${renderUiIcon("historico")}</i><span>Carga estimada</span><strong>${resumo.horas.toFixed(1)}h</strong><small>de impressão</small></div>
      <div><i>${renderUiIcon("calendar")}</i><span>Capacidade teórica</span><strong>${resumo.impressoras ? `${resumo.diasCapacidade.toFixed(1)} dias` : "Sem máquina"}</strong><small>${resumo.impressoras} impressora(s) · 24h/dia, sem paradas</small></div>
      <div class="${resumo.atrasados ? "is-alert" : ""}"><i>${renderUiIcon("alerta")}</i><span>Atrasadas</span><strong>${resumo.atrasados}</strong><small>fora do prazo</small></div>
    </section>
  `;
}

function renderImpressorasProducao(context = {}) {
  const { PRODUCTION_PRINTER_STATUS, escaparAttr, escaparHtml, getProductionPrinterLiveInfo, productionJobs, productionPrinters, renderUiIcon, reordenarFilaProducao } = context;
  const printers = productionPrinters.filter((printer) => printer.isActive !== false && printer.status !== "inativa");
  return `
    <div class="production-printer-toolbar">
      <p>As impressoras são controladas manualmente. O sistema organiza a fila e os status, mas não inicia impressões automaticamente.</p>
      <button class="btn" type="button" onclick="abrirCadastroImpressoraProducao()">${renderUiIcon("plus")} Adicionar impressora</button>
    </div>
    <div class="production-printer-grid">
      ${printers.length ? printers.map((printer) => {
        const current = productionJobs.find((job) => String(job.printerId) === String(printer.id) && job.status === "em_impressao");
        const next = reordenarFilaProducao().find((job) => !job.printerId || String(job.printerId) === String(printer.id));
        const live = getProductionPrinterLiveInfo(printer);
        return `<article class="production-printer-card is-clickable" data-printer-live-id="${escaparAttr(live.monitored?.id || "")}" role="button" tabindex="0" onclick="if(!event.target.closest('button,select')) abrirPainelImpressoraProducao('${escaparAttr(printer.id)}')" onkeydown="if((event.key==='Enter'||event.key===' ')&&!event.target.closest('button,select')){event.preventDefault();abrirPainelImpressoraProducao('${escaparAttr(printer.id)}')}">
          <div class="production-printer-head"><span>${renderUiIcon("impressoras")}</span><div><strong>${escaparHtml(printer.name)}</strong><small>${escaparHtml(printer.printerType || "FDM")} · <b data-printer-live="production-status">${escaparHtml(live.statusLabel)}</b></small></div></div>
          <div class="production-printer-current"><span><small>Em execução</small><strong data-printer-live="production-task">${escaparHtml(current?.itemName || live.taskName || "Nenhuma tarefa")}</strong></span><span><small>Próxima sugerida</small><strong>${escaparHtml(next?.itemName || "Sem sugestão")}</strong></span></div>
          <div class="production-printer-actions">
            <select onchange="alterarStatusImpressoraProducao('${escaparAttr(printer.id)}',this.value)">${Object.entries(PRODUCTION_PRINTER_STATUS).map(([value,label]) => `<option value="${value}" ${printer.status === value ? "selected" : ""}>${label}</option>`).join("")}</select>
            <button class="icon-action-button" type="button" onclick="abrirCadastroImpressoraProducao('${escaparAttr(printer.id)}')" title="Editar">${renderUiIcon("edit")}</button>
            <button class="icon-action-button danger" type="button" onclick="desativarImpressoraProducao('${escaparAttr(printer.id)}')" title="Desativar">${renderUiIcon("trash")}</button>
          </div>
        </article>`;
      }).join("") : `<p class="empty">Nenhuma impressora manual cadastrada.</p>`}
    </div>`;
}

function renderPerfilImpressoraProducao(context = {}) {
  const { escaparAttr, escaparHtml, getProductionPrinterLiveInfo, productionPrinters, renderUiIcon } = context;
  const impressorasAtivas = productionPrinters.filter((printer) => printer.isActive !== false && printer.status !== "inativa");
  const emUso = impressorasAtivas.find((printer) => getProductionPrinterLiveInfo(printer).printing)
    || impressorasAtivas.find((printer) => printer.status === "ocupada")
    || impressorasAtivas[0];
  if (!emUso) {
    return `<section class="calc-active-profile production-active-printer">
      <div class="calc-printer-art">${renderUiIcon("producao")}</div>
      <div><span>Impressora ativa</span><strong>Nenhuma cadastrada</strong><small>Cadastre o modelo para acompanhar o status.</small></div>
      <button class="btn secondary" type="button" onclick="trocarAbaProducao('impressoras')">Cadastrar</button>
    </section>`;
  }
  const modelo = emUso.name || "Impressora 3D";
  const tipo = String(emUso.printerType || emUso.printer_type || "FDM").toUpperCase();
  const live = getProductionPrinterLiveInfo(emUso);
  const status = live.statusLabel;
  return `<section class="calc-active-profile production-active-printer is-clickable" data-printer-live-id="${escaparAttr(live.monitored?.id || "")}" role="button" tabindex="0" onclick="abrirPainelImpressoraProducao('${escaparAttr(emUso.id)}')" onkeydown="if(event.key==='Enter'||event.key===' '){event.preventDefault();abrirPainelImpressoraProducao('${escaparAttr(emUso.id)}')}" aria-label="Abrir painel da impressora ${escaparAttr(modelo)}">
    <div class="calc-printer-art">${renderUiIcon("producao")}</div>
    <div><span>Impressora ativa</span><strong>${escaparHtml(modelo)}</strong><small>Modelo: ${escaparHtml(tipo)}${emUso.nozzleSize ? ` · Bico ${escaparHtml(emUso.nozzleSize)}` : ""}</small></div>
    <span class="status-badge production-printer-profile-status"><span data-printer-live="production-status">${escaparHtml(status)}</span> ›</span>
  </section>`;
}

async function abrirImpressoraAtivaProducao(id, context = {}) {
  const { abrirPainelImpressoraSimplifica, getImpressorasAtivas, getProductionPrinter, hidratarImpressorasSeNecessario, normalizarTextoBusca, printerMonitoringState, renderizarPreservandoScroll, trocarTela } = context;
  const manual = getProductionPrinter(id);
  const nome = normalizarTextoBusca(manual?.name || "");
  const monitoradas = getImpressorasAtivas();
  const monitorada = monitoradas.find((item) => normalizarTextoBusca(item.name || "") === nome)
    || (monitoradas.length === 1 ? monitoradas[0] : null);
  if (monitorada) {
    abrirPainelImpressoraSimplifica(monitorada.id);
    return;
  }
  trocarTela("impressoras");
  if (!printerMonitoringState.loaded) {
    hidratarImpressorasSeNecessario()
      .then(() => {
        const atualizadas = getImpressorasAtivas();
        const vinculada = atualizadas.find((item) => normalizarTextoBusca(item.name || "") === nome)
          || (atualizadas.length === 1 ? atualizadas[0] : null);
        if (vinculada) abrirPainelImpressoraSimplifica(vinculada.id);
        else renderizarPreservandoScroll();
      })
      .catch(() => {});
  }
}

function getTarefasProducaoPorAba(tab, context = {}) {
  const { compararTarefasProducao, getPrinterQueueStage, getProductionOrder, getProductionTab, normalizarTextoBusca, productionJobs, reordenarFilaProducao, window } = context;
  if (tab === undefined) tab = getProductionTab();
  reordenarFilaProducao();
  const busca = normalizarTextoBusca(window.__productionSearch || "");
  const printerFilter = String(window.__productionPrinterFilter || "");
  const periodo = ["semana", "mes", "ano", "todos"].includes(String(window.__productionPeriod || "semana"))
    ? String(window.__productionPeriod || "semana")
    : "semana";
  const agora = new Date();
  const inicioPeriodo = new Date(agora);
  inicioPeriodo.setHours(0, 0, 0, 0);
  if (periodo === "semana") inicioPeriodo.setDate(inicioPeriodo.getDate() - ((inicioPeriodo.getDay() + 6) % 7));
  if (periodo === "mes") inicioPeriodo.setDate(1);
  if (periodo === "ano") inicioPeriodo.setMonth(0, 1);
  let jobs = productionJobs.filter((job) => {
    if (periodo === "todos") return true;
    const pedido = getProductionOrder(job);
    const valorData = job.updated_at || job.updatedAt || job.created_at || job.createdAt || pedido?.updated_at || pedido?.updatedAt || pedido?.criadoEm || pedido?.createdAt || pedido?.data;
    if (!valorData) return true;
    const data = new Date(valorData);
    return Number.isNaN(data.getTime()) || data >= inicioPeriodo;
  });
  if (tab === "fila") jobs = jobs.filter((job) => getPrinterQueueStage(job) === "fila");
  if (tab === "impressao") jobs = jobs.filter((job) => ["em_impressao", "pausado", "pos_processamento", "controle_qualidade"].includes(job.status));
  if (tab === "prontos") jobs = jobs.filter((job) => job.status === "pronto_para_entrega");
  if (printerFilter) jobs = jobs.filter((job) => String(job.printerId || "") === printerFilter);
  if (busca) jobs = jobs.filter((job) => normalizarTextoBusca(`${job.productionCode} ${job.orderId} ${job.customer} ${job.itemName} ${job.material} ${job.color}`).includes(busca));
  return jobs.sort(compararTarefasProducao);
}

function renderProducao(context = {}) {
  const { escaparAttr, escaparHtml, getImpressoesExternasMonitoradas, getProductionTab, productionJobs, productionPrinters, renderBloqueioPlano, renderHistoricoProducao, renderImpressaoExternaMonitorada, renderUiIcon, temAcessoCompleto, window } = context;
  if (!temAcessoCompleto()) return renderBloqueioPlano("Produção");
  const tab = getProductionTab();
  const tabs = [
    ["fila", "Fila", "pedidos"],
    ["impressao", "Em impressão", "producao"],
    ["prontos", "Prontos", "check"],
    ["impressoras", "Impressoras", "impressoras"]
  ];
  const jobs = tab === "impressoras" ? [] : getTarefasProducaoPorAba(tab, context);
  const impressoesExternas = tab === "impressao" ? getImpressoesExternasMonitoradas() : [];
  const totalAtivas = productionJobs.filter((job) => ["em_impressao", "pausado"].includes(job.status)).length + getImpressoesExternasMonitoradas().length;
  return `
    <section class="ui3-real-screen ui3-page ui3-stack ui3-gap-4 ui3-production" data-ui-version="v3" data-ui3-screen="producao">
      <div class="card-header production-page-header">
        <div><h2>${renderUiIcon("producao")} Produção</h2><p class="muted">Visão geral da produção da sua empresa</p></div>
        <span class="status-badge">${totalAtivas} ativa(s)</span>
      </div>
      <label class="production-search production-search-primary"><span class="search-lens-icon" aria-hidden="true">${renderUiIcon("search")}</span><input value="${escaparAttr(window.__productionSearch || "")}" placeholder="Pedido, cliente, item ou material" oninput="window.__productionSearch=this.value;agendarRenderizacaoPreservandoScroll(180)"></label>
      ${renderPerfilImpressoraProducao(context)}
      ${renderResumoCapacidadeProducao(context)}
      <div class="production-tabs" role="tablist">
        ${tabs.map(([value,label,icon]) => {
          const quantidade = value === "impressoras"
            ? productionPrinters.filter((printer) => printer.isActive !== false && printer.status !== "inativa").length
            : getTarefasProducaoPorAba(value, context).length + (value === "impressao" ? getImpressoesExternasMonitoradas().length : 0);
          return `<button type="button" role="tab" class="${tab === value ? "active" : ""}" aria-selected="${tab === value}" onclick="trocarAbaProducao('${value}')"><i aria-hidden="true">${renderUiIcon(icon)}</i><span>${escaparHtml(label)}</span><strong>${quantidade}</strong></button>`;
        }).join("")}
      </div>
      ${tab === "impressoras" ? renderImpressorasProducao(context) : tab === "historico" ? renderHistoricoProducao() : `
        <div class="production-filter-bar">
          <select aria-label="Filtrar por impressora" onchange="window.__productionPrinterFilter=this.value;renderizarPreservandoScroll()">${renderProductionPrinterOptions(window.__productionPrinterFilter || "", context)}</select>
          <select aria-label="Filtrar período da produção" onchange="window.__productionPeriod=this.value;renderizarPreservandoScroll()">
            <option value="semana" ${(window.__productionPeriod || "semana") === "semana" ? "selected" : ""}>Esta semana</option>
            <option value="mes" ${window.__productionPeriod === "mes" ? "selected" : ""}>Este mês</option>
            <option value="ano" ${window.__productionPeriod === "ano" ? "selected" : ""}>Este ano</option>
            <option value="todos" ${window.__productionPeriod === "todos" ? "selected" : ""}>Todo o período</option>
          </select>
        </div>
        <div class="production-job-list">${jobs.length || impressoesExternas.length ? `${impressoesExternas.map(renderImpressaoExternaMonitorada).join("")}${jobs.map((...__args) => renderTarefaProducao(...__args.slice(0, 1), context)).join("")}` : `<div class="production-empty-state"><i>${renderUiIcon("pedidos")}</i><div><strong>Nenhuma tarefa nesta etapa.</strong><span>Adicione ou filtre para visualizar tarefas aqui.</span></div></div>`}</div>
      `}
    </section>
  `;
}


function getDataConclusaoTarefaProducao(job = {}, context = {}) {
  const { getDataEventoOperacionalPedido, productionEvents } = context;
  const eventos = productionEvents.filter((event) =>
    String(event.productionJobId || event.production_job_id) === String(job.id)
      && ["pos_processamento", "controle_qualidade", "pronto_para_entrega", "entregue", "falhou", "cancelado"].includes(event.newStatus || event.new_status)
  );
  return getDataEventoOperacionalPedido(eventos.at(-1)?.created_at || job.finished_at || job.updated_at || job.created_at);
}

function getHistoricoProducaoNoPeriodo(periodo, context = {}) {
  const { getPeriodoHistoricoProducao, productionJobs } = context;
  if (periodo === undefined) periodo = getPeriodoHistoricoProducao();
  const inicio = new Date();
  inicio.setHours(0, 0, 0, 0);
  if (periodo === "semana") inicio.setDate(inicio.getDate() - ((inicio.getDay() + 6) % 7));
  if (periodo === "mes") inicio.setDate(1);
  return productionJobs.map((job) => ({ job, data: getDataConclusaoTarefaProducao(job, context) }))
    .filter(({ job, data }) => data && data >= inicio && (
      ["pos_processamento", "controle_qualidade", "pronto_para_entrega", "entregue"].includes(job.status)
      || (["falhou", "cancelado"].includes(job.status) && (Number(job.actualPrintTimeMinutes || job.actual_print_time_minutes) > 0 || Number(job.filamentWeightGrams || job.filament_weight_grams) > 0))
    ))
    .sort((a, b) => b.data.getTime() - a.data.getTime());
}

function carregarMaisHistoricoProducao(context = {}) {
  const { PRODUCTION_HISTORY_PAGE_SIZE, renderizarPreservandoScroll, window } = context;
  window.__productionHistoryLimit = (Number(window.__productionHistoryLimit) || PRODUCTION_HISTORY_PAGE_SIZE) + PRODUCTION_HISTORY_PAGE_SIZE;
  renderizarPreservandoScroll();
}

function getPesoPlanejadoTarefaProducao(job = {}, context = {}) {
  const { getProductionItemMaterial, getProductionOrder, normalizarItensPedido } = context;
  const pedido = getProductionOrder(job);
  const item = normalizarItensPedido(pedido || {})[Number(job.itemIndex ?? job.item_index) || 0];
  return Number(getProductionItemMaterial(item || {}).grams) || Number(job.filamentWeightGrams || job.filament_weight_grams) || 0;
}

function getCustoMaterialPorGramaTarefaProducao(job = {}, context = {}) {
  const { getMateriaisItem, getMaterialEstoque, getProductionOrder, normalizarItensPedido } = context;
  const pedido = getProductionOrder(job);
  const item = normalizarItensPedido(pedido || {})[Number(job.itemIndex ?? job.item_index) || 0] || {};
  const vinculo = getMateriaisItem(item)[0] || {};
  const material = getMaterialEstoque(vinculo.materialId) || {};
  const custoKg = Number(vinculo.valorUnitario || material.custoUnitario || material.unit_cost || material.precoKg || material.custoKg) || 0;
  return custoKg > 0 ? custoKg / 1000 : 0;
}

function renderHistoricoProducao(context = {}) {
  const { PRODUCTION_HISTORY_PAGE_SIZE, clienteDoPedido, escaparAttr, escaparHtml, formatarDataHora, formatarMinutosProducao, formatarMoeda, getPeriodoHistoricoProducao, getProductionOrder, getProductionPrinterLabel, getProductionStatusLabel, window } = context;
  const periodo = getPeriodoHistoricoProducao();
  const historico = getHistoricoProducaoNoPeriodo(periodo, context);
  const limite = Math.max(PRODUCTION_HISTORY_PAGE_SIZE, Number(window.__productionHistoryLimit) || PRODUCTION_HISTORY_PAGE_SIZE);
  const visiveis = historico.slice(0, limite);
  const concluidas = historico.filter(({ job }) => !["falhou", "cancelado"].includes(job.status));
  const perdas = historico.filter(({ job }) => ["falhou", "cancelado"].includes(job.status));
  const minutos = concluidas.reduce((total, { job }) => total + (Number(job.actualPrintTimeMinutes || job.actual_print_time_minutes || job.estimatedPrintTimeMinutes || job.estimated_print_time_minutes) || 0), 0);
  const peso = concluidas.reduce((total, { job }) => total + (Number(job.filamentWeightGrams || job.filament_weight_grams) || 0), 0);
  const minutosPerdidos = perdas.reduce((total, { job }) => total + (Number(job.actualPrintTimeMinutes || job.actual_print_time_minutes) || 0), 0);
  const pesoPerdido = perdas.reduce((total, { job }) => total + (Number(job.filamentWeightGrams || job.filament_weight_grams) || 0), 0);
  const prejuizo = perdas.reduce((total, { job }) => total + ((Number(job.filamentWeightGrams || job.filament_weight_grams) || 0) * getCustoMaterialPorGramaTarefaProducao(job, context)), 0);
  const pedidosUnicos = new Set(historico.map(({ job }) => String(job.orderId || job.order_id || "")).filter(Boolean)).size;
  return `
    <section class="production-report" aria-label="Histórico de produção">
      <div class="production-report-toolbar">
        <div><h3>Horas de impressão</h3><p class="muted">Produção concluída no período selecionado.</p></div>
        <div class="production-period-switch" role="group" aria-label="Período do histórico">
          ${[["hoje","Hoje"],["semana","Semana"],["mes","Mês"]].map(([value,label]) => `<button type="button" class="${periodo === value ? "active" : ""}" onclick="trocarPeriodoHistoricoProducao('${value}')">${label}</button>`).join("")}
        </div>
      </div>
      <div class="production-history-summary">
        <div><span>Horas produzidas</span><strong>${formatarMinutosProducao(minutos)}</strong></div>
        <div><span>Material produzido</span><strong>${peso ? `${peso.toLocaleString("pt-BR")} g` : "0 g"}</strong></div>
        <div class="${minutosPerdidos ? "is-loss" : ""}"><span>Horas perdidas</span><strong>${formatarMinutosProducao(minutosPerdidos)}</strong></div>
        <div class="${pesoPerdido ? "is-loss" : ""}"><span>Material perdido</span><strong>${pesoPerdido ? `${pesoPerdido.toLocaleString("pt-BR")} g` : "0 g"}</strong></div>
        <div class="${prejuizo ? "is-loss" : ""}"><span>Prejuízo estimado</span><strong>${formatarMoeda(prejuizo)}</strong></div>
        <div><span>Impressões / pedidos</span><strong>${historico.length} / ${pedidosUnicos}</strong></div>
      </div>
      <div class="production-history-list">
        ${visiveis.length ? visiveis.map(({ job, data }) => {
          const order = getProductionOrder(job);
          const tempo = Number(job.actualPrintTimeMinutes || job.actual_print_time_minutes || job.estimatedPrintTimeMinutes || job.estimated_print_time_minutes) || 0;
          const pesoItem = Number(job.filamentWeightGrams || job.filament_weight_grams) || 0;
          const perda = ["falhou", "cancelado"].includes(job.status);
          const custoPerda = perda ? pesoItem * getCustoMaterialPorGramaTarefaProducao(job, context) : 0;
          return `<article class="production-history-row">
            <div><strong>${escaparHtml(job.itemName || "Item de produção")}</strong><small>${escaparHtml(job.productionCode || `Pedido #${job.orderId}`)} · ${escaparHtml(clienteDoPedido(order || {}) || "Cliente não informado")}</small></div>
            <div class="production-history-measures ${perda ? "is-loss" : ""}"><span>${perda ? getProductionStatusLabel(job.status) : "Concluída"}</span><span>${formatarMinutosProducao(tempo)}</span><span>${pesoItem ? `${pesoItem.toLocaleString("pt-BR")} g` : "Peso pendente"}</span>${custoPerda ? `<span>${formatarMoeda(custoPerda)}</span>` : ""}</div>
            <div><strong>${escaparHtml(getProductionPrinterLabel(job.printerId || job.printer_id))}</strong><small>${formatarDataHora(data.toISOString())}</small></div>
            <button class="btn secondary" type="button" onclick="abrirAjusteDadosImpressao('${escaparAttr(job.id)}')">Ajustar</button>
          </article>`;
        }).join("") : `<p class="empty">Nenhuma impressão concluída neste período.</p>`}
      </div>
      ${historico.length > visiveis.length ? `<div class="production-history-more"><button class="btn secondary" type="button" onclick="carregarMaisHistoricoProducao()">Carregar mais ${Math.min(PRODUCTION_HISTORY_PAGE_SIZE, historico.length - visiveis.length)}</button><small>${visiveis.length} de ${historico.length}</small></div>` : ""}
    </section>`;
}
  function abrirAjusteDadosImpressao(jobId, context = {}) {
  const { document: documentRef, escaparAttr, escaparHtml, formatarMinutosProducao, getPesoPlanejadoTarefaProducao, getProductionJob, promoverPopupParaDialogUiV3 } = context;
  const job = getProductionJob(jobId);
  const popup = documentRef.getElementById("popup");
  if (!job || !popup) return;
  const peso = Number(job.filamentWeightGrams || job.filament_weight_grams) || "";
  const tempo = Number(job.actualPrintTimeMinutes || job.actual_print_time_minutes) || "";
  const pesoPlanejado = getPesoPlanejadoTarefaProducao(job, context);
  const tempoPlanejado = Number(job.estimatedPrintTimeMinutes || job.estimated_print_time_minutes) || 0;
  const perda = ["falhou", "cancelado"].includes(job.status);
  popup.innerHTML = `
    <div class="modal-backdrop" role="dialog" aria-modal="true" onclick="fecharPopup()">
      <form class="modal-card" onclick="event.stopPropagation()" onsubmit="salvarAjusteDadosImpressao(event,'${escaparAttr(job.id)}')">
        <div class="modal-header"><div><span class="eyebrow">${escaparHtml(job.productionCode || "Impressão")}</span><h2>${perda ? "Registrar perda" : "Dados da impressão"}</h2></div><button class="icon-button" type="button" onclick="fecharPopup()" title="Fechar">✕</button></div>
        <p class="muted">Planejado: ${pesoPlanejado ? `${pesoPlanejado.toLocaleString("pt-BR")} g` : "peso não informado"} e ${tempoPlanejado ? formatarMinutosProducao(tempoPlanejado) : "tempo não informado"}. Ajuste abaixo com o consumo real.</p>
        <div class="production-form-grid">
          <label class="field"><span>${perda ? "Material perdido" : "Material consumido"} (g)</span><input id="productionActualWeight" type="number" min="0" step="0.01" inputmode="decimal" value="${escaparAttr(peso)}" placeholder="Ex.: 50"></label>
          <label class="field"><span>${perda ? "Tempo perdido" : "Tempo utilizado"} (min)</span><input id="productionActualTime" type="number" min="0" step="1" inputmode="numeric" value="${escaparAttr(tempo)}" placeholder="Ex.: 150"></label>
        </div>
        <div class="actions production-modal-actions"><button class="btn ghost" type="button" onclick="fecharPopup()">Cancelar</button><button class="btn" type="submit">Salvar dados</button></div>
      </form>
    </div>`;
  promoverPopupParaDialogUiV3(popup, { title: "Peso e tempo da impressão" });
}

const api = Object.freeze({ renderProductionPrinterOptions, renderTarefaProducao, getResumoCapacidadeProducao, renderResumoCapacidadeProducao, renderImpressorasProducao, renderPerfilImpressoraProducao, abrirImpressoraAtivaProducao, getTarefasProducaoPorAba, renderProducao, getDataConclusaoTarefaProducao, getHistoricoProducaoNoPeriodo, carregarMaisHistoricoProducao, getPesoPlanejadoTarefaProducao, getCustoMaterialPorGramaTarefaProducao, renderHistoricoProducao, abrirAjusteDadosImpressao });
  global.SimplificaProductionRenderer = api;
  if (typeof module !== "undefined" && module.exports) module.exports = api;
})(typeof window !== "undefined" ? window : globalThis);
