-- P0 database access security hardening: final least-privilege pass.
--
-- Intent:
-- - Preserve all existing business data.
-- - Do not alter brand identifiers, rewrite historical rows, or change application behavior.
-- - Treat the audited current production objects as required and fail fast if absent.
-- - Normalize table/function/sequence/storage access to current server-mediated paths.
--
-- This migration is access-control only. Review before applying. Do not use it as
-- a data repair/backfill migration, and do not apply it to live Supabase before
-- the reviewed rollout step.

-- Fail fast before changing access controls. These objects are required by the
-- currently deployed application contract; a missing object means the database is
-- not the expected baseline for this hardening pass.
do $$
declare
  required_table text;
  required_function text;
begin
  foreach required_table in array array[
    'products',
    'product_reviews',
    'store_settings',
    'orders',
    'order_events',
    'order_notes',
    'invoices',
    'customer_accounts',
    'customer_addresses',
    'customer_sessions',
    'customer_activity_logs',
    'admin_staff',
    'admin_staff_activity_logs',
    'support_conversations',
    'support_messages',
    'support_message_attachments',
    'support_message_product_shares',
    'support_message_order_shares',
    'support_internal_notes',
    'support_labels',
    'support_conversation_labels',
    'support_saved_replies',
    'customers'
  ] loop
    if to_regclass(format('public.%I', required_table)) is null then
      raise exception 'P0 database security hardening expected missing table: public.%', required_table;
    end if;
  end loop;

  foreach required_function in array array[
    'public.admin_v2_is_sensitive_status_transition(text,text)',
    'public.admin_v2_is_valid_status_transition(text,text)',
    'public.admin_v2_next_invoice_number(text,timestamp with time zone)',
    'public.admin_v2_order_event_type_for_status(text)',
    'public.admin_v2_status_rank(text)',
    'public.admin_v2_touch_updated_at()',
    'public.admin_v2_update_order_status_with_event(text,text,text,text,text,jsonb,text,text)',
    'public.resolve_support_message_conversation_id()',
    'public.set_orders_updated_at()',
    'public.set_products_updated_at()',
    'public.sync_support_message_body_message()'
  ] loop
    if to_regprocedure(required_function) is null then
      raise exception 'P0 database security hardening expected missing function: %', required_function;
    end if;
  end loop;

  if to_regclass('public.admin_v2_invoice_number_seq') is null then
    raise exception 'P0 database security hardening expected missing sequence: public.admin_v2_invoice_number_seq';
  end if;
end $$;

-- Preserve existing helper behavior while pinning safe search_path on app-owned
-- trigger/helper functions in public.
create or replace function public.resolve_support_message_conversation_id()
returns trigger
language plpgsql
security definer
set search_path to 'pg_catalog', 'public'
as $function$
declare
  resolved_id uuid;
begin
  select id into resolved_id
  from public.support_conversations
  where id = NEW.conversation_id
  limit 1;

  if resolved_id is not null then
    return NEW;
  end if;

  select id into resolved_id
  from public.support_conversations
  where public_token = NEW.conversation_id
  limit 1;

  if resolved_id is not null then
    NEW.conversation_id := resolved_id;
    return NEW;
  end if;

  return NEW;
end;
$function$;

create or replace function public.set_orders_updated_at()
returns trigger
language plpgsql
set search_path to 'pg_catalog', 'public'
as $function$
begin
  new.updated_at = now();
  return new;
end;
$function$;

create or replace function public.set_products_updated_at()
returns trigger
language plpgsql
set search_path to 'pg_catalog', 'public'
as $function$
begin
  new.updated_at = now();
  return new;
end;
$function$;

create or replace function public.sync_support_message_body_message()
returns trigger
language plpgsql
set search_path to 'pg_catalog', 'public'
as $function$
begin
  if (new.message is null or new.message = '') and new.body is not null then
    new.message := new.body;
  end if;

  if (new.body is null or new.body = '') and new.message is not null then
    new.body := new.message;
  end if;

  return new;
end;
$function$;

alter function public.admin_v2_is_sensitive_status_transition(text, text) set search_path to pg_catalog, public;
alter function public.admin_v2_is_valid_status_transition(text, text) set search_path to pg_catalog, public;
alter function public.admin_v2_next_invoice_number(text, timestamp with time zone) set search_path to pg_catalog, public;
alter function public.admin_v2_order_event_type_for_status(text) set search_path to pg_catalog, public;
alter function public.admin_v2_status_rank(text) set search_path to pg_catalog, public;
alter function public.admin_v2_touch_updated_at() set search_path to pg_catalog, public;
alter function public.admin_v2_update_order_status_with_event(text, text, text, text, text, jsonb, text, text) set search_path to pg_catalog, public;

alter table public.products enable row level security;
alter table public.product_reviews enable row level security;
alter table public.store_settings enable row level security;
alter table public.orders enable row level security;
alter table public.order_events enable row level security;
alter table public.order_notes enable row level security;
alter table public.invoices enable row level security;
alter table public.customer_accounts enable row level security;
alter table public.customer_addresses enable row level security;
alter table public.customer_sessions enable row level security;
alter table public.customer_activity_logs enable row level security;
alter table public.admin_staff enable row level security;
alter table public.admin_staff_activity_logs enable row level security;
alter table public.support_conversations enable row level security;
alter table public.support_messages enable row level security;
alter table public.support_message_attachments enable row level security;
alter table public.support_message_product_shares enable row level security;
alter table public.support_message_order_shares enable row level security;
alter table public.support_internal_notes enable row level security;
alter table public.support_labels enable row level security;
alter table public.support_conversation_labels enable row level security;
alter table public.support_saved_replies enable row level security;
alter table public.customers enable row level security;

-- Deterministic table ACL normalization: revoke every role first, then grant
-- only audited service_role operations used by server-mediated repository paths.
revoke all on table public.products from public, anon, authenticated, service_role;
revoke all on table public.product_reviews from public, anon, authenticated, service_role;
revoke all on table public.store_settings from public, anon, authenticated, service_role;
revoke all on table public.orders from public, anon, authenticated, service_role;
revoke all on table public.order_events from public, anon, authenticated, service_role;
revoke all on table public.order_notes from public, anon, authenticated, service_role;
revoke all on table public.invoices from public, anon, authenticated, service_role;
revoke all on table public.customer_accounts from public, anon, authenticated, service_role;
revoke all on table public.customer_addresses from public, anon, authenticated, service_role;
revoke all on table public.customer_sessions from public, anon, authenticated, service_role;
revoke all on table public.customer_activity_logs from public, anon, authenticated, service_role;
revoke all on table public.admin_staff from public, anon, authenticated, service_role;
revoke all on table public.admin_staff_activity_logs from public, anon, authenticated, service_role;
revoke all on table public.support_conversations from public, anon, authenticated, service_role;
revoke all on table public.support_messages from public, anon, authenticated, service_role;
revoke all on table public.support_message_attachments from public, anon, authenticated, service_role;
revoke all on table public.support_message_product_shares from public, anon, authenticated, service_role;
revoke all on table public.support_message_order_shares from public, anon, authenticated, service_role;
revoke all on table public.support_internal_notes from public, anon, authenticated, service_role;
revoke all on table public.support_labels from public, anon, authenticated, service_role;
revoke all on table public.support_conversation_labels from public, anon, authenticated, service_role;
revoke all on table public.support_saved_replies from public, anon, authenticated, service_role;
revoke all on table public.customers from public, anon, authenticated, service_role;

grant select, insert, update, delete on table public.products to service_role;
grant select, insert, update, delete on table public.product_reviews to service_role;
grant select, insert, update on table public.store_settings to service_role;
grant select, insert, update on table public.orders to service_role;
grant select, insert on table public.order_events to service_role;
grant select, insert on table public.order_notes to service_role;
grant select, insert on table public.invoices to service_role;
grant select, insert, update on table public.customer_accounts to service_role;
grant select, insert, update, delete on table public.customer_addresses to service_role;
grant select, insert, delete on table public.customer_sessions to service_role;
grant insert on table public.customer_activity_logs to service_role;
grant select, insert, update on table public.admin_staff to service_role;
grant select, insert on table public.admin_staff_activity_logs to service_role;
grant select, insert, update on table public.support_conversations to service_role;
grant select, insert, update, delete on table public.support_messages to service_role;
grant select, insert on table public.support_message_attachments to service_role;
grant select, insert on table public.support_message_product_shares to service_role;
grant select, insert on table public.support_message_order_shares to service_role;
grant select, insert on table public.support_internal_notes to service_role;
grant select, insert on table public.support_labels to service_role;
grant select, insert, delete on table public.support_conversation_labels to service_role;
-- support_saved_replies currently has no server-mediated DB access path; no service_role table privileges are granted.
-- public.customers is retained without direct application use; no service_role table privileges are granted.

-- Broad public policies removed.
drop policy if exists "Public can manage customer accounts" on public.customer_accounts;
drop policy if exists "Public can manage customer addresses" on public.customer_addresses;
drop policy if exists "Public can manage customer sessions" on public.customer_sessions;
drop policy if exists "Public can manage customer activity logs" on public.customer_activity_logs;
drop policy if exists "Public can create customer account" on public.customers;
drop policy if exists "Public can read customer account" on public.customers;
drop policy if exists "Public can manage customers" on public.customers;
drop policy if exists "Public can create product reviews" on public.product_reviews;
drop policy if exists "Public can read approved product reviews" on public.product_reviews;
drop policy if exists "Public can manage product reviews" on public.product_reviews;
drop policy if exists "Public can create support conversations" on public.support_conversations;
drop policy if exists "Public can read support conversations" on public.support_conversations;
drop policy if exists "Public can update support conversations" on public.support_conversations;
drop policy if exists "Public can create support messages" on public.support_messages;
drop policy if exists "Public can read support messages" on public.support_messages;
drop policy if exists "Public can update support messages" on public.support_messages;

-- Deterministic service-role policies.
drop policy if exists products_service_role_all on public.products;
create policy products_service_role_all on public.products for all to service_role using (true) with check (true);

drop policy if exists product_reviews_service_role_all on public.product_reviews;
create policy product_reviews_service_role_all on public.product_reviews for all to service_role using (true) with check (true);

drop policy if exists store_settings_service_role_all on public.store_settings;
create policy store_settings_service_role_all on public.store_settings for all to service_role using (true) with check (true);

drop policy if exists orders_service_role_all on public.orders;
create policy orders_service_role_all on public.orders for all to service_role using (true) with check (true);

drop policy if exists order_events_service_role_all on public.order_events;
create policy order_events_service_role_all on public.order_events for all to service_role using (true) with check (true);

drop policy if exists order_notes_service_role_all on public.order_notes;
create policy order_notes_service_role_all on public.order_notes for all to service_role using (true) with check (true);

drop policy if exists invoices_service_role_all on public.invoices;
create policy invoices_service_role_all on public.invoices for all to service_role using (true) with check (true);

drop policy if exists customer_accounts_service_role_all on public.customer_accounts;
create policy customer_accounts_service_role_all on public.customer_accounts for all to service_role using (true) with check (true);

drop policy if exists customer_addresses_service_role_all on public.customer_addresses;
create policy customer_addresses_service_role_all on public.customer_addresses for all to service_role using (true) with check (true);

drop policy if exists customer_sessions_service_role_all on public.customer_sessions;
create policy customer_sessions_service_role_all on public.customer_sessions for all to service_role using (true) with check (true);

drop policy if exists customer_activity_logs_service_role_all on public.customer_activity_logs;
create policy customer_activity_logs_service_role_all on public.customer_activity_logs for all to service_role using (true) with check (true);

drop policy if exists admin_staff_service_role_all on public.admin_staff;
create policy admin_staff_service_role_all on public.admin_staff for all to service_role using (true) with check (true);

drop policy if exists admin_staff_activity_logs_service_role_all on public.admin_staff_activity_logs;
create policy admin_staff_activity_logs_service_role_all on public.admin_staff_activity_logs for all to service_role using (true) with check (true);

drop policy if exists support_conversations_service_role_all on public.support_conversations;
create policy support_conversations_service_role_all on public.support_conversations for all to service_role using (true) with check (true);

drop policy if exists support_messages_service_role_all on public.support_messages;
create policy support_messages_service_role_all on public.support_messages for all to service_role using (true) with check (true);

drop policy if exists support_message_attachments_service_role_all on public.support_message_attachments;
create policy support_message_attachments_service_role_all on public.support_message_attachments for all to service_role using (true) with check (true);

drop policy if exists support_message_product_shares_service_role_all on public.support_message_product_shares;
create policy support_message_product_shares_service_role_all on public.support_message_product_shares for all to service_role using (true) with check (true);

drop policy if exists support_message_order_shares_service_role_all on public.support_message_order_shares;
create policy support_message_order_shares_service_role_all on public.support_message_order_shares for all to service_role using (true) with check (true);

drop policy if exists support_internal_notes_service_role_all on public.support_internal_notes;
create policy support_internal_notes_service_role_all on public.support_internal_notes for all to service_role using (true) with check (true);

drop policy if exists support_labels_service_role_all on public.support_labels;
create policy support_labels_service_role_all on public.support_labels for all to service_role using (true) with check (true);

drop policy if exists support_conversation_labels_service_role_all on public.support_conversation_labels;
create policy support_conversation_labels_service_role_all on public.support_conversation_labels for all to service_role using (true) with check (true);

drop policy if exists support_saved_replies_service_role_all on public.support_saved_replies;
create policy support_saved_replies_service_role_all on public.support_saved_replies for all to service_role using (true) with check (true);

drop policy if exists customers_service_role_all on public.customers;

-- Function/RPC least privilege. New functions default to PUBLIC execute, so
-- revoke every audited app-owned function from every runtime role first, then
-- grant service_role execute only on direct RPC entrypoints used by the app.
revoke all on function public.admin_v2_is_sensitive_status_transition(text,text) from public, anon, authenticated, service_role;
revoke all on function public.admin_v2_is_valid_status_transition(text,text) from public, anon, authenticated, service_role;
revoke all on function public.admin_v2_next_invoice_number(text,timestamp with time zone) from public, anon, authenticated, service_role;
revoke all on function public.admin_v2_order_event_type_for_status(text) from public, anon, authenticated, service_role;
revoke all on function public.admin_v2_status_rank(text) from public, anon, authenticated, service_role;
revoke all on function public.admin_v2_touch_updated_at() from public, anon, authenticated, service_role;
revoke all on function public.admin_v2_update_order_status_with_event(text,text,text,text,text,jsonb,text,text) from public, anon, authenticated, service_role;
revoke all on function public.resolve_support_message_conversation_id() from public, anon, authenticated, service_role;
revoke all on function public.set_orders_updated_at() from public, anon, authenticated, service_role;
revoke all on function public.set_products_updated_at() from public, anon, authenticated, service_role;
revoke all on function public.sync_support_message_body_message() from public, anon, authenticated, service_role;

grant execute on function public.admin_v2_next_invoice_number(text,timestamp with time zone) to service_role;
grant execute on function public.admin_v2_update_order_status_with_event(text,text,text,text,text,jsonb,text,text) to service_role;

-- Invoice-number sequence is used internally by the SECURITY DEFINER invoice RPC.
-- No runtime role receives direct sequence privileges.
revoke all on sequence public.admin_v2_invoice_number_seq from public, anon, authenticated, service_role;

-- Product/homepage/review media mutations are server-mediated with service_role.
-- Remove previously exposed authenticated write policies on product media only;
-- bucket visibility and support attachment policies are intentionally unchanged.
drop policy if exists product_media_authenticated_insert on storage.objects;
drop policy if exists product_media_authenticated_update on storage.objects;
drop policy if exists product_media_authenticated_delete on storage.objects;
