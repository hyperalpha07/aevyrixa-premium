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
const refundMetrics = await import("../lib/admin-v2/refunds/refund-metrics.ts");
const refundsQuery = await import("../lib/admin-v2/refunds/refunds-query.ts");
hooks.deregister();

const refundsPage = readFileSync(new URL("../app/admin-v2/refunds/page.tsx", import.meta.url), "utf8");
const refundsView = readFileSync(new URL("../components/admin-v2/views/refunds/AdminV2RefundsView.tsx", import.meta.url), "utf8");
const refundsQuerySource = readFileSync(new URL("../lib/admin-v2/refunds/refunds-query.ts", import.meta.url), "utf8");
const refundMetricsSource = readFileSync(new URL("../lib/admin-v2/refunds/refund-metrics.ts", import.meta.url), "utf8");

test("Refunds route becomes real while sibling billing modules remain coming soon", () => {
  assert.equal(findAdminV2Route("refunds")?.implemented, true);
  assert.equal(findAdminV2Route("expenses")?.implemented, false);
  assert.equal(findAdminV2Route("tax")?.implemented, false);
  assert.equal(findAdminV2Route("billing")?.implemented, false);
  assert.match(refundsPage, /AdminV2RefundsView/);
  assert.doesNotMatch(refundsPage, /AdminV2ModulePage/);
});

test("Refunds access uses orders.view instead of broad billing fallback", () => {
  assert.equal(adminV2AccessRules.refunds.permission, "orders.view");
  assert.equal(adminV2AccessRules.refunds.section, undefined);
  assert.match(refundsPage, /requireAdminV2RouteAccess\(session,\s*"refunds"\)/);
});

test("Refund query uses only existing order-level refund and payment columns", () => {
  assert.match(refundsQuerySource, /import "server-only"/);
  assert.match(refundsQuerySource, /orders\?/);
  for (const column of [
    "payment_status",
    "refunded_amount",
    "refund_exchange_request",
    "payment_reference",
    "transaction_id",
    "payment_method",
    "customer_name",
    "customer_phone",
    "customer_email",
    "subtotal",
    "total",
    "discount_amount",
    "delivery_charge",
  ]) {
    assert.match(refundsQuerySource, new RegExp(column));
  }
  assert.match(refundsQuerySource, /prefer:\s*"count=exact"/);
  assert.match(refundsQuerySource, /range:\s*`\$\{from\}-\$\{to\}`/);
  assert.doesNotMatch(refundsQuerySource, /refunds\?|refund_transactions|refund_requests|return_requests|gateway_refund|processor|settlement|payout|chargeback|store_credit|faker|mock|Math\.random/i);
  assert.doesNotMatch(refundsQuerySource, /"deleted_at"|"soft_deleted_at"/);
});

test("Only truthful refund-signal rows are included and cancelled orders are not automatically refunded", () => {
  assert.equal(refundMetrics.hasAdminV2RefundSignal({ paymentStatus: "", refundedAmount: null, requestNote: "" }), false);
  assert.equal(refundMetrics.hasAdminV2RefundSignal({ paymentStatus: "", refundedAmount: null, requestNote: "Please exchange size" }), true);
  assert.equal(refundMetrics.hasAdminV2RefundSignal({ paymentStatus: "refunded", refundedAmount: null, requestNote: "" }), true);
  assert.equal(refundMetrics.hasAdminV2RefundSignal({ paymentStatus: "", refundedAmount: 25, requestNote: "" }), true);
  assert.doesNotMatch(refundMetricsSource + refundsQuerySource, /orderStatus.*Cancelled.*refund|status === "Cancelled".*refund|Cancelled.*refunded/s);
});

test("Persisted refunded_amount is the refunded value and payable amount is used only for classification", () => {
  const row = refundsQuery.mapAdminV2RefundRow({
    id: "one",
    order_ref: "AEV-REF",
    customer_name: "Customer",
    subtotal: 100,
    total: 100,
    refunded_amount: 50,
    payment_status: "refunded",
    payment_method: "Bank Transfer",
  });
  assert.equal(row.refundedAmount, 50);
  assert.equal(row.payableAmount, 100);
  assert.equal(row.classification, "partial");
  assert.match(refundsView, /Persisted refunded_amount/);
  assert.doesNotMatch(refundsQuerySource, /refundedAmount:\s*amounts\.total|refundedAmount:\s*payable/i);
});

test("Full, partial, inconsistent, and request-only classifications are truthful", () => {
  assert.equal(refundMetrics.classifyAdminV2Refund({ refundedAmount: 100, payableAmount: 100, paymentStatus: "refunded", requestNote: "" }), "full");
  assert.equal(refundMetrics.classifyAdminV2Refund({ refundedAmount: 40, payableAmount: 100, paymentStatus: "refunded", requestNote: "" }), "partial");
  assert.equal(refundMetrics.classifyAdminV2Refund({ refundedAmount: 140, payableAmount: 100, paymentStatus: "refunded", requestNote: "" }), "inconsistent");
  assert.equal(refundMetrics.classifyAdminV2Refund({ refundedAmount: null, payableAmount: 100, paymentStatus: "", requestNote: "Refund requested" }), "request_only");
  for (const label of ["Full refund", "Partial refund", "Inconsistent amount", "Refund request only"]) {
    assert.match(refundMetricsSource + refundsView, new RegExp(label));
  }
});

test("Refund request text remains free-form and no refund date is fabricated", () => {
  assert.match(refundsView, /Request \/ Note/);
  assert.match(refundsView, /Order-level refund signals only - no gateway refund ledger or refund history is stored/);
  assert.doesNotMatch(refundsView, /Refunded At|Refund Date|Approved|Rejected|Reason|Processor|Gateway Status/i);
  assert.doesNotMatch(refundsQuerySource, /payment_verified_at/);
  assert.doesNotMatch(refundsQuerySource, /refund_date|refunded_at|processed_at|approved_at|rejected_at/i);
});

test("Refund metrics are compact and derived only from persisted order-level data", () => {
  const metrics = refundMetrics.buildAdminV2RefundMetrics([
    { id: "1", orderReference: "full", customerName: "One", customerContact: "Not provided", classification: "full", paymentStatus: "refunded", paymentMethod: "Bank Transfer", walletProvider: "", paymentType: "", reference: "ref", requestNote: "", refundedAmount: 100, payableAmount: 100, currencyCode: "BDT", orderStatus: "Delivered", createdAt: "", updatedAt: "" },
    { id: "2", orderReference: "partial", customerName: "Two", customerContact: "Not provided", classification: "partial", paymentStatus: "", paymentMethod: "Cash on Delivery", walletProvider: "", paymentType: "", reference: "Not provided", requestNote: "", refundedAmount: 40, payableAmount: 100, currencyCode: "BDT", orderStatus: "Delivered", createdAt: "", updatedAt: "" },
    { id: "3", orderReference: "request", customerName: "Three", customerContact: "Not provided", classification: "request_only", paymentStatus: "", paymentMethod: "Mobile Wallet Payment", walletProvider: "", paymentType: "", reference: "Not provided", requestNote: "Exchange please", refundedAmount: null, payableAmount: 100, currencyCode: "BDT", orderStatus: "Pending", createdAt: "", updatedAt: "" },
  ]);
  assert.deepEqual(metrics, {
    refundedOrders: 2,
    refundedAmount: 140,
    fullRefunds: 1,
    partialRefunds: 1,
    refundRequests: 1,
  });
  assert.equal((refundsView.match(/<MetricCell /g) ?? []).length, 5);
  assert.doesNotMatch(refundsView, /Processed Amount|Gateway Refund Value|Approved Refunds|Failed Refunds|Pending Processor/i);
});

test("Filters are sanitized and limited to supported refund reconciliation fields", () => {
  const query = refundMetrics.parseAdminV2RefundQuery(new URLSearchParams("q=(abc%),ref&classification=partial&method=Bank+Transfer&from=2026-10-01&to=2026-10-31&page=2&pageSize=500"));
  assert.deepEqual(query, {
    q: "(abc%),ref",
    classification: "partial",
    method: "Bank Transfer",
    from: "2026-10-01",
    to: "2026-10-31",
    page: 2,
    pageSize: 50,
  });
  const fallback = refundMetrics.parseAdminV2RefundQuery(new URLSearchParams("classification=approved&method=Card&from=bad&page=-1"));
  assert.equal(fallback.classification, "all");
  assert.equal(fallback.method, "all");
  assert.equal(fallback.from, "");
  assert.equal(fallback.page, 1);
  assert.ok(refundsQuerySource.includes('query.q.replace(/[%,()]/g, " ").trim()'));
  assert.match(refundsQuerySource, /refund_exchange_request\.ilike/);
});

test("Refunds table is read-only, compact, scrollable, and links to exact order detail", () => {
  for (const label of ["Order", "Customer", "Refund Classification", "Refunded Amount", "Payable Amount", "Payment Method", "Reference", "Request / Note", "Action"]) {
    assert.match(refundsView, new RegExp(label));
  }
  assert.match(refundsView, /View Order/);
  assert.match(refundsView, /\/admin-v2\/orders\/\$\{encodeURIComponent\(orderReference\)\}/);
  assert.match(refundsView, /maxHeight:\s*\{\s*md:\s*460\s*\}/);
  assert.match(refundsView, /<Table size="small" stickyHeader/);
  assert.match(refundsView, /tableLayout:\s*"fixed"/);
  assert.doesNotMatch(refundsView, />Issue Refund<|>Approve<|>Reject<|>Mark Refunded<|>Retry<|>Cancel Refund<|>Edit Refund</i);
});

test("Query failure does not render misleading KPI zeros and empty states are truthful", async () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  delete process.env.NEXT_PUBLIC_SUPABASE_URL;
  delete process.env.SUPABASE_SERVICE_ROLE_KEY;
  try {
    const failed = await refundsQuery.getAdminV2Refunds(new URLSearchParams());
    assert.equal(failed.queryFailed, true);
    assert.equal(failed.storageAvailable, false);
    assert.match(failed.limitation ?? "", /fake refund data|could not be loaded/i);
  } finally {
    if (supabaseUrl !== undefined) process.env.NEXT_PUBLIC_SUPABASE_URL = supabaseUrl;
    if (serviceRoleKey !== undefined) process.env.SUPABASE_SERVICE_ROLE_KEY = serviceRoleKey;
  }
  assert.match(refundsView, /!data\.queryFailed/);
  assert.match(refundsView, /No refund-related orders found/);
  assert.match(refundsView, /No orders match these refund filters/);
  assert.match(refundsView, /Refund reconciliation could not be loaded/);
});

test("No migration or refund table is added for Phase 1", () => {
  const migrationNames = readdirSync(new URL("../supabase/migrations", import.meta.url)).join("\n");
  assert.doesNotMatch(migrationNames, /refund|return|exchange/i);
  assert.doesNotMatch(refundsQuerySource, /from\(\"refunds\"\)|refunds\?|refund_transactions|refund_requests|return_requests/);
});
