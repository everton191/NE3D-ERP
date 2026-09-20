const fs = require("fs");
const app = fs.readFileSync("app.js", "utf8");
const start = app.indexOf("function renderTela(tela)");
const end = app.indexOf("default:", start);
const block = app.slice(start, end);
const lines = block.split("\n");
let pending = [];
const aliases = {};
lines.forEach((l, i) => {
  const cm = l.match(/case\s+"([^"]+)":\s*\r?$/);
  if (cm) { pending.push(cm[1]); return; }
  const rm = l.match(/return\s+(render\w+)\(\)/);
  if (rm && pending.length > 0) {
    console.log(`RETURN at line ${i}: ${rm[1]} from cases: [${pending.join(", ")}]`);
    const target = pending[pending.length - 1];
    for (let j = 0; j < pending.length - 1; j++) {
      aliases[pending[j]] = target;
      console.log(`  ALIAS: ${pending[j]} -> ${target}`);
    }
    pending = [];
    return;
  }
  if (!cm && !rm && pending.length > 0 && l.trim() !== "") {
    console.log(`RESET at line ${i}: ${JSON.stringify(l.substring(0, 50))}`);
    pending = [];
  }
});
console.log("\nFinal aliases:", JSON.stringify(aliases, null, 2));
