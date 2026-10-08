import type { OrderCartItem, OrderRecord, OrderStatus } from "@/app/lib/order-types";
import type { ProductReview, ReviewStatus } from "@/app/lib/review-types";
import type { AnalyticsSourceState } from "@/lib/admin-v2/analytics/analytics-source";
import { getAdminV2OrderAmounts } from "@/lib/admin-v2/orders/order-amounts";

export const analyticsPresetRanges = ["7d", "30d", "90d", "year", "custom"] as const;
export type AnalyticsPresetRange = (typeof analyticsPresetRanges)[number];

export type AnalyticsDateRange = {
  preset: AnalyticsPresetRange;
  from: string;
  to: string;
  fromIso: string;
  toIso: string;
  label: string;
  granularity: "day" | "week" | "month";
  warnings: string[];
};

export type AnalyticsCustomerRow = {
  id: string;
  createdAt?: string;
};

export type AnalyticsOrderValueBreakdown = {
  discounts: number;
  deliveryFees: number;
  discountRows: number;
  deliveryRows: number;
};

export type AnalyticsTrendBucket = {
  key: string;
  label: string;
  orders: number;
  payableSales: number;
  newCustomers: number;
  reviews: number;
};

export type AnalyticsStatusSlice = {
  status: OrderStatus;
  count: number;
  proportion: number;
};

export type AnalyticsProductRank = {
  key: string;
  name: string;
  slug?: string;
  productId?: string;
  quantity: number;
  orderValue: number;
};

export type AnalyticsLinkedCustomerInsight = {
  linkedCustomers: number;
  newLinkedCustomers: number;
  repeatLinkedCustomers: number;
  linkedOrders: number;
};

export type AnalyticsReviewSummary = {
  total: number;
  averageRating: number;
  approved: number;
  pending: number;
  byStatus: Record<ReviewStatus, number>;
};

export type AdminV2AnalyticsResult = {
  available: boolean;
  limitation: string | null;
  range: AnalyticsDateRange;
  kpis: {
    orders: number;
    payableSales: number;
    averageOrderValue: number;
    newAccounts: number;
    reviews: number;
  };
  sources: {
    orders: AnalyticsSourceState;
    customers: AnalyticsSourceState;
    reviews: AnalyticsSourceState;
  };
  trend: AnalyticsTrendBucket[];
  orderStatus: AnalyticsStatusSlice[];
  topProductsByQuantity: AnalyticsProductRank[];
  topProductsByValue: AnalyticsProductRank[];
  linkedCustomers: AnalyticsLinkedCustomerInsight;
  reviewSummary: AnalyticsReviewSummary;
  valueBreakdown: AnalyticsOrderValueBreakdown;
  sourceNotes: string[];
};

const dayMs = 24 * 60 * 60 * 1000;
const maximumCustomDays = 366;

function pad(value: number) {
  return String(value).padStart(2, "0");
}

export function dateKey(date: Date) {
  return `${date.getUTCFullYear()}-${pad(date.getUTCMonth() + 1)}-${pad(date.getUTCDate())}`;
}

function monthKey(date: Date) {
  return `${date.getUTCFullYear()}-${pad(date.getUTCMonth() + 1)}`;
}

function startOfUtcDay(date: Date) {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}

function parseDateInput(value: string | null | undefined) {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const parsed = new Date(`${value}T00:00:00.000Z`);
  return Number.isFinite(parsed.getTime()) && dateKey(parsed) === value ? parsed : null;
}

function isoDateInput(date: Date) {
  return dateKey(date);
}

function rangeLabel(from: Date, to: Date) {
  return `${isoDateInput(from)} to ${isoDateInput(to)}`;
}

export function resolveAnalyticsDateRange(params: URLSearchParams, nowInput = new Date()): AnalyticsDateRange {
  const requestedPreset = params.get("range");
  const preset = analyticsPresetRanges.includes(requestedPreset as AnalyticsPresetRange)
    ? (requestedPreset as AnalyticsPresetRange)
    : "30d";
  const today = startOfUtcDay(nowInput);
  const warnings: string[] = [];
  let from = new Date(today.getTime() - 29 * dayMs);
  let to = today;
  let label = "Last 30 days";

  if (preset === "7d") {
    from = new Date(today.getTime() - 6 * dayMs);
    label = "Last 7 days";
  } else if (preset === "90d") {
    from = new Date(today.getTime() - 89 * dayMs);
    label = "Last 90 days";
  } else if (preset === "year") {
    from = new Date(Date.UTC(today.getUTCFullYear(), 0, 1));
    label = "This year";
  } else if (preset === "custom") {
    const customFrom = parseDateInput(params.get("from"));
    const customTo = parseDateInput(params.get("to"));
    if (customFrom && customTo && customFrom.getTime() <= customTo.getTime()) {
      from = customFrom;
      to = customTo;
      const days = Math.floor((to.getTime() - from.getTime()) / dayMs) + 1;
      if (days > maximumCustomDays) {
        from = new Date(to.getTime() - (maximumCustomDays - 1) * dayMs);
        warnings.push(`Custom ranges are limited to ${maximumCustomDays} days. Showing the latest ${maximumCustomDays} days in the selected range.`);
      }
      label = `Custom: ${rangeLabel(from, to)}`;
    } else {
      warnings.push("Invalid custom date range. Showing Last 30 days.");
      label = "Last 30 days";
    }
  }

  const inclusiveDays = Math.floor((to.getTime() - from.getTime()) / dayMs) + 1;
  const granularity = preset === "year" || inclusiveDays > 180 ? "month" : inclusiveDays > 90 ? "week" : "day";

  return {
    preset,
    from: isoDateInput(from),
    to: isoDateInput(to),
    fromIso: `${isoDateInput(from)}T00:00:00.000Z`,
    toIso: `${isoDateInput(to)}T23:59:59.999Z`,
    label,
    granularity,
    warnings,
  };
}

function dateInRange(value: string | undefined, range: AnalyticsDateRange) {
  if (!value) return false;
  const time = Date.parse(value);
  return Number.isFinite(time) && time >= Date.parse(range.fromIso) && time <= Date.parse(range.toIso);
}

export function isVisibleAnalyticsOrder(order: OrderRecord) {
  return !order.archivedAt && !order.deletedAt && !order.softDeletedAt;
}

export function isQualifyingAnalyticsOrder(order: OrderRecord) {
  return isVisibleAnalyticsOrder(order) && order.status !== "Cancelled" && !order.isTestOrder;
}

function finiteAmount(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) ? Math.max(0, value) : null;
}

export function payableOrderValue(order: OrderRecord) {
  return getAdminV2OrderAmounts(order).total ?? 0;
}

function bucketKey(date: Date, granularity: AnalyticsDateRange["granularity"]) {
  if (granularity === "month") return monthKey(date);
  if (granularity === "week") {
    const start = startOfUtcDay(date);
    const day = start.getUTCDay();
    const mondayOffset = day === 0 ? -6 : 1 - day;
    start.setUTCDate(start.getUTCDate() + mondayOffset);
    return dateKey(start);
  }
  return dateKey(date);
}

function bucketLabel(key: string, granularity: AnalyticsDateRange["granularity"]) {
  if (granularity === "month") {
    const [year, month] = key.split("-").map(Number);
    return new Intl.DateTimeFormat("en", { month: "short", year: "numeric", timeZone: "UTC" }).format(new Date(Date.UTC(year, month - 1, 1)));
  }
  if (granularity === "week") return `Week of ${key}`;
  return key.slice(5);
}

function createTrendBuckets(range: AnalyticsDateRange): AnalyticsTrendBucket[] {
  const buckets: AnalyticsTrendBucket[] = [];
  const from = new Date(range.fromIso);
  const to = new Date(range.toIso);
  const seen = new Set<string>();
  const stepDays = range.granularity === "week" ? 7 : 1;

  if (range.granularity === "month") {
    const cursor = new Date(Date.UTC(from.getUTCFullYear(), from.getUTCMonth(), 1));
    while (cursor <= to) {
      const key = bucketKey(cursor, range.granularity);
      buckets.push({ key, label: bucketLabel(key, range.granularity), orders: 0, payableSales: 0, newCustomers: 0, reviews: 0 });
      cursor.setUTCMonth(cursor.getUTCMonth() + 1);
    }
    return buckets;
  }

  const cursor = startOfUtcDay(from);
  while (cursor <= to) {
    const key = bucketKey(cursor, range.granularity);
    if (!seen.has(key)) {
      seen.add(key);
      buckets.push({ key, label: bucketLabel(key, range.granularity), orders: 0, payableSales: 0, newCustomers: 0, reviews: 0 });
    }
    cursor.setUTCDate(cursor.getUTCDate() + stepDays);
  }
  return buckets;
}

function addToBucket(buckets: Map<string, AnalyticsTrendBucket>, value: string | undefined, range: AnalyticsDateRange, apply: (bucket: AnalyticsTrendBucket) => void) {
  if (!dateInRange(value, range)) return;
  const bucket = buckets.get(bucketKey(new Date(value as string), range.granularity));
  if (bucket) apply(bucket);
}

function itemSnapshotValue(item: OrderCartItem) {
  const lineTotal = finiteAmount(item.lineTotal);
  if (lineTotal !== null) return lineTotal;
  const price = finiteAmount(item.price);
  const quantity = Number.isFinite(item.quantity) ? Math.max(0, item.quantity) : 0;
  return price === null ? null : price * quantity;
}

export function buildAdminV2AnalyticsResult(input: {
  range: AnalyticsDateRange;
  orders: OrderRecord[];
  customers: AnalyticsCustomerRow[];
  reviews: ProductReview[];
  sources?: AdminV2AnalyticsResult["sources"];
  sourceNotes?: string[];
  limitation?: string | null;
}): AdminV2AnalyticsResult {
  const rangeOrders = input.orders.filter((order) => isVisibleAnalyticsOrder(order) && dateInRange(order.createdAt, input.range));
  const qualifyingOrders = rangeOrders.filter(isQualifyingAnalyticsOrder);
  const payableSales = qualifyingOrders.reduce((sum, order) => sum + payableOrderValue(order), 0);
  const newAccounts = input.customers.filter((customer) => dateInRange(customer.createdAt, input.range));
  const newAccountIds = new Set(newAccounts.map((customer) => customer.id));
  const rangeReviews = input.reviews.filter((review) => dateInRange(review.createdAt, input.range));
  const trend = createTrendBuckets(input.range);
  const trendMap = new Map(trend.map((bucket) => [bucket.key, bucket]));

  for (const order of qualifyingOrders) {
    addToBucket(trendMap, order.createdAt, input.range, (bucket) => {
      bucket.orders += 1;
      bucket.payableSales += payableOrderValue(order);
    });
  }
  for (const customer of newAccounts) {
    addToBucket(trendMap, customer.createdAt, input.range, (bucket) => {
      bucket.newCustomers += 1;
    });
  }
  for (const review of rangeReviews) {
    addToBucket(trendMap, review.createdAt, input.range, (bucket) => {
      bucket.reviews += 1;
    });
  }

  const orderStatus = Array.from(
    rangeOrders.reduce((map, order) => map.set(order.status, (map.get(order.status) ?? 0) + 1), new Map<OrderStatus, number>())
  ).map(([status, count]) => ({ status, count, proportion: rangeOrders.length ? count / rangeOrders.length : 0 }));

  const productMap = new Map<string, AnalyticsProductRank>();
  for (const order of qualifyingOrders) {
    for (const item of order.items) {
      const identity = item.productId || item.slug || item.name || item.id;
      if (!identity) continue;
      const current = productMap.get(identity) ?? {
        key: identity,
        productId: item.productId,
        slug: item.slug,
        name: item.name || item.slug || item.productId || "Unknown product",
        quantity: 0,
        orderValue: 0,
      };
      current.quantity += Number.isFinite(item.quantity) ? Math.max(0, item.quantity) : 0;
      current.orderValue += itemSnapshotValue(item) ?? 0;
      productMap.set(identity, current);
    }
  }
  const products = Array.from(productMap.values());

  const linkedMap = new Map<string, number>();
  for (const order of qualifyingOrders) {
    if (!order.customerId) continue;
    linkedMap.set(order.customerId, (linkedMap.get(order.customerId) ?? 0) + 1);
  }

  const reviewStatusCounts: Record<ReviewStatus, number> = { pending: 0, approved: 0, rejected: 0, hidden: 0 };
  let ratingTotal = 0;
  let ratingCount = 0;
  for (const review of rangeReviews) {
    reviewStatusCounts[review.status] += 1;
    if (Number.isFinite(review.rating)) {
      ratingTotal += review.rating;
      ratingCount += 1;
    }
  }

  const valueBreakdown = qualifyingOrders.reduce<AnalyticsOrderValueBreakdown>((result, order) => {
    const discount = finiteAmount(order.discountAmount);
    const delivery = finiteAmount(order.deliveryCharge);
    if (discount !== null) {
      result.discounts += discount;
      result.discountRows += 1;
    }
    if (delivery !== null) {
      result.deliveryFees += delivery;
      result.deliveryRows += 1;
    }
    return result;
  }, { discounts: 0, deliveryFees: 0, discountRows: 0, deliveryRows: 0 });

  return {
    available: !input.limitation,
    limitation: input.limitation ?? null,
    range: input.range,
    kpis: {
      orders: qualifyingOrders.length,
      payableSales,
      averageOrderValue: qualifyingOrders.length ? payableSales / qualifyingOrders.length : 0,
      newAccounts: newAccounts.length,
      reviews: rangeReviews.length,
    },
    sources: input.sources ?? {
      orders: { available: true, complete: true, totalCount: input.orders.length, loadedCount: input.orders.length },
      customers: { available: true, complete: true, totalCount: input.customers.length, loadedCount: input.customers.length },
      reviews: { available: true, complete: true, totalCount: input.reviews.length, loadedCount: input.reviews.length },
    },
    trend,
    orderStatus,
    topProductsByQuantity: [...products].sort((a, b) => b.quantity - a.quantity).slice(0, 8),
    topProductsByValue: [...products].sort((a, b) => b.orderValue - a.orderValue).slice(0, 8),
    linkedCustomers: {
      linkedCustomers: linkedMap.size,
      newLinkedCustomers: Array.from(linkedMap.keys()).filter((customerId) => newAccountIds.has(customerId)).length,
      repeatLinkedCustomers: Array.from(linkedMap.values()).filter((count) => count > 1).length,
      linkedOrders: Array.from(linkedMap.values()).reduce((sum, count) => sum + count, 0),
    },
    reviewSummary: {
      total: rangeReviews.length,
      averageRating: ratingCount ? Math.round((ratingTotal / ratingCount) * 10) / 10 : 0,
      approved: reviewStatusCounts.approved,
      pending: reviewStatusCounts.pending,
      byStatus: reviewStatusCounts,
    },
    valueBreakdown,
    sourceNotes: input.sourceNotes ?? [],
  };
}
