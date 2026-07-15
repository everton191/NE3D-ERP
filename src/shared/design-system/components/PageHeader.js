import { escapeHtml, joinClasses } from "./html.js";

export function PageHeader({ title = "", subtitle = "", actions = "", icon = "", className = "" } = {}) {
  return `
    <header class="${joinClasses("ds-page-header page-header", className)}" data-ui-component="PageHeader">
      <div class="ds-page-title">
        ${icon ? `<span class="ds-page-icon" aria-hidden="true">${icon}</span>` : ""}
        <div>
          <h1>${escapeHtml(title)}</h1>
          ${subtitle ? `<p>${escapeHtml(subtitle)}</p>` : ""}
        </div>
      </div>
      ${actions ? `<div class="ds-page-actions">${actions}</div>` : ""}
    </header>
  `;
}
