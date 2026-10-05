import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import test from "node:test";

const read = (path: string) => readFileSync(new URL(`../${path}`, import.meta.url), "utf8");
const migrationPath = "supabase/migrations/20261005093000_p0_database_access_security_hardening.sql";
const migration = read(migrationPath);

const requiredTables = [
  "products",
  "product_reviews",
  "store_settings",
  "orders",
  "order_events",
  "order_notes",
  "invoices",
  "customer_accounts",
  "customer_addresses",
  "customer_sessions",
  "customer_activity_logs",
  "admin_staff",
  "admin_staff_activity_logs",
  "support_conversations",
  "support_messages",
  "support_message_attachments",
  "support_message_product_shares",
  "support_message_order_shares",
  "support_internal_notes",
  "support_labels",
  "support_conversation_labels",
  "support_saved_replies",
  "customers",
] as const;

const tableGrants: Record<string, string | null> = {
  products: "select, insert, update, delete",
  product_reviews: "select, insert, update, delete",
  store_settings: "select, insert, update",
  orders: "select, insert, update",
  order_events: "select, insert",
  order_notes: "select, insert",
  invoices: "select, insert",
  customer_accounts: "select, insert, update",
  customer_addresses: "select, insert, update, delete",
  customer_sessions: "select, insert, delete",
  customer_activity_logs: "insert",
  admin_staff: "select, insert, update",
  admin_staff_activity_logs: "select, insert",
  support_conversations: "select, insert, update",
  support_messages: "select, insert, update, delete",
  support_message_attachments: "select, insert",
  support_message_product_shares: "select, insert",
  support_message_order_shares: "select, insert",
  support_internal_notes: "select, insert",
  support_labels: "select, insert",
  support_conversation_labels: "select, insert, delete",
  support_saved_replies: null,
  customers: null,
};

const auditedFunctions = [
  "public.admin_v2_is_sensitive_status_transition(text,text)",
  "public.admin_v2_is_valid_status_transition(text,text)",
  "public.admin_v2_next_invoice_number(text,timestamp with time zone)",
  "public.admin_v2_order_event_type_for_status(text)",
  "public.admin_v2_status_rank(text)",
  "public.admin_v2_touch_updated_at()",
  "public.admin_v2_update_order_status_with_event(text,text,text,text,text,jsonb,text,text)",
  "public.resolve_support_message_conversation_id()",
  "public.set_orders_updated_at()",
  "public.set_products_updated_at()",
  "public.sync_support_message_body_message()",
] as const;

const directRpcFunctions = [
  "public.admin_v2_next_invoice_number(text,timestamp with time zone)",
  "public.admin_v2_update_order_status_with_event(text,text,text,text,text,jsonb,text,text)",
] as const;

const helperFunctions = auditedFunctions.filter(fn => !directRpcFunctions.includes(fn as (typeof directRpcFunctions)[number]));

const escapeRegex = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const compactSql = (value: string) => value.replace(/\s+/g, " ").trim();

const assertContainsSql = (sql: string, expected: string) => {
  assert.match(compactSql(sql), new RegExp(escapeRegex(compactSql(expected)), "i"));
};

test("P0 security migration uses the approved final filename only", () => {
  assert.ok(existsSync(new URL(`../${migrationPath}`, import.meta.url)));
  assert.equal(
    existsSync(new URL("../supabase/migrations/20261006090000_p0_database_access_security_hardening.sql", import.meta.url)),
    false,
    "obsolete timestamped migration should not remain",
  );
});

test("P0 security migration fail-fast preflights required tables, functions and invoice sequence", () => {
  const firstAccessControlIndex = migration.search(/\balter table public\.products enable row level security\b/i);
  const preflightIndex = migration.search(/P0 database security hardening expected missing table/i);
  assert.ok(preflightIndex >= 0, "missing-table preflight is present");
  assert.ok(firstAccessControlIndex > preflightIndex, "preflight runs before table access-control changes");

  for (const table of requiredTables) {
    assert.match(migration, new RegExp(`'${table}'`), `${table} is listed as required`);
  }
  for (const fn of auditedFunctions) {
    assert.match(migration, new RegExp(escapeRegex(`'${fn}'`)), `${fn} is listed as required`);
  }
  assert.match(migration, /to_regclass\('public\.admin_v2_invoice_number_seq'\) is null/i);
  assert.match(migration, /raise exception 'P0 database security hardening expected missing sequence: public\.admin_v2_invoice_number_seq'/i);
});

test("P0 security migration deterministically revokes and grants the exact service-role table matrix", () => {
  for (const table of requiredTables) {
    assertContainsSql(migration, `revoke all on table public.${table} from public, anon, authenticated, service_role;`);
    assertContainsSql(migration, `alter table public.${table} enable row level security;`);

    const grant = tableGrants[table];
    if (grant) {
      assertContainsSql(migration, `grant ${grant} on table public.${table} to service_role;`);
    } else {
      assert.doesNotMatch(
        migration,
        new RegExp(`grant\\s+(?:select|insert|update|delete|all)[^;]+on table public\\.${table}\\s+to service_role`, "i"),
        `${table} should have no service_role table grant`,
      );
    }
  }

  assert.doesNotMatch(migration, /grant\s+all\s+on\s+table/i);
  assert.doesNotMatch(migration, /grant\s+[^;]*(?:truncate|trigger|references)[^;]*\s+on\s+table/i);
  assert.doesNotMatch(migration, /grant\s+(?:select|insert|update|delete|all)[^;]+to\s+(?:anon|authenticated)\b/i);
});

test("P0 security migration normalizes policies with drop-and-create service_role policies and no auth.role", () => {
  assert.doesNotMatch(migration, /auth\.role\s*\(/i);
  assert.doesNotMatch(migration, /if\s+not\s+exists[\s\S]{0,120}create\s+policy/i);
  assert.doesNotMatch(migration, /pg_policies/i);

  for (const table of requiredTables.filter(table => table !== "customers")) {
    assertContainsSql(migration, `drop policy if exists ${table}_service_role_all on public.${table};`);
    assertContainsSql(migration, `create policy ${table}_service_role_all on public.${table} for all to service_role using (true) with check (true);`);
  }
  assertContainsSql(migration, "drop policy if exists customers_service_role_all on public.customers;");
  assert.doesNotMatch(migration, /create policy customers_service_role_all/i);
});

test("P0 security migration grants execute only to direct RPCs after revoking all audited functions", () => {
  for (const fn of auditedFunctions) {
    assertContainsSql(migration, `revoke all on function ${fn} from public, anon, authenticated, service_role;`);
  }
  for (const fn of directRpcFunctions) {
    assertContainsSql(migration, `grant execute on function ${fn} to service_role;`);
  }
  for (const fn of helperFunctions) {
    assert.doesNotMatch(
      migration,
      new RegExp(`grant\\s+execute\\s+on\\s+function\\s+${escapeRegex(fn)}\\s+to\\s+service_role`, "i"),
      `${fn} must remain helper/trigger-only with no service_role EXECUTE grant`,
    );
  }
  assert.doesNotMatch(migration, /grant\s+execute\s+on\s+function[^;]+to\s+(?:public|anon|authenticated)\b/i);
});

test("P0 security migration pins app-owned function search_path and avoids direct sequence exposure", () => {
  for (const fn of [
    "public.admin_v2_is_sensitive_status_transition(text, text)",
    "public.admin_v2_is_valid_status_transition(text, text)",
    "public.admin_v2_next_invoice_number(text, timestamp with time zone)",
    "public.admin_v2_order_event_type_for_status(text)",
    "public.admin_v2_status_rank(text)",
    "public.admin_v2_touch_updated_at()",
    "public.admin_v2_update_order_status_with_event(text, text, text, text, text, jsonb, text, text)",
  ]) {
    assertContainsSql(migration, `alter function ${fn} set search_path to pg_catalog, public;`);
  }

  for (const fnName of [
    "resolve_support_message_conversation_id",
    "set_orders_updated_at",
    "set_products_updated_at",
    "sync_support_message_body_message",
  ]) {
    assert.match(
      migration,
      new RegExp(`create or replace function public\\.${fnName}\\([\\s\\S]+?set search_path to 'pg_catalog', 'public'`, "i"),
      `${fnName} should be recreated with pinned search_path`,
    );
  }

  assertContainsSql(migration, "revoke all on sequence public.admin_v2_invoice_number_seq from public, anon, authenticated, service_role;");
  assert.doesNotMatch(migration, /grant\s+(?:usage|select|update|all)[^;]+on\s+sequence\s+public\.admin_v2_invoice_number_seq/i);
  assert.doesNotMatch(migration, /\bnextval\s*\(/i);
  assert.doesNotMatch(migration, /\bsetval\s*\(/i);
});

test("P0 security migration removes only confirmed direct product-media write policies", () => {
  for (const policy of [
    "product_media_authenticated_insert",
    "product_media_authenticated_update",
    "product_media_authenticated_delete",
  ]) {
    assertContainsSql(migration, `drop policy if exists ${policy} on storage.objects;`);
  }
  assert.doesNotMatch(migration, /update\s+storage\.buckets/i);
  assert.doesNotMatch(migration, /support[-_]attachments[\s\S]{0,160}(?:drop policy|update\s+storage\.buckets)/i);
});

test("real repository access paths justify the least-privilege table matrix", () => {
  const customerStore = read("app/lib/customer-account-store.ts");
  const supportStore = read("app/lib/support-store.ts");
  const reviewStore = read("app/lib/review-store.ts");
  const productStore = read("app/lib/product-store.ts");
  const settingsStore = read("app/lib/settings-store.ts");
  const orderStore = read("app/lib/order-store.ts");
  const adminStaff = read("app/lib/admin-staff.ts");

  for (const source of [customerStore, supportStore, reviewStore, productStore, settingsStore, orderStore, adminStaff]) {
    assert.match(source, /SUPABASE_SERVICE_ROLE_KEY/);
    assert.doesNotMatch(source, /NEXT_PUBLIC_SUPABASE_ANON_KEY/);
  }

  assert.match(customerStore, /dbPost<AccountRow\[\]>\(`\$\{ACCOUNTS_TABLE\}/);
  assert.match(customerStore, /dbPatch<AccountRow\[\]>\(`\$\{ACCOUNTS_TABLE\}/);
  assert.doesNotMatch(customerStore, /dbDelete\(`\$\{ACCOUNTS_TABLE\}/);
  assert.match(customerStore, /dbPost<SessionRow\[\]>\(`\$\{SESSIONS_TABLE\}/);
  assert.match(customerStore, /dbDelete\(`\$\{SESSIONS_TABLE\}/);
  assert.doesNotMatch(customerStore, /dbPatch<[^>]+>\(`\$\{SESSIONS_TABLE\}/);
  assert.match(customerStore, /dbPost\(`\$\{ACTIVITY_TABLE\}/);
  assert.doesNotMatch(customerStore, /db(?:Get|Patch|Delete)[\s\S]{0,80}`\$\{ACTIVITY_TABLE\}/);

  assert.match(productStore, /SUPABASE_PRODUCTS_TABLE/);
  assert.match(reviewStore, /createReview/);
  assert.match(settingsStore, /on_conflict=id/);
  assert.match(orderStore, /admin_v2_update_order_status_with_event/);
  assert.match(orderStore, /admin_v2_next_invoice_number/);
  assert.match(supportStore, /support_message_attachments/);
  assert.doesNotMatch(read("components/admin-v2/views/support/AdminV2SupportComposer.tsx"), /support_saved_replies/);
});

test("product, homepage and review media mutations are server-mediated by service-role routes", () => {
  for (const path of [
    "app/api/product-media/upload/route.ts",
    "app/api/homepage-media/upload/route.ts",
    "app/api/account/reviews/media/route.ts",
    "lib/admin-v2/product-media-store.ts",
  ]) {
    const source = read(path);
    assert.match(source, /SUPABASE_SERVICE_ROLE_KEY/, `${path} uses the service-role key server-side`);
    assert.doesNotMatch(source, /NEXT_PUBLIC_SUPABASE_ANON_KEY/, `${path} should not use anon upload credentials`);
  }
});

test("P0 migration is access-control only and does not mutate business rows or brand data", () => {
  assert.doesNotMatch(migration, /\bupdate\s+public\.(?:orders|products|customer_accounts|customers|product_reviews|store_settings)\b/i);
  assert.doesNotMatch(migration, /\bdelete\s+from\s+public\./i);
  assert.doesNotMatch(migration, /\btruncate\s+public\./i);
  assert.doesNotMatch(migration, /\binsert\s+into\s+public\./i);
  assert.doesNotMatch(migration, /AEV\s*->\s*NOR|rename\s+.*\bAEV\b/i);
});
