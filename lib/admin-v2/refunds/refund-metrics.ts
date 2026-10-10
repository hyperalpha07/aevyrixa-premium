import type { PaymentMethod } from "@/app/lib/order-types";
import { buildAdminV2MoneyAggregate, type AdminV2MoneyAggregate } from "@/lib/admin-v2/finance/money";

export const adminV2RefundPaymentMethods = [
  "Cash on Delivery",
  "Mobile Wallet Payment",
  "Bank Transfer",
] as const satisfies readonly PaymentMethod[];

export const adminV2RefundLedgerStatuses = ["recorded", "void"] as const;

export type AdminV2RefundLedgerStatus = (typeof adminV2RefundLedgerStatuses)[number];
export type AdminV2RefundLedgerStatusFilter = AdminV2RefundLedgerStatus | "all";
export type AdminV2RefundMethodFilter = PaymentMethod | "all";

export type AdminV2RefundQuery = {
  q: string;
  status: AdminV2RefundLedgerStatusFilter;
  method: AdminV2RefundMethodFilter;
  from: string;
  to: string;
  page: number;
  pageSize: number;
};

export type AdminV2RefundRow = {
  id: string;
  reference: string;
  orderReference: string;
  amount: number | null;
  currencyCode: string;
  refundMethod: string;
  externalReference: string;
  reason: string;
  source: string;
  status: AdminV2RefundLedgerStatus | string;
  occurredAt: string;
  recordedAt: string;
  voidedAt: string;
  voidReason: string;
};

export type AdminV2RefundMetrics = {
  totalLedgerEntries: number;
  recordedRefunds: number;
  recordedAmountSummary: AdminV2MoneyAggregate;
  voidedRefunds: number;
};

export type AdminV2RefundQueryResult = {
  rows: AdminV2RefundRow[];
  metrics: AdminV2RefundMetrics;
  query: AdminV2RefundQuery;
  totalCount: number;
  totalPages: number;
  storageAvailable: boolean;
  queryFailed: boolean;
  limitation: string | null;
};

export const adminV2RefundLedgerStatusLabels: Record<AdminV2RefundLedgerStatus, string> = {
  recorded: "Recorded",
  void: "Void",
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
  return values.includes(value as T[number]) ? (value as T[number]) : "all";
}

export function parseAdminV2RefundQuery(searchParams: URLSearchParams): AdminV2RefundQuery {
  return {
    q: (searchParams.get("q") ?? "").trim().slice(0, 120),
    status: oneOf(searchParams.get("status"), adminV2RefundLedgerStatuses) as AdminV2RefundLedgerStatusFilter,
    method: oneOf(searchParams.get("method"), adminV2RefundPaymentMethods) as AdminV2RefundMethodFilter,
    from: cleanDate(searchParams.get("from")),
    to: cleanDate(searchParams.get("to")),
    page: positiveInt(searchParams.get("page"), 1),
    pageSize: Math.min(maxPageSize, positiveInt(searchParams.get("pageSize") ?? searchParams.get("rowsPerPage"), defaultPageSize)),
  };
}

export function adminV2RefundTotalPages(totalCount: number, pageSize: number) {
  return Math.max(1, Math.ceil(Math.max(0, totalCount) / Math.max(1, pageSize)));
}

export function buildAdminV2RefundMetrics(rows: AdminV2RefundRow[]): AdminV2RefundMetrics {
  const recordedRows = rows.filter((row) => row.status === "recorded");
  return {
    totalLedgerEntries: rows.length,
    recordedRefunds: recordedRows.length,
    recordedAmountSummary: buildAdminV2MoneyAggregate(recordedRows.map((row) => ({ amount: row.amount, currencyCode: row.currencyCode }))),
    voidedRefunds: rows.filter((row) => row.status === "void").length,
  };
}
