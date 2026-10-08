export type BillingProfile = {
  client_id?: string | null;
  company_id?: string | null;
  role?: string | null;
  status?: string | null;
} | null;

export type BillingCancellationScope = {
  userId: string;
  clientId: string;
  linkedCompanyId: string;
  isSuperadmin: boolean;
};

export class BillingAuthorizationError extends Error {
  code: string;
  status: number;

  constructor(code: string, status: number) {
    super(code);
    this.name = "BillingAuthorizationError";
    this.code = code;
    this.status = status;
  }
}

const clean = (value: unknown) => String(value ?? "").trim();
const normalized = (value: unknown) => clean(value).toLowerCase();
const isActive = (profile: BillingProfile) => !!profile && !["blocked", "inactive"].includes(normalized(profile.status));

function unique(values: unknown[]) {
  return [...new Set(values.map(clean).filter(Boolean))];
}

export function resolveBillingCancellationScope(input: {
  authenticatedUserId?: string | null;
  requestedClientId?: string | null;
  profile?: BillingProfile;
  erpProfile?: BillingProfile;
}): BillingCancellationScope {
  const userId = clean(input.authenticatedUserId);
  if (!userId) throw new BillingAuthorizationError("UNAUTHENTICATED", 401);

  const activeProfiles = [input.profile || null, input.erpProfile || null].filter(isActive);
  const isSuperadmin = activeProfiles.some((item) => normalized(item?.role) === "superadmin");
  const linkedClientIds = unique(activeProfiles.map((item) => item?.client_id));
  const linkedCompanyIds = unique(activeProfiles.map((item) => item?.company_id));
  if (linkedClientIds.length > 1 || linkedCompanyIds.length > 1) {
    throw new BillingAuthorizationError("BILLING_SCOPE_CONFLICT", 403);
  }

  const linkedClientId = linkedClientIds[0] || "";
  const requestedClientId = clean(input.requestedClientId);
  if (!isSuperadmin && linkedClientId && requestedClientId && requestedClientId !== linkedClientId) {
    throw new BillingAuthorizationError("CLIENT_SCOPE_FORBIDDEN", 403);
  }

  // For legacy records without client_id on the profile, the requested id is
  // only a selector. authorizeBillingCancellation still requires an active,
  // privileged company membership before any subscription can be changed.
  const clientId = isSuperadmin && requestedClientId
    ? requestedClientId
    : (linkedClientId || requestedClientId);
  if (!clientId) throw new BillingAuthorizationError("CLIENT_NOT_LINKED", 403);

  return {
    userId,
    clientId,
    linkedCompanyId: linkedCompanyIds[0] || "",
    isSuperadmin,
  };
}

export function authorizeBillingCancellation(input: {
  scope: BillingCancellationScope;
  requestedSubscriptionId?: string | null;
  client?: { id?: string | null; company_id?: string | null } | null;
  company?: { id?: string | null; owner_user_id?: string | null; status?: string | null } | null;
  membership?: { company_id?: string | null; role?: string | null; status?: string | null } | null;
  subscription?: {
    id?: string | null;
    client_id?: string | null;
    company_id?: string | null;
    mercado_pago_subscription_id?: string | null;
  } | null;
}) {
  const { scope } = input;
  const clientId = clean(input.client?.id);
  const companyId = clean(input.client?.company_id);
  if (!clientId || clientId !== scope.clientId || !companyId) {
    throw new BillingAuthorizationError("CLIENT_SCOPE_FORBIDDEN", 403);
  }
  if (scope.linkedCompanyId && scope.linkedCompanyId !== companyId) {
    throw new BillingAuthorizationError("COMPANY_SCOPE_FORBIDDEN", 403);
  }
  if (clean(input.company?.id) !== companyId || normalized(input.company?.status) === "inactive") {
    throw new BillingAuthorizationError("COMPANY_NOT_ACTIVE", 403);
  }

  if (!scope.isSuperadmin) {
    const ownsCompany = clean(input.company?.owner_user_id) === scope.userId;
    const activeMembership = clean(input.membership?.company_id) === companyId
      && normalized(input.membership?.status) === "active"
      && ["owner", "admin"].includes(normalized(input.membership?.role));
    if (!ownsCompany && !activeMembership) {
      throw new BillingAuthorizationError("BILLING_MANAGEMENT_FORBIDDEN", 403);
    }
  }

  const subscription = input.subscription;
  if (!subscription?.id || clean(subscription.client_id) !== clientId) {
    throw new BillingAuthorizationError("SUBSCRIPTION_NOT_FOUND", 404);
  }
  if (subscription.company_id && clean(subscription.company_id) !== companyId) {
    throw new BillingAuthorizationError("SUBSCRIPTION_SCOPE_FORBIDDEN", 403);
  }

  const storedSubscriptionId = clean(subscription.mercado_pago_subscription_id);
  if (!storedSubscriptionId) {
    throw new BillingAuthorizationError("MERCADOPAGO_SUBSCRIPTION_NOT_LINKED", 409);
  }
  const requestedSubscriptionId = clean(input.requestedSubscriptionId);
  if (requestedSubscriptionId && requestedSubscriptionId !== storedSubscriptionId) {
    throw new BillingAuthorizationError("SUBSCRIPTION_SCOPE_FORBIDDEN", 403);
  }

  return Object.freeze({
    userId: scope.userId,
    clientId,
    companyId,
    subscriptionRowId: clean(subscription.id),
    mercadoPagoSubscriptionId: storedSubscriptionId,
    isSuperadmin: scope.isSuperadmin,
  });
}
