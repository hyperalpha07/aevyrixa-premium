import type { PaymentMethod } from "@/app/lib/order-types";
import { buildAdminV2MoneyAggregate, type AdminV2MoneyAggregate } from "@/lib/admin-v2/finance/money";

export const adminV2TransactionPaymentMethods = [
  "Cash on Delivery",
  "Mobile Wallet Payment",
  "Bank Transfer",
] as const satisfies readonly PaymentMethod[];

export const adminV2TransactionLedgerStatuses = ["recorded", "void"] as const;

export type AdminV2TransactionMethodFilter = PaymentMethod | "all";
export type AdminV2TransactionStatusFilter = typeof adminV2TransactionLedgerStatuses[number] | "all";

export type AdminV2TransactionQuery = {
  q: string;
  method: AdminV2TransactionMethodFilter;
  status: AdminV2TransactionStatusFilter;
  from: string;
  to: string;
  page: number;
  pageSize: number;
};

export type AdminV2TransactionRow = {
  id: string;
  transactionReference: string;
  orderReference: string;
  amount: number | null;
  currencyCode: string;
  paymentMethod: string;
  externalReference: string;
  source: string;
  status: "recorded" | "void" | "";
  occurredAt: string;
  recordedAt: string;
  recordedBy: string;
  voidedAt: string;
  voidReason: string;
};

export type AdminV2TransactionMetrics = {
  totalLedgerEntries: number;
  recordedPayments: number;
  recordedAmountSummary: AdminV2MoneyAggregate;
  voidedPayments: number;
};

export type AdminV2TransactionQueryResult = {
  rows: AdminV2TransactionRow[];
  metrics: AdminV2TransactionMetrics;
  query: AdminV2TransactionQuery;
  totalCount: number;
  totalPages: number;
  storageAvailable: boolean;
  queryFailed: boolean;
  limitation: string | null;
};

const defaultPageSize = 20;
const maxPageSize = 50;

function positiveInt(value: string | null, fallback: number) {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
}

function cleanDate(value: string | null) {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return "";
  const parsed = new Date(`${value}T00:00:00.000Z`);
  return Number.isFinite(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value ? value : "";
}

function oneOf<T extends readonly string[]>(value: string | null, values: T) {
  if (!value || value === "all") return "all";
  return values.includes(value as T[number]) ? value as T[number] : "all";
}

export function parseAdminV2TransactionQuery(searchParams: URLSearchParams): AdminV2TransactionQuery {
  return {
    q: (searchParams.get("q") ?? "").trim().slice(0, 120),
    method: oneOf(searchParams.get("method"), adminV2TransactionPaymentMethods) as AdminV2TransactionMethodFilter,
    status: oneOf(searchParams.get("status"), adminV2TransactionLedgerStatuses) as AdminV2TransactionStatusFilter,
    from: cleanDate(searchParams.get("from")),
    to: cleanDate(searchParams.get("to")),
    page: positiveInt(searchParams.get("page"), 1),
    pageSize: Math.min(maxPageSize, positiveInt(searchParams.get("pageSize") ?? searchParams.get("rowsPerPage"), defaultPageSize)),
  };
}

export function adminV2TransactionTotalPages(totalCount: number, pageSize: number) {
  return Math.max(1, Math.ceil(Math.max(0, totalCount) / Math.max(1, pageSize)));
}

export function buildAdminV2TransactionMetrics(rows: AdminV2TransactionRow[]): AdminV2TransactionMetrics {
  const recordedRows = rows.filter((row) => row.status === "recorded");
  return {
    totalLedgerEntries: rows.length,
    recordedPayments: recordedRows.length,
    recordedAmountSummary: buildAdminV2MoneyAggregate(recordedRows.map((row) => ({ amount: row.amount, currencyCode: row.currencyCode }))),
    voidedPayments: rows.filter((row) => row.status === "void").length,
  };
}
