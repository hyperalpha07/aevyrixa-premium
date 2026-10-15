import "server-only";
import { parseAdminV2FinancialDataScope } from "@/lib/admin-v2/finance/financial-data-scope";

import {
  listAnalyticsCustomerAccounts,
  listAnalyticsOrders,
  listAnalyticsReviews,
  type AnalyticsSourceState,
} from "@/lib/admin-v2/analytics/analytics-source";
import {
  buildAdminV2AnalyticsResult,
  resolveAnalyticsDateRange,
  type AdminV2AnalyticsResult,
} from "@/lib/admin-v2/analytics/analytics-metrics";

function sourceState(available = false, complete = false, reason?: string): AnalyticsSourceState {
  return { available, complete, totalCount: null, loadedCount: 0, reason };
}

function mixedCurrencyLimitation(orders: Array<{ currencyCode?: string }>) {
  const explicitCodes = Array.from(new Set(orders.map((order) => order.currencyCode).filter(Boolean)));
  return explicitCodes.length > 1
    ? `Mixed explicit currencies detected (${explicitCodes.join(", ")}). Analytics are marked incomplete because this app has no FX conversion source.`
    : null;
}

function fallbackResult(params: URLSearchParams, message: string): AdminV2AnalyticsResult {
  const range = resolveAnalyticsDateRange(params);
  const unavailable = sourceState(false, false, message);
  return buildAdminV2AnalyticsResult({
    range,
    dataScope: parseAdminV2FinancialDataScope(params.get("scope")),
    orders: [],
    customers: [],
    reviews: [],
    limitation: message,
    sources: { orders: unavailable, customers: unavailable, reviews: unavailable },
    sourceNotes: [
      "Operational analytics are derived from current store records only.",
      "Traffic, conversion, visitor, attribution, ROAS and CAC metrics are intentionally omitted because this app does not persist them.",
      "Date boundaries use UTC.",
    ],
  });
}

export async function getAdminV2Analytics(searchParams = new URLSearchParams()): Promise<AdminV2AnalyticsResult> {
  const range = resolveAnalyticsDateRange(searchParams);
  const scope = parseAdminV2FinancialDataScope(searchParams.get("scope"));

  try {
    const [orderResult, customerResult, reviewResult] = await Promise.all([
      listAnalyticsOrders(range.fromIso, range.toIso, scope),
      listAnalyticsCustomerAccounts(range.fromIso, range.toIso),
      listAnalyticsReviews(range.fromIso, range.toIso),
    ]);

    const orders = orderResult.available ? orderResult.rows : [];
    const customers = customerResult.available ? customerResult.rows : [];
    const reviews = reviewResult.available ? reviewResult.rows : [];
    const limitations = [
      !orderResult.available ? "Order analytics source is unavailable." : null,
      !customerResult.available ? "Customer account source is unavailable." : null,
      !reviewResult.available ? "Review analytics source is unavailable." : null,
      orderResult.available && !orderResult.complete ? orderResult.reason ?? "Order analytics source is incomplete." : null,
      customerResult.available && !customerResult.complete ? customerResult.reason ?? "Customer account source is incomplete." : null,
      reviewResult.available && !reviewResult.complete ? reviewResult.reason ?? "Review analytics source is incomplete." : null,
      orderResult.available ? mixedCurrencyLimitation(orderResult.rows) : null,
    ].filter(Boolean) as string[];

    return buildAdminV2AnalyticsResult({
      range,
      dataScope: scope,
      orders,
      customers,
      reviews,
      limitation: limitations.length ? limitations.join(" ") : null,
      sources: { orders: orderResult, customers: customerResult, reviews: reviewResult },
      sourceNotes: [
        "Payable sales represents non-cancelled order value and is not necessarily settled cash revenue.",
        "Top products are based on order item snapshots.",
        "Linked account insights include only orders connected to customer accounts.",
        "Traffic, conversion, visitor, attribution, ROAS and CAC metrics are intentionally omitted because this app does not persist them.",
        "Date boundaries use UTC.",
      ],
    });
  } catch {
    return fallbackResult(searchParams, "Analytics data could not be loaded from the existing operational backend.");
  }
}
