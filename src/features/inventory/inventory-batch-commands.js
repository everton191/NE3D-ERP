(function attachInventoryBatchCommands(global) {
  "use strict";

  function isBatchCodeInUse(code = "", materialIndex = -1, loteIndex = -1, deps = {}) {
    const target = String(code || "").trim().toLowerCase();
    if (!target) return false;
    return deps.normalizeStock().some((material, currentMaterialIndex) => deps.normalizeBatches(material).some((batch, currentBatchIndex) => {
      if (currentMaterialIndex === Number(materialIndex) && currentBatchIndex === Number(loteIndex)) return false;
      return String(batch.batch_code || "").trim().toLowerCase() === target;
    }));
  }

  function openBatchModal(indice, loteIndex = -1, deps = {}) {
    if (!deps.requireRollControl()) return;
    deps.normalizeStock();
    const material = deps.getStock()[Number(indice)];
    if (!material || !deps.materialUsesBatchControl(material)) return;
    const batches = deps.normalizeBatches(material);
    const existing = loteIndex >= 0 ? batches[Number(loteIndex)] : null;
    const defaultType = existing?.batch_type || material.batch_control_type || "rolo";
    const unit = existing?.unit || material.unidade || "g";
    const popup = deps.documentRef.getElementById("popup");
    if (!popup) return;
    popup.innerHTML = `
    <div class="modal-backdrop" role="dialog" aria-modal="true" data-action="stock-batch-cancel">
      <form class="modal-card stock-item-modal" id="stockBatchForm">
        <div class="modal-header">
          <h2>${deps.renderUiIcon(deps.getMaterialIcon(material))} ${existing ? "Editar" : "Adicionar"} ${deps.escapeHtml(defaultType)}</h2>
          <button class="icon-button" type="button" data-action="stock-batch-cancel" title="Fechar">✕</button>
        </div>
        <p class="muted">${deps.escapeHtml(material.nome)}. Este cadastro não realiza baixa de estoque.</p>
        <div class="sync-grid">
          <label class="field">
            <span>Código</span>
            <input id="stockBatchCode" value="${deps.escapeAttr(existing?.batch_code || "")}" placeholder="Ex.: PLA-PRETO-001">
          </label>
          <label class="field">
            <span>Lote do fabricante</span>
            <input class="ds-input" data-ui-component="Input" id="stockBatchManufacturerLot" value="${deps.escapeAttr(existing?.manufacturer_lot || "")}" placeholder="Opcional">
          </label>
          <label class="field">
            <span>Localização</span>
            <input class="ds-input" data-ui-component="Input" id="stockBatchLocation" value="${deps.escapeAttr(existing?.location_id || "")}" placeholder="Ex.: Prateleira A2">
          </label>
          <label class="field">
            <span>Tipo</span>
            <select id="stockBatchType">${deps.batchControlTypes.map((tipo) => `<option value="${deps.escapeAttr(tipo.value)}" ${tipo.value === defaultType ? "selected" : ""}>${deps.escapeHtml(tipo.label)}</option>`).join("")}</select>
          </label>
          <label class="field">
            <span>Quantidade inicial</span>
            <input id="stockBatchInitial" type="number" min="0" step="0.01" value="${deps.escapeAttr(existing?.initial_quantity ?? 0)}" required>
          </label>
          <label class="field">
            <span>Saldo atual</span>
            <input id="stockBatchCurrent" type="number" min="0" step="0.01" value="${deps.escapeAttr(existing?.current_quantity ?? 0)}" required>
          </label>
          <label class="field">
            <span>Unidade</span>
            <select id="stockBatchUnit">${deps.controlUnits.map((item) => `<option value="${deps.escapeAttr(item.value)}" ${item.value === unit ? "selected" : ""}>${deps.escapeHtml(item.label)}</option>`).join("")}</select>
          </label>
          <label class="field">
            <span>Status</span>
            <select id="stockBatchStatus">
              ${[
                ["fechado", "Fechado"],
                ["em_uso", "Em uso"],
                ["esgotado", "Esgotado"],
                ["inativo", "Inativo"]
              ].map(([valor, label]) => `<option value="${valor}" ${valor === existing?.status ? "selected" : ""}>${label}</option>`).join("")}
            </select>
          </label>
          <label class="field">
            <span>Custo total</span>
            <input id="stockBatchCost" type="number" min="0" step="0.01" value="${deps.escapeAttr(existing?.cost_total ?? 0)}">
          </label>
          <label class="field">
            <span>Tara do carretel (g)</span>
            <input class="ds-input" data-ui-component="Input" id="stockBatchTare" type="number" min="0" step="0.01" value="${deps.escapeAttr(existing?.spool_tare_weight_g ?? 0)}">
          </label>
          <label class="field">
            <span>Data da compra</span>
            <input id="stockBatchPurchaseDate" type="date" value="${deps.escapeAttr(existing?.purchase_date || "")}">
          </label>
        </div>
        <label class="field">
          <span>Observações</span>
          <textarea id="stockBatchNotes" rows="2">${deps.escapeHtml(existing?.notes || "")}</textarea>
        </label>
        <div class="actions">
          <button class="btn ghost" type="button" data-action="stock-batch-cancel">Cancelar</button>
          <button class="btn" type="submit">${deps.renderUiIcon("check")} Salvar</button>
        </div>
      </form>
    </div>
  `;
    deps.promotePopup(popup, { title: existing ? "Editar rolo/lote" : "Adicionar rolo/lote" });
    deps.documentRef.getElementById("stockBatchForm")?.addEventListener("submit", (event) => {
      event.preventDefault();
      deps.saveBatch(Number(indice), Number(loteIndex));
    });
    setTimeout(() => deps.documentRef.getElementById("stockBatchCode")?.focus(), 60);
  }

  async function saveBatch(indice, loteIndex = -1, deps = {}) {
    try {
      if (!deps.requireRollControl()) return;
      if (!await deps.consumeFreeAction("salvar_estoque", "salvar estoque")) return;
      const material = deps.normalizeStock()[Number(indice)];
      if (!material) return;
      const initial = deps.inventory.parseNumberStrict(deps.documentRef.getElementById("stockBatchInitial")?.value, "quantidade inicial", { min: 0 });
      const current = deps.inventory.parseNumberStrict(deps.documentRef.getElementById("stockBatchCurrent")?.value, "saldo atual", { min: 0 });
      if (initial <= 0) {
        throw new deps.AppError("Peso inicial inválido", {
          code: "INVENTORY_BATCH_INITIAL_WEIGHT_INVALID",
          userMessage: "Informe uma quantidade inicial maior que zero."
        });
      }
      if (current > initial + 0.000001) {
        throw new deps.AppError("Saldo maior que a quantidade inicial", {
          code: "INVENTORY_BATCH_BALANCE_INVALID",
          userMessage: "O saldo atual não pode ser maior que a quantidade inicial."
        });
      }
      const batches = deps.normalizeBatches(material);
      const previous = loteIndex >= 0 ? batches[Number(loteIndex)] : null;
      const code = String(deps.documentRef.getElementById("stockBatchCode")?.value || "").trim();
      if (!code) {
        throw new deps.AppError("Código do rolo obrigatório", {
          code: "INVENTORY_BATCH_CODE_REQUIRED",
          userMessage: "Informe um código único para identificar o rolo ou lote."
        });
      }
      if (isBatchCodeInUse(code, indice, loteIndex, deps)) {
        throw new deps.AppError("Código do rolo duplicado", {
          code: "INVENTORY_BATCH_CODE_DUPLICATE",
          userMessage: "Este código já identifica outro rolo ou lote."
        });
      }
      const selectedStatus = deps.documentRef.getElementById("stockBatchStatus")?.value || (current <= 0 ? "esgotado" : "fechado");
      const batch = deps.normalizeBatch({
        ...previous,
        id: previous?.id,
        batch_code: code,
        manufacturer_lot: deps.documentRef.getElementById("stockBatchManufacturerLot")?.value || "",
        location_id: deps.documentRef.getElementById("stockBatchLocation")?.value || "",
        batch_type: deps.documentRef.getElementById("stockBatchType")?.value || material.batch_control_type || "rolo",
        initial_quantity: initial,
        current_quantity: current,
        unit: deps.documentRef.getElementById("stockBatchUnit")?.value || material.unidade || "g",
        cost_total: deps.documentRef.getElementById("stockBatchCost")?.value || 0,
        spool_tare_weight_g: deps.documentRef.getElementById("stockBatchTare")?.value || 0,
        purchase_date: deps.documentRef.getElementById("stockBatchPurchaseDate")?.value || "",
        status: current <= 0 ? "esgotado" : selectedStatus,
        opened_at: selectedStatus === "em_uso" ? (previous?.opened_at || new Date().toISOString()) : previous?.opened_at || "",
        last_weighed_at: !previous || Number(previous.current_quantity) !== current ? new Date().toISOString() : previous.last_weighed_at || "",
        notes: deps.documentRef.getElementById("stockBatchNotes")?.value || "",
        updated_at: new Date().toISOString()
      }, material);
      const next = loteIndex >= 0
        ? batches.map((item, i) => i === Number(loteIndex) ? batch : (batch.status === "em_uso" && item.status === "em_uso" ? { ...item, status: "fechado" } : item))
        : [...batches.map((item) => batch.status === "em_uso" && item.status === "em_uso" ? { ...item, status: "fechado" } : item), batch];
      deps.inventory.updateBatches(indice, next, previous ? "Rolo/lote editado" : "Rolo/lote adicionado");
      deps.closePopup();
      deps.windowRef.__estoqueSelecionadoId = String(material.id);
      deps.scheduleSync("estoque-lote-editado");
      deps.renderPreservingScroll();
      deps.showToast(previous ? "Rolo/lote atualizado." : "Rolo/lote adicionado.", "sucesso", 2600);
    } catch (error) {
      deps.errorService.notify(error, { area: "Estoque", action: "Salvar rolo/lote" });
    }
  }

  function updateBatchStatus(indice, loteIndex, status, deps = {}) {
    if (!deps.requireRollControl()) return;
    const material = deps.normalizeStock()[Number(indice)];
    if (!material) return;
    const batches = deps.normalizeBatches(material);
    if (!batches[Number(loteIndex)]) return;
    const next = batches.map((batch, i) => {
      if (i === Number(loteIndex)) {
        return {
          ...batch,
          status,
          opened_at: status === "em_uso" ? (batch.opened_at || new Date().toISOString()) : batch.opened_at,
          updated_at: new Date().toISOString()
        };
      }
      return status === "em_uso" && batch.status === "em_uso" ? { ...batch, status: "fechado", updated_at: new Date().toISOString() } : batch;
    });
    deps.inventory.updateBatches(indice, next, status === "em_uso" ? "Rolo/lote marcado em uso" : "Rolo/lote inativado");
    deps.renderPreservingScroll();
  }

  function openManualOutputModal(indice, deps = {}) {
    if (!deps.allowBasicAction("Seu acesso está bloqueado. Regularize o plano para alterar estoque.")) return;
    deps.normalizeStock();
    const material = deps.getStock()[indice];
    if (!material) return;
    const unit = material.unidade || "kg";
    const current = Number(material.qtd) || 0;
    const popup = deps.documentRef.getElementById("popup");
    if (!popup) return;
    popup.innerHTML = `
    <div class="modal-backdrop" role="dialog" aria-modal="true" data-action="stock-restock-cancel">
      <form class="modal-card stock-restock-modal" id="stockOutputForm">
        <div class="modal-header">
          <h2>Registrar saída</h2>
          <button class="icon-button" type="button" data-action="stock-restock-cancel" title="Fechar">✕</button>
        </div>
        <div class="stock-restock-item">
          <strong>${deps.escapeHtml(material.nome)}</strong>
          <span>Disponível: ${current.toLocaleString("pt-BR", { maximumFractionDigits: 3 })} ${deps.escapeHtml(unit)}</span>
        </div>
        <div class="sync-grid">
          <label class="field">
            <span>Quantidade de saída</span>
            <input id="stockOutputQty" type="number" min="0.001" max="${deps.escapeAttr(current)}" step="0.001" placeholder="Ex.: 0.050" required>
          </label>
          <label class="field">
            <span>Motivo</span>
            <select id="stockOutputReason" required>
              <option value="">Selecione</option>
              <option>Teste</option>
              <option>Perda</option>
              <option>Peça com falha</option>
              <option>Amostra</option>
              <option>Uso interno</option>
              <option>Descarte</option>
              <option>Correção</option>
            </select>
          </label>
          <label class="field">
            <span>Observação opcional</span>
            <input id="stockOutputObs" placeholder="Ex.: ajuste após pesagem">
          </label>
        </div>
        <div class="actions">
          <button class="btn ghost" type="button" data-action="stock-restock-cancel">Cancelar</button>
          <button class="btn" type="submit">Confirmar saída</button>
        </div>
      </form>
    </div>
  `;
    deps.promotePopup(popup, { title: "Registrar saída manual" });
    deps.documentRef.getElementById("stockOutputForm")?.addEventListener("submit", (event) => {
      event.preventDefault();
      deps.confirmManualOutput(indice);
    });
    setTimeout(() => deps.documentRef.getElementById("stockOutputQty")?.focus(), 80);
  }

  async function confirmManualOutput(indice, deps = {}) {
    try {
      if (!await deps.consumeFreeAction("salvar_estoque", "salvar estoque")) return;
      deps.inventory.registerManualOutput(
        indice,
        deps.documentRef.getElementById("stockOutputQty")?.value,
        deps.documentRef.getElementById("stockOutputReason")?.value,
        deps.documentRef.getElementById("stockOutputObs")?.value
      );
      deps.scheduleSync("estoque-saida-manual");
      deps.closePopup();
      deps.windowRef.__estoqueSelecionadoId = String(deps.getStock()[indice]?.id || "");
      deps.renderPreservingScroll();
      deps.showToast("Saída registrada.", "sucesso", 2600);
    } catch (error) {
      deps.errorService.notify(error, { area: "Estoque", action: "Registrar saída manual" });
    }
  }

  function saveQuickCalculatorMaterial(deps = {}) {
    try {
      const type = deps.documentRef.getElementById("calcQuickMatTipo")?.value || "PLA";
      const color = (deps.documentRef.getElementById("calcQuickMatCor")?.value || "").trim();
      const qty = deps.documentRef.getElementById("calcQuickMatQtd")?.value;
      const list = deps.inventory.addMaterial({ tipo: type, cor: color, qtd: qty });
      const expectedName = [String(type || "PLA").trim(), color].filter(Boolean).join(" ");
      const material = [...list].reverse().find((item) => String(item.nome || "").toLowerCase() === expectedName.toLowerCase())
        || list[list.length - 1]
        || null;
      if (material?.id) {
        deps.appConfig.defaultMaterial = material.id;
        deps.appConfig.calculatorDefaults = {
          ...(deps.appConfig.calculatorDefaults || {}),
          materialId: material.id
        };
      }
      deps.recordUsageEvent("material_usado", { materialId: material?.id || type, materialNome: material?.nome || [type, color].filter(Boolean).join(" "), cor: color });
      deps.closePopup();
      deps.fillCalculatorMaterials();
      if (material?.id) {
        const select = deps.documentRef.getElementById("calcMaterial");
        if (select) select.value = material.id;
        deps.saveCalculatorConfig(true);
      }
      deps.scheduleSync("estoque-calculadora");
      deps.showToast("Material adicionado ao estoque.", "sucesso", 3200);
    } catch (error) {
      deps.errorService.notify(error, { area: "Calculadora", action: "Adicionar material do estoque" });
    }
  }

  const api = Object.freeze({
    isBatchCodeInUse,
    openBatchModal,
    saveBatch,
    updateBatchStatus,
    openManualOutputModal,
    confirmManualOutput,
    saveQuickCalculatorMaterial
  });
  global.SimplificaInventoryBatchCommands = api;
  if (typeof module !== "undefined" && module.exports) module.exports = api;
})(typeof window !== "undefined" ? window : globalThis);
