-- Additive, service-role-only coupon infrastructure. Do not apply without staging validation.
create table if not exists public.discount_coupons (
  id uuid primary key default gen_random_uuid(),
  code text not null,
  name text not null,
  discount_type text not null check (discount_type in ('percentage', 'fixed')),
  discount_value numeric(14,2) not null check (discount_value > 0),
  minimum_subtotal numeric(14,2) not null default 0 check (minimum_subtotal >= 0),
  maximum_discount numeric(14,2) null check (maximum_discount is null or maximum_discount > 0),
  usage_limit integer null check (usage_limit is null or usage_limit > 0),
  usage_count integer not null default 0 check (usage_count >= 0),
  is_active boolean not null default true,
  starts_at timestamptz null,
  expires_at timestamptz null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (code = upper(code) and code ~ '^[A-Z0-9][A-Z0-9_-]{2,63}$'),
  check (discount_type <> 'percentage' or discount_value <= 100),
  check (usage_limit is null or usage_count <= usage_limit),
  check (expires_at is null or starts_at is null or expires_at > starts_at)
);

create unique index if not exists discount_coupons_code_unique on public.discount_coupons (code);
create index if not exists discount_coupons_active_window_idx on public.discount_coupons (is_active, starts_at, expires_at);

alter table public.orders add column if not exists coupon_id uuid null;
alter table public.orders add column if not exists coupon_code text null;
do $$ begin
  if not exists (select 1 from pg_constraint where conrelid='public.orders'::regclass and conname='orders_coupon_id_fkey') then
    alter table public.orders add constraint orders_coupon_id_fkey foreign key (coupon_id) references public.discount_coupons(id) on delete restrict;
  end if;
end $$;

-- Cover coupon-attribution lookups and the orders -> coupon foreign key.
create index if not exists orders_coupon_id_idx on public.orders (coupon_id);

create table if not exists public.discount_redemptions (
  id uuid primary key default gen_random_uuid(),
  coupon_id uuid not null references public.discount_coupons(id) on delete restrict,
  order_ref text not null references public.orders(order_ref) on delete restrict,
  coupon_code text not null,
  subtotal_amount numeric(14,2) not null check (subtotal_amount >= 0),
  discount_amount numeric(14,2) not null check (discount_amount > 0),
  created_at timestamptz not null default now(),
  unique (order_ref)
);
create index if not exists discount_redemptions_coupon_created_idx on public.discount_redemptions (coupon_id, created_at desc);

alter table public.discount_coupons enable row level security;
alter table public.discount_redemptions enable row level security;
revoke all on table public.discount_coupons, public.discount_redemptions from public, anon, authenticated;
grant select, insert, update, delete on table public.discount_coupons, public.discount_redemptions to service_role;

create or replace function public.admin_v2_touch_discount_coupon_updated_at()
returns trigger language plpgsql set search_path to 'pg_catalog', 'public' as $$
begin new.updated_at = now(); return new; end; $$;
drop trigger if exists discount_coupons_touch_updated_at on public.discount_coupons;
create trigger discount_coupons_touch_updated_at before update on public.discount_coupons for each row execute function public.admin_v2_touch_discount_coupon_updated_at();

-- A redeemed code is part of an immutable order/redemption snapshot.
create or replace function public.admin_v2_preserve_redeemed_coupon_code()
returns trigger language plpgsql set search_path to 'pg_catalog', 'public' as $$
begin
  if old.usage_count > 0 and new.code is distinct from old.code then
    raise exception 'A redeemed discount code cannot be changed.' using errcode = 'P0001';
  end if;
  return new;
end; $$;
drop trigger if exists discount_coupons_preserve_redeemed_code on public.discount_coupons;
create trigger discount_coupons_preserve_redeemed_code
before update on public.discount_coupons
for each row execute function public.admin_v2_preserve_redeemed_coupon_code();

-- The server has already performed the trusted catalog quote. This function exclusively
-- owns coupon eligibility, exact-money calculation, order insert, redemption and usage count.
create or replace function public.checkout_create_order_with_coupon(p_order jsonb, p_coupon_code text)
returns public.orders language plpgsql security invoker set search_path to 'pg_catalog', 'public' as $$
declare
  v_coupon public.discount_coupons%rowtype;
  v_order public.orders%rowtype;
  v_existing public.orders%rowtype;
  v_subtotal numeric(14,2); v_delivery numeric(14,2); v_discount numeric(14,2); v_total numeric(14,2);
  v_code text := upper(trim(coalesce(p_coupon_code,'')));
  v_order_ref text := nullif(btrim(coalesce(p_order->>'order_ref','')), '');
begin
  if v_code !~ '^[A-Z0-9][A-Z0-9_-]{2,63}$' then raise exception 'Invalid discount code.' using errcode='22023'; end if;
  if v_order_ref is null or length(v_order_ref)>128 then raise exception 'Invalid order reference.' using errcode='22023'; end if;
  -- Order-reference lock serializes concurrent retries before the first row exists.
  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(v_order_ref, 0));
  select * into v_existing from public.orders where order_ref = v_order_ref for update;
  if found then
    if v_existing.coupon_code = v_code
       and v_existing.customer_phone = p_order->>'customer_phone'
       and v_existing.items = coalesce(p_order->'items','[]'::jsonb)
       and v_existing.subtotal = (p_order->>'subtotal')::numeric
       and v_existing.delivery_charge = (p_order->>'delivery_charge')::numeric
       and v_existing.payment_method = p_order->>'payment_method'
    then return v_existing; end if;
    raise exception 'Order reference has already been used with different details.' using errcode='23505';
  end if;
  v_subtotal := round(coalesce((p_order->>'subtotal')::numeric, -1), 2);
  v_delivery := round(coalesce((p_order->>'delivery_charge')::numeric, -1), 2);
  if v_subtotal is null or v_delivery is null or v_subtotal <= 0 or v_delivery < 0 then raise exception 'Invalid trusted order totals.' using errcode='22023'; end if;
  select * into v_coupon from public.discount_coupons where code=v_code for update;
  if not found or not v_coupon.is_active or (v_coupon.starts_at is not null and v_coupon.starts_at > now()) or (v_coupon.expires_at is not null and v_coupon.expires_at <= now()) then raise exception 'This discount code is unavailable.' using errcode='P0001'; end if;
  if v_coupon.usage_limit is not null and v_coupon.usage_count >= v_coupon.usage_limit then raise exception 'This discount code has reached its usage limit.' using errcode='P0001'; end if;
  if v_subtotal < v_coupon.minimum_subtotal then raise exception 'This discount code requires a larger order subtotal.' using errcode='P0001'; end if;
  v_discount := case when v_coupon.discount_type='percentage' then round(v_subtotal*v_coupon.discount_value/100,2) else v_coupon.discount_value end;
  v_discount := least(v_discount, v_subtotal, coalesce(v_coupon.maximum_discount, v_discount));
  if v_discount <= 0 then raise exception 'This discount cannot be applied.' using errcode='P0001'; end if;
  v_total := round(v_subtotal-v_discount+v_delivery,2);
  insert into public.orders (order_ref,customer_id,customer_name,customer_phone,customer_email,city_area,delivery_address,size_fit_note,delivery_note,items,subtotal,total,discount_amount,coupon_id,coupon_code,payment_method,wallet_provider,payment_type,receiver_number,sender_number,transaction_id,status,delivery_charge,delivery_area,delivery_zone,payment_status,payment_reference,paid_amount,due_amount,refunded_amount,payment_verified_at,currency_code,created_at,updated_at)
  values (v_order_ref,nullif(p_order->>'customer_id',''),p_order->>'customer_name',p_order->>'customer_phone',nullif(p_order->>'customer_email',''),p_order->>'city_area',p_order->>'delivery_address',nullif(p_order->>'size_fit_note',''),nullif(p_order->>'delivery_note',''),coalesce(p_order->'items','[]'::jsonb),v_subtotal,v_total,v_discount,v_coupon.id,v_code,p_order->>'payment_method',nullif(p_order->>'wallet_provider',''),nullif(p_order->>'payment_type',''),nullif(p_order->>'receiver_number',''),nullif(p_order->>'sender_number',''),nullif(p_order->>'transaction_id',''),coalesce(nullif(p_order->>'status',''),'Pending'),v_delivery,nullif(p_order->>'delivery_area',''),nullif(p_order->>'delivery_zone',''),nullif(p_order->>'payment_status',''),nullif(p_order->>'payment_reference',''),coalesce(round(nullif(p_order->>'paid_amount','')::numeric,2),0),case when coalesce(nullif(p_order->>'payment_method',''),'') = 'Cash on Delivery' then v_total else coalesce(round(nullif(p_order->>'due_amount','')::numeric,2),0) end,coalesce(round(nullif(p_order->>'refunded_amount','')::numeric,2),0),nullif(p_order->>'payment_verified_at','')::timestamptz,'BDT',coalesce((p_order->>'created_at')::timestamptz,now()),now()) returning * into v_order;
  insert into public.discount_redemptions (coupon_id,order_ref,coupon_code,subtotal_amount,discount_amount) values (v_coupon.id,v_order.order_ref,v_code,v_subtotal,v_discount);
  update public.discount_coupons set usage_count=usage_count+1 where id=v_coupon.id;
  return v_order;
end; $$;
revoke all on function public.checkout_create_order_with_coupon(jsonb,text) from public, anon, authenticated;
grant execute on function public.checkout_create_order_with_coupon(jsonb,text) to service_role;
