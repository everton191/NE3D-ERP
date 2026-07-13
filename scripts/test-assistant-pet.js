const fs = require("node:fs");
const assert = require("node:assert/strict");

const app = fs.readFileSync("app.js", "utf8");
const css = fs.readFileSync("styles/ui-v3/components/pet-assistant.css", "utf8");
const build = fs.readFileSync("scripts/prepare-web.js", "utf8");

assert(fs.existsSync("assets/assistant/filament-pet.png"), "mascote de filamento ausente");
assert(app.includes("assistantPetTipsEnabled"), "preferencia para mensagens do pet ausente");
assert(app.includes("getDicaContextualDoPetAssistente"), "dicas contextuais do pet ausentes");
assert(app.includes("calculadora") && app.includes("avancarDicaDoPetAssistente"), "dicas alternadas da Calculadora ausentes");
assert(!app.includes('title: "Abrir Assistente Inteligente"'), "lancador comum ainda abre assistente inteligente");
assert(app.includes("normalizarUsoInteligente(usageLearning).events"), "pet nao usa somente o historico local existente");
assert(app.includes("desativarDicasDoPetAssistente"), "nao ha opcao para deixar somente o pet");
assert(app.includes("iniciarToqueLongoPetAssistente") && app.includes("Desligar dicas"), "toque longo para desligar dicas ausente");
assert(app.includes('/assets/assistant/filament-pet.png'), "avatar do pet nao esta conectado ao assistente");
assert(css.includes("assistant-pet-bob") && css.includes("prefers-reduced-motion"), "animacao do pet nao respeita reducao de movimento");
assert(build.includes('path.join(root, "assets")'), "build nao copia o mascote");

console.log("Assistant pet: mascote, dicas locais, desativacao e acessibilidade validados.");
