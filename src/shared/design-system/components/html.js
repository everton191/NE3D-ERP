export function escapeHtml(value = "") {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

export function joinClasses(...classes) {
  return classes
    .flatMap((item) => String(item || "").split(/\s+/))
    .filter(Boolean)
    .join(" ");
}

export function attrsToString(attrs = {}) {
  return Object.entries(attrs)
    .filter(([, value]) => value !== false && value !== null && value !== undefined)
    .map(([key, value]) => value === true ? key : `${key}="${escapeHtml(value)}"`)
    .join(" ");
}
