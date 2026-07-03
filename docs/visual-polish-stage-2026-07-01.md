# Revisão visual e textual - etapa unificada

Data: 2026-07-01

## Escopo

Esta etapa unifica a limpeza visual da Home com a revisão de textos, scroll e acabamento das telas principais do Simplifica.

## Correções aplicadas

- Home compacta: removido o bloco de modo simples/avançado, texto explicativo de modo e botão grande de Configurações.
- Perfil: Tema do ERP e Modo de uso ficam somente em Preferências da interface, como botões discretos.
- Avatar: mantido simples com Meu perfil, Segurança da conta, Notificações, Administração quando permitido, Superadmin quando aplicável e Sair.
- Sistema: continua separado de preferências pessoais.
- Administração: continua separada do Perfil.
- Mobile: reforçado respiro inferior para reduzir risco de bottom navigation cobrir conteúdo.

## Pendências de revisão visual ampla

- Fazer caminhada manual por todas as telas com dados reais em desktop e mobile.
- Revisar estados vazios com base em bases sem pedidos, sem estoque e sem funcionários.
- Revisar textos remanescentes de módulos antigos antes de qualquer publicação.
- Validar scroll de modais e bottom sheets em aparelho Android real.

## Validação local

- `node --check app.js`
- `npm run test:visual-polish-stage`
- `npm run test:interface-modes`
- `npm run test:profile-admin-separation`
- `npm run test:ui-responsive-balance`
- `npm run build:web`
