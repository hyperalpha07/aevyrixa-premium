import type { AdminV2AnalyticsResult } from "@/lib/admin-v2/analytics/analytics-metrics";
import type { AdminV2InvoiceQueryResult } from "@/lib/admin-v2/invoices/invoice-metrics";
import type { AdminV2ExpenseQueryResult } from "@/lib/admin-v2/expenses/expense-metrics";
import type { AdminV2RefundQueryResult } from "@/lib/admin-v2/refunds/refund-metrics";
import type { AdminV2TransactionQueryResult } from "@/lib/admin-v2/transactions/transaction-metrics";
import { adminV2MoneyAggregateUnavailable, adminV2MoneyAggregateValue } from "@/lib/admin-v2/finance/money";

export type AdminV2BillingSourceState = {
  available: boolean;
  limitation: string | null;
};

export type AdminV2BillingSummaryMetric = {
  label: string;
  value: number | null;
  kind: "currency" | "count";
  helper: string;
  source: "analytics" | "transactions" | "refunds" | "expenses" | "invoices";
  available: boolean;
  displayValue?: string;
};

export type AdminV2BillingModuleCard = {
  title: "Invoices" | "Transactions" | "Refunds" | "Reports" | "Expenses";
  href: string;
  cta: string;
  description: string;
  figures: Array<{ label: string; value: number | null; kind: "currency" | "count"; available: boolean; displayValue?: string }>;
};

export type AdminV2BillingResult = {
  summary: AdminV2BillingSummaryMetric[];
  modules: AdminV2BillingModuleCard[];
  sources: Record<"analytics" | "transactions" | "refunds" | "expenses" | "invoices", AdminV2BillingSourceState>;
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
  expenses: AdminV2ExpenseQueryResult;
  invoices: AdminV2InvoiceQueryResult;
}): AdminV2BillingResult {
  const analyticsAvailable = input.analytics.available;
  const transactionsAvailable = !input.transactions.queryFailed;
  const refundsAvailable = !input.refunds.queryFailed;
  const expensesAvailable = !input.expenses.queryFailed;
  const invoicesAvailable = input.invoices.storageAvailable;

  return {
    sources: {
      analytics: sourceState(analyticsAvailable, input.analytics.limitation),
      transactions: sourceState(transactionsAvailable, input.transactions.limitation),
      refunds: sourceState(refundsAvailable, input.refunds.limitation),
      expenses: sourceState(expensesAvailable, input.expenses.limitation),
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
        label: "Recorded Payments",
        value: amount(adminV2MoneyAggregateValue(input.transactions.metrics.verifiedAmountSummary), transactionsAvailable),
        kind: "currency",
        source: "transactions",
        available: transactionsAvailable,
        displayValue: adminV2MoneyAggregateUnavailable(input.transactions.metrics.verifiedAmountSummary) ? "Mixed currencies" : undefined,
        helper: adminV2MoneyAggregateUnavailable(input.transactions.metrics.verifiedAmountSummary) ? "Unavailable as a single total; multiple currencies are present." : "Active finance payment ledger entries.",
      },
      {
        label: "Recorded Due",
        value: amount(adminV2MoneyAggregateValue(input.transactions.metrics.codDueSummary), transactionsAvailable),
        kind: "currency",
        source: "transactions",
        available: transactionsAvailable,
        displayValue: adminV2MoneyAggregateUnavailable(input.transactions.metrics.codDueSummary) ? "Mixed currencies" : undefined,
        helper: adminV2MoneyAggregateUnavailable(input.transactions.metrics.codDueSummary) ? "Unavailable as a single total; multiple currencies are present." : "Persisted order due snapshots; not an accounts receivable balance.",
      },
      {
        label: "Recorded Refunds",
        value: amount(adminV2MoneyAggregateValue(input.refunds.metrics.refundedAmountSummary), refundsAvailable),
        kind: "currency",
        source: "refunds",
        available: refundsAvailable,
        displayValue: adminV2MoneyAggregateUnavailable(input.refunds.metrics.refundedAmountSummary) ? "Mixed currencies" : undefined,
        helper: adminV2MoneyAggregateUnavailable(input.refunds.metrics.refundedAmountSummary) ? "Unavailable as a single total; multiple currencies are present." : "Active finance refund ledger entries.",
      },
      {
        label: "Recorded Expenses",
        value: amount(adminV2MoneyAggregateValue(input.expenses.metrics.activeAmountSummary), expensesAvailable),
        kind: "currency",
        source: "expenses",
        available: expensesAvailable,
        displayValue: adminV2MoneyAggregateUnavailable(input.expenses.metrics.activeAmountSummary) ? "Mixed currencies" : undefined,
        helper: adminV2MoneyAggregateUnavailable(input.expenses.metrics.activeAmountSummary) ? "Unavailable as a single total; multiple currencies are present." : "Active finance expense ledger entries.",
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
        description: "Payment transaction ledger entries.",
        figures: [
          { label: "Recorded", value: amount(input.transactions.metrics.verifiedPayments, transactionsAvailable), kind: "count", available: transactionsAvailable },
          { label: "Voided / failed", value: amount(input.transactions.metrics.failedOrRefunded, transactionsAvailable), kind: "count", available: transactionsAvailable },
        ],
      },
      {
        title: "Refunds",
        href: "/admin-v2/refunds",
        cta: "Open Refunds",
        description: "Recorded refund ledger entries.",
        figures: [
          { label: "Refunded orders", value: amount(input.refunds.metrics.refundedOrders, refundsAvailable), kind: "count", available: refundsAvailable },
          { label: "Refunded amount", value: amount(adminV2MoneyAggregateValue(input.refunds.metrics.refundedAmountSummary), refundsAvailable), kind: "currency", available: refundsAvailable, displayValue: adminV2MoneyAggregateUnavailable(input.refunds.metrics.refundedAmountSummary) ? "Mixed currencies" : undefined },
        ],
      },
      {
        title: "Expenses",
        href: "/admin-v2/expenses",
        cta: "Open Expenses",
        description: "Recorded operational expense ledger entries.",
        figures: [
          { label: "Active", value: amount(input.expenses.metrics.activeExpenses, expensesAvailable), kind: "count", available: expensesAvailable },
          { label: "Expense value", value: amount(adminV2MoneyAggregateValue(input.expenses.metrics.activeAmountSummary), expensesAvailable), kind: "currency", available: expensesAvailable, displayValue: adminV2MoneyAggregateUnavailable(input.expenses.metrics.activeAmountSummary) ? "Mixed currencies" : undefined },
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
      "Billing is a read-only finance hub.",
      "Sales are not settled cash, due amounts are not accounts receivable, and payment status is not gateway settlement state.",
    ],
  };
}
