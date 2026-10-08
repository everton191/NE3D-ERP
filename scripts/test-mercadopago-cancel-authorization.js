const assert = require("node:assert/strict");
const path = require("node:path");
const { pathToFileURL } = require("node:url");

async function main() {
  const moduleUrl = pathToFileURL(path.resolve("supabase/functions/_shared/mercadopago-cancel-authorization.ts")).href;
  const { authorizeBillingCancellation, resolveBillingCancellationScope } = await import(moduleUrl);

  const companyA = { id: "company-a", owner_user_id: "user-a", status: "active" };
  const companyB = { id: "company-b", owner_user_id: "user-b", status: "active" };
  const clientA = { id: "client-a", company_id: "company-a" };
  const clientB = { id: "client-b", company_id: "company-b" };
  const subscriptionA = { id: "subscription-a", client_id: "client-a", company_id: "company-a", mercado_pago_subscription_id: "mp-a" };
  const subscriptionB = { id: "subscription-b", client_id: "client-b", company_id: "company-b", mercado_pago_subscription_id: "mp-b" };

  const scopeA = resolveBillingCancellationScope({
    authenticatedUserId: "user-a",
    requestedClientId: "client-a",
    profile: { client_id: "client-a", company_id: "company-a", role: "admin", status: "active" },
  });
  const authorized = authorizeBillingCancellation({
    scope: scopeA,
    requestedSubscriptionId: "mp-a",
    client: clientA,
    company: companyA,
    membership: { company_id: "company-a", role: "admin", status: "active" },
    subscription: subscriptionA,
  });
  assert.equal(authorized.clientId, "client-a");
  assert.equal(authorized.mercadoPagoSubscriptionId, "mp-a");

  assert.throws(() => resolveBillingCancellationScope({
    authenticatedUserId: "user-a",
    requestedClientId: "client-b",
    profile: { client_id: "client-a", company_id: "company-a", role: "admin", status: "active" },
  }), /CLIENT_SCOPE_FORBIDDEN/, "empresa A não pode selecionar cliente da empresa B");

  assert.throws(() => authorizeBillingCancellation({
    scope: scopeA,
    client: clientB,
    company: companyB,
    membership: { company_id: "company-b", role: "admin", status: "active" },
    subscription: subscriptionB,
  }), /CLIENT_SCOPE_FORBIDDEN/, "empresa A não pode cancelar assinatura da empresa B");

  const unlinkedScope = resolveBillingCancellationScope({
    authenticatedUserId: "user-without-company",
    requestedClientId: "client-b",
  });
  assert.throws(() => authorizeBillingCancellation({
    scope: unlinkedScope,
    client: clientB,
    company: companyB,
    membership: null,
    subscription: subscriptionB,
  }), /BILLING_MANAGEMENT_FORBIDDEN/, "usuário sem empresa não pode usar clientId como autorização");

  const viewerScope = resolveBillingCancellationScope({
    authenticatedUserId: "viewer-a",
    requestedClientId: "client-a",
    profile: { client_id: "client-a", company_id: "company-a", role: "visualizador", status: "active" },
  });
  assert.throws(() => authorizeBillingCancellation({
    scope: viewerScope,
    client: clientA,
    company: companyA,
    membership: { company_id: "company-a", role: "read_only", status: "active" },
    subscription: subscriptionA,
  }), /BILLING_MANAGEMENT_FORBIDDEN/, "usuário sem papel de gestão não pode cancelar assinatura");

  assert.throws(() => resolveBillingCancellationScope({ requestedClientId: "client-a" }), /UNAUTHENTICATED/, "sessão inválida deve ser rejeitada");

  assert.throws(() => authorizeBillingCancellation({
    scope: scopeA,
    requestedSubscriptionId: "mp-b",
    client: clientA,
    company: companyA,
    membership: { company_id: "company-a", role: "admin", status: "active" },
    subscription: subscriptionA,
  }), /SUBSCRIPTION_SCOPE_FORBIDDEN/, "subscriptionId do cliente não pode substituir o id persistido");

  console.log("Mercado Pago cancel authorization: isolamento entre empresas e papéis validado.");
}

main().catch((error) => {
  console.error(error.stack || error.message);
  process.exitCode = 1;
});
