import "server-only";

import {
  adminV2ExpenseTotalPages,
  buildAdminV2ExpenseMetrics,
  parseAdminV2ExpenseQuery,
  type AdminV2ExpenseQuery,
  type AdminV2ExpenseQueryResult,
  type AdminV2ExpenseRow,
} from "@/lib/admin-v2/expenses/expense-metrics";

const maxMetricRows = 10000;
export const adminV2ExpenseExportLimit = 10000;
const expenseSelect = "id,reference,occurred_at,category,amount,currency_code,payee,payment_method,description,order_ref,status";

type FinanceExpenseRow = {
  id?: string | null;
  reference?: string | null;
  occurred_at?: string | null;
  category?: string | null;
  amount?: number | string | null;
  currency_code?: string | null;
  payee?: string | null;
  payment_method?: string | null;
  description?: string | null;
  order_ref?: string | null;
  status?: string | null;
};

function hasSupabaseConfig() {
  return Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY);
}

function supabaseHeaders(extra: Record<string, string> = {}) {
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";
  return { apikey: serviceRoleKey, Authorization: `Bearer ${serviceRoleKey}`, "content-type": "application/json", ...extra };
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

export function mapAdminV2ExpenseRow(row: FinanceExpenseRow): AdminV2ExpenseRow {
  return {
    id: text(row.id),
    reference: text(row.reference),
    occurredAt: text(row.occurred_at),
    category: text(row.category),
    amount: numberValue(row.amount),
    currencyCode: text(row.currency_code) || "BDT",
    payee: text(row.payee) || "Not provided",
    paymentMethod: text(row.payment_method) || "Not provided",
    description: text(row.description),
    orderReference: text(row.order_ref),
    status: row.status === "active" || row.status === "void" ? row.status : "",
  };
}

function appendFilter(params: string[], key: string, operator: string, value: string) {
  params.push(`${key}=${operator}.${encodeURIComponent(value)}`);
}

export function adminV2ExpenseParams(query: AdminV2ExpenseQuery, includeOrder = true) {
  const params = [`select=${expenseSelect}`];
  if (query.category !== "all") appendFilter(params, "category", "eq", query.category);
  if (query.status !== "all") appendFilter(params, "status", "eq", query.status);
  if (query.from) appendFilter(params, "occurred_at", "gte", `${query.from}T00:00:00.000Z`);
  if (query.to) appendFilter(params, "occurred_at", "lte", `${query.to}T23:59:59.999Z`);
  if (query.q) {
    const safeSearch = query.q.replace(/[%,()]/g, " ").trim();
    if (safeSearch) {
      const encoded = encodeURIComponent(`*${safeSearch}*`);
      params.push(`or=(reference.ilike.${encoded},order_ref.ilike.${encoded},payee.ilike.${encoded},description.ilike.${encoded})`);
    }
  }
  if (includeOrder) params.push("order=occurred_at.desc,id.desc");
  return params;
}

async function fetchExpensePage(query: AdminV2ExpenseQuery) {
  const from = (query.page - 1) * query.pageSize;
  const to = from + query.pageSize - 1;
  const response = await fetch(supabaseEndpoint(`finance_expenses?${adminV2ExpenseParams(query).join("&")}`), {
    headers: { ...supabaseHeaders(), prefer: "count=exact", range: `${from}-${to}` },
    cache: "no-store",
  });
  if (!response.ok) throw new Error("Expenses ledger query failed.");
  const rows = ((await response.json()) as FinanceExpenseRow[]).map(mapAdminV2ExpenseRow);
  const count = Number((response.headers.get("content-range") ?? "").split("/")[1]);
  return { rows, totalCount: Number.isFinite(count) ? count : rows.length };
}

async function fetchMetricRows(query: AdminV2ExpenseQuery) {
  const rows: AdminV2ExpenseRow[] = [];
  let totalCount: number | null = null;
  for (let from = 0; from < maxMetricRows; from += 1000) {
    const to = Math.min(from + 999, maxMetricRows - 1);
    const response = await fetch(supabaseEndpoint(`finance_expenses?${adminV2ExpenseParams(query).join("&")}`), {
      headers: { ...supabaseHeaders(), prefer: "count=exact", range: `${from}-${to}` },
      cache: "no-store",
    });
    if (!response.ok) throw new Error("Expenses metrics query failed.");
    totalCount ??= Number((response.headers.get("content-range") ?? "").split("/")[1]);
    const batch = ((await response.json()) as FinanceExpenseRow[]).map(mapAdminV2ExpenseRow);
    rows.push(...batch);
    if (batch.length < 1000) break;
  }
  return { rows, capped: Number.isFinite(totalCount) ? Number(totalCount) > maxMetricRows : rows.length >= maxMetricRows };
}

export async function getAdminV2ExpenseExportRows(searchParams = new URLSearchParams()) {
  const query = parseAdminV2ExpenseQuery(searchParams);
  if (!hasSupabaseConfig()) return { ok: false as const, status: 503, errors: ["Expense ledger is unavailable."] };
  const response = await fetch(supabaseEndpoint(`finance_expenses?${adminV2ExpenseParams(query).join("&")}`), {
    headers: { ...supabaseHeaders(), prefer: "count=exact", range: `0-${adminV2ExpenseExportLimit - 1}` },
    cache: "no-store",
  });
  if (!response.ok) return { ok: false as const, status: 503, errors: ["Expense export source is unavailable."] };
  const count = Number((response.headers.get("content-range") ?? "").split("/")[1]);
  if (Number.isFinite(count) && count > adminV2ExpenseExportLimit) return { ok: false as const, status: 409, errors: ["Export exceeds the 10,000 row limit. Narrow the filters and retry."] };
  const rows = ((await response.json()) as FinanceExpenseRow[]).map(mapAdminV2ExpenseRow);
  return { ok: true as const, rows, query, rowCount: Number.isFinite(count) ? count : rows.length };
}

export async function getAdminV2Expenses(searchParams = new URLSearchParams()): Promise<AdminV2ExpenseQueryResult> {
  const query = parseAdminV2ExpenseQuery(searchParams);
  if (!hasSupabaseConfig()) {
    return {
      rows: [],
      metrics: buildAdminV2ExpenseMetrics([]),
      query,
      totalCount: 0,
      totalPages: 1,
      storageAvailable: false,
      queryFailed: true,
      limitation: "Supabase is not configured. Expense ledger cannot be loaded from fake data.",
    };
  }
  try {
    const [page, metricRows] = await Promise.all([fetchExpensePage(query), fetchMetricRows(query)]);
    return {
      rows: page.rows,
      metrics: buildAdminV2ExpenseMetrics(metricRows.rows),
      query,
      totalCount: page.totalCount,
      totalPages: adminV2ExpenseTotalPages(page.totalCount, query.pageSize),
      storageAvailable: true,
      queryFailed: false,
      limitation: metricRows.capped ? "Expense ledger reached the safe server-side row cap." : null,
    };
  } catch {
    return {
      rows: [],
      metrics: buildAdminV2ExpenseMetrics([]),
      query,
      totalCount: 0,
      totalPages: 1,
      storageAvailable: false,
      queryFailed: true,
      limitation: "Expense ledger could not be loaded.",
    };
  }
}
