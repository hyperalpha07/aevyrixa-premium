import "server-only";

import type { OrderRecord } from "@/app/lib/order-types";
import type { ProductReview, ReviewStatus } from "@/app/lib/review-types";
import { queryOrders } from "@/app/lib/order-store";
import { listProducts } from "@/app/lib/product-store";
import { parseAdminV2OrderQuery } from "@/lib/admin-v2/orders/order-query";
import {
  buildAdminV2AnalyticsResult,
  resolveAnalyticsDateRange,
  type AdminV2AnalyticsResult,
  type AnalyticsCustomerRow,
} from "@/lib/admin-v2/analytics/analytics-metrics";

const batchSize = 50;
const maxOrderPages = 80;
const maxRestRows = 5000;

type MinimalCustomerRow = {
  id?: string | null;
  created_at?: string | null;
};

type MinimalReviewRow = {
  id?: string | null;
  product_id?: string | null;
  product_slug?: string | null;
  order_id?: string | null;
  order_reference?: string | null;
  customer_id?: string | null;
  customer_name?: string | null;
  customer_phone?: string | null;
  rating?: number | string | null;
  title?: string | null;
  body?: string | null;
  media_urls?: unknown;
  status?: string | null;
  source_type?: string | null;
  verified_purchase?: boolean | string | null;
  is_approved?: boolean | string | null;
  is_featured?: boolean | string | null;
  admin_note?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
  approved_at?: string | null;
};

function hasSupabaseConfig() {
  return Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY);
}

function supabaseHeaders(extra: Record<string, string> = {}) {
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";
  return {
    apikey: serviceRoleKey,
    Authorization: `Bearer ${serviceRoleKey}`,
    "content-type": "application/json",
    ...extra,
  };
}

function supabaseEndpoint(pathAndQuery: string) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!supabaseUrl) throw new Error("Missing Supabase URL.");
  return `${supabaseUrl.replace(/\/$/, "")}/rest/v1/${pathAndQuery}`;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function text(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function optionalText(value: unknown) {
  const result = text(value);
  return result || undefined;
}

function boolValue(value: unknown) {
  if (typeof value === "boolean") return value;
  if (typeof value === "string") return value.toLowerCase() === "true";
  return false;
}

function ratingValue(value: unknown) {
  const parsed = typeof value === "number" ? value : Number(value);
  return Number.isFinite(parsed) ? Math.min(5, Math.max(1, Math.round(parsed))) : 0;
}

function statusValue(value: unknown): ReviewStatus {
  return value === "approved" || value === "rejected" || value === "hidden" || value === "pending" ? value : "pending";
}

function stringArray(value: unknown) {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];
}

function normalizeReview(row: MinimalReviewRow): ProductReview {
  const status = statusValue(row.status);
  const createdAt = row.created_at || new Date(0).toISOString();
  return {
    id: text(row.id),
    productId: text(row.product_id),
    productSlug: text(row.product_slug),
    orderId: optionalText(row.order_id),
    orderReference: optionalText(row.order_reference),
    customerId: optionalText(row.customer_id),
    customerName: text(row.customer_name) || "Customer",
    customerPhone: optionalText(row.customer_phone),
    rating: ratingValue(row.rating),
    title: optionalText(row.title),
    body: text(row.body),
    mediaUrls: stringArray(row.media_urls),
    status,
    sourceType: row.source_type === "order-linked" || row.source_type === "imported" || row.source_type === "admin-added" ? row.source_type : "imported",
    verifiedPurchase: boolValue(row.verified_purchase),
    isApproved: row.is_approved === undefined ? status === "approved" : boolValue(row.is_approved),
    isFeatured: boolValue(row.is_featured),
    adminNote: optionalText(row.admin_note),
    createdAt,
    updatedAt: row.updated_at || createdAt,
    approvedAt: optionalText(row.approved_at),
  };
}

async function fetchRestBatches<T>(pathAndQuery: string) {
  const rows: T[] = [];
  for (let from = 0; from < maxRestRows; from += 1000) {
    const to = Math.min(from + 999, maxRestRows - 1);
    const response = await fetch(supabaseEndpoint(pathAndQuery), {
      headers: { ...supabaseHeaders(), range: `${from}-${to}` },
      cache: "no-store",
    });
    if (!response.ok) throw new Error(`Analytics source query failed with ${response.status}.`);
    const batch = (await response.json()) as T[];
    rows.push(...batch);
    if (batch.length < 1000) break;
  }
  return rows;
}

async function listAnalyticsOrders(from: string, to: string) {
  const orders: OrderRecord[] = [];
  let totalPages = 1;

  for (let page = 1; page <= totalPages && page <= maxOrderPages; page += 1) {
    const query = parseAdminV2OrderQuery(new URLSearchParams({
      from,
      to,
      page: String(page),
      pageSize: String(batchSize),
      sort: "oldest",
    }));
    const result = await queryOrders(query);
    if (result.storageMode !== "supabase") {
      return { orders: [], available: false, capped: false };
    }
    orders.push(...result.rows);
    totalPages = result.totalPages;
  }

  return { orders, available: true, capped: totalPages > maxOrderPages };
}

async function listAnalyticsCustomers(fromIso: string, toIso: string) {
  if (!hasSupabaseConfig()) return { customers: [] as AnalyticsCustomerRow[], available: false, capped: false };
  const params = [
    "select=id,created_at",
    `created_at=gte.${encodeURIComponent(fromIso)}`,
    `created_at=lte.${encodeURIComponent(toIso)}`,
    "order=created_at.asc",
  ].join("&");
  const rows = await fetchRestBatches<MinimalCustomerRow>(`customer_accounts?${params}`);
  return {
    customers: rows.map((row) => ({ id: row.id ?? "", createdAt: row.created_at ?? undefined })).filter((row) => row.id),
    available: true,
    capped: rows.length >= maxRestRows,
  };
}

async function listAnalyticsReviews(fromIso: string, toIso: string) {
  if (!hasSupabaseConfig()) return { reviews: [] as ProductReview[], available: false, capped: false };
  const params = [
    "select=*",
    `created_at=gte.${encodeURIComponent(fromIso)}`,
    `created_at=lte.${encodeURIComponent(toIso)}`,
    "order=created_at.asc",
  ].join("&");
  const rows = await fetchRestBatches<MinimalReviewRow>(`product_reviews?${params}`);
  return { reviews: rows.map(normalizeReview), available: true, capped: rows.length >= maxRestRows };
}

function fallbackResult(params: URLSearchParams, message: string): AdminV2AnalyticsResult {
  const range = resolveAnalyticsDateRange(params);
  return buildAdminV2AnalyticsResult({
    range,
    orders: [],
    customers: [],
    reviews: [],
    limitation: message,
    sourceNotes: ["Analytics Phase 1 uses operational data only. No traffic or conversion metrics are stored in this repository."],
  });
}

export async function getAdminV2Analytics(searchParams = new URLSearchParams()): Promise<AdminV2AnalyticsResult> {
  const range = resolveAnalyticsDateRange(searchParams);
  if (!hasSupabaseConfig()) {
    return fallbackResult(searchParams, "Supabase is not configured. Analytics cannot be calculated from demo or fake data.");
  }

  try {
    const [orderResult, customerResult, reviewResult, productResult] = await Promise.allSettled([
      listAnalyticsOrders(range.from, range.to),
      listAnalyticsCustomers(range.fromIso, range.toIso),
      listAnalyticsReviews(range.fromIso, range.toIso),
      listProducts({ includeDrafts: true, scope: "admin" }),
    ]);

    const orders = orderResult.status === "fulfilled" && orderResult.value.available ? orderResult.value.orders : [];
    const customers = customerResult.status === "fulfilled" && customerResult.value.available ? customerResult.value.customers : [];
    const reviews = reviewResult.status === "fulfilled" && reviewResult.value.available ? reviewResult.value.reviews : [];
    const sourceNotes = [
      "Payable sales represents non-cancelled, non-test order value and is not necessarily settled cash revenue.",
      "Top products are based on order item snapshots.",
      "Linked customer insights include only orders connected to customer accounts.",
      "Traffic, conversion, visitor, and attribution metrics are intentionally omitted because this app does not persist them.",
    ];
    const limitations: string[] = [];

    if (orderResult.status !== "fulfilled" || !orderResult.value.available) limitations.push("Order analytics source is unavailable.");
    if (customerResult.status !== "fulfilled" || !customerResult.value.available) limitations.push("Customer analytics source is unavailable.");
    if (reviewResult.status !== "fulfilled" || !reviewResult.value.available) limitations.push("Review analytics source is unavailable.");
    if (orderResult.status === "fulfilled" && orderResult.value.capped) limitations.push("Order analytics reached the safe server-side page cap for this date range.");
    if (customerResult.status === "fulfilled" && customerResult.value.capped) limitations.push("Customer analytics reached the safe server-side row cap for this date range.");
    if (reviewResult.status === "fulfilled" && reviewResult.value.capped) limitations.push("Review analytics reached the safe server-side row cap for this date range.");
    if (productResult.status === "fulfilled" && isRecord(productResult.value) && productResult.value.storageMode === "supabase") {
      sourceNotes.push(`Product catalog connected (${productResult.value.products.length} product records available for labels/status context).`);
    }

    return buildAdminV2AnalyticsResult({
      range,
      orders,
      customers,
      reviews,
      limitation: limitations.length ? limitations.join(" ") : null,
      sourceNotes,
    });
  } catch {
    return fallbackResult(searchParams, "Analytics data could not be loaded from the existing operational backend.");
  }
}
