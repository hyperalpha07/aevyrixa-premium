# Phase 2.2 Admin V2 Orders Backend Plan

## Current Schema Discovered

Read-only Supabase REST OpenAPI metadata on 2026-06-14 exposed:

- `orders`: `id`, `order_ref`, customer fields, delivery address fields, `items`, `subtotal`, `total`, payment method/detail fields, `status`, timestamps, courier fields, `delivery_charge`, confirmation/payment verification/refund/proof/internal/source/staff fields.
- `admin_staff`: staff identity, role, permission, status, login, timestamps.
- `admin_staff_activity_logs`: staff actor, action, target, metadata, timestamp.
- Not exposed: `order_notes`, `order_events`, `invoices`, `transactions`.

The live `orders` table already has `subtotal`, `total`, and `delivery_charge`, so Phase 2.2 does not add duplicate subtotal/total/delivery amount columns.

## Proposed Additive Schema

- `order_notes` keyed by `order_ref` with body, type, admin actor, timestamps, and `deleted_at`.
- `order_events` keyed by `order_ref` with event type, status transition fields, reason, safe metadata, actor, timestamp.
- `invoices` keyed by `order_ref` with unique `invoice_number`, issued status/time/actor, explicit totals, currency, and immutable snapshot.
- Missing `orders` columns only: `payment_status`, `delivery_status`, `payment_reference`, `payment_note`, archive/delete flags, explicit discount/paid/due/refunded/currency/payment verification timestamp fields.

## Relationships

- `order_notes.order_ref -> orders.order_ref`
- `order_events.order_ref -> orders.order_ref`
- `invoices.order_ref -> orders.order_ref`
- actor IDs reference `admin_staff.id` where a staff session exists; owner sessions store actor name only.

## Indexes

Indexes are added for order reference, status, payment status, delivery status, payment method, created date, total sorting, customer phone/email search, note/event timelines, and invoice lookup/date.

## RLS And Security

New tables enable RLS and allow only `service_role`. The app already keeps service-role use in server route handlers and never imports it into Client Components. Admin endpoints still verify signed admin session cookies and permission utilities before returning or mutating data.

## Backward Compatibility

All SQL is `create table if not exists`, `add column if not exists`, or `create index if not exists`. Existing columns are not renamed or deleted. Checkout inserts retry without optional new columns if the migration has not been applied.

## Migration And Rollback Strategy

Run `docs/20260614_admin_v2_orders_backend.sql` manually after review. Rollback should disable new code first, then drop policies/functions/tables only if no production data is needed. Do not backfill totals automatically; use the read-only audit script.
