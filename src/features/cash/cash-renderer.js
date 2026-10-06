(function attachCashRenderer(global) {
  "use strict";


function renderCaixaViewTabs(ativo, context = {}) {
  const { escaparAttr, escaparHtml, getCaixaViewAtiva, isContextAdvancedVisible, renderUiIcon } = context;
  if (ativo === undefined) ativo = getCaixaViewAtiva();
  if (!isContextAdvancedVisible("caixa")) return "";
  const abas = [
    { id: "movimentos", label: "Movimentos", icon: "caixa" },
    { id: "extrato", label: "Extrato", icon: "relatorios" }
  ];
  return `
    <div class="ui-tabs cash-view-tabs" role="tablist" aria-label="Visão do caixa">
      ${abas.map((aba) => `
        <button class="ui-tab ${ativo === aba.id ? "active" : ""}" type="button" role="tab" aria-selected="${ativo === aba.id}" onclick="trocarAbaCaixa('${escaparAttr(aba.id)}')">
          ${renderUiIcon(aba.icon)}
          <span>${escaparHtml(aba.label)}</span>
        </button>
      `).join("")}
    </div>
  `;
}

function renderCaixaPeriodoChips(periodoAtivo, context = {}) {
  const { escaparAttr, escaparHtml, getCaixaPeriodoAtivo, getPeriodoCustomizadoCaixa, renderUiIcon } = context;
  if (periodoAtivo === undefined) periodoAtivo = getCaixaPeriodoAtivo();
  const periodos = [
    { id: "hoje", label: "Hoje" },
    { id: "semana", label: "Semana" },
    { id: "mes", label: "Mês" },
    { id: "personalizado", label: "Período", icon: "agenda" }
  ];
  const custom = getPeriodoCustomizadoCaixa();
  return `
    <div class="reports-period-tabs cash-period-tabs" role="tablist" aria-label="Período do caixa">
      ${periodos.map((periodo) => `
        <button class="reports-period-chip ${periodoAtivo === periodo.id ? "active" : ""}" type="button" role="tab" aria-selected="${periodoAtivo === periodo.id}" onclick="trocarPeriodoCaixa('${escaparAttr(periodo.id)}')">
          ${periodo.icon ? renderUiIcon(periodo.icon) : ""}
          <span>${escaparHtml(periodo.label)}</span>
        </button>
      `).join("")}
    </div>
    ${periodoAtivo === "personalizado" ? `
      <div class="period-custom-bar cash-custom-period">
        <label class="field">
          <span>Data inicial</span>
          <input id="caixaDataInicio" type="date" value="${escaparAttr(custom.inicio)}">
        </label>
        <label class="field">
          <span>Data final</span>
          <input id="caixaDataFim" type="date" value="${escaparAttr(custom.fim)}">
        </label>
        <button class="btn secondary" type="button" onclick="aplicarPeriodoPersonalizadoCaixa()">Aplicar período</button>
      </div>
    ` : ""}
  `;
}

function renderCaixaFiltroChips(movimentos, ativo = "todos", context = {}) {
  const { caixa, escaparAttr, escaparHtml, movimentoCaixaCancelado } = context;
  if (movimentos === undefined) movimentos = caixa;
  const contadores = movimentos.reduce((acc, movimento) => {
    const cancelado = movimentoCaixaCancelado(movimento);
    acc.todos += 1;
    if (cancelado) acc.cancelados += 1;
    else if (String(movimento.tipo || "").toLowerCase() === "saida") acc.saidas += 1;
    else acc.entradas += 1;
    return acc;
  }, { todos: 0, entradas: 0, saidas: 0, cancelados: 0 });
  const itens = [
    { id: "todos", label: "Todos" },
    { id: "entradas", label: "Entradas" },
    { id: "saidas", label: "Saídas" },
    { id: "cancelados", label: "Cancelados" }
  ];
  return `
    <div class="order-filter-chips cash-filter-chips" role="tablist" aria-label="Filtrar caixa">
      ${itens.map((item) => `
        <button class="order-filter-chip ${ativo === item.id ? "active" : ""}" type="button" role="tab" aria-selected="${ativo === item.id}" onclick="trocarFiltroCaixa('${escaparAttr(item.id)}')">
          <span>${escaparHtml(item.label)}</span>
          <strong>${Number(contadores[item.id] || 0)}</strong>
        </button>
      `).join("")}
    </div>
  `;
}

function renderOpcoesMetodoPagamentoCaixa(valorAtual = "pix", context = {}) {
  const { escaparAttr, escaparHtml, getMetodosPagamentoCaixa, normalizarMetodoPagamentoCaixa } = context;
  const atual = normalizarMetodoPagamentoCaixa(valorAtual).id;
  return getMetodosPagamentoCaixa().map((metodo) => (
    `<option value="${escaparAttr(metodo.id)}" ${metodo.id === atual ? "selected" : ""}>${escaparHtml(metodo.name)}</option>`
  )).join("");
}

function getRotuloTipoMovimentoCaixa(movimento = {}, context = {}) {
  const { descricaoCaixa, movimentoCaixaCancelado, normalizarTextoBusca } = context;
  if (movimentoCaixaCancelado(movimento)) return "Cancelado";
  const saida = String(movimento.tipo || "").toLowerCase() === "saida";
  const texto = normalizarTextoBusca(descricaoCaixa(movimento));
  if (!saida) return "Entrada";
  if (texto.includes("sangria")) return "Sangria";
  if (texto.includes("retirada")) return "Retirada";
  return "Saída";
}

function getResumoMetodoMovimentoCaixa(movimento = {}, context = {}) {
  const { getMetodoPagamentoMovimento } = context;
  return `${getRotuloTipoMovimentoCaixa(movimento, context)} • ${getMetodoPagamentoMovimento(movimento).name}`;
}

function renderStatusSessaoCaixaSimples(context = {}) {
  const { caixaModoSimplesAtivo, calcularResumoSessaoCaixa, escaparHtml, formatarMoeda, getMetodosPagamentoCaixa, getSessaoCaixaAtual } = context;
  if (!caixaModoSimplesAtivo()) return "";
  const sessao = getSessaoCaixaAtual();
  const resumo = calcularResumoSessaoCaixa(sessao);
  const metodos = getMetodosPagamentoCaixa();
  const ultima = resumo.ultimaMovimentacao ? resumo.ultimaMovimentacao.toLocaleString("pt-BR") : "Nenhuma movimentação";
  const linhasForma = metodos
    .map((metodo) => `<span><small>${escaparHtml(metodo.name)}</small><strong>${formatarMoeda(resumo.porForma[metodo.id] || 0)}</strong></span>`)
    .join("");
  return `
    <div class="cash-session-panel">
      <div class="cash-session-head">
        <div>
          <span class="status-badge cash-session-status ${sessao ? "badge-ativo" : "badge-alerta"}"><i class="cash-status-dot ${sessao ? "open" : "closed"}"></i>${sessao ? "Caixa aberto" : "Caixa fechado"}</span>
          <p class="muted">${sessao ? `Abertura ${sessao.reason === "abertura_manual" ? "manual" : "automática"} às ${new Date(sessao.openedAt || sessao.opened_at || Date.now()).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}` : "O caixa abre automaticamente no primeiro lançamento."}</p>
        </div>
        <div class="actions">
          ${sessao ? `<button class="btn ghost" type="button" onclick="fecharSessaoCaixaBasica()">Fechar caixa</button>` : `<button class="btn ghost" type="button" onclick="abrirSessaoCaixaManual()">Abrir caixa</button>`}
        </div>
      </div>
      <div class="metrics compact-metrics">
        <div class="metric"><span>Total vendido</span><strong>${formatarMoeda(resumo.entradas)}</strong></div>
        <div class="metric"><span>Retiradas/saídas</span><strong>${formatarMoeda(resumo.saidas)}</strong></div>
        <div class="metric"><span>Total esperado</span><strong>${formatarMoeda(resumo.expectedBalance)}</strong></div>
        <div class="metric"><span>Última movimentação</span><strong>${escaparHtml(ultima)}</strong></div>
      </div>
      <div class="cash-payment-summary">${linhasForma}</div>
    </div>
  `;
}

function filtrarMovimentosCaixa(movimentos, filtro = "todos", info = null, context = {}) {
  const { caixa, filtrarMovimentosCaixaPorPeriodo, movimentoCaixaCancelado } = context;
  if (movimentos === undefined) movimentos = caixa;
  const base = info ? filtrarMovimentosCaixaPorPeriodo(movimentos, info) : movimentos;
  if (filtro === "cancelados") return base.filter(movimentoCaixaCancelado);
  if (filtro === "entradas") return base.filter((movimento) => !movimentoCaixaCancelado(movimento) && String(movimento.tipo || "").toLowerCase() !== "saida");
  if (filtro === "saidas") return base.filter((movimento) => !movimentoCaixaCancelado(movimento) && String(movimento.tipo || "").toLowerCase() === "saida");
  return base;
}

function getBuscaCaixa(context = {}) {
  const { window } = context;
  return String(window.__caixaBusca || "");
}

function atualizarBuscaCaixa(valor = "", context = {}) {
  const { renderizarPreservandoScroll, window } = context;
  window.__caixaBusca = String(valor || "");
  renderizarPreservandoScroll();
}

function movimentoCaixaTextoBusca(movimento = {}, context = {}) {
  const { clienteDoPedido, descricaoCaixa, normalizarTextoBusca } = context;
  const pedido = encontrarPedidoPorMovimentoCaixa(movimento, context);
  return normalizarTextoBusca([
    getResumoMetodoMovimentoCaixa(movimento, context),
    descricaoCaixa(movimento),
    movimento.tipo,
    movimento.status,
    movimento.origem,
    movimento.source,
    movimento.responsavel,
    movimento.userName,
    movimento.usuario,
    movimento.cliente,
    movimento.customer,
    pedido?.id,
    pedido ? clienteDoPedido(pedido) : "",
    movimento.valor
  ].filter(Boolean).join(" "));
}

function filtrarMovimentosCaixaPorBusca(movimentos = [], busca, context = {}) {
  const { normalizarTextoBusca } = context;
  if (busca === undefined) busca = getBuscaCaixa(context);
  const termo = normalizarTextoBusca(busca || "");
  if (!termo) return movimentos;
  return movimentos.filter((movimento) => movimentoCaixaTextoBusca(movimento, context).includes(termo));
}

function renderCaixaBuscaTopo(context = {}) {
  const { escaparAttr, renderUiIcon } = context;
  const busca = getBuscaCaixa(context);
  return `
    <label class="cash-top-search" aria-label="Pesquisar movimentações do caixa">
      <span class="search-lens-icon" aria-hidden="true">${renderUiIcon("search")}</span>
      <input data-search-context="caixa" data-preserve-focus-key="caixa-busca" value="${escaparAttr(busca)}" placeholder="Pesquisar movimentações" oninput="atualizarBuscaCaixa(this.value); reabrirAutocompletePesquisaAposRender(this,30)" onblur="agendarFechamentoAutocompletePesquisa(this)" autocomplete="off">
    </label>
  `;
}

function renderResumoCaixaPrincipal(totais, movimentos = [], context = {}) {
  const { calcularTotaisCaixa, escaparAttr, escaparHtml, formatarMoeda, obterDataMovimentoCaixa, renderUiIcon } = context;
  if (totais === undefined) totais = calcularTotaisCaixa();
  const ultima = movimentos.length
    ? [...movimentos].sort((a, b) => (obterDataMovimentoCaixa(b)?.getTime?.() || 0) - (obterDataMovimentoCaixa(a)?.getTime?.() || 0))[0]
    : null;
  const cards = [
    { label: "Saldo", valor: formatarMoeda(totais.saldo), icon: "caixa", tone: totais.saldo < 0 ? "danger" : "success" },
    { label: "Entradas", valor: formatarMoeda(totais.entradas), icon: "pedidos", tone: "success" },
    { label: "Saídas", valor: formatarMoeda(totais.saidas), icon: "estoque", tone: "danger" },
    { label: "Movimentos", valor: String(movimentos.length), icon: "relatorios", tone: "neutral" },
    { label: "Último", valor: ultima ? formatarMoeda(ultima.valor) : "Sem movimento", icon: "agenda", tone: "neutral" }
  ];
  return `
    <div class="cash-main-summary" aria-label="Resumo principal do caixa">
      ${cards.map((card) => `
        <div class="metric cash-main-summary-card cash-main-summary-${escaparAttr(card.tone)}">
          <span>${renderUiIcon(card.icon)} ${escaparHtml(card.label)}</span>
          <strong>${escaparHtml(card.valor)}</strong>
        </div>
      `).join("")}
    </div>
  `;
}

function getTotaisCaixaPorForma(movimentos, context = {}) {
  const { caixa, getMetodoPagamentoMovimento, movimentoCaixaCancelado } = context;
  if (movimentos === undefined) movimentos = caixa;
  const totais = {};
  movimentos.forEach((movimento) => {
    if (movimentoCaixaCancelado(movimento) || String(movimento.tipo || "").toLowerCase() === "saida") return;
    const metodo = getMetodoPagamentoMovimento(movimento);
    totais[metodo.id] = (totais[metodo.id] || 0) + (Number(movimento.valor) || 0);
  });
  return totais;
}

function getIconeMetodoPagamentoCaixa(metodo = {}, context = {}) {
  const tipo = String(metodo.type || metodo.id || "").toLowerCase();
  if (tipo.includes("pix")) return "lojaOnline";
  if (tipo.includes("credit") || tipo.includes("credito") || tipo.includes("debit") || tipo.includes("debito")) return "assinatura";
  if (tipo.includes("cash") || tipo.includes("dinheiro")) return "caixa";
  return "caixa";
}

function irParaSlideCaixa(indice = 0, context = {}) {
  const { document } = context;
  const flow = document.querySelector(".cash-mobile-flow");
  if (!flow) return false;
  const alvo = flow.children[Math.max(0, Math.min(Number(indice) || 0, flow.children.length - 1))];
  if (!alvo) return false;
  flow.scrollTo({ left: alvo.offsetLeft, behavior: "smooth" });
  return true;
}

function getCardCaixaAtivo(context = {}) {
  const { window } = context;
  return String(window.__caixaCardAtivo || "");
}

function abrirCardCaixaRapido(tipo = "venda", context = {}) {
  const { renderizarPreservandoScroll, window } = context;
  window.__caixaCardAtivo = String(tipo || "venda");
  renderizarPreservandoScroll();
  if (["venda", "sangria", "suprimento"].includes(String(tipo))) {
    setTimeout(() => prepararAcaoCaixaRapida(tipo, context), 120);
  }
}

function fecharCardCaixaRapido(context = {}) {
  const { renderizarPreservandoScroll, window } = context;
  window.__caixaCardAtivo = "";
  renderizarPreservandoScroll();
}

function prepararAcaoCaixaRapida(tipo = "venda", context = {}) {
  const { document } = context;
  const preset = getPresetAcaoCaixaRapida(tipo, context);
  const campoTipo = document.getElementById("caixaTipo");
  const campoDescricao = document.getElementById("caixaDescricao");
  const campoValor = document.getElementById("caixaValor");
  if (campoTipo) campoTipo.value = preset.tipo;
  if (campoDescricao) campoDescricao.value = preset.descricao;
  campoValor?.focus?.();
}

function renderCaixaHero(totais, movimentos = [], context = {}) {
  const { calcularTotaisCaixa, escaparHtml, formatarMoeda, getSessaoCaixaAtual, renderUiIcon } = context;
  if (totais === undefined) totais = calcularTotaisCaixa();
  const sessao = getSessaoCaixaAtual();
  const abertaEm = sessao ? new Date(sessao.openedAt || sessao.opened_at || Date.now()) : null;
  const aberturaLabel = abertaEm ? abertaEm.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }) : "--:--";
  const saldoInicial = Number(sessao?.openingBalance ?? sessao?.opening_balance ?? 0) || 0;
  return `
    <section class="cash-hero-card">
      <div class="cash-hero-icon">${renderUiIcon("caixa")}</div>
      <div class="cash-hero-main">
        <div class="cash-hero-title-row">
          <div>
            <h3>${sessao ? "Caixa aberto" : "Caixa fechado"}</h3>
            <p><span class="cash-status-dot ${sessao ? "open" : "closed"}"></span>${sessao ? `Aberto desde ${aberturaLabel}` : "Aguardando abertura"}</p>
          </div>
          ${sessao ? `<button class="btn cash-hero-action" type="button" onclick="fecharSessaoCaixaBasica()">Fechar caixa</button>` : `<button class="btn cash-hero-action" type="button" onclick="abrirSessaoCaixaManual()">Abrir caixa</button>`}
        </div>
        <div class="cash-hero-stats">
          <span><small>Abertura</small><strong>${escaparHtml(aberturaLabel)}</strong></span>
          <span><small>Saldo inicial</small><strong>${formatarMoeda(saldoInicial)}</strong></span>
          <span class="cash-hero-balance"><small>Saldo atual</small><strong>${formatarMoeda(totais.saldo)}</strong></span>
        </div>
      </div>
    </section>
  `;
}

function renderCaixaAcoesRapidas(context = {}) {
  const { escaparHtml, renderUiIcon } = context;
  const acoes = [
    { id: "venda", label: "Nova venda", icon: "carrinho", action: "abrirCardCaixaRapido('venda')" },
    { id: "sangria", label: "Sangria", icon: "sangria", action: "abrirCardCaixaRapido('sangria')" },
    { id: "suprimento", label: "Suprimento", icon: "sangria", action: "abrirCardCaixaRapido('suprimento')" },
    { id: "recebimentos", label: "Recebimentos", icon: "assinatura", action: "abrirCardCaixaRapido('recebimentos')" }
  ];
  const ativo = getCardCaixaAtivo(context);
  return `
    <section class="cash-section cash-quick-actions-section">
      <div class="cash-section-head">
        <h3>Ações rápidas</h3>
      </div>
      <div class="cash-quick-actions-grid">
        ${acoes.map((acao, index) => `
          <button class="cash-quick-action ${ativo === acao.id || (!ativo && index === 0) ? "active" : ""}" type="button" onclick="${acao.action}">
            <span>${renderUiIcon(acao.icon)}</span>
            <strong>${escaparHtml(acao.label)}</strong>
          </button>
        `).join("")}
      </div>
    </section>
  `;
}

function getPresetAcaoCaixaRapida(tipo = "venda", context = {}) {
  const presets = {
    venda: { tipo: "entrada", descricao: "Venda balcão" },
    sangria: { tipo: "saida", descricao: "Sangria / retirada" },
    suprimento: { tipo: "entrada", descricao: "Suprimento de caixa" }
  };
  return presets[tipo] || presets.venda;
}

function renderFormularioMovimentoCaixaRapido(podeOperar = true, tipoAtivo, context = {}) {
  const { escaparAttr } = context;
  if (tipoAtivo === undefined) tipoAtivo = getCardCaixaAtivo(context) || "venda";
  if (!podeOperar) {
    return `<p class="muted">Seu acesso está bloqueado. Visualização liberada; lançamentos voltam após regularização.</p><div class="actions"><button class="btn" type="button" data-action="open-payment">Pagar agora</button></div>`;
  }
  const preset = getPresetAcaoCaixaRapida(tipoAtivo, context);
  return `
    <div class="cash-quick-form-grid">
      <label class="field">
        <span>Tipo</span>
        <select id="caixaTipo">
          <option value="entrada" ${preset.tipo === "entrada" ? "selected" : ""}>Entrada</option>
          <option value="saida" ${preset.tipo === "saida" ? "selected" : ""}>Saída</option>
        </select>
      </label>
      <label class="field">
        <span>Forma</span>
        <select id="caixaMetodoPagamento">
          ${renderOpcoesMetodoPagamentoCaixa("pix", context)}
        </select>
      </label>
      <label class="field">
        <span>Valor</span>
        <input id="caixaValor" type="number" min="0" step="0.01" placeholder="0,00">
      </label>
      <label class="field">
        <span>Descrição</span>
        <input id="caixaDescricao" value="${escaparAttr(preset.descricao)}" placeholder="Ex.: Venda balcão">
      </label>
    </div>
    <div class="actions cash-quick-form-actions">
      <button class="btn" onclick="adicionarMovimentoCaixa()">Lançar movimento</button>
      <button class="btn ghost" type="button" onclick="fecharCardCaixaRapido()">Cancelar</button>
    </div>
  `;
}

function renderCardCaixaAberto(podeOperar = true, movimentos = [], linhas = "", totais, context = {}) {
  const { calcularTotaisCaixa, escaparHtml, renderUiIcon } = context;
  if (totais === undefined) totais = calcularTotaisCaixa();
  const ativo = getCardCaixaAtivo(context);
  if (!ativo) return "";
  const titulos = {
    venda: ["Nova venda", "Registre uma entrada rápida no caixa."],
    sangria: ["Sangria", "Registre uma retirada ou saída de caixa."],
    suprimento: ["Suprimento", "Registre uma entrada de reforço no caixa."],
    recebimentos: ["Recebimentos", "Veja o resumo por forma de pagamento."],
    historico: ["Movimentações", "Consulte e pesquise os últimos lançamentos."],
    resumo: ["Resumo do dia", "Acompanhe entradas, saídas e saldo."]
  };
  const [titulo, subtitulo] = titulos[ativo] || titulos.venda;
  let conteudo = renderFormularioMovimentoCaixaRapido(podeOperar, ativo, context);
  if (ativo === "recebimentos") {
    conteudo = `${renderCaixaFormasPagamento(movimentos, context)}<div class="actions"><button class="btn" type="button" onclick="trocarAbaCaixa('extrato')">Abrir extrato</button><button class="btn ghost" type="button" onclick="fecharCardCaixaRapido()">Fechar</button></div>`;
  } else if (ativo === "historico") {
    conteudo = `${renderCaixaBuscaTopo(context)}<div class="cash-movement-history">${linhas}</div>`;
  } else if (ativo === "resumo") {
    conteudo = `${renderResumoCaixaPrincipal(totais, movimentos, context)}<div class="actions"><button class="btn" type="button" onclick="trocarAbaCaixa('extrato')">Abrir extrato</button><button class="btn ghost" type="button" onclick="fecharCardCaixaRapido()">Fechar</button></div>`;
  }
  return `
    <section class="cash-section cash-open-action-card">
      <div class="cash-section-head">
        <div>
          <h3>${escaparHtml(titulo)}</h3>
          <p class="muted">${escaparHtml(subtitulo)}</p>
        </div>
        <button class="icon-action-button" type="button" onclick="fecharCardCaixaRapido()" title="Fechar">${renderUiIcon("back")}</button>
      </div>
      ${conteudo}
    </section>
  `;
}

function renderCaixaMovimentosRecentes(movimentos = [], context = {}) {
  const { descricaoCaixa, escaparHtml, formatarMoeda, movimentoCaixaCancelado, obterDataMovimentoCaixa, renderUiIcon } = context;
  const recentes = [...movimentos]
    .sort((a, b) => (obterDataMovimentoCaixa(b)?.getTime?.() || 0) - (obterDataMovimentoCaixa(a)?.getTime?.() || 0))
    .slice(0, 4);
  return `
    <section class="cash-section cash-recent-section">
      <div class="cash-section-head">
        <h3>Movimentações recentes</h3>
        <button class="btn ghost" type="button" onclick="abrirCardCaixaRapido('historico')">Ver todas ›</button>
      </div>
      <div class="cash-recent-list">
        ${recentes.length ? recentes.map((movimento) => {
          const saida = String(movimento.tipo || "").toLowerCase() === "saida";
          const cancelado = movimentoCaixaCancelado(movimento);
          const data = obterDataMovimentoCaixa(movimento);
          const valor = Number(movimento.valor) || 0;
          const classe = cancelado ? "neutral" : saida ? "out" : "in";
          return `
            <button class="cash-recent-row cash-recent-${classe}" type="button" onclick="abrirCardCaixaRapido('historico')">
              <span class="cash-recent-icon">${renderUiIcon(saida ? "backup" : "sincronizar")}</span>
              <span class="cash-recent-copy">
                <strong>${escaparHtml(descricaoCaixa(movimento))}</strong>
                <small>${data ? data.toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" }) : "Sem data"}</small>
              </span>
              <span class="cash-recent-value">
                <strong>${saida ? "-" : "+"} ${formatarMoeda(valor)}</strong>
                <small>${saida ? "Saída" : "Entrada"}</small>
              </span>
            </button>
          `;
        }).join("") : `<p class="empty">Nenhuma movimentação recente.</p>`}
      </div>
    </section>
  `;
}

function renderCaixaResumoDia(totais, context = {}) {
  const { calcularTotaisCaixa, escaparAttr, escaparHtml, formatarMoeda, renderMiniSparklineDashboard } = context;
  if (totais === undefined) totais = calcularTotaisCaixa();
  const entradasSerie = [0, 15, 18, 16, 23, 22, 28, Math.max(30, totais.entradas || 0)];
  const saidasSerie = [0, 8, 12, 10, 16, 13, 12, Math.max(14, totais.saidas || 0)];
  const saldoSerie = [0, 12, 20, 18, 24, 23, 30, Math.max(32, Math.abs(totais.saldo) || 0)];
  const cards = [
    { label: "Entradas", valor: formatarMoeda(totais.entradas), series: entradasSerie, tone: "green" },
    { label: "Saídas", valor: formatarMoeda(totais.saidas), series: saidasSerie, tone: "pink" },
    { label: "Saldo", valor: formatarMoeda(totais.saldo), series: saldoSerie, tone: "blue" }
  ];
  return `
    <section class="cash-section cash-day-section">
      <div class="cash-section-head">
        <h3>Resumo do dia</h3>
        <button class="btn ghost" type="button" onclick="abrirCardCaixaRapido('resumo')">Detalhes</button>
      </div>
      <div class="cash-day-grid">
        ${cards.map((card) => `
          <button class="cash-day-card cash-day-${escaparAttr(card.tone)}" type="button" onclick="abrirCardCaixaRapido('resumo')">
            <span>${escaparHtml(card.label)}</span>
            <strong>${escaparHtml(card.valor)}</strong>
            ${renderMiniSparklineDashboard(card.series, card.tone === "pink" ? "orange" : card.tone)}
          </button>
        `).join("")}
      </div>
    </section>
  `;
}

function renderCaixaFormasPagamento(movimentos = [], context = {}) {
  const { escaparHtml, formatarMoeda, getMetodosPagamentoCaixa, renderUiIcon } = context;
  const totaisForma = getTotaisCaixaPorForma(movimentos, context);
  return `
    <section class="cash-section cash-payment-section">
      <div class="cash-section-head">
        <h3>Formas de pagamento</h3>
        <button class="btn ghost" type="button" onclick="trocarAbaCaixa('extrato')">Ver todas ›</button>
      </div>
      <div class="cash-payment-cards">
        ${getMetodosPagamentoCaixa().map((metodo) => `
          <button class="cash-payment-card" type="button" onclick="trocarAbaCaixa('extrato')">
            <span>${renderUiIcon(getIconeMetodoPagamentoCaixa(metodo, context))}</span>
            <strong>${escaparHtml(metodo.name)}</strong>
            <small>${formatarMoeda(totaisForma[metodo.id] || 0)}</small>
          </button>
        `).join("")}
      </div>
    </section>
  `;
}

function renderCaixaMobileTopbar(context = {}) {
  const { escaparHtml, getUsuarioAtual, renderMenuHandleIcon, renderUiIcon } = context;
  const usuario = getUsuarioAtual();
  const nome = usuario?.empresa || usuario?.nome || usuario?.email?.split("@")[0] || "Simplifica";
  return `
    <div class="cash-mobile-topbar">
      <button class="icon-button cash-mobile-menu-button" type="button" onclick="abrirMenuPopup()" aria-label="Abrir menu">${renderMenuHandleIcon()}</button>
      <div>
        <h2>Olá, ${escaparHtml(nome)}!</h2>
        <p>Aqui está o resumo do seu caixa hoje.</p>
      </div>
      <button class="icon-button cash-mobile-search-button" type="button" onclick="abrirCardCaixaRapido('historico');setTimeout(()=>document.querySelector('.cash-top-search input')?.focus?.(),120)" aria-label="Pesquisar"><span class="search-lens-icon" aria-hidden="true">${renderUiIcon("search")}</span></button>
    </div>
  `;
}

function renderCaixaOverview(totais, movimentos = [], podeOperar = true, linhas = "", controles = "", context = {}) {
  const { calcularTotaisCaixa } = context;
  if (totais === undefined) totais = calcularTotaisCaixa();
  return `
    <div class="cash-experience">
      ${renderCaixaMobileTopbar(context)}
      ${renderCaixaHero(totais, movimentos, context)}
      ${controles}
      ${renderCaixaAcoesRapidas(context)}
      ${renderCardCaixaAberto(podeOperar, movimentos, linhas, totais, context)}
      ${renderCaixaMovimentosRecentes(movimentos, context)}
      ${renderCaixaResumoDia(totais, context)}
      ${renderCaixaFormasPagamento(movimentos, context)}
    </div>
  `;
}

function classificarOrigemMovimentoCaixa(movimento = {}, context = {}) {
  const { descricaoCaixa, movimentoCaixaCancelado, normalizarTextoBusca } = context;
  if (movimentoCaixaCancelado(movimento)) return "cancelamento";
  const texto = normalizarTextoBusca(`${movimento.origem || ""} ${movimento.source || ""} ${descricaoCaixa(movimento)} ${movimento.status || ""}`);
  if (movimento.pedidoId || movimento.orderId || texto.includes("pedido")) return "pedido pago";
  if (texto.includes("taxa")) return "taxa";
  if (texto.includes("desconto")) return "desconto";
  if (texto.includes("retirada") || texto.includes("sangria")) return "retirada";
  if (texto.includes("ajuste")) return "ajuste";
  if (texto.includes("despesa") || texto.includes("compra") || String(movimento.tipo || "").toLowerCase() === "saida") return "despesa";
  return "entrada manual";
}

function encontrarPedidoPorMovimentoCaixa(movimento = {}, context = {}) {
  const { descricaoCaixa, pedidos } = context;
  const idDireto = movimento.pedidoId || movimento.orderId || movimento.order_id || "";
  if (idDireto) {
    const pedido = pedidos.find((item) => String(item.id) === String(idDireto));
    if (pedido) return pedido;
  }
  const texto = String(descricaoCaixa(movimento) || "");
  const idTexto = texto.match(/#?\b(\d{1,10})\b/);
  if (idTexto) return pedidos.find((item) => String(item.id) === idTexto[1]) || null;
  return null;
}

function getMovimentosExtratoFinanceiro(context = {}) {
  const { clienteDoPedido, descricaoCaixa, getMovimentosCaixaDaConta, getUsuarioAtual, movimentoCaixaCancelado, obterDataMovimentoCaixa } = context;
  const ordenados = getMovimentosCaixaDaConta()
    .map((movimento, indice) => {
      const data = obterDataMovimentoCaixa(movimento) || new Date(0);
      const pedido = encontrarPedidoPorMovimentoCaixa(movimento, context);
      const cancelado = movimentoCaixaCancelado(movimento);
      const saida = String(movimento.tipo || "").toLowerCase() === "saida";
      const valorAbs = Math.abs(Number(movimento.valor) || 0);
      const valorAssinado = cancelado ? 0 : saida ? -valorAbs : valorAbs;
      return {
        indice,
        movimento,
        pedido,
        data,
        descricao: descricaoCaixa(movimento),
        valor: valorAbs,
        valorAssinado,
        tipo: cancelado ? "cancelado" : saida ? "saida" : "entrada",
        responsavel: movimento.responsavel || movimento.userName || movimento.usuario || getUsuarioAtual()?.nome || getUsuarioAtual()?.email || "Sistema",
        origem: classificarOrigemMovimentoCaixa(movimento, context),
        status: cancelado ? "cancelado" : movimento.status || "confirmado",
        cliente: pedido ? clienteDoPedido(pedido) : (movimento.cliente || movimento.customer || ""),
        pedidoId: pedido?.id || movimento.pedidoId || movimento.orderId || ""
      };
    })
    .sort((a, b) => a.data - b.data || a.indice - b.indice);

  let saldo = 0;
  ordenados.forEach((item) => {
    saldo += item.valorAssinado;
    item.saldoAcumulado = saldo;
  });
  return ordenados;
}

function getFiltrosExtratoFinanceiro(context = {}) {
  const { window } = context;
  window.__extratoFinanceiroFiltros = window.__extratoFinanceiroFiltros || {};
  return {
    tipo: window.__extratoFinanceiroFiltros.tipo || "todos",
    pedido: window.__extratoFinanceiroFiltros.pedido || "",
    cliente: window.__extratoFinanceiroFiltros.cliente || ""
  };
}

function atualizarFiltroExtratoCampo(campo, valor, context = {}) {
  const { renderizarPreservandoScroll, window } = context;
  window.__extratoFinanceiroFiltros = window.__extratoFinanceiroFiltros || {};
  window.__extratoFinanceiroFiltros[campo] = String(valor || "");
  renderizarPreservandoScroll();
}

function filtrarExtratoFinanceiro(itens, info, filtros, context = {}) {
  const { dataDentroIntervalo, getInfoPeriodoCaixa, normalizarTextoBusca } = context;
  if (itens === undefined) itens = getMovimentosExtratoFinanceiro(context);
  if (info === undefined) info = getInfoPeriodoCaixa();
  if (filtros === undefined) filtros = getFiltrosExtratoFinanceiro(context);
  const tipo = String(filtros.tipo || "todos");
  const pedidoBusca = normalizarTextoBusca(filtros.pedido || "");
  const clienteBusca = normalizarTextoBusca(filtros.cliente || "");
  const buscaCaixa = normalizarTextoBusca(getBuscaCaixa(context));
  return itens.filter((item) => {
    if (!dataDentroIntervalo(item.data, info.start, info.end)) return false;
    if (tipo !== "todos") {
      if (["entrada", "saida", "cancelado"].includes(tipo) && item.tipo !== tipo) return false;
      if (!["entrada", "saida", "cancelado"].includes(tipo) && normalizarTextoBusca(item.origem) !== tipo) return false;
    }
    if (pedidoBusca && !normalizarTextoBusca(`${item.pedidoId || ""} ${item.descricao || ""}`).includes(pedidoBusca)) return false;
    if (clienteBusca && !normalizarTextoBusca(`${item.cliente || ""} ${item.descricao || ""}`).includes(clienteBusca)) return false;
    if (buscaCaixa && !normalizarTextoBusca(`${item.descricao || ""} ${item.origem || ""} ${item.cliente || ""} ${item.pedidoId || ""} ${item.responsavel || ""} ${item.status || ""} ${item.valor || ""}`).includes(buscaCaixa)) return false;
    return true;
  });
}

function calcularLucroEstimadoExtrato(info, context = {}) {
  const { calcularCustosPedidoAnalytics, dataDentroIntervalo, getDataPedidoLocal, getInfoPeriodoCaixa, pedidoContaParaAnalytics, pedidos, totalPedido } = context;
  if (info === undefined) info = getInfoPeriodoCaixa();
  return pedidos
    .filter((pedido) => pedidoContaParaAnalytics(pedido) && dataDentroIntervalo(getDataPedidoLocal(pedido), info.start, info.end))
    .reduce((total, pedido) => {
      const custos = calcularCustosPedidoAnalytics(pedido);
      return total + Math.max(0, totalPedido(pedido) - custos.cost);
    }, 0);
}

function calcularResumoExtratoFinanceiro(itens = [], info, context = {}) {
  const { calcularTotaisCaixa, getInfoPeriodoCaixa } = context;
  if (info === undefined) info = getInfoPeriodoCaixa();
  const resumo = itens.reduce((totais, item) => {
    if (item.tipo === "cancelado") {
      totais.cancelados += 1;
      return totais;
    }
    if (item.valorAssinado < 0) totais.saidas += Math.abs(item.valorAssinado);
    else totais.entradas += item.valorAssinado;
    totais.saldoFinal = totais.entradas - totais.saidas;
    return totais;
  }, { entradas: 0, saidas: 0, saldoFinal: 0, cancelados: 0 });
  resumo.saldoAtual = calcularTotaisCaixa().saldo;
  resumo.lucroEstimado = calcularLucroEstimadoExtrato(info, context);
  return resumo;
}

function getExtratoFinanceiroAtual(context = {}) {
  const { getInfoPeriodoCaixa } = context;
  const info = getInfoPeriodoCaixa();
  const filtros = getFiltrosExtratoFinanceiro(context);
  const itens = filtrarExtratoFinanceiro(getMovimentosExtratoFinanceiro(context), info, filtros, context);
  return { info, filtros, itens, resumo: calcularResumoExtratoFinanceiro(itens, info, context) };
}

function renderResumoCardsExtrato(resumo, context = {}) {
  const { escaparAttr, escaparHtml, formatarMoeda } = context;
  const cards = [
    { label: "Total entradas", valor: formatarMoeda(resumo.entradas), tone: "entrada" },
    { label: "Total saídas", valor: formatarMoeda(resumo.saidas), tone: "saida" },
    { label: "Lucro estimado", valor: formatarMoeda(resumo.lucroEstimado), tone: "lucro" },
    { label: "Saldo final", valor: formatarMoeda(resumo.saldoFinal), tone: resumo.saldoFinal < 0 ? "saida" : "entrada" }
  ];
  return `
    <div class="statement-summary-grid">
      ${cards.map((card) => `
        <div class="metric statement-summary-card statement-${escaparAttr(card.tone)}">
          <span>${escaparHtml(card.label)}</span>
          <strong>${escaparHtml(card.valor)}</strong>
        </div>
      `).join("")}
    </div>
  `;
}

function renderFiltrosExtratoFinanceiro(filtros, context = {}) {
  const { escaparAttr, escaparHtml } = context;
  if (filtros === undefined) filtros = getFiltrosExtratoFinanceiro(context);
  const tipos = [
    ["todos", "Todos os tipos"],
    ["entrada", "Entradas"],
    ["saida", "Saídas"],
    ["cancelado", "Cancelamentos"],
    ["pedido pago", "Pedido pago"],
    ["entrada manual", "Entrada manual"],
    ["retirada", "Retirada"],
    ["ajuste", "Ajuste"],
    ["despesa", "Despesa"],
    ["taxa", "Taxa"],
    ["desconto", "Desconto"]
  ];
  return `
    <div class="statement-filter-grid">
      <label class="field">
        <span>Tipo de movimentação</span>
        <select onchange="atualizarFiltroExtratoCampo('tipo', this.value)">
          ${tipos.map(([id, label]) => `<option value="${escaparAttr(id)}" ${filtros.tipo === id ? "selected" : ""}>${escaparHtml(label)}</option>`).join("")}
        </select>
      </label>
      <label class="field">
        <span>Pedido</span>
        <input value="${escaparAttr(filtros.pedido)}" placeholder="Número ou descrição" onchange="atualizarFiltroExtratoCampo('pedido', this.value)">
      </label>
      <label class="field">
        <span>Cliente</span>
        <input value="${escaparAttr(filtros.cliente)}" placeholder="Nome do cliente" onchange="atualizarFiltroExtratoCampo('cliente', this.value)">
      </label>
    </div>
  `;
}

function renderLinhaExtratoFinanceiro(item, context = {}) {
  const { escaparAttr, escaparHtml, formatarMoeda } = context;
  const valorClasse = item.valorAssinado < 0 ? "negative" : item.tipo === "cancelado" ? "neutral" : "positive";
  return `
    <div class="statement-row statement-${escaparAttr(item.tipo)}">
      <div class="statement-row-main">
        <div class="row-title">
          <strong>${escaparHtml(item.descricao)}</strong>
          <span class="statement-value ${valorClasse}">${formatarMoeda(item.valorAssinado)}</span>
        </div>
        <div class="statement-meta">
          <span>${item.data ? item.data.toLocaleString("pt-BR") : "-"}</span>
          <span>${escaparHtml(item.origem)}</span>
          ${item.cliente ? `<span>${escaparHtml(item.cliente)}</span>` : ""}
          ${item.pedidoId ? `<span>Pedido #${escaparHtml(item.pedidoId)}</span>` : ""}
        </div>
        <div class="statement-meta muted">
          <span>Responsável: ${escaparHtml(item.responsavel)}</span>
          <span>Status: ${escaparHtml(item.status)}</span>
          <span>Saldo acumulado: ${formatarMoeda(item.saldoAcumulado)}</span>
        </div>
      </div>
    </div>
  `;
}

function renderExtratoFinanceiro(context = {}) {
  const { escaparHtml, planoPermiteRecurso, renderUiIcon } = context;
  const { info, filtros, itens, resumo } = getExtratoFinanceiroAtual(context);
  const proLiberado = planoPermiteRecurso("reports");
  if (!proLiberado) {
    return `
      <section class="statement-panel statement-locked">
        ${renderResumoCardsExtrato(resumo, context)}
        <div class="pro-lock-panel">
          <span class="status-badge">PRO</span>
          <h3>Extrato Financeiro</h3>
          <p>Desbloqueie o Extrato Financeiro completo no plano Pro.</p>
          <button class="btn" type="button" data-action="open-payment" data-slug="pro">Assinar Pro</button>
        </div>
      </section>
    `;
  }
  return `
    <section class="statement-panel">
      <div class="statement-head">
        <div>
          <span class="eyebrow">Fluxo financeiro</span>
          <h3>Extrato Financeiro</h3>
          <p class="muted">${escaparHtml(info.label)}: ${info.start.toLocaleDateString("pt-BR")} a ${info.endInclusive.toLocaleDateString("pt-BR")}</p>
        </div>
        <div class="actions statement-actions">
          <button class="btn ghost" type="button" onclick="exportarExtratoFinanceiro('pdf')">${renderUiIcon("pdf")} PDF</button>
          <button class="btn ghost" type="button" onclick="exportarExtratoFinanceiro('print')">${renderUiIcon("print")} Imprimir</button>
          <button class="btn ghost" type="button" onclick="compartilharExtratoFinanceiro()">${renderUiIcon("whatsapp")} WhatsApp</button>
        </div>
      </div>
      <div class="statement-mobile-flow" aria-label="Telas do extrato financeiro">
        <section class="statement-mobile-slide">
          ${renderFiltrosExtratoFinanceiro(filtros, context)}
        </section>
        <section class="statement-mobile-slide">
          ${renderResumoCardsExtrato(resumo, context)}
        </section>
        <section class="statement-mobile-slide statement-history-slide">
          <div class="statement-list">
            ${itens.length ? [...itens].reverse().map((...__args) => renderLinhaExtratoFinanceiro(__args[0], context)).join("") : `<p class="empty">Nenhuma movimentação no período selecionado.</p>`}
          </div>
        </section>
      </div>
    </section>
  `;
}

function textoExtratoFinanceiro(context = {}) {
  const { formatarMoeda } = context;
  const { info, itens, resumo } = getExtratoFinanceiroAtual(context);
  const linhas = [
    "Extrato Financeiro - Simplifica 3D",
    `${info.label}: ${info.start.toLocaleDateString("pt-BR")} a ${info.endInclusive.toLocaleDateString("pt-BR")}`,
    `Entradas: ${formatarMoeda(resumo.entradas)}`,
    `Saídas: ${formatarMoeda(resumo.saidas)}`,
    `Lucro estimado: ${formatarMoeda(resumo.lucroEstimado)}`,
    `Saldo final: ${formatarMoeda(resumo.saldoFinal)}`,
    ""
  ];
  itens.forEach((item) => {
    linhas.push(`${item.data.toLocaleString("pt-BR")} | ${item.origem} | ${item.descricao} | ${formatarMoeda(item.valorAssinado)} | Saldo: ${formatarMoeda(item.saldoAcumulado)}`);
  });
  return linhas.join("\n");
}

async function exportarExtratoFinanceiro(modo = "pdf", context = {}) {
  const { alert, formatarMoeda, hojeIsoData, imprimirOuOferecerPdf, mostrarBloqueioRecursoPro, planoPermiteRecurso, salvarOuCompartilharPdf, window } = context;
  if (!planoPermiteRecurso("reports")) {
    mostrarBloqueioRecursoPro("Extrato Financeiro completo");
    return false;
  }
  const jsPDF = window.jspdf?.jsPDF;
  if (!jsPDF) {
    alert("Biblioteca de PDF não carregou. Verifique a internet e tente novamente.");
    return false;
  }
  const { info, itens, resumo } = getExtratoFinanceiroAtual(context);
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const largura = doc.internal.pageSize.getWidth();
  const margem = 12;
  let y = 16;
  doc.setTextColor(17, 24, 39);
  doc.setFontSize(16);
  doc.text("Extrato Financeiro", margem, y);
  y += 7;
  doc.setFontSize(9);
  doc.setTextColor(71, 85, 105);
  doc.text(`${info.label}: ${info.start.toLocaleDateString("pt-BR")} a ${info.endInclusive.toLocaleDateString("pt-BR")}`, margem, y);
  y += 8;
  doc.setTextColor(17, 24, 39);
  [
    `Entradas: ${formatarMoeda(resumo.entradas)}`,
    `Saídas: ${formatarMoeda(resumo.saidas)}`,
    `Lucro estimado: ${formatarMoeda(resumo.lucroEstimado)}`,
    `Saldo final: ${formatarMoeda(resumo.saldoFinal)}`
  ].forEach((linha) => {
    doc.text(linha, margem, y);
    y += 6;
  });
  y += 4;
  itens.forEach((item) => {
    if (y > 280) {
      doc.addPage();
      y = 16;
    }
    doc.setFontSize(8.5);
    doc.setTextColor(17, 24, 39);
    const descricao = `${item.data.toLocaleString("pt-BR")} - ${item.descricao}`;
    doc.text(doc.splitTextToSize(descricao, largura - margem * 2), margem, y);
    y += 5;
    doc.setTextColor(71, 85, 105);
    doc.text(`${item.origem} | ${item.tipo} | ${formatarMoeda(item.valorAssinado)} | Saldo ${formatarMoeda(item.saldoAcumulado)}`, margem, y);
    y += 7;
  });
  const nome = `extrato-financeiro-${hojeIsoData()}.pdf`;
  return String(modo).toLowerCase().includes("print")
    ? imprimirOuOferecerPdf(doc, nome, "Extrato Financeiro Simplifica 3D")
    : salvarOuCompartilharPdf(doc, nome, "Extrato Financeiro Simplifica 3D");
}

async function compartilharExtratoFinanceiro(context = {}) {
  const { alert, mostrarBloqueioRecursoPro, mostrarToast, navigator, planoPermiteRecurso } = context;
  if (!planoPermiteRecurso("reports")) {
    mostrarBloqueioRecursoPro("Extrato Financeiro completo");
    return false;
  }
  const texto = textoExtratoFinanceiro(context);
  if (navigator.share) {
    try {
      await navigator.share({ title: "Extrato Financeiro Simplifica 3D", text: texto });
      return true;
    } catch (erro) {
      if (erro?.name === "AbortError") return true;
    }
  }
  try {
    await navigator.clipboard?.writeText(texto);
    mostrarToast("Extrato copiado para a área de transferência.", "sucesso", 2800);
    return true;
  } catch (_) {
    alert(texto);
    return false;
  }
}

function renderCaixa(context = {}) {
  const { caixa, calcularTotaisCaixaPeriodo, descricaoCaixa, escaparHtml, filtrarMovimentosCaixaPorPeriodo, formatarDataCurta, formatarMoeda, getCaixaFiltroAtivo, getCaixaPeriodoAtivo, getCaixaViewAtiva, getInfoPeriodoCaixa, getMovimentosCaixaDaConta, isContextAdvancedVisible, movimentoCaixaCancelado, permitirVisualizacaoOperacionalBasica, renderContextualAdvancedToggle, renderIconeAcaoPedido, renderUiIcon } = context;
  const podeOperar = permitirVisualizacaoOperacionalBasica();
  const caixaView = getCaixaViewAtiva();
  const periodoCaixa = getCaixaPeriodoAtivo();
  const infoPeriodoCaixa = getInfoPeriodoCaixa(periodoCaixa);
  const movimentosConta = getMovimentosCaixaDaConta();
  const movimentosPeriodo = filtrarMovimentosCaixaPorPeriodo(movimentosConta, infoPeriodoCaixa);
  const totais = calcularTotaisCaixaPeriodo(infoPeriodoCaixa.start, infoPeriodoCaixa.end, movimentosConta);
  const filtroCaixa = getCaixaFiltroAtivo();
  const movimentosFiltrados = filtrarMovimentosCaixaPorBusca(filtrarMovimentosCaixa(movimentosPeriodo, filtroCaixa, undefined, context), undefined, context);
  const linhas = movimentosFiltrados.length
    ? [...movimentosFiltrados].reverse().map((movimento) => {
        const indice = caixa.findIndex((item) => item === movimento || String(item.id || "") === String(movimento.id || ""));
        const saida = movimento.tipo === "saida";
        const cancelado = movimentoCaixaCancelado(movimento);
        return `
          <div class="cash-row cash-row-${cancelado ? "cancelado" : saida ? "saida" : "entrada"}">
            <div class="cash-row-main">
              <div class="row-title">
                <strong>${escaparHtml(getResumoMetodoMovimentoCaixa(movimento, context))}</strong>
                <span class="muted">${formatarMoeda(movimento.valor)}</span>
              </div>
              <div class="muted">${escaparHtml(descricaoCaixa(movimento))}</div>
              ${movimento.data ? `<small class="cash-row-date">${formatarDataCurta(movimento.data)}</small>` : ""}
              ${cancelado ? `<small class="cash-row-date">Cancelado: ${escaparHtml(movimento.motivoCancelamento || movimento.cancelReason || "sem motivo informado")}</small>` : ""}
            </div>
            ${podeOperar && !cancelado && indice >= 0 && !movimento.canonical_readonly ? `<div class="row-actions cash-row-actions" aria-label="Ações do movimento">
              <button class="icon-action-button" type="button" onclick="editarMovimentoCaixa(${indice})" title="Editar movimento">${renderIconeAcaoPedido("✎", "Editar")}</button>
              <button class="icon-action-button danger" type="button" onclick="removerMovimentoCaixa(${indice})" title="Cancelar movimento">${renderIconeAcaoPedido("🗑", "Cancelar")}</button>
            </div>` : ""}
          </div>
        `;
      }).join("")
    : `<p class="empty">Nenhum movimento neste filtro.</p>`;
  const controlesCaixa = `
    ${renderCaixaViewTabs(caixaView, context)}
    ${isContextAdvancedVisible("caixa") ? renderCaixaPeriodoChips(periodoCaixa, context) : ""}
    ${caixaView !== "extrato" && isContextAdvancedVisible("caixa") ? renderCaixaFiltroChips(movimentosPeriodo, filtroCaixa, context) : ""}
  `;

  return `
    <section class="ui3-real-screen ui3-page ui3-stack ui3-gap-4 ui3-cash-screen" data-ui-version="v3" data-ui3-screen="caixa">
      <div class="card-header cash-screen-header">
        <h2>${renderUiIcon("caixa")} Caixa</h2>
        <div class="actions compact-actions">${renderContextualAdvancedToggle("caixa")}<strong>${formatarMoeda(totais.saldo)}</strong></div>
      </div>
      ${caixaView === "extrato" ? `${controlesCaixa}${renderExtratoFinanceiro(context)}` : `
        ${renderCaixaOverview(totais, movimentosFiltrados, podeOperar, linhas, controlesCaixa, context)}
      `}
    </section>
  `;
}
  const api = Object.freeze({ renderCaixaViewTabs, renderCaixaPeriodoChips, renderCaixaFiltroChips, renderOpcoesMetodoPagamentoCaixa, getRotuloTipoMovimentoCaixa, getResumoMetodoMovimentoCaixa, renderStatusSessaoCaixaSimples, filtrarMovimentosCaixa, getBuscaCaixa, atualizarBuscaCaixa, movimentoCaixaTextoBusca, filtrarMovimentosCaixaPorBusca, renderCaixaBuscaTopo, renderResumoCaixaPrincipal, getTotaisCaixaPorForma, getIconeMetodoPagamentoCaixa, irParaSlideCaixa, getCardCaixaAtivo, abrirCardCaixaRapido, fecharCardCaixaRapido, prepararAcaoCaixaRapida, renderCaixaHero, renderCaixaAcoesRapidas, getPresetAcaoCaixaRapida, renderFormularioMovimentoCaixaRapido, renderCardCaixaAberto, renderCaixaMovimentosRecentes, renderCaixaResumoDia, renderCaixaFormasPagamento, renderCaixaMobileTopbar, renderCaixaOverview, classificarOrigemMovimentoCaixa, encontrarPedidoPorMovimentoCaixa, getMovimentosExtratoFinanceiro, getFiltrosExtratoFinanceiro, atualizarFiltroExtratoCampo, filtrarExtratoFinanceiro, calcularLucroEstimadoExtrato, calcularResumoExtratoFinanceiro, getExtratoFinanceiroAtual, renderResumoCardsExtrato, renderFiltrosExtratoFinanceiro, renderLinhaExtratoFinanceiro, renderExtratoFinanceiro, textoExtratoFinanceiro, exportarExtratoFinanceiro, compartilharExtratoFinanceiro, renderCaixa });
  global.SimplificaCashRenderer = api;
  if (typeof module !== "undefined" && module.exports) module.exports = api;
})(typeof window !== "undefined" ? window : globalThis);
