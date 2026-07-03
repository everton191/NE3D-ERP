const fs = require("fs");

const css = fs.readFileSync("style.css", "utf8");

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

[
  "animation:systemScreenCrossfade var(--transition-base)",
  "animation:systemStaggerIn var(--transition-slow)",
  "animation-timing-function:var(--motion-ease)",
  "--screen-motion-x:var(--space-sm)",
  "--screen-motion-x:calc(var(--space-sm) * -1)",
  "font-size:var(--font-2xl)",
  "font-size:var(--font-xl)",
  "gap:var(--space-md)",
  "border-radius:var(--radius-sm)"
].forEach((marker) => {
  assert(css.includes(marker), `Movimento/tema deve usar tokens existentes: ${marker}`);
});

assert(css.includes(".motion-stagger-item"), "Itens principais devem ter entrada sequenciada");
assert(css.includes("@supports (view-transition-name:root)"), "View Transition API deve continuar coberta");
assert(css.includes("@media(prefers-reduced-motion:reduce)"), "Reducao de movimento deve ser respeitada");

console.log("Motion tokens: transicoes e dashboard alinhados aos tokens do sistema.");
