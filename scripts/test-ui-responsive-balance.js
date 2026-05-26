const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const css = fs.readFileSync(path.join(root, "style.css"), "utf8");

const required = [
  "@media (max-width: 820px)",
  "@media (min-width: 1280px)",
  "overflow-x:hidden",
  "overflow-x:clip",
  "grid-template-columns:repeat(auto-fit, minmax(min(100%, 220px), 1fr))",
  ".store-context-access-actions{\n    display:grid;\n    grid-template-columns:1fr;"
];

const missing = required.filter((snippet) => !css.includes(snippet));
if (missing.length) {
  console.error("UI responsive balance incompleto:", missing);
  process.exit(1);
}

console.log("UI responsive balance: mobile, desktop e acesso bloqueado responsivo validados.");
