# Fase 2B — fundação compartilhada de ORDER.CREATE

## Estado

`NOT_READY_FOR_LIVE`. A etapa extraiu a preparação determinística do registro comercial e fez o modo manual reutilizá-la. O gate da IA continua em `WRITE_MODE = DRY_RUN` e `ORDER.CREATE` continua sem Tool executável.

## Fluxo atual

```text
UI manual → OrderCreatePreparationUseCase → coordenador legado de fecharPedido()
IA shadow → CanonicalOrderPayload → OrderCreateAdapter → OrderCreatePreparationUseCase → ShadowPersistence
```

`OrderCreatePreparationUseCase` valida cliente e itens, normaliza itens, usa o cálculo financeiro real, normaliza o método de pagamento, cria metadados e monta o registro online. Ele não possui método `execute()` e não referencia estoque, caixa, Supabase, `salvarDados()` ou `fecharPedido()`.

## Bloqueio para LIVE

Depois da preparação, o núcleo reversível de estoque, pedido, caixa e persistência local foi movido para `OrderCreateTransactionExecutor`. Consumo de crédito permanece como guarda anterior; shadow financeiro, sincronização, histórico, telemetria e limpeza da UI permanecem pós-commit no fluxo manual. O executor não é exposto ao orquestrador da IA.

Antes de LIVE ainda é necessário executar o diferencial manual × executor com persistência real controlada, validar compensação no aparelho e criar uma ativação explícita `ALLOW_LIVE_AI_ORDER_CREATE = false`. O mecanismo atual de `salvarDados()` não sinaliza todas as falhas de armazenamento, portanto essa fronteira também precisa ser fortalecida antes de liberar a IA.
