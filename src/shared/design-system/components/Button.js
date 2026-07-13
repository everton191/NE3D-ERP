import { attrsToString, escapeHtml, joinClasses } from "./html.js";

const variants = new Set(["primary", "secondary", "ghost", "outline", "danger", "success"]);
const sizes = new Set(["compact", "standard", "large"]);

export function Button({
  label = "",
  icon = "",
  variant = "primary",
  size = "standard",
  type = "button",
  className = "",
  attrs = {}
} = {}) {
  const safeVariant = variants.has(variant) ? variant : "primary";
  const safeSize = sizes.has(size) ? size : "standard";
  const attrText = attrsToString({
    type,
    "data-ui-component": "Button",
    "data-ui-variant": safeVariant,
    "data-ui-size": safeSize,
    ...attrs
  });

  return `<button class="${joinClasses("btn app-button ds-button", safeVariant, className)}" ${attrText}>${icon ? `<span aria-hidden="true">${icon}</span>` : ""}<span>${escapeHtml(label)}</span></button>`;
}
