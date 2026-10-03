import type { OrderRecord } from "@/app/lib/order-types";
import type { ProductReview } from "@/app/lib/review-types";
import {
  buildAdminV2AnalyticsResult,
  isQualifyingAnalyticsOrder,
  payableOrderValue,
  resolveAnalyticsDateRange,
  type AdminV2AnalyticsResult,
  type AnalyticsCustomerRow,
  type AnalyticsDateRange,
} from "@/lib/admin-v2/analytics/analytics-metrics";

export const adminV2ReportTypes = ["sales", "orders", "products", "customers", "reviews", "fees"] as const;
export type AdminV2ReportType = (typeof adminV2ReportTypes)[number];

export const adminV2ReportLabels: Record<AdminV2ReportType, string> = {
  sales: "Sales Report",
  orders: "Orders Report",
  products: "Product Performance",
  customers: "Customer Report",
  reviews: "Review Report",
  fees: "Discounts & Delivery Fees",
};

export type ReportCustomerRow = AnalyticsCustomerRow & {
  displayName?: string;
};

export type ReportTableColumn = {
  key: string;
  label: string;
  align?: "left" | "right";
};

export type ReportTableRow = Record<string, string | number>;

export type AdminV2ReportResult = {
  type: AdminV2ReportType;
  label: string;
  range: AnalyticsDateRange;
  analytics: AdminV2AnalyticsResult;
  kpis: Array<{ label: string; value: string | number; helper?: string }>;
  columns: ReportTableColumn[];
  rows: ReportTableRow[];
  notes: string[];
  exportable: boolean;
  exportDisabledReason?: string;
  complete: boolean;
  limitation: string | null;
};

const maxPreviewRows = 24;

function inRange(value: string | undefined, range: AnalyticsDateRange) {
  if (!value) return false;
  const time = Date.parse(value);
  return Number.isFinite(time) && time >= Date.parse(range.fromIso) && time <= Date.parse(range.toIso);
}

function safeText(value: unknown, fallback = "Not provided") {
  return typeof value === "string" && value.trim() ? value.trim() : fallback;
}

function dateOnly(value?: string) {
  if (!value) return "Not provided";
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return "Not provided";
  return date.toISOString().slice(0, 10);
}

function itemCount(order: OrderRecord) {
  return order.items.reduce((sum, item) => sum + (Number.isFinite(item.quantity) ? Math.max(0, item.quantity) : 0), 0);
}

function itemSnapshotValue(item: OrderRecord["items"][number]) {
  if (typeof item.lineTotal === "number" && Number.isFinite(item.lineTotal)) return Math.max(0, item.lineTotal);
  if (typeof item.price !== "number" || !Number.isFinite(item.price)) return 0;
  return Math.max(0, item.price) * (Number.isFinite(item.quantity) ? Math.max(0, item.quantity) : 0);
}

function rangeOrders(orders: OrderRecord[], range: AnalyticsDateRange) {
  return orders.filter((order) => inRange(order.createdAt, range) && !order.archivedAt && !order.deletedAt && !order.softDeletedAt);
}

function qualifyingOrders(orders: OrderRecord[], range: AnalyticsDateRange) {
  return rangeOrders(orders, range).filter(isQualifyingAnalyticsOrder);
}

function productRows(orders: OrderRecord[], range: AnalyticsDateRange) {
  const products = new Map<string, { product: string; quantity: number; orderValue: number; orderRefs: Set<string> }>();
  for (const order of qualifyingOrders(orders, range)) {
    for (const item of order.items) {
      const key = item.productId || item.slug || item.name || item.id;
      if (!key) continue;
      const current = products.get(key) ?? {
        product: item.name || item.slug || item.productId || "Unknown product",
        quantity: 0,
        orderValue: 0,
        orderRefs: new Set<string>(),
      };
      current.quantity += Number.isFinite(item.quantity) ? Math.max(0, item.quantity) : 0;
      current.orderValue += itemSnapshotValue(item);
      current.orderRefs.add(order.orderReference);
      products.set(key, current);
    }
  }
  return Array.from(products.values())
    .sort((a, b) => b.orderValue - a.orderValue)
    .map((row) => ({ product: row.product, quantity: row.quantity, orderValue: row.orderValue, orderCount: row.orderRefs.size }));
}

function customerRows(orders: OrderRecord[], customers: ReportCustomerRow[], range: AnalyticsDateRange) {
  const map = new Map(customers.map((customer) => [customer.id, customer]));
  const aggregates = new Map<string, { customerId: string; customer: string; createdAt: string; orderCount: number; orderValue: number }>();
  for (const customer of customers.filter((item) => inRange(item.createdAt, range))) {
    aggregates.set(customer.id, {
      customerId: customer.id,
      customer: safeText(customer.displayName),
      createdAt: dateOnly(customer.createdAt),
      orderCount: 0,
      orderValue: 0,
    });
  }
  for (const order of qualifyingOrders(orders, range)) {
    if (!order.customerId) continue;
    const customer = map.get(order.customerId);
    const current = aggregates.get(order.customerId) ?? {
      customerId: order.customerId,
      customer: safeText(customer?.displayName),
      createdAt: dateOnly(customer?.createdAt),
      orderCount: 0,
      orderValue: 0,
    };
    current.orderCount += 1;
    current.orderValue += payableOrderValue(order);
    aggregates.set(order.customerId, current);
  }
  return Array.from(aggregates.values()).sort((a, b) => b.orderValue - a.orderValue);
}

function reviewRows(reviews: ProductReview[], range: AnalyticsDateRange) {
  return reviews
    .filter((review) => inRange(review.createdAt, range))
    .sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt))
    .map((review) => ({
      product: review.productSlug || review.productId || "Unknown product",
      rating: review.rating,
      status: review.status,
      createdAt: dateOnly(review.createdAt),
    }));
}

export function parseAdminV2ReportType(value: string | null | undefined): AdminV2ReportType {
  return adminV2ReportTypes.includes(value as AdminV2ReportType) ? (value as AdminV2ReportType) : "sales";
}

export function buildAdminV2Report(input: {
  type: AdminV2ReportType;
  range: AnalyticsDateRange;
  orders: OrderRecord[];
  customers: ReportCustomerRow[];
  reviews: ProductReview[];
  previewLimit?: number;
  complete?: boolean;
  limitation?: string | null;
}): AdminV2ReportResult {
  const analytics = buildAdminV2AnalyticsResult({
    range: input.range,
    orders: input.orders,
    customers: input.customers,
    reviews: input.reviews,
    limitation: input.limitation,
    sourceNotes: [
      "Payable sales represents non-cancelled, non-test order value and is not necessarily settled cash revenue.",
      "Traffic, conversion, visitor, attribution, ROAS and CAC metrics are not stored and are intentionally omitted.",
    ],
  });
  const qOrders = qualifyingOrders(input.orders, input.range);
  const allRangeOrders = rangeOrders(input.orders, input.range);
  const products = productRows(input.orders, input.range);
  const customers = customerRows(input.orders, input.customers, input.range);
  const reviews = reviewRows(input.reviews, input.range);
  const discounts = qOrders.reduce((sum, order) => sum + (typeof order.discountAmount === "number" && Number.isFinite(order.discountAmount) ? Math.max(0, order.discountAmount) : 0), 0);
  const deliveryFees = qOrders.reduce((sum, order) => sum + (typeof order.deliveryCharge === "number" && Number.isFinite(order.deliveryCharge) ? Math.max(0, order.deliveryCharge) : 0), 0);
  const limit = input.previewLimit ?? maxPreviewRows;
  const base = {
    type: input.type,
    label: adminV2ReportLabels[input.type],
    range: input.range,
    analytics,
    notes: ["Saved and scheduled reports are not available yet."],
    exportable: Boolean(input.complete),
    exportDisabledReason: input.complete ? undefined : "Export is disabled because the selected range hit the safe server-side data cap.",
    complete: input.complete !== false,
    limitation: input.limitation ?? null,
  };

  if (input.type === "orders") {
    return {
      ...base,
      kpis: [
        { label: "Orders", value: qOrders.length },
        { label: "Payable Sales", value: analytics.kpis.payableSales },
        { label: "AOV", value: analytics.kpis.averageOrderValue },
        { label: "Cancelled in range", value: allRangeOrders.filter((order) => order.status === "Cancelled").length },
      ],
      columns: [
        { key: "orderReference", label: "Order" },
        { key: "createdAt", label: "Created" },
        { key: "status", label: "Status" },
        { key: "customer", label: "Customer" },
        { key: "items", label: "Items", align: "right" },
        { key: "payableTotal", label: "Payable Total", align: "right" },
      ],
      rows: qOrders.slice(0, limit).map((order) => ({
        orderReference: order.orderReference,
        createdAt: dateOnly(order.createdAt),
        status: order.status,
        customer: safeText(order.customer.fullName),
        items: itemCount(order),
        payableTotal: payableOrderValue(order),
      })),
      notes: [...base.notes, "Order rows are range-scoped and omit phone, email, address, auth metadata, passwords and tokens."],
    };
  }

  if (input.type === "products") {
    return {
      ...base,
      kpis: [
        { label: "Products sold", value: products.length },
        { label: "Units sold", value: products.reduce((sum, row) => sum + row.quantity, 0) },
        { label: "Order value", value: products.reduce((sum, row) => sum + row.orderValue, 0) },
        { label: "Order occurrences", value: products.reduce((sum, row) => sum + row.orderCount, 0) },
      ],
      columns: [
        { key: "product", label: "Product" },
        { key: "quantity", label: "Quantity", align: "right" },
        { key: "orderValue", label: "Order Value", align: "right" },
        { key: "orderCount", label: "Orders", align: "right" },
      ],
      rows: products.slice(0, limit),
      notes: [...base.notes, "Based on order item snapshots. Impressions, conversion rate, margin and profit are not stored."],
    };
  }

  if (input.type === "customers") {
    return {
      ...base,
      kpis: [
        { label: "New accounts", value: analytics.kpis.newCustomers },
        { label: "Linked customers", value: analytics.linkedCustomers.linkedCustomers },
        { label: "Repeat linked", value: analytics.linkedCustomers.repeatLinkedCustomers },
        { label: "Linked order value", value: customers.reduce((sum, row) => sum + row.orderValue, 0) },
      ],
      columns: [
        { key: "customerId", label: "Customer ID" },
        { key: "customer", label: "Display Name" },
        { key: "createdAt", label: "Created" },
        { key: "orderCount", label: "Linked Orders", align: "right" },
        { key: "orderValue", label: "Linked Value", align: "right" },
      ],
      rows: customers.slice(0, limit),
      notes: [...base.notes, "Based on linked customer accounts only. Guest or unlinked orders are not presented as attributable customer behavior."],
    };
  }

  if (input.type === "reviews") {
    return {
      ...base,
      kpis: [
        { label: "Reviews", value: analytics.reviewSummary.total },
        { label: "Average rating", value: analytics.reviewSummary.averageRating.toFixed(1) },
        { label: "Approved", value: analytics.reviewSummary.approved },
        { label: "Pending", value: analytics.reviewSummary.pending },
      ],
      columns: [
        { key: "product", label: "Product" },
        { key: "rating", label: "Rating", align: "right" },
        { key: "status", label: "Status" },
        { key: "createdAt", label: "Created" },
      ],
      rows: reviews.slice(0, limit),
      notes: [...base.notes, "Uses real product_reviews rows only. No sentiment analysis is inferred."],
    };
  }

  if (input.type === "fees") {
    return {
      ...base,
      kpis: [
        { label: "Discounts", value: discounts },
        { label: "Delivery Fees", value: deliveryFees },
        { label: "Discount rows", value: analytics.valueBreakdown.discountRows },
        { label: "Delivery rows", value: analytics.valueBreakdown.deliveryRows },
      ],
      columns: [
        { key: "orderReference", label: "Order" },
        { key: "createdAt", label: "Created" },
        { key: "discountAmount", label: "Discount", align: "right" },
        { key: "deliveryCharge", label: "Delivery Fee", align: "right" },
        { key: "payableTotal", label: "Payable Total", align: "right" },
      ],
      rows: qOrders.slice(0, limit).map((order) => ({
        orderReference: order.orderReference,
        createdAt: dateOnly(order.createdAt),
        discountAmount: order.discountAmount ?? "",
        deliveryCharge: order.deliveryCharge ?? "",
        payableTotal: payableOrderValue(order),
      })),
      notes: [...base.notes, "Older records may not include discount_amount or delivery_charge fields."],
    };
  }

  return {
    ...base,
    kpis: [
      { label: "Orders", value: analytics.kpis.orders },
      { label: "Payable Sales", value: analytics.kpis.payableSales },
      { label: "Average Order Value", value: analytics.kpis.averageOrderValue },
      { label: "Discounts", value: discounts },
      { label: "Delivery Fees", value: deliveryFees },
    ],
    columns: [
      { key: "metric", label: "Metric" },
      { key: "value", label: "Value", align: "right" },
    ],
    rows: [
      { metric: "Orders", value: analytics.kpis.orders },
      { metric: "Payable Sales", value: analytics.kpis.payableSales },
      { metric: "Average Order Value", value: analytics.kpis.averageOrderValue },
      { metric: "Discounts", value: discounts },
      { metric: "Delivery Fees", value: deliveryFees },
    ],
    notes: [...base.notes, "Payable Sales excludes cancelled, test, archived, deleted and soft-deleted orders."],
  };
}

export function reportSearchParams(searchParams = new URLSearchParams()) {
  return {
    type: parseAdminV2ReportType(searchParams.get("type")),
    range: resolveAnalyticsDateRange(searchParams),
  };
}
