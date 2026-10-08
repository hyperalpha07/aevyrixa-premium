import "server-only";

import { hasPermission, type AdminSessionUser } from "@/app/lib/admin-permissions";
import {
  analyticsSourceRowLimit,
  listAnalyticsOrders,
  listAnalyticsReviews,
  listReportCustomerProfiles,
  type AnalyticsSourceState,
} from "@/lib/admin-v2/analytics/analytics-source";
import {
  buildAdminV2Report,
  reportSearchParams,
  type AdminV2ReportResult,
  type AdminV2ReportType,
} from "@/lib/admin-v2/reports/reports-metrics";

export const reportExportRowLimit = analyticsSourceRowLimit;

const orderReportTypes = new Set<AdminV2ReportType>(["sales", "orders", "products", "customers", "fees"]);

export function canAccessAdminV2ReportType(session: AdminSessionUser, type: AdminV2ReportType) {
  return hasPermission(session, "analytics.view") && (type !== "customers" || hasPermission(session, "customers.view"));
}

function emptySource(reason: string): AnalyticsSourceState {
  return { available: false, complete: false, totalCount: null, loadedCount: 0, reason };
}

function mixedCurrencyLimitation(orders: Array<{ currencyCode?: string }>) {
  const explicitCodes = Array.from(new Set(orders.map((order) => order.currencyCode).filter(Boolean)));
  return explicitCodes.length > 1
    ? `Mixed explicit currencies detected (${explicitCodes.join(", ")}). Report export is disabled because this app has no FX conversion source.`
    : null;
}

export async function getAdminV2Report(
  searchParams = new URLSearchParams(),
  options: { previewLimit?: number; session?: AdminSessionUser } = {}
): Promise<AdminV2ReportResult> {
  const { type, range } = reportSearchParams(searchParams);
  const canViewCustomerReport = options.session ? canAccessAdminV2ReportType(options.session, type) : type !== "customers";

  if (!canViewCustomerReport) {
    const unavailable = emptySource("Customer report requires customers.view.");
    return buildAdminV2Report({
      type,
      range,
      orders: [],
      customers: [],
      reviews: [],
      previewLimit: options.previewLimit,
      complete: false,
      limitation: "Customer Report requires the customers.view permission.",
      sources: { orders: unavailable, customers: unavailable, reviews: unavailable },
    });
  }

  try {
    const needsOrders = orderReportTypes.has(type);
    const needsReviews = type === "reviews";
    const orderResult = needsOrders ? await listAnalyticsOrders(range.fromIso, range.toIso) : null;
    const linkedIds = type === "customers" && orderResult?.available
      ? orderResult.rows.map((order) => order.customerId).filter((id): id is string => Boolean(id))
      : [];
    const [customerResult, reviewResult] = await Promise.all([
      type === "customers" ? listReportCustomerProfiles(range.fromIso, range.toIso, linkedIds) : Promise.resolve(null),
      needsReviews ? listAnalyticsReviews(range.fromIso, range.toIso) : Promise.resolve(null),
    ]);

    const orders = orderResult?.available ? orderResult.rows : [];
    const customers = customerResult?.available ? customerResult.rows : [];
    const reviews = reviewResult?.available ? reviewResult.rows : [];
    const requiredSources = [
      needsOrders ? orderResult : null,
      type === "customers" ? customerResult : null,
      needsReviews ? reviewResult : null,
    ].filter(Boolean) as AnalyticsSourceState[];
    const limitations = requiredSources.flatMap((source) => [
      !source.available ? source.reason ?? "Required report source is unavailable." : null,
      source.available && !source.complete ? source.reason ?? "Required report source is incomplete." : null,
    ]).filter(Boolean) as string[];
    if (orderResult?.available) {
      const currencyIssue = mixedCurrencyLimitation(orderResult.rows);
      if (currencyIssue) limitations.push(currencyIssue);
    }
    const complete = requiredSources.every((source) => source.available && source.complete) && !limitations.some((item) => item.includes("Mixed explicit currencies"));

    return buildAdminV2Report({
      type,
      range,
      orders,
      customers,
      reviews,
      previewLimit: options.previewLimit,
      complete,
      limitation: limitations.length ? limitations.join(" ") : null,
      sources: {
        orders: orderResult ?? { available: true, complete: true, totalCount: 0, loadedCount: 0 },
        customers: customerResult ?? { available: true, complete: true, totalCount: 0, loadedCount: 0 },
        reviews: reviewResult ?? { available: true, complete: true, totalCount: 0, loadedCount: 0 },
      },
    });
  } catch {
    const unavailable = emptySource("Report data source is unavailable.");
    return buildAdminV2Report({
      type,
      range,
      orders: [],
      customers: [],
      reviews: [],
      previewLimit: options.previewLimit,
      complete: false,
      limitation: "Report data could not be loaded from the existing operational backend.",
      sources: { orders: unavailable, customers: unavailable, reviews: unavailable },
    });
  }
}
