const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const css = fs.readFileSync(path.join(root, "style.css"), "utf8");

const required = [
  ".store-public-shell{\n  --store-stage-max:clamp(1240px, 88vw, 1760px)",
  "--store-desktop-gutter:clamp(22px, 3.2vw, 72px)",
  "@media (min-width: 1280px)",
  ".store-public-shell:not(.store-public-admin-mode)",
  "min-height:clamp(560px, 42vw, 720px)",
  "max-width:min(780px, 56%)",
  "grid-template-columns:repeat(auto-fill, minmax(230px, 1fr))"
];

const missing = required.filter((snippet) => !css.includes(snippet));
if (missing.length) {
  console.error("Storefront desktop upscale incompleto:", missing);
  process.exit(1);
}

console.log("Storefront desktop upscale: containers, hero e grid desktop validados.");
