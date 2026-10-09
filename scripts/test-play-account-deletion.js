const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "..");
const app = fs.readFileSync(path.join(root, "app.js"), "utf8");
const vercel = JSON.parse(fs.readFileSync(path.join(root, "vercel.json"), "utf8"));
const accountSecurity = fs.readFileSync(path.join(root, "src/features/account/account-security.js"), "utf8");

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

const publicRoute = vercel.routes.find((route) => String(route.src || "").includes("excluir-conta"));
assert(publicRoute?.dest === "/index.html", "A rota pública de exclusão deve abrir sem autenticação.");
assert(app.includes('"/excluir-conta", "/exclusao-de-conta", "/account-deletion"'), "Rotas públicas de exclusão devem ser reconhecidas pelo aplicativo.");
assert(app.includes("data-public-account-deletion"), "Página pública dedicada deve estar presente.");
assert(app.includes("Simplifica 3D") && app.includes("Solicitar por e-mail"), "Página pública deve identificar o aplicativo e permitir iniciar a solicitação.");
assert(app.includes("mailto:${escaparAttr(SUPPORT_EMAIL)}?subject=${assunto}&body=${corpo}"), "Solicitação pública deve abrir um canal de contato preenchido.");
assert(app.includes("Perfil > Segurança, dados e exclusão da conta"), "Página pública deve indicar o caminho dentro do app.");
assert(accountSecurity.includes('"request_account_deletion"') && accountSecurity.includes('"confirm_account_deletion"'), "Fluxo autenticado de exclusão deve permanecer disponível.");
assert(accountSecurity.includes("carência de 15 dias"), "Fluxo autenticado deve informar a carência.");
assert(app.includes("dados pessoais associados entram no processo de exclusão ou anonimização"), "Política deve explicar o tratamento após a carência.");
assert(app.includes("obrigação legal, fiscal, antifraude ou de segurança"), "Política deve declarar retenções justificadas.");

console.log("OK: exclusão de conta possui caminho no app e recurso público compatível com a declaração da Google Play.");
