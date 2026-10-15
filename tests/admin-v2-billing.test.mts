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
const orderDueSource = await import("../lib/admin-v2/billing/order-due-source.ts");
hooks.deregister();

const read = (file: string) => readFileSync(new URL(`../${file}`, import.meta.url), "utf8");

const page = read("app/admin-v2/billing/page.tsx");
const diagnosticsPage = read("app/admin-v2/billing/diagnostics/page.tsx");
const view = read("components/admin-v2/views/billing/AdminV2BillingView.tsx");
const query = read("lib/admin-v2/billing/billing-query.ts");
const metricsSource = read("lib/admin-v2/billing/billing-metrics.ts");
const dueSource = read("lib/admin-v2/billing/order-due-source.ts");
const moneySource = read("lib/admin-v2/finance/money.ts");
const invoiceQuerySource = read("lib/admin-v2/invoices/invoices-query.ts");

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
  assert.match(dueSource, /"subtotal"[\s\S]*"discount_amount"[\s\S]*"delivery_charge"[\s\S]*"total"[\s\S]*"due_amount"/);
  assert.match(dueSource, /"order_ref"[\s\S]*"delivery_status"[\s\S]*"payment_status"[\s\S]*"payment_method"/);
  assert.match(dueSource, /status: "neq\.Cancelled"/);
  assert.match(dueSource, /archived_at: "is\.null"/);
  assert.match(dueSource, /currencyCode: row\.currency_code \|\| "BDT"/);
  assert.doesNotMatch(dueSource, /customer|phone|email|address/i);
  assert.doesNotMatch(query + metricsSource + view, /Bank Balance|Net Profit|Available Balance/i);
  assert.match(moneySource, /minimumFractionDigits:\s*2/);
  assert.match(moneySource, /maximumFractionDigits:\s*2/);
  assert.match(invoiceQuerySource, /issuedInvoicesOnCancelledOrders/);
  assert.match(invoiceQuerySource, /statuses\.get\(row\.orderReference\) === "Cancelled"/);
});

test("Billing summary labels are truthful to available persisted sources", () => {
  const result = billingMetrics.buildAdminV2BillingResult({
    analytics: { available: true, limitation: null, kpis: { payableSales: 1000 } } as never,
    transactions: { ...available, metrics: { totalLedgerEntries: 3, recordedPayments: 2, recordedAmountSummary: singleBdt(700), voidedPayments: 1 } } as never,
    orderDue: { available: true, complete: false, knownCount: 2, eligibleOrderCount: 21, summary: singleBdt(2840), orderValueKnownCount: 8, orderValueSummary: singleBdt(5181.34), calculatedPayableKnownCount: 8, calculatedPayableSummary: singleBdt(5261.34), arithmeticMismatchCount: 1, arithmeticMismatchDifferenceSummary: singleBdt(80), limitation: "Recorded due from 2 orders with persisted due snapshots; 19 eligible older orders without a due snapshot are excluded." } as never,
    refunds: { ...available, metrics: { recordedRefunds: 1, recordedAmountSummary: singleBdt(100), voidedRefunds: 0, totalLedgerEntries: 1 } } as never,
    expenses: { ...available, metrics: { activeExpenses: 3, activeAmount: 250, activeAmountSummary: singleBdt(250), voidExpenses: 0, linkedOrders: 1 } } as never,
    invoices: { ...available, metrics: { issuedInvoices: 4, totalInvoicedValue: 900, issuedInvoicesOnCancelledOrders: 1, issuedCancelledOrderValue: 92 } } as never,
  });
  assert.deepEqual(result.summary.map((item) => item.label), [
    "Eligible Order Value",
    "Recorded Payments",
    "Known Due",
    "Recorded Refunds",
    "Recorded Expenses",
    "Issued Invoices",
  ]);
  assert.deepEqual(result.modules.map((item) => item.title), ["Invoices", "Transactions", "Refunds", "Expenses", "Reports"]);
  assert.match(result.notes.join("\n"), /1 eligible order total differs from the arithmetic payable calculation/);
  assert.match(result.notes.join("\n"), /payment RPC calculates payable from subtotal minus discount plus delivery/);
  assert.match(result.notes.join("\n"), /1 issued invoice is associated with cancelled orders/);
});

test("Billing does not collapse mixed finance currencies into one BDT value", () => {
  const result = billingMetrics.buildAdminV2BillingResult({
    analytics: { available: true, limitation: null, kpis: { payableSales: 1000 } } as never,
    transactions: { ...available, metrics: { totalLedgerEntries: 2, recordedPayments: 2, recordedAmountSummary: { kind: "mixed", amount: null, currencyCode: null, currencies: ["BDT", "USD"] }, voidedPayments: 0 } } as never,
    orderDue: { available: true, complete: true, knownCount: 0, eligibleOrderCount: 0, summary: noneMoney, orderValueKnownCount: 0, orderValueSummary: noneMoney, limitation: null } as never,
    refunds: { ...available, metrics: { recordedRefunds: 1, recordedAmountSummary: { kind: "mixed", amount: null, currencyCode: null, currencies: ["BDT", "USD"] }, voidedRefunds: 0, totalLedgerEntries: 1 } } as never,
    expenses: { ...available, metrics: { activeExpenses: 2, activeAmount: 250, activeAmountSummary: { kind: "mixed", amount: null, currencyCode: null, currencies: ["BDT", "LKR"] }, voidExpenses: 0, linkedOrders: 1 } } as never,
    invoices: { ...available, metrics: { issuedInvoices: 4, totalInvoicedValue: 900 } } as never,
  });
  assert.equal(result.summary.find((item) => item.label === "Recorded Payments")?.displayValue, "Mixed currencies");
  assert.equal(result.summary.find((item) => item.label === "Recorded Refunds")?.displayValue, "Mixed currencies");
  assert.equal(result.summary.find((item) => item.label === "Recorded Expenses")?.displayValue, "Mixed currencies");
});

test("Billing Known Due comes from dedicated persisted order snapshots", () => {
  const result = billingMetrics.buildAdminV2BillingResult({
    analytics: { available: true, limitation: null, kpis: { payableSales: 2840 } } as never,
    transactions: { ...available, metrics: { totalLedgerEntries: 0, recordedPayments: 0, recordedAmountSummary: noneMoney, voidedPayments: 0 } } as never,
    orderDue: { available: true, complete: false, knownCount: 2, eligibleOrderCount: 21, summary: singleBdt(2840), orderValueKnownCount: 8, orderValueSummary: singleBdt(5181.34), limitation: "Recorded due from 2 orders with persisted due snapshots; 19 eligible older orders without a due snapshot are excluded." } as never,
    refunds: { ...available, metrics: { recordedRefunds: 0, recordedAmountSummary: noneMoney, voidedRefunds: 0, totalLedgerEntries: 0 } } as never,
    expenses: { ...available, metrics: { activeExpenses: 0, activeAmount: 0, activeAmountSummary: noneMoney, voidExpenses: 0, linkedOrders: 0 } } as never,
    invoices: { ...available, metrics: { issuedInvoices: 3, totalInvoicedValue: 2840 } } as never,
  });
  const due = result.summary.find((item) => item.label === "Known Due");
  assert.equal(due?.value, 2840);
  assert.equal(due?.source, "orderDue");
  assert.match(due?.helper ?? "", /2 orders with persisted due snapshots/);
  assert.doesNotMatch(metricsSource, /codDueSummary/);
});

test("Billing due distinguishes unavailable, legitimate zero, and mixed currencies", () => {
  const base = {
    analytics: { available: true, limitation: null, kpis: { payableSales: 0 } } as never,
    transactions: { ...available, metrics: { totalLedgerEntries: 0, recordedPayments: 0, recordedAmountSummary: noneMoney, voidedPayments: 0 } } as never,
    refunds: { ...available, metrics: { recordedRefunds: 0, recordedAmountSummary: noneMoney, voidedRefunds: 0, totalLedgerEntries: 0 } } as never,
    expenses: { ...available, metrics: { activeExpenses: 0, activeAmount: 0, activeAmountSummary: noneMoney, voidExpenses: 0, linkedOrders: 0 } } as never,
    invoices: { ...available, metrics: { issuedInvoices: 0, totalInvoicedValue: 0 } } as never,
  };
  const unavailable = billingMetrics.buildAdminV2BillingResult({ ...base, orderDue: { available: false, complete: false, knownCount: 0, eligibleOrderCount: 0, summary: noneMoney, orderValueKnownCount: 0, orderValueSummary: noneMoney, limitation: "Recorded due snapshots could not be loaded." } as never });
  assert.equal(unavailable.summary.find((item) => item.label === "Known Due")?.available, false);
  const zero = billingMetrics.buildAdminV2BillingResult({ ...base, orderDue: { available: true, complete: true, knownCount: 2, eligibleOrderCount: 2, summary: noneMoney, orderValueKnownCount: 0, orderValueSummary: noneMoney, limitation: null } as never });
  assert.equal(zero.summary.find((item) => item.label === "Known Due")?.value, 0);
  const mixed = billingMetrics.buildAdminV2BillingResult({ ...base, orderDue: { available: true, complete: true, knownCount: 2, eligibleOrderCount: 2, summary: { kind: "mixed", amount: null, currencyCode: null, currencies: ["BDT", "USD"] }, orderValueKnownCount: 2, orderValueSummary: { kind: "mixed", amount: null, currencyCode: null, currencies: ["BDT", "USD"] }, limitation: null } as never });
  assert.equal(mixed.summary.find((item) => item.label === "Known Due")?.displayValue, "Mixed currencies");
});

test("Billing due parser treats missing values as unknown and preserves known zero", () => {
  assert.equal(orderDueSource.parseAdminV2OrderDueAmount(null), null);
  assert.equal(orderDueSource.parseAdminV2OrderDueAmount(undefined), null);
  assert.equal(orderDueSource.parseAdminV2OrderDueAmount(""), null);
  assert.equal(orderDueSource.parseAdminV2OrderDueAmount("   "), null);
  assert.equal(orderDueSource.parseAdminV2OrderDueAmount(0), 0);
  assert.equal(orderDueSource.parseAdminV2OrderDueAmount("0"), 0);
  assert.equal(orderDueSource.parseAdminV2OrderDueAmount("125.50"), 125.5);
  assert.equal(orderDueSource.parseAdminV2OrderDueAmount("invalid"), null);
});

test("Billing partial due coverage retains known amount and exposes limitation", () => {
  const result = billingMetrics.buildAdminV2BillingResult({
    analytics: { available: true, limitation: null, kpis: { payableSales: 2840 } } as never,
    transactions: { ...available, metrics: { totalLedgerEntries: 0, recordedPayments: 0, recordedAmountSummary: noneMoney, voidedPayments: 0 } } as never,
    orderDue: { available: true, complete: false, knownCount: 2, eligibleOrderCount: 8, summary: singleBdt(2840), orderValueKnownCount: 8, orderValueSummary: singleBdt(5181.34), limitation: "Recorded due from 2 orders with persisted due snapshots; 6 eligible older orders without a due snapshot are excluded." } as never,
    refunds: { ...available, metrics: { recordedRefunds: 0, recordedAmountSummary: noneMoney, voidedRefunds: 0, totalLedgerEntries: 0 } } as never,
    expenses: { ...available, metrics: { activeExpenses: 0, activeAmount: 0, activeAmountSummary: noneMoney, voidExpenses: 0, linkedOrders: 0 } } as never,
    invoices: { ...available, metrics: { issuedInvoices: 0, totalInvoicedValue: 0 } } as never,
  });
  const due = result.summary.find((item) => item.label === "Known Due");
  assert.equal(due?.value, 2840);
  assert.equal(due?.available, true);
  assert.match(due?.helper ?? "", /6 eligible older orders without a due snapshot are excluded/);
});

test("Billing due source excludes null rows from known coverage while retaining known BDT total", async () => {
  const originalUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const originalKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const originalFetch = globalThis.fetch;
  process.env.NEXT_PUBLIC_SUPABASE_URL = "https://example.supabase.co";
  process.env.SUPABASE_SERVICE_ROLE_KEY = "service-role-test";
  globalThis.fetch = (async () => new Response(JSON.stringify([
    { id: "1", subtotal: 1000, delivery_charge: 0, discount_amount: 0, total: 1000, due_amount: 1000, currency_code: "BDT" },
    { id: "2", subtotal: 42, delivery_charge: 80, discount_amount: 0, total: "42", due_amount: "1840", currency_code: "BDT" },
    { id: "3", subtotal: 500, delivery_charge: 0, discount_amount: 0, total: 500, due_amount: null, currency_code: "BDT" },
    { id: "4", subtotal: 600, delivery_charge: 0, discount_amount: 0, total: 600, due_amount: undefined, currency_code: "BDT" },
    { id: "5", subtotal: 700, delivery_charge: 0, discount_amount: 0, total: 700, due_amount: "", currency_code: "BDT" },
    { id: "6", subtotal: 800, delivery_charge: 0, discount_amount: 0, total: 800, due_amount: "   ", currency_code: "BDT" },
    { id: "7", subtotal: 900, delivery_charge: 0, discount_amount: 0, total: 900, due_amount: null, currency_code: "BDT" },
    { id: "8", subtotal: 639.34, delivery_charge: 0, discount_amount: 0, total: 639.34, due_amount: null, currency_code: "BDT" },
  ]), { headers: { "content-range": "0-7/8" } })) as typeof fetch;
  try {
    const result = await orderDueSource.getAdminV2OrderDueSnapshots();
    assert.equal(result.knownCount, 2);
    assert.equal(result.eligibleOrderCount, 8);
    assert.equal(result.complete, false);
    assert.deepEqual(result.summary, singleBdt(2840));
    assert.equal(result.orderValueKnownCount, 8);
    assert.deepEqual(result.orderValueSummary, singleBdt(5181.34));
    assert.equal(result.calculatedPayableKnownCount, 8);
    assert.deepEqual(result.calculatedPayableSummary, singleBdt(5261.34));
    assert.equal(result.arithmeticMismatchCount, 1);
    assert.deepEqual(result.arithmeticMismatchDifferenceSummary, singleBdt(80));
    assert.match(result.limitation ?? "", /6 eligible older orders without a due snapshot are excluded/);
  } finally {
    if (originalUrl === undefined) delete process.env.NEXT_PUBLIC_SUPABASE_URL;
    else process.env.NEXT_PUBLIC_SUPABASE_URL = originalUrl;
    if (originalKey === undefined) delete process.env.SUPABASE_SERVICE_ROLE_KEY;
    else process.env.SUPABASE_SERVICE_ROLE_KEY = originalKey;
    globalThis.fetch = originalFetch;
  }
});

test("Billing reconciliation exposes amount, delivery, COD, and missing snapshot issues", async () => {
  const originalUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const originalKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const originalFetch = globalThis.fetch;
  process.env.NEXT_PUBLIC_SUPABASE_URL = "https://example.supabase.co";
  process.env.SUPABASE_SERVICE_ROLE_KEY = "service-role-test";
  globalThis.fetch = (async () => new Response(JSON.stringify([
    {
      id: "1",
      order_ref: "AEV-MISMATCH",
      subtotal: 42,
      delivery_charge: 80,
      discount_amount: 0,
      total: 42,
      paid_amount: 0,
      due_amount: null,
      currency_code: "BDT",
      status: "Confirmed",
      delivery_status: "pending",
      payment_status: "pending",
      payment_method: "Cash on Delivery",
    },
    {
      id: "2",
      order_ref: "AEV-DELIVERED-COD",
      subtotal: 1020,
      delivery_charge: 0,
      discount_amount: 0,
      total: 1020,
      paid_amount: 0,
      due_amount: 1020,
      currency_code: "BDT",
      status: "Delivered",
      delivery_status: null,
      payment_status: "pending",
      payment_method: "Cash on Delivery",
    },
    {
      id: "3",
      order_ref: "AEV-SHIPPED",
      subtotal: 25,
      delivery_charge: 0,
      discount_amount: 0,
      total: 25,
      paid_amount: null,
      due_amount: null,
      currency_code: "BDT",
      status: "Shipped",
      delivery_status: null,
      payment_status: "pending",
      payment_method: "Cash on Delivery",
    },
  ]), { headers: { "content-range": "0-2/3" } })) as typeof fetch;
  try {
    const due = await orderDueSource.getAdminV2OrderDueSnapshots();
    assert.equal(due.arithmeticMismatchCount, 1);
    assert.equal(due.missingDueSnapshotCount, 2);
    assert.equal(due.deliveryStatusMismatchCount, 2);
    assert.equal(due.codDeliveredUnpaidCount, 1);
    assert.deepEqual(
      due.reconciliationIssues.map((issue) => issue.kind),
      ["total_mismatch", "delivery_status_mismatch", "delivery_status_mismatch", "cod_delivered_unpaid", "missing_due_snapshot", "missing_due_snapshot"]
    );
    const result = billingMetrics.buildAdminV2BillingResult({
      analytics: { available: true, limitation: null, kpis: { payableSales: 0 } } as never,
      transactions: { ...available, metrics: { totalLedgerEntries: 0, recordedPayments: 0, recordedAmountSummary: noneMoney, voidedPayments: 0 } } as never,
      orderDue: due,
      refunds: { ...available, metrics: { recordedRefunds: 0, recordedAmountSummary: noneMoney, voidedRefunds: 0, totalLedgerEntries: 0 } } as never,
      expenses: { ...available, metrics: { activeExpenses: 0, activeAmount: 0, activeAmountSummary: noneMoney, voidExpenses: 0, linkedOrders: 0 } } as never,
      invoices: { ...available, metrics: { issuedInvoices: 0, totalInvoicedValue: 0, issuedInvoicesOnCancelledOrders: 0 } } as never,
    });
    assert.equal(result.reconciliation.issueCount, 6);
    assert.match(result.notes.join("\n"), /courier-held cash is not treated as merchant-received payment/);
  } finally {
    if (originalUrl === undefined) delete process.env.NEXT_PUBLIC_SUPABASE_URL;
    else process.env.NEXT_PUBLIC_SUPABASE_URL = originalUrl;
    if (originalKey === undefined) delete process.env.SUPABASE_SERVICE_ROLE_KEY;
    else process.env.SUPABASE_SERVICE_ROLE_KEY = originalKey;
    globalThis.fetch = originalFetch;
  }
});

test("Billing due source keeps mixed explicit currencies non-aggregatable", async () => {
  const originalUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const originalKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const originalFetch = globalThis.fetch;
  process.env.NEXT_PUBLIC_SUPABASE_URL = "https://example.supabase.co";
  process.env.SUPABASE_SERVICE_ROLE_KEY = "service-role-test";
  globalThis.fetch = (async () => new Response(JSON.stringify([
    { id: "1", due_amount: 100, currency_code: "BDT" },
    { id: "2", due_amount: 25, currency_code: "USD" },
  ]), { headers: { "content-range": "0-1/2" } })) as typeof fetch;
  try {
    const result = await orderDueSource.getAdminV2OrderDueSnapshots();
    assert.equal(result.knownCount, 2);
    assert.equal(result.eligibleOrderCount, 2);
    assert.equal(result.complete, true);
    assert.equal(result.summary.kind, "mixed");
    assert.deepEqual(result.summary.currencies, ["BDT", "USD"]);
  } finally {
    if (originalUrl === undefined) delete process.env.NEXT_PUBLIC_SUPABASE_URL;
    else process.env.NEXT_PUBLIC_SUPABASE_URL = originalUrl;
    if (originalKey === undefined) delete process.env.SUPABASE_SERVICE_ROLE_KEY;
    else process.env.SUPABASE_SERVICE_ROLE_KEY = originalKey;
    globalThis.fetch = originalFetch;
  }
});

test("Billing preview routes to full modules without creating local fake finance actions", () => {
  for (const href of ["/admin-v2/invoices", "/admin-v2/transactions", "/admin-v2/refunds", "/admin-v2/expenses", "/admin-v2/reports"]) {
    assert.match(metricsSource, new RegExp(href.replaceAll("/", "\\/")));
  }
  assert.doesNotMatch(view + page, />\s*(Mark Paid|Capture|Settle|Refund Now|Create Expense|Save|Submit|Delete)\s*</i);
});

test("Billing V3 presentation uses the restored atmospheric background and truthful trend empty state", () => {
  assert.match(view, /aev-admin-v2-billing-v3/);
  assert.match(view, /radial-gradient\(circle at 82% 12%, rgba\(255,77,184,0\.18\), transparent 30%\)/);
  assert.match(view, /radial-gradient\(circle at 14% 2%, rgba\(49,230,212,0\.12\), transparent 26%\)/);
  assert.match(view, /linear-gradient\(180deg, rgba\(5,7,18,0\.40\), rgba\(5,7,18,0\.92\)\)/);
  assert.doesNotMatch(view, /ethereal_plum_floral_ribbon_frame|dreamy_plum_floral_silk_bloom/);
  assert.match(view, /Real all-time snapshots are available/);
  assert.match(view, /No trend line or growth history is inferred/);
  assert.match(view, /moduleDisplayLabels[\s\S]*Transactions:\s*"Payments"/);
  assert.doesNotMatch(view, /trendPercentage|growthRate|sparklineData|fakeTrend/i);
});

test("Billing distinguishes unavailable finance sources from successful empty results", () => {
  assert.match(view, /function TruthfulTrendPanel\(\{ available \}/);
  assert.match(view, /<TruthfulTrendPanel available=\{data\.sources\.analytics\.available\} \/>/);
  assert.match(view, /Finance snapshot sources are unavailable, so Billing cannot present a trend summary/);
  assert.match(view, /Real all-time snapshots are available, but a dated finance series is not/);

  assert.match(view, /!data\.sources\.invoices\.available \? \([\s\S]*Invoice data is unavailable[\s\S]*data\.tables\.invoices\.length === 0/);
  assert.match(view, /No invoice records exist yet/);
  assert.doesNotMatch(view, /No invoice records were loaded/);

  assert.match(view, /!data\.sources\.transactions\.available \? \([\s\S]*Payment ledger data is unavailable[\s\S]*data\.tables\.transactions\.length === 0/);
  assert.match(view, /No payment ledger entries exist yet/);
});

test("Billing financial notices use truthful notice semantics behind an accessible detail control", () => {
  assert.match(view, /function FinancialNotices/);
  assert.match(view, /sourceAlerts\(data\)/);
  assert.match(view, /highlightedNotices\.length/);
  assert.match(view, /Financial notices/);
  assert.match(view, /notices\.length === 1 \? "notice" : "notices"/);
  assert.match(view, /actionable reconciliation counts remain in the control center above/);
  assert.doesNotMatch(view, /active \$\{[^}]+\}[^`]*(?:issue|issues)/);
  assert.doesNotMatch(view, /No active discrepancy warning/);
  assert.match(view, /Show details/);
  assert.match(view, /Hide details/);
  assert.match(view, /aria-expanded=\{detailsOpen\}/);
  assert.match(view, /aria-controls="billing-financial-notices-details"/);
  assert.match(view, /\{!detailsOpen && highlightedNotices\.length > 0 \? \(/);
  assert.match(view, /highlightedNotices\.slice\(0, 2\)\.map/);
  assert.match(view, /highlightedNotices\.length - 2/);
  assert.match(view, /\{notices\.map\(\(notice\) => \(/);
  assert.match(view, /<Collapse in=\{detailsOpen\}/);
  assert.match(view, /findIndex\(\(candidate\) => candidate\.message === notice\.message\)/);
  assert.doesNotMatch(view, /data\.notes\.map\(\(note\) => \(\s*<Alert/);
});


test("Billing keeps overview concise and moves detailed finance exceptions to the secured diagnostics page", () => {
  assert.match(diagnosticsPage, /requireAdminV2Session\(\)/);
  assert.match(diagnosticsPage, /requireAdminV2RouteAccess\(session, "billing"\)/);
  assert.match(diagnosticsPage, /getAdminV2BillingOverview\(scope\)/);
  assert.match(diagnosticsPage, /mode="diagnostics"/);
  assert.match(view, /isDiagnostics = mode === "diagnostics"/);
  assert.match(view, /href="\/admin-v2\/billing\/diagnostics\?scope=test"/);
  assert.match(view, /View Diagnostics/);
  assert.match(view, /\{isDiagnostics \? \(/);
  assert.match(view, /<ReconciliationWorkspace data=\{data\} \/>/);
  assert.match(view, /<FinancialNotices notes=\{data\.notes\} sources=\{alerts\} \/>/);
  assert.match(view, /reconciliation flags/);
  assert.match(view, /filteredIssues\.slice\(0, visibleCount\)/);
  assert.match(view, /setVisibleCount\(\(current\) => current \+ 50\)/);
  assert.match(view, /Test-only diagnostics/);
  assert.equal(adminV2AccessRules.billing.permission, "finance.overview.view");
});
