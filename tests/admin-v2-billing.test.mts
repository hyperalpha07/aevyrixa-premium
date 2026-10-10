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
const dueSource = read("lib/admin-v2/billing/order-due-source.ts");

const available = { storageAvailable: true, queryFailed: false, limitation: null, totalCount: 0, totalPages: 1, rows: [], query: {} };
const singleBdt = (amount: number) => ({ kind: "single", amount, currencyCode: "BDT", currencies: ["BDT"] });
const noneMoney = { kind: "none", amount: 0, currencyCode: null, currencies: [] };

test("Billing is a finance overview hub protected by finance.overview.view", () => {
  assert.equal(findAdminV2Route("billing")?.implemented, true);
  assert.equal(adminV2AccessRules.billing.permission, "finance.overview.view");
  assert.match(page, /requireAdminV2RouteAccess\(session,\s*"billing"\)/);
  assert.match(page, /AdminV2BillingView/);
});

test("Billing composes real analytics, ledger, expense, refund, and invoice sources", () => {
  assert.match(query, /getAdminV2Analytics/);
  assert.match(query, /getAdminV2Transactions/);
  assert.match(query, /getAdminV2OrderDueSnapshots/);
  assert.match(query, /getAdminV2Refunds/);
  assert.match(query, /getAdminV2Expenses/);
  assert.match(query, /getAdminV2Invoices/);
  assert.match(dueSource, /select: orderDueSelect/);
  assert.match(dueSource, /status: "neq\.Cancelled"/);
  assert.match(dueSource, /archived_at: "is\.null"/);
  assert.match(dueSource, /currencyCode: row\.currency_code \|\| "BDT"/);
  assert.doesNotMatch(dueSource, /customer|phone|email|address/i);
  assert.doesNotMatch(query + metricsSource + view, /Bank Balance|Net Profit|Available Balance/i);
});

test("Billing summary labels are truthful to available persisted sources", () => {
  const result = billingMetrics.buildAdminV2BillingResult({
    analytics: { available: true, limitation: null, kpis: { payableSales: 1000 } } as never,
    transactions: { ...available, metrics: { totalLedgerEntries: 3, recordedPayments: 2, recordedAmountSummary: singleBdt(700), voidedPayments: 1 } } as never,
    orderDue: { available: true, complete: false, knownCount: 2, eligibleOrderCount: 21, summary: singleBdt(2840), limitation: "Recorded due from 2 orders with persisted due snapshots; 19 eligible older orders without a due snapshot are excluded." } as never,
    refunds: { ...available, metrics: { refundedOrders: 1, refundedAmount: 100, refundedAmountSummary: singleBdt(100), fullRefunds: 0, partialRefunds: 1, refundRequests: 0 } } as never,
    expenses: { ...available, metrics: { activeExpenses: 3, activeAmount: 250, activeAmountSummary: singleBdt(250), voidExpenses: 0, linkedOrders: 1 } } as never,
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
    transactions: { ...available, metrics: { totalLedgerEntries: 2, recordedPayments: 2, recordedAmountSummary: { kind: "mixed", amount: null, currencyCode: null, currencies: ["BDT", "USD"] }, voidedPayments: 0 } } as never,
    orderDue: { available: true, complete: true, knownCount: 0, eligibleOrderCount: 0, summary: noneMoney, limitation: null } as never,
    refunds: { ...available, metrics: { refundedOrders: 1, refundedAmount: 100, refundedAmountSummary: { kind: "mixed", amount: null, currencyCode: null, currencies: ["BDT", "USD"] }, fullRefunds: 0, partialRefunds: 1, refundRequests: 0 } } as never,
    expenses: { ...available, metrics: { activeExpenses: 2, activeAmount: 250, activeAmountSummary: { kind: "mixed", amount: null, currencyCode: null, currencies: ["BDT", "LKR"] }, voidExpenses: 0, linkedOrders: 1 } } as never,
    invoices: { ...available, metrics: { issuedInvoices: 4, totalInvoicedValue: 900 } } as never,
  });
  assert.equal(result.summary.find((item) => item.label === "Recorded Payments")?.displayValue, "Mixed currencies");
  assert.equal(result.summary.find((item) => item.label === "Recorded Refunds")?.displayValue, "Mixed currencies");
  assert.equal(result.summary.find((item) => item.label === "Recorded Expenses")?.displayValue, "Mixed currencies");
});

test("Billing Recorded Due comes from dedicated persisted order snapshots", () => {
  const result = billingMetrics.buildAdminV2BillingResult({
    analytics: { available: true, limitation: null, kpis: { payableSales: 2840 } } as never,
    transactions: { ...available, metrics: { totalLedgerEntries: 0, recordedPayments: 0, recordedAmountSummary: noneMoney, voidedPayments: 0 } } as never,
    orderDue: { available: true, complete: false, knownCount: 2, eligibleOrderCount: 21, summary: singleBdt(2840), limitation: "Recorded due from 2 orders with persisted due snapshots; 19 eligible older orders without a due snapshot are excluded." } as never,
    refunds: { ...available, metrics: { refundedOrders: 0, refundedAmount: 0, refundedAmountSummary: noneMoney, fullRefunds: 0, partialRefunds: 0, refundRequests: 0 } } as never,
    expenses: { ...available, metrics: { activeExpenses: 0, activeAmount: 0, activeAmountSummary: noneMoney, voidExpenses: 0, linkedOrders: 0 } } as never,
    invoices: { ...available, metrics: { issuedInvoices: 3, totalInvoicedValue: 2840 } } as never,
  });
  const due = result.summary.find((item) => item.label === "Recorded Due");
  assert.equal(due?.value, 2840);
  assert.equal(due?.source, "orderDue");
  assert.match(due?.helper ?? "", /2 orders with persisted due snapshots/);
  assert.doesNotMatch(metricsSource, /codDueSummary/);
});

test("Billing due distinguishes unavailable, legitimate zero, and mixed currencies", () => {
  const base = {
    analytics: { available: true, limitation: null, kpis: { payableSales: 0 } } as never,
    transactions: { ...available, metrics: { totalLedgerEntries: 0, recordedPayments: 0, recordedAmountSummary: noneMoney, voidedPayments: 0 } } as never,
    refunds: { ...available, metrics: { refundedOrders: 0, refundedAmount: 0, refundedAmountSummary: noneMoney, fullRefunds: 0, partialRefunds: 0, refundRequests: 0 } } as never,
    expenses: { ...available, metrics: { activeExpenses: 0, activeAmount: 0, activeAmountSummary: noneMoney, voidExpenses: 0, linkedOrders: 0 } } as never,
    invoices: { ...available, metrics: { issuedInvoices: 0, totalInvoicedValue: 0 } } as never,
  };
  const unavailable = billingMetrics.buildAdminV2BillingResult({ ...base, orderDue: { available: false, complete: false, knownCount: 0, eligibleOrderCount: 0, summary: noneMoney, limitation: "Recorded due snapshots could not be loaded." } as never });
  assert.equal(unavailable.summary.find((item) => item.label === "Recorded Due")?.available, false);
  const zero = billingMetrics.buildAdminV2BillingResult({ ...base, orderDue: { available: true, complete: true, knownCount: 2, eligibleOrderCount: 2, summary: noneMoney, limitation: null } as never });
  assert.equal(zero.summary.find((item) => item.label === "Recorded Due")?.value, 0);
  const mixed = billingMetrics.buildAdminV2BillingResult({ ...base, orderDue: { available: true, complete: true, knownCount: 2, eligibleOrderCount: 2, summary: { kind: "mixed", amount: null, currencyCode: null, currencies: ["BDT", "USD"] }, limitation: null } as never });
  assert.equal(mixed.summary.find((item) => item.label === "Recorded Due")?.displayValue, "Mixed currencies");
});

test("Billing preview routes to full modules without creating local fake finance actions", () => {
  for (const href of ["/admin-v2/invoices", "/admin-v2/transactions", "/admin-v2/refunds", "/admin-v2/expenses", "/admin-v2/reports"]) {
    assert.match(metricsSource, new RegExp(href.replaceAll("/", "\\/")));
  }
  assert.doesNotMatch(view + page, />\s*(Mark Paid|Capture|Settle|Refund Now|Create Expense|Save|Submit|Delete)\s*</i);
});
