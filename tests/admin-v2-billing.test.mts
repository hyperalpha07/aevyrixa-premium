import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { registerHooks } from "node:module";
import path from "node:path";
import test from "node:test";
import { fileURLToPath, pathToFileURL } from "node:url";
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
    return nextResolve(specifier, context);
  },
});
const billingMetrics = await import("../lib/admin-v2/billing/billing-metrics.ts");
hooks.deregister();

const read = (file: string) => readFileSync(new URL(`../${file}`, import.meta.url), "utf8");

const page = read("app/admin-v2/billing/page.tsx");
const view = read("components/admin-v2/views/billing/AdminV2BillingView.tsx");
const query = read("lib/admin-v2/billing/billing-query.ts");
const metricsSource = read("lib/admin-v2/billing/billing-metrics.ts");

const available = { storageAvailable: true, queryFailed: false, limitation: null, totalCount: 0, totalPages: 1, rows: [], query: {} };

test("Billing is a finance overview hub protected by finance.overview.view", () => {
  assert.equal(findAdminV2Route("billing")?.implemented, true);
  assert.equal(adminV2AccessRules.billing.permission, "finance.overview.view");
  assert.match(page, /requireAdminV2RouteAccess\(session,\s*"billing"\)/);
  assert.match(page, /AdminV2BillingView/);
});

test("Billing composes real analytics, ledger, expense, refund, and invoice sources", () => {
  assert.match(query, /getAdminV2Analytics/);
  assert.match(query, /getAdminV2Transactions/);
  assert.match(query, /getAdminV2Refunds/);
  assert.match(query, /getAdminV2Expenses/);
  assert.match(query, /getAdminV2Invoices/);
  assert.doesNotMatch(query + metricsSource + view, /Bank Balance|Net Profit|Available Balance/i);
});

test("Billing summary labels are truthful to available persisted sources", () => {
  const result = billingMetrics.buildAdminV2BillingResult({
    analytics: { available: true, limitation: null, kpis: { payableSales: 1000 } } as never,
    transactions: { ...available, metrics: { verifiedPayments: 2, verifiedAmount: 700, verifiedAmountSummary: { kind: "single", amount: 700, currencyCode: "BDT", currencies: ["BDT"] }, pendingPayments: 0, codDue: 300, codDueSummary: { kind: "single", amount: 300, currencyCode: "BDT", currencies: ["BDT"] }, failedOrRefunded: 1 } } as never,
    refunds: { ...available, metrics: { refundedOrders: 1, refundedAmount: 100, refundedAmountSummary: { kind: "single", amount: 100, currencyCode: "BDT", currencies: ["BDT"] }, fullRefunds: 0, partialRefunds: 1, refundRequests: 0 } } as never,
    expenses: { ...available, metrics: { activeExpenses: 3, activeAmount: 250, activeAmountSummary: { kind: "single", amount: 250, currencyCode: "BDT", currencies: ["BDT"] }, voidExpenses: 0, linkedOrders: 1 } } as never,
    invoices: { ...available, metrics: { issuedInvoices: 4, totalInvoicedValue: 900 } } as never,
  });
  assert.deepEqual(result.summary.map((item) => item.label), [
    "Payable Sales",
    "Recorded Payments",
    "Recorded Due",
    "Recorded Refunds",
    "Recorded Expenses",
    "Issued Invoices",
  ]);
  assert.deepEqual(result.modules.map((item) => item.title), ["Invoices", "Transactions", "Refunds", "Expenses", "Reports"]);
});

test("Billing does not collapse mixed finance currencies into one BDT value", () => {
  const result = billingMetrics.buildAdminV2BillingResult({
    analytics: { available: true, limitation: null, kpis: { payableSales: 1000 } } as never,
    transactions: { ...available, metrics: { verifiedPayments: 2, verifiedAmount: 700, verifiedAmountSummary: { kind: "mixed", amount: null, currencyCode: null, currencies: ["BDT", "USD"] }, pendingPayments: 0, codDue: 0, codDueSummary: { kind: "none", amount: 0, currencyCode: null, currencies: [] }, failedOrRefunded: 0 } } as never,
    refunds: { ...available, metrics: { refundedOrders: 1, refundedAmount: 100, refundedAmountSummary: { kind: "mixed", amount: null, currencyCode: null, currencies: ["BDT", "USD"] }, fullRefunds: 0, partialRefunds: 1, refundRequests: 0 } } as never,
    expenses: { ...available, metrics: { activeExpenses: 2, activeAmount: 250, activeAmountSummary: { kind: "mixed", amount: null, currencyCode: null, currencies: ["BDT", "LKR"] }, voidExpenses: 0, linkedOrders: 1 } } as never,
    invoices: { ...available, metrics: { issuedInvoices: 4, totalInvoicedValue: 900 } } as never,
  });
  assert.equal(result.summary.find((item) => item.label === "Recorded Payments")?.displayValue, "Mixed currencies");
  assert.equal(result.summary.find((item) => item.label === "Recorded Refunds")?.displayValue, "Mixed currencies");
  assert.equal(result.summary.find((item) => item.label === "Recorded Expenses")?.displayValue, "Mixed currencies");
});

test("Billing preview routes to full modules without creating local fake finance actions", () => {
  for (const href of ["/admin-v2/invoices", "/admin-v2/transactions", "/admin-v2/refunds", "/admin-v2/expenses", "/admin-v2/reports"]) {
    assert.match(metricsSource, new RegExp(href.replaceAll("/", "\\/")));
  }
  assert.doesNotMatch(view + page, />\s*(Mark Paid|Capture|Settle|Refund Now|Create Expense|Save|Submit|Delete)\s*</i);
});
