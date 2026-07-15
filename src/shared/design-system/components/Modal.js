import { joinClasses } from "./html.js";

export function Modal({ header = "", body = "", footer = "", size = "medium", className = "" } = {}) {
  return `
    <section class="${joinClasses("ds-modal app-modal", `app-modal-${size}`, className)}" data-ui-component="Modal">
      ${header ? `<header class="ds-modal-header">${header}</header>` : ""}
      <div class="ds-modal-body">${body}</div>
      ${footer ? `<footer class="ds-modal-footer">${footer}</footer>` : ""}
    </section>
  `;
}
