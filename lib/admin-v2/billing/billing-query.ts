import "server-only";
import type { AdminV2FinancialDataScope } from "@/lib/admin-v2/finance/financial-data-scope";

import { getAdminV2Analytics } from "@/lib/admin-v2/analytics/analytics-query";
import { buildAdminV2BillingResult, type AdminV2BillingResult } from "@/lib/admin-v2/billing/billing-metrics";
import { getAdminV2Expenses } from "@/lib/admin-v2/expenses/expenses-query";
import { getAdminV2Invoices } from "@/lib/admin-v2/invoices/invoices-query";
import { getAdminV2Refunds } from "@/lib/admin-v2/refunds/refunds-query";
import { getAdminV2Transactions } from "@/lib/admin-v2/transactions/transactions-query";
import { getAdminV2OrderDueSnapshots } from "@/lib/admin-v2/billing/order-due-source";

export async function getAdminV2BillingOverview(scope: AdminV2FinancialDataScope = "live"): Promise<AdminV2BillingResult> {
  const scopeParams = new URLSearchParams({ scope });
  const [analytics, transactions, orderDue, refunds, expenses, invoices] = await Promise.all([
    getAdminV2Analytics(new URLSearchParams({ range: "30d", scope })),
    getAdminV2Transactions(scopeParams),
    getAdminV2OrderDueSnapshots(scope),
    getAdminV2Refunds(scopeParams),
    getAdminV2Expenses(scopeParams),
    getAdminV2Invoices(scopeParams),
  ]);

  return buildAdminV2BillingResult({ analytics, transactions, orderDue, refunds, expenses, invoices }, scope);
}
