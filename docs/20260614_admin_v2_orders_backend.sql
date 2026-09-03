-- Phase 2.2 Admin V2 Orders Backend Completion
-- Additive only. Review and run manually in Supabase SQL Editor.

alter table public.orders
  add column if not exists delivery_status text,
  add column if not exists delivery_area text,
  add column if not exists delivery_zone text,
  add column if not exists payment_status text,
  add column if not exists payment_reference text,
  add column if not exists payment_note text,
  add column if not exists archived_at timestamptz,
  add column if not exists deleted_at timestamptz,
  add column if not exists soft_deleted_at timestamptz,
  add column if not exists cancelled_reason text,
  add column if not exists customer_id text,
  add column if not exists discount_amount numeric not null default 0,
  add column if not exists paid_amount numeric not null default 0,
  add column if not exists due_amount numeric not null default 0,
  add column if not exists refunded_amount numeric not null default 0,
  add column if not exists currency_code text not null default 'BDT',
  add column if not exists payment_verified_at timestamptz;

create table if not exists public.order_notes (
  id uuid primary key default gen_random_uuid(),
  order_ref text not null references public.orders(order_ref) on update cascade on delete restrict,
  note_body text not null check (length(trim(note_body)) > 0 and length(note_body) <= 2000),
  note_type text not null default 'internal'
    check (note_type in ('internal', 'customer', 'delivery', 'payment')),
  created_by_admin_id uuid references public.admin_staff(id) on update cascade on delete set null,
  created_by_name text not null default 'Owner',
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
      'invoice_issued'
    )
  ),
  from_status text,
  to_status text,
  reason text,
  metadata jsonb not null default '{}'::jsonb,
  actor_admin_id uuid references public.admin_staff(id) on update cascade on delete set null,
  actor_name text not null default 'Owner',
  created_at timestamptz not null default now()
);

create table if not exists public.invoices (
  id uuid primary key default gen_random_uuid(),
  invoice_number text not null unique,
  order_ref text not null references public.orders(order_ref) on update cascade on delete restrict,
  status text not null default 'issued' check (status in ('issued', 'void')),
  issued_at timestamptz not null default now(),
  issued_by text,
  subtotal_amount numeric not null default 0,
  discount_amount numeric not null default 0,
  delivery_amount numeric not null default 0,
  total_amount numeric not null default 0,
  currency_code text not null default 'BDT',
  snapshot jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create unique index if not exists invoices_one_issued_per_order_idx
  on public.invoices(order_ref)
  where status = 'issued';

create index if not exists orders_order_ref_idx on public.orders(order_ref);
create index if not exists orders_status_idx on public.orders(status);
create index if not exists orders_payment_status_idx on public.orders(payment_status);
create index if not exists orders_delivery_status_idx on public.orders(delivery_status);
create index if not exists orders_created_at_idx on public.orders(created_at desc);
create index if not exists orders_total_idx on public.orders(total);
create index if not exists orders_payment_method_idx on public.orders(payment_method);
create index if not exists orders_customer_phone_idx on public.orders(customer_phone);
create index if not exists orders_customer_email_idx on public.orders(customer_email);

create index if not exists order_notes_order_ref_created_at_idx
  on public.order_notes(order_ref, created_at desc)
  where deleted_at is null;

create index if not exists order_events_order_ref_created_at_idx
  on public.order_events(order_ref, created_at asc);

create index if not exists order_events_created_at_idx
  on public.order_events(created_at desc);

create index if not exists invoices_order_ref_idx on public.invoices(order_ref);
create index if not exists invoices_created_at_idx on public.invoices(created_at desc);

alter table public.order_notes enable row level security;
alter table public.order_events enable row level security;
alter table public.invoices enable row level security;

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
as $$
  select case p_status
    when 'Confirmed' then 'order_confirmed'
    when 'Cancelled' then 'order_cancelled'
    when 'Shipped' then 'out_for_delivery'
    when 'Delivered' then 'delivered'
    else 'status_changed'
  end
$$;

create or replace function public.admin_v2_update_order_status_with_event(
  p_order_ref text,
  p_to_status text,
  p_reason text default null,
  p_actor_admin_id uuid default null,
  p_actor_name text default 'Owner',
  p_metadata jsonb default '{}'::jsonb
)
returns setof public.orders
language plpgsql
security definer
set search_path = public
as $$
declare
  v_order public.orders%rowtype;
  v_from_status text;
begin
  select * into v_order
  from public.orders
  where order_ref = p_order_ref
  for update;

  if not found then
    raise exception 'Order not found';
  end if;

  v_from_status := v_order.status;

  update public.orders
  set
    status = p_to_status,
    cancelled_reason = case when p_to_status = 'Cancelled' then p_reason else cancelled_reason end,
    updated_at = now()
  where order_ref = p_order_ref
  returning * into v_order;

  insert into public.order_events (
    order_ref,
    event_type,
    from_status,
    to_status,
    reason,
    metadata,
    actor_admin_id,
    actor_name
  )
  values (
    p_order_ref,
    public.admin_v2_order_event_type_for_status(p_to_status),
    v_from_status,
    p_to_status,
    p_reason,
    coalesce(p_metadata, '{}'::jsonb),
    p_actor_admin_id,
    coalesce(nullif(trim(p_actor_name), ''), 'Owner')
  );

  return next v_order;
end;
$$;
