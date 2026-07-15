import { attrsToString, escapeHtml, joinClasses } from "./html.js";

export function Textarea({ id = "", label = "", value = "", placeholder = "", className = "", attrs = {} } = {}) {
  const attrText = attrsToString({ id, placeholder, "data-ui-component": "Textarea", ...attrs });
  return `
    <label class="${joinClasses("ds-field", className)}">
      ${label ? `<span>${escapeHtml(label)}</span>` : ""}
      <textarea class="ds-textarea app-textarea" ${attrText}>${escapeHtml(value)}</textarea>
    </label>
  `;
}
