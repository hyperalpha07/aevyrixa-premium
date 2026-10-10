import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { registerHooks } from "node:module";
import path from "node:path";
import { readFileSync } from "node:fs";
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
const expenseMetrics = await import("../lib/admin-v2/expenses/expense-metrics.ts");
hooks.deregister();

const read = (file: string) => readFileSync(new URL(`../${file}`, import.meta.url), "utf8");

const page = read("app/admin-v2/expenses/page.tsx");
const view = read("components/admin-v2/views/expenses/AdminV2ExpensesView.tsx");
const query = read("lib/admin-v2/expenses/expenses-query.ts");
const migration = read("supabase/migrations/20261009110000_admin_finance_finalization.sql");
const expenseApi = read("app/api/admin/finance/expenses/route.ts");
const voidApi = read("app/api/admin/finance/expenses/[reference]/void/route.ts");

test("Expenses is a real finance expense-ledger workspace guarded by expense view permission", () => {
  assert.equal(findAdminV2Route("expenses")?.implemented, true);
  assert.equal(adminV2AccessRules.expenses.permission, "finance.expenses.view");
  assert.match(page, /requireAdminV2RouteAccess\(session,\s*"expenses"\)/);
  assert.match(page, /AdminV2ExpensesView/);
  assert.doesNotMatch(page, /AdminV2ModulePage/);
});

test("Expense query reads only the expense ledger with exact count and stable filters", () => {
  assert.match(query, /import "server-only"/);
  assert.match(query, /finance_expenses\?/);
  assert.match(query, /const expenseSelect/);
  assert.match(query, /prefer:\s*"count=exact"/);
  assert.match(query, /range:\s*`\$\{from\}-\$\{to\}`/);
  assert.match(query, /reference\.ilike/);
  assert.match(query, /order_ref\.ilike/);
  assert.match(query, /payee\.ilike/);
  assert.match(query, /description\.ilike/);
  assert.doesNotMatch(query, /orders\?select=|receipt_upload|vendor_account|bank_account|faker|mock|Math\.random/i);
});

test("Expense page exposes only scoped create, void and export finance controls", () => {
  assert.match(view, /Create Expense/);
  assert.match(view, /Export CSV/);
  assert.match(view, /Void/);
  assert.match(view, /Operational expense ledger with controlled create and void workflows/);
  assert.doesNotMatch(view, /Read-only operational expense ledger/);
  assert.match(view, /canManageExpenses/);
  assert.match(view, /canExport/);
  assert.doesNotMatch(view, /Upload Receipt|Attach Receipt|Pay Vendor|Bank Account|Delete Expense/i);
});

test("Expense mutation APIs use dedicated manage permission and server RPC actor", () => {
  assert.match(expenseApi, /hasPermission\(session,\s*"finance\.expenses\.manage"\)/);
  assert.match(expenseApi, /adminFinanceActor\(session\)/);
  assert.match(expenseApi, /admin_v2_create_expense/);
  assert.match(voidApi, /hasPermission\(session,\s*"finance\.expenses\.manage"\)/);
  assert.match(voidApi, /Void reason is required/);
  assert.match(voidApi, /admin_v2_void_expense/);
});

test("Expense migration is service-role only, constrained, idempotent, and audited", () => {
  assert.match(migration, /create table if not exists public\.finance_expenses/);
  assert.match(migration, /alter table public\.finance_expenses enable row level security/);
  assert.match(migration, /revoke all on public\.finance_expenses from public, anon, authenticated, service_role/);
  assert.match(migration, /grant select on public\.finance_expenses to service_role/);
  assert.match(migration, /create unique index if not exists finance_expenses_request_key_idx/);
  assert.match(migration, /finance_expenses_category_valid/);
  assert.match(migration, /Linked order not found/);
  assert.match(migration, /finance\.expense\.created/);
  assert.match(migration, /finance\.expense\.voided/);
});

test("Expense idempotency handles concurrent unique-key races before audit insertion", () => {
  assert.match(migration, /exception when unique_violation/);
  assert.match(migration, /select \* into v_existing from public\.finance_expenses where request_key = p_request_key/);
  assert.match(migration, /return v_existing/);
  assert.match(migration, /finance\.expense\.created/);
});

test("Expense parser and metrics are deterministic and cap pagination", () => {
  const parsed = expenseMetrics.parseAdminV2ExpenseQuery(new URLSearchParams("q=test&category=shipping&status=active&from=2026-10-01&to=2026-10-31&page=2&pageSize=500"));
  assert.equal(parsed.category, "shipping");
  assert.equal(parsed.status, "active");
  assert.equal(parsed.pageSize, 50);
  const fallback = expenseMetrics.parseAdminV2ExpenseQuery(new URLSearchParams("category=not-real&status=paid&from=bad&page=-1"));
  assert.equal(fallback.category, "all");
  assert.equal(fallback.status, "all");
  assert.equal(fallback.from, "");
  assert.equal(fallback.page, 1);
  const metrics = expenseMetrics.buildAdminV2ExpenseMetrics([
    { id: "1", reference: "NOR-EXP-1", occurredAt: "", category: "shipping", amount: 100, currencyCode: "BDT", payee: "", paymentMethod: "", description: "", orderReference: "AEV-1", status: "active" },
    { id: "2", reference: "NOR-EXP-2", occurredAt: "", category: "office", amount: 50, currencyCode: "BDT", payee: "", paymentMethod: "", description: "", orderReference: "", status: "void" },
  ]);
  assert.equal(metrics.activeExpenses, 1);
  assert.equal(metrics.activeAmount, 100);
  assert.equal(metrics.voidExpenses, 1);
  assert.equal(metrics.linkedOrders, 1);
  assert.deepEqual(metrics.activeAmountSummary, { kind: "single", amount: 100, currencyCode: "BDT", currencies: ["BDT"] });
  const mixed = expenseMetrics.buildAdminV2ExpenseMetrics([
    { id: "1", reference: "NOR-EXP-1", occurredAt: "", category: "shipping", amount: 100, currencyCode: "BDT", payee: "", paymentMethod: "", description: "", orderReference: "", status: "active" },
    { id: "2", reference: "NOR-EXP-2", occurredAt: "", category: "office", amount: 10, currencyCode: "LKR", payee: "", paymentMethod: "", description: "", orderReference: "", status: "active" },
  ]);
  assert.equal(mixed.activeAmountSummary.kind, "mixed");
});

test("Expense export is permissioned, audited fail-closed, capped and CSV-safe", () => {
  const route = read("app/api/admin/finance/expenses/export/route.ts");
  const csv = read("lib/admin-v2/finance/csv.ts");
  assert.match(route, /finance\.expenses\.view/);
  assert.match(route, /finance\.export/);
  assert.match(route, /finance\.expenses\.exported/);
  assert.match(route, /requireRecorded:\s*true/);
  assert.match(route, /status:\s*500/);
  assert.match(query, /adminV2ExpenseExportLimit = 10000/);
  assert.match(query, /count > adminV2ExpenseExportLimit/);
  assert.match(csv, /neutralizeSpreadsheetFormula/);
  assert.doesNotMatch(route, /customerName|customerContact|phone|email|address/i);
});

test("Finance mutation APIs validate bounded body fields before RPC calls", () => {
  const validation = read("app/lib/admin-finance-validation.ts");
  assert.match(validation, /orderRef:\s*128/);
  assert.match(validation, /externalReference:\s*256/);
  assert.match(validation, /note:\s*2000/);
  assert.match(validation, /reason:\s*1000/);
  assert.match(validation, /description:\s*2000/);
  assert.match(validation, /requestKey.*valid UUID/s);
  assert.match(expenseApi, /validateFinanceExpensePayload/);
  assert.match(voidApi, /validateFinanceVoidPayload/);
});
