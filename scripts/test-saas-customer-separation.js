const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const app = fs.readFileSync(path.join(root, "app.js"), "utf8");
const saasMigration = fs.readFileSync(
  path.join(root, "supabase", "migrations", "20260428195500_saas_plans_clients_payments.sql"),
  "utf8"
);

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

const erpCustomersRenderer = app.match(/function renderClientes\(\)\s*\{([\s\S]*?)\n\}/)?.[1] || "";

assert(
  erpCustomersRenderer.includes("return renderClientesOperacionais();"),
  "A tela Clientes do ERP deve usar a carteira operacional."
);
assert(
  !erpCustomersRenderer.includes("renderClientesSaas"),
  "A tela Clientes do ERP não pode abrir empresas SaaS."
);
assert(
  /clientes:\s*renderClientesSaas/.test(app) && /label:\s*"Empresas"/.test(app),
  "A lista SaaS deve permanecer na guia Empresas do Superadmin."
);
assert(
  /function renderClientesSaas\(\)\s*\{\s*if \(!isSuperAdmin\(\)\) return renderClientesOperacionais\(\);/.test(app),
  "A listagem de empresas precisa bloquear acesso fora do Superadmin."
);
assert(
  /function getEmpresasSaasOperacionais\(\)\s*\{\s*if \(!isSuperAdmin\(\)\) return \[\];/.test(app),
  "Os dados globais de empresas precisam retornar vazio fora do Superadmin."
);
assert(
  app.includes('texto: "Clientes"') && !app.includes('texto: isSuperAdmin() ? "Clientes SaaS"'),
  "O menu do ERP deve usar o rótulo Clientes para todos os perfis."
);
assert(
  /function restringirDadosSaasAoEscopoAtual/.test(app)
    && /registroCompanyId === companyId/.test(app)
    && /registroClientId === clientId/.test(app),
  "O cache SaaS deve ser limitado ao company_id/client_id da sessão."
);
assert(
  /clients_select_own_or_superadmin[\s\S]*erp_is_superadmin\(\)[\s\S]*id = public\.erp_current_client_id\(\)/i.test(saasMigration),
  "A RLS de clients deve permitir apenas a própria conta SaaS ou Superadmin."
);
assert(
  /profiles_select_same_client_or_superadmin[\s\S]*client_id = public\.erp_current_client_id\(\)/i.test(saasMigration),
  "A RLS de profiles deve limitar usuários ao próprio cliente SaaS."
);
assert(
  /function renderUsuariosAdmin\(\)[\s\S]*?const lista = getUsuariosDoCliente\(\)\.filter\(\(usuario\) => papeisFuncionarios\.has\(usuario\.papel\)\)/.test(app),
  "A tela Admin deve listar somente funcionários da empresa atual."
);
assert(
  !/function renderUsuariosAdmin\(\)[\s\S]*?isSuperAdmin\(\)\s*\?\s*usuarios/.test(app),
  "A tela Admin não pode renderizar o array global de usuários."
);
assert(
  /const companyIdAtual = String\([\s\S]*?usuarioCompanyId === companyIdAtual/.test(app)
    && !app.includes("if (!clientId) return !usuario.clientId;"),
  "O escopo local de usuários deve considerar clientId/companyId sem aceitar todos os registros legados."
);
assert(
  /clientId: usuario\?\.clientId \|\| usuario\?\.client_id \|\| ""/.test(app)
    && /companyId: usuario\?\.companyId \|\| usuario\?\.company_id \|\| ""/.test(app),
  "O normalizador não pode atribuir a empresa aberta a usuários globais sem vínculo."
);
assert(
  ["removerUsuario", "redefinirSenhaUsuario", "alternarStatusUsuario"].every((nome) => {
    const trecho = app.match(new RegExp(`(?:async )?function ${nome}\\(id\\) \\{([\\s\\S]*?)\\n\\}`))?.[1] || "";
    return trecho.includes("getUsuariosDoCliente().find");
  }),
  "As ações administrativas precisam operar somente em usuários da empresa atual."
);
assert(
  /function renderAdmin\(\)[\s\S]*?Funcionários do ERP/.test(app)
    && !/function renderAdmin\(\)[\s\S]*?<h3>Trocar senha<\/h3>/.test(app)
    && !/function renderAdmin\(\)[\s\S]*?Limpar pedido/.test(app)
    && !/function renderAdmin\(\)[\s\S]*?<h2 class="section-title">Comercial<\/h2>/.test(app),
  "A tela Admin deve conter apenas os funcionários; a própria senha fica somente no menu Segurança."
);
assert(
  /function adicionarUsuario\(\)[\s\S]*?!planoAtualPermiteFuncionarios\(\)/.test(app)
    && /Este e-mail já pertence a outra conta/.test(app),
  "A criação de funcionários deve respeitar plano e escopo da empresa."
);

console.log("Separação validada: clientes, empresas e usuários respeitam o escopo atual.");
