const fs = require("node:fs");
const assert = require("node:assert/strict");

const app = fs.readFileSync("app.js", "utf8");
const css = fs.readFileSync("styles/ui-v3/components/onboarding-guide.css", "utf8");
const authCommands = fs.readFileSync("src/features/account/auth-commands.js", "utf8");

assert(app.includes("const ONBOARDING_TOTAL_STEPS = 9"), "onboarding público deve ter 9 etapas");
assert(app.includes("const ONBOARDING_LAST_STEP = ONBOARDING_TOTAL_STEPS - 1"), "limite final do onboarding nao esta centralizado");
assert(app.includes("ONBOARDING_LEGACY_LAST_STEP = 4"), "compatibilidade com onboarding antigo ausente");
assert(app.includes("Array.from({ length: ONBOARDING_TOTAL_STEPS }"), "indicador nao acompanha a quantidade de etapas");
assert(authCommands.includes("deps.onboardingLastStep"), "carregamento remoto nao usa o novo limite do onboarding");

for (const etapa of [
  "Primeiros passos",
  "Configuração básica",
  "Calculadora 3D",
  "Home",
  "Pedidos",
  "Produção",
  "Estoque",
  "Caixa",
  "Tudo pronto"
]) {
  assert(app.includes(etapa), `etapa ${etapa} ausente da apresentação`);
}

assert(app.includes("salvarOnboardingLocal(1, false)"), "configuração inicial não deve avançar automaticamente");
assert(!app.includes('eyebrow: "Assistente IA"'), "IA ainda aparece na apresentação pública");
assert(app.includes("finalizarOnboarding(true)"), "conclusão não oferece criar o primeiro pedido");
assert(css.includes(".onboarding-presentation"), "layout profissional do onboarding ausente");
assert(css.includes("@media (max-width: 767px)"), "onboarding sem adaptação mobile");
assert(css.includes("grid-template-columns: 1fr;"), "etapas não mudam para uma coluna no mobile");
assert(!css.includes("linear-gradient") && !css.includes("radial-gradient"), "onboarding deve respeitar o tema sem gradientes próprios");

console.log("Apresentação guiada: 9 etapas públicas, compatibilidade legada e layout responsivo validados.");
