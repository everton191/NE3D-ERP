(function attachCompanySettingsActions(global) {
  "use strict";

  function renderSaveCompanySection(section = "", label = "Salvar alterações", context = {}) {
    const { escaparAttr, renderAppButton, renderUiLayoutAttributes } = context;
    return `<div class="actions ui3-action-row settings-section-save" ${renderUiLayoutAttributes("actionRow")}>
      ${renderAppButton({ label: "Editar", variant: "secondary", action: `editarSecaoEmpresa('${escaparAttr(section)}')` })}
      ${renderAppButton({ label, variant: "primary", action: "salvarPersonalizacao()" })}
    </div>`;
  }

  function editCompanySection(section = "", context = {}) {
    const { CSS, document } = context;
    const painel = document.querySelector(`[data-ui-section="${CSS.escape(String(section || ""))}"]`);
    if (!painel) return;
    painel.open = true;
    painel.classList.add("is-editing");
    const campo = painel.querySelector("input:not([disabled]), textarea:not([disabled]), select:not([disabled])");
    campo?.focus?.({ preventScroll: false });
  }

  const api = Object.freeze({ renderSaveCompanySection, editCompanySection });
  global.SimplificaCompanySettingsActions = api;
  if (typeof module !== "undefined" && module.exports) module.exports = api;
})(typeof window !== "undefined" ? window : globalThis);
