-- Phase 2.2 Admin V2 Orders Backend Completion - security-reviewed v3
-- Additive only. Review and run manually in Supabase SQL Editor.
-- Do not run automatically from application startup or deployment hooks.
-- Do not run this file until the Admin V2 server code is ready for the v3 RPC
-- and database-backed invoice number generator.

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
  v_customer_accounts_id_type text;
  v_unexpected text[];
  v_col record;
  v_table regclass;
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

  for v_col in
    select *
    from (values
      ('status', 'text', true),
      ('updated_at', 'timestamp with time zone', true),
      ('customer_id', 'text', false),
      ('delivery_status', 'text', false),
      ('delivery_area', 'text', false),
      ('delivery_zone', 'text', false),
      ('payment_status', 'text', false),
      ('payment_reference', 'text', false),
      ('payment_note', 'text', false),
      ('archived_at', 'timestamp with time zone', false),
      ('cancelled_reason', 'text', false),
      ('discount_amount', 'numeric', false),
      ('paid_amount', 'numeric', false),
      ('due_amount', 'numeric', false),
      ('refunded_amount', 'numeric', false),
      ('currency_code', 'text', false),
      ('payment_verified_at', 'timestamp with time zone', false)
    ) as expected(attname, expected_type, required)
  loop
    if not exists (
      select 1
      from pg_attribute a
      where a.attrelid = 'public.orders'::regclass
        and a.attname = v_col.attname
        and not a.attisdropped
    ) then
      if v_col.required then
        raise exception 'Preflight failed: public.orders.% is required and missing.', v_col.attname;
      end if;
    elsif (
      select format_type(a.atttypid, a.atttypmod)
      from pg_attribute a
      where a.attrelid = 'public.orders'::regclass
        and a.attname = v_col.attname
        and not a.attisdropped
    ) is distinct from v_col.expected_type then
      raise exception 'Preflight failed: expected public.orders.% to be %, found %.',
        v_col.attname,
        v_col.expected_type,
        (
          select format_type(a.atttypid, a.atttypmod)
          from pg_attribute a
          where a.attrelid = 'public.orders'::regclass
            and a.attname = v_col.attname
            and not a.attisdropped
        );
    end if;
  end loop;

  execute $query$
    select array_agg(status order by status)
    from (
      select distinct status
      from public.orders
      where status is not null
        and status not in ('Pending', 'Confirmed', 'Shipped', 'Delivered', 'Cancelled')
    ) unexpected
  $query$ into v_unexpected;

  if coalesce(array_length(v_unexpected, 1), 0) > 0 then
    raise exception 'Preflight failed: public.orders.status contains unsupported value(s): %. Manually map these statuses before running this migration.', array_to_string(v_unexpected, ', ');
  end if;

  if exists (
    select 1 from pg_attribute
    where attrelid = 'public.orders'::regclass and attname = 'payment_status' and not attisdropped
  ) then
    execute $query$
      select array_agg(payment_status order by payment_status)
      from (
        select distinct payment_status
        from public.orders
        where payment_status is not null
          and payment_status not in ('pending', 'verified', 'failed', 'refunded')
      ) unexpected
    $query$ into v_unexpected;

    if coalesce(array_length(v_unexpected, 1), 0) > 0 then
      raise exception 'Preflight failed: public.orders.payment_status contains unsupported value(s): %. Manually map these statuses before running this migration.', array_to_string(v_unexpected, ', ');
    end if;
  end if;

  if exists (
    select 1 from pg_attribute
    where attrelid = 'public.orders'::regclass and attname = 'delivery_status' and not attisdropped
  ) then
    execute $query$
      select array_agg(delivery_status order by delivery_status)
      from (
        select distinct delivery_status
        from public.orders
        where delivery_status is not null
          and delivery_status not in ('pending', 'processing', 'packed', 'dispatched', 'in_transit', 'delivered', 'failed', 'returned')
      ) unexpected
    $query$ into v_unexpected;

    if coalesce(array_length(v_unexpected, 1), 0) > 0 then
      raise exception 'Preflight failed: public.orders.delivery_status contains unsupported value(s): %. Manually map these statuses before running this migration.', array_to_string(v_unexpected, ', ');
    end if;
  end if;

  execute $query$
    select count(*)
    from public.orders
    where order_ref is null or btrim(order_ref) = ''
  $query$ into v_order_ref_nulls;

  if v_order_ref_nulls > 0 then
    raise exception 'Preflight failed: public.orders.order_ref contains % null/blank values. Fix manually before adding dependent tables.', v_order_ref_nulls;
  end if;

  execute $query$
    select count(*)
    from (
      select order_ref
      from public.orders
      group by order_ref
      having count(*) > 1
    ) duplicates
  $query$ into v_order_ref_duplicates;

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

  if to_regclass('public.customer_accounts') is not null then
    select format_type(a.atttypid, a.atttypmod)
      into v_customer_accounts_id_type
    from pg_attribute a
    where a.attrelid = 'public.customer_accounts'::regclass
      and a.attname = 'id'
      and not a.attisdropped;
  end if;

  raise notice 'Preflight observed public.customer_accounts.id type: %.',
    coalesce(v_customer_accounts_id_type, 'missing/not available');

  for v_table in
    select existing_table
    from (values
      (to_regclass('public.order_notes')),
      (to_regclass('public.order_events')),
      (to_regclass('public.invoices'))
    ) as existing(existing_table)
    where existing_table is not null
  loop
    if not exists (
      select 1 from pg_constraint c
      where c.conrelid = v_table and c.contype = 'p'
    ) then
      raise exception 'Preflight failed: existing table % has no primary key. Review the previous partial migration before running v3.', v_table;
    end if;
  end loop;

  if to_regclass('public.order_notes') is not null then
    for v_col in
      select *
      from (values
        ('id', 'uuid'),
        ('order_ref', 'text'),
        ('note_body', 'text'),
        ('note_type', 'text'),
        ('metadata', 'jsonb'),
        ('created_by_admin_id', 'text'),
        ('created_by_name', 'text'),
        ('actor_source', 'text'),
        ('created_at', 'timestamp with time zone'),
        ('updated_at', 'timestamp with time zone'),
        ('deleted_at', 'timestamp with time zone')
      ) as expected(attname, expected_type)
    loop
      if not exists (
        select 1
        from pg_attribute a
        where a.attrelid = 'public.order_notes'::regclass
          and a.attname = v_col.attname
          and not a.attisdropped
          and format_type(a.atttypid, a.atttypmod) = v_col.expected_type
      ) then
        raise exception 'Preflight failed: existing public.order_notes.% is missing or not %. Review the previous partial migration before running v3.', v_col.attname, v_col.expected_type;
      end if;
    end loop;

    if not exists (
      select 1
      from pg_constraint c
      where c.conrelid = 'public.order_notes'::regclass
        and c.contype = 'f'
        and c.confrelid = 'public.orders'::regclass
        and c.conkey = array[(select attnum from pg_attribute where attrelid = 'public.order_notes'::regclass and attname = 'order_ref')]::smallint[]
        and c.confkey = array[(select attnum from pg_attribute where attrelid = 'public.orders'::regclass and attname = 'order_ref')]::smallint[]
    ) then
      raise exception 'Preflight failed: existing public.order_notes.order_ref does not reference public.orders(order_ref). Review the previous partial migration before running v3.';
    end if;
  end if;

  if to_regclass('public.order_events') is not null then
    for v_col in
      select *
      from (values
        ('id', 'uuid'),
        ('order_ref', 'text'),
        ('event_type', 'text'),
        ('from_status', 'text'),
        ('to_status', 'text'),
        ('reason', 'text'),
        ('metadata', 'jsonb'),
        ('actor_admin_id', 'text'),
        ('actor_name', 'text'),
        ('actor_source', 'text'),
        ('created_at', 'timestamp with time zone')
      ) as expected(attname, expected_type)
    loop
      if not exists (
        select 1
        from pg_attribute a
        where a.attrelid = 'public.order_events'::regclass
          and a.attname = v_col.attname
          and not a.attisdropped
          and format_type(a.atttypid, a.atttypmod) = v_col.expected_type
      ) then
        raise exception 'Preflight failed: existing public.order_events.% is missing or not %. Review the previous partial migration before running v3.', v_col.attname, v_col.expected_type;
      end if;
    end loop;

    if not exists (
      select 1
      from pg_constraint c
      where c.conrelid = 'public.order_events'::regclass
        and c.contype = 'f'
        and c.confrelid = 'public.orders'::regclass
        and c.conkey = array[(select attnum from pg_attribute where attrelid = 'public.order_events'::regclass and attname = 'order_ref')]::smallint[]
        and c.confkey = array[(select attnum from pg_attribute where attrelid = 'public.orders'::regclass and attname = 'order_ref')]::smallint[]
    ) then
      raise exception 'Preflight failed: existing public.order_events.order_ref does not reference public.orders(order_ref). Review the previous partial migration before running v3.';
    end if;
  end if;

  if to_regclass('public.invoices') is not null then
    for v_col in
      select *
      from (values
        ('id', 'uuid'),
        ('invoice_number', 'text'),
        ('order_ref', 'text'),
        ('status', 'text'),
        ('issued_at', 'timestamp with time zone'),
        ('issued_by_admin_id', 'text'),
        ('issued_by', 'text'),
        ('subtotal_amount', 'numeric'),
        ('discount_amount', 'numeric'),
        ('delivery_amount', 'numeric'),
        ('total_amount', 'numeric'),
        ('currency_code', 'text'),
        ('snapshot', 'jsonb'),
        ('created_at', 'timestamp with time zone')
      ) as expected(attname, expected_type)
    loop
      if not exists (
        select 1
        from pg_attribute a
        where a.attrelid = 'public.invoices'::regclass
          and a.attname = v_col.attname
          and not a.attisdropped
          and format_type(a.atttypid, a.atttypmod) = v_col.expected_type
      ) then
        raise exception 'Preflight failed: existing public.invoices.% is missing or not %. Review the previous partial migration before running v3.', v_col.attname, v_col.expected_type;
      end if;
    end loop;

    if exists (
      select 1
      from pg_attribute a
      where a.attrelid = 'public.invoices'::regclass
        and a.attname = 'actor_source'
        and not a.attisdropped
    ) and not exists (
      select 1
      from pg_attribute a
      where a.attrelid = 'public.invoices'::regclass
        and a.attname = 'actor_source'
        and not a.attisdropped
        and format_type(a.atttypid, a.atttypmod) = 'text'
    ) then
      raise exception 'Preflight failed: existing public.invoices.actor_source is not text. Review the previous partial migration before running v3.';
    end if;

    if not exists (
      select 1
      from pg_constraint c
      where c.conrelid = 'public.invoices'::regclass
        and c.contype = 'f'
        and c.confrelid = 'public.orders'::regclass
        and c.conkey = array[(select attnum from pg_attribute where attrelid = 'public.invoices'::regclass and attname = 'order_ref')]::smallint[]
        and c.confkey = array[(select attnum from pg_attribute where attrelid = 'public.orders'::regclass and attname = 'order_ref')]::smallint[]
    ) then
      raise exception 'Preflight failed: existing public.invoices.order_ref does not reference public.orders(order_ref). Review the previous partial migration before running v3.';
    end if;

    if not exists (
      select 1
      from pg_constraint c
      join unnest(c.conkey) with ordinality ck(attnum, ord) on true
      join pg_attribute a on a.attrelid = c.conrelid and a.attnum = ck.attnum
      where c.conrelid = 'public.invoices'::regclass
        and c.contype in ('p', 'u')
      group by c.oid
      having array_agg(a.attname order by ck.ord) = array['invoice_number']
    ) then
      raise exception 'Preflight failed: existing public.invoices.invoice_number is not unique. Review the previous partial migration before running v3.';
    end if;
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
  if not exists (select 1 from pg_constraint where conname = 'orders_payment_note_length') then
    alter table public.orders add constraint orders_payment_note_length check (payment_note is null or length(btrim(payment_note)) between 1 and 2000) not valid;
  end if;
  if not exists (select 1 from pg_constraint where conname = 'orders_cancelled_reason_length') then
    alter table public.orders add constraint orders_cancelled_reason_length check (cancelled_reason is null or length(btrim(cancelled_reason)) between 1 and 2000) not valid;
  end if;
end $$;

create table if not exists public.order_notes (
  id uuid primary key default gen_random_uuid(),
  order_ref text not null references public.orders(order_ref) on update cascade on delete restrict,
  note_body text not null check (length(btrim(note_body)) between 1 and 2000),
  note_type text not null default 'internal'
    check (note_type in ('internal', 'customer', 'delivery', 'payment')),
  metadata jsonb not null default '{}'::jsonb check (jsonb_typeof(metadata) = 'object' and length(metadata::text) <= 32768),
  created_by_admin_id text check (created_by_admin_id is null or length(btrim(created_by_admin_id)) between 1 and 200),
  created_by_name text check (created_by_name is null or (length(btrim(created_by_name)) between 1 and 200 and lower(btrim(created_by_name)) <> 'owner')),
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
  reason text check (reason is null or length(btrim(reason)) between 1 and 2000),
  metadata jsonb not null default '{}'::jsonb check (jsonb_typeof(metadata) = 'object' and length(metadata::text) <= 32768),
  actor_admin_id text check (actor_admin_id is null or length(btrim(actor_admin_id)) between 1 and 200),
  actor_name text check (actor_name is null or (length(btrim(actor_name)) between 1 and 200 and lower(btrim(actor_name)) <> 'owner')),
  actor_source text not null default 'admin' check (actor_source in ('admin', 'system', 'unknown')),
  created_at timestamptz not null default now()
);

create table if not exists public.invoices (
  id uuid primary key default gen_random_uuid(),
  invoice_number text not null unique check (length(btrim(invoice_number)) between 8 and 80),
  order_ref text not null references public.orders(order_ref) on update cascade on delete restrict,
  status text not null default 'issued' check (status in ('issued', 'void')),
  issued_at timestamptz not null default now(),
  issued_by_admin_id text check (issued_by_admin_id is null or length(btrim(issued_by_admin_id)) between 1 and 200),
  issued_by text check (issued_by is null or (length(btrim(issued_by)) between 1 and 200 and lower(btrim(issued_by)) <> 'owner')),
  actor_source text not null default 'admin' check (actor_source in ('admin', 'system')),
  subtotal_amount numeric not null check (subtotal_amount >= 0),
  discount_amount numeric not null check (discount_amount >= 0),
  delivery_amount numeric not null check (delivery_amount >= 0),
  total_amount numeric not null check (total_amount >= 0),
  currency_code text not null check (currency_code ~ '^[A-Z]{3}$'),
  snapshot jsonb not null check (
    jsonb_typeof(snapshot) = 'object'
    and length(snapshot::text) <= 32768
    and snapshot ? 'orderReference'
    and snapshot ? 'items'
    and snapshot ? 'totals'
    and snapshot ? 'customer'
    and snapshot ? 'payment'
  ),
  created_at timestamptz not null default now(),
  check (abs(total_amount - ((subtotal_amount - discount_amount) + delivery_amount)) <= 0.01)
);

alter table public.invoices
  add column if not exists actor_source text;

alter table public.invoices
  alter column actor_source set default 'admin';

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'order_notes_actor_integrity') then
    alter table public.order_notes add constraint order_notes_actor_integrity check (
      (
        actor_source = 'admin'
        and (nullif(btrim(created_by_admin_id), '') is not null or nullif(btrim(created_by_name), '') is not null)
        and (created_by_name is null or lower(btrim(created_by_name)) <> 'owner')
      )
      or (
        actor_source = 'system'
        and created_by_name = 'System'
        and created_by_admin_id is null
      )
      or (
        actor_source = 'unknown'
        and (created_by_name is null or lower(btrim(created_by_name)) <> 'owner')
      )
    ) not valid;
  end if;

  if not exists (select 1 from pg_constraint where conname = 'order_events_actor_integrity') then
    alter table public.order_events add constraint order_events_actor_integrity check (
      (
        actor_source = 'admin'
        and (nullif(btrim(actor_admin_id), '') is not null or nullif(btrim(actor_name), '') is not null)
        and (actor_name is null or lower(btrim(actor_name)) <> 'owner')
      )
      or (
        actor_source = 'system'
        and actor_name = 'System'
        and actor_admin_id is null
      )
      or (
        actor_source = 'unknown'
        and (actor_name is null or lower(btrim(actor_name)) <> 'owner')
      )
    ) not valid;
  end if;

  if not exists (select 1 from pg_constraint where conname = 'invoices_actor_source_valid') then
    alter table public.invoices add constraint invoices_actor_source_valid check (actor_source is not null and actor_source in ('admin', 'system')) not valid;
  end if;

  if not exists (select 1 from pg_constraint where conname = 'invoices_issuer_integrity') then
    alter table public.invoices add constraint invoices_issuer_integrity check (
      status <> 'issued'
      or (
        actor_source = 'admin'
        and (nullif(btrim(issued_by_admin_id), '') is not null or nullif(btrim(issued_by), '') is not null)
        and (issued_by is null or lower(btrim(issued_by)) <> 'owner')
      )
      or (
        actor_source = 'system'
        and issued_by = 'System'
        and issued_by_admin_id is null
      )
    ) not valid;
  end if;

  if not exists (select 1 from pg_constraint where conname = 'invoices_snapshot_size') then
    alter table public.invoices add constraint invoices_snapshot_size check (length(snapshot::text) <= 32768) not valid;
  end if;
end $$;

create unique index if not exists invoices_one_issued_per_order_idx
  on public.invoices(order_ref)
  where status = 'issued';

create sequence if not exists public.admin_v2_invoice_number_seq;

create or replace function public.admin_v2_next_invoice_number(
  p_order_ref text,
  p_issued_at timestamptz default now()
)
returns text
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  v_order_ref text := nullif(btrim(p_order_ref), '');
  v_issued_at timestamptz := coalesce(p_issued_at, now());
begin
  if v_order_ref is null then
    raise exception 'Order reference is required for invoice numbering.';
  end if;

  return 'AEV-INV-'
    || to_char(v_issued_at at time zone 'UTC', 'YYYYMMDD')
    || '-'
    || lpad(nextval('public.admin_v2_invoice_number_seq')::text, 6, '0');
end;
$$;

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
revoke all on sequence public.admin_v2_invoice_number_seq from public, anon, authenticated;

grant select, insert, update, delete on table public.order_notes to service_role;
grant select, insert, update, delete on table public.order_events to service_role;
grant select, insert, update, delete on table public.invoices to service_role;
grant usage, select on sequence public.admin_v2_invoice_number_seq to service_role;

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

create or replace function public.admin_v2_status_rank(p_status text)
returns integer
language sql
immutable
set search_path = pg_catalog, public
as $$
  select case p_status
    when 'Pending' then 1
    when 'Confirmed' then 2
    when 'Shipped' then 3
    when 'Delivered' then 4
    when 'Cancelled' then 5
    else null
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
    when p_from_status is null or p_to_status is null then false
    when p_from_status = p_to_status then false
    when p_from_status = 'Cancelled' then false
    when p_from_status = 'Pending' and p_to_status in ('Confirmed', 'Cancelled') then true
    when p_from_status = 'Confirmed' and p_to_status in ('Shipped', 'Pending', 'Cancelled') then true
    when p_from_status = 'Shipped' and p_to_status in ('Delivered', 'Confirmed', 'Pending', 'Cancelled') then true
    when p_from_status = 'Delivered' and p_to_status = 'Shipped' then true
    else false
  end
$$;

create or replace function public.admin_v2_is_sensitive_status_transition(
  p_from_status text,
  p_to_status text
)
returns boolean
language sql
stable
set search_path = pg_catalog, public
as $$
  select case
    when not public.admin_v2_is_valid_status_transition(p_from_status, p_to_status) then false
    when p_to_status = 'Cancelled' then true
    when public.admin_v2_status_rank(p_to_status) < public.admin_v2_status_rank(p_from_status) then true
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

  if length(v_metadata::text) > 32768 then
    raise exception 'Metadata must be 32 KB or less.';
  end if;

  if v_reason is not null and length(v_reason) > 2000 then
    raise exception 'Reason must be 2000 characters or fewer.';
  end if;

  if v_authorization_reason is not null and length(v_authorization_reason) > 2000 then
    raise exception 'Authorization reason must be 2000 characters or fewer.';
  end if;

  if v_actor_admin_id is not null and length(v_actor_admin_id) > 200 then
    raise exception 'Actor admin ID must be 200 characters or fewer.';
  end if;

  if v_actor_name is not null and length(v_actor_name) > 200 then
    raise exception 'Actor name must be 200 characters or fewer.';
  end if;

  if v_actor_source not in ('admin', 'system', 'unknown') then
    raise exception 'Actor source "%" is not valid.', v_actor_source;
  end if;

  if v_actor_name is not null and lower(btrim(v_actor_name)) = 'owner' then
    raise exception 'Actor name "Owner" is not allowed. Supply a real admin identity, System, or leave actor fields null when genuinely unavailable.';
  end if;

  if v_actor_source = 'system' and (v_actor_name is distinct from 'System' or v_actor_admin_id is not null) then
    raise exception 'System events must use actor_name = System and must not supply a fake admin ID.';
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

  if public.admin_v2_is_sensitive_status_transition(v_from_status, p_to_status) and v_authorization_reason is null then
    raise exception 'Sensitive status reversal or cancellation requires an authorization reason.';
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
    case
      when v_authorization_reason is null then v_metadata
      else v_metadata || jsonb_build_object('sensitiveAuthorizationReason', v_authorization_reason)
    end,
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

do $$
declare
  v_function record;
  v_current_argtypes text := '25 25 25 25 25 3802 25 25';
begin
  for v_function in
    select p.oid, pg_get_function_identity_arguments(p.oid) as args, p.proargtypes::text as argtypes
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public'
      and p.proname = 'admin_v2_update_order_status_with_event'
  loop
    execute format('revoke execute on function %s from public, anon, authenticated', v_function.oid::regprocedure);

    if v_function.argtypes <> v_current_argtypes then
      execute format('drop function %s', v_function.oid::regprocedure);
      raise notice 'Dropped obsolete admin_v2_update_order_status_with_event overload with arguments: %.', v_function.args;
    end if;
  end loop;
end $$;

revoke execute on function public.admin_v2_touch_updated_at() from public, anon, authenticated;
revoke execute on function public.admin_v2_order_event_type_for_status(text) from public, anon, authenticated;
revoke execute on function public.admin_v2_status_rank(text) from public, anon, authenticated;
revoke execute on function public.admin_v2_is_valid_status_transition(text, text) from public, anon, authenticated;
revoke execute on function public.admin_v2_is_sensitive_status_transition(text, text) from public, anon, authenticated;
revoke execute on function public.admin_v2_next_invoice_number(text, timestamptz) from public, anon, authenticated;
revoke execute on function public.admin_v2_update_order_status_with_event(text, text, text, text, text, jsonb, text, text) from public, anon, authenticated;

grant execute on function public.admin_v2_touch_updated_at() to service_role;
grant execute on function public.admin_v2_order_event_type_for_status(text) to service_role;
grant execute on function public.admin_v2_status_rank(text) to service_role;
grant execute on function public.admin_v2_is_valid_status_transition(text, text) to service_role;
grant execute on function public.admin_v2_is_sensitive_status_transition(text, text) to service_role;
grant execute on function public.admin_v2_next_invoice_number(text, timestamptz) to service_role;
grant execute on function public.admin_v2_update_order_status_with_event(text, text, text, text, text, jsonb, text, text) to service_role;

commit;
