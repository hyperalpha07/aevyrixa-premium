-- Admin V2 order delivery/payment atomicity hardening.
--
-- Additive production migration. Do not apply without normal release review.
--
-- Purpose:
-- - Preserve the existing admin_v2_update_order_status_with_event RPC contract.
-- - Add a non-overloaded RPC for atomic order status + delivery status +
--   order event + optional COD collection decision.
-- - Harden admin_v2_record_payment so stored-total mismatches are checked while
--   the target order row is locked, before any finance ledger insert.
-- - Track COD courier collection and merchant settlement without ever treating
--   courier-held money as merchant-received payment.

create table if not exists public.order_cod_collections (
  id uuid primary key default gen_random_uuid(),
  order_ref text not null references public.orders(order_ref) on update cascade on delete restrict,
  order_status text not null check (order_status in ('Pending','Confirmed','Shipped','Delivered','Cancelled')),
  delivery_status text null check (delivery_status is null or delivery_status in ('pending','processing','packed','dispatched','in_transit','delivered','failed','returned')),
  collection_status text not null check (collection_status in ('courier_collected_unsettled','merchant_received_verified','no_payment_received')),
  amount numeric(14,2) null check (amount is null or amount >= 0),
  currency_code text not null default 'BDT' check (currency_code ~ '^[A-Z]{3}$'),
  note text null check (note is null or length(btrim(note)) between 1 and 2000),
  settled_collection_id uuid null,
  finance_payment_transaction_id uuid null,
  settled_at timestamptz null,
  reversed_at timestamptz null,
  reversed_by_type text null check (reversed_by_type is null or reversed_by_type in ('owner','staff','system')),
  reversed_by_id text null check (reversed_by_id is null or length(btrim(reversed_by_id)) between 1 and 200),
  reversed_by_name text null check (reversed_by_name is null or length(btrim(reversed_by_name)) between 1 and 120),
  recorded_by_type text not null check (recorded_by_type in ('owner','staff','system')),
  recorded_by_id text not null check (length(btrim(recorded_by_id)) between 1 and 200),
  recorded_by_name text not null check (length(btrim(recorded_by_name)) between 1 and 120),
  created_at timestamptz not null default now(),
  constraint order_cod_collection_shape check (
    (collection_status = 'no_payment_received' and amount is null and finance_payment_transaction_id is null and settled_collection_id is null and settled_at is null)
    or
    (collection_status = 'courier_collected_unsettled' and amount is not null and finance_payment_transaction_id is null and settled_collection_id is null)
    or
    (collection_status = 'merchant_received_verified' and amount is not null and finance_payment_transaction_id is not null and settled_at is not null)
  )
);

alter table public.order_cod_collections add column if not exists settled_collection_id uuid null;
alter table public.order_cod_collections add column if not exists finance_payment_transaction_id uuid null;
alter table public.order_cod_collections add column if not exists settled_at timestamptz null;
alter table public.order_cod_collections add column if not exists reversed_at timestamptz null;
alter table public.order_cod_collections add column if not exists reversed_by_type text null;
alter table public.order_cod_collections add column if not exists reversed_by_id text null;
alter table public.order_cod_collections add column if not exists reversed_by_name text null;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.order_cod_collections'::regclass
      and conname = 'order_cod_collections_settled_collection_fkey'
  ) then
    alter table public.order_cod_collections
      add constraint order_cod_collections_settled_collection_fkey
      foreign key (settled_collection_id)
      references public.order_cod_collections(id)
      on update cascade
      on delete restrict;
  end if;

  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.order_cod_collections'::regclass
      and conname = 'order_cod_collections_finance_payment_fkey'
  ) then
    alter table public.order_cod_collections
      add constraint order_cod_collections_finance_payment_fkey
      foreign key (finance_payment_transaction_id)
      references public.finance_payment_transactions(id)
      on update cascade
      on delete restrict;
  end if;

  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.order_cod_collections'::regclass
      and conname = 'order_cod_collection_shape'
  ) then
    alter table public.order_cod_collections
      add constraint order_cod_collection_shape check (
        (collection_status = 'no_payment_received' and amount is null and finance_payment_transaction_id is null and settled_collection_id is null and settled_at is null)
        or
        (collection_status = 'courier_collected_unsettled' and amount is not null and finance_payment_transaction_id is null and settled_collection_id is null)
        or
        (collection_status = 'merchant_received_verified' and amount is not null and finance_payment_transaction_id is not null and settled_at is not null)
      );
  end if;
end $$;

create index if not exists order_cod_collections_order_ref_created_at_idx
  on public.order_cod_collections(order_ref, created_at desc);
create index if not exists order_cod_collections_status_idx
  on public.order_cod_collections(collection_status, created_at desc);
create unique index if not exists order_cod_collections_one_open_courier_idx
  on public.order_cod_collections(order_ref)
  where collection_status = 'courier_collected_unsettled' and settled_at is null;
create unique index if not exists order_cod_collections_one_payment_receipt_idx
  on public.order_cod_collections(finance_payment_transaction_id)
  where collection_status = 'merchant_received_verified' and finance_payment_transaction_id is not null and reversed_at is null;

alter table public.order_cod_collections enable row level security;
revoke all on table public.order_cod_collections from public, anon, authenticated, service_role;
grant select, insert, update on table public.order_cod_collections to service_role;

drop policy if exists order_cod_collections_service_role_all on public.order_cod_collections;
create policy order_cod_collections_service_role_all
  on public.order_cod_collections
  for all
  to service_role
  using (true)
  with check (true);

drop function if exists public.admin_v2_update_order_status_delivery_with_event(text,text,text,text,text,jsonb,text,text,text,text,numeric,text);

create or replace function public.admin_v2_update_order_status_delivery_with_event(
  p_order_ref text,
  p_to_status text,
  p_reason text default null,
  p_actor_admin_id text default null,
  p_actor_name text default null,
  p_metadata jsonb default '{}'::jsonb,
  p_actor_source text default 'admin',
  p_sensitive_authorization_reason text default null,
  p_delivery_status text default null,
  p_cod_collection_status text default null,
  p_cod_amount numeric default null,
  p_cod_note text default null,
  p_cod_payment_transaction_id uuid default null
)
returns setof public.orders
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_order public.orders%rowtype;
  v_previous_status text;
  v_previous_delivery_status text;
  v_actor_name text := nullif(btrim(coalesce(p_actor_name, '')), '');
  v_actor_admin_id text := nullif(btrim(coalesce(p_actor_admin_id, '')), '');
  v_actor_source text := coalesce(nullif(btrim(coalesce(p_actor_source, '')), ''), 'admin');
  v_actor_type text;
  v_actor_id text;
  v_audit_staff_id uuid;
  v_reason text := nullif(btrim(coalesce(p_reason, '')), '');
  v_authorization_reason text := nullif(btrim(coalesce(p_sensitive_authorization_reason, '')), '');
  v_delivery_status text := nullif(btrim(coalesce(p_delivery_status, '')), '');
  v_effective_delivery_status text;
  v_cod_collection_status text := nullif(btrim(coalesce(p_cod_collection_status, '')), '');
  v_cod_note text := nullif(btrim(coalesce(p_cod_note, '')), '');
  v_metadata jsonb := coalesce(p_metadata, '{}'::jsonb);
  v_event_metadata jsonb;
  v_currency_code text;
  v_payment_total numeric(14,2);
  v_payment_row public.finance_payment_transactions%rowtype;
  v_open_courier_collection public.order_cod_collections%rowtype;
  v_settled_amount numeric(14,2);
  v_remaining_courier_amount numeric(14,2);
  v_settlement_amount numeric(14,2);
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
  if v_delivery_status is not null and v_delivery_status not in ('pending','processing','packed','dispatched','in_transit','delivered','failed','returned') then
    raise exception 'Invalid delivery status.' using errcode = '23514';
  end if;
  if v_cod_collection_status is not null and v_cod_collection_status not in ('courier_collected_unsettled','merchant_received_verified','no_payment_received') then
    raise exception 'Invalid COD collection status.' using errcode = '23514';
  end if;
  if p_cod_amount is not null and p_cod_amount < 0 then
    raise exception 'COD amount must not be negative.' using errcode = '23514';
  end if;
  if p_cod_amount is not null and p_cod_amount::numeric is distinct from round(p_cod_amount::numeric, 2) then
    raise exception 'COD amount must use exact two-decimal precision.' using errcode = '23514';
  end if;
  if v_cod_note is not null and length(v_cod_note) > 2000 then
    raise exception 'COD note is too long.' using errcode = '22023';
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

  v_actor_type := case
    when v_actor_source = 'system' then 'system'
    when v_actor_admin_id is null or v_actor_admin_id like 'owner:%' then 'owner'
    else 'staff'
  end;
  v_actor_id := case when v_actor_source = 'system' then 'system' else coalesce(v_actor_admin_id, v_actor_name) end;
  if v_actor_id is null then
    raise exception 'Actor identity is required.' using errcode = '22023';
  end if;
  if v_actor_type = 'staff' and v_actor_admin_id ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$' then
    v_audit_staff_id := v_actor_admin_id::uuid;
  end if;

  select * into v_order
    from public.orders o
   where o.order_ref = btrim(p_order_ref)
   for update;
  if not found then
    raise exception 'Order not found: %', btrim(p_order_ref) using errcode = 'P0002';
  end if;

  v_previous_status := v_order.status;
  v_previous_delivery_status := v_order.delivery_status;
  v_effective_delivery_status := coalesce(v_delivery_status, v_order.delivery_status);
  v_currency_code := coalesce(v_order.currency_code, 'BDT');

  if v_previous_status = p_to_status and v_delivery_status is null and v_cod_collection_status is null then
    raise exception 'Status is unchanged.' using errcode = '23514';
  end if;
  if v_previous_status <> p_to_status and not public.admin_v2_is_valid_status_transition(v_previous_status, p_to_status) then
    raise exception 'Invalid status transition.' using errcode = '23514';
  end if;
  if p_to_status = 'Cancelled' and v_reason is null then
    raise exception 'Cancellation reason is required.' using errcode = '22023';
  end if;
  if public.admin_v2_is_sensitive_status_transition(v_previous_status, p_to_status) and v_authorization_reason is null then
    raise exception 'Sensitive status transition authorization reason is required.' using errcode = '22023';
  end if;

  if p_to_status = 'Pending' and v_effective_delivery_status is not null and v_effective_delivery_status <> 'pending' then
    raise exception 'Pending orders can only have pending delivery status.' using errcode = '23514';
  end if;
  if p_to_status = 'Confirmed' and v_effective_delivery_status is not null and v_effective_delivery_status not in ('pending','processing','packed') then
    raise exception 'Confirmed orders require pending, processing, or packed delivery status.' using errcode = '23514';
  end if;
  if p_to_status = 'Shipped' and v_effective_delivery_status is distinct from 'dispatched' and v_effective_delivery_status is distinct from 'in_transit' then
    raise exception 'Shipped orders require dispatched or in-transit delivery status.' using errcode = '23514';
  end if;
  if p_to_status = 'Delivered' and v_effective_delivery_status is distinct from 'delivered' then
    raise exception 'Delivered orders require delivered delivery status.' using errcode = '23514';
  end if;
  if p_to_status = 'Cancelled' and v_effective_delivery_status is not distinct from 'delivered' then
    raise exception 'Cancelled orders cannot have delivered delivery status.' using errcode = '23514';
  end if;

  if v_cod_collection_status is not null then
    if v_order.payment_method is distinct from 'Cash on Delivery' then
      raise exception 'COD collection decisions require a Cash on Delivery order.' using errcode = '23514';
    end if;
    if p_to_status <> 'Delivered' or v_effective_delivery_status is distinct from 'delivered' then
      raise exception 'COD collection decision requires Delivered order and delivered delivery status.' using errcode = '23514';
    end if;
    if v_cod_collection_status = 'no_payment_received' and v_reason is null then
      raise exception 'No-payment COD delivery requires a follow-up reason.' using errcode = '22023';
    end if;
    if v_cod_collection_status = 'courier_collected_unsettled' and p_cod_amount is null then
      raise exception 'Courier-collected COD requires the courier-held amount.' using errcode = '22023';
    end if;

    if v_cod_collection_status = 'merchant_received_verified' then
      if p_cod_payment_transaction_id is null then
        raise exception 'Merchant COD settlement requires an explicit finance payment transaction.' using errcode = '22023';
      end if;

      select coalesce(sum(amount), 0)::numeric(14,2)
        into v_payment_total
        from public.finance_payment_transactions
       where order_ref = v_order.order_ref and status = 'recorded';

      if v_payment_total <= 0 then
        raise exception 'Merchant-received COD requires an actual recorded finance payment.' using errcode = '23514';
      end if;

      select * into v_payment_row
        from public.finance_payment_transactions
       where id = p_cod_payment_transaction_id
         and order_ref = v_order.order_ref
         and status = 'recorded'
       for update;
      if not found then
        raise exception 'Selected COD settlement payment transaction was not found for this order.' using errcode = 'P0002';
      end if;

      v_settlement_amount := coalesce(p_cod_amount, v_payment_row.amount)::numeric(14,2);
      if p_cod_amount is not null and p_cod_amount::numeric(14,2) is distinct from v_payment_row.amount then
        raise exception 'Merchant COD settlement amount must match the finance payment transaction amount.' using errcode = '23514';
      end if;

      select * into v_open_courier_collection
        from public.order_cod_collections
       where order_ref = v_order.order_ref
         and collection_status = 'courier_collected_unsettled'
         and settled_at is null
       order by created_at desc, id desc
       limit 1
       for update;

      if found then
        select coalesce(sum(amount), 0)::numeric(14,2)
          into v_settled_amount
          from public.order_cod_collections
         where settled_collection_id = v_open_courier_collection.id
           and collection_status = 'merchant_received_verified'
           and reversed_at is null;

        v_remaining_courier_amount := greatest(v_open_courier_collection.amount - v_settled_amount, 0)::numeric(14,2);
        if v_settlement_amount > v_remaining_courier_amount then
          raise exception 'Merchant COD settlement exceeds remaining courier-held amount.' using errcode = '23514';
        end if;
      end if;
    end if;
  end if;

  update public.orders
     set status = p_to_status,
         delivery_status = coalesce(v_delivery_status, delivery_status),
         cancelled_reason = case when p_to_status = 'Cancelled' then v_reason else cancelled_reason end,
         updated_at = now()
   where orders.order_ref = btrim(p_order_ref)
   returning * into v_order;

  v_event_metadata := v_metadata
    || jsonb_build_object(
      'deliveryStatusFrom', v_previous_delivery_status,
      'deliveryStatusTo', v_delivery_status,
      'codCollectionStatus', v_cod_collection_status
    );

  if v_authorization_reason is not null then
    v_event_metadata := v_event_metadata || jsonb_build_object('sensitiveAuthorizationReason', v_authorization_reason);
  end if;

  insert into public.order_events(order_ref, event_type, from_status, to_status, reason, metadata, actor_admin_id, actor_name, actor_source)
  values (v_order.order_ref, public.admin_v2_order_event_type_for_status(p_to_status), v_previous_status, p_to_status, v_reason, v_event_metadata, v_actor_admin_id, v_actor_name, v_actor_source);

  if v_cod_collection_status is not null then
    insert into public.order_cod_collections(
      order_ref,
      order_status,
      delivery_status,
      collection_status,
      amount,
      currency_code,
      note,
      settled_collection_id,
      finance_payment_transaction_id,
      settled_at,
      recorded_by_type,
      recorded_by_id,
      recorded_by_name
    )
    values (
      v_order.order_ref,
      v_order.status,
      v_order.delivery_status,
      v_cod_collection_status,
      case when v_cod_collection_status = 'no_payment_received' then null when v_cod_collection_status = 'merchant_received_verified' then v_settlement_amount else p_cod_amount::numeric(14,2) end,
      v_currency_code,
      coalesce(v_cod_note, v_reason),
      case when v_cod_collection_status = 'merchant_received_verified' and v_open_courier_collection.id is not null then v_open_courier_collection.id else null end,
      case when v_cod_collection_status = 'merchant_received_verified' then v_payment_row.id else null end,
      case when v_cod_collection_status = 'merchant_received_verified' then now() else null end,
      v_actor_type,
      v_actor_id,
      coalesce(v_actor_name, 'System')
    );

    if v_cod_collection_status = 'merchant_received_verified'
       and v_open_courier_collection.id is not null
       and v_remaining_courier_amount - v_settlement_amount <= 0 then
      update public.order_cod_collections
         set settled_at = now()
       where id = v_open_courier_collection.id;
    end if;

    insert into public.admin_staff_activity_logs(staff_id, actor_type, actor_id, actor_name, action, target_type, target_id, metadata)
    values (
      v_audit_staff_id,
      v_actor_type,
      v_actor_id,
      coalesce(v_actor_name, 'System'),
      'order.cod_collection.recorded',
      'order',
      v_order.order_ref,
      jsonb_build_object(
        'order_ref', v_order.order_ref,
        'collection_status', v_cod_collection_status,
        'amount', p_cod_amount,
        'currency_code', v_currency_code,
        'settled_collection_id', case when v_open_courier_collection.id is not null then v_open_courier_collection.id else null end,
        'finance_payment_transaction_id', case when v_payment_row.id is not null then v_payment_row.id else null end
      )
    );
  end if;

  return query select * from public.orders where order_ref = v_order.order_ref;
end;
$$;

create or replace function public.admin_v2_record_payment(
  p_order_ref text,
  p_amount numeric,
  p_currency_code text,
  p_payment_method text,
  p_external_reference text,
  p_note text,
  p_occurred_at timestamptz,
  p_request_key uuid,
  p_actor_type text,
  p_actor_id text,
  p_actor_name text
) returns public.finance_payment_transactions
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_order record;
  v_order_currency text;
  v_payable numeric(14,2);
  v_stored_total numeric(14,2);
  v_paid numeric(14,2);
  v_audit_staff_id uuid;
  v_open_courier_collection public.order_cod_collections%rowtype;
  v_settled_amount numeric(14,2);
  v_remaining_courier_amount numeric(14,2);
  v_existing public.finance_payment_transactions;
  v_row public.finance_payment_transactions;
begin
  if p_request_key is not null then
    select * into v_existing from public.finance_payment_transactions where request_key = p_request_key;
    if found then
      if v_existing.order_ref = p_order_ref and v_existing.amount = p_amount and v_existing.currency_code = p_currency_code and v_existing.status = 'recorded' then
        return v_existing;
      end if;
      raise exception 'Conflicting payment idempotency key';
    end if;
  end if;

  select * into v_order from public.orders where order_ref = p_order_ref for update;
  if not found then raise exception 'Order not found'; end if;
  if v_order.archived_at is not null or v_order.status = 'Cancelled' then raise exception 'Order cannot accept payment'; end if;
  if p_amount <= 0 then raise exception 'Payment amount must be positive'; end if;
  if p_amount::numeric is distinct from round(p_amount::numeric, 2) then raise exception 'Payment amount must use exact two-decimal precision'; end if;
  if p_currency_code !~ '^[A-Z]{3}$' then raise exception 'Invalid currency'; end if;
  if length(trim(p_order_ref)) > 128 or length(trim(p_payment_method)) > 128 then raise exception 'Payment payload exceeds allowed length'; end if;
  if p_external_reference is not null and length(trim(p_external_reference)) > 256 then raise exception 'External reference exceeds allowed length'; end if;
  if p_note is not null and length(p_note) > 2000 then raise exception 'Payment note exceeds allowed length'; end if;
  v_order_currency := coalesce(v_order.currency_code, 'BDT');
  if p_currency_code <> v_order_currency then raise exception 'Currency mismatch'; end if;

  v_payable := public.admin_v2_finance_payable(v_order.subtotal, v_order.discount_amount, v_order.delivery_charge, v_order.total);
  v_stored_total := case when v_order.total is null then null else round(v_order.total::numeric, 2)::numeric(14,2) end;
  if v_stored_total is not null and v_stored_total is distinct from v_payable then
    raise exception 'Order payable mismatch requires reconciliation';
  end if;

  select coalesce(sum(amount), 0)::numeric(14,2) into v_paid
    from public.finance_payment_transactions
   where order_ref = p_order_ref and status = 'recorded';
  if v_paid + p_amount > v_payable then raise exception 'Payment exceeds payable amount'; end if;

  begin
    insert into public.finance_payment_transactions(reference, order_ref, amount, currency_code, payment_method, external_reference, note, source, status, occurred_at, request_key, recorded_by_type, recorded_by_id, recorded_by_name)
    values (public.admin_v2_finance_reference('NOR-TXN'), p_order_ref, p_amount, p_currency_code, p_payment_method, nullif(trim(p_external_reference), ''), nullif(trim(p_note), ''), 'manual', 'recorded', p_occurred_at, p_request_key, p_actor_type, p_actor_id, p_actor_name)
    returning * into v_row;
  exception when unique_violation then
    if p_request_key is not null then
      select * into v_existing from public.finance_payment_transactions where request_key = p_request_key;
      if found and v_existing.order_ref = p_order_ref and v_existing.amount = p_amount and v_existing.currency_code = p_currency_code and v_existing.status = 'recorded' then
        return v_existing;
      end if;
    end if;
    raise;
  end;

  perform public.admin_v2_recompute_order_finance(p_order_ref);
  if p_actor_type = 'staff' and p_actor_id ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$' then
    v_audit_staff_id := p_actor_id::uuid;
  end if;

  if v_order.payment_method = 'Cash on Delivery' and v_order.status = 'Delivered' then
    select * into v_open_courier_collection
      from public.order_cod_collections
     where order_ref = v_order.order_ref
       and collection_status = 'courier_collected_unsettled'
       and settled_at is null
     order by created_at desc, id desc
     limit 1
     for update;

    if found then
      select coalesce(sum(amount), 0)::numeric(14,2)
        into v_settled_amount
        from public.order_cod_collections
       where settled_collection_id = v_open_courier_collection.id
         and collection_status = 'merchant_received_verified'
         and reversed_at is null;

      v_remaining_courier_amount := greatest(v_open_courier_collection.amount - v_settled_amount, 0)::numeric(14,2);
      if v_row.amount > v_remaining_courier_amount then
        raise exception 'Merchant COD settlement exceeds remaining courier-held amount.';
      end if;
    end if;

    begin
      insert into public.order_cod_collections(
        order_ref,
        order_status,
        delivery_status,
        collection_status,
        amount,
        currency_code,
        note,
        settled_collection_id,
        finance_payment_transaction_id,
        settled_at,
        recorded_by_type,
        recorded_by_id,
        recorded_by_name
      )
      values (
        v_order.order_ref,
        v_order.status,
        v_order.delivery_status,
        'merchant_received_verified',
        v_row.amount,
        v_row.currency_code,
        'Merchant receipt verified through finance payment transaction ' || v_row.reference,
        case when v_open_courier_collection.id is not null then v_open_courier_collection.id else null end,
        v_row.id,
        now(),
        p_actor_type,
        p_actor_id,
        p_actor_name
      );

      if v_open_courier_collection.id is not null and v_remaining_courier_amount - v_row.amount <= 0 then
        update public.order_cod_collections
           set settled_at = now()
         where id = v_open_courier_collection.id;
      end if;
    exception when unique_violation then
      null;
    end;
  end if;

  insert into public.admin_staff_activity_logs(staff_id, actor_type, actor_id, actor_name, action, target_type, target_id, metadata)
  values (v_audit_staff_id, p_actor_type, p_actor_id, p_actor_name, 'finance.payment.recorded', 'finance_payment_transaction', v_row.reference, jsonb_build_object('reference', v_row.reference, 'order_ref', p_order_ref, 'amount', p_amount, 'currency_code', p_currency_code, 'status', 'recorded'));
  return v_row;
end;
$$;

create or replace function public.admin_v2_void_payment(p_reference text, p_void_reason text, p_actor_type text, p_actor_id text, p_actor_name text)
returns public.finance_payment_transactions
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_row public.finance_payment_transactions;
  v_remaining_payments numeric(14,2);
  v_active_refunds numeric(14,2);
  v_audit_staff_id uuid;
  v_settlement public.order_cod_collections%rowtype;
  v_open_balance numeric(14,2);
begin
  select * into v_row from public.finance_payment_transactions where reference = p_reference for update;
  if not found then raise exception 'Payment not found'; end if;
  if v_row.status <> 'recorded' then raise exception 'Payment already void'; end if;
  if coalesce(nullif(trim(p_void_reason), ''), '') = '' then raise exception 'Void reason is required'; end if;
  if length(p_void_reason) > 1000 then raise exception 'Void reason exceeds allowed length'; end if;

  perform 1 from public.orders where order_ref = v_row.order_ref for update;
  select coalesce(sum(amount), 0)::numeric(14,2) into v_remaining_payments from public.finance_payment_transactions where order_ref = v_row.order_ref and status = 'recorded' and reference <> p_reference;
  select coalesce(sum(amount), 0)::numeric(14,2) into v_active_refunds from public.finance_refunds where order_ref = v_row.order_ref and status = 'recorded';
  if v_active_refunds > v_remaining_payments then raise exception 'Cannot void payment while active refunds exceed remaining payments'; end if;

  for v_settlement in
    select *
      from public.order_cod_collections
     where finance_payment_transaction_id = v_row.id
       and collection_status = 'merchant_received_verified'
       and reversed_at is null
     for update
  loop
    update public.order_cod_collections
       set reversed_at = now(),
           reversed_by_type = p_actor_type,
           reversed_by_id = p_actor_id,
           reversed_by_name = p_actor_name
     where id = v_settlement.id;

    if v_settlement.settled_collection_id is not null then
      select coalesce(sum(amount), 0)::numeric(14,2)
        into v_open_balance
        from public.order_cod_collections
       where settled_collection_id = v_settlement.settled_collection_id
         and collection_status = 'merchant_received_verified'
         and reversed_at is null;

      update public.order_cod_collections
         set settled_at = case when v_open_balance >= amount then settled_at else null end
       where id = v_settlement.settled_collection_id;
    end if;
  end loop;

  update public.finance_payment_transactions
     set status = 'void', voided_at = now(), voided_by_type = p_actor_type, voided_by_id = p_actor_id, voided_by_name = p_actor_name, void_reason = p_void_reason
   where reference = p_reference
   returning * into v_row;

  perform public.admin_v2_recompute_order_finance(v_row.order_ref);
  if p_actor_type = 'staff' and p_actor_id ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$' then
    v_audit_staff_id := p_actor_id::uuid;
  end if;
  insert into public.admin_staff_activity_logs(staff_id, actor_type, actor_id, actor_name, action, target_type, target_id, metadata)
  values (v_audit_staff_id, p_actor_type, p_actor_id, p_actor_name, 'finance.payment.voided', 'finance_payment_transaction', v_row.reference, jsonb_build_object('reference', v_row.reference, 'order_ref', v_row.order_ref, 'amount', v_row.amount, 'currency_code', v_row.currency_code, 'status', 'void', 'cod_settlement_reversed', true));
  return v_row;
end;
$$;

revoke all on function public.admin_v2_update_order_status_delivery_with_event(text,text,text,text,text,jsonb,text,text,text,text,numeric,text,uuid)
  from public, anon, authenticated, service_role;
revoke all on function public.admin_v2_record_payment(text,numeric,text,text,text,text,timestamptz,uuid,text,text,text)
  from public, anon, authenticated, service_role;
revoke all on function public.admin_v2_void_payment(text,text,text,text,text)
  from public, anon, authenticated, service_role;

grant execute on function public.admin_v2_update_order_status_delivery_with_event(text,text,text,text,text,jsonb,text,text,text,text,numeric,text,uuid)
  to service_role;
grant execute on function public.admin_v2_record_payment(text,numeric,text,text,text,text,timestamptz,uuid,text,text,text)
  to service_role;
grant execute on function public.admin_v2_void_payment(text,text,text,text,text)
  to service_role;
