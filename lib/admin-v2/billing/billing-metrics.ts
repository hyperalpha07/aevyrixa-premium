import type { AdminV2FinancialDataScope } from "@/lib/admin-v2/finance/financial-data-scope";
import type { AdminV2AnalyticsResult } from "@/lib/admin-v2/analytics/analytics-metrics";
import type { AdminV2InvoiceQueryResult } from "@/lib/admin-v2/invoices/invoice-metrics";
import type { AdminV2ExpenseQueryResult } from "@/lib/admin-v2/expenses/expense-metrics";
import type { AdminV2RefundQueryResult } from "@/lib/admin-v2/refunds/refund-metrics";
import type { AdminV2TransactionQueryResult } from "@/lib/admin-v2/transactions/transaction-metrics";
import { adminV2MoneyAggregateUnavailable, adminV2MoneyAggregateValue } from "@/lib/admin-v2/finance/money";
import type { AdminV2OrderDueSnapshotResult } from "@/lib/admin-v2/billing/order-due-source";

export type AdminV2BillingSourceState = {
  available: boolean;
  limitation: string | null;
};

export type AdminV2BillingSummaryMetric = {
  label: string;
  value: number | null;
  kind: "currency" | "count";
  helper: string;
  source: "analytics" | "transactions" | "orderDue" | "refunds" | "expenses" | "invoices";
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
  recordScope: AdminV2FinancialDataScope;
  summary: AdminV2BillingSummaryMetric[];
  modules: AdminV2BillingModuleCard[];
  sources: Record<"analytics" | "transactions" | "orderDue" | "refunds" | "expenses" | "invoices", AdminV2BillingSourceState>;
  reconciliation: {
    issueCount: number;
    arithmeticMismatchCount: number;
    missingDueSnapshotCount: number;
    deliveryStatusMismatchCount: number;
    codDeliveredUnpaidCount: number;
    items: AdminV2OrderDueSnapshotResult["reconciliationIssues"];
  };
  tables: {
    invoices: AdminV2InvoiceQueryResult["rows"];
    transactions: AdminV2TransactionQueryResult["rows"];
  };
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
  orderDue: AdminV2OrderDueSnapshotResult;
  refunds: AdminV2RefundQueryResult;
  expenses: AdminV2ExpenseQueryResult;
  invoices: AdminV2InvoiceQueryResult;
}): AdminV2BillingResult {
  const reconciliationIssues = input.orderDue.reconciliationIssues ?? [];
  const missingDueSnapshotCount = input.orderDue.missingDueSnapshotCount ?? 0;
  const deliveryStatusMismatchCount = input.orderDue.deliveryStatusMismatchCount ?? 0;
  const codDeliveredUnpaidCount = input.orderDue.codDeliveredUnpaidCount ?? 0;
  const analyticsAvailable = input.analytics.available;
  const transactionsAvailable = !input.transactions.queryFailed;
  const orderDueAvailable = input.orderDue.available;
  const refundsAvailable = !input.refunds.queryFailed;
  const expensesAvailable = !input.expenses.queryFailed;
  const invoicesAvailable = input.invoices.storageAvailable;
  const notes = [
    "Billing is a read-only finance hub.",
    "All headline finance metrics are all-time operational sources unless a module states otherwise.",
    "Order totals are operational order values, known due is incomplete where legacy due snapshots are missing, and payment status is not gateway settlement state.",
  ];
  if (input.orderDue.arithmeticMismatchCount > 0) {
    notes.push(
      `${input.orderDue.arithmeticMismatchCount.toLocaleString("en")} eligible order total${input.orderDue.arithmeticMismatchCount === 1 ? " differs" : "s differ"} from the arithmetic payable calculation; Billing keeps stored order totals and calculated payable separate for reconciliation.`
    );
  }
  if (missingDueSnapshotCount > 0) {
    notes.push(
      `${missingDueSnapshotCount.toLocaleString("en")} eligible order${missingDueSnapshotCount === 1 ? " is" : "s are"} missing persisted due snapshots; Billing shows known due separately and does not infer received cash.`
    );
  }
  if (deliveryStatusMismatchCount > 0) {
    notes.push(
      `${deliveryStatusMismatchCount.toLocaleString("en")} order${deliveryStatusMismatchCount === 1 ? " has" : "s have"} order/delivery status mismatches that require operational reconciliation.`
    );
  }
  if (codDeliveredUnpaidCount > 0) {
    notes.push(
      `${codDeliveredUnpaidCount.toLocaleString("en")} delivered COD order${codDeliveredUnpaidCount === 1 ? " remains" : "s remain"} unpaid or unverified; courier-held cash is not treated as merchant-received payment.`
    );
  }
  if (input.orderDue.calculatedPayableKnownCount > 0) {
    notes.push(
      "The applied payment RPC calculates payable from subtotal minus discount plus delivery, so legacy orders with stored-total mismatches require review before recording payments."
    );
  }
  if (input.invoices.metrics.issuedInvoicesOnCancelledOrders > 0) {
    notes.push(
      `${input.invoices.metrics.issuedInvoicesOnCancelledOrders.toLocaleString("en")} issued invoice${input.invoices.metrics.issuedInvoicesOnCancelledOrders === 1 ? " is" : "s are"} associated with cancelled orders; historical invoice value is shown separately from eligible order value.`
    );
  }

  return {
    sources: {
      analytics: sourceState(analyticsAvailable, input.analytics.limitation),
      transactions: sourceState(transactionsAvailable, input.transactions.limitation),
      orderDue: sourceState(orderDueAvailable, input.orderDue.limitation),
      refunds: sourceState(refundsAvailable, input.refunds.limitation),
      expenses: sourceState(expensesAvailable, input.expenses.limitation),
      invoices: sourceState(invoicesAvailable, input.invoices.limitation),
    },
    summary: [
      {
        label: "Eligible Order Value",
        value: amount(adminV2MoneyAggregateValue(input.orderDue.orderValueSummary), orderDueAvailable),
        kind: "currency",
        source: "orderDue",
        available: orderDueAvailable,
        displayValue: adminV2MoneyAggregateUnavailable(input.orderDue.orderValueSummary) ? "Mixed currencies" : undefined,
        helper: adminV2MoneyAggregateUnavailable(input.orderDue.orderValueSummary)
          ? "Unavailable as a single total; multiple currencies are present."
          : `All-time non-archived, non-cancelled order totals from ${input.orderDue.orderValueKnownCount.toLocaleString("en")} eligible orders. Test-order classification is not independently persisted.`,
      },
      {
        label: "Recorded Payments",
        value: amount(adminV2MoneyAggregateValue(input.transactions.metrics.recordedAmountSummary), transactionsAvailable),
        kind: "currency",
        source: "transactions",
        available: transactionsAvailable,
        displayValue: adminV2MoneyAggregateUnavailable(input.transactions.metrics.recordedAmountSummary) ? "Mixed currencies" : undefined,
        helper: adminV2MoneyAggregateUnavailable(input.transactions.metrics.recordedAmountSummary) ? "Unavailable as a single total; multiple currencies are present." : "Active finance payment ledger entries.",
      },
      {
        label: "Known Due",
        value: amount(adminV2MoneyAggregateValue(input.orderDue.summary), orderDueAvailable),
        kind: "currency",
        source: "orderDue",
        available: orderDueAvailable,
        displayValue: adminV2MoneyAggregateUnavailable(input.orderDue.summary) ? "Mixed currencies" : undefined,
        helper: adminV2MoneyAggregateUnavailable(input.orderDue.summary)
          ? "Unavailable as a single total; multiple currencies are present."
          : input.orderDue.limitation ?? `Known due from ${input.orderDue.knownCount.toLocaleString("en")} orders with persisted due snapshots.`,
      },
      {
        label: "Recorded Refunds",
        value: amount(adminV2MoneyAggregateValue(input.refunds.metrics.recordedAmountSummary), refundsAvailable),
        kind: "currency",
        source: "refunds",
        available: refundsAvailable,
        displayValue: adminV2MoneyAggregateUnavailable(input.refunds.metrics.recordedAmountSummary) ? "Mixed currencies" : undefined,
        helper: adminV2MoneyAggregateUnavailable(input.refunds.metrics.recordedAmountSummary) ? "Unavailable as a single total; multiple currencies are present." : "Active finance refund ledger entries.",
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
          { label: "Recorded", value: amount(input.transactions.metrics.recordedPayments, transactionsAvailable), kind: "count", available: transactionsAvailable },
          { label: "Voided", value: amount(input.transactions.metrics.voidedPayments, transactionsAvailable), kind: "count", available: transactionsAvailable },
        ],
      },
      {
        title: "Refunds",
        href: "/admin-v2/refunds",
        cta: "Open Refunds",
        description: "Recorded refund ledger entries.",
        figures: [
          { label: "Recorded refunds", value: amount(input.refunds.metrics.recordedRefunds, refundsAvailable), kind: "count", available: refundsAvailable },
          { label: "Recorded amount", value: amount(adminV2MoneyAggregateValue(input.refunds.metrics.recordedAmountSummary), refundsAvailable), kind: "currency", available: refundsAvailable, displayValue: adminV2MoneyAggregateUnavailable(input.refunds.metrics.recordedAmountSummary) ? "Mixed currencies" : undefined },
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
    reconciliation: {
      issueCount: reconciliationIssues.length + input.invoices.metrics.issuedInvoicesOnCancelledOrders,
      arithmeticMismatchCount: input.orderDue.arithmeticMismatchCount,
      missingDueSnapshotCount,
      deliveryStatusMismatchCount,
      codDeliveredUnpaidCount,
      items: reconciliationIssues.slice(0, 12),
    },
    tables: {
      invoices: input.invoices.rows.slice(0, 6),
      transactions: input.transactions.rows.slice(0, 6),
    },
    notes,
  };
}
