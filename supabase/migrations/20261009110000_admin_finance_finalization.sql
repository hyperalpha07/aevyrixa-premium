-- Admin V2 finance finalization.
-- Additive ledger infrastructure for manual payments, refunds and expenses.
-- This migration does not rewrite historical orders or create gateway/settlement/accounting fiction.

create table if not exists public.finance_payment_transactions (
  id uuid primary key default gen_random_uuid(),
  reference text unique not null,
  order_ref text not null references public.orders(order_ref) on update cascade on delete restrict,
  amount numeric(14,2) not null,
  currency_code text not null,
  payment_method text not null,
  external_reference text null,
  note text null,
  source text not null default 'manual',
  status text not null default 'recorded',
  occurred_at timestamptz null,
  request_key uuid null,
  recorded_by_type text not null,
  recorded_by_id text null,
  recorded_by_name text not null,
  recorded_at timestamptz not null default now(),
  voided_at timestamptz null,
  voided_by_type text null,
  voided_by_id text null,
  voided_by_name text null,
  void_reason text null,
  created_at timestamptz not null default now(),
  constraint finance_payment_transactions_amount_positive check (amount > 0),
  constraint finance_payment_transactions_currency_valid check (currency_code ~ '^[A-Z]{3}$'),
  constraint finance_payment_transactions_status_valid check (status in ('recorded','void')),
  constraint finance_payment_transactions_source_valid check (source in ('manual','legacy_snapshot')),
  constraint finance_payment_transactions_manual_occurred check (source <> 'manual' or occurred_at is not null),
  constraint finance_payment_transactions_text_bounds check (
    length(order_ref) between 1 and 128
    and length(payment_method) between 1 and 128
    and (external_reference is null or length(external_reference) between 1 and 256)
    and (note is null or length(note) <= 2000)
    and (void_reason is null or length(void_reason) <= 1000)
  ),
  constraint finance_payment_transactions_actor_valid check (recorded_by_type in ('owner','staff','system') and length(recorded_by_name) between 1 and 120),
  constraint finance_payment_transactions_void_valid check ((status = 'recorded' and voided_at is null) or (status = 'void' and voided_at is not null and coalesce(nullif(trim(void_reason), ''), '') <> ''))
);

create table if not exists public.finance_refunds (
  id uuid primary key default gen_random_uuid(),
  reference text unique not null,
  order_ref text not null references public.orders(order_ref) on update cascade on delete restrict,
  payment_transaction_id uuid null references public.finance_payment_transactions(id) on update cascade on delete restrict,
  amount numeric(14,2) not null,
  currency_code text not null,
  refund_method text null,
  external_reference text null,
  reason text not null,
  note text null,
  source text not null default 'manual',
  status text not null default 'recorded',
  occurred_at timestamptz null,
  request_key uuid null,
  recorded_by_type text not null,
  recorded_by_id text null,
  recorded_by_name text not null,
  recorded_at timestamptz not null default now(),
  voided_at timestamptz null,
  voided_by_type text null,
  voided_by_id text null,
  voided_by_name text null,
  void_reason text null,
  created_at timestamptz not null default now(),
  constraint finance_refunds_amount_positive check (amount > 0),
  constraint finance_refunds_currency_valid check (currency_code ~ '^[A-Z]{3}$'),
  constraint finance_refunds_status_valid check (status in ('recorded','void')),
  constraint finance_refunds_source_valid check (source in ('manual','legacy_snapshot')),
  constraint finance_refunds_manual_occurred check (source <> 'manual' or occurred_at is not null),
  constraint finance_refunds_reason_present check (length(trim(reason)) between 2 and 1000),
  constraint finance_refunds_text_bounds check (
    length(order_ref) between 1 and 128
    and (refund_method is null or length(refund_method) between 1 and 128)
    and (external_reference is null or length(external_reference) between 1 and 256)
    and (note is null or length(note) <= 2000)
    and (void_reason is null or length(void_reason) <= 1000)
  ),
  constraint finance_refunds_actor_valid check (recorded_by_type in ('owner','staff','system') and length(recorded_by_name) between 1 and 120),
  constraint finance_refunds_void_valid check ((status = 'recorded' and voided_at is null) or (status = 'void' and voided_at is not null and coalesce(nullif(trim(void_reason), ''), '') <> ''))
);

create table if not exists public.finance_expenses (
  id uuid primary key default gen_random_uuid(),
  reference text unique not null,
  occurred_at timestamptz not null,
  category text not null,
  amount numeric(14,2) not null,
  currency_code text not null,
  payee text null,
  payment_method text null,
  external_reference text null,
  description text not null,
  note text null,
  order_ref text null references public.orders(order_ref) on update cascade on delete restrict,
  status text not null default 'active',
  request_key uuid null,
  created_by_type text not null,
  created_by_id text null,
  created_by_name text not null,
  created_at timestamptz not null default now(),
  voided_at timestamptz null,
  voided_by_type text null,
  voided_by_id text null,
  voided_by_name text null,
  void_reason text null,
  constraint finance_expenses_amount_positive check (amount > 0),
  constraint finance_expenses_currency_valid check (currency_code ~ '^[A-Z]{3}$'),
  constraint finance_expenses_status_valid check (status in ('active','void')),
  constraint finance_expenses_category_valid check (category in ('inventory','shipping','packaging','marketing','salaries','utilities','software','taxes_fees','office','other')),
  constraint finance_expenses_description_present check (length(trim(description)) between 2 and 2000),
  constraint finance_expenses_text_bounds check (
    length(category) between 1 and 64
    and (payee is null or length(payee) between 1 and 256)
    and (payment_method is null or length(payment_method) between 1 and 128)
    and (external_reference is null or length(external_reference) between 1 and 256)
    and (note is null or length(note) <= 2000)
    and (order_ref is null or length(order_ref) between 1 and 128)
    and (void_reason is null or length(void_reason) <= 1000)
  ),
  constraint finance_expenses_actor_valid check (created_by_type in ('owner','staff','system') and length(created_by_name) between 1 and 120),
  constraint finance_expenses_void_valid check ((status = 'active' and voided_at is null) or (status = 'void' and voided_at is not null and coalesce(nullif(trim(void_reason), ''), '') <> ''))
);

create index if not exists finance_payment_transactions_order_ref_idx on public.finance_payment_transactions(order_ref);
create index if not exists finance_payment_transactions_occurred_at_idx on public.finance_payment_transactions(occurred_at desc, id desc);
create index if not exists finance_payment_transactions_status_idx on public.finance_payment_transactions(status);
create unique index if not exists finance_payment_transactions_request_key_idx on public.finance_payment_transactions(request_key) where request_key is not null;

create index if not exists finance_refunds_order_ref_idx on public.finance_refunds(order_ref);
create index if not exists finance_refunds_payment_transaction_id_idx on public.finance_refunds(payment_transaction_id);
create index if not exists finance_refunds_occurred_at_idx on public.finance_refunds(occurred_at desc, id desc);
create index if not exists finance_refunds_status_idx on public.finance_refunds(status);
create unique index if not exists finance_refunds_request_key_idx on public.finance_refunds(request_key) where request_key is not null;

create index if not exists finance_expenses_order_ref_idx on public.finance_expenses(order_ref) where order_ref is not null;
create index if not exists finance_expenses_occurred_at_idx on public.finance_expenses(occurred_at desc, id desc);
create index if not exists finance_expenses_status_idx on public.finance_expenses(status);
create index if not exists finance_expenses_category_occurred_at_idx on public.finance_expenses(category, occurred_at desc);
create unique index if not exists finance_expenses_request_key_idx on public.finance_expenses(request_key) where request_key is not null;

alter table public.finance_payment_transactions enable row level security;
alter table public.finance_refunds enable row level security;
alter table public.finance_expenses enable row level security;

revoke all on public.finance_payment_transactions from public, anon, authenticated, service_role;
revoke all on public.finance_refunds from public, anon, authenticated, service_role;
revoke all on public.finance_expenses from public, anon, authenticated, service_role;
grant select on public.finance_payment_transactions to service_role;
grant select on public.finance_refunds to service_role;
grant select on public.finance_expenses to service_role;

drop policy if exists "service_role_select_finance_payment_transactions" on public.finance_payment_transactions;
create policy "service_role_select_finance_payment_transactions" on public.finance_payment_transactions for select to service_role using (true);
drop policy if exists "service_role_select_finance_refunds" on public.finance_refunds;
create policy "service_role_select_finance_refunds" on public.finance_refunds for select to service_role using (true);
drop policy if exists "service_role_select_finance_expenses" on public.finance_expenses;
create policy "service_role_select_finance_expenses" on public.finance_expenses for select to service_role using (true);

create or replace function public.admin_v2_finance_payable(p_subtotal numeric, p_discount numeric, p_delivery numeric, p_total numeric)
returns numeric
language sql
stable
set search_path = public, pg_temp
as $$
  select greatest(coalesce(p_subtotal, p_total, 0) - coalesce(p_discount, 0) + coalesce(p_delivery, 0), 0)::numeric(14,2);
$$;

create or replace function public.admin_v2_finance_reference(p_prefix text)
returns text
language plpgsql
volatile
set search_path = public, pg_temp
as $$
declare
  v_reference text;
  v_attempt integer := 0;
begin
  loop
    v_attempt := v_attempt + 1;
    v_reference := p_prefix || '-' || to_char((now() at time zone 'utc')::date, 'YYYYMMDD') || '-' || lpad(floor(random() * 1000000)::int::text, 6, '0');

    if p_prefix = 'NOR-TXN' and not exists (select 1 from public.finance_payment_transactions where reference = v_reference) then
      return v_reference;
    elsif p_prefix = 'NOR-REF' and not exists (select 1 from public.finance_refunds where reference = v_reference) then
      return v_reference;
    elsif p_prefix = 'NOR-EXP' and not exists (select 1 from public.finance_expenses where reference = v_reference) then
      return v_reference;
    end if;

    if v_attempt >= 10 then
      raise exception 'Unable to generate unique finance reference';
    end if;
  end loop;
end;
$$;

create or replace function public.admin_v2_recompute_order_finance(p_order_ref text)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_payable numeric(14,2);
  v_paid numeric(14,2);
  v_refunded numeric(14,2);
  v_latest_external text;
begin
  select public.admin_v2_finance_payable(subtotal, discount_amount, delivery_charge, total)
    into v_payable
    from public.orders
    where order_ref = p_order_ref
    for update;
  if not found then
    raise exception 'Order not found';
  end if;

  select coalesce(sum(amount), 0)::numeric(14,2)
    into v_paid
    from public.finance_payment_transactions
    where order_ref = p_order_ref and status = 'recorded';

  select external_reference
    into v_latest_external
    from public.finance_payment_transactions
    where order_ref = p_order_ref
      and status = 'recorded'
      and external_reference is not null
    order by coalesce(occurred_at, recorded_at, created_at) desc, id desc
    limit 1;

  select coalesce(sum(amount), 0)::numeric(14,2)
    into v_refunded
    from public.finance_refunds
    where order_ref = p_order_ref and status = 'recorded';

  update public.orders
     set paid_amount = v_paid,
         due_amount = greatest(v_payable - v_paid, 0),
         refunded_amount = v_refunded,
         payment_status = case
           when v_paid <= 0 then 'pending'
           when v_refunded >= v_paid and v_paid > 0 then 'refunded'
           when v_paid + 0.01 >= v_payable then 'verified'
           else 'pending'
         end,
         payment_verification_status = case when v_paid + 0.01 >= v_payable and v_paid > 0 then 'Verified' else 'Pending' end,
         payment_verified_at = case when v_paid + 0.01 >= v_payable and v_paid > 0 then coalesce(payment_verified_at, now()) else null end,
         payment_reference = v_latest_external
   where order_ref = p_order_ref;
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
  v_paid numeric(14,2);
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
  if p_currency_code !~ '^[A-Z]{3}$' then raise exception 'Invalid currency'; end if;
  if length(trim(p_order_ref)) > 128 or length(trim(p_payment_method)) > 128 then raise exception 'Payment payload exceeds allowed length'; end if;
  if p_external_reference is not null and length(trim(p_external_reference)) > 256 then raise exception 'External reference exceeds allowed length'; end if;
  if p_note is not null and length(p_note) > 2000 then raise exception 'Payment note exceeds allowed length'; end if;
  v_order_currency := coalesce(v_order.currency_code, 'BDT');
  if p_currency_code <> v_order_currency then raise exception 'Currency mismatch'; end if;

  v_payable := public.admin_v2_finance_payable(v_order.subtotal, v_order.discount_amount, v_order.delivery_charge, v_order.total);
  select coalesce(sum(amount), 0)::numeric(14,2) into v_paid from public.finance_payment_transactions where order_ref = p_order_ref and status = 'recorded';
  if v_paid + p_amount > v_payable + 0.01 then raise exception 'Payment exceeds payable amount'; end if;

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
  insert into public.admin_staff_activity_logs(staff_id, actor_type, actor_id, actor_name, action, target_type, target_id, metadata)
  values (case when p_actor_type = 'staff' then p_actor_id::uuid else null end, p_actor_type, p_actor_id, p_actor_name, 'finance.payment.recorded', 'finance_payment_transaction', v_row.reference, jsonb_build_object('reference', v_row.reference, 'order_ref', p_order_ref, 'amount', p_amount, 'currency_code', p_currency_code, 'status', 'recorded'));
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
begin
  select * into v_row from public.finance_payment_transactions where reference = p_reference for update;
  if not found then raise exception 'Payment not found'; end if;
  if v_row.status <> 'recorded' then raise exception 'Payment already void'; end if;
  if coalesce(nullif(trim(p_void_reason), ''), '') = '' then raise exception 'Void reason is required'; end if;
  if length(p_void_reason) > 1000 then raise exception 'Void reason exceeds allowed length'; end if;
  perform 1 from public.orders where order_ref = v_row.order_ref for update;
  select coalesce(sum(amount), 0)::numeric(14,2) into v_remaining_payments from public.finance_payment_transactions where order_ref = v_row.order_ref and status = 'recorded' and reference <> p_reference;
  select coalesce(sum(amount), 0)::numeric(14,2) into v_active_refunds from public.finance_refunds where order_ref = v_row.order_ref and status = 'recorded';
  if v_active_refunds > v_remaining_payments + 0.01 then raise exception 'Cannot void payment while active refunds exceed remaining payments'; end if;
  update public.finance_payment_transactions
     set status = 'void', voided_at = now(), voided_by_type = p_actor_type, voided_by_id = p_actor_id, voided_by_name = p_actor_name, void_reason = p_void_reason
   where reference = p_reference
   returning * into v_row;
  perform public.admin_v2_recompute_order_finance(v_row.order_ref);
  insert into public.admin_staff_activity_logs(staff_id, actor_type, actor_id, actor_name, action, target_type, target_id, metadata)
  values (case when p_actor_type = 'staff' then p_actor_id::uuid else null end, p_actor_type, p_actor_id, p_actor_name, 'finance.payment.voided', 'finance_payment_transaction', v_row.reference, jsonb_build_object('reference', v_row.reference, 'order_ref', v_row.order_ref, 'amount', v_row.amount, 'currency_code', v_row.currency_code, 'status', 'void'));
  return v_row;
end;
$$;

create or replace function public.admin_v2_record_refund(
  p_order_ref text,
  p_payment_transaction_id uuid,
  p_amount numeric,
  p_currency_code text,
  p_refund_method text,
  p_external_reference text,
  p_reason text,
  p_note text,
  p_occurred_at timestamptz,
  p_request_key uuid,
  p_actor_type text,
  p_actor_id text,
  p_actor_name text
) returns public.finance_refunds
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_order record;
  v_payments numeric(14,2);
  v_refunds numeric(14,2);
  v_order_currency text;
  v_payment_currency text;
  v_active_payment_currencies integer;
  v_existing public.finance_refunds;
  v_row public.finance_refunds;
begin
  if p_request_key is not null then
    select * into v_existing from public.finance_refunds where request_key = p_request_key;
    if found then
      if v_existing.order_ref = p_order_ref and v_existing.amount = p_amount and v_existing.currency_code = p_currency_code and v_existing.status = 'recorded' then return v_existing; end if;
      raise exception 'Conflicting refund idempotency key';
    end if;
  end if;
  select * into v_order from public.orders where order_ref = p_order_ref for update;
  if not found then raise exception 'Order not found'; end if;
  if v_order.archived_at is not null then raise exception 'Archived order cannot be refunded'; end if;
  if p_amount <= 0 then raise exception 'Refund amount must be positive'; end if;
  if p_currency_code !~ '^[A-Z]{3}$' then raise exception 'Invalid currency'; end if;
  v_order_currency := coalesce(v_order.currency_code, 'BDT');
  if p_currency_code <> v_order_currency then raise exception 'Currency mismatch'; end if;
  if length(trim(p_order_ref)) > 128 then raise exception 'Refund payload exceeds allowed length'; end if;
  if coalesce(nullif(trim(p_reason), ''), '') = '' then raise exception 'Refund reason is required'; end if;
  if length(trim(p_reason)) > 1000 then raise exception 'Refund reason exceeds allowed length'; end if;
  if p_refund_method is not null and length(trim(p_refund_method)) > 128 then raise exception 'Refund method exceeds allowed length'; end if;
  if p_external_reference is not null and length(trim(p_external_reference)) > 256 then raise exception 'External reference exceeds allowed length'; end if;
  if p_note is not null and length(p_note) > 2000 then raise exception 'Refund note exceeds allowed length'; end if;
  if p_payment_transaction_id is not null then
    select currency_code into v_payment_currency from public.finance_payment_transactions where id = p_payment_transaction_id and order_ref = p_order_ref and status = 'recorded';
    if not found then raise exception 'Payment transaction mismatch'; end if;
    if v_payment_currency <> p_currency_code then raise exception 'Linked payment currency mismatch'; end if;
  end if;
  select coalesce(sum(amount), 0)::numeric(14,2) into v_payments from public.finance_payment_transactions where order_ref = p_order_ref and status = 'recorded';
  select count(distinct currency_code) into v_active_payment_currencies from public.finance_payment_transactions where order_ref = p_order_ref and status = 'recorded' and currency_code <> p_currency_code;
  if v_active_payment_currencies > 0 then raise exception 'Active payment currency mismatch'; end if;
  select coalesce(sum(amount), 0)::numeric(14,2) into v_refunds from public.finance_refunds where order_ref = p_order_ref and status = 'recorded';
  if v_payments <= 0 then raise exception 'Refund requires active payment'; end if;
  if v_refunds + p_amount > v_payments + 0.01 then raise exception 'Refund exceeds active payments'; end if;
  begin
    insert into public.finance_refunds(reference, order_ref, payment_transaction_id, amount, currency_code, refund_method, external_reference, reason, note, source, status, occurred_at, request_key, recorded_by_type, recorded_by_id, recorded_by_name)
    values (public.admin_v2_finance_reference('NOR-REF'), p_order_ref, p_payment_transaction_id, p_amount, p_currency_code, nullif(trim(p_refund_method), ''), nullif(trim(p_external_reference), ''), p_reason, nullif(trim(p_note), ''), 'manual', 'recorded', p_occurred_at, p_request_key, p_actor_type, p_actor_id, p_actor_name)
    returning * into v_row;
  exception when unique_violation then
    if p_request_key is not null then
      select * into v_existing from public.finance_refunds where request_key = p_request_key;
      if found and v_existing.order_ref = p_order_ref and v_existing.amount = p_amount and v_existing.currency_code = p_currency_code and v_existing.status = 'recorded' then
        return v_existing;
      end if;
    end if;
    raise;
  end;
  perform public.admin_v2_recompute_order_finance(p_order_ref);
  insert into public.admin_staff_activity_logs(staff_id, actor_type, actor_id, actor_name, action, target_type, target_id, metadata)
  values (case when p_actor_type = 'staff' then p_actor_id::uuid else null end, p_actor_type, p_actor_id, p_actor_name, 'finance.refund.recorded', 'finance_refund', v_row.reference, jsonb_build_object('reference', v_row.reference, 'order_ref', p_order_ref, 'amount', p_amount, 'currency_code', p_currency_code, 'status', 'recorded'));
  return v_row;
end;
$$;

create or replace function public.admin_v2_void_refund(p_reference text, p_void_reason text, p_actor_type text, p_actor_id text, p_actor_name text)
returns public.finance_refunds
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare v_row public.finance_refunds;
begin
  select * into v_row from public.finance_refunds where reference = p_reference for update;
  if not found then raise exception 'Refund not found'; end if;
  if v_row.status <> 'recorded' then raise exception 'Refund already void'; end if;
  if coalesce(nullif(trim(p_void_reason), ''), '') = '' then raise exception 'Void reason is required'; end if;
  if length(p_void_reason) > 1000 then raise exception 'Void reason exceeds allowed length'; end if;
  perform 1 from public.orders where order_ref = v_row.order_ref for update;
  update public.finance_refunds
     set status = 'void', voided_at = now(), voided_by_type = p_actor_type, voided_by_id = p_actor_id, voided_by_name = p_actor_name, void_reason = p_void_reason
   where reference = p_reference
   returning * into v_row;
  perform public.admin_v2_recompute_order_finance(v_row.order_ref);
  insert into public.admin_staff_activity_logs(staff_id, actor_type, actor_id, actor_name, action, target_type, target_id, metadata)
  values (case when p_actor_type = 'staff' then p_actor_id::uuid else null end, p_actor_type, p_actor_id, p_actor_name, 'finance.refund.voided', 'finance_refund', v_row.reference, jsonb_build_object('reference', v_row.reference, 'order_ref', v_row.order_ref, 'amount', v_row.amount, 'currency_code', v_row.currency_code, 'status', 'void'));
  return v_row;
end;
$$;

create or replace function public.admin_v2_create_expense(
  p_occurred_at timestamptz,
  p_category text,
  p_amount numeric,
  p_currency_code text,
  p_payee text,
  p_payment_method text,
  p_external_reference text,
  p_description text,
  p_note text,
  p_order_ref text,
  p_request_key uuid,
  p_actor_type text,
  p_actor_id text,
  p_actor_name text
) returns public.finance_expenses
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_existing public.finance_expenses;
  v_row public.finance_expenses;
begin
  if p_request_key is not null then
    select * into v_existing from public.finance_expenses where request_key = p_request_key;
    if found then
      if v_existing.amount = p_amount and v_existing.currency_code = p_currency_code and v_existing.status = 'active' then return v_existing; end if;
      raise exception 'Conflicting expense idempotency key';
    end if;
  end if;
  if p_amount <= 0 then raise exception 'Expense amount must be positive'; end if;
  if p_currency_code !~ '^[A-Z]{3}$' then raise exception 'Invalid currency'; end if;
  if p_category not in ('inventory','shipping','packaging','marketing','salaries','utilities','software','taxes_fees','office','other') then raise exception 'Invalid category'; end if;
  if coalesce(nullif(trim(p_description), ''), '') = '' then raise exception 'Description is required'; end if;
  if length(trim(p_category)) > 64 or length(trim(p_description)) > 2000 then raise exception 'Expense payload exceeds allowed length'; end if;
  if p_payee is not null and length(trim(p_payee)) > 256 then raise exception 'Payee exceeds allowed length'; end if;
  if p_payment_method is not null and length(trim(p_payment_method)) > 128 then raise exception 'Payment method exceeds allowed length'; end if;
  if p_external_reference is not null and length(trim(p_external_reference)) > 256 then raise exception 'External reference exceeds allowed length'; end if;
  if p_note is not null and length(p_note) > 2000 then raise exception 'Expense note exceeds allowed length'; end if;
  if p_order_ref is not null and length(trim(p_order_ref)) > 128 then raise exception 'Order reference exceeds allowed length'; end if;
  if p_order_ref is not null and not exists (select 1 from public.orders where order_ref = p_order_ref) then raise exception 'Linked order not found'; end if;
  begin
    insert into public.finance_expenses(reference, occurred_at, category, amount, currency_code, payee, payment_method, external_reference, description, note, order_ref, status, request_key, created_by_type, created_by_id, created_by_name)
    values (public.admin_v2_finance_reference('NOR-EXP'), p_occurred_at, p_category, p_amount, p_currency_code, nullif(trim(p_payee), ''), nullif(trim(p_payment_method), ''), nullif(trim(p_external_reference), ''), p_description, nullif(trim(p_note), ''), p_order_ref, 'active', p_request_key, p_actor_type, p_actor_id, p_actor_name)
    returning * into v_row;
  exception when unique_violation then
    if p_request_key is not null then
      select * into v_existing from public.finance_expenses where request_key = p_request_key;
      if found and v_existing.amount = p_amount and v_existing.currency_code = p_currency_code and v_existing.status = 'active' then
        return v_existing;
      end if;
    end if;
    raise;
  end;
  insert into public.admin_staff_activity_logs(staff_id, actor_type, actor_id, actor_name, action, target_type, target_id, metadata)
  values (case when p_actor_type = 'staff' then p_actor_id::uuid else null end, p_actor_type, p_actor_id, p_actor_name, 'finance.expense.created', 'finance_expense', v_row.reference, jsonb_build_object('reference', v_row.reference, 'order_ref', p_order_ref, 'amount', p_amount, 'currency_code', p_currency_code, 'category', p_category, 'status', 'active'));
  return v_row;
end;
$$;

create or replace function public.admin_v2_void_expense(p_reference text, p_void_reason text, p_actor_type text, p_actor_id text, p_actor_name text)
returns public.finance_expenses
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare v_row public.finance_expenses;
begin
  select * into v_row from public.finance_expenses where reference = p_reference for update;
  if not found then raise exception 'Expense not found'; end if;
  if v_row.status <> 'active' then raise exception 'Expense already void'; end if;
  if coalesce(nullif(trim(p_void_reason), ''), '') = '' then raise exception 'Void reason is required'; end if;
  if length(p_void_reason) > 1000 then raise exception 'Void reason exceeds allowed length'; end if;
  update public.finance_expenses
     set status = 'void', voided_at = now(), voided_by_type = p_actor_type, voided_by_id = p_actor_id, voided_by_name = p_actor_name, void_reason = p_void_reason
   where reference = p_reference
   returning * into v_row;
  insert into public.admin_staff_activity_logs(staff_id, actor_type, actor_id, actor_name, action, target_type, target_id, metadata)
  values (case when p_actor_type = 'staff' then p_actor_id::uuid else null end, p_actor_type, p_actor_id, p_actor_name, 'finance.expense.voided', 'finance_expense', v_row.reference, jsonb_build_object('reference', v_row.reference, 'order_ref', v_row.order_ref, 'amount', v_row.amount, 'currency_code', v_row.currency_code, 'category', v_row.category, 'status', 'void'));
  return v_row;
end;
$$;

revoke all on function public.admin_v2_finance_payable(numeric,numeric,numeric,numeric) from public, anon, authenticated;
revoke all on function public.admin_v2_finance_reference(text) from public, anon, authenticated;
revoke all on function public.admin_v2_recompute_order_finance(text) from public, anon, authenticated;
revoke all on function public.admin_v2_record_payment(text,numeric,text,text,text,text,timestamptz,uuid,text,text,text) from public, anon, authenticated;
revoke all on function public.admin_v2_void_payment(text,text,text,text,text) from public, anon, authenticated;
revoke all on function public.admin_v2_record_refund(text,uuid,numeric,text,text,text,text,text,timestamptz,uuid,text,text,text) from public, anon, authenticated;
revoke all on function public.admin_v2_void_refund(text,text,text,text,text) from public, anon, authenticated;
revoke all on function public.admin_v2_create_expense(timestamptz,text,numeric,text,text,text,text,text,text,text,uuid,text,text,text) from public, anon, authenticated;
revoke all on function public.admin_v2_void_expense(text,text,text,text,text) from public, anon, authenticated;

grant execute on function public.admin_v2_record_payment(text,numeric,text,text,text,text,timestamptz,uuid,text,text,text) to service_role;
grant execute on function public.admin_v2_void_payment(text,text,text,text,text) to service_role;
grant execute on function public.admin_v2_record_refund(text,uuid,numeric,text,text,text,text,text,timestamptz,uuid,text,text,text) to service_role;
grant execute on function public.admin_v2_void_refund(text,text,text,text,text) to service_role;
grant execute on function public.admin_v2_create_expense(timestamptz,text,numeric,text,text,text,text,text,text,text,uuid,text,text,text) to service_role;
grant execute on function public.admin_v2_void_expense(text,text,text,text,text) to service_role;

do $$
begin
  if to_regclass('public.admin_roles') is not null then
    update public.admin_roles
       set permissions = coalesce(permissions, '{}'::jsonb)
        || '{"finance.overview.view": true, "finance.transactions.view": true, "finance.payments.record": true, "finance.refunds.view": true, "finance.refunds.record": true, "finance.expenses.view": true, "finance.expenses.manage": true, "finance.export": true}'::jsonb
     where key = 'manager' and is_system = true;

    update public.admin_roles
       set permissions = coalesce(permissions, '{}'::jsonb)
        || '{"finance.transactions.view": true, "finance.payments.record": true, "finance.refunds.view": true}'::jsonb
     where key = 'order_staff' and is_system = true;
  end if;
end $$;

-- Idempotent legacy snapshot backfill only for real persisted values.
insert into public.finance_payment_transactions(reference, order_ref, amount, currency_code, payment_method, source, status, occurred_at, recorded_by_type, recorded_by_name)
select 'NOR-TXN-LEGACY-' || o.order_ref, o.order_ref, o.paid_amount, coalesce(o.currency_code, 'BDT'), coalesce(o.payment_method, 'Cash on Delivery'), 'legacy_snapshot', 'recorded', o.payment_verified_at, 'system', 'Legacy snapshot'
from public.orders o
where coalesce(o.paid_amount, 0) > 0
  and not exists (select 1 from public.finance_payment_transactions f where f.reference = 'NOR-TXN-LEGACY-' || o.order_ref);

insert into public.finance_refunds(reference, order_ref, amount, currency_code, reason, source, status, occurred_at, recorded_by_type, recorded_by_name)
select 'NOR-REF-LEGACY-' || o.order_ref, o.order_ref, o.refunded_amount, coalesce(o.currency_code, 'BDT'), 'Legacy persisted refunded_amount snapshot', 'legacy_snapshot', 'recorded', null, 'system', 'Legacy snapshot'
from public.orders o
where coalesce(o.refunded_amount, 0) > 0
  and not exists (select 1 from public.finance_refunds f where f.reference = 'NOR-REF-LEGACY-' || o.order_ref);
