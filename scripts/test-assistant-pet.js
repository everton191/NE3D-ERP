const fs = require("node:fs");
const assert = require("node:assert/strict");

const app = fs.readFileSync("app.js", "utf8");
const build = fs.readFileSync("scripts/prepare-web.js", "utf8");

assert(fs.existsSync("assets/assistant/filament-pet.png"), "mascote de filamento ausente");
assert(app.includes('/assets/assistant/filament-pet.png'), "avatar do pet nao esta conectado ao assistente");
assert(app.includes('onclick="${action}"'), "imagem do assistente deve manter somente o toque normal");
assert(!app.includes("iniciarToqueLongoPetAssistente"), "toque longo do mascote ainda esta ativo");
assert(!app.includes("getDicaContextualDoPetAssistente"), "dicas contextuais do mascote ainda estao ativas");
assert(!app.includes("assistantPetTipsEnabled"), "preferencia de dicas do mascote ainda esta ativa");
assert(build.includes('path.join(root, "assets")'), "build nao copia o mascote");

console.log("Assistant pet: imagem passiva e toque normal validados.");
