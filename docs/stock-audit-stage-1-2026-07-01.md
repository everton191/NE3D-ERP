# Auditoria Estoque - Etapa 1

Data: 2026-07-01

## Estrutura encontrada

- Estoque local principal: lista `estoque`, normalizada por `normalizarEstoque()` e `normalizarMaterialEstoque()` em `app.js`.
- Serviço comum: `InventoryService`, usado por cadastro de material, edição, remoção e baixa por pedido.
- Pedidos: `fecharPedido()` chama `aplicarEstoquePedido()` antes de salvar o pedido.
- Baixa por pedido: `diffConsumoPedido()` calcula diferença entre pedido novo e antigo para evitar desconto duplo em edição.
- Devolução por cancelamento: `requestOrderDelete()` confirma devolução e `cancelOrderSafely()` marca `stock_returned_at` / `estoqueDevolvidoEm`.
- Histórico: `registrarHistorico("Estoque", ...)` já existia e foi preservado.
- Rolos: existe fundação desativada em `supabase/migrations/20260630103000_account_security_inventory_foundation_disabled.sql`, com `inventory_rolls` e `inventory_roll_events`, explicitamente preparada para uso futuro.
- Permissões/plano: `basic_stock`, `spool_stock` e `stock_settings` já existem na matriz local e na migration `20260630113000_feature_access_matrix.sql`.
- Interface atual: `renderEstoque()` possui modo simples/avançado, alertas, histórico avançado e prévia visual de rolos.

## Lacunas tratadas nesta etapa

- Histórico de estoque agora aceita metadados estruturados por movimento.
- Entradas, ajustes, remoções, baixas por pedido, devoluções e saídas manuais passam a registrar tipo de movimento, material, quantidade, saldo antes/depois, usuário e chave de idempotência quando aplicável.
- Ajuste de quantidade exige motivo quando altera peso.
- Saída manual foi adicionada com motivos controlados e bloqueio de saldo negativo.
- Baixa de pedido novo e devolução por cancelamento usam chave de idempotência local para reduzir risco de repetição acidental.
- Custo total do estoque fica restrito a papéis administrativos.
- Alertas ganharam lista de compras simples baseada em estoque mínimo/base.

## Fora do escopo desta etapa

- Não foi ativado consumo automático por rolo.
- Não foi criada integração com impressoras.
- Não foi criada leitura de G-code.
- Não foi criada tabela nova nem módulo paralelo de estoque.
- Não foi publicada atualização em Vercel, GitHub, PWA ou APK.

## Próximas etapas sugeridas

- Transformar a fundação de rolos desativada em fluxo controlado somente quando a regra de produção estiver fechada.
- Ligar `inventory_roll_events` a uma migration ativa com RLS e RPCs idempotentes.
- Criar lista de compras persistida por empresa com fornecedor/preço quando o cadastro de fornecedores estiver estável.
- Validar fluxo autenticado real em banco antes de ativar regras remotas de baixa/devolução.
