# Auditoria de migrations Supabase - Fase 7A

Data: 2026-05-30

Comando usado para remoto: `npx supabase migration list --linked`.

Regra desta fase: nao executar `supabase db push` geral.

## Resumo

- Projeto remoto vinculado: `qsufnnivlgdidmjuaprb`.
- Migration Start aplicada e validada: `20260530103000_start_plan_backend_authority.sql`.
- Migrations de IA, diagnosticos, Google e webhook billing aparecem aplicadas remotamente.
- Migrations antigas de Storefront fases 3.8/3.9 e financeiro/caixa continuam locais/pendentes e fora do escopo desta fase.

## Classificacao

| Migration | Status | Classificacao | Observacao |
| --- | --- | --- | --- |
| `20260428103000` a `20260520215500` | Local e remoto | APLICADA | Base ERP/SaaS existente no remoto. |
| `20260522103000_storefront_phase3.sql` | Local sem remote list aplicado | NECESSITA REVISAO | Foi aplicada anteriormente por processo controlado, mas nao aparece alinhada no historico remoto atual. Nao reaplicar por `db push`. |
| `20260522183000_storefront_phase38_admin_fields.sql` | Local apenas | PENDENTE PERIGOSA | Storefront admin fields fora do escopo do release candidate. |
| `20260522203000_storefront_phase39_hardening_storage.sql` | Local apenas | PENDENTE PERIGOSA | Storage/beta fechado fora do escopo do release candidate. |
| `20260525120000_erp_cash_fiscal_foundation.sql` | Local apenas | NECESSITA REVISAO | Caixa/fiscal antigo fora do escopo desta fase. |
| `20260525133000_erp_cash_concurrency_audit_hardening.sql` | Local apenas | NECESSITA REVISAO | Caixa/fiscal antigo fora do escopo desta fase. |
| `20260525143000_erp_financial_idempotency_atomicity.sql` | Local apenas | NECESSITA REVISAO | Financeiro antigo fora do escopo desta fase. |
| `20260525153000_erp_financial_integrity_shadow_mode.sql` | Local apenas | NECESSITA REVISAO | Financeiro antigo fora do escopo desta fase. |
| `20260525163000_erp_financial_reconciliation_recovery.sql` | Local apenas | NECESSITA REVISAO | Financeiro antigo fora do escopo desta fase. |
| `20260525170000_erp_financial_worker_orchestration.sql` | Local apenas | NECESSITA REVISAO | Financeiro antigo fora do escopo desta fase. |
| `20260529141000_ai_foundation_disabled.sql` | Local e remoto | APLICADA | IA estruturada e desligada. |
| `20260529162000_diagnostics_bugs_feedback_codex.sql` | Local e remoto | APLICADA | Diagnosticos e feedback. |
| `20260529173500_diagnostics_validation_hardening.sql` | Local e remoto | APLICADA | Hardening diagnostics. |
| `20260529193000_google_integrations_foundation_disabled.sql` | Local e remoto | APLICADA | Google estruturado e desligado. |
| `20260529213000_billing_webhook_hardening.sql` | Local e remoto | APLICADA | Webhook central Mercado Pago. |
| `20260530103000_start_plan_backend_authority.sql` | Local e remoto | APLICADA | Start preparado, mas bloqueado por `START_PLAN_ENABLED=false`. |

## Pendencias

- Nao aplicar migrations pendentes antigas sem fase propria, backup e validacao remota dedicada.
- Nao rodar `supabase db push` geral.
- Manter Start bloqueado ate sandbox real com token `TEST-`.
