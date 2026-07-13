import { attrsToString, joinClasses } from "./html.js";

const sizes = new Set(["compact", "standard", "large"]);

export function Card({ content = "", size = "standard", interactive = false, className = "", attrs = {} } = {}) {
  const safeSize = sizes.has(size) ? size : "standard";
  const attrText = attrsToString({
    "data-ui-component": "Card",
    "data-ui-size": safeSize,
    ...attrs
  });

  return `<article class="${joinClasses("card ds-card", interactive ? "interactive" : "", className)}" ${attrText}>${content}</article>`;
}
