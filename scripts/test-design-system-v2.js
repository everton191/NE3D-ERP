const fs = require("fs");

const css = fs.readFileSync("themes/base/design-system-v2.css", "utf8");
const index = fs.readFileSync("index.html", "utf8");
const prepare = fs.readFileSync("scripts/prepare-web.js", "utf8");
const sw = fs.readFileSync("sw.js", "utf8");

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

[
  "Simplifica 3D Design System V2",
  "--s3d-font-sans",
  "--s3d-space-1:4px",
  "--s3d-radius-md:14px",
  "--s3d-shadow-md",
  "--s3d-touch-min:44px",
  "--s3d-brand-teal:#0f8f88",
  ".erp-theme-v2[data-erp-theme=\"light\"]",
  ".erp-theme-v2[data-erp-theme=\"dark\"]",
  ".storefront-theme-v2[data-store-theme=\"light\"]",
  ".storefront-theme-v2[data-store-theme=\"dark\"]",
  "img,\nvideo,\ncanvas,\nsvg"
].forEach((marker) => assert(css.includes(marker), `Fundacao DS V2 ausente: ${marker}`));

assert(index.includes("/themes/base/design-system-v2.css?v=1.0.50-rc-settings-pane-wrapper-20260625"), "CSS V2 carrega no HTML");
assert(prepare.includes('"themes/base/design-system-v2.css"'), "Build nao copia CSS V2");
assert(sw.includes('"./themes/base/design-system-v2.css"'), "PWA nao precacheia CSS V2");

console.log("Design System V2: tokens, shells, build e precache validados.");
