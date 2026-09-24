(function attachCalculatorSettings(global) {
  "use strict";

  function abrirConfiguracoesCalculadora(deps = {}) {
    const config = deps.getConfiguracaoCalculadora();
    const popup = deps.documentRef.getElementById("popup");
    if (!popup) return;
    popup.innerHTML = `
    <div class="modal-backdrop" role="dialog" aria-modal="true" onclick="fecharPopup()">
      <form class="modal-card calc-settings-modal" id="calculatorSettingsForm" onclick="event.stopPropagation()">
        <div class="modal-header">
          <h2>Configurações da Calculadora</h2>
          <button class="icon-button" type="button" onclick="fecharPopup()" title="Fechar">✕</button>
        </div>
        <div class="calc-settings-grid">
          <label class="field">
            <span>Impressora padrão</span>
            <select id="calcSettingsPrinter">
              ${Object.keys(deps.printers).map((nome) => `<option value="${deps.escaparAttr(nome)}" ${nome === config.printerModel ? "selected" : ""}>${deps.escaparHtml(nome)}</option>`).join("")}
            </select>
          </label>
          <label class="field">
            <span>Material padrão</span>
            <select id="calcSettingsMaterial">${deps.renderMaterialOptions(config.materialId, { emptyLabel: "Sem material padrão" })}</select>
          </label>
          <label class="field"><span>Preço por kg</span><input id="calcSettingsFilament" type="number" min="0" step="0.01" value="${deps.escaparAttr(config.filamento)}"></label>
          <label class="field"><span>Custo do kWh</span><input id="calcSettingsEnergy" type="number" min="0" step="0.01" value="${deps.escaparAttr(config.energia)}"></label>
          <label class="field"><span>Consumo médio W</span><input id="calcSettingsConsumption" type="number" min="0" step="1" value="${deps.escaparAttr(config.consumo)}"></label>
          <label class="field"><span>Custo/hora da máquina</span><input id="calcSettingsHour" type="number" min="0" step="0.01" value="${deps.escaparAttr(config.custoHora)}"></label>
          <label class="field"><span>Margem padrão %</span><input id="calcSettingsMargin" type="number" min="0" step="1" value="${deps.escaparAttr(config.margem)}"></label>
          <label class="field"><span>Margem mínima recomendada %</span><input id="calcSettingsMinMargin" type="number" min="0" step="1" value="${Number(deps.appConfig.minimumRecommendedMargin) || 60}"></label>
          <label class="field"><span>Tempo mínimo cobrado (h)</span><input id="calcSettingsMinTime" type="number" min="0" step="0.1" value="${Number(deps.appConfig.minimumChargedHours) || 0}"></label>
          <label class="field"><span>Arredondamento</span><select id="calcSettingsRounding">
            ${[0, 0.5, 1, 5].map((valor) => `<option value="${valor}" ${Number(deps.appConfig.priceRounding || 0) === valor ? "selected" : ""}>${valor ? `R$ ${valor}` : "Sem arredondar"}</option>`).join("")}
          </select></label>
          <label class="field"><span>Preset de qualidade</span><select id="calcSettingsQuality">
            ${["0.20mm padrão", "0.28mm rápido", "0.12mm fino", "TPU lento"].map((valor) => `<option value="${deps.escaparAttr(valor)}" ${String(deps.appConfig.defaultQualityPreset || "0.20mm padrão") === valor ? "selected" : ""}>${deps.escaparHtml(valor)}</option>`).join("")}
          </select></label>
        </div>
        <div class="actions">
          <button class="btn ghost" type="button" onclick="fecharPopup()">Cancelar</button>
          <button class="btn secondary" type="button" onclick="salvarConfiguracoesCalculadoraAvancadas(true)">Usar como padrão</button>
          <button class="btn" type="submit">Salvar</button>
        </div>
      </form>
    </div>
  `;
    deps.promoverPopupParaDialogUiV3(popup, { title: "Configurações da Calculadora" });
    deps.documentRef.getElementById("calculatorSettingsForm")?.addEventListener("submit", (event) => {
      event.preventDefault();
      deps.salvarConfiguracoesCalculadoraAvancadas(true);
    }, { once: true });
  }

  function limparCalculo(deps = {}) {
    deps.setUltimoCalculo(null);
    deps.setCalculatorDraftState({ peso: "", tempo: "", tempoMinutos: "", batchActive: false, quantity: "", batchMode: "per_piece", extraFeeActive: false });
    ["peso", "tempo", "tempoMinutos", "tempoFormato", "taxaExtra", "nomeItem", "observacoesCalculo"].forEach((id) => {
      const campo = deps.documentRef.getElementById(id);
      if (campo) campo.value = "";
    });
    deps.appConfig.calcExtraFeeMode = "percent";
    deps.appConfig.calcExtraFeePercent = 0;
    deps.appConfig.calcExtraFeeValue = 0;
    const quantidade = deps.documentRef.getElementById("quantidade");
    if (quantidade) quantidade.value = "";
    const impressaoLote = deps.documentRef.getElementById("impressaoLote");
    if (impressaoLote) impressaoLote.checked = false;
    const camposLote = deps.documentRef.getElementById("calcBatchFields");
    if (camposLote) camposLote.hidden = true;
    const resultado = deps.documentRef.getElementById("res");
    if (resultado) resultado.innerHTML = deps.renderResumoCalculo(null);
    deps.atualizarVisualTaxaExtraCalculadora();
    deps.salvarConfiguracaoCalculadora(true);
  }

  function preencherImpressoras(persistir = false, deps = {}) {
  const doc = deps.documentRef;
  const select = doc.getElementById("printer");
  if (!select) return;
  const config = deps.getConfiguracaoCalculadora();
  const tipoSelect = doc.getElementById("printerType");
  const tipo = deps.normalizarTipoImpressoraCalculadora(tipoSelect?.value || config.printerType || "FDM");

  select.innerHTML = "";
  let primeiroModelo = "";
  Object.entries(deps.printers).filter(([, impressora]) => impressora.tipo === tipo).forEach(([nome]) => {
    const opt = doc.createElement("option");
    opt.value = nome;
    opt.textContent = nome;
    if (!primeiroModelo) primeiroModelo = nome;
    if (nome === config.printerModel) opt.selected = true;
    select.appendChild(opt);
  });
  if (!select.value && primeiroModelo) select.value = primeiroModelo;

  select.onchange = function () {
    const impressora = deps.printers[this.value];
    const inicializando = this.dataset.initializing === "1";
    deps.appConfig.defaultPrinterType = impressora?.tipo || tipo;
    deps.appConfig.defaultPrinterModel = this.value;
    const consumo = doc.getElementById("consumo");
    const custoHora = doc.getElementById("custoHora");
    if (consumo && (!inicializando || !String(consumo.value || "").trim())) consumo.value = impressora?.consumo ?? "";
    if (custoHora && (!inicializando || !String(custoHora.value || "").trim())) custoHora.value = impressora?.custo ?? "";
    if (!inicializando) deps.salvarConfiguracaoCalculadora();
  };

  select.dataset.initializing = "1";
  select.dispatchEvent(new Event("change"));
  delete select.dataset.initializing;
  if (persistir) deps.salvarConfiguracaoCalculadora();
}

const api = Object.freeze({
    abrirConfiguracoesCalculadora,
    limparCalculo,
    preencherImpressoras
  });
  global.SimplificaCalculatorSettings = api;
  if (typeof module !== "undefined" && module.exports) module.exports = api;
})(typeof window !== "undefined" ? window : globalThis);
