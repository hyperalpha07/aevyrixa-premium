import "server-only";

import { getAdminV2Analytics } from "@/lib/admin-v2/analytics/analytics-query";
import { buildAdminV2BillingResult, type AdminV2BillingResult } from "@/lib/admin-v2/billing/billing-metrics";
import { getAdminV2Expenses } from "@/lib/admin-v2/expenses/expenses-query";
import { getAdminV2Invoices } from "@/lib/admin-v2/invoices/invoices-query";
import { getAdminV2Refunds } from "@/lib/admin-v2/refunds/refunds-query";
import { getAdminV2Transactions } from "@/lib/admin-v2/transactions/transactions-query";

export async function getAdminV2BillingOverview(): Promise<AdminV2BillingResult> {
  const [analytics, transactions, refunds, expenses, invoices] = await Promise.all([
    getAdminV2Analytics(new URLSearchParams("range=30d")),
    getAdminV2Transactions(new URLSearchParams()),
    getAdminV2Refunds(new URLSearchParams()),
    getAdminV2Expenses(new URLSearchParams()),
    getAdminV2Invoices(new URLSearchParams()),
  ]);

  return buildAdminV2BillingResult({ analytics, transactions, refunds, expenses, invoices });
}
