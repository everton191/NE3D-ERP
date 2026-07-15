# Auditoria visual autenticada

Data: 2026-07-10

Regra: nenhuma senha ou token deve ser salvo no repositorio. A auditoria usa apenas a sessao local autorizada.

## Viewports

- 320 x 568
- 360 x 800
- 390 x 844
- 412 x 915
- 768 x 1024
- 1366 x 768
- 1440 x 900

## Verificacao por tela

Para cada tela autenticada, registrar:

- abertura sem erro de console;
- rolagem vertical por roda do mouse e gesto;
- ultimo controle visivel acima do menu inferior;
- ausencia de corte horizontal;
- modal ou seletor parcial centralizado;
- botoes clicaveis e com destino funcional;
- cards, campos, fontes e icones dentro do contrato existente;
- tema claro e escuro sem mistura.

## Telas prioritarias

- Dashboard simples e profissional
- Pedidos e novo pedido
- Calculadora
- Estoque
- Caixa
- Producao
- Relatorios
- Perfil, conta e seguranca
- Administracao da empresa
- Superadmin e perfil da empresa
- Loja/Admin e loja publica

## Evidencia desta execucao

### Aprovado automaticamente

- sintaxe de `app.js`, servicos e service worker;
- build web;
- contratos de overflow, scroll, safe area e menu inferior;
- responsividade mobile e desktop;
- modo simples/avancado e popup central;
- temas, contraste e isolamento da loja;
- estoque, calculadora, pedido, planos e permissoes;
- Superadmin, biometria e resumo por versao;
- migracoes existentes e estrutura/RLS local de rolos.

### Pendente antes de publicar

- a janela interna do navegador nao anexou uma aba nesta sessao;
- login autenticado nao foi executado visualmente;
- rolagem por roda do mouse e gesto nao foi simulada nas telas reais;
- APK/PWA, GitHub, Supabase remoto e Vercel nao foram atualizados.

O resultado visual deve ser registrado somente apos o teste real. Validacoes estaticas nao contam como auditoria autenticada concluida.
