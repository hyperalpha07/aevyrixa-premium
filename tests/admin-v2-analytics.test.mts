import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { fileURLToPath, pathToFileURL } from "node:url";
import path from "node:path";
import { registerHooks } from "node:module";
import { test } from "node:test";
import type { OrderRecord } from "../app/lib/order-types.ts";
import type { ProductReview } from "../app/lib/review-types.ts";
import { findAdminV2Route } from "../configs/admin-v2/routes.ts";
import { adminV2AccessRules } from "../configs/admin-v2/permissions.ts";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const aliasHooks = registerHooks({
  resolve(specifier, context, nextResolve) {
    if (specifier.startsWith("@/")) {
      const target = path.join(repoRoot, specifier.slice(2));
      return nextResolve(pathToFileURL(existsSync(target) ? target : `${target}.ts`).href, context);
    }
    if ((specifier.startsWith("./") || specifier.startsWith("../")) && context.parentURL) {
      const target = path.resolve(path.dirname(fileURLToPath(context.parentURL)), specifier);
      if (!path.extname(target) && existsSync(`${target}.ts`)) {
        return nextResolve(pathToFileURL(`${target}.ts`).href, context);
      }
    }
    return nextResolve(specifier, context);
  },
});
const {
  buildAdminV2AnalyticsResult,
  isQualifyingAnalyticsOrder,
  payableOrderValue,
  resolveAnalyticsDateRange,
} = await import("../lib/admin-v2/analytics/analytics-metrics.ts");
aliasHooks.deregister();

const analyticsPageSource = readFileSync(new URL("../app/admin-v2/analytics/page.tsx", import.meta.url), "utf8");
const analyticsQuerySource = readFileSync(new URL("../lib/admin-v2/analytics/analytics-query.ts", import.meta.url), "utf8");
const analyticsSource = readFileSync(new URL("../lib/admin-v2/analytics/analytics-source.ts", import.meta.url), "utf8");
const analyticsMetricsSource = readFileSync(new URL("../lib/admin-v2/analytics/analytics-metrics.ts", import.meta.url), "utf8");
const analyticsViewSource = readFileSync(new URL("../components/admin-v2/views/analytics/AdminV2AnalyticsView.tsx", import.meta.url), "utf8");

function order(overrides: Partial<OrderRecord>): OrderRecord {
  return {
    orderId: overrides.orderId ?? "order-1",
    orderReference: overrides.orderReference ?? "AEV-1",
    customerId: overrides.customerId,
    customer: {
      fullName: "Customer",
      phone: "01700000000",
      cityArea: "Dhaka",
      address: "Dhaka",
    },
    paymentDetails: { paymentMethod: "Cash on Delivery" },
    items: overrides.items ?? [],
    totals: overrides.totals ?? { totalItems: 1, subtotal: overrides.totalAmount ?? 0 },
    totalAmount: overrides.totalAmount ?? 0,
    discountAmount: overrides.discountAmount,
    deliveryCharge: overrides.deliveryCharge,
    status: overrides.status ?? "Pending",
    createdAt: overrides.createdAt ?? "2026-10-01T08:00:00.000Z",
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
    productId: overrides.productId ?? "prod-1",
    productSlug: overrides.productSlug ?? "period-panty",
    customerName: "Customer",
    rating: overrides.rating ?? 5,
    body: "Comfortable.",
    mediaUrls: [],
    status: overrides.status ?? "pending",
    sourceType: "order-linked",
    verifiedPurchase: true,
    isApproved: overrides.status === "approved",
    isFeatured: false,
    createdAt: overrides.createdAt ?? "2026-10-01T11:00:00.000Z",
    updatedAt: overrides.updatedAt ?? "2026-10-01T11:00:00.000Z",
  };
}

test("Admin V2 Analytics is a real implemented route protected by analytics.view", () => {
  assert.equal(findAdminV2Route("analytics")?.implemented, true);
  assert.equal(findAdminV2Route("approvals")?.implemented, true);
  assert.equal(adminV2AccessRules.analytics.section, "analytics");
  assert.match(analyticsPageSource, /requireAdminV2RouteAccess\(session,\s*"analytics"\)/);
  assert.match(analyticsPageSource, /getAdminV2Analytics\(params\)/);
  assert.doesNotMatch(analyticsPageSource, /AdminV2ModulePage/);
});

test("Analytics aggregation excludes cancelled, test, archived, deleted, and soft-deleted orders from payable sales", () => {
  const range = resolveAnalyticsDateRange(new URLSearchParams("range=custom&from=2026-10-01&to=2026-10-02"));
  const result = buildAdminV2AnalyticsResult({
    range,
    orders: [
      order({
        orderId: "valid-a",
        orderReference: "AEV-A",
        customerId: "cust-a",
        totals: { totalItems: 2, subtotal: 200 },
        discountAmount: 20,
        deliveryCharge: 30,
        totalAmount: 999,
        items: [{ id: "line-a", productId: "prod-a", slug: "period-a", name: "Period A", price: 90, quantity: 2, lineTotal: 180 }],
      }),
      order({ orderId: "cancelled", orderReference: "AEV-C", status: "Cancelled", totalAmount: 500 }),
      order({ orderId: "test", orderReference: "AEV-T", isTestOrder: true, totalAmount: 500 }),
      order({ orderId: "archived", orderReference: "AEV-AR", archivedAt: "2026-10-02T00:00:00.000Z", totalAmount: 500 }),
      order({ orderId: "deleted", orderReference: "AEV-D", deletedAt: "2026-10-02T00:00:00.000Z", totalAmount: 500 }),
      order({ orderId: "soft", orderReference: "AEV-S", softDeletedAt: "2026-10-02T00:00:00.000Z", totalAmount: 500 }),
    ],
    customers: [],
    reviews: [],
  });

  assert.equal(payableOrderValue(order({ totals: { totalItems: 2, subtotal: 200 }, discountAmount: 20, deliveryCharge: 30, totalAmount: 999 })), 210);
  assert.equal(result.kpis.orders, 1);
  assert.equal(result.kpis.payableSales, 210);
  assert.equal(result.kpis.averageOrderValue, 210);
  assert.equal(result.orderStatus.find((slice) => slice.status === "Cancelled")?.count, 1);
  assert.equal(isQualifyingAnalyticsOrder(order({ status: "Cancelled" })), false);
});

test("Analytics derives trends, product ranks, customers, and reviews from operational rows", () => {
  const range = resolveAnalyticsDateRange(new URLSearchParams("range=custom&from=2026-10-01&to=2026-10-03"));
  const result = buildAdminV2AnalyticsResult({
    range,
    orders: [
      order({
        orderId: "a",
        orderReference: "AEV-A",
        customerId: "cust-a",
        totalAmount: 120,
        createdAt: "2026-10-01T08:00:00.000Z",
        items: [{ id: "line-a", productId: "prod-a", slug: "period-a", name: "Period A", price: 60, quantity: 2, lineTotal: 120 }],
      }),
      order({
        orderId: "b",
        orderReference: "AEV-B",
        customerId: "cust-a",
        totalAmount: 80,
        createdAt: "2026-10-02T08:00:00.000Z",
        items: [{ id: "line-b", productId: "prod-b", slug: "period-b", name: "Period B", price: 80, quantity: 1, lineTotal: 80 }],
      }),
    ],
    customers: [
      { id: "cust-a", createdAt: "2026-10-01T01:00:00.000Z" },
      { id: "cust-b", createdAt: "2026-10-03T01:00:00.000Z" },
    ],
    reviews: [
      review({ id: "review-a", status: "approved", rating: 5, createdAt: "2026-10-02T01:00:00.000Z" }),
      review({ id: "review-b", status: "pending", rating: 3, createdAt: "2026-10-03T01:00:00.000Z" }),
    ],
  });

  assert.equal(result.kpis.orders, 2);
  assert.equal(result.kpis.newAccounts, 2);
  assert.equal(result.kpis.reviews, 2);
  assert.equal(result.trend.length, 3);
  assert.deepEqual(result.trend.map((bucket) => bucket.orders), [1, 1, 0]);
  assert.equal(result.topProductsByQuantity[0]?.name, "Period A");
  assert.equal(result.topProductsByValue[0]?.orderValue, 120);
  assert.deepEqual(result.linkedCustomers, {
    linkedCustomers: 1,
    newLinkedCustomers: 1,
    repeatLinkedCustomers: 1,
    linkedOrders: 2,
  });
  assert.equal(result.reviewSummary.averageRating, 4);
  assert.equal(result.reviewSummary.approved, 1);
  assert.equal(result.reviewSummary.pending, 1);
});

test("Analytics date ranges are timezone-safe and custom ranges are capped", () => {
  const defaultRange = resolveAnalyticsDateRange(new URLSearchParams(), new Date("2026-10-03T16:00:00.000Z"));
  assert.equal(defaultRange.preset, "30d");
  assert.equal(defaultRange.fromIso.endsWith("T00:00:00.000Z"), true);
  assert.equal(defaultRange.toIso.endsWith("T23:59:59.999Z"), true);

  const capped = resolveAnalyticsDateRange(new URLSearchParams("range=custom&from=2025-01-01&to=2026-10-03"));
  assert.equal(capped.warnings.length, 1);
  assert.equal(capped.granularity, "month");
  const impossible = resolveAnalyticsDateRange(new URLSearchParams("range=custom&from=2026-02-31&to=2026-03-02"));
  assert.match(impossible.warnings.join(" "), /Invalid custom date range/);
  for (const invalid of ["2026-02-29", "2026-02-30", "2026-13-01", "2026-00-10", "2026-04-31"]) {
    assert.match(
      resolveAnalyticsDateRange(new URLSearchParams(`range=custom&from=${invalid}&to=2026-05-01`)).warnings.join(" "),
      /Invalid custom date range/,
      invalid
    );
  }
  const leap = resolveAnalyticsDateRange(new URLSearchParams("range=custom&from=2028-02-29&to=2028-03-01"));
  assert.equal(leap.from, "2028-02-29");
});

test("Analytics UI and query source avoid fabricated traffic, conversion, and growth metrics", () => {
  assert.match(analyticsMetricsSource, /getAdminV2OrderAmounts/);
  assert.match(analyticsQuerySource, /listAnalyticsOrders/);
  assert.match(analyticsSource, /select: analyticsOrderSelect/);
  assert.match(analyticsSource, /export const analyticsOrderSelect = \[/);
  assert.doesNotMatch(analyticsSource, /customer_phone|customer_email|delivery_address|wallet_provider|receiver_number|sender_number|transaction_id|payment_reference|admin_internal_note/);
  assert.match(analyticsSource, /export const analyticsReviewSelect = \[/);
  const reviewSelect = analyticsSource.match(/export const analyticsReviewSelect = \[[\s\S]+?\]\.join\(","\);/)?.[0] ?? "";
  assert.doesNotMatch(reviewSelect, /customer_phone|customer_name|body|title|admin_note|media_urls|order_reference/);
  const customerAccountSelect =
    analyticsSource.match(/export const analyticsCustomerAccountSelect = "id,created_at"/)?.[0] ?? "";
  assert.match(customerAccountSelect, /id,created_at/);
  assert.doesNotMatch(customerAccountSelect, /password_hash|phone|email/);
  assert.doesNotMatch(analyticsQuerySource, /listProducts|queryOrders/);
  assert.match(analyticsQuerySource, /Traffic, conversion, visitor, attribution, ROAS and CAC metrics are intentionally omitted/);
  assert.doesNotMatch(analyticsViewSource, /Conversion Rate|Visitors|Sessions|Page Views|ROAS|CAC|Traffic Source|Growth/);
  assert.doesNotMatch(analyticsQuerySource, /analytics_events|analytics_snapshots|Math\.random|faker|mock/i);
});
