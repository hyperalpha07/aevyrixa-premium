import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import test from "node:test";

const read = (path: string) => readFileSync(new URL(`../${path}`, import.meta.url), "utf8");
const migrationDir = new URL("../supabase/migrations/", import.meta.url);
const files = readdirSync(migrationDir).filter(file => file.endsWith(".sql")).sort();
const sqlByFile = new Map(files.map(file => [file, read(`supabase/migrations/${file}`)]));
const allSql = Array.from(sqlByFile.values()).join("\n\n");

const baselines = [
  "20260901080000_core_extensions_and_settings_baseline.sql",
  "20260901081000_products_and_reviews_baseline.sql",
  "20260901082000_admin_staff_baseline.sql",
  "20260901083000_customer_accounts_baseline.sql",
  "20260901084000_orders_core_baseline.sql",
  "20260901085000_support_core_baseline.sql",
  "20260901090000_storage_buckets_baseline.sql",
] as const;

const baselineSql = (file: (typeof baselines)[number]) => sqlByFile.get(file) ?? "";
const allBaselineSql = baselines.map(file => baselineSql(file)).join("\n\n");
const baselineSqlWithoutFunctionBodies = allBaselineSql.replace(/\$function\$[\s\S]*?\$function\$/g, "$function$BODY$function$");
const compact = (value: string) => value.replace(/\s+/g, " ").trim();
const hasSql = (sql: string, expected: string) => assert.match(compact(sql), new RegExp(expected.replace(/[.*+?^${}()|[\]\\]/g, "\\$&").replace(/\\ /g, "\\s+"), "i"));

test("all seven P0 baseline migrations exist and sort before additive support migrations", () => {
  for (const file of baselines) assert.ok(files.includes(file), `${file} exists`);
  assert.ok(files.indexOf("20260901090000_storage_buckets_baseline.sql") < files.indexOf("20260930120000_support_message_attachments.sql"));
  assert.ok(files.indexOf("20260930120000_support_message_attachments.sql") < files.indexOf("20261002090000_support_workflow_entities.sql"));
});

test("extensions and store settings match production contract", () => {
  const core = baselineSql("20260901080000_core_extensions_and_settings_baseline.sql");
  assert.match(core, /create schema if not exists extensions/i);
  assert.match(core, /create extension if not exists pgcrypto with schema extensions/i);
  assert.match(core, /create extension if not exists "uuid-ossp" with schema extensions/i);
  assert.match(core, /id text primary key default 'main'/i);
  assert.match(core, /store_name text null default 'Aevyrixa Her Care'/i);
  assert.match(core, /homepage_media_settings jsonb not null default '\{\}'::jsonb/i);
  assert.doesNotMatch(core, /created_at timestamptz/i);
  assert.doesNotMatch(core, /add column if not exists created_at/i);
  assert.match(core, /store_settings\.id must be text not null default main/i);
});

test("products and reviews use uuid products, current defaults, and no merchandising column", () => {
  const products = baselineSql("20260901081000_products_and_reviews_baseline.sql");
  assert.match(products, /id uuid primary key default gen_random_uuid\(\)/i);
  assert.match(products, /currency text not null default 'USD'/i);
  assert.match(products, /visual text null default 'default'/i);
  assert.match(products, /stock_status in \('in_stock', 'low_stock', 'out_of_stock', 'preorder'\)/i);
  assert.doesNotMatch(products, /merchandising text/i);
  assert.doesNotMatch(products, /add column if not exists merchandising/i);
  assert.match(products, /product_id uuid null/i);
  assert.match(products, /foreign key \(product_id\) references public\.products\(id\) on delete cascade/i);
  assert.match(products, /customer_name text not null default 'Verified customer'/i);
  assert.match(products, /status text not null default 'approved'/i);
  assert.match(products, /is_approved boolean not null default true/i);
  assert.match(products, /media_type is null or media_type in \('image', 'video'\)/i);
  assert.match(products, /source_type in \('order-linked', 'admin-added', 'imported'\)/i);
  assert.match(products, /verified_purchase.*boolean/i);
  assert.doesNotMatch(products, /status in \('pending', 'approved', 'rejected', 'hidden'\)/i);
  assert.match(products, /constraint products_status_check check \(status in \('active','draft'\)\)/i);
  assert.match(products, /constraint products_stock_status_check check \(stock_status in \('in_stock', 'low_stock', 'out_of_stock', 'preorder'\)\)/i);
  assert.doesNotMatch(products, /products_status_valid/i);
  assert.doesNotMatch(products, /products_stock_status_valid/i);
});

test("admin staff contract keeps nullable login fields and exact username uniqueness", () => {
  const staff = baselineSql("20260901082000_admin_staff_baseline.sql");
  assert.match(staff, /email text null/i);
  assert.match(staff, /username text null/i);
  assert.match(staff, /password_hash text null/i);
  assert.match(staff, /role text not null default 'viewer'/i);
  assert.match(staff, /alter table public\.admin_staff add constraint admin_staff_username_key unique \(username\)/i);
  assert.doesNotMatch(staff, /create unique index if not exists admin_staff_username_key/i);
  assert.match(staff, /create index if not exists admin_staff_username_idx on public\.admin_staff \(username\)/i);
  assert.match(staff, /create index if not exists admin_staff_role_idx on public\.admin_staff \(role\)/i);
  assert.match(staff, /create index if not exists admin_staff_is_active_idx on public\.admin_staff \(is_active\)/i);
  assert.doesNotMatch(staff, /create unique index[^;]+lower\(username\)/i);
  assert.match(staff, /references public\.admin_staff\(id\) on delete set null/i);
});

test("customer baseline matches production account and legacy customer shape", () => {
  const customers = baselineSql("20260901083000_customer_accounts_baseline.sql");
  assert.match(customers, /create unique index if not exists customer_accounts_email_unique on public\.customer_accounts \(email\) where email is not null and email <> ''/i);
  assert.match(customers, /alter table public\.customer_accounts add constraint customer_accounts_phone_key unique \(phone\)/i);
  assert.match(customers, /customer_activity_logs[\s\S]+references public\.customer_accounts\(id\) on delete cascade/i);
  assert.match(customers, /create table if not exists public\.customer_addresses[\s\S]+full_name text not null default ''[\s\S]+phone text not null default ''[\s\S]+city_area text not null default ''[\s\S]+address text not null default ''/i);
  assert.match(customers, /create table if not exists public\.customers[\s\S]+full_name text not null[\s\S]+phone text not null[\s\S]+password_hash text not null[\s\S]+status text not null default 'active'/i);
  assert.match(customers, /alter table public\.customers add constraint customers_phone_key unique \(phone\)/i);
  assert.match(customers, /alter table public\.customers add constraint customers_email_key unique \(email\)/i);
  assert.match(customers, /alter table public\.customer_sessions add constraint customer_sessions_token_hash_key unique \(token_hash\)/i);
  assert.doesNotMatch(customers, /create or replace function public\.set_customer_accounts_updated_at/i);
  assert.doesNotMatch(customers, /create trigger set_customer_accounts_updated_at/i);
  assert.doesNotMatch(customers, /on delete set null/i);
});

test("orders table contract removes fallback columns and keeps production defaults/nullability", () => {
  const orders = baselineSql("20260901084000_orders_core_baseline.sql");
  const ordersTable = orders.match(/create table if not exists public\.orders \([\s\S]*?\n\);/)?.[0] ?? "";
  assert.match(orders, /order_ref text not null unique/i);
  assert.match(orders, /customer_id text null/i);
  assert.match(orders, /city_area text not null/i);
  assert.match(orders, /payment_method text not null/i);
  assert.match(orders, /status text not null default 'Pending'/i);
  assert.match(orders, /discount_amount numeric null/i);
  assert.match(orders, /paid_amount numeric null/i);
  assert.match(orders, /due_amount numeric null/i);
  assert.match(orders, /refunded_amount numeric null/i);
  assert.match(orders, /currency_code text null/i);
  assert.match(orders, /payment_verified_at timestamptz null/i);
  assert.match(orders, /payment_verification_status text null default 'Pending'/i);
  assert.match(orders, /proof_received text null default 'No'/i);
  assert.match(orders, /order_source text null default 'Website'/i);
  assert.match(orders, /archived_at timestamptz null/i);
  assert.match(orders, /alter table public\.orders add column if not exists archived_at timestamptz null/i);
  for (const column of ["is_test_order", "test_order", "is_archived", "deleted_at", "soft_deleted_at"]) {
    assert.doesNotMatch(ordersTable, new RegExp(`${column} [a-z]`, "i"));
    assert.doesNotMatch(ordersTable, new RegExp(`add column if not exists ${column}`, "i"));
  }
  assert.doesNotMatch(orders, /orders[\s\S]+customer_id[\s\S]+references public\.customer_accounts/i);
});

test("orders constraints and events preserve production status/payment semantics", () => {
  const orders = baselineSql("20260901084000_orders_core_baseline.sql");
  assert.match(orders, /constraint orders_currency_code_format/i);
  assert.match(orders, /currency_code is null or currency_code ~ '\^\[A-Z\]\{3\}\$'/i);
  assert.match(orders, /constraint orders_delivery_status_valid/i);
  assert.match(orders, /delivery_status is null or delivery_status in \('pending','processing','packed','dispatched','in_transit','delivered','failed','returned'\)/i);
  assert.match(orders, /constraint orders_payment_status_valid/i);
  assert.match(orders, /payment_status is null or payment_status in \('pending','verified','failed','refunded'\)/i);
  for (const name of ["discount_amount", "paid_amount", "due_amount", "refunded_amount"]) {
    assert.match(orders, new RegExp(`constraint orders_${name}_non_negative`, "i"));
    assert.match(orders, new RegExp(`${name} is null or ${name} >= 0`, "i"));
  }
  assert.match(orders, /constraint orders_cancelled_reason_length/i);
  assert.match(orders, /cancelled_reason is null or length\(btrim\(cancelled_reason\)\) between 1 and 2000/i);
  assert.match(orders, /constraint orders_payment_note_length/i);
  assert.match(orders, /payment_note is null or length\(btrim\(payment_note\)\) between 1 and 2000/i);
  assert.doesNotMatch(orders, /orders_subtotal_non_negative/i);
  assert.doesNotMatch(orders, /orders_total_non_negative/i);
  assert.match(orders, /constraint order_events_from_status_check/i);
  assert.match(orders, /from_status is null or from_status in \('Pending','Confirmed','Shipped','Delivered','Cancelled'\)/i);
  assert.match(orders, /constraint order_events_to_status_check/i);
  assert.match(orders, /to_status is null or to_status in \('Pending','Confirmed','Shipped','Delivered','Cancelled'\)/i);
  assert.match(orders, /constraint order_events_event_type_check/i);
  assert.match(orders, /event_type in \('order_created','status_changed','order_confirmed','cancellation_requested','order_cancelled','courier_assigned','out_for_delivery','delivered','refund_initiated','refunded','note_added','invoice_issued','invoice_voided'\)/i);
  for (const constraint of ["order_events_actor_admin_id_check", "order_events_actor_name_check", "order_events_actor_source_check", "order_events_reason_check", "order_events_metadata_check", "order_events_actor_integrity"]) {
    assert.match(orders, new RegExp(`constraint ${constraint}`, "i"));
  }
  assert.match(orders, /actor_source text not null default 'admin'/i);
  assert.match(orders, /metadata jsonb not null default '\{\}'::jsonb/i);
  assert.match(orders, /constraint order_notes_note_type_check/i);
  assert.match(orders, /note_type in \('internal','customer','delivery','payment'\)/i);
  assert.match(orders, /constraint order_notes_note_body_check/i);
  assert.match(orders, /length\(btrim\(note_body\)\) between 1 and 2000/i);
  for (const constraint of ["order_notes_metadata_check", "order_notes_actor_source_check", "order_notes_created_by_admin_id_check", "order_notes_created_by_name_check", "order_notes_actor_integrity"]) {
    assert.match(orders, new RegExp(`constraint ${constraint}`, "i"));
  }
  assert.match(orders, /create trigger order_notes_touch_updated_at before update on public\.order_notes/i);
});

test("Admin V2 order status RPC uses exact production signature and capitalized semantics", () => {
  const orders = baselineSql("20260901084000_orders_core_baseline.sql");
  assert.match(orders, /when 'Pending' then 1 when 'Confirmed' then 2 when 'Shipped' then 3 when 'Delivered' then 4 when 'Cancelled' then 5/i);
  assert.doesNotMatch(orders, /when 'processing'/i);
  assert.match(orders, /function public\.admin_v2_is_valid_status_transition\(p_from_status text, p_to_status text\)/i);
  assert.match(orders, /when p_from_status is null or p_to_status is null then false/i);
  assert.match(orders, /when p_from_status = p_to_status then false/i);
  assert.match(orders, /when p_from_status = 'Cancelled' then false/i);
  assert.match(orders, /when p_from_status = 'Pending' then p_to_status in \('Confirmed','Cancelled'\)/i);
  assert.match(orders, /when p_from_status = 'Confirmed' then p_to_status in \('Shipped','Pending','Cancelled'\)/i);
  assert.match(orders, /when p_from_status = 'Shipped' then p_to_status in \('Delivered','Confirmed','Pending','Cancelled'\)/i);
  assert.match(orders, /when p_from_status = 'Delivered' then p_to_status = 'Shipped'/i);
  assert.match(orders, /when 'Confirmed' then 'order_confirmed' when 'Cancelled' then 'order_cancelled' when 'Shipped' then 'out_for_delivery' when 'Delivered' then 'delivered'/i);
  assert.match(orders, /function public\.admin_v2_order_event_type_for_status\(p_status text\) returns text language sql stable/i);
  assert.match(orders, /function public\.admin_v2_update_order_status_with_event\([\s\S]+p_order_ref text,[\s\S]+p_to_status text,[\s\S]+p_reason text default null,[\s\S]+p_actor_admin_id text default null,[\s\S]+p_actor_name text default null,[\s\S]+p_metadata jsonb default '\{\}'::jsonb,[\s\S]+p_actor_source text default 'admin',[\s\S]+p_sensitive_authorization_reason text default null/i);
  assert.match(orders, /returns table\(order_ref text, previous_status text, current_status text, updated_at timestamptz\)/i);
  assert.match(orders, /security definer set search_path to 'pg_catalog', 'public'/i);
  assert.match(orders, /sensitiveAuthorizationReason/i);
  assert.match(orders, /if v_actor_source = 'admin' and v_actor_admin_id is null and v_actor_name is null then/i);
  assert.doesNotMatch(orders, /v_actor_admin_id is not null and v_actor_name is not null/i);
  assert.match(orders, /Admin actor requires actor admin ID OR actor name/i);
  assert.match(orders, /where o\.order_ref = btrim\(p_order_ref\) for update/i);
  assert.match(orders, /where orders\.order_ref = btrim\(p_order_ref\)/i);
  assert.match(orders, /values \(v_order\.order_ref,/i);
  assert.match(orders, /if v_reason is not null and length\(v_reason\) > 2000 then/i);
  assert.match(orders, /if v_authorization_reason is not null and length\(v_authorization_reason\) > 2000 then/i);
  assert.match(orders, /Owner actor name is reserved/i);
  assert.match(orders, /System actor integrity violation/i);
  assert.match(orders, /length\(v_actor_admin_id\) > 200/i);
  assert.match(orders, /length\(v_actor_name\) > 200/i);
  assert.match(orders, /grant execute on function public\.admin_v2_update_order_status_with_event\(text,text,text,text,text,jsonb,text,text\) to service_role/i);
  assert.doesNotMatch(orders, /returns setof public\.orders/i);
});
test("support core matches foundational production contract and leaves workflow columns additive-owned", () => {
  const support = baselineSql("20260901085000_support_core_baseline.sql");
  assert.match(support, /public_token uuid not null default gen_random_uuid\(\)/i);
  for (const column of ["customer_name", "customer_phone", "customer_email", "source_page", "source_url", "subject", "assigned_staff", "last_message_at"]) {
    assert.match(support, new RegExp(`\\b${column}\\b`, "i"));
  }
  assert.doesNotMatch(support, /assigned_staff_id text/i);
  assert.doesNotMatch(support, /assigned_staff_name text/i);
  assert.doesNotMatch(support, /add column if not exists assigned_staff_id/i);
  assert.doesNotMatch(support, /add column if not exists assigned_staff_name/i);
  assert.match(support, /message text not null/i);
  assert.match(support, /body text null/i);
  assert.match(support, /sender_name text null/i);
  assert.match(support, /sender_type in \('customer', 'admin', 'staff', 'system'\)/i);
  assert.match(support, /where id = new\.conversation_id/i);
  assert.match(support, /where public_token = new\.conversation_id/i);
  assert.match(support, /create trigger support_messages_resolve_conversation_id before insert on public\.support_messages/i);
  assert.match(support, /create trigger support_messages_sync_body_message before insert or update on public\.support_messages/i);
});


test("baseline index ordering and live validation-state contracts are preserved", () => {
  const products = baselineSql("20260901081000_products_and_reviews_baseline.sql");
  const productReviewsTableIndex = products.indexOf("create table if not exists public.product_reviews");
  assert.ok(productReviewsTableIndex >= 0, "product_reviews table exists");
  for (const indexName of [
    "product_reviews_product_id_idx",
    "product_reviews_product_slug_idx",
    "product_reviews_product_slug_status_idx",
    "product_reviews_status_idx",
    "product_reviews_source_type_idx",
    "product_reviews_is_featured_idx",
    "product_reviews_featured_status_idx",
    "product_reviews_approved_featured_idx",
    "product_reviews_created_at_desc_idx",
  ]) {
    const indexPosition = products.indexOf(`create index if not exists ${indexName}`);
    assert.ok(indexPosition > productReviewsTableIndex, `${indexName} is after product_reviews table creation`);
  }

  const validatedConstraints = [
    [products, "product_reviews_product_id_fkey"],
    [products, "product_reviews_rating_check"],
    [products, "product_reviews_media_type_check"],
    [products, "product_reviews_source_type_check"],
    [products, "product_reviews_verified_purchase_safe_check"],
    [baselineSql("20260901082000_admin_staff_baseline.sql"), "admin_staff_activity_logs_staff_id_fkey"],
    [baselineSql("20260901083000_customer_accounts_baseline.sql"), "customer_addresses_customer_id_fkey"],
    [baselineSql("20260901083000_customer_accounts_baseline.sql"), "customer_sessions_customer_id_fkey"],
    [baselineSql("20260901083000_customer_accounts_baseline.sql"), "customer_activity_logs_customer_id_fkey"],
    [baselineSql("20260901084000_orders_core_baseline.sql"), "order_events_order_ref_fkey"],
    [baselineSql("20260901084000_orders_core_baseline.sql"), "order_events_event_type_check"],
    [baselineSql("20260901084000_orders_core_baseline.sql"), "order_events_from_status_check"],
    [baselineSql("20260901084000_orders_core_baseline.sql"), "order_events_to_status_check"],
    [baselineSql("20260901084000_orders_core_baseline.sql"), "order_events_actor_admin_id_check"],
    [baselineSql("20260901084000_orders_core_baseline.sql"), "order_events_actor_name_check"],
    [baselineSql("20260901084000_orders_core_baseline.sql"), "order_events_actor_source_check"],
    [baselineSql("20260901084000_orders_core_baseline.sql"), "order_events_reason_check"],
    [baselineSql("20260901084000_orders_core_baseline.sql"), "order_events_metadata_check"],
    [baselineSql("20260901084000_orders_core_baseline.sql"), "order_notes_order_ref_fkey"],
    [baselineSql("20260901084000_orders_core_baseline.sql"), "order_notes_note_type_check"],
    [baselineSql("20260901084000_orders_core_baseline.sql"), "order_notes_note_body_check"],
    [baselineSql("20260901084000_orders_core_baseline.sql"), "order_notes_metadata_check"],
    [baselineSql("20260901084000_orders_core_baseline.sql"), "order_notes_actor_source_check"],
    [baselineSql("20260901084000_orders_core_baseline.sql"), "order_notes_created_by_admin_id_check"],
    [baselineSql("20260901084000_orders_core_baseline.sql"), "order_notes_created_by_name_check"],
    [baselineSql("20260901085000_support_core_baseline.sql"), "support_messages_conversation_id_fkey"],
    [baselineSql("20260901085000_support_core_baseline.sql"), "support_messages_sender_type_check"],
  ] as const;
  for (const [sql, constraint] of validatedConstraints) {
    assert.doesNotMatch(sql, new RegExp(`constraint ${constraint}[^;]*not valid`, "i"), `${constraint} is validated`);
  }

  const orders = baselineSql("20260901084000_orders_core_baseline.sql");
  for (const constraint of [
    "orders_cancelled_reason_length",
    "orders_currency_code_format",
    "orders_delivery_status_valid",
    "orders_discount_amount_non_negative",
    "orders_due_amount_non_negative",
    "orders_paid_amount_non_negative",
    "orders_payment_note_length",
    "orders_payment_status_valid",
    "orders_refunded_amount_non_negative",
    "order_events_actor_integrity",
    "order_notes_actor_integrity",
  ]) {
    assert.match(orders, new RegExp(`constraint ${constraint}[^;]*not valid`, "i"), `${constraint} remains NOT VALID`);
  }
});

test("live unique constraints, index definitions and actor integrity expressions are exact", () => {
  const staff = baselineSql("20260901082000_admin_staff_baseline.sql");
  const customers = baselineSql("20260901083000_customer_accounts_baseline.sql");
  const orders = baselineSql("20260901084000_orders_core_baseline.sql");
  const support = baselineSql("20260901085000_support_core_baseline.sql");

  assert.match(staff, /alter table public\.admin_staff add constraint admin_staff_username_key unique \(username\)/i);
  assert.match(customers, /alter table public\.customer_accounts add constraint customer_accounts_phone_key unique \(phone\)/i);
  assert.match(customers, /create unique index if not exists customer_accounts_email_unique on public\.customer_accounts \(email\) where email is not null and email <> ''/i);
  assert.match(customers, /alter table public\.customer_sessions add constraint customer_sessions_token_hash_key unique \(token_hash\)/i);
  assert.match(customers, /alter table public\.customers add constraint customers_phone_key unique \(phone\)/i);
  assert.match(customers, /alter table public\.customers add constraint customers_email_key unique \(email\)/i);

  assert.match(orders, /create index if not exists order_events_order_ref_created_at_idx on public\.order_events \(order_ref, created_at\)/i);
  assert.match(orders, /create index if not exists order_events_created_at_idx on public\.order_events \(created_at desc\)/i);
  assert.match(orders, /create index if not exists order_notes_order_ref_created_at_idx on public\.order_notes \(order_ref, created_at desc\) where deleted_at is null/i);
  assert.match(orders, /create index if not exists order_notes_updated_at_idx on public\.order_notes \(updated_at desc\)/i);
  assert.match(support, /create index if not exists support_messages_conversation_id_created_at_idx on public\.support_messages \(conversation_id, created_at\)/i);
  assert.match(support, /create unique index if not exists support_messages_id_conversation_id_idx on public\.support_messages \(id, conversation_id\)/i);

  assert.match(orders, /actor_source = 'admin' and \(nullif\(btrim\(actor_admin_id\), ''\) is not null or nullif\(btrim\(actor_name\), ''\) is not null\)/i);
  assert.match(orders, /actor_source = 'admin' and \(nullif\(btrim\(created_by_admin_id\), ''\) is not null or nullif\(btrim\(created_by_name\), ''\) is not null\)/i);
  assert.match(orders, /actor_source = 'system' and actor_name = 'System' and actor_admin_id is null/i);
  assert.match(orders, /actor_source = 'system' and created_by_name = 'System' and created_by_admin_id is null/i);
});
test("storage baseline uses insert-only creation and verifies bucket contracts", () => {
  const storage = baselineSql("20260901090000_storage_buckets_baseline.sql");
  assert.match(storage, /'product-media'[\s\S]+'product-media'[\s\S]+true[\s\S]+52428800/i);
  const productMediaMimes = ["image/jpeg", "image/jpg", "image/png", "image/webp", "image/gif", "video/mp4", "video/webm", "video/quicktime"];
  for (const mime of productMediaMimes) assert.match(storage, new RegExp(`'${mime}'`));
  assert.doesNotMatch(storage, /'video\/x-m4v'/i);
  const productInsertArray = storage.match(/'product-media',[\s\S]*?array\[([\s\S]*?)\][\s\S]*?on conflict \(id\) do nothing;/i)?.[1] ?? "";
  const productVerifyArray = storage.match(/product_mimes text\[\] := array\[([\s\S]*?)\];/i)?.[1] ?? "";
  const quotedMimes = (value: string) => Array.from(value.matchAll(/'([^']+)'/g), match => match[1]).sort();
  assert.deepEqual(quotedMimes(productInsertArray), [...productMediaMimes].sort());
  assert.deepEqual(quotedMimes(productVerifyArray), [...productMediaMimes].sort());
  assert.match(storage, /'support-attachments'[\s\S]+'support-attachments'[\s\S]+false[\s\S]+10485760/i);
  for (const mime of ["image/jpeg", "image/png", "image/webp", "application/pdf", "application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"]) assert.match(storage, new RegExp(`'${mime.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}'`));
  assert.match(storage, /on conflict \(id\) do nothing/i);
  assert.doesNotMatch(storage, /on conflict \(id\) do update/i);
  assert.match(storage, /bucket MIME allowlist does not match production contract/i);
});

test("preflight compatibility checks cover critical production shapes", () => {
  assert.match(baselineSql("20260901080000_core_extensions_and_settings_baseline.sql"), /store_settings\.id must be text not null default main/i);
  assert.match(baselineSql("20260901081000_products_and_reviews_baseline.sql"), /products\.id must be uuid/i);
  assert.match(baselineSql("20260901081000_products_and_reviews_baseline.sql"), /product_reviews\.product_id must be uuid/i);
  assert.match(baselineSql("20260901084000_orders_core_baseline.sql"), /orders\.order_ref must be text not null/i);
  assert.match(baselineSql("20260901084000_orders_core_baseline.sql"), /orders\.customer_id must be text and must not be a customer_accounts FK/i);
  assert.match(baselineSql("20260901084000_orders_core_baseline.sql"), /admin_v2_update_order_status_with_event signature must match the production contract/i);
  assert.match(baselineSql("20260901085000_support_core_baseline.sql"), /support_conversations\.public_token must be uuid/i);
  assert.match(baselineSql("20260901085000_support_core_baseline.sql"), /support_messages\.conversation_id must cascade/i);
  assert.match(baselineSql("20260901090000_storage_buckets_baseline.sql"), /storage bucket product-media is required/i);
});

test("RLS and least-privilege grants are present without anon/authenticated direct table access", () => {
  for (const table of ["store_settings", "products", "product_reviews", "admin_staff", "admin_staff_activity_logs", "customer_accounts", "customer_addresses", "customer_sessions", "customer_activity_logs", "customers", "orders", "order_events", "order_notes", "support_conversations", "support_messages"]) {
    assert.match(allSql, new RegExp(`alter table public\\.${table} enable row level security`, "i"), `${table} has RLS`);
    assert.match(allSql, new RegExp(`revoke all on table public\\.${table} from public, anon, authenticated, service_role`, "i"), `${table} revokes all runtime roles first`);
  }
  assert.doesNotMatch(allSql, /grant\s+(?:select|insert|update|delete|all)[^;]+to\s+(?:anon|authenticated)\b/i);
  assert.doesNotMatch(allSql, /grant\s+all\s+on\s+table/i);
  assert.doesNotMatch(allSql, /grant\s+[^;]*(?:truncate|trigger|references)[^;]*\s+on\s+table/i);
});

test("service_role table privilege matrix matches server-mediated baseline paths", () => {
  const expected = [
    "grant select, insert, update on table public.store_settings to service_role;",
    "grant select, insert, update, delete on table public.products to service_role;",
    "grant select, insert, update, delete on table public.product_reviews to service_role;",
    "grant select, insert, update on table public.admin_staff to service_role;",
    "grant select, insert on table public.admin_staff_activity_logs to service_role;",
    "grant select, insert, update on table public.customer_accounts to service_role;",
    "grant select, insert, update, delete on table public.customer_addresses to service_role;",
    "grant select, insert, delete on table public.customer_sessions to service_role;",
    "grant insert on table public.customer_activity_logs to service_role;",    "grant select, insert, update on table public.orders to service_role;",
    "grant select, insert on table public.order_events to service_role;",
    "grant select, insert on table public.order_notes to service_role;",
    "grant select, insert, update on table public.support_conversations to service_role;",
    "grant select, insert, update, delete on table public.support_messages to service_role;",
  ];
  for (const grant of expected) hasSql(allSql, grant);
});

test("baseline functions are pinned to safe search_path and direct RPC execute is limited", () => {
  for (const fn of ["set_products_updated_at", "set_orders_updated_at", "admin_v2_touch_updated_at", "resolve_support_message_conversation_id", "sync_support_message_body_message", "admin_v2_status_rank", "admin_v2_is_valid_status_transition", "admin_v2_is_sensitive_status_transition", "admin_v2_order_event_type_for_status", "admin_v2_update_order_status_with_event"]) {
    assert.match(allSql, new RegExp(`function public\\.${fn}\\([\\s\\S]+?set search_path to 'pg_catalog', 'public'`, "i"), `${fn} has fixed search_path`);
  }
  assert.match(allSql, /grant execute on function public\.admin_v2_update_order_status_with_event\(text,text,text,text,text,jsonb,text,text\) to service_role/i);
  assert.doesNotMatch(allSql, /grant execute on function public\.(?:admin_v2_status_rank|admin_v2_is_valid_status_transition|admin_v2_is_sensitive_status_transition|admin_v2_order_event_type_for_status|set_orders_updated_at|set_products_updated_at|resolve_support_message_conversation_id|sync_support_message_body_message)/i);
});

test("invoice schema is intentionally not duplicated by the baseline", () => {
  for (const file of baselines) {
    const sql = baselineSql(file);
    assert.doesNotMatch(sql, /create table if not exists public\.invoices\b/i, `${file} must not create invoices`);
    assert.doesNotMatch(sql, /admin_v2_invoice_number_seq/i, `${file} must not own invoice sequence`);
    assert.doesNotMatch(sql, /admin_v2_next_invoice_number/i, `${file} must not own invoice numbering RPC`);
  }
});

test("baseline migrations are schema-only and avoid destructive business-data operations", () => {
  assert.doesNotMatch(allBaselineSql, /\bdrop\s+table\b|\bdrop\s+column\b|\btruncate\b/i);
  assert.doesNotMatch(allBaselineSql, /\bdelete\s+from\s+public\./i);
  assert.doesNotMatch(baselineSqlWithoutFunctionBodies, /\bupdate\s+public\.(?:orders|products|product_reviews|customer_accounts|customers|support_|store_settings|admin_staff)\b\s+set\b/i);
  assert.doesNotMatch(allBaselineSql, /AEV\s*->\s*NOR|NOR-/i);
});

test("migration dependency scan: additive references have earlier baseline ownership", () => {
  const ownerIndex = new Map<string, number>();
  files.forEach((file, index) => {
    const sql = sqlByFile.get(file) ?? "";
    for (const match of sql.matchAll(/create table if not exists public\.(\w+)/gi)) {
      if (!ownerIndex.has(match[1])) ownerIndex.set(match[1], index);
    }
  });
  const requiredBeforeSupportAttachments = ["support_messages", "support_conversations"];
  const attachmentIndex = files.indexOf("20260930120000_support_message_attachments.sql");
  for (const table of requiredBeforeSupportAttachments) {
    assert.ok((ownerIndex.get(table) ?? Infinity) < attachmentIndex, `${table} has earlier baseline owner`);
  }
});
