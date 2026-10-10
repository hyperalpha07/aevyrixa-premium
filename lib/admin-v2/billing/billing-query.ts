import "server-only";

import { getAdminV2Analytics } from "@/lib/admin-v2/analytics/analytics-query";
import { buildAdminV2BillingResult, type AdminV2BillingResult } from "@/lib/admin-v2/billing/billing-metrics";
import { getAdminV2Expenses } from "@/lib/admin-v2/expenses/expenses-query";
import { getAdminV2Invoices } from "@/lib/admin-v2/invoices/invoices-query";
import { getAdminV2Refunds } from "@/lib/admin-v2/refunds/refunds-query";
import { getAdminV2Transactions } from "@/lib/admin-v2/transactions/transactions-query";
import { getAdminV2OrderDueSnapshots } from "@/lib/admin-v2/billing/order-due-source";

export async function getAdminV2BillingOverview(): Promise<AdminV2BillingResult> {
  const [analytics, transactions, orderDue, refunds, expenses, invoices] = await Promise.all([
    getAdminV2Analytics(new URLSearchParams("range=30d")),
    getAdminV2Transactions(new URLSearchParams()),
    getAdminV2OrderDueSnapshots(),
    getAdminV2Refunds(new URLSearchParams()),
    getAdminV2Expenses(new URLSearchParams()),
    getAdminV2Invoices(new URLSearchParams()),
  ]);

  return buildAdminV2BillingResult({ analytics, transactions, orderDue, refunds, expenses, invoices });
}
