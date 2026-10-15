-- PostgREST's ON CONFLICT (payment_id) has no predicate and cannot infer the
-- historical partial index. A full unique index accepts multiple NULLs too,
-- preserving existing rows/contracts while making webhook retries idempotent.
-- Keep the historical index; no destructive replacement is needed.
set local lock_timeout = '5s';
set local statement_timeout = '60s';
create unique index erp_payments_payment_id_upsert_unique_idx
  on public.erp_payments (payment_id);

-- Controlled rollback (after reverting the dependent webhook deployment):
-- drop index public.erp_payments_payment_id_upsert_unique_idx;
