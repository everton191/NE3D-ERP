# Modelo de segurança

- Negar por padrão; action ausente ou não READY não chega ao modelo.
- READ respeita permissão; PREPARE valida sem gravar; WRITE passa por `WriteCapabilityGate`, confirmação, idempotência e `ExecutionGuard`.
- O modelo não recebe Supabase, SQL, REST/RPC arbitrária, secrets ou IDs inventados.
- Referências como “esse pedido” usam entidade selecionada/recentes; ambiguidade pede escolha.
- Valores financeiros, estoque e preço são calculados por serviços determinísticos.
- Logs devem usar request ID e metadados mínimos, com redação de conteúdo sensível.
- O catálogo não habilita novos WRITEs; dry-run permanece obrigatório até testes E2E.
