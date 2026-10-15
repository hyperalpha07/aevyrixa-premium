-- Noromi Care: test/live order provenance foundation.
-- STAGED ONLY. Do not execute against production until an approved release
-- explicitly authorizes historical classification and the paired read-path
-- changes have been validated together.
--
-- All 21 order references below were confirmed by the store owner to be tests.
-- Never classify by date, status, amount, customer details, or order_source.
-- The DB baseline deliberately rejects is_test_order/test_order fallback columns.
-- record_scope is a NEW explicit production contract, not that legacy fallback.
--
-- This migration is transactional. Any unexpected production order fails the
-- historical classification preflight before introducing the new column.
-- New customer-facing checkout orders default to live automatically.
-- Existing invoices/ledger entries retain their original rows and join to
-- their order's immutable classification by order_ref.

do $order_scope$
declare
  v_existing_column boolean;
  v_total bigint;
  v_expected bigint;
begin
  -- Prevent concurrent checkout inserts during the exactly-matched preflight.
  lock table public.orders in share row exclusive mode;

  select exists (
    select 1 from information_schema.columns
    where table_schema = 'public'
      and table_name = 'orders'
      and column_name = 'record_scope'
  ) into v_existing_column;

  if not v_existing_column then
    select count(*) into v_total from public.orders;
    select count(*) into v_expected from public.orders
    where order_ref in (
      'AEV-MP5UO6JY-AB9F',
      'AEV-MP5V6YMA-OI0T',
      'AEV-MP5WLSIS-V48T',
      'AEV-MP5X5EOA-PDNE',
      'AEV-MP78L3HS-T9QX',
      'AEV-MP78WA7Z-3ZTO',
      'PHASE161-20260516030256',
      'AEV-MP7D7LPR-YZLT',
      'AEV-MP7E1E6A-1J0Q',
      'AEV-MP7EAAKS-F8OT',
      'AEV-MP7EK525-47O2',
      'AEV-MP7FCO2V-4AAV',
      'AEV-MP7FKY3I-ARSK',
      'AEV-MP7HRWFY-G2GL',
      'AEV-MP9XZO2R-7BW3',
      'AEV-MPBF81X6-5O8O',
      'AEV-MPBH836H-2SCS',
      'AEV-MPBPKXLD-K4B8',
      'AEV-MPBTGMS2-UZXK',
      'AEV-MUB2WPT4-T8TV',
      'AEV-MUC4VJUI-60BW'
    );

    if v_total <> 21 or v_expected <> 21 then
      raise exception
        'record_scope migration preflight failed: expected exactly 21 verified historical test order refs, found total %, matching %. Stop and review new/unrecognized orders.',
        v_total, v_expected;
    end if;

    alter table public.orders
      add column record_scope text not null default 'live';

    update public.orders
      set record_scope = 'test'
    where order_ref in (
      'AEV-MP5UO6JY-AB9F',
      'AEV-MP5V6YMA-OI0T',
      'AEV-MP5WLSIS-V48T',
      'AEV-MP5X5EOA-PDNE',
      'AEV-MP78L3HS-T9QX',
      'AEV-MP78WA7Z-3ZTO',
      'PHASE161-20260516030256',
      'AEV-MP7D7LPR-YZLT',
      'AEV-MP7E1E6A-1J0Q',
      'AEV-MP7EAAKS-F8OT',
      'AEV-MP7EK525-47O2',
      'AEV-MP7FCO2V-4AAV',
      'AEV-MP7FKY3I-ARSK',
      'AEV-MP7HRWFY-G2GL',
      'AEV-MP9XZO2R-7BW3',
      'AEV-MPBF81X6-5O8O',
      'AEV-MPBH836H-2SCS',
      'AEV-MPBPKXLD-K4B8',
      'AEV-MPBTGMS2-UZXK',
      'AEV-MUB2WPT4-T8TV',
      'AEV-MUC4VJUI-60BW'
    );

    if (select count(*) from public.orders where record_scope = 'test') <> 21
       or (select count(*) from public.orders where record_scope = 'live') <> 0 then
      raise exception 'record_scope test-order classification invariant failed';
    end if;
  else
    if not exists (
      select 1 from information_schema.columns
      where table_schema='public' and table_name='orders'
        and column_name='record_scope'
        and data_type='text' and is_nullable='NO'
    ) then
      raise exception 'orders.record_scope already exists but does not match the expected contract';
    end if;
  end if;
end;
$order_scope$;

do $order_scope_constraint$
begin
  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.orders'::regclass
      and conname = 'orders_record_scope_valid'
  ) then
    alter table public.orders
      add constraint orders_record_scope_valid check (record_scope in ('live','test'));
  end if;
end;
$order_scope_constraint$;

create index if not exists orders_record_scope_created_idx
  on public.orders (record_scope, created_at desc);

comment on column public.orders.record_scope is
  'Immutable historical provenance: live customer business or explicitly authorized test. Does not indicate payment settlement.';

-- Reclassification must go through a separately reviewed and auditable
-- database migration, never a storefront payload or ordinary admin PATCH.
create or replace function public.protect_order_record_scope()
returns trigger language plpgsql
set search_path = 'pg_catalog', 'public'
as $protect$
begin
  if new.record_scope is distinct from old.record_scope then
    raise exception 'Changing order record_scope requires a reviewed data migration'
      using errcode = '23514';
  end if;
  return new;
end;
$protect$;

drop trigger if exists orders_protect_record_scope on public.orders;
create trigger orders_protect_record_scope
before update of record_scope on public.orders
for each row execute function public.protect_order_record_scope();

-- No financial ledger rows, invoice snapshots, prices, payment state, due,
-- delivery history, or archived state are modified by this migration.
