import { joinClasses } from "./html.js";

export function BottomSheet({ header = "", body = "", footer = "", className = "" } = {}) {
  return `
    <section class="${joinClasses("ds-bottom-sheet app-bottom-sheet", className)}" data-ui-component="BottomSheet">
      ${header ? `<header class="ds-bottom-sheet-header">${header}</header>` : ""}
      <div class="ds-bottom-sheet-body">${body}</div>
      ${footer ? `<footer class="ds-bottom-sheet-footer">${footer}</footer>` : ""}
    </section>
  `;
}
