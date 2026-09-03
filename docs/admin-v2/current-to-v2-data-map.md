# Current To Admin V2 Data Map

## Authentication

- Current: `app/lib/admin-auth.ts`
- Admin V2: `lib/admin-v2/auth.ts`
- Reuse: `getAdminSession()`, `/api/admin/logout`, `/admin/login`

## Permissions

- Current: `app/lib/admin-permissions.ts`
- Admin V2: `lib/admin-v2/permissions.ts`, `configs/admin-v2/permissions.ts`
- Reuse: `canAccessSection()`, `hasPermission()`, role/session types

## Orders

- Current store: `app/lib/order-store.ts`
- Current API: `app/api/orders/*`
- Admin V2 data: `getAdminV2DashboardData()`
- Rule: use only Supabase-backed orders for V2 metrics. If `storageMode` is `demo-memory`, show zero/unavailable state instead of fake orders.

## Products

- Current store: `app/lib/product-store.ts`
- Current API: `app/api/products/*`
- Admin V2 data: product count and stock status summary
- Rule: product catalog fallback is allowed because it is the existing product catalog surface, not fake transactional data.

## Reviews

- Current store: `app/lib/review-store.ts`
- Current API: `app/api/reviews/*`, `app/api/admin/reviews/*`
- Admin V2 data: review count and pending count only when Supabase review configuration exists.
- Rule: demo review fallback is suppressed in dashboard metrics.

## Customers

- Current store: `app/lib/customer-account-store.ts`
- Current API: `app/api/account/*`, `app/api/admin/customers`
- Admin V2 data: customer count when account storage responds.
- Rule: unavailable customer storage renders zero with a connection note.

## Support

- Current store: `app/lib/support-store.ts`
- Current API: `app/api/support/*`, `app/api/admin/support/*`
- Admin V2 data: open support count when the store responds.

## Staff and Activity

- Current store: `app/lib/admin-staff.ts`
- Current API: `app/api/admin/staff/*`
- Admin V2: placeholders in Phase 1, then staff and audit log modules in a later phase.

## Settings

- Current store: `app/lib/admin-settings.ts`, `app/lib/settings-store.ts`
- Current API: `app/api/settings`
- Admin V2: shell settings are local UI preferences; business settings stay on existing APIs.

## Finance

- Current source: order totals and payment status fields.
- Admin V2: finance routes are placeholders in Phase 1.
- Rule: no fake invoices, transactions, expenses, refunds, or tax records.
