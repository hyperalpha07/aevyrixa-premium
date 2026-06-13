# Admin V2 Route Map

## Core

- `/admin-v2` -> redirects to `/admin-v2/dashboard`
- `/admin-v2/dashboard`

## Commerce

- `/admin-v2/orders`
- `/admin-v2/orders/[orderRef]`
- `/admin-v2/products`
- `/admin-v2/products/new`
- `/admin-v2/products/[productId]`
- `/admin-v2/categories`
- `/admin-v2/inventory`
- `/admin-v2/reviews`
- `/admin-v2/customers`
- `/admin-v2/customers/[customerId]`
- `/admin-v2/returns`
- `/admin-v2/discounts`

## Communication

- `/admin-v2/support`
- `/admin-v2/chat`
- `/admin-v2/email`
- `/admin-v2/notifications`

## Operations

- `/admin-v2/media`
- `/admin-v2/calendar`
- `/admin-v2/kanban`
- `/admin-v2/couriers`
- `/admin-v2/automation`

## Team

- `/admin-v2/staff`
- `/admin-v2/roles`
- `/admin-v2/permissions`
- `/admin-v2/audit-logs`
- `/admin-v2/approvals`

## Analytics and Finance

- `/admin-v2/analytics`
- `/admin-v2/reports`
- `/admin-v2/invoices`
- `/admin-v2/transactions`
- `/admin-v2/expenses`
- `/admin-v2/refunds`
- `/admin-v2/tax`
- `/admin-v2/billing`

## System

- `/admin-v2/settings`
- `/admin-v2/integrations`
- `/admin-v2/webhooks`
- `/admin-v2/system-health`

## Phase 1 Implementation Status

- Dashboard is implemented with real data adapters and honest empty states.
- Planned routes are created as protected placeholders.
- Dynamic detail routes are scaffolded with route params and no fake records.
