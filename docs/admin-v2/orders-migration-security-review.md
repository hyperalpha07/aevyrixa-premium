# Admin V2 Orders Migration Security Review

Review target: `docs/20260614_admin_v2_orders_backend.sql`.

Reviewed V2 source: `docs/20260614_admin_v2_orders_backend_v2.sql`.

Final reviewed migration: `docs/20260614_admin_v2_orders_backend_v4.sql`.

Previous reviewed migration: `docs/20260614_admin_v2_orders_backend_v3.sql`.

The original, V2, and V3 migrations are preserved for audit comparison. Apply only V4 after server compatibility review.

## V4 Catalog Type Fix

V3 execution failed before schema changes with `ERROR: 42883: operator does not exist: name[] = text[]`. Transaction rollback was confirmed, and no tables, functions, or policies were created by that failed attempt.

The root cause was a PostgreSQL catalog comparison where `array_agg(pg_attribute.attname)` returned `name[]` and was compared to a `text[]` literal. V4 preserves the V3 security and data-safety behavior while explicitly normalizing catalog comparisons to `text[]` with `array_agg(a.attname::text order by ck.ord) = array[...]::text[]`.

## V4 Preserved Fixes

1. Actor integrity is enforced on `order_notes`, `order_events`, and `invoices`.
   - `actor_source = 'admin'` requires a trusted admin ID or admin display name.
   - `actor_source = 'system'` requires `actor_name` or `issued_by` to be exactly `System` and does not require a fake admin ID.
   - `actor_source = 'unknown'` is allowed for notes/events only when the application genuinely cannot identify the actor.
   - Issued invoices cannot be completely unattributed.

2. Fake owner attribution is blocked with normalized validation.
   - V4 uses `lower(btrim(value)) <> 'owner'`.
   - Applied to note creator names, event actor names, invoice issuer names, and status RPC actor validation.
   - Names that merely contain `owner` as part of a longer real name are not rejected.

3. Status reversal rules are centralized.
   - Supported progression: `Pending -> Confirmed -> Shipped -> Delivered`.
   - Cancellation is allowed only from permitted non-final states.
   - `Cancelled` is terminal.
   - No-op and unknown transitions are rejected.
   - `admin_v2_is_sensitive_status_transition` requires an authorization reason for every rollback and for cancellation.

4. Existing production status values are preflighted before schema changes.
   - `orders.status`: `Pending`, `Confirmed`, `Shipped`, `Delivered`, `Cancelled`.
   - `orders.payment_status`: `pending`, `verified`, `failed`, `refunded`.
   - `orders.delivery_status`: `pending`, `processing`, `packed`, `dispatched`, `in_transit`, `delivered`, `failed`, `returned`.
   - Unexpected values abort the transaction and must be mapped manually.

5. Existing column types are preflighted before `ADD COLUMN IF NOT EXISTS`.
   - Required existing types: `orders.status text`, `orders.updated_at timestamp with time zone`, `orders.id uuid`, `orders.order_ref text`.
   - Optional operational columns must be exactly `text`, `numeric`, or `timestamp with time zone` as defined in the runbook if they already exist.
   - V4 does not cast, normalize, or rewrite historical records.

6. Existing target tables are verified before reuse.
   - `order_notes`, `order_events`, and `invoices` must have expected columns, types, primary keys, and `order_ref -> orders(order_ref)` foreign keys.
   - `invoices.invoice_number` must already be unique if `invoices` exists.
   - Incompatible partial migrations abort with a review instruction.

7. Invoice issuer and numbering are hardened.
   - `invoices.actor_source` is added for trusted issuer attribution.
   - Issued invoices require a real admin issuer or genuine system issuer.
   - V4 adds `admin_v2_invoice_number_seq` and `admin_v2_next_invoice_number(order_ref, issued_at)` for concurrency-safe, database-backed invoice numbers in `AEV-INV-YYYYMMDD-000001` format.
   - `invoice_number` remains unique and `invoices_one_issued_per_order_idx` preserves one issued invoice per order.

8. Input size limits are enforced where practical.
   - Reason, cancellation reason, payment note: 1-2000 trimmed characters when present.
   - Actor display/admin identifiers: 1-200 trimmed characters when present.
   - Metadata/snapshot JSON serialized size: 32 KB maximum.

9. Function and privilege restrictions are preserved and expanded.
   - RPCs use fixed `search_path`.
   - Execute is revoked from `PUBLIC`, `anon`, and `authenticated`.
   - Execute is granted only to `service_role`.
   - The status RPC returns only `order_ref`, `previous_status`, `current_status`, and `updated_at`.
   - Obsolete overloads of `admin_v2_update_order_status_with_event` are revoked and removed by name/signature audit.

10. Transaction and data safety remain intact.
    - V4 uses `BEGIN`/`COMMIT`.
    - Preflight runs before schema changes.
    - No `DELETE`, `TRUNCATE`, historical financial backfill, fabricated timeline event backfill, or production data normalization is performed.

## Expected Schema Types

`public.orders`:

| Column | Expected type | Required before V4 |
| --- | --- | --- |
| `id` | `uuid` | yes |
| `order_ref` | `text` | yes |
| `status` | `text` | yes |
| `updated_at` | `timestamp with time zone` | yes |
| `customer_id` | `text` | no |
| `delivery_status` | `text` | no |
| `delivery_area` | `text` | no |
| `delivery_zone` | `text` | no |
| `payment_status` | `text` | no |
| `payment_reference` | `text` | no |
| `payment_note` | `text` | no |
| `archived_at` | `timestamp with time zone` | no |
| `cancelled_reason` | `text` | no |
| `discount_amount` | `numeric` | no |
| `paid_amount` | `numeric` | no |
| `due_amount` | `numeric` | no |
| `refunded_amount` | `numeric` | no |
| `currency_code` | `text` | no |
| `payment_verified_at` | `timestamp with time zone` | no |

Target tables:

- `order_notes`: `id uuid`, `order_ref text`, `note_body text`, `note_type text`, `metadata jsonb`, `created_by_admin_id text`, `created_by_name text`, `actor_source text`, `created_at timestamptz`, `updated_at timestamptz`, `deleted_at timestamptz`.
- `order_events`: `id uuid`, `order_ref text`, `event_type text`, `from_status text`, `to_status text`, `reason text`, `metadata jsonb`, `actor_admin_id text`, `actor_name text`, `actor_source text`, `created_at timestamptz`.
- `invoices`: `id uuid`, `invoice_number text`, `order_ref text`, `status text`, `issued_at timestamptz`, `issued_by_admin_id text`, `issued_by text`, `actor_source text`, amount columns `numeric`, `currency_code text`, `snapshot jsonb`, `created_at timestamptz`.

## Server Compatibility Requirement

Before executing V4, update or verify server code so that:

- Notes/events/invoices never submit `Owner`, including case or whitespace variants.
- Status updates pass `p_sensitive_authorization_reason` for cancellation and all rollback transitions.
- Invoice issuance obtains numbers from `public.admin_v2_next_invoice_number(order_ref, issued_at)` and still handles unique violations by retrying or returning the already issued same-order invoice.
- Only trusted server code using the service role calls the RPCs and writes the new tables.

## Why Production Data Is Not Modified Automatically

Historical discounts, payments, dues, refunds, currencies, invoices, and audit events cannot be reconstructed safely from the current schema. V4 keeps financial fields nullable, adds constraints for future writes, and aborts on unexpected historical status values instead of rewriting them.
