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
export const adminV2TransactionExportLimit = 10000;
const paymentSelect = [
  "id",
  "reference",
  "order_ref",
  "amount",
  "currency_code",
  "payment_method",
  "external_reference",
  "source",
  "status",
  "occurred_at",
  "recorded_at",
  "voided_at",
  "void_reason",
].join(",");

type FinancePaymentTransactionRow = {
  id?: string | null;
  reference?: string | null;
  order_ref?: string | null;
  amount?: number | string | null;
  currency_code?: string | null;
  payment_method?: string | null;
  external_reference?: string | null;
  source?: string | null;
  status?: string | null;
  occurred_at?: string | null;
  recorded_at?: string | null;
  voided_at?: string | null;
  void_reason?: string | null;
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

export function mapAdminV2TransactionRow(row: FinancePaymentTransactionRow): AdminV2TransactionRow {
  const status = row.status === "recorded" || row.status === "void" ? row.status : "";
  return {
    id: text(row.id),
    orderReference: text(row.order_ref),
    customerName: "Not exposed",
    customerContact: "Not exposed",
    paymentMethod: text(row.payment_method) || "Not provided",
    walletProvider: "",
    paymentType: text(row.source) || "manual",
    paymentStatus: status === "recorded" ? "verified" : "",
    verificationStatus: status === "recorded" ? "Verified" : "",
    transactionReference: text(row.reference),
    paymentReference: text(row.external_reference),
    paidAmount: status === "recorded" ? numberValue(row.amount) : 0,
    dueAmount: null,
    refundedAmount: null,
    totalAmount: numberValue(row.amount),
    currencyCode: text(row.currency_code) || "BDT",
    orderStatus: status || "Not provided",
    createdAt: text(row.occurred_at) || text(row.recorded_at),
    paymentVerifiedAt: text(row.occurred_at) || text(row.recorded_at),
    refundExchangeRequest: text(row.void_reason),
  };
}

function appendFilter(params: string[], key: string, operator: string, value: string) {
  params.push(`${key}=${operator}.${encodeURIComponent(value)}`);
}

export function adminV2TransactionParams(query: AdminV2TransactionQuery, includeOrder = true) {
  const params = [`select=${paymentSelect}`];
  if (query.method !== "all") appendFilter(params, "payment_method", "eq", query.method);
  if (query.status !== "all") appendFilter(params, "status", "eq", query.status === "verified" ? "recorded" : query.status);
  if (query.from) appendFilter(params, "occurred_at", "gte", `${query.from}T00:00:00.000Z`);
  if (query.to) appendFilter(params, "occurred_at", "lte", `${query.to}T23:59:59.999Z`);
  if (query.q) {
    const safeSearch = query.q.replace(/[%,()]/g, " ").trim();
    if (safeSearch) {
      const encoded = encodeURIComponent(`*${safeSearch}*`);
      params.push(`or=(reference.ilike.${encoded},order_ref.ilike.${encoded},external_reference.ilike.${encoded})`);
    }
  }
  if (includeOrder) params.push("order=occurred_at.desc.nullslast,id.desc");
  return params;
}

async function fetchTransactionPage(query: AdminV2TransactionQuery) {
  const from = (query.page - 1) * query.pageSize;
  const to = from + query.pageSize - 1;
  const response = await fetch(supabaseEndpoint(`finance_payment_transactions?${adminV2TransactionParams(query).join("&")}`), {
    headers: { ...supabaseHeaders(), prefer: "count=exact", range: `${from}-${to}` },
    cache: "no-store",
  });
  if (!response.ok) throw new Error("Transactions ledger query failed.");
  const rows = ((await response.json()) as FinancePaymentTransactionRow[]).map(mapAdminV2TransactionRow);
  const count = Number((response.headers.get("content-range") ?? "").split("/")[1]);
  return { rows, totalCount: Number.isFinite(count) ? count : rows.length };
}

async function fetchMetricRows(query: AdminV2TransactionQuery) {
  const rows: AdminV2TransactionRow[] = [];
  let totalCount: number | null = null;
  for (let from = 0; from < maxMetricRows; from += 1000) {
    const to = Math.min(from + 999, maxMetricRows - 1);
    const response = await fetch(supabaseEndpoint(`finance_payment_transactions?${adminV2TransactionParams(query).join("&")}`), {
      headers: { ...supabaseHeaders(), prefer: "count=exact", range: `${from}-${to}` },
      cache: "no-store",
    });
    if (!response.ok) throw new Error("Transactions metrics query failed.");
    totalCount ??= Number((response.headers.get("content-range") ?? "").split("/")[1]);
    const batch = ((await response.json()) as FinancePaymentTransactionRow[]).map(mapAdminV2TransactionRow);
    rows.push(...batch);
    if (batch.length < 1000) break;
  }
  return { rows, capped: Number.isFinite(totalCount) ? Number(totalCount) > maxMetricRows : rows.length >= maxMetricRows };
}

export async function getAdminV2TransactionExportRows(searchParams = new URLSearchParams()) {
  const query = parseAdminV2TransactionQuery(searchParams);
  if (!hasSupabaseConfig()) return { ok: false as const, status: 503, errors: ["Payment transaction ledger is unavailable."] };
  const response = await fetch(supabaseEndpoint(`finance_payment_transactions?${adminV2TransactionParams(query).join("&")}`), {
    headers: { ...supabaseHeaders(), prefer: "count=exact", range: `0-${adminV2TransactionExportLimit - 1}` },
    cache: "no-store",
  });
  if (!response.ok) return { ok: false as const, status: 503, errors: ["Payment transaction export source is unavailable."] };
  const count = Number((response.headers.get("content-range") ?? "").split("/")[1]);
  if (Number.isFinite(count) && count > adminV2TransactionExportLimit) return { ok: false as const, status: 409, errors: ["Export exceeds the 10,000 row limit. Narrow the filters and retry."] };
  const rows = ((await response.json()) as FinancePaymentTransactionRow[]).map(mapAdminV2TransactionRow);
  return { ok: true as const, rows, query, rowCount: Number.isFinite(count) ? count : rows.length };
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
      limitation: "Supabase is not configured. Payment transaction ledger cannot be loaded from fake data.",
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
      limitation: metricRows.capped ? "Payment transaction ledger reached the safe server-side row cap." : null,
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
      limitation: "Payment transaction ledger could not be loaded.",
    };
  }
}
