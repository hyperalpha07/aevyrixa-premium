import assert from "node:assert/strict";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { registerHooks } from "node:module";
import { fileURLToPath, pathToFileURL } from "node:url";
import test from "node:test";
import { adminV2AccessRules } from "../configs/admin-v2/permissions.ts";
import { findAdminV2Route } from "../configs/admin-v2/routes.ts";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const hooks = registerHooks({
  resolve(specifier, context, nextResolve) {
    if (specifier === "server-only") return { shortCircuit: true, url: "data:text/javascript,export default {}" };
    if (specifier.startsWith("@/")) {
      const target = path.join(repoRoot, specifier.slice(2));
      return nextResolve(pathToFileURL(existsSync(target) ? target : `${target}.ts`).href, context);
    }
    if ((specifier.startsWith("./") || specifier.startsWith("../")) && context.parentURL) {
      const target = path.resolve(path.dirname(fileURLToPath(context.parentURL)), specifier);
      if (!path.extname(target) && existsSync(`${target}.ts`)) return nextResolve(pathToFileURL(`${target}.ts`).href, context);
    }
    return nextResolve(specifier, context);
  },
});
const billingMetrics = await import("../lib/admin-v2/billing/billing-metrics.ts");
hooks.deregister();

const billingPage = readFileSync(new URL("../app/admin-v2/billing/page.tsx", import.meta.url), "utf8");
const billingQuery = readFileSync(new URL("../lib/admin-v2/billing/billing-query.ts", import.meta.url), "utf8");
const billingMetricsSource = readFileSync(new URL("../lib/admin-v2/billing/billing-metrics.ts", import.meta.url), "utf8");
const billingView = readFileSync(new URL("../components/admin-v2/views/billing/AdminV2BillingView.tsx", import.meta.url), "utf8");

test("Billing route is implemented, protected by analytics.view, and sibling unfinished finance modules remain coming soon", () => {
  assert.equal(findAdminV2Route("billing")?.implemented, true);
  assert.equal(findAdminV2Route("expenses")?.implemented, false);
  assert.equal(findAdminV2Route("tax")?.implemented, false);
  assert.equal(adminV2AccessRules.billing.permission, "analytics.view");
  assert.equal(adminV2AccessRules.billing.section, undefined);
  assert.match(billingPage, /requireAdminV2RouteAccess\(session,\s*"billing"\)/);
  assert.match(billingPage, /AdminV2BillingView/);
  assert.doesNotMatch(billingPage, /AdminV2ModulePage/);
});

test("Billing overview composes real existing finance helpers instead of creating a new ledger", () => {
  assert.match(billingQuery, /getAdminV2Analytics/);
  assert.match(billingQuery, /getAdminV2Transactions/);
  assert.match(billingQuery, /getAdminV2Refunds/);
  assert.match(billingQuery, /getAdminV2Invoices/);
  assert.match(billingMetricsSource, /payableSales/);
  assert.match(billingMetricsSource, /verifiedAmount/);
  assert.match(billingMetricsSource, /refundedAmount/);
  assert.match(billingMetricsSource, /issuedInvoices/);
  assert.doesNotMatch(billingQuery + billingMetricsSource, /billing_accounts|accounts_receivable|accounts_payable|settlements|payouts|subscriptions|billing_cycles|statements/i);
});

test("Billing summary labels are truthful and avoid unsupported accounting concepts", () => {
  const result = billingMetrics.buildAdminV2BillingResult({
    analytics: { available: true, limitation: null, range: {} as never, kpis: { orders: 2, payableSales: 250, averageOrderValue: 125, newCustomers: 0, reviews: 0 }, trend: [], orderStatus: [], topProductsByQuantity: [], topProductsByValue: [], linkedCustomers: { linkedCustomers: 0, newLinkedCustomers: 0, repeatLinkedCustomers: 0, linkedOrders: 0 }, reviewSummary: { total: 0, averageRating: 0, approved: 0, pending: 0, byStatus: { approved: 0, pending: 0, rejected: 0, hidden: 0 } }, valueBreakdown: { discounts: 0, deliveryFees: 0, discountRows: 0, deliveryRows: 0 }, sourceNotes: [] },
    transactions: { rows: [], metrics: { verifiedPayments: 1, verifiedAmount: 100, pendingPayments: 2, codDue: 80, failedOrRefunded: 0 }, query: {} as never, totalCount: 0, totalPages: 1, storageAvailable: true, queryFailed: false, limitation: null },
    refunds: { rows: [], metrics: { refundedOrders: 1, refundedAmount: 30, fullRefunds: 0, partialRefunds: 1, refundRequests: 0 }, query: {} as never, totalCount: 0, totalPages: 1, storageAvailable: true, queryFailed: false, limitation: null },
    invoices: { rows: [], metrics: { issuedInvoices: 3, totalInvoicedValue: 300, issuedThisMonth: 2, voidInvoices: 0 }, query: {} as never, totalCount: 0, totalPages: 1, storageAvailable: true, limitation: null },
  });
  assert.deepEqual(result.summary.map((metric) => metric.label), ["Payable Sales", "Verified Payments", "Amount Still Due", "Refunded Amount", "Issued Invoices"]);
  assert.match(result.summary.find((metric) => metric.label === "Amount Still Due")?.helper ?? "", /not an accounting receivables ledger/i);
  assert.doesNotMatch(billingView + billingMetricsSource, /Account Balance|Bank Balance|Available Balance|Receivables|Accounts Receivable|Settlement Balance|Net Profit|Revenue/);
});

test("Finance workspace tabs preview modules locally and explicit full-module links use exact routes", () => {
  assert.match(billingView, /Main Financial Overview/);
  assert.match(billingView, /role="tablist"/);
  assert.match(billingView, /role="tab"/);
  assert.match(billingView, /setActiveModule\(module\.title\)/);
  assert.match(billingView, /type="button"[\s\S]*role="tab"[\s\S]*onClick=\{\(\) => setActiveModule\(module\.title\)\}/);
  assert.match(billingView, /Open full module/);
  for (const href of ["/admin-v2/invoices", "/admin-v2/transactions", "/admin-v2/refunds", "/admin-v2/reports"]) {
    assert.match(billingMetricsSource + billingView, new RegExp(href.replaceAll("/", "\\/")));
  }
  assert.doesNotMatch(billingView, /<Table|TableHead|TableBody|Payment reconciliation|Invoice index|Refund index/i);
});

test("Query failure stays unavailable instead of becoming a fake zero", () => {
  const result = billingMetrics.buildAdminV2BillingResult({
    analytics: { available: false, limitation: "Analytics unavailable", range: {} as never, kpis: { orders: 0, payableSales: 0, averageOrderValue: 0, newCustomers: 0, reviews: 0 }, trend: [], orderStatus: [], topProductsByQuantity: [], topProductsByValue: [], linkedCustomers: { linkedCustomers: 0, newLinkedCustomers: 0, repeatLinkedCustomers: 0, linkedOrders: 0 }, reviewSummary: { total: 0, averageRating: 0, approved: 0, pending: 0, byStatus: { approved: 0, pending: 0, rejected: 0, hidden: 0 } }, valueBreakdown: { discounts: 0, deliveryFees: 0, discountRows: 0, deliveryRows: 0 }, sourceNotes: [] },
    transactions: { rows: [], metrics: { verifiedPayments: 0, verifiedAmount: 0, pendingPayments: 0, codDue: 0, failedOrRefunded: 0 }, query: {} as never, totalCount: 0, totalPages: 1, storageAvailable: false, queryFailed: true, limitation: "Transactions unavailable" },
    refunds: { rows: [], metrics: { refundedOrders: 0, refundedAmount: 0, fullRefunds: 0, partialRefunds: 0, refundRequests: 0 }, query: {} as never, totalCount: 0, totalPages: 1, storageAvailable: false, queryFailed: true, limitation: "Refunds unavailable" },
    invoices: { rows: [], metrics: { issuedInvoices: 0, totalInvoicedValue: 0, issuedThisMonth: 0, voidInvoices: 0 }, query: {} as never, totalCount: 0, totalPages: 1, storageAvailable: false, limitation: "Invoices unavailable" },
  });
  assert.equal(result.summary.every((metric) => metric.available === false && metric.value === null), true);
  assert.match(billingView, /Finance data is unavailable/);
  assert.match(billingView, /Unavailable/);
});

test("Billing is read-only, compact, and adds no migration", () => {
  assert.match(billingView, /Finance summary bar/);
  assert.match(billingView, /Operational finance summary only/);
  assert.doesNotMatch(billingView, /V2MetricCard|Operational scope/i);
  assert.doesNotMatch(billingView + billingPage, />\s*(Mark Paid|Settle|Payout|Create Statement|Generate Invoice|Capture|Refund Now|Save|Submit|Delete|Edit)\s*</i);
  assert.doesNotMatch(billingView + billingMetricsSource, /Math\.random|faker|mock/i);
  const migrationNames = readdirSync(new URL("../supabase/migrations", import.meta.url)).join("\n");
  assert.doesNotMatch(migrationNames, /billing|receivable|payable|settlement|payout/i);
});
