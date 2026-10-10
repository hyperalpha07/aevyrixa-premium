import type { PaymentMethod, PaymentStatus, PaymentVerificationStatus } from "@/app/lib/order-types";
import { buildAdminV2MoneyAggregate, type AdminV2MoneyAggregate } from "@/lib/admin-v2/finance/money";

export const adminV2TransactionPaymentMethods = [
  "Cash on Delivery",
  "Mobile Wallet Payment",
  "Bank Transfer",
] as const satisfies readonly PaymentMethod[];

export const adminV2TransactionPaymentStatuses = ["pending", "verified", "failed", "refunded"] as const satisfies readonly PaymentStatus[];

export const adminV2TransactionVerificationStatuses = [
  "Pending",
  "Verified",
  "Failed",
  "Not Required",
] as const satisfies readonly PaymentVerificationStatus[];

export type AdminV2TransactionMethodFilter = PaymentMethod | "all";
export type AdminV2TransactionStatusFilter = PaymentStatus | "all";
export type AdminV2TransactionVerificationFilter = PaymentVerificationStatus | "all";

export type AdminV2TransactionQuery = {
  q: string;
  method: AdminV2TransactionMethodFilter;
  status: AdminV2TransactionStatusFilter;
  verification: AdminV2TransactionVerificationFilter;
  from: string;
  to: string;
  page: number;
  pageSize: number;
};

export type AdminV2TransactionRow = {
  id: string;
  orderReference: string;
  customerName: string;
  customerContact: string;
  paymentMethod: string;
  walletProvider: string;
  paymentType: string;
  paymentStatus: PaymentStatus | "";
  verificationStatus: PaymentVerificationStatus | "";
  transactionReference: string;
  paymentReference: string;
  paidAmount: number | null;
  dueAmount: number | null;
  refundedAmount: number | null;
  totalAmount: number | null;
  currencyCode: string;
  orderStatus: string;
  createdAt: string;
  paymentVerifiedAt: string;
  refundExchangeRequest: string;
};

export type AdminV2TransactionMetrics = {
  verifiedPayments: number;
  verifiedAmount: number;
  verifiedAmountSummary: AdminV2MoneyAggregate;
  pendingPayments: number;
  codDue: number;
  codDueSummary: AdminV2MoneyAggregate;
  failedOrRefunded: number;
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
    status: oneOf(searchParams.get("status"), adminV2TransactionPaymentStatuses) as AdminV2TransactionStatusFilter,
    verification: oneOf(searchParams.get("verification"), adminV2TransactionVerificationStatuses) as AdminV2TransactionVerificationFilter,
    from: cleanDate(searchParams.get("from")),
    to: cleanDate(searchParams.get("to")),
    page: positiveInt(searchParams.get("page"), 1),
    pageSize: Math.min(maxPageSize, positiveInt(searchParams.get("pageSize") ?? searchParams.get("rowsPerPage"), defaultPageSize)),
  };
}

export function adminV2TransactionTotalPages(totalCount: number, pageSize: number) {
  return Math.max(1, Math.ceil(Math.max(0, totalCount) / Math.max(1, pageSize)));
}

function safeAmount(value: number | null | undefined) {
  return typeof value === "number" && Number.isFinite(value) ? Math.max(0, value) : 0;
}

export function buildAdminV2TransactionMetrics(rows: AdminV2TransactionRow[]): AdminV2TransactionMetrics {
  const metrics = rows.reduce(
    (metrics, row) => {
      if (row.paymentStatus === "verified") {
        metrics.verifiedPayments += 1;
        metrics.verifiedAmount += safeAmount(row.paidAmount);
      }
      if (row.paymentStatus === "pending") metrics.pendingPayments += 1;
      if (row.paymentMethod === "Cash on Delivery") metrics.codDue += safeAmount(row.dueAmount);
      if (row.paymentStatus === "failed" || row.paymentStatus === "refunded" || safeAmount(row.refundedAmount) > 0) {
        metrics.failedOrRefunded += 1;
      }
      return metrics;
    },
    { verifiedPayments: 0, verifiedAmount: 0, pendingPayments: 0, codDue: 0, failedOrRefunded: 0 }
  );
  return {
    ...metrics,
    verifiedAmountSummary: buildAdminV2MoneyAggregate(rows.filter((row) => row.paymentStatus === "verified").map((row) => ({ amount: row.paidAmount, currencyCode: row.currencyCode }))),
    codDueSummary: buildAdminV2MoneyAggregate(rows.filter((row) => row.paymentMethod === "Cash on Delivery").map((row) => ({ amount: row.dueAmount, currencyCode: row.currencyCode }))),
  };
}
