import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { adminV2AccessRules } from "../configs/admin-v2/permissions.ts";
import { findAdminV2Route } from "../configs/admin-v2/routes.ts";

const read = (file: string) => readFileSync(new URL(`../${file}`, import.meta.url), "utf8");

const page = read("app/admin-v2/refunds/page.tsx");
const view = read("components/admin-v2/views/refunds/AdminV2RefundsView.tsx");
const query = read("lib/admin-v2/refunds/refunds-query.ts");
const metrics = read("lib/admin-v2/refunds/refund-metrics.ts");
const migration = read("supabase/migrations/20261009110000_admin_finance_finalization.sql");
const refundApi = read("app/api/admin/finance/refunds/route.ts");
const voidApi = read("app/api/admin/finance/refunds/[reference]/void/route.ts");

test("Refunds is a real refund-ledger workspace guarded by the finance refund permission", () => {
  assert.equal(findAdminV2Route("refunds")?.implemented, true);
  assert.equal(adminV2AccessRules.refunds.permission, "finance.refunds.view");
  assert.match(page, /requireAdminV2RouteAccess\(session,\s*"refunds"\)/);
  assert.match(page, /AdminV2RefundsView/);
  assert.doesNotMatch(page, /AdminV2ModulePage/);
});

test("Refund query reads the refund ledger and avoids customer PII and synthetic gateway concepts", () => {
  assert.match(query, /import "server-only"/);
  assert.match(query, /finance_refunds\?/);
  assert.match(query, /const refundSelect/);
  assert.match(query, /prefer:\s*"count=exact"/);
  assert.match(query, /range:\s*`\$\{from\}-\$\{to\}`/);
  assert.match(query, /reference\.ilike/);
  assert.match(query, /order_ref\.ilike/);
  assert.match(query, /external_reference\.ilike/);
  assert.match(query, /reason\.ilike/);
  assert.doesNotMatch(query, /orders\?select=/);
  assert.doesNotMatch(query, /customer_name|customer_phone|customer_email|customer_address|shipping_address/i);
  assert.doesNotMatch(query, /faker|mock|Math\.random|chargeback|store_credit|gateway_refund|processor/i);
});

test("Refund display keeps PII out and gates actual refund actions", () => {
  assert.doesNotMatch(metrics + query + view, /customerName|customerContact|Search order, customer/);
  assert.match(view, /Search refund, order, reference, or reason/);
  assert.match(view, /Recorded refund ledger entries\. Gateway processor refund history is not tracked\./);
  assert.match(view, /View Order/);
  assert.match(view, /Record Refund/);
  assert.match(view, /canRecordRefund/);
  assert.match(view, /canExport/);
  assert.match(view, /canViewOrder/);
  assert.doesNotMatch(view, />\s*(Approve Refund|Reject Refund|Gateway Refund|Store Credit|Delete Refund|Edit)\s*</i);
});

test("Refund mutation APIs are dedicated finance routes with scoped permission and server RPC actor", () => {
  assert.match(refundApi, /hasPermission\(session,\s*"finance\.refunds\.record"\)/);
  assert.match(refundApi, /adminFinanceActor\(session\)/);
  assert.match(refundApi, /admin_v2_record_refund/);
  assert.match(voidApi, /hasPermission\(session,\s*"finance\.refunds\.record"\)/);
  assert.match(voidApi, /Void reason is required/);
  assert.match(voidApi, /admin_v2_void_refund/);
});

test("Refund migration enforces active-payment backing, idempotency, audit logging, and order recomputation", () => {
  assert.match(migration, /create table if not exists public\.finance_refunds/);
  assert.match(migration, /alter table public\.finance_refunds enable row level security/);
  assert.match(migration, /revoke all on public\.finance_refunds from public, anon, authenticated, service_role/);
  assert.match(migration, /grant select on public\.finance_refunds to service_role/);
  assert.match(migration, /create unique index if not exists finance_refunds_request_key_idx/);
  assert.match(migration, /Refund requires active payment/);
  assert.match(migration, /Refund exceeds active payments/);
  assert.match(migration, /Payment transaction mismatch/);
  assert.match(migration, /Currency mismatch/);
  assert.match(migration, /Linked payment currency mismatch/);
  assert.match(migration, /Active payment currency mismatch/);
  assert.match(migration, /finance\.refund\.recorded/);
  assert.match(migration, /finance\.refund\.voided/);
  assert.match(migration, /perform public\.admin_v2_recompute_order_finance\(p_order_ref\)/);
});

test("Refund idempotency handles concurrent unique-key races before audit insertion", () => {
  assert.match(migration, /exception when unique_violation/);
  assert.match(migration, /select \* into v_existing from public\.finance_refunds where request_key = p_request_key/);
  assert.match(migration, /return v_existing/);
  assert.match(migration, /finance\.refund\.recorded/);
});

test("Partial and full refund status semantics are recomputed from active ledger sums", () => {
  assert.match(migration, /when v_refunded >= v_paid and v_paid > 0 then 'refunded'/);
  assert.match(migration, /when v_paid \+ 0\.01 >= v_payable then 'verified'/);
  assert.match(migration, /refunded_amount = v_refunded/);
  assert.match(migration, /due_amount = greatest\(v_payable - v_paid, 0\)/);
});

test("Refund metrics are clearly ledger-based and do not infer refunds from cancelled orders", () => {
  assert.match(metrics, /refundedAmount/);
  assert.match(metrics, /refundedAmountSummary/);
  assert.match(view, /Mixed currencies/);
  assert.match(metrics, /request_only/);
  assert.doesNotMatch(metrics + query, /Cancelled.*refund|orderStatus.*Cancelled.*refund/s);
});

test("Refund export is permissioned, audited fail-closed, capped and CSV-safe", () => {
  const route = read("app/api/admin/finance/refunds/export/route.ts");
  const csv = read("lib/admin-v2/finance/csv.ts");
  assert.match(route, /finance\.refunds\.view/);
  assert.match(route, /finance\.export/);
  assert.match(route, /finance\.refunds\.exported/);
  assert.match(route, /requireRecorded:\s*true/);
  assert.match(route, /status:\s*500/);
  assert.match(query, /adminV2RefundExportLimit = 10000/);
  assert.match(query, /count > adminV2RefundExportLimit/);
  assert.match(csv, /neutralizeSpreadsheetFormula/);
  assert.doesNotMatch(route, /customerName|customerContact|phone|email|address/i);
});
