const fs = require("fs");
const app = fs.readFileSync("app.js", "utf8");
const editor = fs.readFileSync("src/storefront/renderers/editorV3.js", "utf8");
const layouts = fs.readFileSync("src/storefront/styles/layouts.css", "utf8");
const assert = (condition, message) => { if (!condition) throw new Error(message); };

["--store-editor-v3-keyboard-inset", "data-store-editor-keyboard-open", "visualViewport"].forEach((marker) => assert(app.includes(marker), `Gerenciamento de teclado ausente: ${marker}`));
assert(editor.includes('onfocusin="manterCampoEditorGuiadoVisivel(event)"'), "Formularios nao preservam campo ativo");
assert(layouts.includes('html[data-store-editor-keyboard-open="true"] .sfe-preview'), "Preview nao reduz com teclado");
assert(layouts.includes("var(--store-editor-v3-keyboard-inset"), "Layout nao considera altura do teclado");
assert(layouts.includes("var(--app-safe-bottom"), "Acoes nao consideram safe area");
assert(layouts.includes(".sfe-field-group"), "Grupos de campos do editor devem usar componente visual isolado");
assert(layouts.includes("overscroll-behavior:contain"), "Editor deve conter o scroll nas areas guiadas");
assert(layouts.includes("touch-action:pan-y"), "Editor deve permitir rolagem vertical por toque");
assert(layouts.includes(".sfe-actions button") && layouts.includes("min-height:38px!important"), "Acoes inferiores devem usar tamanho compacto");
assert(layouts.includes(".sfe-actions .sfe-action-back") && layouts.includes(".sfe-actions .sfe-action-primary"), "Acoes inferiores devem possuir hierarquia visual");
assert(layouts.includes(".sfe-form{height:100%;min-height:0"), "Formulario deve manter area central rolavel");
console.log("Store editor V3 keyboard layout: viewport, campo ativo e preview compacto validados.");
