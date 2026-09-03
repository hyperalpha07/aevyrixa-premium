# Phase 2.2 Admin V2 Orders Backend Plan

## Current Schema Discovered

Local project documentation and server adapters identify the current order backend as Supabase `public.orders` accessed only from server route handlers with the service-role key.

Verified locally from `docs/backend-setup.md`, `docs/admin-v2/orders-data-map.md`, and `app/lib/order-store.ts`:

- `orders.id`: documented as `uuid primary key default gen_random_uuid()`.
- `orders.order_ref`: documented as `text not null unique` and used as the application-facing reference.
- `orders`: customer scalar fields, `items jsonb`, `subtotal`, `total`, payment method/detail fields, `status`, `created_at`, `updated_at`, and operational fields such as courier/tracking/payment/delivery metadata.
- `admin_staff.id`: treated as an opaque string by the TypeScript server code; the corrected migration does not assume it is UUID.
- Customer account IDs: `orders.customer_id` is treated as optional text by the current order adapter; the corrected migration records the observed live types during preflight and does not add an unsafe FK.

The v2 migration also performs live catalog preflight checks at execution time and aborts if the target project differs from these assumptions.

## Reviewed Additive Schema

Use only `docs/20260614_admin_v2_orders_backend_v2.sql`. The original `docs/20260614_admin_v2_orders_backend.sql` is retained only for audit comparison.

- `orders`: add only missing operational columns. Financial fields are nullable and have non-negative checks, with no silent zero defaults.
- Lifecycle: add only `archived_at` as the canonical new lifecycle field. Existing `deleted_at` or `soft_deleted_at` columns, if already present, are not dropped or modified.
- `order_notes`: keyed by `order_ref`, with body/type validation, JSON-object metadata, real/nullable actor fields, timestamps, supported `deleted_at`, and an `updated_at` trigger.
- `order_events`: append-only workflow events keyed by `order_ref`, with status/event validation, JSON-object metadata, and real/nullable actor fields.
- `invoices`: explicit non-negative amounts, uppercase three-letter currency, JSON-object snapshot with required invoice keys, deterministic unique invoice number, and one active issued invoice per order.

## Relationship Strategy

The application currently writes dependent records by `order_ref`. The corrected migration keeps that compatible strategy only after proving `orders.order_ref` is a safe referenced key:

- Abort if `orders.order_ref` is missing, not `text`, null/blank, or duplicated.
- Reuse an existing primary/unique constraint when present.
- Create `orders_order_ref_unique` only after the duplicate and blank preflight passes.
- Use `order_ref` FKs for `order_notes`, `order_events`, and `invoices`.
- Do not add an `admin_staff.id` FK because the live type is not assumed; actor IDs are stored as text and must come from trusted server code.

## Indexes

The corrected migration creates indexes only after confirming the target columns exist:

- `orders`: `order_ref`, `status`, `payment_status`, `delivery_status`, `created_at`, `total`, `payment_method`.
- `order_notes`: `(order_ref, created_at desc)` for non-deleted notes, plus `updated_at`.
- `order_events`: `(order_ref, created_at asc)` and `created_at desc`.
- `invoices`: `order_ref` and `created_at desc`.

It intentionally avoids new `customer_phone` and `customer_email` indexes. Broad `ILIKE '%term%'` search needs a separately reviewed `pg_trgm` strategy; normal B-tree indexes are not enough for that query shape.

## RLS And Security

New tables enable RLS, revoke direct privileges from `PUBLIC`, `anon`, and `authenticated`, and grant minimum table privileges only to `service_role`.

The status RPC and helper functions:

- Use a fixed safe `search_path`.
- Revoke execute from `PUBLIC`, `anon`, and `authenticated`.
- Grant execute only to `service_role`.
- Return only `order_ref`, `previous_status`, `current_status`, and `updated_at`.
- Never return complete `orders` rows or customer PII.

Admin endpoints must continue to authenticate sessions and enforce permissions before calling Supabase with the service-role key.

## Status Transition Rules

The database function validates the same project statuses used by the app:

- `Pending -> Confirmed | Cancelled`
- `Confirmed -> Shipped | Pending | Cancelled`
- `Shipped -> Delivered | Confirmed | Cancelled`
- `Delivered -> Shipped`

It rejects unknown/empty statuses, missing orders, no-op transitions, invalid transitions, cancellation without reason, and sensitive reversals without an authorization reason.

## Financial Backward Compatibility

Historical financial values are unknown unless already persisted. The migration therefore leaves these new columns nullable:

- `discount_amount`
- `paid_amount`
- `due_amount`
- `refunded_amount`
- `currency_code`

New order and invoice writes must supply explicit values when known. Historical `NULL` values display as `Not provided`; they are not backfilled with zeros.

## Migration And Rollback Strategy

Run `docs/20260614_admin_v2_orders_backend_v2.sql` manually only after review. The migration is wrapped in `BEGIN`/`COMMIT`, performs preflight checks before dependent objects, and avoids production data rewrites.

Rollback should disable or deploy back application code first. Schema rollback, if needed, must be a separate reviewed script and should preserve production records unless the business explicitly approves removing unused new schema.
