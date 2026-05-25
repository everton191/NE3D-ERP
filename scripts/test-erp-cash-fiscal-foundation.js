const fs = require("fs");
const path = require("path");

const rootDir = path.resolve(__dirname, "..");
const migrationPath = path.join(
  rootDir,
  "supabase",
  "migrations",
  "20260525120000_erp_cash_fiscal_foundation.sql"
);

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
