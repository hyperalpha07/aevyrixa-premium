/**
 * Business reporting provenance is server-enforced, not inferred from order
 * status, payment state, customer identifiers, or an untrusted checkout body.
 *
 * Only trusted authenticated admin read routes can request test scope.
 * Invalid/missing values always fall back to the live business scope.
 */
export const adminV2FinancialDataScopes = ["live", "test"] as const;
export type AdminV2FinancialDataScope = (typeof adminV2FinancialDataScopes)[number];

export function parseAdminV2FinancialDataScope(value: string | null | undefined): AdminV2FinancialDataScope {
  return value === "test" ? "test" : "live";
}

/** PostgREST FK-embedded INNER JOIN filters *before* paging and metrics. */
export function scopedOrderLinkedSelect(select: string, scope: AdminV2FinancialDataScope) {
  return [
    `select=${select},orders!inner(record_scope)`,
    `orders.record_scope=eq.${scope}`,
  ];
}
