# Matriz pré-migração FunctionGemma

Gerada de `src/ai/action-registry.js`. `ready_for_functiongemma` exige action READY e exposição permitida; WRITE permanece não exposta.

| action | status | blocker | handler | UseCase | schema | validator | permission | contract test | ready_for_functiongemma |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| navigation.open | READY | - | navigation.open | adapter pendente | sim | strict-object-validator | authenticated | sim | sim |
| orders.search | READY | - | order_search | adapter pendente | sim | strict-object-validator | basic_orders | sim | sim |
| orders.get | READY | - | order_history | adapter pendente | sim | strict-object-validator | basic_orders | sim | sim |
| orders.prepare_create | READY | - | OrderCreatePreparationUseCase | OrderCreatePreparationUseCase | sim | strict-object-validator | basic_orders | sim | sim |
| orders.prepare_update | READY | - | EditOrderUseCase.prepare | EditOrderUseCase.prepare | sim | strict-object-validator | basic_orders | sim | sim |
| orders.prepare_cancel | READY | - | CancelOrderUseCase.prepare | CancelOrderUseCase.prepare | sim | strict-object-validator | basic_orders | sim | sim |
| orders.commit_create | DEGRADED | MISSING_CONTRACT_TEST | SafeOperationPipeline.prepareOrder | SafeOperationPipeline.prepareOrder | sim | strict-object-validator | basic_orders | não | não |
| orders.update | READY | - | EditOrderUseCase.commit | EditOrderUseCase.commit | sim | strict-object-validator | basic_orders | sim | não |
| orders.cancel | READY | - | CancelOrderUseCase.commit | CancelOrderUseCase.commit | sim | strict-object-validator | basic_orders | sim | não |
| customers.search | READY | - | customer_search | adapter pendente | sim | strict-object-validator | basic_orders | sim | sim |
| customers.get | DISABLED | MISSING_HANDLER, MISSING_CONTRACT_TEST | - | adapter pendente | sim | strict-object-validator | basic_orders | não | não |
| inventory.search | READY | - | stock_search | adapter pendente | sim | strict-object-validator | basic_stock | sim | sim |
| inventory.get_roll | DISABLED | MISSING_HANDLER, MISSING_CONTRACT_TEST | - | adapter pendente | sim | strict-object-validator | basic_stock | não | não |
| inventory.history | DEGRADED | MISSING_CONTRACT_TEST | InventoryService | InventoryService | sim | strict-object-validator | basic_stock | não | não |
| inventory.prepare_reservation | DEGRADED | MISSING_CONTRACT_TEST | InventoryReserveUseCase.prepare | InventoryReserveUseCase.prepare | sim | strict-object-validator | basic_stock | não | não |
| inventory.prepare_release | DEGRADED | MISSING_CONTRACT_TEST | InventoryReleaseUseCase.prepare | InventoryReleaseUseCase.prepare | sim | strict-object-validator | basic_stock | não | não |
| inventory.prepare_consume | DEGRADED | MISSING_CONTRACT_TEST | InventoryConsumeUseCase.prepare | InventoryConsumeUseCase.prepare | sim | strict-object-validator | basic_stock | não | não |
| inventory.reserve | DEGRADED | MISSING_CONTRACT_TEST | InventoryReserveUseCase.commit | InventoryReserveUseCase.commit | sim | strict-object-validator | basic_stock | não | não |
| inventory.release | DEGRADED | MISSING_CONTRACT_TEST | InventoryReleaseUseCase.commit | InventoryReleaseUseCase.commit | sim | strict-object-validator | basic_stock | não | não |
| inventory.consume | DEGRADED | MISSING_CONTRACT_TEST | InventoryConsumeUseCase.commit | InventoryConsumeUseCase.commit | sim | strict-object-validator | basic_stock | não | não |
| cash.get_summary | READY | - | cash_summary | adapter pendente | sim | strict-object-validator | simple_cashier | sim | sim |
| cash.prepare_withdrawal | DEGRADED | MISSING_CONTRACT_TEST | CashWithdrawalUseCase.prepare | CashWithdrawalUseCase.prepare | sim | strict-object-validator | simple_cashier | não | não |
| cash.commit_withdrawal | DEGRADED | MISSING_CONTRACT_TEST | CashWithdrawalUseCase.commit | CashWithdrawalUseCase.commit | sim | strict-object-validator | simple_cashier | não | não |
| cash.prepare_deposit | DEGRADED | MISSING_CONTRACT_TEST | CashDepositUseCase.prepare | CashDepositUseCase.prepare | sim | strict-object-validator | simple_cashier | não | não |
| cash.commit_deposit | DEGRADED | MISSING_CONTRACT_TEST | CashDepositUseCase.commit | CashDepositUseCase.commit | sim | strict-object-validator | simple_cashier | não | não |
| cash.open_session | DEGRADED | MISSING_CONTRACT_TEST | abrirSessaoCaixaAutomatica | adapter pendente | sim | strict-object-validator | simple_cashier | não | não |
| cash.prepare_close_session | DEGRADED | MISSING_CONTRACT_TEST | CashCloseSessionUseCase.prepare | CashCloseSessionUseCase.prepare | sim | strict-object-validator | simple_cashier | não | não |
| cash.close_session | DEGRADED | MISSING_CONTRACT_TEST | CashCloseSessionUseCase.commit | CashCloseSessionUseCase.commit | sim | strict-object-validator | simple_cashier | não | não |
| calculator.quote | READY | - | CalculatorDomain.calculate | CalculatorDomain.calculate | sim | strict-object-validator | basic_calculator | sim | sim |
| calculator.batch | DEGRADED | MISSING_CONTRACT_TEST | CalculatorDomain.calculate | CalculatorDomain.calculate | sim | strict-object-validator | basic_calculator | não | não |
| production.list_queue | DEGRADED | MISSING_CONTRACT_TEST | productionSummaryReadOnly | adapter pendente | sim | strict-object-validator | basic_production | não | não |
| production.prepare_job | DEGRADED | MISSING_CONTRACT_TEST | ProductionPrepareUseCase.prepare | ProductionPrepareUseCase.prepare | sim | strict-object-validator | basic_production | não | não |
| production.commit_job | DEGRADED | MISSING_CONTRACT_TEST | ProductionPrepareUseCase.commit | ProductionPrepareUseCase.commit | sim | strict-object-validator | basic_production | não | não |
| production.prepare_change_status | DEGRADED | MISSING_CONTRACT_TEST | ProductionChangeStatusUseCase.prepare | ProductionChangeStatusUseCase.prepare | sim | strict-object-validator | basic_production | não | não |
| production.change_status | DEGRADED | MISSING_CONTRACT_TEST | ProductionChangeStatusUseCase.commit | ProductionChangeStatusUseCase.commit | sim | strict-object-validator | basic_production | não | não |
