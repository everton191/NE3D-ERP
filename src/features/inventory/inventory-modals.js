(function attachInventoryModals(global) {
  "use strict";

  function renderEtapasCadastroItemEstoque(etapaAtual = 1) {
    return `<ol class="stock-wizard-progress" aria-label="Etapas do cadastro">
    ${["Item", "Valores", "Revisão"].map((label, index) => {
      const etapa = index + 1;
      const classe = etapa === etapaAtual ? "active" : etapa < etapaAtual ? "done" : "";
      return `<li class="${classe}" aria-current="${etapa === etapaAtual ? "step" : "false"}"><span>${etapa < etapaAtual ? "✓" : etapa}</span><strong>${label}</strong></li>`;
    }).join("")}
  </ol>`;
  }

  function renderEscolhaVisualItemEstoque(estado = {}, deps = {}) {
    const foto = deps.getFotoMaterialEstoque({ foto: estado.foto });
    const iconeSelecionado = deps.STOCK_ITEM_ICON_OPTIONS.find((opcao) => opcao.value === estado.icone) || deps.STOCK_ITEM_ICON_OPTIONS[0];
    return `<section class="stock-wizard-visual">
    <div class="stock-wizard-section-head"><div><strong>Visual do item</strong><small>Escolha um ícone ou envie uma foto compactada.</small></div></div>
    <details class="stock-icon-picker">
      <summary>
        <span class="stock-icon-picker-current">${deps.renderUiIcon(iconeSelecionado.value)}</span>
        <span><small>Ícone do produto</small><strong>${deps.escaparHtml(iconeSelecionado.label)}</strong></span>
        <span class="stock-icon-picker-action">Escolher ícone</span>
      </summary>
      <div class="stock-icon-picker-panel">
        <div class="stock-icon-picker-heading"><strong>Selecione um ícone</strong><small>Toque em uma opção para aplicar.</small></div>
        <div class="stock-icon-options" role="radiogroup" aria-label="Ícone do item">
          ${deps.STOCK_ITEM_ICON_OPTIONS.map((opcao) => `<button class="stock-icon-option ${estado.icone === opcao.value && !foto ? "active" : ""}" type="button" role="radio" aria-checked="${estado.icone === opcao.value && !foto}" onclick="selecionarIconeItemEstoque('${deps.escaparAttr(opcao.value)}')"><span>${deps.renderUiIcon(opcao.value)}</span><small>${deps.escaparHtml(opcao.label)}</small></button>`).join("")}
        </div>
      </div>
    </details>
    <div class="stock-photo-picker ${foto ? "has-photo" : ""}">
      <div class="stock-photo-preview">${foto ? `<img src="${deps.escaparAttr(foto)}" alt="Prévia da foto do item">` : deps.renderUiIcon(estado.icone || "estoque")}</div>
      <div><strong>${foto ? "Foto pronta" : "Foto opcional"}</strong><span>${foto ? deps.escaparHtml(estado.fotoInfo || "Imagem compactada") : "JPG, PNG ou WebP • até 140 KB"}</span></div>
      <label class="btn secondary stock-photo-button"><input id="matFoto" type="file" accept="image/jpeg,image/png,image/webp" onchange="prepararFotoItemEstoque(this)">${deps.renderUiIcon(foto ? "edit" : "plus")}<span>${foto ? "Trocar" : "Foto"}</span></label>
      ${foto ? `<button class="btn ghost" type="button" onclick="removerFotoItemEstoque()">Remover</button>` : ""}
    </div>
  </section>`;
  }

  function renderCadastroItemEstoqueWizard(deps = {}) {
    const popup = deps.documentRef.getElementById("popup");
    if (!popup) return;
    const estado = deps.getEstadoCadastroItemEstoque();
    const editando = estado.mode === "edit" && Number(estado.editIndex) >= 0;
    const etapa = Math.max(1, Math.min(3, Number(estado.step) || 1));
    const podeControlarRolos = deps.podeUsarControleRolosEstoque();
    const materialEditado = editando ? deps.normalizarEstoque()[Number(estado.editIndex)] : null;
    const codigoPrevisto = editando ? deps.getCodigoNumericoMaterialEstoque(materialEditado) : deps.getProximoCodigoMaterialEstoque(deps.normalizarEstoque());
    estado.codigoPrevisto = codigoPrevisto;
    const itemDuplicado = estado.duplicadoId ? deps.getMaterialEstoque(estado.duplicadoId) : null;
    const corpo = etapa === 1 ? `
    <div class="stock-wizard-code-preview"><span>${editando ? "Código interno do item" : "Código interno do novo item"}</span><strong>${deps.escaparHtml(deps.formatarCodigoMaterialEstoque(codigoPrevisto))}</strong><small>${editando ? "O código original será preservado após a edição." : "Gerado automaticamente ao salvar e mantido neste produto."}</small></div>
    ${itemDuplicado ? `<div class="stock-duplicate-warning" role="alert"><span>${deps.renderUiIcon("alerta")}</span><div><strong>Este produto já está cadastrado</strong><small>${deps.escaparHtml(deps.formatarCodigoMaterialEstoque(itemDuplicado))} • ${deps.escaparHtml(itemDuplicado.nome)} • ${deps.formatarQuantidadeEstoque(itemDuplicado.qtd, itemDuplicado.unidade || "un")}</small></div><button class="btn secondary" type="button" onclick="abrirItemEstoqueExistente('${deps.escaparAttr(itemDuplicado.id)}')">Abrir item</button></div>` : ""}
    <div class="stock-wizard-grid">
      <label class="field stock-wizard-wide"><span>Nome do item</span><input id="matNome" value="${deps.escaparAttr(estado.nome)}" placeholder="Ex.: Filamento PLA Preto 1kg" required></label>
      <label class="field"><span>Tipo do item</span><select id="matItemType">${deps.STOCK_ITEM_TYPES.map((tipo) => `<option value="${deps.escaparAttr(tipo)}" ${tipo === estado.tipoItem ? "selected" : ""}>${deps.escaparHtml(tipo)}</option>`).join("")}</select></label>
      <label class="field"><span>Categoria</span><input id="matTipo" value="${deps.escaparAttr(estado.categoria)}" placeholder="Ex.: Filamentos, embalagens"></label>
    </div>
    ${renderEscolhaVisualItemEstoque(estado, deps)}
  ` : etapa === 2 ? `
    <div class="stock-wizard-grid">
      <label class="field"><span>Unidade de controle</span><select id="matUnidade">${deps.STOCK_CONTROL_UNITS.map((unidade) => `<option value="${deps.escaparAttr(unidade.value)}" ${unidade.value === estado.unidade ? "selected" : ""}>${deps.escaparHtml(unidade.label)}</option>`).join("")}</select></label>
      <label class="field"><span>Quantidade atual</span><input id="matQtd" type="number" min="0" step="0.001" value="${deps.escaparAttr(estado.qtd)}"></label>
      <label class="field"><span>Estoque mínimo</span><input id="matMinimo" type="number" min="0" step="0.001" value="${deps.escaparAttr(estado.minimo)}"></label>
      <label class="field"><span>Valor por unidade/medida (R$)</span><input id="matCusto" type="number" min="0" step="0.01" value="${deps.escaparAttr(estado.custo)}"></label>
      <label class="field stock-wizard-wide"><span>Fornecedor opcional</span><input id="matFornecedor" value="${deps.escaparAttr(estado.fornecedor)}"></label>
      <label class="field stock-wizard-wide"><span>Código de barras ou identificador QR (opcional)</span><input id="matCodigoExterno" value="${deps.escaparAttr(estado.codigoExterno)}" placeholder="Ex.: EAN, código do fabricante ou conteúdo do QR" autocomplete="off"><small>Já fica pesquisável e preparado para um leitor futuro.</small></label>
    </div>
    ${podeControlarRolos ? `<label class="checkbox-row stock-batch-toggle"><input id="matBatchControlled" type="checkbox" ${estado.batchControlled ? "checked" : ""} onchange="alternarControleLoteEstoqueCadastro()"><span><strong>Controlar por rolo ou lote</strong><small>Para filamentos, resinas, frascos ou pacotes individuais.</small></span></label><label class="field" id="matBatchTypeField" ${estado.batchControlled ? "" : "hidden"}><span>Tipo de controle</span><select id="matBatchType" ${estado.batchControlled ? "" : "disabled"}>${deps.STOCK_BATCH_CONTROL_TYPES.map((tipo) => `<option value="${deps.escaparAttr(tipo.value)}" ${tipo.value === estado.batchType ? "selected" : ""}>${deps.escaparHtml(tipo.label)}</option>`).join("")}</select></label>` : ""}
  ` : `
    <div class="stock-wizard-review">
      ${deps.renderMidiaMaterialEstoque({ nome: estado.nome, icone: estado.icone, foto: estado.foto }, "stock-wizard-review-media")}
      <div><small>Item • ${deps.escaparHtml(deps.formatarCodigoMaterialEstoque(codigoPrevisto))}</small><strong>${deps.escaparHtml(estado.nome || "Novo item")}</strong><span>${deps.escaparHtml(estado.tipoItem)} • ${deps.escaparHtml(estado.categoria || "Geral")}</span></div>
      <div><small>Quantidade</small><strong>${deps.escaparHtml(estado.qtd)} ${deps.escaparHtml(estado.unidade)}</strong><span>Mínimo: ${deps.escaparHtml(estado.minimo)} ${deps.escaparHtml(estado.unidade)}</span></div>
      <div><small>Valor</small><strong>${deps.formatarMoeda(Number(estado.custo) || 0)}</strong><span>${estado.codigoExterno ? `Barras/QR: ${deps.escaparHtml(estado.codigoExterno)}` : `Por ${deps.escaparHtml(estado.unidade)}`}</span></div>
    </div>
    <label class="field"><span>Observações opcionais</span><textarea id="matObservacoes" rows="3" placeholder="Localização, referência ou informação útil">${deps.escaparHtml(estado.observacoes)}</textarea></label>
    <p class="stock-wizard-safe-note">${deps.renderUiIcon("check")} Confira os dados. O item só será salvo depois desta confirmação.</p>
  `;
    const acaoVoltar = etapa === 1
      ? `<button class="btn ghost" type="button" data-action="stock-add-cancel">Cancelar</button>`
      : `<button class="btn ghost" type="button" onclick="voltarCadastroItemEstoque()">Voltar</button>`;
    const acaoPrincipal = etapa < 3
      ? `<button class="btn" type="submit">Continuar <span aria-hidden="true">→</span></button>`
      : `<button class="btn" type="submit">${deps.renderUiIcon("check")} Salvar item</button>`;
    popup.innerHTML = `<div class="modal-backdrop" role="dialog" aria-modal="true" data-action="stock-add-cancel"><form class="modal-card stock-item-modal stock-wizard-modal" id="stockAddForm" onsubmit="avancarCadastroItemEstoque(event)"><div class="modal-header"><div><small>Cadastro de estoque</small><h2>${deps.renderUiIcon(editando ? "edit" : "plus")} ${editando ? "Editar item" : "Novo item"}</h2></div><button class="icon-button" type="button" data-action="stock-add-cancel" title="Fechar">✕</button></div>${renderEtapasCadastroItemEstoque(etapa)}<div class="stock-wizard-body">${corpo}</div><div class="actions ui3-action-row stock-wizard-actions" ${deps.renderUiLayoutAttributes("actionRow")}>${acaoVoltar}${etapa < 3 ? `<button class="btn secondary" type="button" onclick="pularEtapaCadastroItemEstoque()">Pular etapa</button>` : ""}${acaoPrincipal}</div></form></div>`;
    deps.promoverPopupParaDialogUiV3(popup, { title: `${editando ? "Editar" : "Adicionar"} item do estoque • etapa ${etapa} de 3` });
    setTimeout(() => deps.documentRef.getElementById(etapa === 1 ? "matNome" : etapa === 2 ? "matUnidade" : "matObservacoes")?.focus(), 60);
  }

  function mostrarModalEdicaoMaterial(indice, material, deps = {}) {
    const popup = deps.documentRef.getElementById("popup");
    if (!popup) return;
    const podeControlarRolos = deps.podeUsarControleRolosEstoque();
    popup.innerHTML = `
    <div class="modal-backdrop" role="dialog" aria-modal="true" data-action="stock-edit-cancel">
      <div class="modal-card">
        <div class="modal-header">
          <h2>Editar material</h2>
          <button class="icon-button" type="button" data-action="stock-edit-cancel" title="Fechar">✕</button>
        </div>
        <label class="field">
          <span>Nome</span>
          <input id="stockEditName" value="${deps.escaparAttr(material.nome)}">
        </label>
        <label class="field">
          <span>Tipo do item</span>
          <select id="stockEditItemType">${deps.STOCK_ITEM_TYPES.map((tipo) => `<option value="${deps.escaparAttr(tipo)}" ${tipo === material.tipoItem ? "selected" : ""}>${deps.escaparHtml(tipo)}</option>`).join("")}</select>
        </label>
        <label class="field">
          <span>Categoria</span>
          <input id="stockEditCategory" value="${deps.escaparAttr(material.categoria || material.tipo || "")}">
        </label>
        <label class="field">
          <span>Unidade de controle</span>
          <select id="stockEditUnit">${deps.STOCK_CONTROL_UNITS.map((unidade) => `<option value="${deps.escaparAttr(unidade.value)}" ${unidade.value === material.unidade ? "selected" : ""}>${deps.escaparHtml(unidade.label)}</option>`).join("")}</select>
        </label>
        <label class="field">
          <span>Quantidade atual</span>
          <input id="stockEditQty" type="number" min="0" step="0.001" value="${deps.escaparAttr(material.qtd)}">
        </label>
        <label class="field">
          <span>Estoque mínimo</span>
          <input id="stockEditMin" type="number" min="0" step="0.001" value="${deps.escaparAttr(material.estoqueMinimo || 0)}">
        </label>
        <label class="field">
          <span>Custo por unidade/medida</span>
          <input id="stockEditCost" type="number" min="0" step="0.01" value="${deps.escaparAttr(material.custoUnitario || 0)}">
        </label>
        ${podeControlarRolos ? `<label class="checkbox-row stock-batch-toggle">
          <input id="stockEditBatchControlled" type="checkbox" ${deps.materialUsaControleLote(material) ? "checked" : ""} onchange="document.getElementById('stockEditBatchTypeField').hidden=!this.checked">
          <span><strong>Controlar por rolo ou lote</strong><small>A quantidade passa a ser a soma dos recipientes ativos.</small></span>
        </label>
        <label class="field" id="stockEditBatchTypeField" ${deps.materialUsaControleLote(material) ? "" : "hidden"}>
          <span>Tipo de controle</span>
          <select id="stockEditBatchType">${deps.STOCK_BATCH_CONTROL_TYPES.map((tipo) => `<option value="${deps.escaparAttr(tipo.value)}" ${tipo.value === material.batch_control_type ? "selected" : ""}>${deps.escaparHtml(tipo.label)}</option>`).join("")}</select>
        </label>` : ""}
        <label class="field">
          <span>Motivo do ajuste</span>
          <input id="stockEditReason" placeholder="Obrigatório se alterar a quantidade">
        </label>
        <label class="field">
          <span>Fornecedor opcional</span>
          <input id="stockEditSupplier" value="${deps.escaparAttr(material.fornecedor || "")}">
        </label>
        <label class="field">
          <span>Observações</span>
          <input id="stockEditNotes" value="${deps.escaparAttr(material.observacoes || "")}">
        </label>
        <label class="field">
          <span>Status</span>
          <select id="stockEditActive"><option value="true" ${material.ativo !== false ? "selected" : ""}>Ativo</option><option value="false" ${material.ativo === false ? "selected" : ""}>Inativo</option></select>
        </label>
        <div class="actions">
          <button class="btn ghost" type="button" data-action="stock-edit-cancel">Cancelar</button>
          <button class="btn" type="button" data-action="stock-edit-save" data-index="${Number(indice)}">Salvar</button>
        </div>
      </div>
    </div>
  `;
    deps.promoverPopupParaDialogUiV3(popup, { title: "Editar item do estoque" });
    setTimeout(() => deps.documentRef.getElementById("stockEditName")?.focus(), 50);
  }

  function abrirReposicaoEstoque(indice, deps = {}) {
    if (!deps.permitirAcaoBasicaFree("Seu acesso está bloqueado. Regularize o plano para alterar estoque.")) return;
    deps.normalizarEstoque();
    const material = deps.getStock()[indice];
    if (!material) return;
    const unidade = material.unidade || "kg";
    const atual = Number(material.qtd) || 0;
    const percentual = Number(material.remaining_percent) || 0;
    const popup = deps.documentRef.getElementById("popup");
    if (!popup) return;
    popup.innerHTML = `
    <div class="modal-backdrop" role="dialog" aria-modal="true" data-action="stock-restock-cancel">
      <form class="modal-card stock-restock-modal" id="stockRestockForm">
        <div class="modal-header">
          <h2>Repor estoque</h2>
          <button class="icon-button" type="button" data-action="stock-restock-cancel" title="Fechar">✕</button>
        </div>
        <div class="stock-restock-item">
          <strong>${deps.escaparHtml(material.nome)}</strong>
          <span>Atual: ${atual.toLocaleString("pt-BR", { maximumFractionDigits: 3 })} ${deps.escaparHtml(unidade)} • ${percentual}% restante</span>
        </div>
        <div class="sync-grid">
          <label class="field">
            <span>Quantidade a adicionar</span>
            <input id="stockRestockQty" type="number" min="0.001" step="0.001" placeholder="Ex.: 1" required>
          </label>
          <label class="field">
            <span>Observação opcional</span>
            <input id="stockRestockObs" placeholder="Ex.: compra fornecedor">
          </label>
        </div>
        <div class="stock-restock-preview">
          <span><small>Nova quantidade</small><strong id="stockRestockNewQty">${atual.toLocaleString("pt-BR", { maximumFractionDigits: 3 })} ${deps.escaparHtml(unidade)}</strong></span>
          <span><small>Nova base de cálculo</small><strong id="stockRestockNewBase">${atual.toLocaleString("pt-BR", { maximumFractionDigits: 3 })} ${deps.escaparHtml(unidade)}</strong></span>
          <span><small>Percentual restante</small><strong>100%</strong></span>
        </div>
        <div class="actions">
          <button class="btn ghost" type="button" data-action="stock-restock-cancel">Cancelar</button>
          <button class="btn" type="submit">Confirmar reposição</button>
        </div>
      </form>
    </div>
  `;
    deps.promoverPopupParaDialogUiV3(popup, { title: "Repor estoque" });
    const qtyInput = deps.documentRef.getElementById("stockRestockQty");
    const atualizarPreview = () => {
      const entrada = Number(String(qtyInput?.value || "0").replace(",", ".")) || 0;
      const novoTotal = Math.max(0, atual + entrada);
      const texto = `${novoTotal.toLocaleString("pt-BR", { maximumFractionDigits: 3 })} ${unidade}`;
      const novaQtd = deps.documentRef.getElementById("stockRestockNewQty");
      const novaBase = deps.documentRef.getElementById("stockRestockNewBase");
      if (novaQtd) novaQtd.textContent = texto;
      if (novaBase) novaBase.textContent = texto;
    };
    qtyInput?.addEventListener("input", atualizarPreview);
    deps.documentRef.getElementById("stockRestockForm")?.addEventListener("submit", (event) => {
      event.preventDefault();
      deps.confirmarReposicaoEstoque(indice);
    });
    setTimeout(() => qtyInput?.focus(), 80);
  }

  function abrirCadastroMaterialCalculadora(deps = {}) {
    if (!deps.permitirAcaoBasicaFree("Seu acesso está bloqueado. Regularize o plano para cadastrar materiais.")) return;
    const popup = deps.documentRef.getElementById("popup");
    if (!popup) return;
    popup.innerHTML = `
    <div class="modal-backdrop" role="dialog" aria-modal="true" data-action="calc-material-cancel">
      <form class="modal-card" id="calcMaterialQuickForm">
        <div class="modal-header">
          <h2>Cadastrar material</h2>
          <button class="icon-button" type="button" data-action="calc-material-cancel" title="Fechar">✕</button>
        </div>
        <p class="muted">Adicione um material ao estoque e continue o cálculo sem sair da tela.</p>
        <label class="field">
          <span>Tipo</span>
          <select id="calcQuickMatTipo">
            ${deps.tiposMaterial.map((tipo) => `<option value="${deps.escaparAttr(tipo)}">${deps.escaparHtml(tipo)}</option>`).join("")}
          </select>
        </label>
        <label class="field">
          <span>Cor do material</span>
          <input id="calcQuickMatCor" placeholder="Escolha na paleta" readonly>
          ${deps.renderPaletaCoresMaterial("calcQuickMatCor")}
        </label>
        <label class="field">
          <span>Quantidade em kg</span>
          <input id="calcQuickMatQtd" type="number" min="0.001" step="0.001" placeholder="Ex.: 1.000" required>
        </label>
        <div class="actions">
          <button class="btn ghost" type="button" data-action="calc-material-cancel">Cancelar</button>
          <button class="btn" type="submit">Adicionar e selecionar</button>
        </div>
      </form>
    </div>
  `;
    deps.promoverPopupParaDialogUiV3(popup, { title: "Cadastrar material" });
    deps.documentRef.getElementById("calcMaterialQuickForm")?.addEventListener("submit", (event) => {
      event.preventDefault();
      deps.salvarMaterialCalculadoraRapido();
    });
    setTimeout(() => deps.documentRef.getElementById("calcQuickMatQtd")?.focus(), 80);
  }

  const api = Object.freeze({
    renderEtapasCadastroItemEstoque,
    renderEscolhaVisualItemEstoque,
    renderCadastroItemEstoqueWizard,
    mostrarModalEdicaoMaterial,
    abrirReposicaoEstoque,
    abrirCadastroMaterialCalculadora
  });
  global.SimplificaInventoryModals = api;
  if (typeof module !== "undefined" && module.exports) module.exports = api;
})(typeof window !== "undefined" ? window : globalThis);
