# ORDER.CREATE — Shadow Mode

`CanonicalOrderPayload → OrderCreateAdapter → OrderCreatePreparationUseCase → ShadowPersistence` executa o mesmo preparo comercial do modo manual sem gravar pedido, estoque, caixa, financeiro ou banco. O resultado contém `SHADOW_VALIDATED`, payload mapeado, SHA-256 e `sideEffects = 0`.

O módulo shadow não importa nem referencia `fecharPedido()`, `salvarDados()`, Supabase ou bridge de execução. LIVE continua desligado.
