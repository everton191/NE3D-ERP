(function attachInventoryScreenRenderer(global) {
  "use strict";

  function renderEstoque(context = {}) {
    const {
      telaComCarregamentoUX,
      renderSmartScreenSkeleton,
      permitirVisualizacaoOperacionalBasica,
      usuarioPodeVerCustosEstoque,
      normalizarEstoque,
      getEstoqueFiltroAtivo,
      getOrdenacaoEstoqueAtiva,
      ordenarMateriaisEstoque,
      filtrarMateriaisEstoque,
      calcularCustoKgMaterialEstoque,
      labelStatusEstoque,
      classeStatusEstoque,
      renderMidiaMaterialEstoque,
      escaparHtml,
      escaparAttr,
      formatarCodigoMaterialEstoque,
      formatarQuantidadeEstoque,
      getCodigoExternoMaterialEstoque,
      formatarMoeda,
      renderUiIcon,
      renderEstoqueStatusChips,
      renderEstoqueDetalheSelecionado,
      estoque = []
    } = context;
    if (telaComCarregamentoUX("estoque")) return renderSmartScreenSkeleton("estoque");
    const limiteLista = 6;
    const podeOperar = permitirVisualizacaoOperacionalBasica();
    const podeVerCustos = usuarioPodeVerCustosEstoque();
    const materiaisNormalizados = normalizarEstoque();
    const filtroEstoque = getEstoqueFiltroAtivo();
    const buscaEstoque = String(global.__estoqueBusca || "");
    const ordenacaoEstoque = getOrdenacaoEstoqueAtiva();
    const materiaisFiltrados = ordenarMateriaisEstoque(filtrarMateriaisEstoque(materiaisNormalizados, filtroEstoque, buscaEstoque), ordenacaoEstoque);
    const listaExpandida = global.__estoqueListaExpandida === true || buscaEstoque.trim().length > 0;
    const materiaisExibidos = listaExpandida ? materiaisFiltrados : materiaisFiltrados.slice(0, limiteLista);
    const itensBaixos = materiaisNormalizados.filter((material) => material.stock_status === "low").length;
    const itensCriticos = materiaisNormalizados.filter((material) => material.stock_status === "critical").length;
    const itensSemEstoque = materiaisNormalizados.filter((material) => (Number(material.qtd) || 0) <= 0).length;
    const valorTotalEstoque = materiaisNormalizados.reduce((soma, material) => {
      const valorRegistrado = Number(material.valorTotal || material.valor_total || material.custoTotal || material.costTotal) || 0;
      const custoKg = calcularCustoKgMaterialEstoque(material);
      return soma + (valorRegistrado || (Number(material.qtd) || 0) * custoKg);
    }, 0);
    const linhas = materiaisExibidos.length
      ? materiaisExibidos.map((material) => {
          const indice = materiaisNormalizados.findIndex((item) => String(item.id) === String(material.id));
          const percentual = Number(material.remaining_percent) || 0;
          const statusLabel = material.stock_status === "critical" ? "Sem estoque" : labelStatusEstoque(material.stock_status);
          const preco = Math.max(0, Number(material.custoUnitario || material.unit_cost) || calcularCustoKgMaterialEstoque(material));
          return `
            <div class="stock-row smart-stock-row ${classeStatusEstoque(material.stock_status)} ${String(global.__estoqueSelecionadoId || "") === String(material.id) ? "selected" : ""}">
              ${renderMidiaMaterialEstoque(material)}
              <button class="row-title stock-row-main-button" type="button" data-action="stock-view" data-index="${indice}">
                <span class="stock-row-title-line"><strong>${escaparHtml(material.nome)}</strong><b class="stock-code-badge">${escaparHtml(formatarCodigoMaterialEstoque(material))}</b></span>
                <span class="muted">${escaparHtml(material.categoria || material.tipo || "Geral")} • ${escaparHtml(material.tipoItem || material.item_type || "Material")}</span>
                <span class="muted">Estoque: ${formatarQuantidadeEstoque(material.qtd, material.unidade || "un")}${getCodigoExternoMaterialEstoque(material) ? ` <b>|</b> Externo: ${escaparHtml(getCodigoExternoMaterialEstoque(material))}` : ""}</span>
              </button>
              <div class="stock-percent-box">
                <strong>${podeVerCustos && preco ? formatarMoeda(preco) : `${percentual}%`}</strong>
                <span class="status-badge ${material.stock_status === "critical" ? "badge-cancelado" : material.stock_status === "low" ? "badge-alerta" : "badge-ativo"}">${escaparHtml(statusLabel)}</span>
              </div>
              <details class="ui-context-menu stock-item-menu">
                <summary class="icon-action-button ui-context-menu-trigger" title="Ações de ${escaparAttr(material.nome)}" aria-label="Ações de ${escaparAttr(material.nome)}">${renderUiIcon("more")}</summary>
                <div class="ui-context-menu-panel stock-item-menu-popover">
                  <button type="button" data-action="stock-view" data-index="${indice}">${renderUiIcon("search")} Ver detalhes</button>
                  <button type="button" data-action="stock-restock" data-index="${indice}">${renderUiIcon("upload")} Registrar entrada</button>
                  <button type="button" data-action="stock-output" data-index="${indice}">${renderUiIcon("download")} Registrar saída</button>
                  <button type="button" data-action="stock-edit" data-index="${indice}">${renderUiIcon("edit")} Editar item</button>
                  <button class="danger" type="button" data-action="stock-remove" data-index="${indice}">${renderUiIcon("trash")} Excluir</button>
                </div>
              </details>
            </div>
          `;
        }).join("")
      : `<p class="empty">Nenhum item encontrado.</p>`;

    return `
      <section class="ui3-real-screen ui3-page ui3-stack ui3-gap-4 ui3-stock" data-ui-version="v3" data-ui3-screen="estoque">
        <div class="card-header stock-page-header">
          <div>
            <h2>Estoque</h2>
            <p class="muted">${materiaisNormalizados.length} item(ns) cadastrados</p>
          </div>
          <div class="stock-header-actions">
            ${podeOperar ? `<button class="btn stock-add-header" type="button" onclick="abrirCadastroItemEstoque()">${renderUiIcon("plus")} Novo item</button>` : ""}
            <button class="icon-action-button" type="button" onclick="trocarTela('feedback')" title="Alertas">${renderUiIcon("bell")}</button>
          </div>
        </div>
        <div class="stock-summary-grid">
          <button class="stock-summary-card" type="button" onclick="trocarFiltroEstoque('todos')">
            <span>Itens cadastrados</span>
            <strong>${materiaisNormalizados.length}</strong>
            <small>Total de itens</small>
            <i>${renderUiIcon("estoque")}</i>
          </button>
          <button class="stock-summary-card" type="button" onclick="trocarFiltroEstoque('todos')">
            <span>Valor do estoque</span>
            <strong>${podeVerCustos ? formatarMoeda(valorTotalEstoque) : "Restrito"}</strong>
            <small>Valor total</small>
            <i>${renderUiIcon("financeiro")}</i>
          </button>
          <button class="stock-summary-card" type="button" onclick="trocarFiltroEstoque('low')">
            <span>Estoque baixo</span>
            <strong>${itensBaixos + itensCriticos}</strong>
            <small>Itens</small>
            <i class="warn">${renderUiIcon("alerta")}</i>
          </button>
          <button class="stock-summary-card" type="button" onclick="trocarFiltroEstoque('sem_estoque')">
            <span>Sem estoque</span>
            <strong>${itensSemEstoque}</strong>
            <small>Itens</small>
            <i class="danger">${renderUiIcon("trash")}</i>
          </button>
        </div>
        ${podeOperar ? "" : `<p class="muted">Visualização liberada; alterações voltam após regularização.</p>`}
        ${renderEstoqueStatusChips(materiaisNormalizados, filtroEstoque)}
        <div class="stock-search-row">
          <label class="dashboard-search stock-search-field" onclick="this.querySelector('input')?.focus()">
            <span class="search-lens-icon" aria-hidden="true">${renderUiIcon("search")}</span>
            <input data-search-context="estoque" data-preserve-focus-key="estoque-busca" value="${escaparAttr(buscaEstoque)}" placeholder="Buscar por nome, #código ou barras/QR..." oninput="global.__estoqueBusca=this.value; agendarRenderizacaoPreservandoScroll(180); reabrirAutocompletePesquisaAposRender(this)" onblur="agendarFechamentoAutocompletePesquisa(this)" autocomplete="off">
          </label>
          <label class="stock-sort-field" title="Ordenar itens"><span>Ordenar</span><select onchange="trocarOrdenacaoEstoque(this.value)"><option value="codigo" ${ordenacaoEstoque === "codigo" ? "selected" : ""}>Código</option><option value="nome" ${ordenacaoEstoque === "nome" ? "selected" : ""}>Nome</option><option value="baixo" ${ordenacaoEstoque === "baixo" ? "selected" : ""}>Menor estoque</option><option value="recente" ${ordenacaoEstoque === "recente" ? "selected" : ""}>Recentes</option></select></label>
          <button class="icon-action-button" type="button" onclick="trocarFiltroEstoque('low')" title="Filtrar alertas">${renderUiIcon("alerta")}</button>
        </div>
        ${renderEstoqueDetalheSelecionado(materiaisNormalizados, podeOperar)}
        <div class="stock-list">
          ${linhas}
        </div>
        ${materiaisFiltrados.length > limiteLista && !buscaEstoque.trim() ? `
          <button class="stock-list-toggle" type="button" onclick="alternarListaCompletaEstoque()" aria-expanded="${listaExpandida}">
            ${renderUiIcon(listaExpandida ? "up" : "down")}
            <span>${listaExpandida ? "Mostrar menos" : `Ver todos os ${materiaisFiltrados.length} itens`}</span>
          </button>
        ` : ""}
      </section>
    `;
  }

  function renderizarFabEstoqueGlobal(deps = {}) {
    const layer = deps.documentRef.getElementById(deps.APP_LAYER_IDS.overlay);
    if (!layer) return;
    layer.querySelector("[data-stock-fab-layer]")?.remove();
    if (deps.telaAtual() !== "estoque" || !deps.documentRef.body.classList.contains("mobile-mode") || !deps.permitirVisualizacaoOperacionalBasica()) return;
    const fabLayer = deps.documentRef.createElement("div");
    fabLayer.className = "stock-fab-layer";
    fabLayer.dataset.stockFabLayer = "true";
    fabLayer.innerHTML = `<button class="stock-add-fab" type="button" onclick="acionarFabEstoque(event)" onpointerdown="iniciarArrastoFabEstoque(event)" title="Toque para adicionar ou arraste para mover" aria-label="Adicionar item; arraste para mover">${deps.renderUiIcon("plus")}</button>`;
    layer.appendChild(fabLayer);
    deps.windowRef.requestAnimationFrame(() => deps.aplicarPosicaoFabEstoque(fabLayer.querySelector(".stock-add-fab")));
  }

  function atualizarResumoLoteCalculadora(deps = {}) {
    const alvo = deps.documentRef.getElementById("calcBatchSummary");
    if (!alvo) return;
    const ativo = deps.documentRef.getElementById("impressaoLote")?.checked === true;
    const resumo = deps.CalculatorDomain.calculateBatchPreview({ active: ativo, quantity: deps.documentRef.getElementById("quantidade")?.value, mode: deps.getModoLoteCalculadora(), weightGrams: deps.numeroCalculadora(deps.documentRef.getElementById("peso")?.value, 0, 0), timeMinutes: deps.CalculatorDomain.toMinutes(deps.documentRef.getElementById("tempo")?.value, deps.documentRef.getElementById("tempoMinutos")?.value) });
    if (resumo.active && resumo.quantity === 1) {
      alvo.innerHTML = "<strong>Resumo do lote</strong><span>Informe a quantidade de peças.</span>";
      return;
    }
    alvo.innerHTML = `<strong>Resumo do lote</strong><span>${resumo.quantity} unidades · ${resumo.mode === "per_piece" ? "Dados por peça" : "Dados do lote inteiro"}</span><small>${resumo.weightGrams > 0 ? `${resumo.totalWeightGrams.toLocaleString("pt-BR", { maximumFractionDigits: 2 })} g` : "Aguardando peso"} · ${resumo.timeMinutes > 0 ? deps.CalculatorDomain.formatMinutes(resumo.totalTimeMinutes).label : "Aguardando tempo"}</small>`;
  }

  const api = Object.freeze({ renderEstoque, renderizarFabEstoqueGlobal, atualizarResumoLoteCalculadora });
  global.SimplificaInventoryScreenRenderer = api;
  if (typeof module !== "undefined" && module.exports) module.exports = api;
})(typeof window !== "undefined" ? window : globalThis);
