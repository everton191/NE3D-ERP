# Validação funcional da Etapa 3

## Aprovado automaticamente

- Fundação, grid, overlays, teclado e shell V3.
- Dashboard, Relatórios, tabelas e gráficos.
- Pedido, item manual, calculadora, materiais e baixa de estoque por status.
- Estoque simples, saída manual, rolos/lotes e reposição.
- Produção manual e ações integradas ao Caixa.
- Caixa, movimentações, pagamentos e fechamento por contratos estáticos.
- Tema, Perfil, Segurança, interface e navegação.
- Overflow, equilíbrio responsivo, estabilidade mobile e shell.
- Build de produção.
- Lint sintático e typecheck da Fundação V3.

## Validado interativamente sem gravar operação

- entrada autenticada Superadmin → ERP;
- navegação por Perfil, Pedidos, Produção, Relatórios e Caixa;
- abertura/fechamento de Dialog com Escape e foco restaurado;
- Drawer de Pedido rápido, foco e digitação temporária no campo Cliente;
- rolagem de Relatórios até o final;
- ausência de overflow horizontal nas rotas capturadas.

## Não executado como mutação real

Não foram criados pedidos, movimentações financeiras, baixas de estoque ou fechamentos de caixa reais durante a captura. Esses fluxos possuem cobertura pelos testes existentes, mas uma operação real alteraria dados do usuário. APK/WebView, teclado Android físico, navegação por gestos/três botões e PWA instalado não estavam disponíveis e não são declarados como aprovados.
