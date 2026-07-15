import { escapeHtml, joinClasses } from "./html.js";

export function StatusBadge({ label = "", tone = "neutral", className = "" } = {}) {
  return `<span class="${joinClasses("status-badge ds-badge", tone, className)}" data-ui-component="StatusBadge">${escapeHtml(label)}</span>`;
}
