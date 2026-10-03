import "server-only";

import {
  adminV2TransactionTotalPages,
  buildAdminV2TransactionMetrics,
  parseAdminV2TransactionQuery,
  type AdminV2TransactionQuery,
  type AdminV2TransactionQueryResult,
  type AdminV2TransactionRow,
} from "@/lib/admin-v2/transactions/transaction-metrics";

const maxMetricRows = 10000;
const orderSelect = [
  "id",
  "order_ref",
  "customer_name",
  "customer_phone",
  "customer_email",
  "total",
  "paid_amount",
  "due_amount",
  "refunded_amount",
  "currency_code",
  "payment_method",
  "wallet_provider",
  "payment_type",
  "transaction_id",
  "payment_status",
  "payment_verified_at",
  "payment_verification_status",
  "payment_reference",
  "refund_exchange_request",
  "status",
  "created_at",
  "archived_at",
].join(",");

type SupabaseTransactionOrderRow = {
  id?: string | null;
  order_ref?: string | null;
  customer_name?: string | null;
  customer_phone?: string | null;
  customer_email?: string | null;
  total?: number | string | null;
  paid_amount?: number | string | null;
  due_amount?: number | string | null;
  refunded_amount?: number | string | null;
  currency_code?: string | null;
  payment_method?: string | null;
  wallet_provider?: string | null;
  payment_type?: string | null;
  transaction_id?: string | null;
  payment_status?: string | null;
  payment_verified_at?: string | null;
  payment_verification_status?: string | null;
  payment_reference?: string | null;
  refund_exchange_request?: string | null;
  status?: string | null;
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

function text(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function numberValue(value: unknown): number | null {
  const parsed = typeof value === "number" ? value : Number(value);
  return Number.isFinite(parsed) ? Math.max(0, parsed) : null;
}

function paymentStatus(value: unknown): AdminV2TransactionRow["paymentStatus"] {
  return value === "pending" || value === "verified" || value === "failed" || value === "refunded" ? value : "";
}

function verificationStatus(value: unknown): AdminV2TransactionRow["verificationStatus"] {
  return value === "Pending" || value === "Verified" || value === "Failed" || value === "Not Required" ? value : "";
}

export function mapAdminV2TransactionRow(row: SupabaseTransactionOrderRow): AdminV2TransactionRow {
  return {
    id: text(row.id),
    orderReference: text(row.order_ref),
    customerName: text(row.customer_name) || "Not provided",
    customerContact: text(row.customer_phone) || text(row.customer_email) || "Not provided",
    paymentMethod: text(row.payment_method) || "Not provided",
    walletProvider: text(row.wallet_provider),
    paymentType: text(row.payment_type),
    paymentStatus: paymentStatus(row.payment_status),
    verificationStatus: verificationStatus(row.payment_verification_status),
    transactionReference: text(row.transaction_id),
    paymentReference: text(row.payment_reference),
    paidAmount: numberValue(row.paid_amount),
    dueAmount: numberValue(row.due_amount),
    refundedAmount: numberValue(row.refunded_amount),
    totalAmount: numberValue(row.total),
    currencyCode: text(row.currency_code) || "BDT",
    orderStatus: text(row.status) || "Not provided",
    createdAt: text(row.created_at),
    paymentVerifiedAt: text(row.payment_verified_at),
    refundExchangeRequest: text(row.refund_exchange_request),
  };
}

function appendFilter(params: string[], key: string, operator: string, value: string) {
  params.push(`${key}=${operator}.${encodeURIComponent(value)}`);
}

function transactionParams(query: AdminV2TransactionQuery, includeOrder = true) {
  const params = [`select=${orderSelect}`, "archived_at=is.null"];
  if (query.method !== "all") appendFilter(params, "payment_method", "eq", query.method);
  if (query.status !== "all") appendFilter(params, "payment_status", "eq", query.status);
  if (query.verification !== "all") appendFilter(params, "payment_verification_status", "eq", query.verification);
  if (query.from) appendFilter(params, "created_at", "gte", `${query.from}T00:00:00.000Z`);
  if (query.to) appendFilter(params, "created_at", "lte", `${query.to}T23:59:59.999Z`);
  if (query.q) {
    const safeSearch = query.q.replace(/[%,()]/g, " ").trim();
    if (safeSearch) {
      const encoded = encodeURIComponent(`*${safeSearch}*`);
      params.push(
        `or=(order_ref.ilike.${encoded},customer_name.ilike.${encoded},customer_phone.ilike.${encoded},customer_email.ilike.${encoded},transaction_id.ilike.${encoded},payment_reference.ilike.${encoded})`
      );
    }
  }
  if (includeOrder) params.push("order=created_at.desc.nullslast");
  return params;
}

async function fetchTransactionPage(query: AdminV2TransactionQuery) {
  const from = (query.page - 1) * query.pageSize;
  const to = from + query.pageSize - 1;
  const response = await fetch(supabaseEndpoint(`orders?${transactionParams(query).join("&")}`), {
    headers: {
      ...supabaseHeaders(),
      prefer: "count=exact",
      range: `${from}-${to}`,
    },
    cache: "no-store",
  });
  if (!response.ok) throw new Error(`Transactions order-payment query failed with ${response.status}.`);
  const rows = ((await response.json()) as SupabaseTransactionOrderRow[]).map(mapAdminV2TransactionRow);
  const count = Number((response.headers.get("content-range") ?? "").split("/")[1]);
  return { rows, totalCount: Number.isFinite(count) ? count : rows.length };
}

async function fetchMetricRows(query: AdminV2TransactionQuery) {
  const rows: AdminV2TransactionRow[] = [];
  for (let from = 0; from < maxMetricRows; from += 1000) {
    const to = Math.min(from + 999, maxMetricRows - 1);
    const response = await fetch(supabaseEndpoint(`orders?${transactionParams(query).join("&")}`), {
      headers: { ...supabaseHeaders(), range: `${from}-${to}` },
      cache: "no-store",
    });
    if (!response.ok) throw new Error(`Transactions metrics query failed with ${response.status}.`);
    const batch = ((await response.json()) as SupabaseTransactionOrderRow[]).map(mapAdminV2TransactionRow);
    rows.push(...batch);
    if (batch.length < 1000) break;
  }
  return { rows, capped: rows.length >= maxMetricRows };
}

export async function getAdminV2Transactions(searchParams = new URLSearchParams()): Promise<AdminV2TransactionQueryResult> {
  const query = parseAdminV2TransactionQuery(searchParams);
  if (!hasSupabaseConfig()) {
    return {
      rows: [],
      metrics: buildAdminV2TransactionMetrics([]),
      query,
      totalCount: 0,
      totalPages: 1,
      storageAvailable: false,
      queryFailed: true,
      limitation: "Supabase is not configured. Payment reconciliation cannot be loaded from fake transaction data.",
    };
  }

  try {
    const [page, metricRows] = await Promise.all([fetchTransactionPage(query), fetchMetricRows(query)]);
    return {
      rows: page.rows,
      metrics: buildAdminV2TransactionMetrics(metricRows.rows),
      query,
      totalCount: page.totalCount,
      totalPages: adminV2TransactionTotalPages(page.totalCount, query.pageSize),
      storageAvailable: true,
      queryFailed: false,
      limitation: metricRows.capped ? "Payment reconciliation metrics reached the safe server-side row cap." : null,
    };
  } catch {
    return {
      rows: [],
      metrics: buildAdminV2TransactionMetrics([]),
      query,
      totalCount: 0,
      totalPages: 1,
      storageAvailable: false,
      queryFailed: true,
      limitation: "Payment reconciliation could not be loaded from the existing order payment backend.",
    };
  }
}
