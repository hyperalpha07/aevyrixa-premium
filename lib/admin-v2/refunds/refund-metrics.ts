import type { PaymentMethod, PaymentStatus } from "@/app/lib/order-types";

export const adminV2RefundPaymentMethods = [
  "Cash on Delivery",
  "Mobile Wallet Payment",
  "Bank Transfer",
] as const satisfies readonly PaymentMethod[];

export const adminV2RefundClassifications = [
  "full",
  "partial",
  "inconsistent",
  "request_only",
] as const;

export type AdminV2RefundClassification = (typeof adminV2RefundClassifications)[number];
export type AdminV2RefundClassificationFilter = AdminV2RefundClassification | "all";
export type AdminV2RefundMethodFilter = PaymentMethod | "all";

export type AdminV2RefundQuery = {
  q: string;
  classification: AdminV2RefundClassificationFilter;
  method: AdminV2RefundMethodFilter;
  from: string;
  to: string;
  page: number;
  pageSize: number;
};

export type AdminV2RefundRow = {
  id: string;
  orderReference: string;
  customerName: string;
  customerContact: string;
  classification: AdminV2RefundClassification;
  paymentStatus: PaymentStatus | "";
  paymentMethod: string;
  walletProvider: string;
  paymentType: string;
  reference: string;
  requestNote: string;
  refundedAmount: number | null;
  payableAmount: number | null;
  currencyCode: string;
  orderStatus: string;
  createdAt: string;
  updatedAt: string;
};

export type AdminV2RefundMetrics = {
  refundedOrders: number;
  refundedAmount: number;
  fullRefunds: number;
  partialRefunds: number;
  refundRequests: number;
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

export const adminV2RefundClassificationLabels: Record<AdminV2RefundClassification, string> = {
  full: "Full refund",
  partial: "Partial refund",
  inconsistent: "Inconsistent amount",
  request_only: "Refund request only",
};

const defaultPageSize = 20;
const maxPageSize = 50;
const amountTolerance = 1;

function positiveInt(value: string | null, fallback: number) {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
}

function cleanDate(value: string | null) {
  if (!value) return "";
  return /^\d{4}-\d{2}-\d{2}$/.test(value) ? value : "";
}

function oneOf<T extends readonly string[]>(value: string | null, values: T) {
  if (!value || value === "all") return "all";
  return values.includes(value as T[number]) ? (value as T[number]) : "all";
}

export function parseAdminV2RefundQuery(searchParams: URLSearchParams): AdminV2RefundQuery {
  return {
    q: (searchParams.get("q") ?? "").trim().slice(0, 120),
    classification: oneOf(searchParams.get("classification"), adminV2RefundClassifications) as AdminV2RefundClassificationFilter,
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

function safeAmount(value: number | null | undefined) {
  return typeof value === "number" && Number.isFinite(value) ? Math.max(0, value) : 0;
}

export function classifyAdminV2Refund(input: {
  refundedAmount: number | null;
  payableAmount: number | null;
  paymentStatus: PaymentStatus | "";
  requestNote: string;
}): AdminV2RefundClassification {
  const refundedAmount = safeAmount(input.refundedAmount);
  const payableAmount = safeAmount(input.payableAmount);

  if (refundedAmount > 0 && (payableAmount <= 0 || refundedAmount > payableAmount + amountTolerance)) {
    return "inconsistent";
  }

  if (refundedAmount > 0 && Math.abs(refundedAmount - payableAmount) <= amountTolerance) {
    return "full";
  }

  if (refundedAmount > 0 && refundedAmount < payableAmount) {
    return "partial";
  }

  return "request_only";
}

export function hasAdminV2RefundSignal(row: {
  paymentStatus: PaymentStatus | "";
  refundedAmount: number | null;
  requestNote: string;
}) {
  return row.paymentStatus === "refunded" || safeAmount(row.refundedAmount) > 0 || Boolean(row.requestNote.trim());
}

export function buildAdminV2RefundMetrics(rows: AdminV2RefundRow[]): AdminV2RefundMetrics {
  return rows.reduce(
    (metrics, row) => {
      if (row.paymentStatus === "refunded" || safeAmount(row.refundedAmount) > 0) {
        metrics.refundedOrders += 1;
      }
      metrics.refundedAmount += safeAmount(row.refundedAmount);
      if (row.classification === "full") metrics.fullRefunds += 1;
      if (row.classification === "partial") metrics.partialRefunds += 1;
      if (row.requestNote && row.classification === "request_only") metrics.refundRequests += 1;
      return metrics;
    },
    { refundedOrders: 0, refundedAmount: 0, fullRefunds: 0, partialRefunds: 0, refundRequests: 0 }
  );
}
