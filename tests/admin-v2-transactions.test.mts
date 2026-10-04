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
const transactionMetrics = await import("../lib/admin-v2/transactions/transaction-metrics.ts");
const transactionsQuery = await import("../lib/admin-v2/transactions/transactions-query.ts");
hooks.deregister();

const transactionsPage = readFileSync(new URL("../app/admin-v2/transactions/page.tsx", import.meta.url), "utf8");
const transactionsView = readFileSync(new URL("../components/admin-v2/views/transactions/AdminV2TransactionsView.tsx", import.meta.url), "utf8");
const transactionsQuerySource = readFileSync(new URL("../lib/admin-v2/transactions/transactions-query.ts", import.meta.url), "utf8");
const transactionMetricsSource = readFileSync(new URL("../lib/admin-v2/transactions/transaction-metrics.ts", import.meta.url), "utf8");

test("Transactions route is implemented as order payment reconciliation and unrelated billing modules stay coming soon", () => {
  assert.equal(findAdminV2Route("transactions")?.implemented, true);
  assert.equal(findAdminV2Route("refunds")?.implemented, true);
  assert.equal(findAdminV2Route("billing")?.implemented, true);
  for (const module of ["expenses", "tax"] as const) {
    assert.equal(findAdminV2Route(module)?.implemented, false);
  }
  assert.match(findAdminV2Route("transactions")?.description ?? "", /payment reconciliation/i);
  assert.match(transactionsPage, /AdminV2TransactionsView/);
  assert.doesNotMatch(transactionsPage, /AdminV2ModulePage/);
});

test("Transactions access requires orders.view instead of broad billing section fallback", () => {
  assert.equal(adminV2AccessRules.transactions.permission, "orders.view");
  assert.equal(adminV2AccessRules.transactions.section, undefined);
  assert.match(transactionsPage, /requireAdminV2RouteAccess\(session,\s*"transactions"\)/);
});

test("Transactions query uses real order payment fields with server-side pagination and exact count", () => {
  assert.match(transactionsQuerySource, /import "server-only"/);
  assert.match(transactionsQuerySource, /orders\?/);
  assert.match(transactionsQuerySource, /payment_method/);
  assert.match(transactionsQuerySource, /wallet_provider/);
  assert.match(transactionsQuerySource, /payment_type/);
  assert.match(transactionsQuerySource, /transaction_id/);
  assert.match(transactionsQuerySource, /payment_status/);
  assert.match(transactionsQuerySource, /payment_verified_at/);
  assert.match(transactionsQuerySource, /payment_verification_status/);
  assert.match(transactionsQuerySource, /payment_reference/);
  assert.match(transactionsQuerySource, /paid_amount/);
  assert.match(transactionsQuerySource, /due_amount/);
  assert.match(transactionsQuerySource, /refunded_amount/);
  assert.match(transactionsQuerySource, /refund_exchange_request/);
  assert.doesNotMatch(transactionsQuerySource, /"deleted_at"|"soft_deleted_at"/);
  assert.match(transactionsQuerySource, /prefer:\s*"count=exact"/);
  assert.match(transactionsQuerySource, /range:\s*`\$\{from\}-\$\{to\}`/);
  assert.doesNotMatch(transactionsQuerySource, /payment_transactions|gateway_events|settlement|payout|stripe|paypal|faker|mock|Math\.random/i);
});

test("Query failure is distinct from a valid empty result and does not imply zero KPI data", async () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  delete process.env.NEXT_PUBLIC_SUPABASE_URL;
  delete process.env.SUPABASE_SERVICE_ROLE_KEY;
  try {
    const failed = await transactionsQuery.getAdminV2Transactions(new URLSearchParams());
    assert.equal(failed.queryFailed, true);
    assert.equal(failed.storageAvailable, false);
    assert.match(failed.limitation ?? "", /fake transaction data|could not be loaded/i);
  } finally {
    if (supabaseUrl !== undefined) process.env.NEXT_PUBLIC_SUPABASE_URL = supabaseUrl;
    if (serviceRoleKey !== undefined) process.env.SUPABASE_SERVICE_ROLE_KEY = serviceRoleKey;
  }

  const emptyMetrics = transactionMetrics.buildAdminV2TransactionMetrics([]);
  assert.deepEqual(emptyMetrics, {
    verifiedPayments: 0,
    verifiedAmount: 0,
    pendingPayments: 0,
    codDue: 0,
    failedOrRefunded: 0,
  });
  assert.match(transactionsView, /!data\.queryFailed/);
  assert.match(transactionsView, /Payment records could not be loaded/);
});

test("Transaction filters and search are sanitized and limited to supported payment fields", () => {
  const query = transactionMetrics.parseAdminV2TransactionQuery(
    new URLSearchParams("q=(abc%),ref&method=Mobile+Wallet+Payment&status=verified&verification=Verified&from=2026-10-01&to=2026-10-31&page=2&pageSize=500")
  );
  assert.deepEqual(query, {
    q: "(abc%),ref",
    method: "Mobile Wallet Payment",
    status: "verified",
    verification: "Verified",
    from: "2026-10-01",
    to: "2026-10-31",
    page: 2,
    pageSize: 50,
  });
  const fallback = transactionMetrics.parseAdminV2TransactionQuery(new URLSearchParams("method=Card&status=settled&verification=Captured&from=bad&page=-1"));
  assert.equal(fallback.method, "all");
  assert.equal(fallback.status, "all");
  assert.equal(fallback.verification, "all");
  assert.equal(fallback.from, "");
  assert.equal(fallback.page, 1);
  assert.ok(transactionsQuerySource.includes('query.q.replace(/[%,()]/g, " ").trim()'));
  assert.match(transactionsQuerySource, /transaction_id\.ilike/);
  assert.match(transactionsQuerySource, /payment_reference\.ilike/);
});

test("Payment status semantics stay distinct from order status and COD does not imply paid", () => {
  const rows = [
    transactionsQuery.mapAdminV2TransactionRow({
      order_ref: "AEV-COD",
      customer_name: "Customer",
      payment_method: "Cash on Delivery",
      payment_status: "pending",
      due_amount: 500,
      paid_amount: 0,
      status: "Delivered",
    }),
    transactionsQuery.mapAdminV2TransactionRow({
      order_ref: "AEV-PAID",
      customer_name: "Paid",
      payment_method: "Mobile Wallet Payment",
      payment_status: "verified",
      paid_amount: 300,
      due_amount: 0,
      status: "Pending",
    }),
  ];
  const metrics = transactionMetrics.buildAdminV2TransactionMetrics(rows);
  assert.equal(rows[0].paymentStatus, "pending");
  assert.equal(rows[0].orderStatus, "Delivered");
  assert.equal(metrics.verifiedPayments, 1);
  assert.equal(metrics.verifiedAmount, 300);
  assert.equal(metrics.pendingPayments, 1);
  assert.equal(metrics.codDue, 500);
  assert.doesNotMatch(transactionMetricsSource + transactionsQuerySource, /status === "Delivered".*verified|Delivered.*Paid|Confirmed.*Paid|Completed.*Paid/s);
});

test("Metrics use persisted paid, due and refunded amounts only", () => {
  const metrics = transactionMetrics.buildAdminV2TransactionMetrics([
    { id: "1", orderReference: "one", customerName: "One", customerContact: "Not provided", paymentMethod: "Mobile Wallet Payment", walletProvider: "bKash", paymentType: "Send Money", paymentStatus: "verified", verificationStatus: "Verified", transactionReference: "trx", paymentReference: "", paidAmount: 120, dueAmount: null, refundedAmount: null, totalAmount: 999, currencyCode: "BDT", orderStatus: "Pending", createdAt: "2026-10-01T00:00:00.000Z", paymentVerifiedAt: "2026-10-01T00:10:00.000Z", refundExchangeRequest: "" },
    { id: "2", orderReference: "two", customerName: "Two", customerContact: "Not provided", paymentMethod: "Cash on Delivery", walletProvider: "", paymentType: "", paymentStatus: "pending", verificationStatus: "Not Required", transactionReference: "", paymentReference: "", paidAmount: null, dueAmount: 220, refundedAmount: null, totalAmount: 220, currencyCode: "BDT", orderStatus: "Delivered", createdAt: "2026-10-02T00:00:00.000Z", paymentVerifiedAt: "", refundExchangeRequest: "" },
    { id: "3", orderReference: "three", customerName: "Three", customerContact: "Not provided", paymentMethod: "Bank Transfer", walletProvider: "", paymentType: "", paymentStatus: "refunded", verificationStatus: "Verified", transactionReference: "", paymentReference: "bank", paidAmount: 300, dueAmount: 0, refundedAmount: 50, totalAmount: 300, currencyCode: "BDT", orderStatus: "Cancelled", createdAt: "2026-10-03T00:00:00.000Z", paymentVerifiedAt: "", refundExchangeRequest: "Customer refund" },
  ]);
  assert.deepEqual(metrics, {
    verifiedPayments: 1,
    verifiedAmount: 120,
    pendingPayments: 1,
    codDue: 220,
    failedOrRefunded: 1,
  });
});

test("Transactions view is read-only and exposes only supported payment overview columns and View Order", () => {
  assert.doesNotMatch(transactionsView, /Review and reconcile payment information recorded against orders/);
  assert.match(transactionsView, /Order-based payment records - gateway settlement\/payout data unavailable/);
  assert.doesNotMatch(transactionsView, /Payment information shown here comes from order payment records/);
  for (const label of ["Payment / Order", "Customer", "Method", "Payment Status", "Verification", "Reference", "Amounts", "Date", "Actions"]) {
    assert.match(transactionsView, new RegExp(label));
  }
  assert.match(transactionsView, /View Order/);
  assert.match(transactionsView, /\/admin-v2\/orders\/\$\{encodeURIComponent\(orderReference\)\}/);
  assert.doesNotMatch(transactionsView, /Mark Paid|Refund Now|Download Receipt|View Gateway|Edit Transaction|Delete Transaction/i);
  assert.doesNotMatch(transactionsView, />Capture<|>Settle<|>Retry</i);
});

test("Transactions view uses one compact KPI surface with five metric cells", () => {
  assert.match(transactionsView, /function MetricCell/);
  assert.equal((transactionsView.match(/<MetricCell /g) ?? []).length, 5);
  assert.doesNotMatch(transactionsView, /V2MetricCard/);
  assert.match(transactionsView, /minHeight:\s*\{\s*xs:\s*58,\s*lg:\s*64\s*\}/);
  assert.match(transactionsView, /<Icon size=\{15\}/);
  assert.match(transactionsView, /Verified Payments/);
  assert.match(transactionsView, /Verified Amount/);
  assert.match(transactionsView, /Pending Payments/);
  assert.match(transactionsView, /COD Due/);
  assert.match(transactionsView, /Failed \/ Refunded/);
});

test("Transactions empty and filtered-empty states stay separate from query failure", () => {
  assert.match(transactionsView, /No payment records found/);
  assert.match(transactionsView, /No orders match these payment filters/);
  assert.match(transactionsView, /hasFilters \? "No orders match these payment filters\." : "No payment records found\."/);
  assert.match(transactionsView, /hasFilters \? <Button href="\/admin-v2\/transactions" variant="outlined" sx=\{\{ minHeight: 38, px: 2 \}\}>Reset<\/Button> : null/);
});

test("Transactions table is internally scrollable with compact sticky rows", () => {
  assert.match(transactionsView, /maxHeight:\s*\{\s*md:\s*460\s*\}/);
  assert.match(transactionsView, /<Table size="small" stickyHeader/);
  assert.match(transactionsView, /tableLayout:\s*"fixed"/);
  assert.match(transactionsView, /py:\s*0\.75/);
  assert.match(transactionsView, /compactMethodLabel\(row\)/);
  assert.match(transactionsView, /sx=\{\{ minHeight: 30, px: 1\.25 \}\}/);
});

test("Refund display uses persisted order-level fields only and no fake transaction IDs are introduced", () => {
  const row = transactionsQuery.mapAdminV2TransactionRow({
    order_ref: "AEV-REFUND",
    payment_status: "refunded",
    refunded_amount: 75,
    payment_reference: "",
    transaction_id: "",
    customer_name: "",
  });
  assert.equal(row.paymentStatus, "refunded");
  assert.equal(row.refundedAmount, 75);
  assert.equal(row.paymentReference, "");
  assert.equal(row.transactionReference, "");
  assert.equal(row.customerName, "Not provided");
  assert.doesNotMatch(transactionsQuerySource, /refund_id|processor|gateway_fee|settlement_id|payout_id|available_balance|card_last4|receipt_url/i);
  assert.doesNotMatch(transactionsView, /Refund Now|gateway fee|available balance|card last4|receipt url/i);
});

test("No transaction table migration or synthetic ledger model is introduced", () => {
  const migrationNames = readdirSync(new URL("../supabase/migrations", import.meta.url)).join("\n");
  assert.doesNotMatch(migrationNames, /transaction|payment|settlement|payout|refund/i);
  assert.doesNotMatch(transactionsQuerySource, /from\(\"payment_transactions\"\)|payment_transactions\?/);
});
