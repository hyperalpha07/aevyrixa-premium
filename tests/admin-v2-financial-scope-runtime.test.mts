import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { registerHooks } from "node:module";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import test from "node:test";

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
const [transactions, refunds, expenses, invoices] = await Promise.all([
  import("../lib/admin-v2/transactions/transactions-query.ts"),
  import("../lib/admin-v2/refunds/refunds-query.ts"),
  import("../lib/admin-v2/expenses/expenses-query.ts"),
  import("../lib/admin-v2/invoices/invoices-query.ts"),
]);
hooks.deregister();

const beforeUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const beforeKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const originalFetch = globalThis.fetch;
process.env.NEXT_PUBLIC_SUPABASE_URL = "https://test.invalid";
process.env.SUPABASE_SERVICE_ROLE_KEY = "local-test-key-only";

const rows = {
  finance_payment_transactions: [
    { id: "p-live", reference: "PAY-LIVE", order_ref: "LIVE-1", amount: 30, currency_code: "BDT", status: "recorded", payment_method: "cod", recorded_at: "2026-10-01T09:00:00Z" },
    { id: "p-test", reference: "PAY-TEST", order_ref: "TEST-1", amount: 80, currency_code: "BDT", status: "recorded", payment_method: "cod", recorded_at: "2026-10-01T09:00:00Z" },
  ],
  finance_refunds: [
    { id: "r-live", reference: "REF-LIVE", order_ref: "LIVE-1", amount: 7, currency_code: "BDT", status: "recorded", refund_method: "cod", occurred_at: "2026-10-01T09:00:00Z" },
    { id: "r-test", reference: "REF-TEST", order_ref: "TEST-1", amount: 19, currency_code: "BDT", status: "recorded", refund_method: "cod", occurred_at: "2026-10-01T09:00:00Z" },
  ],
  finance_expenses: [
    { id: "e-live", reference: "EXP-LIVE", order_ref: null, amount: 5, currency_code: "BDT", category: "other", status: "active", record_scope: "live", occurred_at: "2026-10-01T09:00:00Z" },
    { id: "e-test", reference: "EXP-TEST", order_ref: "TEST-1", amount: 17, currency_code: "BDT", category: "other", status: "active", record_scope: "test", occurred_at: "2026-10-01T09:00:00Z" },
  ],
  invoices: [
    { id: "i-live", invoice_number: "INV-LIVE", order_ref: "LIVE-1", status: "issued", total_amount: 100, currency_code: "BDT", snapshot: {}, issued_at: "2026-10-01T09:00:00Z" },
    { id: "i-test", invoice_number: "INV-TEST", order_ref: "TEST-1", status: "issued", total_amount: 250, currency_code: "BDT", snapshot: {}, issued_at: "2026-10-01T09:00:00Z" },
  ],
} as const;
const requests: { table: string; scope: string | null; select: string | null }[] = [];
let forceFailure = false;
globalThis.fetch = async (input, init) => {
  const url = new URL(String(input));
  const table = url.pathname.split("/").at(-1) ?? "";
  const embedded = url.searchParams.get("orders.record_scope");
  const direct = url.searchParams.get("record_scope");
  const scope = embedded?.slice(3) ?? direct?.slice(3) ?? null;
  requests.push({ table, scope, select: url.searchParams.get("select") });
  if (forceFailure) return Response.json({ message: "simulated outage" }, { status: 503 });
  if (table === "orders") {
    return Response.json([{ order_ref: "LIVE-1", status: "Pending" }, { order_ref: "TEST-1", status: "Pending" }]);
  }
  assert.ok(table in rows, `Unexpected table requested: ${table}`);
  assert.ok(scope === "live" || scope === "test", `Every scoped ledger request must filter first: ${url}`);
  if (table !== "finance_expenses") {
    assert.match(url.searchParams.get("select") ?? "", /orders!inner\(record_scope\)/);
    assert.equal(url.searchParams.get("orders.record_scope"), `eq.${scope}`);
  } else {
    assert.equal(url.searchParams.get("record_scope"), `eq.${scope}`);
  }
  const selected = (rows[table as keyof typeof rows] as readonly { order_ref: string | null; record_scope?: string }[])
    .filter(row => table === "finance_expenses" ? row.record_scope === scope : row.order_ref === (scope === "live" ? "LIVE-1" : "TEST-1"));
  const range = (init?.headers as Record<string, string> | undefined)?.range ?? "0-999";
  const from = Number(range.split("-")[0]);
  const to = Number(range.split("-")[1]);
  return Response.json(selected.slice(from, to + 1), {
    headers: { "content-range": selected.length ? `${from}-${Math.min(to,selected.length-1)}/${selected.length}` : "*/0" },
  });
};

test("Finance read and CSV sources use identical database-level live/test scope, never mixing monetary values", async () => {
  const specs = [
    ["payments", transactions.getAdminV2Transactions, transactions.getAdminV2TransactionExportRows, "PAY", "finance_payment_transactions"],
    ["refunds", refunds.getAdminV2Refunds, refunds.getAdminV2RefundExportRows, "REF", "finance_refunds"],
    ["expenses", expenses.getAdminV2Expenses, expenses.getAdminV2ExpenseExportRows, "EXP", "finance_expenses"],
  ] as const;
  for (const [name, read, exportRows, prefix, table] of specs) {
    for (const scope of ["live", "test"] as const) {
      const search = new URLSearchParams({ scope });
      const start = requests.length;
      const data = await read(search);
      const csv = await exportRows(search);
      assert.equal(data.storageAvailable, true, `${name} ${scope} storage`);
      assert.equal(data.totalCount, 1);
      assert.equal(data.rows.length, 1);
      assert.equal(data.dataScope, scope);
      assert.equal(data.rows[0].orderReference, table === "finance_expenses" && scope === "live" ? "" : scope === "live" ? "LIVE-1" : "TEST-1");
      assert.equal(data.rows[0].reference ?? data.rows[0].transactionReference, `${prefix}-${scope.toUpperCase()}`);
      assert.equal(csv.ok, true);
      if (csv.ok) {
        assert.equal(csv.rows.length, 1);
        assert.equal(csv.rows[0].reference ?? csv.rows[0].transactionReference, `${prefix}-${scope.toUpperCase()}`);
      }
      const scoped = requests.slice(start).filter(item => item.table === table);
      assert.ok(scoped.length >= 3, `${name} queries must cover page, metrics and export`);
      assert.ok(scoped.every(item => item.scope === scope), `${name} must not lose the selected scope`);
    }
  }
  for (const scope of ["live", "test"] as const) {
    const data = await invoices.getAdminV2Invoices(new URLSearchParams({ scope }));
    assert.equal(data.storageAvailable, true);
    assert.equal(data.dataScope, scope);
    assert.equal(data.totalCount, 1);
    assert.equal(data.rows[0].invoiceNumber, `INV-${scope.toUpperCase()}`);
    assert.equal(data.metrics.totalInvoicedValue, scope === "test" ? 250 : 100);
  }
  const defaultPage = await transactions.getAdminV2Transactions();
  assert.equal(defaultPage.dataScope, "live");
  assert.equal(defaultPage.rows[0].transactionReference, "PAY-LIVE");
});

test("Source failure is unavailable, never a successful empty live ledger", async () => {
  forceFailure = true;
  try {
    for (const [name, get] of [
      ["payments", transactions.getAdminV2Transactions],
      ["refunds", refunds.getAdminV2Refunds],
      ["expenses", expenses.getAdminV2Expenses],
      ["invoices", invoices.getAdminV2Invoices],
    ] as const) {
      const result = await get(new URLSearchParams({ scope: "test" }));
      assert.equal(result.storageAvailable, false, name);
      assert.equal(result.dataScope, "test");
    }
  } finally {
    forceFailure = false;
  }
});

process.on("exit", () => {
  globalThis.fetch = originalFetch;
  if (beforeUrl === undefined) delete process.env.NEXT_PUBLIC_SUPABASE_URL;
  else process.env.NEXT_PUBLIC_SUPABASE_URL = beforeUrl;
  if (beforeKey === undefined) delete process.env.SUPABASE_SERVICE_ROLE_KEY;
  else process.env.SUPABASE_SERVICE_ROLE_KEY = beforeKey;
});
