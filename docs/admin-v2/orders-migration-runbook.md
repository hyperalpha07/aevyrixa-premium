# Orders Migration Runbook

Current reviewed migration file: `docs/20260614_admin_v2_orders_backend_v4.sql`.

Previous reviewed migration: `docs/20260614_admin_v2_orders_backend_v3.sql`.

Source reviewed migration: `docs/20260614_admin_v2_orders_backend_v2.sql`.

Original audit file retained for comparison only: `docs/20260614_admin_v2_orders_backend.sql`.

Do not apply the original, V2, or V3 migration. Do not run any migration from application startup, CI, or deployment hooks.

## V3 Failed Preflight Outcome

V3 execution failed before schema changes with:

```text
ERROR: 42883: operator does not exist: name[] = text[]
```

The transaction rollback was confirmed. No Admin V2 orders tables, functions, or policies were created by the failed V3 attempt. The root cause was a catalog comparison where `array_agg(pg_attribute.attname)` produced `name[]` and was compared to a `text[]` literal. V4 applies explicit catalog type normalization by casting `attname` to `text` and casting comparison literals to `text[]`.

## Manual Application Order

1. Deploy or verify server code compatible with V4:
   - no fake `Owner` actor or issuer values;
   - status rollback/cancellation requests include `p_sensitive_authorization_reason`;
   - invoice issuance uses `admin_v2_next_invoice_number(order_ref, issued_at)`;
   - unique invoice conflicts retry safely or return the existing same-order issued invoice.
2. Run local non-destructive build/tests.
3. Review `docs/20260614_admin_v2_orders_backend_v4.sql`.
4. Run the preflight-only queries below in the target Supabase project.
5. If any unexpected value or incompatible type appears, stop and map/fix manually.
6. Open Supabase SQL Editor for the target project.
7. Paste and run `docs/20260614_admin_v2_orders_backend_v4.sql` manually in one execution.
8. Run the post-migration verification queries below.
9. Exercise a non-production or isolated test order through trusted server APIs only.

## Supported Status Values

- `orders.status`: `Pending`, `Confirmed`, `Shipped`, `Delivered`, `Cancelled`.
- `orders.payment_status`: `pending`, `verified`, `failed`, `refunded`.
- `orders.delivery_status`: `pending`, `processing`, `packed`, `dispatched`, `in_transit`, `delivered`, `failed`, `returned`.

`Cancelled` is terminal. Backward transitions and cancellations require a trusted authorization reason. Cancellation also requires a cancellation reason.

## Expected Existing Types

Required before V4:

```sql
select
  a.attname,
  format_type(a.atttypid, a.atttypmod) as actual_type
from pg_attribute a
where a.attrelid = 'public.orders'::regclass
  and a.attname in ('id', 'order_ref', 'status', 'updated_at')
  and not a.attisdropped
order by a.attname;
```

Expected:

- `id`: `uuid`
- `order_ref`: `text`
- `status`: `text`
- `updated_at`: `timestamp with time zone`

Optional columns must have these exact types if present:

```sql
select
  a.attname,
  format_type(a.atttypid, a.atttypmod) as actual_type
from pg_attribute a
where a.attrelid = 'public.orders'::regclass
  and a.attname in (
    'customer_id',
    'delivery_status',
    'delivery_area',
    'delivery_zone',
    'payment_status',
    'payment_reference',
    'payment_note',
    'archived_at',
    'cancelled_reason',
    'discount_amount',
    'paid_amount',
    'due_amount',
    'refunded_amount',
    'currency_code',
    'payment_verified_at'
  )
  and not a.attisdropped
order by a.attname;
```

Expected optional types:

- Text: `customer_id`, `delivery_status`, `delivery_area`, `delivery_zone`, `payment_status`, `payment_reference`, `payment_note`, `cancelled_reason`, `currency_code`.
- Numeric: `discount_amount`, `paid_amount`, `due_amount`, `refunded_amount`.
- Timestamp: `archived_at`, `payment_verified_at`.

Historical financial fields remain nullable.

## Preflight-Only Verification Queries

Run these before executing V4. They do not modify data.

```sql
select distinct status
from public.orders
where status is not null
  and status not in ('Pending', 'Confirmed', 'Shipped', 'Delivered', 'Cancelled')
order by status;
```

```sql
select distinct payment_status
from public.orders
where payment_status is not null
  and payment_status not in ('pending', 'verified', 'failed', 'refunded')
order by payment_status;
```

```sql
select distinct delivery_status
from public.orders
where delivery_status is not null
  and delivery_status not in ('pending', 'processing', 'packed', 'dispatched', 'in_transit', 'delivered', 'failed', 'returned')
order by delivery_status;
```

```sql
select order_ref, count(*)
from public.orders
group by order_ref
having order_ref is null or btrim(order_ref) = '' or count(*) > 1;
```

This catalog check must return `true` or `false` without a type error. It validates the V4 `attname::text`/`text[]` normalization used for the `orders.order_ref` uniqueness preflight.

```sql
select exists (
  select 1
  from pg_constraint c
  join unnest(c.conkey) with ordinality ck(attnum, ord) on true
  join pg_attribute a
    on a.attrelid = c.conrelid
   and a.attnum = ck.attnum
  where c.conrelid = 'public.orders'::regclass
    and c.contype in ('p', 'u')
  group by c.oid
  having array_agg(a.attname::text order by ck.ord)
         = array['order_ref']::text[]
) as order_ref_is_unique;
```

```sql
select
  table_name,
  column_name,
  data_type,
  udt_name
from information_schema.columns
where table_schema = 'public'
  and table_name in ('order_notes', 'order_events', 'invoices')
order by table_name, ordinal_position;
```

If `order_notes`, `order_events`, or `invoices` already exists, confirm the table is a compatible V2/V3/V4 version. If it is an incompatible partial original migration, stop and review manually.

## V4 Target Table Handling

V4 is intended to be safe when:

- no earlier migration was applied;
- V4 is rerun after a successful V4 application;
- reviewed V2 or V3 was applied and needs V4 hardening.

V4 aborts when pre-existing target tables have missing/wrong-type required columns, missing primary keys, missing `order_ref -> orders(order_ref)` foreign keys, or non-unique invoice numbers.

## Invoice Numbering Strategy

V4 creates:

- `public.admin_v2_invoice_number_seq`
- `public.admin_v2_next_invoice_number(p_order_ref text, p_issued_at timestamptz default now())`

The function returns `AEV-INV-YYYYMMDD-000001` style numbers using a database sequence, so concurrent invoice requests cannot generate the same number. `invoices.invoice_number` remains unique. `invoices_one_issued_per_order_idx` continues to allow only one issued invoice per order.

Server code must call this function when issuing invoices. The old app helper that builds `AEV-INV-YYYYMMDD-{order_ref}` is deterministic but is not the final V4 concurrency strategy.

## Actor Integrity Rules

- Admin note/event actor: `actor_source = 'admin'` plus `created_by_admin_id`/`actor_admin_id` or `created_by_name`/`actor_name`.
- System note/event actor: `actor_source = 'system'`, name exactly `System`, no fake admin ID.
- Unknown note/event actor: allowed only for genuine identity gaps; application logs should explain why.
- Issued invoice: `actor_source = 'admin'` with real admin ID/name, or `actor_source = 'system'` with `issued_by = 'System'`.
- `Owner`, ` owner `, `OWNER`, and other normalized equivalents are rejected.

## Post-Migration Verification Queries

```sql
select to_regclass('public.order_notes') as order_notes,
       to_regclass('public.order_events') as order_events,
       to_regclass('public.invoices') as invoices;
```

```sql
select conrelid::regclass as table_name, conname, pg_get_constraintdef(oid) as definition
from pg_constraint
where conrelid in ('public.order_notes'::regclass, 'public.order_events'::regclass, 'public.invoices'::regclass)
  and conname in (
    'order_notes_actor_integrity',
    'order_events_actor_integrity',
    'invoices_actor_source_valid',
    'invoices_issuer_integrity',
    'invoices_snapshot_size'
  )
order by table_name::text, conname;
```

```sql
select proname, pg_get_function_identity_arguments(oid) as args, prosecdef
from pg_proc
where pronamespace = 'public'::regnamespace
  and proname in (
    'admin_v2_update_order_status_with_event',
    'admin_v2_is_valid_status_transition',
    'admin_v2_is_sensitive_status_transition',
    'admin_v2_next_invoice_number'
  )
order by proname, args;
```

```sql
select routine_schema, routine_name, grantee, privilege_type
from information_schema.routine_privileges
where routine_schema = 'public'
  and routine_name in (
    'admin_v2_update_order_status_with_event',
    'admin_v2_is_valid_status_transition',
    'admin_v2_is_sensitive_status_transition',
    'admin_v2_next_invoice_number'
  )
order by routine_name, grantee;
```

Expected function privileges: no `PUBLIC`, `anon`, or `authenticated`; `service_role` only.

```sql
select schemaname, tablename, policyname
from pg_policies
where schemaname = 'public'
  and tablename in ('order_notes', 'order_events', 'invoices')
order by tablename, policyname;
```

```sql
select indexname, indexdef
from pg_indexes
where schemaname = 'public'
  and indexname in ('invoices_one_issued_per_order_idx', 'invoices_order_ref_idx', 'order_events_order_ref_created_at_idx', 'order_notes_order_ref_created_at_idx')
order by indexname;
```

## Rollback / Deactivation Sequence

Rollback starts with application behavior, not production data deletion.

1. Disable Admin V2 order note/event/invoice/status-write UI actions, or deploy the previous server code.
2. Revoke service access to V4 write RPCs if an immediate database-side stop is needed:

```sql
revoke execute on function public.admin_v2_update_order_status_with_event(text, text, text, text, text, jsonb, text, text) from service_role;
revoke execute on function public.admin_v2_next_invoice_number(text, timestamptz) from service_role;
```

3. Keep created audit records in place by default.
4. Use a separate reviewed rollback script only if schema removal is required.
5. Never use `DELETE`, `TRUNCATE`, or production order rewrites as routine rollback.

## Safety Rules

- Do not run V4 automatically.
- Do not modify production order data manually as part of the migration.
- Do not backfill historical financial values.
- Do not fabricate historical order events.
- Do not create PII indexes for `customer_phone` or `customer_email`.
- Do not paste service-role keys into SQL comments or logs.
