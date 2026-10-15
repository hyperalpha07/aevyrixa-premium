import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { parseAdminV2FinancialDataScope, scopedOrderLinkedSelect } from "../lib/admin-v2/finance/financial-data-scope.ts";

const read = (path: string) => readFileSync(new URL(`../${path}`, import.meta.url), "utf8");
const orderStore = read("app/lib/order-store.ts");
const analyticsSource = read("lib/admin-v2/analytics/analytics-source.ts");
const analyticsQuery = read("lib/admin-v2/analytics/analytics-query.ts");
const reportsQuery = read("lib/admin-v2/reports/reports-query.ts");
const dueSource = read("lib/admin-v2/billing/order-due-source.ts");
const billingQuery = read("lib/admin-v2/billing/billing-query.ts");
const billingMetrics = read("lib/admin-v2/billing/billing-metrics.ts");
const transactionsQuery = read("lib/admin-v2/transactions/transactions-query.ts");
const invoicesQuery = read("lib/admin-v2/invoices/invoices-query.ts");
const refundsQuery = read("lib/admin-v2/refunds/refunds-query.ts");
const expensesQuery = read("lib/admin-v2/expenses/expenses-query.ts");
const diagnosticsRoute = read("app/admin-v2/billing/diagnostics/page.tsx");

test("Missing, malformed, or privileged-looking scope falls back to live data", () => {
  for (const value of [null, "", "all", "Live", "both", "unknown", "test,live", "eq.test"]) {
    assert.equal(parseAdminV2FinancialDataScope(value), "live");
  }
  assert.equal(parseAdminV2FinancialDataScope("test"), "test");
  assert.deepEqual(scopedOrderLinkedSelect("id,amount", "live"), [
    "select=id,amount,orders!inner(record_scope)",
    "orders.record_scope=eq.live",
  ]);
  assert.deepEqual(scopedOrderLinkedSelect("id,amount", "test"), [
    "select=id,amount,orders!inner(record_scope)",
    "orders.record_scope=eq.test",
  ]);
});

test("Orders preserve classification and ordinary checkout cannot supply its own record_scope", () => {
  assert.match(orderStore, /"record_scope"/);
  assert.match(orderStore, /record_scope === "test"/);
  const insertPart = orderStore.split("function orderToSupabaseInsertPayload")[1]?.split("async function insertOrderPayload")[0];
  assert.ok(insertPart);
  assert.doesNotMatch(insertPart, /record_scope:\s*order\./);
});

test("Analytics, report exports, and Billing due summaries scope orders before pagination", () => {
  assert.match(analyticsSource, /record_scope: `eq\.\$\{scope\}`/);
  assert.match(analyticsQuery, /listAnalyticsOrders\(range\.fromIso, range\.toIso, scope\)/);
  assert.match(reportsQuery, /listAnalyticsOrders\(range\.fromIso, range\.toIso, scope\)/);
  assert.match(dueSource, /record_scope: `eq\.\$\{scope\}`/);
  assert.match(billingQuery, /getAdminV2OrderDueSnapshots\(scope\)/);
  assert.match(billingQuery, /getAdminV2Analytics\(new URLSearchParams\(\{ range: "30d", scope \}\)\)/);
  assert.match(billingMetrics, /recordScope: scope/);
});

test("Payments, invoices, refunds and expenses share pre-pagination scope with exports", () => {
  for (const source of [transactionsQuery, invoicesQuery, refundsQuery]) {
    assert.match(source, /scopedOrderLinkedSelect/);
    assert.match(source, /orders!inner\(record_scope\)|scopedOrderLinkedSelect/);
    assert.match(source, /parseAdminV2FinancialDataScope\(searchParams\.get\("scope"\)\)/);
    assert.match(source, /fetchMetricRows\(query, scope\)/);
    assert.match(source, /true, scope\)\.join\("&"\)/);
  }
  assert.match(expensesQuery, /record_scope=eq\.\$\{scope\}/);
  assert.match(expensesQuery, /fetchMetricRows\(query, scope\)/);
  assert.match(expensesQuery, /getAdminV2ExpenseExportRows/);
  assert.match(transactionsQuery, /getAdminV2TransactionExportRows/);
  assert.match(refundsQuery, /getAdminV2RefundExportRows/);
});

test("Finance diagnostics enforces the same Billing permission before scoped fetching", () => {
  assert.match(diagnosticsRoute, /requireAdminV2RouteAccess\(session, "billing"\)/);
  assert.match(diagnosticsRoute, /parseAdminV2FinancialDataScope\(requestedScope\)/);
  assert.match(diagnosticsRoute, /getAdminV2BillingOverview\(scope\)/);
  assert.match(diagnosticsRoute, /"test"/);
});
