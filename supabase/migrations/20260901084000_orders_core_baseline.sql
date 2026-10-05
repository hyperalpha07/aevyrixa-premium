-- P0 baseline 5: orders, order events, order notes and status RPC foundation.
-- This is a reproducible production-contract baseline for order infrastructure only.
-- It does not create invoices and does not rewrite historical order data.

create or replace function public.set_orders_updated_at()
returns trigger language plpgsql set search_path to 'pg_catalog', 'public' as $function$
begin
  new.updated_at = now();
  return new;
end;
$function$;

create or replace function public.admin_v2_touch_updated_at()
returns trigger language plpgsql set search_path to 'pg_catalog', 'public' as $function$
begin
  new.updated_at = now();
  return new;
end;
$function$;

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  order_ref text not null unique,
  customer_id text null,
  customer_name text not null,
  customer_phone text not null,
  customer_email text null,
  city_area text not null,
  delivery_address text not null,
  size_fit_note text null,
  delivery_note text null,
  items jsonb not null default '[]'::jsonb,
  subtotal numeric not null default 0,
  total numeric not null default 0,
  discount_amount numeric null,
  paid_amount numeric null,
  due_amount numeric null,
  refunded_amount numeric null,
  currency_code text null,
  payment_method text not null,
  wallet_provider text null,
  payment_type text null,
  receiver_number text null,
  sender_number text null,
  transaction_id text null,
  status text not null default 'Pending',
  courier_name text null,
  tracking_id text null,
  delivery_status text null,
  delivery_charge numeric null,
  delivery_area text null,
  delivery_zone text null,
  assigned_staff text null,
  customer_confirmation_note text null,
  payment_status text null,
  payment_verified_at timestamptz null,
  payment_verification_status text null default 'Pending',
  payment_reference text null,
  payment_note text null,
  refund_exchange_request text null,
  size_issue_report text null,
  proof_received text null default 'No',
  admin_internal_note text null,
  order_source text null default 'Website',
  archived_at timestamptz null,
  cancelled_reason text null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.orders add column if not exists order_ref text;
alter table public.orders add column if not exists customer_id text null;
alter table public.orders add column if not exists customer_name text not null default '';
alter table public.orders add column if not exists customer_phone text not null default '';
alter table public.orders add column if not exists customer_email text null;
alter table public.orders add column if not exists city_area text not null default '';
alter table public.orders add column if not exists delivery_address text not null default '';
alter table public.orders add column if not exists size_fit_note text null;
alter table public.orders add column if not exists delivery_note text null;
alter table public.orders add column if not exists items jsonb not null default '[]'::jsonb;
alter table public.orders add column if not exists subtotal numeric not null default 0;
alter table public.orders add column if not exists total numeric not null default 0;
alter table public.orders add column if not exists discount_amount numeric null;
alter table public.orders add column if not exists paid_amount numeric null;
alter table public.orders add column if not exists due_amount numeric null;
alter table public.orders add column if not exists refunded_amount numeric null;
alter table public.orders add column if not exists currency_code text null;
alter table public.orders add column if not exists payment_method text not null default '';
alter table public.orders add column if not exists wallet_provider text null;
alter table public.orders add column if not exists payment_type text null;
alter table public.orders add column if not exists receiver_number text null;
alter table public.orders add column if not exists sender_number text null;
alter table public.orders add column if not exists transaction_id text null;
alter table public.orders add column if not exists status text not null default 'Pending';
alter table public.orders add column if not exists courier_name text null;
alter table public.orders add column if not exists tracking_id text null;
alter table public.orders add column if not exists delivery_status text null;
alter table public.orders add column if not exists delivery_charge numeric null;
alter table public.orders add column if not exists delivery_area text null;
alter table public.orders add column if not exists delivery_zone text null;
alter table public.orders add column if not exists assigned_staff text null;
alter table public.orders add column if not exists customer_confirmation_note text null;
alter table public.orders add column if not exists payment_status text null;
alter table public.orders add column if not exists payment_verified_at timestamptz null;
alter table public.orders add column if not exists payment_verification_status text null default 'Pending';
alter table public.orders add column if not exists payment_reference text null;
alter table public.orders add column if not exists payment_note text null;
alter table public.orders add column if not exists refund_exchange_request text null;
alter table public.orders add column if not exists size_issue_report text null;
alter table public.orders add column if not exists proof_received text null default 'No';
alter table public.orders add column if not exists admin_internal_note text null;
alter table public.orders add column if not exists order_source text null default 'Website';
alter table public.orders add column if not exists archived_at timestamptz null;
alter table public.orders add column if not exists cancelled_reason text null;
alter table public.orders add column if not exists created_at timestamptz not null default now();
alter table public.orders add column if not exists updated_at timestamptz not null default now();

create unique index if not exists orders_order_ref_key on public.orders (order_ref);
create index if not exists orders_order_ref_idx on public.orders (order_ref);
create index if not exists orders_created_at_idx on public.orders (created_at desc);
create index if not exists orders_status_idx on public.orders (status);
create index if not exists orders_payment_method_idx on public.orders (payment_method);
create index if not exists orders_delivery_status_idx on public.orders (delivery_status);
create index if not exists orders_payment_status_idx on public.orders (payment_status);
create index if not exists orders_total_idx on public.orders (total);

do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public'
      and table_name = 'orders'
      and column_name in ('is_test_order', 'test_order', 'is_archived', 'deleted_at', 'soft_deleted_at')
  ) then
    raise exception 'orders contains fallback-only columns outside the production baseline contract';
  end if;

  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'orders'
      and column_name = 'customer_id'
      and data_type <> 'text'
  ) then
    raise exception 'orders.customer_id must be text and must not be a customer_accounts FK';
  end if;

  if exists (
    select 1
    from pg_constraint c
    join unnest(c.conkey) with ordinality as k(attnum, ord) on true
    join pg_attribute a on a.attrelid = c.conrelid and a.attnum = k.attnum
    where c.conrelid = 'public.orders'::regclass
      and c.contype = 'f'
      and a.attname = 'customer_id'
  ) then
    raise exception 'orders.customer_id must not have a foreign key in the production baseline contract';
  end if;

  if not exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'orders'
      and column_name = 'order_ref'
      and data_type = 'text'
      and is_nullable = 'NO'
  ) then
    raise exception 'orders.order_ref must be text not null';
  end if;

  if not exists (
    select 1
    from pg_constraint c
    join pg_attribute a on a.attrelid = c.conrelid and a.attnum = any(c.conkey)
    where c.conrelid = 'public.orders'::regclass
      and c.contype in ('p', 'u')
      and cardinality(c.conkey) = 1
      and a.attname = 'order_ref'
  ) then
    raise exception 'orders.order_ref must have an exact single-column primary key or unique constraint/index equivalent';
  end if;
end $$;

create table if not exists public.order_events (
  id uuid primary key default gen_random_uuid(),
  order_ref text not null references public.orders(order_ref) on update cascade on delete restrict,
  event_type text not null,
  from_status text null,
  to_status text null,
  reason text null,
  metadata jsonb not null default '{}'::jsonb,
  actor_admin_id text null,
  actor_name text null,
  actor_source text not null default 'admin',
  created_at timestamptz not null default now()
);

alter table public.order_events add column if not exists order_ref text;
alter table public.order_events add column if not exists event_type text not null default 'status_changed';
alter table public.order_events add column if not exists from_status text null;
alter table public.order_events add column if not exists to_status text null;
alter table public.order_events add column if not exists reason text null;
alter table public.order_events add column if not exists metadata jsonb not null default '{}'::jsonb;
alter table public.order_events add column if not exists actor_admin_id text null;
alter table public.order_events add column if not exists actor_name text null;
alter table public.order_events add column if not exists actor_source text not null default 'admin';
alter table public.order_events add column if not exists created_at timestamptz not null default now();

create table if not exists public.order_notes (
  id uuid primary key default gen_random_uuid(),
  order_ref text not null references public.orders(order_ref) on update cascade on delete restrict,
  note_body text not null,
  note_type text not null default 'internal',
  created_by_admin_id text null,
  created_by_name text null,
  actor_source text not null default 'admin',
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz null
);

alter table public.order_notes add column if not exists order_ref text;
alter table public.order_notes add column if not exists note_body text not null default '';
alter table public.order_notes add column if not exists note_type text not null default 'internal';
alter table public.order_notes add column if not exists created_by_admin_id text null;
alter table public.order_notes add column if not exists created_by_name text null;
alter table public.order_notes add column if not exists actor_source text not null default 'admin';
alter table public.order_notes add column if not exists metadata jsonb not null default '{}'::jsonb;
alter table public.order_notes add column if not exists created_at timestamptz not null default now();
alter table public.order_notes add column if not exists updated_at timestamptz not null default now();
alter table public.order_notes add column if not exists deleted_at timestamptz null;

do $$
begin
  if not exists (select 1 from pg_constraint where conrelid = 'public.order_events'::regclass and conname = 'order_events_order_ref_fkey') then
    alter table public.order_events add constraint order_events_order_ref_fkey foreign key (order_ref) references public.orders(order_ref) on update cascade on delete restrict;
  end if;
  if not exists (select 1 from pg_constraint where conrelid = 'public.order_notes'::regclass and conname = 'order_notes_order_ref_fkey') then
    alter table public.order_notes add constraint order_notes_order_ref_fkey foreign key (order_ref) references public.orders(order_ref) on update cascade on delete restrict;
  end if;
  if not exists (select 1 from pg_constraint where conrelid = 'public.orders'::regclass and conname = 'orders_currency_code_format') then
    alter table public.orders add constraint orders_currency_code_format check (currency_code is null or currency_code ~ '^[A-Z]{3}$') not valid;
  end if;
  if not exists (select 1 from pg_constraint where conrelid = 'public.orders'::regclass and conname = 'orders_delivery_status_valid') then
    alter table public.orders add constraint orders_delivery_status_valid check (delivery_status is null or delivery_status in ('pending','processing','packed','dispatched','in_transit','delivered','failed','returned')) not valid;
  end if;
  if not exists (select 1 from pg_constraint where conrelid = 'public.orders'::regclass and conname = 'orders_payment_status_valid') then
    alter table public.orders add constraint orders_payment_status_valid check (payment_status is null or payment_status in ('pending','verified','failed','refunded')) not valid;
  end if;
  if not exists (select 1 from pg_constraint where conrelid = 'public.orders'::regclass and conname = 'orders_discount_amount_non_negative') then
    alter table public.orders add constraint orders_discount_amount_non_negative check (discount_amount is null or discount_amount >= 0) not valid;
  end if;
  if not exists (select 1 from pg_constraint where conrelid = 'public.orders'::regclass and conname = 'orders_paid_amount_non_negative') then
    alter table public.orders add constraint orders_paid_amount_non_negative check (paid_amount is null or paid_amount >= 0) not valid;
  end if;
  if not exists (select 1 from pg_constraint where conrelid = 'public.orders'::regclass and conname = 'orders_due_amount_non_negative') then
    alter table public.orders add constraint orders_due_amount_non_negative check (due_amount is null or due_amount >= 0) not valid;
  end if;
  if not exists (select 1 from pg_constraint where conrelid = 'public.orders'::regclass and conname = 'orders_refunded_amount_non_negative') then
    alter table public.orders add constraint orders_refunded_amount_non_negative check (refunded_amount is null or refunded_amount >= 0) not valid;
  end if;
  if not exists (select 1 from pg_constraint where conrelid = 'public.orders'::regclass and conname = 'orders_cancelled_reason_length') then
    alter table public.orders add constraint orders_cancelled_reason_length check (cancelled_reason is null or length(btrim(cancelled_reason)) between 1 and 2000) not valid;
  end if;
  if not exists (select 1 from pg_constraint where conrelid = 'public.orders'::regclass and conname = 'orders_payment_note_length') then
    alter table public.orders add constraint orders_payment_note_length check (payment_note is null or length(btrim(payment_note)) between 1 and 2000) not valid;
  end if;
  if not exists (select 1 from pg_constraint where conrelid = 'public.order_events'::regclass and conname = 'order_events_event_type_check') then
    alter table public.order_events add constraint order_events_event_type_check check (event_type in ('order_created','status_changed','order_confirmed','cancellation_requested','order_cancelled','courier_assigned','out_for_delivery','delivered','refund_initiated','refunded','note_added','invoice_issued','invoice_voided'));
  end if;
  if not exists (select 1 from pg_constraint where conrelid = 'public.order_events'::regclass and conname = 'order_events_from_status_check') then
    alter table public.order_events add constraint order_events_from_status_check check (from_status is null or from_status in ('Pending','Confirmed','Shipped','Delivered','Cancelled'));
  end if;
  if not exists (select 1 from pg_constraint where conrelid = 'public.order_events'::regclass and conname = 'order_events_to_status_check') then
    alter table public.order_events add constraint order_events_to_status_check check (to_status is null or to_status in ('Pending','Confirmed','Shipped','Delivered','Cancelled'));
  end if;
  if not exists (select 1 from pg_constraint where conrelid = 'public.order_events'::regclass and conname = 'order_events_actor_admin_id_check') then
    alter table public.order_events add constraint order_events_actor_admin_id_check check (actor_admin_id is null or length(btrim(actor_admin_id)) between 1 and 200);
  end if;
  if not exists (select 1 from pg_constraint where conrelid = 'public.order_events'::regclass and conname = 'order_events_actor_name_check') then
    alter table public.order_events add constraint order_events_actor_name_check check (actor_name is null or (length(btrim(actor_name)) between 1 and 200 and lower(btrim(actor_name)) <> 'owner'));
  end if;
  if not exists (select 1 from pg_constraint where conrelid = 'public.order_events'::regclass and conname = 'order_events_actor_source_check') then
    alter table public.order_events add constraint order_events_actor_source_check check (actor_source in ('admin','system','unknown'));
  end if;
  if not exists (select 1 from pg_constraint where conrelid = 'public.order_events'::regclass and conname = 'order_events_reason_check') then
    alter table public.order_events add constraint order_events_reason_check check (reason is null or length(btrim(reason)) between 1 and 2000);
  end if;
  if not exists (select 1 from pg_constraint where conrelid = 'public.order_events'::regclass and conname = 'order_events_metadata_check') then
    alter table public.order_events add constraint order_events_metadata_check check (jsonb_typeof(metadata) = 'object' and length(metadata::text) <= 32768);
  end if;
  if not exists (select 1 from pg_constraint where conrelid = 'public.order_events'::regclass and conname = 'order_events_actor_integrity') then
    alter table public.order_events add constraint order_events_actor_integrity check (
      (actor_source = 'admin' and (nullif(btrim(actor_admin_id), '') is not null or nullif(btrim(actor_name), '') is not null) and (actor_name is null or lower(btrim(actor_name)) <> 'owner'))
      or (actor_source = 'system' and actor_name = 'System' and actor_admin_id is null)
      or (actor_source = 'unknown' and (actor_name is null or lower(btrim(actor_name)) <> 'owner'))
    ) not valid;
  end if;
  if not exists (select 1 from pg_constraint where conrelid = 'public.order_notes'::regclass and conname = 'order_notes_note_type_check') then
    alter table public.order_notes add constraint order_notes_note_type_check check (note_type in ('internal','customer','delivery','payment'));
  end if;
  if not exists (select 1 from pg_constraint where conrelid = 'public.order_notes'::regclass and conname = 'order_notes_note_body_check') then
    alter table public.order_notes add constraint order_notes_note_body_check check (length(btrim(note_body)) between 1 and 2000);
  end if;
  if not exists (select 1 from pg_constraint where conrelid = 'public.order_notes'::regclass and conname = 'order_notes_metadata_check') then
    alter table public.order_notes add constraint order_notes_metadata_check check (jsonb_typeof(metadata) = 'object' and length(metadata::text) <= 32768);
  end if;
  if not exists (select 1 from pg_constraint where conrelid = 'public.order_notes'::regclass and conname = 'order_notes_actor_source_check') then
    alter table public.order_notes add constraint order_notes_actor_source_check check (actor_source in ('admin','system','unknown'));
  end if;
  if not exists (select 1 from pg_constraint where conrelid = 'public.order_notes'::regclass and conname = 'order_notes_created_by_admin_id_check') then
    alter table public.order_notes add constraint order_notes_created_by_admin_id_check check (created_by_admin_id is null or length(btrim(created_by_admin_id)) between 1 and 200);
  end if;
  if not exists (select 1 from pg_constraint where conrelid = 'public.order_notes'::regclass and conname = 'order_notes_created_by_name_check') then
    alter table public.order_notes add constraint order_notes_created_by_name_check check (created_by_name is null or (length(btrim(created_by_name)) between 1 and 200 and lower(btrim(created_by_name)) <> 'owner'));
  end if;
  if not exists (select 1 from pg_constraint where conrelid = 'public.order_notes'::regclass and conname = 'order_notes_actor_integrity') then
    alter table public.order_notes add constraint order_notes_actor_integrity check (
      (actor_source = 'admin' and (nullif(btrim(created_by_admin_id), '') is not null or nullif(btrim(created_by_name), '') is not null) and (created_by_name is null or lower(btrim(created_by_name)) <> 'owner'))
      or (actor_source = 'system' and created_by_name = 'System' and created_by_admin_id is null)
      or (actor_source = 'unknown' and (created_by_name is null or lower(btrim(created_by_name)) <> 'owner'))
    ) not valid;
  end if;
end $$;

create index if not exists order_events_order_ref_created_at_idx on public.order_events (order_ref, created_at);
create index if not exists order_events_created_at_idx on public.order_events (created_at desc);
create index if not exists order_notes_order_ref_created_at_idx on public.order_notes (order_ref, created_at desc) where deleted_at is null;
create index if not exists order_notes_updated_at_idx on public.order_notes (updated_at desc);

create or replace function public.admin_v2_status_rank(p_status text) returns integer language sql immutable set search_path to 'pg_catalog', 'public' as $function$
  select case p_status when 'Pending' then 1 when 'Confirmed' then 2 when 'Shipped' then 3 when 'Delivered' then 4 when 'Cancelled' then 5 else null end;
$function$;

create or replace function public.admin_v2_is_valid_status_transition(p_from_status text, p_to_status text) returns boolean language sql stable set search_path to 'pg_catalog', 'public' as $function$
  select case
    when p_from_status is null or p_to_status is null then false
    when p_from_status = p_to_status then false
    when p_from_status = 'Cancelled' then false
    when p_from_status = 'Pending' then p_to_status in ('Confirmed','Cancelled')
    when p_from_status = 'Confirmed' then p_to_status in ('Shipped','Pending','Cancelled')
    when p_from_status = 'Shipped' then p_to_status in ('Delivered','Confirmed','Pending','Cancelled')
    when p_from_status = 'Delivered' then p_to_status = 'Shipped'
    else false
  end;
$function$;

create or replace function public.admin_v2_is_sensitive_status_transition(p_from_status text, p_to_status text) returns boolean language sql stable set search_path to 'pg_catalog', 'public' as $function$
  select case
    when not public.admin_v2_is_valid_status_transition(p_from_status, p_to_status) then false
    when p_to_status = 'Cancelled' then true
    when public.admin_v2_status_rank(p_to_status) < public.admin_v2_status_rank(p_from_status) then true
    else false
  end;
$function$;

create or replace function public.admin_v2_order_event_type_for_status(p_status text) returns text language sql stable set search_path to 'pg_catalog', 'public' as $function$
  select case p_status when 'Confirmed' then 'order_confirmed' when 'Cancelled' then 'order_cancelled' when 'Shipped' then 'out_for_delivery' when 'Delivered' then 'delivered' else 'status_changed' end;
$function$;

create or replace function public.admin_v2_update_order_status_with_event(
  p_order_ref text,
  p_to_status text,
  p_reason text default null,
  p_actor_admin_id text default null,
  p_actor_name text default null,
  p_metadata jsonb default '{}'::jsonb,
  p_actor_source text default 'admin',
  p_sensitive_authorization_reason text default null
)
returns table(order_ref text, previous_status text, current_status text, updated_at timestamptz)
language plpgsql security definer set search_path to 'pg_catalog', 'public' as $function$
declare
  v_order public.orders%rowtype;
  v_previous_status text;
  v_actor_name text := nullif(btrim(coalesce(p_actor_name, '')), '');
  v_actor_admin_id text := nullif(btrim(coalesce(p_actor_admin_id, '')), '');
  v_actor_source text := coalesce(nullif(btrim(coalesce(p_actor_source, '')), ''), 'admin');
  v_reason text := nullif(btrim(coalesce(p_reason, '')), '');
  v_authorization_reason text := nullif(btrim(coalesce(p_sensitive_authorization_reason, '')), '');
  v_metadata jsonb := coalesce(p_metadata, '{}'::jsonb);
  v_event_metadata jsonb;
begin
  if nullif(btrim(coalesce(p_order_ref, '')), '') is null then
    raise exception 'Order reference is required.' using errcode = '22023';
  end if;
  if nullif(btrim(coalesce(p_to_status, '')), '') is null then
    raise exception 'Target status is required.' using errcode = '22023';
  end if;
  if p_to_status not in ('Pending','Confirmed','Shipped','Delivered','Cancelled') then
    raise exception 'Invalid target status.' using errcode = '23514';
  end if;
  if jsonb_typeof(v_metadata) <> 'object' or length(v_metadata::text) > 32768 then
    raise exception 'Invalid metadata.' using errcode = '23514';
  end if;
  if v_reason is not null and length(v_reason) > 2000 then
    raise exception 'Reason is too long.' using errcode = '22023';
  end if;
  if v_authorization_reason is not null and length(v_authorization_reason) > 2000 then
    raise exception 'Sensitive authorization reason is too long.' using errcode = '22023';
  end if;
  if v_actor_admin_id is not null and length(v_actor_admin_id) > 200 then
    raise exception 'Actor admin ID is too long.' using errcode = '22023';
  end if;
  if v_actor_name is not null and length(v_actor_name) > 200 then
    raise exception 'Actor name is too long.' using errcode = '22023';
  end if;
  if v_actor_source not in ('admin','system','unknown') then
    raise exception 'Invalid actor source.' using errcode = '23514';
  end if;
  if v_actor_name is not null and lower(v_actor_name) = 'owner' then
    raise exception 'Owner actor name is reserved.' using errcode = '23514';
  end if;
  if v_actor_source = 'system' and (v_actor_name is distinct from 'System' or v_actor_admin_id is not null) then
    raise exception 'System actor integrity violation.' using errcode = '23514';
  end if;
  if v_actor_source = 'admin' and v_actor_admin_id is null and v_actor_name is null then
    raise exception 'Admin actor requires actor admin ID OR actor name.' using errcode = '22023';
  end if;

  select * into v_order from public.orders o where o.order_ref = btrim(p_order_ref) for update;
  if not found then
    raise exception 'Order not found: %', btrim(p_order_ref) using errcode = 'P0002';
  end if;

  v_previous_status := v_order.status;
  if v_previous_status = p_to_status then
    raise exception 'Status is unchanged.' using errcode = '23514';
  end if;
  if not public.admin_v2_is_valid_status_transition(v_previous_status, p_to_status) then
    raise exception 'Invalid status transition.' using errcode = '23514';
  end if;
  if p_to_status = 'Cancelled' and v_reason is null then
    raise exception 'Cancellation reason is required.' using errcode = '22023';
  end if;
  if public.admin_v2_is_sensitive_status_transition(v_previous_status, p_to_status) and v_authorization_reason is null then
    raise exception 'Sensitive status transition authorization reason is required.' using errcode = '22023';
  end if;

  update public.orders
  set status = p_to_status,
      cancelled_reason = case when p_to_status = 'Cancelled' then v_reason else cancelled_reason end,
      updated_at = now()
  where orders.order_ref = btrim(p_order_ref)
  returning * into v_order;

  v_event_metadata := case
    when v_authorization_reason is null then v_metadata
    else v_metadata || jsonb_build_object('sensitiveAuthorizationReason', v_authorization_reason)
  end;

  insert into public.order_events(order_ref, event_type, from_status, to_status, reason, metadata, actor_admin_id, actor_name, actor_source)
  values (v_order.order_ref, public.admin_v2_order_event_type_for_status(p_to_status), v_previous_status, p_to_status, v_reason, v_event_metadata, v_actor_admin_id, v_actor_name, v_actor_source);

  return query select v_order.order_ref, v_previous_status, v_order.status, v_order.updated_at;
end;
$function$;

do $$
begin
  if not exists (
    select 1
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public'
      and p.proname = 'admin_v2_update_order_status_with_event'
      and pg_get_function_identity_arguments(p.oid) = 'p_order_ref text, p_to_status text, p_reason text, p_actor_admin_id text, p_actor_name text, p_metadata jsonb, p_actor_source text, p_sensitive_authorization_reason text'
  ) then
    raise exception 'admin_v2_update_order_status_with_event signature must match the production contract';
  end if;
end $$;

drop trigger if exists set_orders_updated_at on public.orders;
drop trigger if exists orders_set_updated_at on public.orders;
create trigger orders_set_updated_at before update on public.orders for each row execute function public.set_orders_updated_at();
drop trigger if exists order_notes_touch_updated_at on public.order_notes;
create trigger order_notes_touch_updated_at before update on public.order_notes for each row execute function public.admin_v2_touch_updated_at();

alter table public.orders enable row level security;
alter table public.order_events enable row level security;
alter table public.order_notes enable row level security;
revoke all on table public.orders from public, anon, authenticated, service_role;
revoke all on table public.order_events from public, anon, authenticated, service_role;
revoke all on table public.order_notes from public, anon, authenticated, service_role;
grant select, insert, update on table public.orders to service_role;
grant select, insert on table public.order_events to service_role;
grant select, insert on table public.order_notes to service_role;
drop policy if exists orders_service_role_all on public.orders;
create policy orders_service_role_all on public.orders for all to service_role using (true) with check (true);
drop policy if exists order_events_service_role_all on public.order_events;
create policy order_events_service_role_all on public.order_events for all to service_role using (true) with check (true);
drop policy if exists order_notes_service_role_all on public.order_notes;
create policy order_notes_service_role_all on public.order_notes for all to service_role using (true) with check (true);
revoke all on function public.admin_v2_status_rank(text) from public, anon, authenticated, service_role;
revoke all on function public.admin_v2_is_valid_status_transition(text,text) from public, anon, authenticated, service_role;
revoke all on function public.admin_v2_is_sensitive_status_transition(text,text) from public, anon, authenticated, service_role;
revoke all on function public.admin_v2_order_event_type_for_status(text) from public, anon, authenticated, service_role;
revoke all on function public.set_orders_updated_at() from public, anon, authenticated, service_role;
revoke all on function public.admin_v2_touch_updated_at() from public, anon, authenticated, service_role;
revoke all on function public.admin_v2_update_order_status_with_event(text,text,text,text,text,jsonb,text,text) from public, anon, authenticated, service_role;
grant execute on function public.admin_v2_update_order_status_with_event(text,text,text,text,text,jsonb,text,text) to service_role;
