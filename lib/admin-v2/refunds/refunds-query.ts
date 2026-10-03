import "server-only";

import type { OrderRecord, PaymentStatus } from "@/app/lib/order-types";
import { getAdminV2OrderAmounts } from "@/lib/admin-v2/orders/order-amounts";
import {
  adminV2RefundTotalPages,
  buildAdminV2RefundMetrics,
  classifyAdminV2Refund,
  hasAdminV2RefundSignal,
  parseAdminV2RefundQuery,
  type AdminV2RefundQuery,
  type AdminV2RefundQueryResult,
  type AdminV2RefundRow,
} from "@/lib/admin-v2/refunds/refund-metrics";

const maxMetricRows = 10000;
const orderSelect = [
  "id",
  "order_ref",
  "customer_name",
  "customer_phone",
  "customer_email",
  "subtotal",
  "total",
  "discount_amount",
  "delivery_charge",
  "paid_amount",
  "refunded_amount",
  "currency_code",
  "payment_method",
  "wallet_provider",
  "payment_type",
  "transaction_id",
  "payment_status",
  "payment_reference",
  "refund_exchange_request",
  "status",
  "created_at",
  "updated_at",
  "archived_at",
].join(",");

type SupabaseRefundOrderRow = {
  id?: string | null;
  order_ref?: string | null;
  customer_name?: string | null;
  customer_phone?: string | null;
  customer_email?: string | null;
  subtotal?: number | string | null;
  total?: number | string | null;
  discount_amount?: number | string | null;
  delivery_charge?: number | string | null;
  paid_amount?: number | string | null;
  refunded_amount?: number | string | null;
  currency_code?: string | null;
  payment_method?: string | null;
  wallet_provider?: string | null;
  payment_type?: string | null;
  transaction_id?: string | null;
  payment_status?: string | null;
  payment_reference?: string | null;
  refund_exchange_request?: string | null;
  status?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
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

function text(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function numberValue(value: unknown): number | null {
  const parsed = typeof value === "number" ? value : Number(value);
  return Number.isFinite(parsed) ? Math.max(0, parsed) : null;
}

function paymentStatus(value: unknown): PaymentStatus | "" {
  return value === "pending" || value === "verified" || value === "failed" || value === "refunded" ? value : "";
}

function minimalOrder(row: SupabaseRefundOrderRow): OrderRecord {
  return {
    orderId: text(row.order_ref),
    orderReference: text(row.order_ref),
    customer: {
      fullName: text(row.customer_name),
      phone: text(row.customer_phone),
      email: text(row.customer_email) || undefined,
      cityArea: "",
      address: "",
    },
    paymentDetails: {
      paymentMethod: text(row.payment_method) as OrderRecord["paymentDetails"]["paymentMethod"],
      walletProvider: text(row.wallet_provider) as OrderRecord["paymentDetails"]["walletProvider"],
      paymentType: text(row.payment_type) as OrderRecord["paymentDetails"]["paymentType"],
      transactionReference: text(row.transaction_id) || undefined,
    },
    items: [],
    totals: { totalItems: 0, subtotal: numberValue(row.subtotal) ?? 0 },
    totalAmount: numberValue(row.total) ?? 0,
    discountAmount: numberValue(row.discount_amount) ?? undefined,
    paidAmount: numberValue(row.paid_amount) ?? undefined,
    refundedAmount: numberValue(row.refunded_amount) ?? undefined,
    currencyCode: text(row.currency_code) || "BDT",
    status: (text(row.status) || "Pending") as OrderRecord["status"],
    createdAt: text(row.created_at),
    updatedAt: text(row.updated_at) || undefined,
    deliveryCharge: numberValue(row.delivery_charge) ?? undefined,
    paymentStatus: paymentStatus(row.payment_status) || undefined,
    paymentReference: text(row.payment_reference) || undefined,
    refundExchangeRequest: text(row.refund_exchange_request) || undefined,
  };
}

export function mapAdminV2RefundRow(row: SupabaseRefundOrderRow): AdminV2RefundRow {
  const order = minimalOrder(row);
  const amounts = getAdminV2OrderAmounts(order);
  const status = paymentStatus(row.payment_status);
  const requestNote = text(row.refund_exchange_request);
  const refundedAmount = numberValue(row.refunded_amount);
  const classification = classifyAdminV2Refund({
    refundedAmount,
    payableAmount: amounts.total,
    paymentStatus: status,
    requestNote,
  });

  return {
    id: text(row.id),
    orderReference: text(row.order_ref),
    customerName: text(row.customer_name) || "Not provided",
    customerContact: text(row.customer_phone) || text(row.customer_email) || "Not provided",
    classification,
    paymentStatus: status,
    paymentMethod: text(row.payment_method) || "Not provided",
    walletProvider: text(row.wallet_provider),
    paymentType: text(row.payment_type),
    reference: text(row.payment_reference) || text(row.transaction_id) || "Not provided",
    requestNote,
    refundedAmount,
    payableAmount: amounts.total,
    currencyCode: text(row.currency_code) || "BDT",
    orderStatus: text(row.status) || "Not provided",
    createdAt: text(row.created_at),
    updatedAt: text(row.updated_at),
  };
}

function appendFilter(params: string[], key: string, operator: string, value: string) {
  params.push(`${key}=${operator}.${encodeURIComponent(value)}`);
}

function refundSignalFilter() {
  return "or=(payment_status.eq.refunded,refunded_amount.gt.0,refund_exchange_request.not.is.null)";
}

function refundParams(query: AdminV2RefundQuery, includeOrder = true) {
  const params = [`select=${orderSelect}`, "archived_at=is.null", refundSignalFilter()];
  if (query.method !== "all") appendFilter(params, "payment_method", "eq", query.method);
  if (query.from) appendFilter(params, "created_at", "gte", `${query.from}T00:00:00.000Z`);
  if (query.to) appendFilter(params, "created_at", "lte", `${query.to}T23:59:59.999Z`);
  if (query.q) {
    const safeSearch = query.q.replace(/[%,()]/g, " ").trim();
    if (safeSearch) {
      const encoded = encodeURIComponent(`*${safeSearch}*`);
      params.push(
        `or=(order_ref.ilike.${encoded},customer_name.ilike.${encoded},customer_phone.ilike.${encoded},customer_email.ilike.${encoded},payment_reference.ilike.${encoded},transaction_id.ilike.${encoded},refund_exchange_request.ilike.${encoded})`
      );
    }
  }
  if (includeOrder) params.push("order=created_at.desc.nullslast");
  return params;
}

function filterRowsForTruthfulSignals(rows: AdminV2RefundRow[], query: AdminV2RefundQuery) {
  return rows.filter((row) => {
    if (!hasAdminV2RefundSignal(row)) return false;
    if (query.classification !== "all" && row.classification !== query.classification) return false;
    return true;
  });
}

async function fetchRefundPage(query: AdminV2RefundQuery) {
  const rows: AdminV2RefundRow[] = [];
  let dbCount = 0;
  const target = query.page * query.pageSize;

  for (let from = 0; rows.length < target && from < maxMetricRows; from += 1000) {
    const to = Math.min(from + 999, maxMetricRows - 1);
    const response = await fetch(supabaseEndpoint(`orders?${refundParams(query).join("&")}`), {
      headers: {
        ...supabaseHeaders(),
        prefer: "count=exact",
        range: `${from}-${to}`,
      },
      cache: "no-store",
    });
    if (!response.ok) throw new Error(`Refunds order query failed with ${response.status}.`);
    const rawRows = (await response.json()) as SupabaseRefundOrderRow[];
    const batch = filterRowsForTruthfulSignals(rawRows.map(mapAdminV2RefundRow), query);
    rows.push(...batch);
    const count = Number((response.headers.get("content-range") ?? "").split("/")[1]);
    if (Number.isFinite(count)) dbCount = count;
    if (rawRows.length < 1000 || (dbCount > 0 && to + 1 >= dbCount)) break;
  }

  const fromIndex = (query.page - 1) * query.pageSize;
  return {
    rows: rows.slice(fromIndex, fromIndex + query.pageSize),
    totalCount: query.classification === "all" ? dbCount : rows.length,
    capped: rows.length >= maxMetricRows,
  };
}

async function fetchMetricRows(query: AdminV2RefundQuery) {
  const rows: AdminV2RefundRow[] = [];
  for (let from = 0; from < maxMetricRows; from += 1000) {
    const to = Math.min(from + 999, maxMetricRows - 1);
    const response = await fetch(supabaseEndpoint(`orders?${refundParams(query).join("&")}`), {
      headers: { ...supabaseHeaders(), range: `${from}-${to}` },
      cache: "no-store",
    });
    if (!response.ok) throw new Error(`Refunds metrics query failed with ${response.status}.`);
    const rawRows = (await response.json()) as SupabaseRefundOrderRow[];
    const batch = filterRowsForTruthfulSignals(rawRows.map(mapAdminV2RefundRow), query);
    rows.push(...batch);
    if (rawRows.length < 1000) break;
  }
  return { rows, capped: rows.length >= maxMetricRows };
}

export async function getAdminV2Refunds(searchParams = new URLSearchParams()): Promise<AdminV2RefundQueryResult> {
  const query = parseAdminV2RefundQuery(searchParams);
  if (!hasSupabaseConfig()) {
    return {
      rows: [],
      metrics: buildAdminV2RefundMetrics([]),
      query,
      totalCount: 0,
      totalPages: 1,
      storageAvailable: false,
      queryFailed: true,
      limitation: "Supabase is not configured. Refund reconciliation cannot be loaded from fake refund data.",
    };
  }

  try {
    const [page, metricRows] = await Promise.all([fetchRefundPage(query), fetchMetricRows(query)]);
    return {
      rows: page.rows,
      metrics: buildAdminV2RefundMetrics(metricRows.rows),
      query,
      totalCount: page.totalCount,
      totalPages: adminV2RefundTotalPages(page.totalCount, query.pageSize),
      storageAvailable: true,
      queryFailed: false,
      limitation: page.capped || metricRows.capped ? "Refund reconciliation reached the safe server-side row cap." : null,
    };
  } catch {
    return {
      rows: [],
      metrics: buildAdminV2RefundMetrics([]),
      query,
      totalCount: 0,
      totalPages: 1,
      storageAvailable: false,
      queryFailed: true,
      limitation: "Refund reconciliation could not be loaded from the existing order payment backend.",
    };
  }
}
