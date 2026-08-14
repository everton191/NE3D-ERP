# Fase 2A — preparação segura de operação em dry-run

## Limite desta fase

`WRITE_MODE = DRY_RUN`. A Capability `ORDER.CREATE` não está conectada a Tool de escrita, `fecharPedido()` ou qualquer persistência. `STOCK.ADD`, clientes, caixa e financeiro permanecem bloqueados.

## Pipeline

`ActiveDraft → PrepareOperation → validação → PermissionGuard → PlanGuard → WriteCapabilityGate → PreparedOperation → PendingConfirmation → ConfirmationManager → IdempotencyManager → ExecutionGuard → DryRunExecutor → StructuredResult`.

## PreparedOperation

Congela `operationId`, Capability, conta, empresa, tarefa, `draftVersion`, payload determinístico, `payloadHash`, risco, snapshot de permissão e prazo de validade. O payload de pedido contém cliente, itens, quantidade, preço, peso, materiais, subtotal, desconto, total e metadados.

Toda alteração de slot incrementa `draftVersion`. Se houver confirmação pendente, ela passa imediatamente para `STALE`. Uma nova preparação gera outro `operationId`, snapshot e hash.

## Confirmação determinística

Com uma `PendingConfirmation`, “sim”, “confirmo” e equivalentes usam fast path e não chamam o provider. A confirmação verifica novamente conta, empresa, permissão, plano, versão, hash, expiração, idempotência e concorrência.

## Idempotência

A chave combina conta, Capability, `operationId` e `payloadHash`. `EXECUTING` e `DRY_RUN_EXECUTED` bloqueiam repetição. O estado fica em armazenamento local isolado pela conta e sobrevive à recriação da Activity/processo.

## Resultado

O executor retorna `DRY_RUN_EXECUTED`, `sideEffects = 0`, o mesmo payload preparado e a mensagem “Validação concluída em modo de teste. Nenhum dado foi alterado.”

## Fail-closed

Qualquer divergência bloqueia: Capability não pronta, modo live, conta/empresa diferente, permissão/plano alterado, Draft novo, hash divergente, confirmação inválida/expirada, repetição ou execução concorrente.

## Próximo gate

A Fase 2B só poderá substituir o executor depois de comparar programaticamente o payload preparado com a operação manual e autorizar exclusivamente `ORDER.CREATE`.
