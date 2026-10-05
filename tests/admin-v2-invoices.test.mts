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
const invoicesMetrics = await import("../lib/admin-v2/invoices/invoice-metrics.ts");
const invoicesQuery = await import("../lib/admin-v2/invoices/invoices-query.ts");
const navigation = await import("../lib/admin-v2/navigation.ts");
hooks.deregister();

const invoicesPage = readFileSync(new URL("../app/admin-v2/invoices/page.tsx", import.meta.url), "utf8");
const invoicesView = readFileSync(new URL("../components/admin-v2/views/invoices/AdminV2InvoicesView.tsx", import.meta.url), "utf8");
const invoicesQuerySource = readFileSync(new URL("../lib/admin-v2/invoices/invoices-query.ts", import.meta.url), "utf8");
const invoicesMetricsSource = readFileSync(new URL("../lib/admin-v2/invoices/invoice-metrics.ts", import.meta.url), "utf8");
const invoicesDetailPage = readFileSync(new URL("../app/admin-v2/invoices/[invoiceNumber]/page.tsx", import.meta.url), "utf8");
const invoicesDetailView = readFileSync(new URL("../components/admin-v2/views/invoices/AdminV2InvoiceDetailView.tsx", import.meta.url), "utf8");
const invoicesLoading = readFileSync(new URL("../app/admin-v2/invoices/loading.tsx", import.meta.url), "utf8");
const orderInvoiceRoute = readFileSync(new URL("../app/api/orders/[orderRef]/invoices/route.ts", import.meta.url), "utf8");
const orderInvoicePrintPage = readFileSync(new URL("../app/admin-v2/orders/[orderRef]/invoice/page.tsx", import.meta.url), "utf8");
const orderInvoicesSource = readFileSync(new URL("../lib/admin-v2/orders/order-invoices.ts", import.meta.url), "utf8");
const orderStoreSource = readFileSync(new URL("../app/lib/order-store.ts", import.meta.url), "utf8");
const invoiceMigrationName = "20261005090000_invoice_schema_reproducibility.sql";
const invoiceMigration = readFileSync(new URL(`../supabase/migrations/${invoiceMigrationName}`, import.meta.url), "utf8");

test("Invoices route is real, protected by orders.viewInvoice, and related unfinished modules stay coming soon", () => {
  assert.equal(findAdminV2Route("invoices")?.implemented, true);
  assert.equal(findAdminV2Route("analytics")?.implemented, true);
  assert.equal(findAdminV2Route("reports")?.implemented, true);
  assert.equal(findAdminV2Route("transactions")?.implemented, true);
  assert.equal(findAdminV2Route("refunds")?.implemented, true);
  assert.equal(findAdminV2Route("billing")?.implemented, true);
  for (const module of ["expenses", "tax"] as const) {
    assert.equal(findAdminV2Route(module)?.implemented, false);
  }
  assert.equal(adminV2AccessRules.invoices.permission, "orders.viewInvoice");
  assert.equal(adminV2AccessRules.invoices.section, undefined);
  assert.match(invoicesPage, /requireAdminV2RouteAccess\(session,\s*"invoices"\)/);
  assert.doesNotMatch(invoicesPage, /AdminV2ModulePage/);
});

test("Invoice issuance permission remains separate from invoice viewing", () => {
  assert.match(orderInvoiceRoute, /hasPermission\(session,\s*"orders\.viewInvoice"\)/);
  assert.match(orderInvoiceRoute, /hasPermission\(session,\s*"orders\.issueInvoice"\)/);
  assert.match(orderInvoiceRoute, /issueOrderInvoice/);
  assert.match(orderInvoiceRoute, /listOrderInvoices/);
});

test("Invoice query uses the real invoices backend with exact pagination, status and issued-date filters", () => {
  assert.equal(invoicesQuerySource.includes('from "@/lib/admin-v2/invoices/invoice-metrics"'), true);
  assert.match(invoicesQuerySource, /invoices\?/);
  assert.match(invoicesQuerySource, /prefer:\s*"count=exact"/);
  assert.match(invoicesQuerySource, /range:\s*`\$\{from\}-\$\{to\}`/);
  assert.match(invoicesQuerySource, /invoice_number\.ilike/);
  assert.match(invoicesQuerySource, /order_ref\.ilike/);
  assert.match(invoicesQuerySource, /status",\s*"eq"/);
  assert.match(invoicesQuerySource, /issued_at",\s*"gte"/);
  assert.match(invoicesQuerySource, /issued_at",\s*"lte"/);
  assert.match(invoicesQuerySource, /order=issued_at\.desc\.nullslast/);
  assert.doesNotMatch(invoicesQuerySource, /queryOrders|listOrders|orders\?/);
});

test("Invoice parser supports search, status, date filtering and pagination without unsafe values", () => {
  const query = invoicesMetrics.parseAdminV2InvoiceQuery(new URLSearchParams("q=INV-1&status=void&from=2026-10-01&to=2026-10-31&page=3&pageSize=500"));
  assert.deepEqual(query, {
    q: "INV-1",
    status: "void",
    from: "2026-10-01",
    to: "2026-10-31",
    page: 3,
    pageSize: 50,
  });
  const fallback = invoicesMetrics.parseAdminV2InvoiceQuery(new URLSearchParams("status=paid&from=bad&page=-1"));
  assert.equal(fallback.status, "all");
  assert.equal(fallback.from, "");
  assert.equal(fallback.page, 1);
});

test("Persisted invoice totals and snapshot customer data are used without order recalculation or fake ID names", () => {
  const row = invoicesQuery.mapAdminV2InvoiceRow({
    id: "invoice-id",
    invoice_number: "AEV-INV-1",
    order_ref: "AEV-ORDER-1",
    status: "issued",
    issued_at: "2026-10-02T10:00:00.000Z",
    subtotal_amount: 100,
    discount_amount: 10,
    delivery_amount: 20,
    total_amount: 110,
    currency_code: "BDT",
    snapshot: { customer: { name: "Real Snapshot Customer" }, totals: { total: 9999 } },
  });
  assert.equal(row.customerName, "Real Snapshot Customer");
  assert.equal(row.totalAmount, 110);
  assert.equal(row.subtotalAmount, 100);
  assert.equal(row.discountAmount, 10);
  assert.equal(row.deliveryAmount, 20);
  const missingName = invoicesQuery.mapAdminV2InvoiceRow({
    invoice_number: "AEV-INV-2",
    order_ref: "AEV-ORDER-2",
    snapshot: { customer: { name: "" } },
  });
  assert.equal(missingName.customerName, "Not provided");
  assert.doesNotMatch(invoicesQuerySource, /getAdminV2OrderAmounts|createOrderInvoiceSnapshot|calculateAdminV2PayableTotal|current order total/i);
  assert.match(invoicesQuerySource, /getAdminV2InvoiceByNumber/);
  assert.match(invoicesQuerySource, /invoice_number=eq\.\$\{encodeURIComponent\(cleanInvoiceNumber\)\}/);
});

test("Invoice metrics use complete server invoice rows and real issued/void statuses", () => {
  const metrics = invoicesMetrics.buildAdminV2InvoiceMetrics([
    { id: "1", invoiceNumber: "INV-1", orderReference: "A", customerName: "A", status: "issued", issuedAt: "2026-10-02T01:00:00.000Z", issuedBy: "Admin", subtotalAmount: 90, discountAmount: 0, deliveryAmount: 10, totalAmount: 100, currencyCode: "BDT", createdAt: "2026-10-02T01:00:00.000Z", snapshot: {} },
    { id: "2", invoiceNumber: "INV-2", orderReference: "B", customerName: "B", status: "issued", issuedAt: "2026-09-02T01:00:00.000Z", issuedBy: "Admin", subtotalAmount: 45, discountAmount: 0, deliveryAmount: 5, totalAmount: 50, currencyCode: "BDT", createdAt: "2026-09-02T01:00:00.000Z", snapshot: {} },
    { id: "3", invoiceNumber: "INV-3", orderReference: "C", customerName: "C", status: "void", issuedAt: "2026-10-03T01:00:00.000Z", issuedBy: "Admin", subtotalAmount: 25, discountAmount: 0, deliveryAmount: 0, totalAmount: 25, currencyCode: "BDT", createdAt: "2026-10-03T01:00:00.000Z", snapshot: {} },
  ], new Date("2026-10-03T12:00:00.000Z"));
  assert.deepEqual(metrics, {
    issuedInvoices: 2,
    totalInvoicedValue: 150,
    issuedThisMonth: 1,
    voidInvoices: 1,
  });
  assert.match(invoicesView, /Issued Invoices/);
  assert.match(invoicesView, /Total Invoiced Value/);
  assert.match(invoicesView, /Issued This Month/);
  assert.match(invoicesView, /Void Invoices/);
});

test("Invoices workspace exposes only supported read-only actions and existing invoice rendering", () => {
  assert.match(invoicesView, /Open Invoice/);
  assert.match(invoicesView, /Print Invoice/);
  assert.match(invoicesView, /View Order/);
  assert.match(invoicesView, /\/admin-v2\/invoices\/\$\{encodeURIComponent\(invoiceNumber\)\}/);
  assert.match(invoicesView, /\?print=1/);
  assert.match(invoicesView, /<V2Button[^>]*href=\{canOpenInvoice \? invoiceHref\(invoice\.invoiceNumber\)/);
  assert.match(invoicesView, /orderHref\(invoice\.orderReference\)/);
  assert.doesNotMatch(invoicesView, /\/admin-v2\/orders\/\$\{encodeURIComponent\(orderReference\)\}\/invoice/);
  assert.match(orderInvoicePrintPage, /AdminV2InvoicePrintView/);
  assert.match(orderInvoicePrintPage, /listOrderInvoices/);
  assert.doesNotMatch(invoicesView, /Reissue|Delete invoice|Edit invoice|Mark paid|Overdue|Download PDF|XLSX|Payment status/i);
  assert.doesNotMatch(invoicesQuerySource + invoicesMetricsSource, /paidAmount|overdue|payment_status|pdf|xlsx|faker|mock|Math\.random/i);
});

test("Dedicated invoice detail route keeps Invoices active and uses persisted invoice data", () => {
  assert.match(invoicesDetailPage, /PageProps<"\/admin-v2\/invoices\/\[invoiceNumber\]">/);
  assert.match(invoicesDetailPage, /requireAdminV2RouteAccess\(session,\s*"invoices"\)/);
  assert.match(invoicesDetailPage, /getAdminV2InvoiceByNumber\(invoiceNumber\)/);
  assert.match(invoicesDetailView, /Back to invoices/);
  assert.match(invoicesDetailView, /window\.print\(\)/);
  assert.match(invoicesDetailView, /View Order/);
  assert.match(invoicesDetailView, /invoice\.snapshot/);
  assert.doesNotMatch(invoicesDetailPage + invoicesDetailView, /listOrderInvoices|getAdminV2Order|getAdminV2OrderAmounts|calculateAdminV2PayableTotal|createOrderInvoiceSnapshot/);
  assert.equal(navigation.isAdminV2NavigationItemActive("/admin-v2/invoices/AEV-INV-1", { href: "/admin-v2/invoices", module: "invoices" }), true);
  assert.equal(navigation.isAdminV2NavigationItemActive("/admin-v2/invoices/AEV-INV-1", { href: "/admin-v2/orders", module: "orders" }), false);
});

test("Dedicated invoice print mode includes full persisted invoice sections and Noromi Care branding", () => {
  assert.match(invoicesDetailView, /autoPrint/);
  assert.match(invoicesDetailView, /@media print/);
  assert.doesNotMatch(invoicesDetailView, /body \*/);
  assert.match(invoicesDetailView, /admin-v2-invoice-detail-print/);
  assert.match(invoicesDetailView, /noromiAssets\.logoHorizontal/);
  assert.match(invoicesDetailView, /brandName/);
  assert.match(invoicesDetailView, /alt=\{`\$\{brandName\} logo`\}/);
  for (const requiredText of ["Customer", "Payment", "Delivery", "Item", "Qty", "Unit", "Line total", "Subtotal", "Discounts", "Total"]) {
    assert.match(invoicesDetailView, new RegExp(requiredText));
  }
  assert.match(invoicesDetailView, /text\(customer\.name\) \|\| invoice\.customerName/);
  assert.match(invoicesDetailView, /text\(payment\.method\)/);
  assert.match(invoicesDetailView, /text\(delivery\.method\) \|\| text\(delivery\.city\)/);
  assert.match(invoicesDetailView, /items\.length > 0/);
  assert.match(invoicesDetailView, /invoice\.subtotalAmount/);
  assert.match(invoicesDetailView, /invoice\.discountAmount/);
  assert.match(invoicesDetailView, /invoice\.deliveryAmount/);
  assert.match(invoicesDetailView, /invoice\.totalAmount/);
});

test("Persisted invoice identities remain unchanged and future prefix logic is not silently altered", () => {
  assert.match(invoicesDetailView, /invoice\.invoiceNumber/);
  assert.doesNotMatch(invoicesDetailView, /replace\(.*AEV-INV|NOR-INV/);
  assert.match(orderInvoicesSource, /AEV-INV-\$\{date\}-\$\{cleanRef\(orderRef\)\}/);
  assert.match(orderStoreSource, /rpc\/admin_v2_next_invoice_number/);
  assert.match(orderStoreSource, /return `AEV-\$\{stamp\}-\$\{suffix\}`/);
  assert.equal(orderInvoicesSource.includes("NOR-INV"), false);
});

test("Invoices navigation uses route progress friendly links and a thin loading line", () => {
  assert.match(invoicesView, /V2Button/);
  assert.doesNotMatch(invoicesView + invoicesDetailView, /window\.location|location\.assign/);
  assert.match(invoicesLoading, /LinearProgress/);
  assert.doesNotMatch(invoicesLoading, /V2PageContentSkeleton/);
});

test("Invoice schema reproducibility migration covers the live invoice table and numbering RPC", () => {
  const migrationNames = readdirSync(new URL("../supabase/migrations", import.meta.url)).join("\n");
  assert.match(migrationNames, new RegExp(invoiceMigrationName));
  assert.match(invoiceMigration, /c\.conrelid = 'public\.orders'::regclass/);
  assert.match(invoiceMigration, /c\.contype in \('u', 'p'\)/);
  assert.match(invoiceMigration, /t\.typname = 'text'/);
  assert.match(invoiceMigration, /a\.attnotnull/);
  assert.match(invoiceMigration, /c\.conkey = array\[a\.attnum\]::smallint\[\]/);
  assert.match(invoiceMigration, /create table if not exists public\.invoices/);
  for (const column of [
    "invoice_number",
    "order_ref",
    "status",
    "issued_at",
    "issued_by_admin_id",
    "issued_by",
    "actor_source",
    "subtotal_amount",
    "discount_amount",
    "delivery_amount",
    "total_amount",
    "currency_code",
    "snapshot",
    "created_at",
  ]) {
    assert.match(invoiceMigration, new RegExp(`\\b${column}\\b`));
  }
  assert.match(invoiceMigration, /references public\.orders\(order_ref\) on update cascade on delete restrict/);
  assert.match(invoiceMigration, /status in \('issued', 'void'\)/);
  assert.match(invoiceMigration, /snapshot \? 'orderReference'/);
  assert.match(invoiceMigration, /snapshot \? 'items'/);
  assert.match(invoiceMigration, /snapshot \? 'totals'/);
  assert.match(invoiceMigration, /snapshot \? 'customer'/);
  assert.match(invoiceMigration, /snapshot \? 'payment'/);
  assert.match(invoiceMigration, /create unique index if not exists invoices_one_issued_per_order_idx/);
  assert.match(invoiceMigration, /where status = 'issued'/);
  assert.match(invoiceMigration, /create sequence if not exists public\.admin_v2_invoice_number_seq/);
  assert.match(invoiceMigration, /as bigint/);
  assert.match(invoiceMigration, /increment by 1/);
  assert.match(invoiceMigration, /minvalue 1/);
  assert.match(invoiceMigration, /no cycle/);
  assert.match(invoiceMigration, /create or replace function public\.admin_v2_next_invoice_number/);
  assert.match(invoiceMigration, /security definer/);
  assert.match(invoiceMigration, /set search_path = pg_catalog, public/);
  assert.match(invoiceMigration, /at time zone 'UTC'/);
  assert.match(invoiceMigration, /lpad\(nextval\('public\.admin_v2_invoice_number_seq'\)::text, 6, '0'\)/);
  assert.match(invoiceMigration, /nextval\('public\.admin_v2_invoice_number_seq'\)/);
  assert.match(invoiceMigration, /grant execute on function public\.admin_v2_next_invoice_number\(text, timestamptz\) to service_role/);
});

test("Invoice migration preserves current references, security posture, and avoids future feature creep", () => {
  assert.match(invoiceMigration, /AEV-INV-/);
  assert.doesNotMatch(invoiceMigration, /NOR-INV|NOR-ORD/);
  assert.match(invoiceMigration, /alter table public\.invoices enable row level security/);
  assert.match(invoiceMigration, /revoke all on table public\.invoices from public, anon, authenticated/);
  assert.match(invoiceMigration, /revoke all on sequence public\.admin_v2_invoice_number_seq from public, anon, authenticated/);
  assert.match(invoiceMigration, /revoke execute on function public\.admin_v2_next_invoice_number\(text, timestamptz\) from public, anon, authenticated/);
  assert.match(invoiceMigration, /revoke all on table public\.invoices from service_role/);
  assert.match(invoiceMigration, /revoke all on sequence public\.admin_v2_invoice_number_seq from service_role/);
  assert.match(invoiceMigration, /revoke execute on function public\.admin_v2_next_invoice_number\(text, timestamptz\) from service_role/);
  assert.match(invoiceMigration, /grant select, insert, update, delete on table public\.invoices to service_role/);
  assert.match(invoiceMigration, /grant usage, select on sequence public\.admin_v2_invoice_number_seq to service_role/);
  assert.match(invoiceMigration, /create policy "invoices_service_role_all"/);
  assert.match(invoiceMigration, /to service_role/);
  assert.doesNotMatch(invoiceMigration, /grant\s+[^;]*(truncate|trigger|references)[^;]*on table public\.invoices to service_role/i);
  assert.doesNotMatch(invoiceMigration, /grant\s+[^;]*update[^;]*on sequence public\.admin_v2_invoice_number_seq to service_role/i);
  assert.doesNotMatch(invoiceMigration, /pdf|xlsx|tax_|vat|mark_paid|overdue|settlement|payout|billing_accounts|statements/i);
  assert.doesNotMatch(invoiceMigration, /update public\.invoices\s+set|insert into public\.invoices\s+select|delete from public\.invoices|setval\(|alter sequence/i);
});

test("Invoice migration fail-fast checks existing invoice table compatibility", () => {
  assert.match(invoiceMigration, /if to_regclass\('public\.invoices'\) is not null then/);
  for (const [column, type, notNull] of [
    ["id", "uuid", true],
    ["invoice_number", "text", true],
    ["order_ref", "text", true],
    ["status", "text", true],
    ["issued_at", "timestamptz", true],
    ["issued_by_admin_id", "text", false],
    ["issued_by", "text", false],
    ["actor_source", "text", true],
    ["subtotal_amount", "numeric", true],
    ["discount_amount", "numeric", true],
    ["delivery_amount", "numeric", true],
    ["total_amount", "numeric", true],
    ["currency_code", "text", true],
    ["snapshot", "jsonb", true],
    ["created_at", "timestamptz", true],
  ] as const) {
    assert.match(invoiceMigration, new RegExp(`\\('${column}', '${type}', ${notNull}\\)`));
  }
  assert.match(invoiceMigration, /existing public\.invoices columns are incompatible/);
  assert.match(invoiceMigration, /existing public\.invoices defaults are incompatible/);
  assert.match(invoiceMigration, /\('id', 'gen_random_uuid\(\)'\)/);
  assert.match(invoiceMigration, /\('status', '''issued''::text'\)/);
  assert.match(invoiceMigration, /\('issued_at', 'now\(\)'\)/);
  assert.match(invoiceMigration, /\('actor_source', '''admin''::text'\)/);
  assert.match(invoiceMigration, /\('created_at', 'now\(\)'\)/);
  assert.match(invoiceMigration, /existing public\.invoices must have a single-column primary key on id/);
  assert.match(invoiceMigration, /existing public\.invoices must have a single-column unique constraint on invoice_number/);
  assert.match(invoiceMigration, /existing public\.invoices\.order_ref foreign key is incompatible/);
  assert.match(invoiceMigration, /confupdtype = 'c'/);
  assert.match(invoiceMigration, /confdeltype = 'r'/);
  assert.match(invoiceMigration, /existing public\.invoices must restrict status to issued\/void/);
  assert.match(invoiceMigration, /existing public\.invoices amount constraints are incompatible/);
  assert.match(invoiceMigration, /existing public\.invoices total arithmetic constraint is incompatible/);
  assert.match(invoiceMigration, /existing public\.invoices currency constraint is incompatible/);
  assert.match(invoiceMigration, /existing public\.invoices snapshot constraint is incompatible/);
  assert.match(invoiceMigration, /existing public\.invoices snapshot size constraint is incompatible/);
  assert.match(invoiceMigration, /existing public\.invoices issuer integrity constraint is incompatible/);
  assert.match(invoiceMigration, /existing public\.invoices one-issued-invoice-per-order index is incompatible/);
  assert.match(invoiceMigration, /lower\(regexp_replace\(pg_get_constraintdef\(oid\), '\\s\+', '', 'g'\)\)/);
  assert.match(invoiceMigration, /check\(\(status=any\(array\[''issued''::text,''void''::text\]\)\)\)/);
  assert.match(invoiceMigration, /check\(\(length\(btrim\(invoice_number\)\)>=8\)and\(length\(btrim\(invoice_number\)\)<=80\)\)/);
  assert.match(invoiceMigration, /check\(\(currency_code~''\^\[A-Z\]\{3\}\$''::text\)\)/);
  assert.match(invoiceMigration, /jsonb_typeof\(snapshot\)=''object''::text/);
  assert.match(invoiceMigration, /orderReference/);
  assert.match(invoiceMigration, /payment/);
  assert.match(invoiceMigration, /actor_source=''admin''::text/);
});

test("Invoice migration protects sequence state and exact partial unique index semantics", () => {
  const functionStart = invoiceMigration.indexOf("create or replace function public.admin_v2_next_invoice_number");
  const preFunctionMigration = invoiceMigration.slice(0, functionStart);
  assert.match(invoiceMigration, /existing public\.invoices requires existing public\.admin_v2_invoice_number_seq/);
  assert.match(invoiceMigration, /s\.seqtypid = 'bigint'::regtype/);
  assert.match(invoiceMigration, /s\.seqincrement = 1/);
  assert.match(invoiceMigration, /s\.seqmin = 1/);
  assert.match(invoiceMigration, /not s\.seqcycle/);
  assert.match(invoiceMigration, /v_seq_is_called/);
  assert.match(invoiceMigration, /v_next_sequence_value <= v_max_invoice_suffix/);
  assert.match(invoiceMigration, /public\.admin_v2_invoice_number_seq is behind existing invoice numbers/);
  assert.doesNotMatch(preFunctionMigration, /nextval\(/i);
  assert.doesNotMatch(invoiceMigration, /setval\(|alter sequence/i);
  assert.match(invoiceMigration, /array_length\(string_to_array\(i\.indkey::text, ' '\), 1\) = 1/);
  assert.match(invoiceMigration, /lower\(regexp_replace\(pg_get_expr\(i\.indpred, i\.indrelid\), '\\s\+', '', 'g'\)\) =\s+'\(\(status=''issued''::text\)\)'/);
  assert.doesNotMatch(invoiceMigration, /pg_get_expr\(i\.indpred, i\.indrelid\) ilike '%status%'/i);
});

test("Invoice migration relation-scopes additive constraint checks", () => {
  for (const constraintName of [
    "invoices_actor_source_valid",
    "invoices_issuer_integrity",
    "invoices_snapshot_size",
  ]) {
    const pattern = new RegExp(
      `where conname = '${constraintName}'[\\s\\S]*?and conrelid = 'public\\.invoices'::regclass`,
    );
    assert.match(invoiceMigration, pattern);
  }
});
