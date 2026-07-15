import { attrsToString, escapeHtml, joinClasses } from "./html.js";

export function Input({
  id = "",
  name = "",
  label = "",
  value = "",
  placeholder = "",
  type = "text",
  error = "",
  className = "",
  attrs = {}
} = {}) {
  const describedBy = error && id ? `${id}-error` : undefined;
  const attrText = attrsToString({
    id,
    name,
    type,
    value,
    placeholder,
    "aria-invalid": error ? "true" : undefined,
    "aria-describedby": describedBy,
    "data-ui-component": "Input",
    ...attrs
  });

  return `
    <label class="${joinClasses("ds-field", error ? "has-error" : "", className)}">
      ${label ? `<span>${escapeHtml(label)}</span>` : ""}
      <input class="ds-input app-input" ${attrText}>
      ${error ? `<small id="${escapeHtml(describedBy)}" class="ds-field-error">${escapeHtml(error)}</small>` : ""}
    </label>
  `;
}
