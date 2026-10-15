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

test("Scope persists across financial navigation, filters, pagination, and CSV export links", () => {
  const views = [
    read("components/admin-v2/views/reports/AdminV2ReportsView.tsx"),
    read("components/admin-v2/views/transactions/AdminV2TransactionsView.tsx"),
    read("components/admin-v2/views/refunds/AdminV2RefundsView.tsx"),
    read("components/admin-v2/views/expenses/AdminV2ExpensesView.tsx"),
  ];
  for (const source of views) {
    assert.match(source, /scope: data\.dataScope/);
    assert.match(source, /name="scope" value=\{data\.dataScope/);
    assert.match(source, /TEST DATA ONLY|TEST DATA ONLY|TEST ORDERS/);
  }
  const invoices = read("components/admin-v2/views/invoices/AdminV2InvoicesView.tsx");
  assert.match(invoices, /name="scope" value=\{data\.dataScope/);
  assert.match(invoices, /data\.dataScope === "test"\) params\.set\("scope", "test"\)/);
  const analytics = read("components/admin-v2/views/analytics/AdminV2AnalyticsView.tsx");
  assert.match(analytics, /name="scope" value=\{scope\}/);
  assert.match(analytics, /scope=\$\{scope\}/);
  const billing = read("components/admin-v2/views/billing/AdminV2BillingView.tsx");
  assert.match(billing, /"\/admin-v2\/invoices\?scope=test"/);
  assert.match(billing, /"\/admin-v2\/transactions\?scope=test"/);
});


test("Finance exports permanently identify TEST versus LIVE rows and audit the scope", () => {
  for (const name of ["transactions", "refunds", "expenses"]) {
    const route = read(`app/api/admin/finance/${name}/export/route.ts`);
    assert.match(route, /parseAdminV2FinancialDataScope\(url\.searchParams\.get\("scope"\)\)/);
    assert.match(route, /recordScope\.toUpperCase\(\)/);
    assert.match(route, /"Data Scope"/);
    assert.match(route, /data_scope: recordScope/);
    assert.match(route, /\$\{recordScope\}\.csv/);
  }
});

test("Test expense history never offers a create/void operation in its scoped UI", () => {
  const view = read("components/admin-v2/views/expenses/AdminV2ExpensesView.tsx");
  assert.match(view, /capabilities\.canManageExpenses && data\.dataScope !== "test"/);
  assert.match(view, /Test expense history is read-only/);
  assert.match(view, /data\.dataScope !== "test" && row\.status === "active"/);
});


test("Historic test payment and refund views cannot submit new records or void old ledger rows", () => {
  const ledgerViews = [
    ["transactions", "canRecordPayment"],
    ["refunds", "canRecordRefund"],
  ] as const;
  for (const [folder, permission] of ledgerViews) {
    const file = folder === "transactions" ? "AdminV2TransactionsView" : "AdminV2RefundsView";
    const view = read(`components/admin-v2/views/${folder}/${file}.tsx`);
    assert.match(view, /data\.dataScope === "test"/);
    assert.match(view, new RegExp(`capabilities\\.${permission} && data\\.dataScope !== "test"`));
    assert.match(view, /data\.dataScope !== "test" && row\.status === "recorded"/);
  }
});


test("Dashboard fetches complete live-scoped order pages or marks order KPIs unavailable", () => {
  const dashboard = read("lib/admin-v2/data.ts");
  assert.match(dashboard, /recordScope=live&page=1&pageSize=50/);
  assert.match(dashboard, /firstPage\.totalCount > maxLiveDashboardOrders/);
  assert.match(dashboard, /orders\.length === firstPage\.totalCount/);
  assert.match(dashboard, /orderPayload\.complete/);
  assert.doesNotMatch(dashboard, /canViewOrders \? listOrders\(\)/);
});
