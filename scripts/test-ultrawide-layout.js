const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const css = fs.readFileSync(path.join(root, "style.css"), "utf8");

const required = [
  "@media (min-width: 1680px)",
  "@media (min-width: 2100px)",
  "--store-stage-max:min(1760px, 92vw)",
  "--store-stage-max:min(1920px, 90vw)",
  "font-size:clamp(64px, 4.4vw, 88px)",
  "grid-template-columns:repeat(auto-fill, minmax(270px, 1fr))"
];

const missing = required.filter((snippet) => !css.includes(snippet));
if (missing.length) {
  console.error("Ultrawide layout incompleto:", missing);
  process.exit(1);
}

console.log("Ultrawide layout: breakpoints 1680/2100 e escala ampla validados.");
