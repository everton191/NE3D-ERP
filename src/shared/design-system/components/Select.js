import { attrsToString, escapeHtml, joinClasses } from "./html.js";

export function Select({ id = "", label = "", options = [], value = "", className = "", attrs = {} } = {}) {
  const attrText = attrsToString({ id, "data-ui-component": "Select", ...attrs });
  const items = options.map((option) => {
    const optionValue = typeof option === "string" ? option : option.value;
    const optionLabel = typeof option === "string" ? option : option.label;
    return `<option value="${escapeHtml(optionValue)}"${String(optionValue) === String(value) ? " selected" : ""}>${escapeHtml(optionLabel)}</option>`;
  }).join("");

  return `
    <label class="${joinClasses("ds-field", className)}">
      ${label ? `<span>${escapeHtml(label)}</span>` : ""}
      <select class="ds-select app-select" ${attrText}>${items}</select>
    </label>
  `;
}
