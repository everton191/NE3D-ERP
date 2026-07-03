# Auditoria de navegação - etapa 1

Data: 2026-07-01

## Objetivo

Organizar menus, rotas e botões visíveis sem bagunçar a interface existente. A regra aplicada foi: função existente vai para a área correta; função importante sem tela segura recebe MVP mínimo; função insegura para esta fase fica escondida e registrada como pendência.

## Separação aplicada

- Perfil: dados pessoais, senha, segurança da conta, exclusão de conta, modo de uso e tema do ERP.
- Administração da empresa: dados da empresa, plano, funcionários, permissões, loja, caixa, estoque, backup e logs.
- Sistema: versão, diagnóstico, sincronização, cache, atualizações, documentos e suporte.
- Superadmin: gestão da plataforma e empresas SaaS, separado dos clientes da empresa 3D.

## Correções de rota e área

- Usuários/funcionários deixaram de aparecer como grupo Admin separado no menu e passaram a ficar dentro de Administração da empresa.
- Plano e assinatura permanecem em Administração da empresa, não no Perfil pessoal.
- Tema do ERP ficou concentrado no Perfil e no controle rápido global, removendo duplicações em cabeçalhos.
- Sistema deixou de duplicar Segurança da conta, Modo de uso e sugestões genéricas.

## MVPs mínimos criados

- Permissões por cargo: consulta clara por papéis, sem edição granular nesta fase.
- Configurações de estoque: ajuste simples dos limites de alerta baixo e crítico.
- Configurações do caixa: ativar/desativar formas de pagamento já usadas pelo ERP.

## Pendências escondidas ou não ativadas

- Edição granular de permissões por usuário/campo ainda precisa de backend/RLS dedicado.
- Impressoras 3D automáticas continuam desativadas para fase futura por dependerem do agente local e validações de rede.
- Logs técnicos detalhados devem continuar atrás de permissões administrativas/superadmin.

## Validação local

- `node --check app.js`
- `npm run test:navigation-stage-1`
- Testes complementares de perfil/admin, tema, modo de uso, registro de botões e build web devem ser executados antes de liberar PWA/APK.
