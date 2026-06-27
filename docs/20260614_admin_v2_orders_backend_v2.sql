-- Phase 2.2 Admin V2 Orders Backend Completion - security-reviewed v2
-- Additive only. Review and run manually in Supabase SQL Editor.
-- Do not run automatically from application startup or deployment hooks.

begin;

create extension if not exists pgcrypto;

do $$
declare
  v_order_ref_duplicates integer;
  v_order_ref_nulls integer;
  v_has_order_ref_unique boolean;
  v_admin_staff_id_type text;
  v_orders_id_type text;
  v_order_ref_type text;
  v_customer_id_type text;
  v_customer_accounts_id_type text;
begin
  if to_regclass('public.orders') is null then
    raise exception 'Preflight failed: public.orders does not exist.';
  end if;

  select format_type(a.atttypid, a.atttypmod)
    into v_orders_id_type
  from pg_attribute a
  where a.attrelid = 'public.orders'::regclass
    and a.attname = 'id'
    and not a.attisdropped;

  select format_type(a.atttypid, a.atttypmod)
    into v_order_ref_type
  from pg_attribute a
  where a.attrelid = 'public.orders'::regclass
    and a.attname = 'order_ref'
    and not a.attisdropped;

  if v_orders_id_type is distinct from 'uuid' then
    raise exception 'Preflight failed: expected public.orders.id to be uuid, found %.', coalesce(v_orders_id_type, 'missing');
  end if;

  if v_order_ref_type is distinct from 'text' then
    raise exception 'Preflight failed: expected public.orders.order_ref to be text, found %.', coalesce(v_order_ref_type, 'missing');
  end if;

  if not exists (
    select 1
    from pg_constraint c
    where c.conrelid = 'public.orders'::regclass
      and c.contype = 'p'
      and c.conkey = array[
        (select attnum from pg_attribute where attrelid = 'public.orders'::regclass and attname = 'id')
      ]::smallint[]
  ) then
    raise exception 'Preflight failed: public.orders.id is not the primary key.';
  end if;

  execute $query$
    select count(*)
    from public.orders
    where order_ref is null or btrim(order_ref) = ''
  $query$
    into v_order_ref_nulls;

  if v_order_ref_nulls > 0 then
    raise exception 'Preflight failed: public.orders.order_ref contains % null/blank values. Fix manually before adding dependent tables.', v_order_ref_nulls;
  end if;

  execute '
    select count(*)
    from (
      select order_ref
      from public.orders
      group by order_ref
      having count(*) > 1
    ) duplicates'
    into v_order_ref_duplicates;

  if v_order_ref_duplicates > 0 then
    raise exception 'Preflight failed: public.orders.order_ref has % duplicate value(s). Resolve duplicates before adding a unique constraint or foreign keys.', v_order_ref_duplicates;
  end if;

  select exists (
    select 1
    from pg_constraint c
    join unnest(c.conkey) with ordinality ck(attnum, ord) on true
    join pg_attribute a on a.attrelid = c.conrelid and a.attnum = ck.attnum
    where c.conrelid = 'public.orders'::regclass
      and c.contype in ('p', 'u')
    group by c.oid
    having array_agg(a.attname order by ck.ord) = array['order_ref']
  ) into v_has_order_ref_unique;

  if not v_has_order_ref_unique then
    alter table public.orders
      add constraint orders_order_ref_unique unique (order_ref);
    raise notice 'Created public.orders(order_ref) unique constraint after duplicate preflight passed.';
  end if;

  if to_regclass('public.admin_staff') is null then
    raise notice 'public.admin_staff was not found. Actor IDs will be stored as text without a foreign key.';
  else
    select format_type(a.atttypid, a.atttypmod)
      into v_admin_staff_id_type
    from pg_attribute a
    where a.attrelid = 'public.admin_staff'::regclass
      and a.attname = 'id'
      and not a.attisdropped;
    raise notice 'Preflight observed public.admin_staff.id type: %.', coalesce(v_admin_staff_id_type, 'missing');
  end if;

  select format_type(a.atttypid, a.atttypmod)
    into v_customer_id_type
  from pg_attribute a
  where a.attrelid = 'public.orders'::regclass
    and a.attname = 'customer_id'
    and not a.attisdropped;

  if to_regclass('public.customer_accounts') is not null then
    select format_type(a.atttypid, a.atttypmod)
      into v_customer_accounts_id_type
    from pg_attribute a
    where a.attrelid = 'public.customer_accounts'::regclass
      and a.attname = 'id'
      and not a.attisdropped;
  end if;

  raise notice 'Preflight observed public.orders.customer_id type: %, public.customer_accounts.id type: %.',
    coalesce(v_customer_id_type, 'missing'),
    coalesce(v_customer_accounts_id_type, 'missing/not available');

  if not exists (
    select 1 from pg_attribute
    where attrelid = 'public.orders'::regclass and attname = 'status' and not attisdropped
  ) then
    raise exception 'Preflight failed: public.orders.status is required by the status update RPC.';
  end if;

  if not exists (
    select 1 from pg_attribute
    where attrelid = 'public.orders'::regclass and attname = 'updated_at' and not attisdropped
  ) then
    raise exception 'Preflight failed: public.orders.updated_at is required by the status update RPC.';
  end if;
end $$;

alter table public.orders
  add column if not exists delivery_status text,
  add column if not exists delivery_area text,
  add column if not exists delivery_zone text,
  add column if not exists payment_status text,
  add column if not exists payment_reference text,
  add column if not exists payment_note text,
  add column if not exists archived_at timestamptz,
  add column if not exists cancelled_reason text,
  add column if not exists customer_id text,
  add column if not exists discount_amount numeric,
  add column if not exists paid_amount numeric,
  add column if not exists due_amount numeric,
  add column if not exists refunded_amount numeric,
  add column if not exists currency_code text,
  add column if not exists payment_verified_at timestamptz;

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'orders_discount_amount_non_negative') then
    alter table public.orders add constraint orders_discount_amount_non_negative check (discount_amount is null or discount_amount >= 0) not valid;
  end if;
  if not exists (select 1 from pg_constraint where conname = 'orders_paid_amount_non_negative') then
    alter table public.orders add constraint orders_paid_amount_non_negative check (paid_amount is null or paid_amount >= 0) not valid;
  end if;
  if not exists (select 1 from pg_constraint where conname = 'orders_due_amount_non_negative') then
    alter table public.orders add constraint orders_due_amount_non_negative check (due_amount is null or due_amount >= 0) not valid;
  end if;
  if not exists (select 1 from pg_constraint where conname = 'orders_refunded_amount_non_negative') then
    alter table public.orders add constraint orders_refunded_amount_non_negative check (refunded_amount is null or refunded_amount >= 0) not valid;
  end if;
  if not exists (select 1 from pg_constraint where conname = 'orders_currency_code_format') then
    alter table public.orders add constraint orders_currency_code_format check (currency_code is null or currency_code ~ '^[A-Z]{3}$') not valid;
  end if;
  if not exists (select 1 from pg_constraint where conname = 'orders_payment_status_valid') then
    alter table public.orders add constraint orders_payment_status_valid check (payment_status is null or payment_status in ('pending', 'verified', 'failed', 'refunded')) not valid;
  end if;
  if not exists (select 1 from pg_constraint where conname = 'orders_delivery_status_valid') then
    alter table public.orders add constraint orders_delivery_status_valid check (delivery_status is null or delivery_status in ('pending', 'processing', 'packed', 'dispatched', 'in_transit', 'delivered', 'failed', 'returned')) not valid;
  end if;
end $$;

create table if not exists public.order_notes (
  id uuid primary key default gen_random_uuid(),
  order_ref text not null references public.orders(order_ref) on update cascade on delete restrict,
  note_body text not null check (length(btrim(note_body)) > 0 and length(note_body) <= 2000),
  note_type text not null default 'internal'
    check (note_type in ('internal', 'customer', 'delivery', 'payment')),
  metadata jsonb not null default '{}'::jsonb check (jsonb_typeof(metadata) = 'object'),
  created_by_admin_id text check (created_by_admin_id is null or length(btrim(created_by_admin_id)) > 0),
  created_by_name text check (created_by_name is null or (length(btrim(created_by_name)) > 0 and created_by_name <> 'Owner')),
  actor_source text not null default 'admin' check (actor_source in ('admin', 'system', 'unknown')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create table if not exists public.order_events (
  id uuid primary key default gen_random_uuid(),
  order_ref text not null references public.orders(order_ref) on update cascade on delete restrict,
  event_type text not null check (
    event_type in (
      'order_created',
      'status_changed',
      'order_confirmed',
      'cancellation_requested',
      'order_cancelled',
      'courier_assigned',
      'out_for_delivery',
      'delivered',
      'refund_initiated',
      'refunded',
      'note_added',
      'invoice_issued',
      'invoice_voided'
    )
  ),
  from_status text check (from_status is null or from_status in ('Pending', 'Confirmed', 'Shipped', 'Delivered', 'Cancelled')),
  to_status text check (to_status is null or to_status in ('Pending', 'Confirmed', 'Shipped', 'Delivered', 'Cancelled')),
  reason text,
  metadata jsonb not null default '{}'::jsonb check (jsonb_typeof(metadata) = 'object'),
  actor_admin_id text check (actor_admin_id is null or length(btrim(actor_admin_id)) > 0),
  actor_name text check (actor_name is null or (length(btrim(actor_name)) > 0 and actor_name <> 'Owner')),
  actor_source text not null default 'admin' check (actor_source in ('admin', 'system', 'unknown')),
  created_at timestamptz not null default now()
);

create table if not exists public.invoices (
  id uuid primary key default gen_random_uuid(),
  invoice_number text not null unique check (length(btrim(invoice_number)) between 8 and 80),
  order_ref text not null references public.orders(order_ref) on update cascade on delete restrict,
  status text not null default 'issued' check (status in ('issued', 'void')),
  issued_at timestamptz not null default now(),
  issued_by_admin_id text check (issued_by_admin_id is null or length(btrim(issued_by_admin_id)) > 0),
  issued_by text check (issued_by is null or (length(btrim(issued_by)) > 0 and issued_by <> 'Owner')),
  subtotal_amount numeric not null check (subtotal_amount >= 0),
  discount_amount numeric not null check (discount_amount >= 0),
  delivery_amount numeric not null check (delivery_amount >= 0),
  total_amount numeric not null check (total_amount >= 0),
  currency_code text not null check (currency_code ~ '^[A-Z]{3}$'),
  snapshot jsonb not null check (
    jsonb_typeof(snapshot) = 'object'
    and snapshot ? 'orderReference'
    and snapshot ? 'items'
    and snapshot ? 'totals'
    and snapshot ? 'customer'
    and snapshot ? 'payment'
  ),
  created_at timestamptz not null default now(),
  check (abs(total_amount - ((subtotal_amount - discount_amount) + delivery_amount)) <= 0.01)
);

create unique index if not exists invoices_one_issued_per_order_idx
  on public.invoices(order_ref)
  where status = 'issued';

create index if not exists order_notes_order_ref_created_at_idx
  on public.order_notes(order_ref, created_at desc)
  where deleted_at is null;

create index if not exists order_notes_updated_at_idx
  on public.order_notes(updated_at desc);

create index if not exists order_events_order_ref_created_at_idx
  on public.order_events(order_ref, created_at asc);

create index if not exists order_events_created_at_idx
  on public.order_events(created_at desc);

create index if not exists invoices_order_ref_idx on public.invoices(order_ref);
create index if not exists invoices_created_at_idx on public.invoices(created_at desc);

do $$
begin
  if exists (select 1 from pg_attribute where attrelid = 'public.orders'::regclass and attname = 'order_ref' and not attisdropped) then
    execute 'create index if not exists orders_order_ref_idx on public.orders(order_ref)';
  end if;
  if exists (select 1 from pg_attribute where attrelid = 'public.orders'::regclass and attname = 'status' and not attisdropped) then
    execute 'create index if not exists orders_status_idx on public.orders(status)';
  end if;
  if exists (select 1 from pg_attribute where attrelid = 'public.orders'::regclass and attname = 'payment_status' and not attisdropped) then
    execute 'create index if not exists orders_payment_status_idx on public.orders(payment_status)';
  end if;
  if exists (select 1 from pg_attribute where attrelid = 'public.orders'::regclass and attname = 'delivery_status' and not attisdropped) then
    execute 'create index if not exists orders_delivery_status_idx on public.orders(delivery_status)';
  end if;
  if exists (select 1 from pg_attribute where attrelid = 'public.orders'::regclass and attname = 'created_at' and not attisdropped) then
    execute 'create index if not exists orders_created_at_idx on public.orders(created_at desc)';
  end if;
  if exists (select 1 from pg_attribute where attrelid = 'public.orders'::regclass and attname = 'total' and not attisdropped) then
    execute 'create index if not exists orders_total_idx on public.orders(total)';
  end if;
  if exists (select 1 from pg_attribute where attrelid = 'public.orders'::regclass and attname = 'payment_method' and not attisdropped) then
    execute 'create index if not exists orders_payment_method_idx on public.orders(payment_method)';
  end if;
end $$;

create or replace function public.admin_v2_touch_updated_at()
returns trigger
language plpgsql
set search_path = pg_catalog, public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists order_notes_touch_updated_at on public.order_notes;
create trigger order_notes_touch_updated_at
before update on public.order_notes
for each row
execute function public.admin_v2_touch_updated_at();

alter table public.order_notes enable row level security;
alter table public.order_events enable row level security;
alter table public.invoices enable row level security;

revoke all on table public.order_notes from public, anon, authenticated;
revoke all on table public.order_events from public, anon, authenticated;
revoke all on table public.invoices from public, anon, authenticated;

grant select, insert, update, delete on table public.order_notes to service_role;
grant select, insert, update, delete on table public.order_events to service_role;
grant select, insert, update, delete on table public.invoices to service_role;

drop policy if exists "order_notes_service_role_all" on public.order_notes;
create policy "order_notes_service_role_all"
  on public.order_notes
  for all
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');

drop policy if exists "order_events_service_role_all" on public.order_events;
create policy "order_events_service_role_all"
  on public.order_events
  for all
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');

drop policy if exists "invoices_service_role_all" on public.invoices;
create policy "invoices_service_role_all"
  on public.invoices
  for all
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');

create or replace function public.admin_v2_order_event_type_for_status(p_status text)
returns text
language sql
stable
set search_path = pg_catalog, public
as $$
  select case p_status
    when 'Confirmed' then 'order_confirmed'
    when 'Cancelled' then 'order_cancelled'
    when 'Shipped' then 'out_for_delivery'
    when 'Delivered' then 'delivered'
    else 'status_changed'
  end
$$;

create or replace function public.admin_v2_is_valid_status_transition(
  p_from_status text,
  p_to_status text
)
returns boolean
language sql
stable
set search_path = pg_catalog, public
as $$
  select case
    when p_from_status = 'Pending' and p_to_status in ('Confirmed', 'Cancelled') then true
    when p_from_status = 'Confirmed' and p_to_status in ('Shipped', 'Pending', 'Cancelled') then true
    when p_from_status = 'Shipped' and p_to_status in ('Delivered', 'Confirmed', 'Cancelled') then true
    when p_from_status = 'Delivered' and p_to_status = 'Shipped' then true
    else false
  end
$$;

drop function if exists public.admin_v2_update_order_status_with_event(text, text, text, uuid, text, jsonb);

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
returns table (
  order_ref text,
  previous_status text,
  current_status text,
  updated_at timestamptz
)
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  v_order public.orders%rowtype;
  v_from_status text;
  v_actor_name text := nullif(btrim(p_actor_name), '');
  v_actor_admin_id text := nullif(btrim(p_actor_admin_id), '');
  v_actor_source text := coalesce(nullif(btrim(p_actor_source), ''), 'admin');
  v_reason text := nullif(btrim(p_reason), '');
  v_authorization_reason text := nullif(btrim(p_sensitive_authorization_reason), '');
  v_metadata jsonb := coalesce(p_metadata, '{}'::jsonb);
begin
  if nullif(btrim(p_order_ref), '') is null then
    raise exception 'Order reference is required.';
  end if;

  if nullif(btrim(p_to_status), '') is null then
    raise exception 'Target status is required.';
  end if;

  if p_to_status not in ('Pending', 'Confirmed', 'Shipped', 'Delivered', 'Cancelled') then
    raise exception 'Target status "%" is not valid.', p_to_status;
  end if;

  if jsonb_typeof(v_metadata) is distinct from 'object' then
    raise exception 'Metadata must be a JSON object.';
  end if;

  if v_actor_source not in ('admin', 'system', 'unknown') then
    raise exception 'Actor source "%" is not valid.', v_actor_source;
  end if;

  if v_actor_name = 'Owner' then
    raise exception 'Actor name "Owner" is not allowed. Supply a real admin identity, System, or leave actor fields null when genuinely unavailable.';
  end if;

  if v_actor_source = 'system' and v_actor_name is distinct from 'System' then
    raise exception 'System events must use actor_name = System.';
  end if;

  if v_actor_source = 'admin' and v_actor_admin_id is null and v_actor_name is null then
    raise exception 'Trusted admin actor identity is required.';
  end if;

  select * into v_order
  from public.orders o
  where o.order_ref = btrim(p_order_ref)
  for update;

  if not found then
    raise exception 'Order "%" was not found.', btrim(p_order_ref);
  end if;

  v_from_status := v_order.status;

  if v_from_status = p_to_status then
    raise exception 'Order "%" is already in status "%".', btrim(p_order_ref), p_to_status;
  end if;

  if not public.admin_v2_is_valid_status_transition(v_from_status, p_to_status) then
    raise exception 'Status transition from "%" to "%" is not valid.', v_from_status, p_to_status;
  end if;

  if p_to_status = 'Cancelled' and v_reason is null then
    raise exception 'Cancellation reason is required.';
  end if;

  if (
    (v_from_status = 'Delivered' and p_to_status <> 'Delivered')
    or (v_from_status = 'Shipped' and p_to_status = 'Pending')
  ) and v_authorization_reason is null then
    raise exception 'Sensitive status reversal requires an authorization reason.';
  end if;

  update public.orders o
  set
    status = p_to_status,
    cancelled_reason = case when p_to_status = 'Cancelled' then v_reason else o.cancelled_reason end,
    updated_at = now()
  where o.order_ref = btrim(p_order_ref)
  returning * into v_order;

  insert into public.order_events (
    order_ref,
    event_type,
    from_status,
    to_status,
    reason,
    metadata,
    actor_admin_id,
    actor_name,
    actor_source
  )
  values (
    v_order.order_ref,
    public.admin_v2_order_event_type_for_status(p_to_status),
    v_from_status,
    p_to_status,
    v_reason,
    v_metadata || jsonb_build_object('sensitiveAuthorizationReason', v_authorization_reason),
    v_actor_admin_id,
    v_actor_name,
    v_actor_source
  );

  return query
  select
    v_order.order_ref,
    v_from_status,
    v_order.status,
    v_order.updated_at;
end;
$$;

revoke execute on function public.admin_v2_touch_updated_at() from public, anon, authenticated;
revoke execute on function public.admin_v2_order_event_type_for_status(text) from public, anon, authenticated;
revoke execute on function public.admin_v2_is_valid_status_transition(text, text) from public, anon, authenticated;
revoke execute on function public.admin_v2_update_order_status_with_event(text, text, text, text, text, jsonb, text, text) from public, anon, authenticated;

grant execute on function public.admin_v2_touch_updated_at() to service_role;
grant execute on function public.admin_v2_order_event_type_for_status(text) to service_role;
grant execute on function public.admin_v2_is_valid_status_transition(text, text) to service_role;
grant execute on function public.admin_v2_update_order_status_with_event(text, text, text, text, text, jsonb, text, text) to service_role;

commit;
