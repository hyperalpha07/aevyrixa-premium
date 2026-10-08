import "server-only";

import type { OrderCartItem, OrderRecord, OrderStatus } from "@/app/lib/order-types";
import { orderStatuses } from "@/app/lib/order-types";
import type { ProductReview, ReviewStatus } from "@/app/lib/review-types";

export const analyticsSourceRowLimit = 10000;

export const analyticsOrderSelect = [
  "id",
  "order_ref",
  "customer_id",
  "items",
  "subtotal",
  "total",
  "discount_amount",
  "delivery_charge",
  "status",
  "archived_at",
  "created_at",
  "currency_code",
].join(",");

export const analyticsReviewSelect = [
  "id",
  "product_id",
  "product_slug",
  "rating",
  "status",
  "is_approved",
  "is_featured",
  "source_type",
  "verified_purchase",
  "created_at",
  "approved_at",
].join(",");

export const analyticsCustomerAccountSelect = "id,created_at";
export const reportCustomerProfileSelect = "id,full_name,created_at";

export type AnalyticsSourceState = {
  available: boolean;
  complete: boolean;
  totalCount: number | null;
  loadedCount: number;
  reason?: string;
};

export type AnalyticsSourceResult<T> = AnalyticsSourceState & {
  rows: T[];
};

export type ReportCustomerProfile = {
  id: string;
  displayName?: string;
  createdAt?: string;
};

type MinimalOrderRow = {
  id?: string | null;
  order_ref?: string | null;
  customer_id?: string | null;
  items?: unknown;
  subtotal?: number | string | null;
  total?: number | string | null;
  discount_amount?: number | string | null;
  delivery_charge?: number | string | null;
  status?: string | null;
  archived_at?: string | null;
  created_at?: string | null;
  currency_code?: string | null;
};

type MinimalReviewRow = {
  id?: string | null;
  product_id?: string | null;
  product_slug?: string | null;
  rating?: number | string | null;
  status?: string | null;
  source_type?: string | null;
  verified_purchase?: boolean | string | null;
  is_approved?: boolean | string | null;
  is_featured?: boolean | string | null;
  created_at?: string | null;
  approved_at?: string | null;
};

type CustomerAccountRow = {
  id?: string | null;
  full_name?: string | null;
  created_at?: string | null;
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

function unavailable<T>(reason: string): AnalyticsSourceResult<T> {
  return { rows: [], available: false, complete: false, totalCount: null, loadedCount: 0, reason };
}

function contentRangeTotal(value: string | null) {
  if (!value) return null;
  const match = value.match(/\/(\d+|\*)$/);
  if (!match || match[1] === "*") return null;
  const parsed = Number(match[1]);
  return Number.isFinite(parsed) ? parsed : null;
}

async function fetchRestRows<T>(table: string, params: URLSearchParams): Promise<AnalyticsSourceResult<T>> {
  if (!hasSupabaseConfig()) return unavailable<T>("Supabase is not configured.");
  const rows: T[] = [];
  let totalCount: number | null = null;

  for (let from = 0; from < analyticsSourceRowLimit; from += 1000) {
    const to = Math.min(from + 999, analyticsSourceRowLimit - 1);
    const response = await fetch(supabaseEndpoint(`${table}?${params.toString()}`), {
      headers: supabaseHeaders({ prefer: "count=exact", range: `${from}-${to}` }),
      cache: "no-store",
    });
    if (!response.ok) return unavailable<T>(`${table} source is unavailable.`);
    totalCount ??= contentRangeTotal(response.headers.get("content-range"));
    const batch = (await response.json()) as T[];
    rows.push(...batch);
    if (batch.length < 1000) break;
  }

  const complete = totalCount === null ? rows.length < analyticsSourceRowLimit : totalCount <= rows.length;
  return {
    rows,
    available: true,
    complete,
    totalCount,
    loadedCount: rows.length,
    reason: complete ? undefined : `${table} source reached the ${analyticsSourceRowLimit.toLocaleString("en")} row extraction cap.`,
  };
}

function text(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function optionalText(value: unknown) {
  const result = text(value);
  return result || undefined;
}

function numberValue(value: unknown) {
  const parsed = typeof value === "number" ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function boolValue(value: unknown) {
  if (typeof value === "boolean") return value;
  if (typeof value === "string") return value.toLowerCase() === "true";
  return false;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function normalizeStatus(value: unknown): OrderStatus {
  return orderStatuses.includes(value as OrderStatus) ? (value as OrderStatus) : "Pending";
}

function normalizeItems(value: unknown): OrderCartItem[] {
  if (!Array.isArray(value)) return [];
  return value.filter(isRecord).map((item, index) => {
    const quantity = numberValue(item.quantity) ?? 0;
    const slug = text(item.slug);
    const productId = text(item.productId ?? item.product_id);
    const name = text(item.name) || slug || productId || "Unknown product";
    return {
      id: text(item.id) || `${index}`,
      productId: productId || undefined,
      slug: slug || productId || `snapshot-${index}`,
      name,
      price: numberValue(item.price) ?? 0,
      quantity,
      image: null,
      sku: optionalText(item.sku),
      lineTotal: numberValue(item.lineTotal ?? item.line_total),
    } as OrderCartItem;
  });
}

function itemCount(items: OrderCartItem[]) {
  return items.reduce((sum, item) => sum + (Number.isFinite(item.quantity) ? Math.max(0, item.quantity) : 0), 0);
}

function mapOrder(row: MinimalOrderRow): OrderRecord {
  const items = normalizeItems(row.items);
  const subtotal = numberValue(row.subtotal) ?? numberValue(row.total) ?? 0;
  return {
    orderId: text(row.order_ref) || text(row.id),
    orderReference: text(row.order_ref) || text(row.id),
    customerId: optionalText(row.customer_id),
    customer: { fullName: "", phone: "", cityArea: "", address: "" },
    paymentDetails: { paymentMethod: "Cash on Delivery" },
    items,
    totals: { totalItems: itemCount(items), subtotal },
    totalAmount: numberValue(row.total) ?? subtotal,
    discountAmount: numberValue(row.discount_amount),
    currencyCode: optionalText(row.currency_code),
    status: normalizeStatus(row.status),
    createdAt: row.created_at ?? "",
    deliveryCharge: numberValue(row.delivery_charge),
    archivedAt: row.archived_at ?? undefined,
  };
}

function reviewStatus(value: unknown): ReviewStatus {
  return value === "approved" || value === "rejected" || value === "hidden" || value === "pending" ? value : "pending";
}

function mapReview(row: MinimalReviewRow): ProductReview {
  const status = reviewStatus(row.status);
  const createdAt = row.created_at || new Date(0).toISOString();
  return {
    id: text(row.id),
    productId: text(row.product_id),
    productSlug: text(row.product_slug),
    customerName: "Customer",
    rating: Math.min(5, Math.max(0, numberValue(row.rating) ?? 0)),
    body: "",
    mediaUrls: [],
    status,
    sourceType: row.source_type === "order-linked" || row.source_type === "admin-added" || row.source_type === "imported" ? row.source_type : "imported",
    verifiedPurchase: boolValue(row.verified_purchase),
    isApproved: row.is_approved === undefined ? status === "approved" : boolValue(row.is_approved),
    isFeatured: boolValue(row.is_featured),
    createdAt,
    updatedAt: createdAt,
    approvedAt: optionalText(row.approved_at),
  };
}

export async function listAnalyticsOrders(fromIso: string, toIso: string) {
  const params = new URLSearchParams({
    select: analyticsOrderSelect,
    created_at: `gte.${fromIso}`,
    order: "created_at.asc,id.asc",
  });
  params.append("created_at", `lte.${toIso}`);
  const result = await fetchRestRows<MinimalOrderRow>("orders", params);
  return { ...result, rows: result.rows.map(mapOrder) };
}

export async function listAnalyticsCustomerAccounts(fromIso: string, toIso: string) {
  const params = new URLSearchParams({
    select: analyticsCustomerAccountSelect,
    created_at: `gte.${fromIso}`,
    order: "created_at.asc,id.asc",
  });
  params.append("created_at", `lte.${toIso}`);
  const result = await fetchRestRows<CustomerAccountRow>("customer_accounts", params);
  return {
    ...result,
    rows: result.rows.map((row) => ({ id: row.id ?? "", createdAt: row.created_at ?? undefined })).filter((row) => row.id),
  };
}

export async function listAnalyticsReviews(fromIso: string, toIso: string) {
  const params = new URLSearchParams({
    select: analyticsReviewSelect,
    created_at: `gte.${fromIso}`,
    order: "created_at.asc,id.asc",
  });
  params.append("created_at", `lte.${toIso}`);
  const result = await fetchRestRows<MinimalReviewRow>("product_reviews", params);
  return { ...result, rows: result.rows.map(mapReview) };
}

export async function listReportCustomerProfiles(fromIso: string, toIso: string, linkedIds: string[]) {
  const allUniqueIds = Array.from(new Set(linkedIds.filter(Boolean)));
  const linkedIdLimited = allUniqueIds.length > analyticsSourceRowLimit;
  const uniqueIds = allUniqueIds.slice(0, analyticsSourceRowLimit);
  const rangeParams = new URLSearchParams({
    select: reportCustomerProfileSelect,
    created_at: `gte.${fromIso}`,
    order: "created_at.asc,id.asc",
  });
  rangeParams.append("created_at", `lte.${toIso}`);
  const rangeResult = await fetchRestRows<CustomerAccountRow>("customer_accounts", rangeParams);

  const linkedRows: CustomerAccountRow[] = [];
  for (let index = 0; index < uniqueIds.length; index += 500) {
    const ids = uniqueIds.slice(index, index + 500);
    if (!ids.length) continue;
    const linkedParams = new URLSearchParams({
      select: reportCustomerProfileSelect,
      id: `in.(${ids.join(",")})`,
      order: "created_at.asc,id.asc",
    });
    const result = await fetchRestRows<CustomerAccountRow>("customer_accounts", linkedParams);
    if (!result.available || !result.complete) {
      return { ...result, rows: [] as ReportCustomerProfile[] };
    }
    linkedRows.push(...result.rows);
  }

  const profileMap = new Map<string, ReportCustomerProfile>();
  for (const row of [...rangeResult.rows, ...linkedRows]) {
    if (!row.id) continue;
    profileMap.set(row.id, { id: row.id, displayName: optionalText(row.full_name), createdAt: row.created_at ?? undefined });
  }
  return {
    rows: Array.from(profileMap.values()),
    available: rangeResult.available,
    complete: rangeResult.complete && !linkedIdLimited,
    totalCount: rangeResult.totalCount,
    loadedCount: profileMap.size,
    reason: rangeResult.reason ?? (linkedIdLimited ? `Customer profile source reached the ${analyticsSourceRowLimit.toLocaleString("en")} linked-account lookup cap.` : undefined),
  };
}
