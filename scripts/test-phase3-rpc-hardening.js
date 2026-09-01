const assert = require("assert");
const fs = require("fs");
const path = require("path");

const migration = fs.readFileSync(path.join(__dirname, "..", "supabase", "migrations", "20260831214157_phase3_rpc_permissions_and_search_path.sql"), "utf8");
const internal = [
  "audit_cash_movement_insert", "audit_cash_session_changes", "audit_sale_payment_changes",
  "claim_operation_reconciliation_batch", "enqueue_operation_reconciliation", "erp_current_client_id",
  "mark_abandoned_financial_operations", "record_financial_integrity_check", "record_financial_operation_event",
  "register_erp_audit_event", "release_operation_reconciliation_item", "run_financial_integrity_checks",
  "run_operation_reconciliation", "run_reconciliation_health_checks", "s3d_current_paid_price",
  "validate_cash_movement_integrity", "validate_financial_operation_tracking", "validate_reconciliation_tracking",
  "validate_sale_payment_integrity"
];

internal.forEach((name) => {
  assert(migration.includes(`revoke execute on function public.${name}`), `${name} deve perder EXECUTE anon/public`);
  assert(migration.includes(`grant execute on function public.${name}`), `${name} deve preservar EXECUTE autenticado`);
});
["get_storefront_product_ranking(uuid)", "storefront_publication_allowed(uuid)"].forEach((signature) => {
  assert(migration.includes(`alter function public.${signature} set search_path = pg_catalog;`), `${signature} precisa de search_path seguro`);
  assert(!migration.includes(`revoke execute on function public.${signature}`), `${signature} permanece público por dependência da vitrine`);
});
assert(!migration.includes("coalesce(sub.active_plan, sub.plan_slug"), "gate de publicação não pode usar coluna subscriptions.plan_slug inexistente");
assert(migration.includes("coalesce(sub.active_plan, plans.slug, 'free')"), "gate deve usar a coluna de plano existente");
[
  "set_updated_at()", "set_storefront_updated_at()", "storefront_owner_matches_store()",
  "storefront_image_owner_matches_product()", "s3d_cash_session_lock_key(uuid, text)",
  "s3d_financial_operation_lock_key(uuid, uuid)"
].forEach((signature) => assert(migration.includes(`alter function public.${signature} set search_path = pg_catalog;`), `${signature} sem correção de search_path`));

console.log("Fase 3 RPC hardening: 19 RPCs internas restritas e 8 search_paths fixados.");
