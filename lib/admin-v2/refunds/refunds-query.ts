import "server-only";

import {
  adminV2RefundTotalPages,
  buildAdminV2RefundMetrics,
  parseAdminV2RefundQuery,
  type AdminV2RefundQuery,
  type AdminV2RefundQueryResult,
  type AdminV2RefundRow,
} from "@/lib/admin-v2/refunds/refund-metrics";

const maxMetricRows = 10000;
export const adminV2RefundExportLimit = 10000;
const refundSelect = [
  "id",
  "reference",
  "order_ref",
  "amount",
  "currency_code",
  "refund_method",
  "external_reference",
  "reason",
  "source",
  "status",
  "occurred_at",
  "recorded_at",
  "voided_at",
  "void_reason",
].join(",");

type FinanceRefundRow = {
  id?: string | null;
  reference?: string | null;
  order_ref?: string | null;
  amount?: number | string | null;
  currency_code?: string | null;
  refund_method?: string | null;
  external_reference?: string | null;
  reason?: string | null;
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
  if (value === null || value === undefined) return null;
  if (typeof value === "string" && value.trim() === "") return null;
  const parsed = typeof value === "number" ? value : Number(value);
  return Number.isFinite(parsed) ? Math.max(0, parsed) : null;
}

export function mapAdminV2RefundRow(row: FinanceRefundRow): AdminV2RefundRow {
  return {
    id: text(row.id),
    reference: text(row.reference) || text(row.external_reference) || "Not provided",
    orderReference: text(row.order_ref),
    amount: row.status === "recorded" ? numberValue(row.amount) : 0,
    currencyCode: text(row.currency_code) || "BDT",
    refundMethod: text(row.refund_method) || "Not provided",
    externalReference: text(row.external_reference),
    reason: text(row.reason),
    source: text(row.source) || "manual",
    status: text(row.status) || "Not provided",
    occurredAt: text(row.occurred_at) || text(row.recorded_at),
    recordedAt: text(row.recorded_at),
    voidedAt: text(row.voided_at),
    voidReason: text(row.void_reason),
  };
}

function appendFilter(params: string[], key: string, operator: string, value: string) {
  params.push(`${key}=${operator}.${encodeURIComponent(value)}`);
}

export function adminV2RefundParams(query: AdminV2RefundQuery, includeOrder = true) {
  const params = [`select=${refundSelect}`];
  if (query.method !== "all") appendFilter(params, "refund_method", "eq", query.method);
  if (query.status !== "all") appendFilter(params, "status", "eq", query.status);
  if (query.from) appendFilter(params, "occurred_at", "gte", `${query.from}T00:00:00.000Z`);
  if (query.to) appendFilter(params, "occurred_at", "lte", `${query.to}T23:59:59.999Z`);
  if (query.q) {
    const safeSearch = query.q.replace(/[%,()]/g, " ").trim();
    if (safeSearch) {
      const encoded = encodeURIComponent(`*${safeSearch}*`);
      params.push(`or=(reference.ilike.${encoded},order_ref.ilike.${encoded},external_reference.ilike.${encoded},reason.ilike.${encoded})`);
    }
  }
  if (includeOrder) params.push("order=occurred_at.desc.nullslast,id.desc");
  return params;
}

async function fetchRefundPage(query: AdminV2RefundQuery) {
  const from = (query.page - 1) * query.pageSize;
  const to = from + query.pageSize - 1;
  const response = await fetch(supabaseEndpoint(`finance_refunds?${adminV2RefundParams(query).join("&")}`), {
    headers: { ...supabaseHeaders(), prefer: "count=exact", range: `${from}-${to}` },
    cache: "no-store",
  });
  if (!response.ok) throw new Error("Refund ledger query failed.");
  const rows = ((await response.json()) as FinanceRefundRow[]).map(mapAdminV2RefundRow);
  const count = Number((response.headers.get("content-range") ?? "").split("/")[1]);
  return { rows, totalCount: Number.isFinite(count) ? count : rows.length };
}

async function fetchMetricRows(query: AdminV2RefundQuery) {
  const rows: AdminV2RefundRow[] = [];
  let totalCount: number | null = null;
  for (let from = 0; from < maxMetricRows; from += 1000) {
    const to = Math.min(from + 999, maxMetricRows - 1);
    const response = await fetch(supabaseEndpoint(`finance_refunds?${adminV2RefundParams(query).join("&")}`), {
      headers: { ...supabaseHeaders(), prefer: "count=exact", range: `${from}-${to}` },
      cache: "no-store",
    });
    if (!response.ok) throw new Error("Refund metrics query failed.");
    totalCount ??= Number((response.headers.get("content-range") ?? "").split("/")[1]);
    const batch = ((await response.json()) as FinanceRefundRow[]).map(mapAdminV2RefundRow);
    rows.push(...batch);
    if (batch.length < 1000) break;
  }
  return { rows, capped: Number.isFinite(totalCount) ? Number(totalCount) > maxMetricRows : rows.length >= maxMetricRows };
}

export async function getAdminV2RefundExportRows(searchParams = new URLSearchParams()) {
  const query = parseAdminV2RefundQuery(searchParams);
  if (!hasSupabaseConfig()) return { ok: false as const, status: 503, errors: ["Refund ledger is unavailable."] };
  const response = await fetch(supabaseEndpoint(`finance_refunds?${adminV2RefundParams(query).join("&")}`), {
    headers: { ...supabaseHeaders(), prefer: "count=exact", range: `0-${adminV2RefundExportLimit - 1}` },
    cache: "no-store",
  });
  if (!response.ok) return { ok: false as const, status: 503, errors: ["Refund export source is unavailable."] };
  const count = Number((response.headers.get("content-range") ?? "").split("/")[1]);
  if (Number.isFinite(count) && count > adminV2RefundExportLimit) return { ok: false as const, status: 409, errors: ["Export exceeds the 10,000 row limit. Narrow the filters and retry."] };
  const rows = ((await response.json()) as FinanceRefundRow[]).map(mapAdminV2RefundRow);
  return { ok: true as const, rows, query, rowCount: Number.isFinite(count) ? count : rows.length };
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
      limitation: "Supabase is not configured. Refund ledger cannot be loaded from fake data.",
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
      limitation: metricRows.capped ? "Refund ledger reached the safe server-side row cap." : null,
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
      limitation: "Refund ledger could not be loaded.",
    };
  }
}
