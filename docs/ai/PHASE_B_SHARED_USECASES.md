# Fase B — UseCases compartilhados de Pedidos

Data: 2026-08-20

## Arquitetura anterior

Edição reutilizava preparação/executor de criação, mas a composição, preview, efeitos e invalidação estavam dentro de `fecharPedido`. Cancelamento concentrava estoque, caixa, financeiro, pedido, persistência, sincronização e UI em `cancelOrderSafely`.

## UseCases e fluxos migrados

- `EditOrderUseCase.prepare/commit`: existência, permissão, cancelado, validação, conflito por versão, diff, efeitos e envelope.
- `CancelOrderUseCase.prepare/commit`: cancel plan, permissão, política, estoque, financeiro, produção, idempotência e envelope.
- Reaproveitados: `OrderCreatePreparationUseCase`, `OrderCreateTransactionExecutor`, `InventoryService`, `diffConsumoPedido`, núcleo financeiro, sync e confirmação sensível.
- `fecharPedido` usa `EditOrderUseCase` quando há pedido em edição.
- `cancelOrderSafely` tornou-se adapter de UI e usa `CancelOrderUseCase`.
- `alterarStatusPedido` também prepara e confirma a alteração pelo `EditOrderUseCase`.

## Efeitos explícitos

Edição retorna `inventory`, `cash`, `production` e invalida `orders`, `order:<id>`, `dashboard`, `cash-summary` e `inventory`. Cancelamento separa `releaseReservations`, `restoreConsumption`, `reverseOperations` e `cancelJobs`, invalidando também produção.

Produção parcial ou concluída impede restauração automática integral de consumo e gera `PARTIAL_PRODUCTION_STOCK_REVIEW`. Repetição não duplica estoque, financeiro ou produção. O commit local possui snapshot/rollback; uma RPC atômica de backend continua recomendada para autoridade remota.

## Actions

- `orders.prepare_update`: READY, exposta como PREPARE.
- `orders.prepare_cancel`: READY, exposta como PREPARE.
- `orders.update`: READY, não exposta ao modelo.
- `orders.cancel`: READY, não exposta ao modelo.

## Testes

`test:order-shared-usecases` cobre edição, cancelamento, permissões, validação, conflito, estoque, financeiro, produção e idempotência. `test:order-usecase-ui-parity` comprova que os handlers manuais delegam aos mesmos UseCases.

Web build, TypeScript, Capacitor sync e Android `assembleDebug` passaram. O APK 1.0.37 (65) foi instalado no ASUS I005DA, abriu com processo ativo e o harness retornou `SAFE_TO_TEST` com o assistente visível. Não foi executada edição/cancelamento real porque os dados do aparelho não foram confirmados como descartáveis.

## Pendências

- `alterarStatusPedido` ainda precisa migrar para `EditOrderUseCase` ou UseCase específico.
- Reserva de estoque não possui ledger independente no fluxo legado; o cancel plan mantém o campo explícito sem inventar registros.
- Atomicidade remota entre pedido, estoque, financeiro e produção depende de RPC futura.
- Validação manual no APK deve usar somente dados descartáveis de teste.
- `test-order-password-state-regression.js` alcança e aprova o novo contrato de status, mas depois falha em uma regra global preexistente do fluxo de anexos da assistente (`mostrarToast(error?.message...)`), fora desta vertical.

`PHASE_B_ORDERS = NOT_READY`

Blockers: não existe reserva canônica independente e falta teste manual APK com dados descartáveis; por isso não é seguro declarar a vertical integralmente pronta.
# UseCases compartilhados críticos

Pedidos já usa `EditOrderUseCase` e `CancelOrderUseCase`. O primeiro recorte para Estoque, Caixa e Produção está em `src/ai-3d/operational-usecases.js`, com preparação sem persistência, permissão, confirmação obrigatória no commit e idempotência em memória por instância.

UseCases adicionados: `InventoryReserveUseCase`, `InventoryReleaseUseCase`, `InventoryConsumeUseCase`, `CashWithdrawalUseCase`, `CashDepositUseCase`, `CashCloseSessionUseCase`, `ProductionPrepareUseCase` e `ProductionChangeStatusUseCase`.

Eles ainda são contratos de composição. A UI e os adapters de IA não foram ligados a estes commits nesta etapa, porque cada dependência deve ser conectada ao serviço de domínio atual e validada com rollback/persistência reais. Portanto, nenhum WRITE novo foi exposto ao modelo.
