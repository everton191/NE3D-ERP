const assert = require("node:assert/strict");
const fs = require("node:fs");

const migration = fs.readFileSync(
  "supabase/migrations/20260723123000_employee_entitlement_authority.sql",
  "utf8"
);

[
  "create or replace function public.erp_authorize_company_feature",
  "auth.uid()",
  "public.erp_is_superadmin()",
  "public.company_members",
  "public.subscriptions",
  "public.can_access_app_feature",
  "'employees_management'",
  "company_members_insert_entitled_admin",
  "company_members_update_entitled_admin",
  "company_members_delete_entitled_admin",
  "revoke all on function public.erp_authorize_company_feature",
  "to authenticated, service_role"
].forEach((marker) => assert.ok(migration.includes(marker), `Autoridade ausente: ${marker}`));

assert.doesNotMatch(
  migration,
  /p_plan|p_role|p_plan_active|p_subscription_status/i,
  "A função não pode aceitar plano, papel ou status comercial enviados pelo cliente."
);
assert.doesNotMatch(
  migration,
  /using\s*\(\s*true\s*\)|with check\s*\(\s*true\s*\)/i,
  "Políticas de membros não podem ser abertas."
);

console.log("Funcionários: entitlement, papel e assinatura derivados no backend.");
