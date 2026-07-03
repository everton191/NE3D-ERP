const assert = require("node:assert/strict");
const fs = require("node:fs");

const app = fs.readFileSync("app.js", "utf8");
const migration = fs.readFileSync("supabase/migrations/20260701203000_user_preferences_interface_mode.sql", "utf8");

assert.ok(app.includes("function renderAdministracaoEmpresa()"), "administração da empresa deve ser módulo próprio");
assert.ok(app.includes("function podeAcessarAdministracaoEmpresa"), "administração deve validar cargo ou permissão");
assert.ok(app.includes('if (tela === "administracao") return podeAcessarAdministracaoEmpresa(usuario)'), "rota administrativa deve bloquear acesso direto");
assert.ok(app.includes("Administração da empresa"), "avatar deve oferecer administração apenas quando permitida");
assert.ok(app.includes("Modo de uso"), "perfil deve expor modo de uso");
assert.ok(app.includes("Preferências da interface"), "perfil deve agrupar preferências pessoais de interface");
assert.doesNotMatch(app, /<span><small>Modo atual<\/small>/, "menu do avatar não deve exibir modo de uso");
assert.ok(app.includes("Meu perfil"), "menu do avatar deve manter acesso pessoal");
assert.ok(app.includes("Segurança da conta"), "menu do avatar deve manter segurança pessoal");
assert.doesNotMatch(app, /<strong>\$\{renderUiIcon\("assinatura"\)\} Meu plano/, "perfil pessoal não deve conter plano da empresa");
assert.doesNotMatch(app, /<h3>Assinatura<\/h3>[\s\S]{0,300}Planos e forma de pagamento/, "perfil pessoal não deve conter assinatura");
assert.ok(app.includes("PERSONALIZATION_SCREEN_ENABLED = false"), "tela grande de personalização deve ficar desativada");
assert.ok(app.includes("trocarTela('superadmin')"), "atalho de superadmin deve permanecer separado");

assert.ok(migration.includes("create table if not exists public.user_preferences"), "migração deve criar user_preferences");
assert.ok(migration.includes("interface_mode text not null default 'simple'"), "modo padrão remoto deve ser simple");
assert.ok(migration.includes("check (interface_mode in ('simple', 'advanced'))"), "banco deve aceitar somente simple/advanced");
assert.ok(migration.includes("auth.uid() = user_id"), "RLS deve limitar preferências ao próprio usuário");

console.log("profile_admin_separation_tests_ok");
