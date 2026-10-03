import type { OrderInvoiceStatus } from "@/app/lib/order-types";

export const adminV2InvoiceStatuses = ["issued", "void"] as const;
export type AdminV2InvoiceStatus = (typeof adminV2InvoiceStatuses)[number];
export type AdminV2InvoiceStatusFilter = AdminV2InvoiceStatus | "all";

export type AdminV2InvoiceQuery = {
  q: string;
  status: AdminV2InvoiceStatusFilter;
  from: string;
  to: string;
  page: number;
  pageSize: number;
};

export type AdminV2InvoiceRow = {
  id: string;
  invoiceNumber: string;
  orderReference: string;
  customerName: string;
  status: OrderInvoiceStatus;
  issuedAt: string;
  issuedBy: string;
  subtotalAmount: number;
  discountAmount: number;
  deliveryAmount: number;
  totalAmount: number;
  currencyCode: string;
  createdAt: string;
  snapshot: Record<string, unknown>;
};

export type AdminV2InvoiceDetailResult = {
  invoice: AdminV2InvoiceRow | null;
  storageAvailable: boolean;
  limitation: string | null;
};

export type AdminV2InvoiceMetrics = {
  issuedInvoices: number;
  totalInvoicedValue: number;
  issuedThisMonth: number;
  voidInvoices: number;
};

export type AdminV2InvoiceQueryResult = {
  rows: AdminV2InvoiceRow[];
  metrics: AdminV2InvoiceMetrics;
  query: AdminV2InvoiceQuery;
  totalCount: number;
  totalPages: number;
  storageAvailable: boolean;
  limitation: string | null;
};

const defaultPageSize = 20;
const maxPageSize = 50;

function positiveInt(value: string | null, fallback: number) {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
}

function cleanDate(value: string | null) {
  if (!value) return "";
  return /^\d{4}-\d{2}-\d{2}$/.test(value) ? value : "";
}

export function parseAdminV2InvoiceQuery(searchParams: URLSearchParams): AdminV2InvoiceQuery {
  const statusValue = searchParams.get("status");
  const pageSize = Math.min(maxPageSize, positiveInt(searchParams.get("pageSize") ?? searchParams.get("rowsPerPage"), defaultPageSize));
  const status: AdminV2InvoiceStatusFilter =
    statusValue === "issued" || statusValue === "void" ? statusValue : "all";

  return {
    q: (searchParams.get("q") ?? "").trim().slice(0, 120),
    status,
    from: cleanDate(searchParams.get("from")),
    to: cleanDate(searchParams.get("to")),
    page: positiveInt(searchParams.get("page"), 1),
    pageSize,
  };
}

export function adminV2InvoiceTotalPages(totalCount: number, pageSize: number) {
  return Math.max(1, Math.ceil(Math.max(0, totalCount) / Math.max(1, pageSize)));
}

function isThisMonth(issuedAt: string, now = new Date()) {
  const date = new Date(issuedAt);
  return Number.isFinite(date.getTime()) && date.getUTCFullYear() === now.getUTCFullYear() && date.getUTCMonth() === now.getUTCMonth();
}

export function buildAdminV2InvoiceMetrics(rows: AdminV2InvoiceRow[], now = new Date()): AdminV2InvoiceMetrics {
  return rows.reduce(
    (metrics, row) => {
      if (row.status === "issued") {
        metrics.issuedInvoices += 1;
        metrics.totalInvoicedValue += Number.isFinite(row.totalAmount) ? Math.max(0, row.totalAmount) : 0;
        if (isThisMonth(row.issuedAt, now)) metrics.issuedThisMonth += 1;
      }
      if (row.status === "void") metrics.voidInvoices += 1;
      return metrics;
    },
    { issuedInvoices: 0, totalInvoicedValue: 0, issuedThisMonth: 0, voidInvoices: 0 }
  );
}
