# Fase 3 — inventário inicial de RPCs SECURITY DEFINER

Fonte: Security Advisor remoto em 2026-08-31. O inventário encontrou 21 funções `SECURITY DEFINER` com execução por `anon` (direta ou herdada por `PUBLIC`).

| RPC | Classe | Finalidade confirmada | Chamador público no código | Ação do lote 1 |
|---|---|---|---|---|
| `get_storefront_product_ranking` | PUBLIC_REQUIRED | Ranking agregado da loja publicada | `app.js` | Manter público; fixar `search_path` |
| `storefront_publication_allowed` | PUBLIC_REQUIRED | Gate usado pelas policies da vitrine | policies RLS | Manter público; fixar `search_path` |
| `erp_current_client_id` | AUTH_REQUIRED | Resolve cliente da sessão Auth | policies/ERP | Revogar anon/PUBLIC; manter authenticated |
| `s3d_current_paid_price` | AUTH_REQUIRED | Preço calculado por clientes pagos | sem chamada pública encontrada | Revogar anon/PUBLIC; manter authenticated |
| `audit_cash_movement_insert`, `audit_cash_session_changes`, `audit_sale_payment_changes` | INTERNAL_ONLY | Triggers de auditoria financeira | trigger | Revogar anon/PUBLIC; manter authenticated/service role |
| `claim_operation_reconciliation_batch`, `enqueue_operation_reconciliation`, `mark_abandoned_financial_operations`, `release_operation_reconciliation_item`, `run_operation_reconciliation`, `run_reconciliation_health_checks`, `validate_reconciliation_tracking` | AUTH_REQUIRED | Worker e recuperação de reconciliação por empresa | sem chamada pública encontrada | Revogar anon/PUBLIC; manter authenticated/service role |
| `record_financial_integrity_check`, `record_financial_operation_event`, `run_financial_integrity_checks`, `validate_financial_operation_tracking` | AUTH_REQUIRED | Integridade financeira por empresa | sem chamada pública encontrada | Revogar anon/PUBLIC; manter authenticated/service role |
| `register_erp_audit_event`, `validate_cash_movement_integrity`, `validate_sale_payment_integrity` | AUTH_REQUIRED | Auditoria/validação de caixa e pagamentos | trigger/ERP | Revogar anon/PUBLIC; manter authenticated/service role |

As funções acima usam verificações de empresa/superadmin quando são chamadas como RPC. O lote não altera RLS ou dados; reduz a superfície anônima e remove os seis `search_path` mutáveis do Advisor, além dos dois `SECURITY DEFINER` públicos necessários à vitrine. Durante o lint remoto foi corrigida também a referência obsoleta a `subscriptions.plan_slug` no gate `storefront_publication_allowed`.
