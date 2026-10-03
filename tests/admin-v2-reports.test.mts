import assert from "node:assert/strict";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { registerHooks } from "node:module";
import { fileURLToPath, pathToFileURL } from "node:url";
import test from "node:test";
import type { OrderRecord } from "../app/lib/order-types.ts";
import type { ProductReview } from "../app/lib/review-types.ts";
import { adminV2AccessRules } from "../configs/admin-v2/permissions.ts";
import { findAdminV2Route } from "../configs/admin-v2/routes.ts";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const hooks = registerHooks({
  resolve(specifier, context, nextResolve) {
    if (specifier === "server-only") return { shortCircuit: true, url: "data:text/javascript,export default {}" };
    if (specifier.startsWith("@/")) {
      const target = path.join(repoRoot, specifier.slice(2));
      return nextResolve(pathToFileURL(existsSync(target) ? target : `${target}.ts`).href, context);
    }
    if ((specifier.startsWith("./") || specifier.startsWith("../")) && context.parentURL) {
      const target = path.resolve(path.dirname(fileURLToPath(context.parentURL)), specifier);
      if (!path.extname(target) && existsSync(`${target}.ts`)) return nextResolve(pathToFileURL(`${target}.ts`).href, context);
    }
    return nextResolve(specifier, context);
  },
});
const reports = await import("../lib/admin-v2/reports/reports-metrics.ts");
const exports = await import("../lib/admin-v2/reports/reports-export.ts");
const analytics = await import("../lib/admin-v2/analytics/analytics-metrics.ts");
hooks.deregister();

const reportsPage = readFileSync(new URL("../app/admin-v2/reports/page.tsx", import.meta.url), "utf8");
const reportsQuery = readFileSync(new URL("../lib/admin-v2/reports/reports-query.ts", import.meta.url), "utf8");
const reportsExport = readFileSync(new URL("../lib/admin-v2/reports/reports-export.ts", import.meta.url), "utf8");
const reportsView = readFileSync(new URL("../components/admin-v2/views/reports/AdminV2ReportsView.tsx", import.meta.url), "utf8");
const exportRoute = readFileSync(new URL("../app/api/admin/reports/export/route.ts", import.meta.url), "utf8");

function order(overrides: Partial<OrderRecord>): OrderRecord {
  return {
    orderId: overrides.orderId ?? "order-1",
    orderReference: overrides.orderReference ?? "AEV-1",
    customerId: overrides.customerId,
    customer: { fullName: "Customer", phone: "01700000000", cityArea: "Dhaka", address: "Dhaka" },
    paymentDetails: { paymentMethod: "Cash on Delivery" },
    items: overrides.items ?? [],
    totals: overrides.totals ?? { totalItems: 1, subtotal: overrides.totalAmount ?? 0 },
    totalAmount: overrides.totalAmount ?? 0,
    discountAmount: overrides.discountAmount,
    deliveryCharge: overrides.deliveryCharge,
    status: overrides.status ?? "Pending",
    createdAt: overrides.createdAt ?? "2026-09-10T08:00:00.000Z",
    updatedAt: overrides.updatedAt,
    isTestOrder: overrides.isTestOrder,
    archivedAt: overrides.archivedAt,
    deletedAt: overrides.deletedAt,
    softDeletedAt: overrides.softDeletedAt,
  };
}

function review(overrides: Partial<ProductReview>): ProductReview {
  return {
    id: overrides.id ?? "review-1",
    productId: overrides.productId ?? "prod-a",
    productSlug: overrides.productSlug ?? "period-a",
    customerName: "Customer",
    rating: overrides.rating ?? 5,
    body: "Good",
    mediaUrls: [],
    status: overrides.status ?? "approved",
    sourceType: "order-linked",
    verifiedPurchase: true,
    isApproved: overrides.status !== "pending",
    isFeatured: false,
    createdAt: overrides.createdAt ?? "2026-09-11T08:00:00.000Z",
    updatedAt: overrides.updatedAt ?? "2026-09-11T08:00:00.000Z",
  };
}

function sampleReport(type: reports.AdminV2ReportType = "sales") {
  const range = analytics.resolveAnalyticsDateRange(new URLSearchParams("range=custom&from=2026-09-01&to=2026-09-30"));
  return reports.buildAdminV2Report({
    type,
    range,
    orders: [
      order({
        orderId: "valid",
        orderReference: "AEV-VALID",
        customerId: "cust-a",
        totals: { totalItems: 2, subtotal: 200 },
        discountAmount: 20,
        deliveryCharge: 30,
        totalAmount: 999,
        items: [{ id: "line-a", productId: "prod-a", slug: "period-a", name: "Period A", price: 90, quantity: 2, lineTotal: 180 }],
      }),
      order({ orderId: "cancelled", orderReference: "AEV-CAN", status: "Cancelled", totalAmount: 500 }),
      order({ orderId: "test", orderReference: "AEV-TEST", isTestOrder: true, totalAmount: 500 }),
    ],
    customers: [{ id: "cust-a", displayName: "Customer A", createdAt: "2026-09-02T08:00:00.000Z" }],
    reviews: [
      review({ id: "approved", status: "approved", rating: 5 }),
      review({ id: "pending", status: "pending", rating: 3 }),
    ],
    complete: true,
  });
}

test("Reports route is implemented, analytics remains implemented, approvals remain coming soon, and access stays analytics.view", () => {
  assert.equal(findAdminV2Route("reports")?.implemented, true);
  assert.equal(findAdminV2Route("analytics")?.implemented, true);
  assert.equal(findAdminV2Route("approvals")?.implemented, false);
  assert.equal(adminV2AccessRules.reports.section, "analytics");
  assert.match(reportsPage, /requireAdminV2RouteAccess\(session,\s*"reports"\)/);
  assert.doesNotMatch(reportsPage, /AdminV2ModulePage/);
});

test("Sales report reuses canonical payable-sales semantics and excludes cancelled/test orders", () => {
  const report = sampleReport("sales");
  assert.equal(report.analytics.kpis.orders, 1);
  assert.equal(report.analytics.kpis.payableSales, 210);
  assert.equal(report.analytics.kpis.averageOrderValue, 210);
  assert.match(reportsQuery + reportsView, /Payable Sales/);
  assert.match(readFileSync(new URL("../lib/admin-v2/reports/reports-metrics.ts", import.meta.url), "utf8"), /payableOrderValue|isQualifyingAnalyticsOrder/);
});

test("Product, customer, review, and fee reports derive from real operational rows", () => {
  assert.equal(sampleReport("products").rows[0]?.product, "Period A");
  assert.equal(sampleReport("products").rows[0]?.quantity, 2);
  assert.equal(sampleReport("products").kpis.some((metric) => metric.label === "Order occurrences"), true);
  assert.equal(sampleReport("products").kpis.some((metric) => metric.label === "Linked orders"), false);
  assert.match(sampleReport("products").notes.join(" "), /order item snapshots/i);

  const customer = sampleReport("customers");
  assert.match(customer.notes.join(" "), /linked customer accounts only/i);
  assert.equal(customer.rows[0]?.customerId, "cust-a");
  assert.equal(customer.rows[0]?.orderValue, 210);
  const missingNameReport = reports.buildAdminV2Report({
    type: "customers",
    range: analytics.resolveAnalyticsDateRange(new URLSearchParams("range=custom&from=2026-09-01&to=2026-09-30")),
    orders: [order({ orderId: "missing-name", orderReference: "AEV-MISSING", customerId: "uuid-only", totalAmount: 25 })],
    customers: [{ id: "uuid-only", displayName: "", createdAt: "2026-09-02T08:00:00.000Z" }],
    reviews: [],
    complete: true,
  });
  assert.equal(missingNameReport.rows[0]?.customerId, "uuid-only");
  assert.equal(missingNameReport.rows[0]?.customer, "Not provided");

  const reviewReport = sampleReport("reviews");
  assert.equal(reviewReport.analytics.reviewSummary.total, 2);
  assert.equal(reviewReport.analytics.reviewSummary.approved, 1);
  assert.equal(reviewReport.analytics.reviewSummary.pending, 1);

  const fees = sampleReport("fees");
  assert.equal(fees.analytics.valueBreakdown.discounts, 20);
  assert.equal(fees.analytics.valueBreakdown.deliveryFees, 30);
});

test("Reports date range semantics reuse Analytics validation", () => {
  const { range } = reports.reportSearchParams(new URLSearchParams("type=orders&range=custom&from=2025-01-01&to=2026-10-03"));
  assert.equal(range.preset, "custom");
  assert.equal(range.warnings.length, 1);
  assert.equal(range.fromIso.endsWith("T00:00:00.000Z"), true);
  assert.equal(range.toIso.endsWith("T23:59:59.999Z"), true);
});

test("CSV export is server-side, range-scoped, sanitized and escaped", () => {
  const report = sampleReport("orders");
  report.rows.push({ orderReference: 'AEV-"QUOTE"', createdAt: "2026-09-12", status: "Pending", items: 1, payableTotal: 25 });
  const csv = exports.adminV2ReportToCsv(report);
  assert.match(exportRoute, /getFreshAdminRequestSession/);
  assert.match(exportRoute, /analytics\.view/);
  assert.match(exportRoute, /getAdminV2Report\(url\.searchParams,\s*\{\s*previewLimit:\s*Number\.MAX_SAFE_INTEGER/);
  assert.match(csv, /"AEV-""QUOTE"""/);
  assert.match(csv, /"Date Range","Custom: 2026-09-01 to 2026-09-30"/);
  assert.match(csv, /"AEV-VALID"/);
  assert.doesNotMatch(csv, /01700000000|Dhaka|customer_email|delivery_address|password|token/i);
  assert.match(exports.adminV2ReportCsvFilename(report), /^noromi-orders-report-2026-09-01-to-2026-09-30\.csv$/);
});

test("Unsupported fake report capabilities and database migrations are not introduced", () => {
  assert.doesNotMatch(reportsView + reportsQuery + reportsExport, /savedReports|scheduledReports|reportHistory|emailReport|xlsxExport|pdfExport|conversionRate|visitorCount|sessionCount|forecastGrowth/i);
  assert.match(reportsView, /No traffic, conversion, visitor, ROAS, CAC, forecast, XLSX, PDF, saved report or scheduled report capability is shown/);
  assert.doesNotMatch(reportsQuery, /Math\.random|faker|mock|analytics_events|report_history|scheduled_reports/i);
  const migrationNames = readdirSync(new URL("../supabase/migrations", import.meta.url)).join("\n");
  assert.doesNotMatch(migrationNames, /report/i);
  for (const module of ["staff", "roles", "permissions", "auditLogs", "analytics"] as const) {
    assert.equal(findAdminV2Route(module)?.implemented, true);
  }
});
