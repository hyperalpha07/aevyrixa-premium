import type { AdminV2AnalyticsResult } from "@/lib/admin-v2/analytics/analytics-metrics";
import type { AdminV2InvoiceQueryResult } from "@/lib/admin-v2/invoices/invoice-metrics";
import type { AdminV2RefundQueryResult } from "@/lib/admin-v2/refunds/refund-metrics";
import type { AdminV2TransactionQueryResult } from "@/lib/admin-v2/transactions/transaction-metrics";

export type AdminV2BillingSourceState = {
  available: boolean;
  limitation: string | null;
};

export type AdminV2BillingSummaryMetric = {
  label: string;
  value: number | null;
  kind: "currency" | "count";
  helper: string;
  source: "analytics" | "transactions" | "refunds" | "invoices";
  available: boolean;
};

export type AdminV2BillingModuleCard = {
  title: "Invoices" | "Transactions" | "Refunds" | "Reports";
  href: string;
  cta: string;
  description: string;
  figures: Array<{ label: string; value: number | null; kind: "currency" | "count"; available: boolean }>;
};

export type AdminV2BillingResult = {
  summary: AdminV2BillingSummaryMetric[];
  modules: AdminV2BillingModuleCard[];
  sources: Record<"analytics" | "transactions" | "refunds" | "invoices", AdminV2BillingSourceState>;
  notes: string[];
};

function sourceState(available: boolean, limitation: string | null): AdminV2BillingSourceState {
  return { available, limitation };
}

function amount(value: number | null | undefined, available: boolean) {
  return available && typeof value === "number" && Number.isFinite(value) ? Math.max(0, value) : null;
}

export function buildAdminV2BillingResult(input: {
  analytics: AdminV2AnalyticsResult;
  transactions: AdminV2TransactionQueryResult;
  refunds: AdminV2RefundQueryResult;
  invoices: AdminV2InvoiceQueryResult;
}): AdminV2BillingResult {
  const analyticsAvailable = input.analytics.available;
  const transactionsAvailable = !input.transactions.queryFailed;
  const refundsAvailable = !input.refunds.queryFailed;
  const invoicesAvailable = input.invoices.storageAvailable;

  return {
    sources: {
      analytics: sourceState(analyticsAvailable, input.analytics.limitation),
      transactions: sourceState(transactionsAvailable, input.transactions.limitation),
      refunds: sourceState(refundsAvailable, input.refunds.limitation),
      invoices: sourceState(invoicesAvailable, input.invoices.limitation),
    },
    summary: [
      {
        label: "Payable Sales",
        value: amount(input.analytics.kpis.payableSales, analyticsAvailable),
        kind: "currency",
        source: "analytics",
        available: analyticsAvailable,
        helper: "Canonical analytics payable-sales semantics.",
      },
      {
        label: "Verified Payments",
        value: amount(input.transactions.metrics.verifiedAmount, transactionsAvailable),
        kind: "currency",
        source: "transactions",
        available: transactionsAvailable,
        helper: "Persisted paid amounts on verified order payments.",
      },
      {
        label: "Amount Still Due",
        value: amount(input.transactions.metrics.codDue, transactionsAvailable),
        kind: "currency",
        source: "transactions",
        available: transactionsAvailable,
        helper: "Persisted order due amounts; not an accounting receivables ledger.",
      },
      {
        label: "Refunded Amount",
        value: amount(input.refunds.metrics.refundedAmount, refundsAvailable),
        kind: "currency",
        source: "refunds",
        available: refundsAvailable,
        helper: "Persisted refunded_amount from orders.",
      },
      {
        label: "Issued Invoices",
        value: amount(input.invoices.metrics.issuedInvoices, invoicesAvailable),
        kind: "count",
        source: "invoices",
        available: invoicesAvailable,
        helper: "Real issued invoice records.",
      },
    ],
    modules: [
      {
        title: "Invoices",
        href: "/admin-v2/invoices",
        cta: "Open Invoices",
        description: "Issued order invoice records and print views.",
        figures: [
          { label: "Issued", value: amount(input.invoices.metrics.issuedInvoices, invoicesAvailable), kind: "count", available: invoicesAvailable },
          { label: "Invoiced value", value: amount(input.invoices.metrics.totalInvoicedValue, invoicesAvailable), kind: "currency", available: invoicesAvailable },
        ],
      },
      {
        title: "Transactions",
        href: "/admin-v2/transactions",
        cta: "Open Transactions",
        description: "Order payment reconciliation from persisted payment fields.",
        figures: [
          { label: "Verified", value: amount(input.transactions.metrics.verifiedPayments, transactionsAvailable), kind: "count", available: transactionsAvailable },
          { label: "Pending", value: amount(input.transactions.metrics.pendingPayments, transactionsAvailable), kind: "count", available: transactionsAvailable },
        ],
      },
      {
        title: "Refunds",
        href: "/admin-v2/refunds",
        cta: "Open Refunds",
        description: "Refund reconciliation from order refund signals.",
        figures: [
          { label: "Refunded orders", value: amount(input.refunds.metrics.refundedOrders, refundsAvailable), kind: "count", available: refundsAvailable },
          { label: "Refunded amount", value: amount(input.refunds.metrics.refundedAmount, refundsAvailable), kind: "currency", available: refundsAvailable },
        ],
      },
      {
        title: "Reports",
        href: "/admin-v2/reports",
        cta: "Open Reports",
        description: "On-demand reporting and sanitized CSV export from existing analytics data.",
        figures: [
          { label: "Source", value: null, kind: "count", available: true },
        ],
      },
    ],
    notes: [
      "Billing Phase 1 is a read-only finance hub.",
      "Sales are not settled cash, due amounts are not accounts receivable, and payment status is not gateway settlement state.",
    ],
  };
}
