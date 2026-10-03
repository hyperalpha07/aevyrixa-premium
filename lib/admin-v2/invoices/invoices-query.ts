import "server-only";

import {
  adminV2InvoiceTotalPages,
  buildAdminV2InvoiceMetrics,
  parseAdminV2InvoiceQuery,
  type AdminV2InvoiceQuery,
  type AdminV2InvoiceDetailResult,
  type AdminV2InvoiceQueryResult,
  type AdminV2InvoiceRow,
} from "@/lib/admin-v2/invoices/invoice-metrics";

const maxMetricRows = 10000;

type SupabaseInvoiceRow = {
  id?: string | null;
  invoice_number?: string | null;
  order_ref?: string | null;
  status?: string | null;
  issued_at?: string | null;
  issued_by_admin_id?: string | null;
  issued_by?: string | null;
  subtotal_amount?: number | string | null;
  discount_amount?: number | string | null;
  delivery_amount?: number | string | null;
  total_amount?: number | string | null;
  currency_code?: string | null;
  snapshot?: unknown;
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

function numberValue(value: unknown) {
  const parsed = typeof value === "number" ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function record(value: unknown): Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value) ? value as Record<string, unknown> : {};
}

export function invoiceCustomerNameFromSnapshot(snapshot: unknown) {
  const root = record(snapshot);
  const customer = record(root.customer);
  return text(customer.name) || "Not provided";
}

export function mapAdminV2InvoiceRow(row: SupabaseInvoiceRow): AdminV2InvoiceRow {
  return {
    id: text(row.id),
    invoiceNumber: text(row.invoice_number),
    orderReference: text(row.order_ref),
    customerName: invoiceCustomerNameFromSnapshot(row.snapshot),
    status: row.status === "void" ? "void" : "issued",
    issuedAt: text(row.issued_at) || text(row.created_at),
    issuedBy: text(row.issued_by) || "Not provided",
    subtotalAmount: numberValue(row.subtotal_amount),
    discountAmount: numberValue(row.discount_amount),
    deliveryAmount: numberValue(row.delivery_amount),
    totalAmount: numberValue(row.total_amount),
    currencyCode: text(row.currency_code) || "BDT",
    createdAt: text(row.created_at) || text(row.issued_at),
    snapshot: record(row.snapshot),
  };
}

function appendFilter(params: string[], key: string, operator: string, value: string) {
  params.push(`${key}=${operator}.${encodeURIComponent(value)}`);
}

function invoiceParams(query: AdminV2InvoiceQuery, includeOrder = true) {
  const params = ["select=*"];
  if (query.status !== "all") appendFilter(params, "status", "eq", query.status);
  if (query.from) appendFilter(params, "issued_at", "gte", `${query.from}T00:00:00.000Z`);
  if (query.to) appendFilter(params, "issued_at", "lte", `${query.to}T23:59:59.999Z`);
  if (query.q) {
    const safeSearch = query.q.replace(/[%,()]/g, " ").trim();
    if (safeSearch) {
      const encoded = encodeURIComponent(`*${safeSearch}*`);
      params.push(`or=(invoice_number.ilike.${encoded},order_ref.ilike.${encoded})`);
    }
  }
  if (includeOrder) params.push("order=issued_at.desc.nullslast");
  return params;
}

async function fetchInvoicePage(query: AdminV2InvoiceQuery) {
  const from = (query.page - 1) * query.pageSize;
  const to = from + query.pageSize - 1;
  const response = await fetch(supabaseEndpoint(`invoices?${invoiceParams(query).join("&")}`), {
    headers: {
      ...supabaseHeaders(),
      prefer: "count=exact",
      range: `${from}-${to}`,
    },
    cache: "no-store",
  });
  if (!response.ok) throw new Error(`Invoice query failed with ${response.status}.`);
  const rows = ((await response.json()) as SupabaseInvoiceRow[]).map(mapAdminV2InvoiceRow);
  const count = Number((response.headers.get("content-range") ?? "").split("/")[1]);
  return { rows, totalCount: Number.isFinite(count) ? count : rows.length };
}

async function fetchMetricRows(query: AdminV2InvoiceQuery) {
  const rows: AdminV2InvoiceRow[] = [];
  for (let from = 0; from < maxMetricRows; from += 1000) {
    const to = Math.min(from + 999, maxMetricRows - 1);
    const response = await fetch(supabaseEndpoint(`invoices?${invoiceParams(query).join("&")}`), {
      headers: { ...supabaseHeaders(), range: `${from}-${to}` },
      cache: "no-store",
    });
    if (!response.ok) throw new Error(`Invoice metrics query failed with ${response.status}.`);
    const batch = ((await response.json()) as SupabaseInvoiceRow[]).map(mapAdminV2InvoiceRow);
    rows.push(...batch);
    if (batch.length < 1000) break;
  }
  return { rows, capped: rows.length >= maxMetricRows };
}

export async function getAdminV2Invoices(searchParams = new URLSearchParams()): Promise<AdminV2InvoiceQueryResult> {
  const query = parseAdminV2InvoiceQuery(searchParams);
  if (!hasSupabaseConfig()) {
    return {
      rows: [],
      metrics: buildAdminV2InvoiceMetrics([]),
      query,
      totalCount: 0,
      totalPages: 1,
      storageAvailable: false,
      limitation: "Supabase is not configured. Invoices cannot be loaded from fake data.",
    };
  }

  try {
    const [page, metricRows] = await Promise.all([fetchInvoicePage(query), fetchMetricRows(query)]);
    return {
      rows: page.rows,
      metrics: buildAdminV2InvoiceMetrics(metricRows.rows),
      query,
      totalCount: page.totalCount,
      totalPages: adminV2InvoiceTotalPages(page.totalCount, query.pageSize),
      storageAvailable: true,
      limitation: metricRows.capped ? "Invoice metrics reached the safe server-side row cap." : null,
    };
  } catch {
    return {
      rows: [],
      metrics: buildAdminV2InvoiceMetrics([]),
      query,
      totalCount: 0,
      totalPages: 1,
      storageAvailable: false,
      limitation: "Invoices could not be loaded from the existing invoice backend.",
    };
  }
}

export async function getAdminV2InvoiceByNumber(invoiceNumber: string): Promise<AdminV2InvoiceDetailResult> {
  const cleanInvoiceNumber = text(invoiceNumber).slice(0, 160);
  if (!cleanInvoiceNumber) {
    return {
      invoice: null,
      storageAvailable: true,
      limitation: "Invoice number is required.",
    };
  }

  if (!hasSupabaseConfig()) {
    return {
      invoice: null,
      storageAvailable: false,
      limitation: "Supabase is not configured. Invoices cannot be loaded from fake data.",
    };
  }

  try {
    const response = await fetch(
      supabaseEndpoint(`invoices?select=*&invoice_number=eq.${encodeURIComponent(cleanInvoiceNumber)}&limit=1`),
      {
        headers: supabaseHeaders(),
        cache: "no-store",
      }
    );
    if (!response.ok) throw new Error(`Invoice detail query failed with ${response.status}.`);
    const rows = (await response.json()) as SupabaseInvoiceRow[];
    return {
      invoice: rows[0] ? mapAdminV2InvoiceRow(rows[0]) : null,
      storageAvailable: true,
      limitation: null,
    };
  } catch {
    return {
      invoice: null,
      storageAvailable: false,
      limitation: "Invoice could not be loaded from the existing invoice backend.",
    };
  }
}
