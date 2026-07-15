const fs = require("fs");

const checklist = fs.readFileSync("docs/ux-reference-checklist-camera.md", "utf8");
const standards = fs.readFileSync("docs/ui-component-standards.md", "utf8");

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

[
  "Campos de formulario usam caixas visiveis",
  "Campo com erro mostra o erro perto do campo",
  "Acoes principais ficam visualmente mais fortes",
  "Elementos clicaveis parecem clicaveis",
  "Loading novo usa skeleton",
  "Escolhas simples usam radio",
  "Mobile e desktop passam em rolagem vertical"
].forEach((marker) => {
  assert(checklist.includes(marker), `Checklist UX sem marcador: ${marker}`);
});

[
  "docs/ux-reference-checklist-camera.md",
  "formulario deve usar campos em caixas visiveis",
  "CTA principal deve se destacar",
  "loading estruturado deve preferir skeleton"
].forEach((marker) => {
  assert(standards.includes(marker), `Padrao de componentes sem marcador: ${marker}`);
});

console.log("Checklist UX/UI das referencias Camera.rar validado.");
