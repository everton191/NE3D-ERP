const fs = require("fs");
const path = require("path");

const rootDir = path.resolve(__dirname, "..");
const migrationPath = path.join(
  rootDir,
  "supabase",
  "migrations",
  "20260525120000_erp_cash_fiscal_foundation.sql"
);
const hardeningMigrationPath = path.join(
  rootDir,
  "supabase",
  "migrations",
  "20260525133000_erp_cash_concurrency_audit_hardening.sql"
);
const idempotencyMigrationPath = path.join(
  rootDir,
  "supabase",
  "migrations",
  "20260525143000_erp_financial_idempotency_atomicity.sql"
);
const shadowMigrationPath = path.join(
  rootDir,
  "supabase",
  "migrations",
  "20260525153000_erp_financial_integrity_shadow_mode.sql"
);
const reconciliationMigrationPath = path.join(
  rootDir,
  "supabase",
  "migrations",
  "20260525163000_erp_financial_reconciliation_recovery.sql"
);
const workerOrchestrationMigrationPath = path.join(
  rootDir,
  "supabase",
  "migrations",
  "20260525170000_erp_financial_worker_orchestration.sql"
);
const appJsPath = path.join(rootDir, "app.js");

function fail(message) {
  console.error(`FAIL: ${message}`);
  process.exitCode = 1;
}

function assertIncludes(sql, needle, message) {
  if (!sql.includes(needle)) fail(message || `Missing: ${needle}`);
}

function assertRegex(sql, regex, message) {
  if (!regex.test(sql)) fail(message || `Missing pattern: ${regex}`);
}

if (!fs.existsSync(migrationPath)) {
  fail(`Migration not found: ${migrationPath}`);
  process.exit();
}

const sql = fs.readFileSync(migrationPath, "utf8").replace(/\s+/g, " ").trim();
const hardeningSql = fs.existsSync(hardeningMigrationPath)
  ? fs.readFileSync(hardeningMigrationPath, "utf8").replace(/\s+/g, " ").trim()
  : "";
const idempotencySql = fs.existsSync(idempotencyMigrationPath)
  ? fs.readFileSync(idempotencyMigrationPath, "utf8").replace(/\s+/g, " ").trim()
  : "";
const shadowSql = fs.existsSync(shadowMigrationPath)
  ? fs.readFileSync(shadowMigrationPath, "utf8").replace(/\s+/g, " ").trim()
  : "";
const reconciliationSql = fs.existsSync(reconciliationMigrationPath)
  ? fs.readFileSync(reconciliationMigrationPath, "utf8").replace(/\s+/g, " ").trim()
  : "";
const workerOrchestrationSql = fs.existsSync(workerOrchestrationMigrationPath)
  ? fs.readFileSync(workerOrchestrationMigrationPath, "utf8").replace(/\s+/g, " ").trim()
  : "";
const appJs = fs.existsSync(appJsPath)
  ? fs.readFileSync(appJsPath, "utf8")
  : "";

[
  "create table if not exists public.payment_methods",
  "create table if not exists public.cash_sessions",
  "create table if not exists public.cash_movements",
  "create table if not exists public.sale_payments",
  "create table if not exists public.fiscal_documents",
  "create table if not exists public.erp_customer_fiscal_profiles",
  "create table if not exists public.erp_audit_events",
].forEach((needle) => assertIncludes(sql, needle));

[
  "alter table public.payment_methods enable row level security",
  "alter table public.cash_sessions enable row level security",
  "alter table public.cash_movements enable row level security",
  "alter table public.sale_payments enable row level security",
  "alter table public.fiscal_documents enable row level security",
  "alter table public.erp_customer_fiscal_profiles enable row level security",
  "alter table public.erp_audit_events enable row level security",
].forEach((needle) => assertIncludes(sql, needle, `RLS missing for ${needle}`));

[
  "empresa_id uuid not null references public.companies(id)",
  "usuario_id uuid references auth.users(id)",
  "payment_method_id uuid references public.payment_methods(id)",
  "session_id uuid",
  "document_type text not null default 'none'",
  "fiscal_payload jsonb not null default '{}'::jsonb",
].forEach((needle) => assertIncludes(sql, needle));

[
  "add column if not exists cash_session_id uuid references public.cash_sessions(id)",
  "add column if not exists fiscal_document_id uuid references public.fiscal_documents(id)",
  "add column if not exists payment_summary_json jsonb not null default '{}'::jsonb",
  "add column if not exists fiscal_ready_json jsonb not null default '{}'::jsonb",
].forEach((needle) => assertIncludes(sql, needle, `Legacy erp_records bridge missing: ${needle}`));

[
  "add column if not exists ncm text",
  "add column if not exists cfop_padrao text",
  "add column if not exists cest text",
  "add column if not exists origem text",
  "add column if not exists unidade_comercial text",
  "add column if not exists ean text",
  "add column if not exists tributacao jsonb not null default '{}'::jsonb",
].forEach((needle) => assertIncludes(sql, needle, `Fiscal product field missing: ${needle}`));

[
  "add column if not exists cpf_cnpj text",
  "add column if not exists ie text",
  "add column if not exists ind_ie text",
  "add column if not exists razao_social text",
  "add column if not exists nome_fantasia text",
  "add column if not exists endereco_fiscal jsonb not null default '{}'::jsonb",
].forEach((needle) => assertIncludes(sql, needle, `Fiscal client field missing: ${needle}`));

[
  "public.get_or_create_cash_session",
  "public.ensure_default_payment_methods",
  "public.register_erp_audit_event",
].forEach((needle) => assertIncludes(sql, needle, `Required helper missing: ${needle}`));

assertRegex(
  sql,
  /type in \('cash', 'pix', 'credit', 'debit', 'boleto', 'store_credit', 'other'\)/,
  "Payment method types must stay dynamic and extensible."
);
assertRegex(
  sql,
  /type in \('sale', 'sangria', 'suprimento', 'retirada', 'estorno', 'adjustment', 'opening', 'closing'\)/,
  "Cash movement types must include operational cash events."
);
assertRegex(
  sql,
  /public\.erp_is_superadmin\(\) or public\.s3d_is_company_member\(empresa_id\)/,
  "Company-scoped policies must protect ERP finance tables."
);

if (!process.exitCode) {
  console.log("ERP cash/fiscal foundation migration looks consistent.");
}

if (!hardeningSql) {
  fail(`Hardening migration not found: ${hardeningMigrationPath}`);
  process.exit();
}

[
  "add column if not exists session_scope text not null default 'company'",
  "cash_sessions_open_company_simple_unique_idx",
  "cash_sessions_open_operator_scope_unique_idx",
  "public.s3d_cash_session_lock_key",
  "pg_advisory_xact_lock(public.s3d_cash_session_lock_key(p_empresa_id, v_scope))",
  "public.validate_cash_movement_integrity",
  "public.validate_sale_payment_integrity",
  "public.audit_cash_session_changes",
  "public.audit_cash_movement_insert",
  "public.audit_sale_payment_changes",
  "public.register_cash_movement",
].forEach((needle) => assertIncludes(hardeningSql, needle, `Hardening missing: ${needle}`));

[
  "add column if not exists installments integer",
  "add column if not exists transaction_id text",
  "add column if not exists authorization_code text",
  "add column if not exists nsu text",
  "add column if not exists acquirer text",
  "add column if not exists external_reference text",
  "add column if not exists payment_status text not null default 'pending'",
].forEach((needle) => assertIncludes(hardeningSql, needle, `Future payment field missing: ${needle}`));

[
  "sale_payments_status_created_idx",
  "sale_payments_transaction_idx",
  "cash_movements_created_idx",
  "cash_movements_payment_method_idx",
  "fiscal_documents_status_created_idx",
  "fiscal_documents_type_status_idx",
].forEach((needle) => assertIncludes(hardeningSql, needle, `Performance index missing: ${needle}`));

assertRegex(
  hardeningSql,
  /session_scope = 'company' and status = 'open'/,
  "Simple mode must enforce a single open cash session per company."
);
assertRegex(
  hardeningSql,
  /session_scope = 'operator' and usuario_id is not distinct from p_usuario_id/,
  "Operator mode must remain prepared for one open session per operator."
);
assertRegex(
  hardeningSql,
  /jsonb_build_object\('source', 'database_trigger'/,
  "Critical financial audit must be generated by database triggers."
);

if (!process.exitCode) {
  console.log("ERP cash/fiscal hardening migration looks consistent.");
}

if (!idempotencySql) {
  fail(`Idempotency migration not found: ${idempotencyMigrationPath}`);
  process.exit();
}

[
  "create table if not exists public.erp_financial_operations",
  "operation_uuid uuid not null",
  "client_request_id text",
  "request_hash text",
  "created_from_device text",
  "erp_financial_operations_uuid_unique_idx",
  "erp_financial_operations_client_request_unique_idx",
  "erp_financial_operations_request_hash_unique_idx",
  "add column if not exists operation_uuid uuid",
  "add column if not exists operation_id uuid references public.erp_financial_operations(id)",
  "public.s3d_financial_operation_lock_key",
  "drop function if exists public.register_cash_movement(uuid, uuid, text, numeric, uuid, text, text, text, jsonb)",
  "public.register_sale_financial_operation",
  "pg_advisory_xact_lock(public.s3d_financial_operation_lock_key(p_empresa_id, p_operation_uuid))",
  "public.register_cash_movement(",
  "payments_summary_json",
  "closing_snapshot_json",
].forEach((needle) => assertIncludes(idempotencySql, needle, `Idempotency/atomicity missing: ${needle}`));

[
  "expected_cash_total numeric(14,2) not null default 0",
  "counted_cash_total numeric(14,2)",
  "payment_status in ('pending', 'approved', 'failed', 'refunded', 'partial_refund')",
  "status in ('open', 'closing', 'closed', 'cancelled')",
].forEach((needle) => assertIncludes(idempotencySql, needle, `Canonical state/snapshot field missing: ${needle}`));

[
  "cash_movements_operation_unique_idx",
  "sale_payments_operation_method_unique_idx",
  "erp_records_client_request_unique_idx",
  "erp_records_operation_unique_idx",
].forEach((needle) => assertIncludes(idempotencySql, needle, `Duplicate protection index missing: ${needle}`));

assertRegex(
  idempotencySql,
  /returns jsonb language plpgsql security definer/,
  "Atomic sale operation must be a database function."
);
assertRegex(
  idempotencySql,
  /insert into public\.sale_payments[\s\S]+public\.register_cash_movement[\s\S]+update public\.cash_sessions[\s\S]+update public\.erp_financial_operations/,
  "Sale financial operation must register payments, movements, session totals and operation result together."
);
assertRegex(
  idempotencySql,
  /if v_existing\.id is not null and v_existing\.status = 'completed' then return v_existing\.result_json;/,
  "Completed idempotent operations must return the existing result."
);

if (!process.exitCode) {
  console.log("ERP financial idempotency migration looks consistent.");
}

if (!shadowSql) {
  fail(`Shadow/integrity migration not found: ${shadowMigrationPath}`);
  process.exit();
}

[
  "create table if not exists public.financial_integrity_checks",
  "public.record_financial_integrity_check",
  "public.run_financial_integrity_checks",
  "payment_without_movement",
  "movement_without_session",
  "orphan_open_session",
  "partial_operation",
  "cancelled_at timestamptz",
  "reversed_by uuid references auth.users(id)",
  "reversal_operation_id uuid references public.erp_financial_operations(id)",
  "financial_flow_version text",
  "operation_source text",
  "sync_version integer",
  "app_version text",
  "pwa_version text",
  "sync_source text",
  "offline_created_at timestamptz",
  "synced_at timestamptz",
  "device_platform text",
  "shadow_validation_json jsonb not null default '{}'::jsonb",
  "public.validate_financial_operation_tracking",
].forEach((needle) => assertIncludes(shadowSql, needle, `Shadow/integrity missing: ${needle}`));

[
  "financial_integrity_checks_empresa_status_idx",
  "cash_movements_reversal_idx",
  "sale_payments_reversal_idx",
  "erp_financial_operations_flow_idx",
  "erp_records_financial_flow_idx",
].forEach((needle) => assertIncludes(shadowSql, needle, `Shadow/integrity index missing: ${needle}`));

[
  "const FINANCIAL_FLOW_VERSION = \"shadow-v1\";",
  "function criarMetadadosOperacaoFinanceira",
  "operation_uuid",
  "client_request_id",
  "request_hash",
  "created_from_device",
  "registrarShadowFinanceiroLocal",
  "criarLancamentoRecebimentoPedido(pedido, valor, tipoRecebimento = \"entrada\", metadadosOperacao = null)",
].forEach((needle) => assertIncludes(appJs, needle, `Frontend shadow mode missing: ${needle}`));

assertRegex(
  appJs,
  /const metadadosOperacao = criarMetadadosOperacaoFinanceira\(pedidoEditando \? "pedido_update" : "pedido_create"/,
  "Orders must generate financial shadow metadata."
);
assertRegex(
  appJs,
  /criarMetadadosOperacaoFinanceira\("caixa_manual"/,
  "Manual cash movements must generate financial shadow metadata."
);

if (!process.exitCode) {
  console.log("ERP financial shadow/integrity layer looks consistent.");
}

if (!reconciliationSql) {
  fail(`Reconciliation/recovery migration not found: ${reconciliationMigrationPath}`);
  process.exit();
}

[
  "create table if not exists public.operation_reconciliation_queue",
  "public.enqueue_operation_reconciliation",
  "public.mark_abandoned_financial_operations",
  "public.run_operation_reconciliation",
  "operation_abandoned_timeout",
  "add column if not exists sync_attempts integer not null default 0",
  "add column if not exists last_sync_error text",
  "add column if not exists recovery_source text",
  "add column if not exists recovered_at timestamptz",
  "add column if not exists reconciliation_version text not null default 'reconciliation-v1'",
  "add column if not exists processing_node text",
  "add column if not exists abandoned_at timestamptz",
  "public.validate_reconciliation_tracking",
].forEach((needle) => assertIncludes(reconciliationSql, needle, `Reconciliation/recovery missing: ${needle}`));

[
  "operation_reconciliation_company_status_idx",
  "operation_reconciliation_operation_uuid_idx",
  "erp_financial_operations_recovery_idx",
  "erp_financial_operations_reconciliation_idx",
].forEach((needle) => assertIncludes(reconciliationSql, needle, `Reconciliation/recovery index missing: ${needle}`));

assertRegex(
  reconciliationSql,
  /status in \('pending', 'processing', 'completed', 'partially_completed', 'failed', 'reversed', 'abandoned', 'cancelled'\)/,
  "Financial operation states must support recovery/reconciliation lifecycle."
);
assertRegex(
  reconciliationSql,
  /status in \('queued', 'retrying', 'recovered', 'failed', 'ignored', 'abandoned'\)/,
  "Reconciliation queue states must support retry/recovery lifecycle."
);
assertRegex(
  reconciliationSql,
  /public\.mark_abandoned_financial_operations\(p_company_id\)[\s\S]+public\.run_financial_integrity_checks\(p_company_id\)/,
  "Operational reconciliation must combine abandoned-operation recovery and integrity checks."
);

[
  "const FINANCIAL_RECONCILIATION_VERSION = \"reconciliation-v1\";",
  "sync_attempts",
  "last_sync_error",
  "recovery_source",
  "recovered_at",
  "reconciliation_version",
  "processing_node",
].forEach((needle) => assertIncludes(appJs, needle, `Frontend reconciliation metadata missing: ${needle}`));

if (!process.exitCode) {
  console.log("ERP financial reconciliation/recovery layer looks consistent.");
}

if (!workerOrchestrationSql) {
  fail(`Worker orchestration migration not found: ${workerOrchestrationMigrationPath}`);
  process.exit();
}

[
  "add column if not exists processing_started_at timestamptz",
  "add column if not exists processing_timeout_at timestamptz",
  "add column if not exists last_worker_heartbeat timestamptz",
  "add column if not exists max_retry_limit integer not null default 5",
  "add column if not exists worker_version text",
  "add column if not exists worker_node text",
  "add column if not exists processing_priority integer not null default 0",
  "add column if not exists retry_strategy text not null default 'exponential'",
  "add column if not exists retry_backoff_level integer not null default 0",
  "create table if not exists public.dead_letter_operations",
  "create table if not exists public.financial_operation_events",
  "create table if not exists public.financial_operational_metrics",
  "public.calculate_reconciliation_next_retry",
  "public.record_financial_operation_event",
  "public.claim_operation_reconciliation_batch",
  "for update skip locked",
  "public.release_operation_reconciliation_item",
  "public.run_reconciliation_health_checks",
  "reconciliation_dead_lettered",
  "reconciliation_retry_scheduled",
].forEach((needle) => assertIncludes(workerOrchestrationSql, needle, `Worker orchestration missing: ${needle}`));

[
  "operation_reconciliation_worker_claim_idx",
  "operation_reconciliation_lock_health_idx",
  "dead_letter_operations_company_status_idx",
  "financial_operation_events_operation_idx",
  "financial_operational_metrics_type_idx",
].forEach((needle) => assertIncludes(workerOrchestrationSql, needle, `Worker orchestration index missing: ${needle}`));

assertRegex(
  workerOrchestrationSql,
  /retry_strategy in \('fixed', 'exponential', 'manual'\)/,
  "Retry strategies must be explicit and controlled."
);
assertRegex(
  workerOrchestrationSql,
  /when v_retry <= 0 then interval '1 minute'[\s\S]+when v_retry = 1 then interval '5 minutes'[\s\S]+when v_retry = 2 then interval '15 minutes'[\s\S]+when v_retry = 3 then interval '1 hour'[\s\S]+else interval '6 hours'/,
  "Exponential retry backoff must avoid aggressive retry loops."
);
assertRegex(
  workerOrchestrationSql,
  /insert into public\.dead_letter_operations[\s\S]+reconciliation retry limit reached/,
  "Failed reconciliation retries must be preserved in DLQ instead of deleted."
);

[
  "const FINANCIAL_WORKER_VERSION = \"client-shadow-v1\";",
  "worker_version",
  "worker_node",
  "retry_strategy",
  "retry_backoff_level",
  "processing_priority",
].forEach((needle) => assertIncludes(appJs, needle, `Frontend worker orchestration metadata missing: ${needle}`));

if (!process.exitCode) {
  console.log("ERP financial worker orchestration layer looks consistent.");
}

[
  "cashSimpleModeEnabled: true",
  "function abrirSessaoCaixaAutomatica",
  "function fecharSessaoCaixaBasica",
  "function renderStatusSessaoCaixaSimples",
  "function getMetodosPagamentoCaixa",
  "function getResumoMetodoMovimentoCaixa",
  "payment_method_id",
  "cash_session_id",
  "Forma da entrada",
  "Aparece no Caixa quando houver entrada.",
  "Sangria / retirada",
  "registrado no caixa",
].forEach((needle) => assertIncludes(appJs, needle, `Simple cash activation missing: ${needle}`));

if (!process.exitCode) {
  console.log("ERP simple cash activation layer looks consistent.");
}
