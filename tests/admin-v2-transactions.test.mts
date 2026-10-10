import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { adminV2AccessRules } from "../configs/admin-v2/permissions.ts";
import { findAdminV2Route } from "../configs/admin-v2/routes.ts";

const read = (file: string) => readFileSync(new URL(`../${file}`, import.meta.url), "utf8");

const page = read("app/admin-v2/transactions/page.tsx");
const view = read("components/admin-v2/views/transactions/AdminV2TransactionsView.tsx");
const query = read("lib/admin-v2/transactions/transactions-query.ts");
const metrics = read("lib/admin-v2/transactions/transaction-metrics.ts");
const migration = read("supabase/migrations/20261009110000_admin_finance_finalization.sql");
const paymentApi = read("app/api/admin/finance/payments/route.ts");
const voidApi = read("app/api/admin/finance/payments/[reference]/void/route.ts");

test("Transactions is a real finance-ledger workspace guarded by the finance transaction permission", () => {
  assert.equal(findAdminV2Route("transactions")?.implemented, true);
  assert.equal(adminV2AccessRules.transactions.permission, "finance.transactions.view");
  assert.match(page, /requireAdminV2RouteAccess\(session,\s*"transactions"\)/);
  assert.match(page, /AdminV2TransactionsView/);
  assert.doesNotMatch(page, /AdminV2ModulePage/);
});

test("Transactions query reads the payment ledger, not order/customer PII or fake gateway data", () => {
  assert.match(query, /import "server-only"/);
  assert.match(query, /finance_payment_transactions\?/);
  assert.match(query, /const paymentSelect/);
  assert.match(query, /prefer:\s*"count=exact"/);
  assert.match(query, /range:\s*`\$\{from\}-\$\{to\}`/);
  assert.match(query, /reference\.ilike/);
  assert.match(query, /order_ref\.ilike/);
  assert.match(query, /external_reference\.ilike/);
  assert.doesNotMatch(query, /orders\?select=/);
  assert.doesNotMatch(query, /customer_name|customer_phone|customer_email|customer_address|shipping_address/i);
  assert.doesNotMatch(query, /faker|mock|Math\.random|stripe|paypal|settlement|payout|gateway_event/i);
});

test("Transactions display keeps customer PII out and gates finance/order actions", () => {
  assert.doesNotMatch(metrics + query + view, /customerName|customerContact|Verification|COD Due|Pending Payments|Failed \/ Refunded/);
  assert.match(view, /Search transaction, order, or external reference/);
  assert.match(view, /Ledger status/);
  assert.match(view, /Recorded Payments/);
  assert.match(view, /Recorded Amount/);
  assert.match(view, /Voided Payments/);
  assert.match(view, /View Order/);
  assert.match(view, /canRecordPayment/);
  assert.match(view, /canExport/);
  assert.match(view, /canViewOrder/);
  assert.match(view, /Record Payment/);
  assert.match(view, /Export CSV/);
  assert.match(view, /\/admin-v2\/orders\/\$\{encodeURIComponent\(orderReference\)\}/);
  assert.doesNotMatch(view, />\s*(Mark Paid|Refund Now|Capture|Settle|Retry|Delete Transaction|View Gateway|Edit)\s*</i);
});

test("Payment mutation APIs are dedicated finance routes with scoped permission and server RPC actor", () => {
  assert.match(paymentApi, /hasPermission\(session,\s*"finance\.payments\.record"\)/);
  assert.match(paymentApi, /adminFinanceActor\(session\)/);
  assert.match(paymentApi, /admin_v2_record_payment/);
  assert.match(voidApi, /hasPermission\(session,\s*"finance\.payments\.record"\)/);
  assert.match(voidApi, /Void reason is required/);
  assert.match(voidApi, /admin_v2_void_payment/);
});

test("Payment ledger migration is service-role only, idempotent, audited, and order-snapshot recomputed", () => {
  assert.match(migration, /create table if not exists public\.finance_payment_transactions/);
  assert.match(migration, /alter table public\.finance_payment_transactions enable row level security/);
  assert.match(migration, /revoke all on public\.finance_payment_transactions from public, anon, authenticated, service_role/);
  assert.match(migration, /grant select on public\.finance_payment_transactions to service_role/);
  assert.match(migration, /create unique index if not exists finance_payment_transactions_request_key_idx/);
  assert.match(migration, /admin_v2_record_payment/);
  assert.match(migration, /Conflicting payment idempotency key/);
  assert.match(migration, /Payment exceeds payable amount/);
  assert.match(migration, /v_order_currency := coalesce\(v_order\.currency_code, 'BDT'\)/);
  assert.match(migration, /if p_currency_code <> v_order_currency then raise exception 'Currency mismatch'; end if/);
  assert.doesNotMatch(migration, /coalesce\(v_order\.currency_code, p_currency_code\)/);
  assert.match(migration, /perform public\.admin_v2_recompute_order_finance\(p_order_ref\)/);
  assert.match(migration, /finance\.payment\.recorded/);
  assert.match(migration, /finance\.payment\.voided/);
});

test("Payment idempotency handles concurrent unique-key races before audit insertion", () => {
  assert.match(migration, /exception when unique_violation/);
  assert.match(migration, /select \* into v_existing from public\.finance_payment_transactions where request_key = p_request_key/);
  assert.match(migration, /return v_existing/);
  assert.match(migration, /finance\.payment\.recorded/);
});

test("Payment recompute clears stale verified timestamp and voided external reference", () => {
  assert.match(migration, /payment_verified_at = case when v_paid \+ 0\.01 >= v_payable and v_paid > 0 then coalesce\(payment_verified_at, now\(\)\) else null end/);
  assert.match(migration, /payment_reference = v_latest_external/);
  assert.match(migration, /order by coalesce\(occurred_at, recorded_at, created_at\) desc, id desc/);
  assert.doesNotMatch(migration, /payment_reference = coalesce\(v_latest_external, payment_reference\)/);
});

test("Finance references are generated against existing ledger tables instead of unconstrained random-only output", () => {
  assert.match(migration, /admin_v2_finance_reference/);
  assert.match(migration, /v_attempt integer := 0/);
  assert.match(migration, /finance_payment_transactions where reference = v_reference/);
  assert.match(migration, /finance_refunds where reference = v_reference/);
  assert.match(migration, /finance_expenses where reference = v_reference/);
  assert.match(migration, /Unable to generate unique finance reference/);
});

test("Transaction metrics use active ledger amounts and do not infer gateway settlement state", () => {
  assert.match(metrics, /recordedPayments/);
  assert.match(metrics, /recordedAmountSummary/);
  assert.match(metrics, /voidedPayments/);
  assert.match(view, /Mixed currencies/);
  assert.match(metrics, /adminV2TransactionLedgerStatuses = \["recorded", "void"\]/);
  assert.doesNotMatch(metrics + query + view, /available_balance|gateway_fee|settlement_id|payout_id|processor_fee|card_last4|codDue|verification/i);
});

test("Transaction export is permissioned, audited fail-closed, capped and CSV-safe", () => {
  const route = read("app/api/admin/finance/transactions/export/route.ts");
  const csv = read("lib/admin-v2/finance/csv.ts");
  assert.match(route, /finance\.transactions\.view/);
  assert.match(route, /finance\.export/);
  assert.match(route, /finance\.transactions\.exported/);
  assert.match(route, /requireRecorded:\s*true/);
  assert.match(route, /status:\s*500/);
  assert.match(query, /adminV2TransactionExportLimit = 10000/);
  assert.match(query, /count > adminV2TransactionExportLimit/);
  assert.match(csv, /neutralizeSpreadsheetFormula/);
  assert.match(csv, /\["=", "\+", "-", "@"\]/);
  assert.doesNotMatch(route, /customerName|customerContact|phone|email|address/i);
});
