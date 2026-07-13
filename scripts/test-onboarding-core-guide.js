const fs = require("node:fs");
const assert = require("node:assert/strict");

const app = fs.readFileSync("app.js", "utf8");
const css = fs.readFileSync("styles/ui-v3/components/onboarding-guide.css", "utf8");

assert(app.includes("getModulosGuiadosOnboarding"), "roteiro do primeiro acesso ausente");
assert(app.includes("abrirModuloGuiadoOnboarding"), "onboarding nao abre modulos guiados");
["pedido", "calculadora", "estoque", "caixa"].forEach((modulo) => assert(app.includes(`id: \"${modulo}\"`), `modulo ${modulo} ausente do roteiro`));
assert(app.includes("onboardingGuidedModules"), "progresso local do roteiro ausente");
assert(css.includes("grid-template-columns:repeat(4") && css.includes("grid-template-columns:repeat(2"), "roteiro sem contrato responsivo");

console.log("Onboarding guiado: Pedido, Calculadora, Estoque e Caixa validados.");
