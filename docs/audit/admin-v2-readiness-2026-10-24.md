# Admin V2 launch-readiness audit — 2026-10-24

## Core launch scope

Already native and protected: Dashboard, Orders and details/invoices, Products and draft/publish workflow, Reviews, Customers, Support, Staff, Roles, Permissions, Audit Logs, Approvals, Analytics, Reports, Invoices, Transactions, Expenses, Refunds, Billing and Finance Diagnostics.

This PR adds real, permission-scoped V2 views for **Inventory** (stock quantity and status updates), **Notifications** (derived operational queues; not an unread inbox), and **System Health** (data source availability; not uptime checks). **Chat** uses the existing live Support Inbox with its route guard. All four are clearly scoped to actual functionality.

Existing fully working Classic Admin workflows reachable from V2: **Categories, Discounts, Media, Settings, Integrations**. These remain explicitly marked `Classic` until the native V2 versions replace them; bridges require V2 authorization and the legacy page enforces its own permissions.

## Still placeholders — not complete

| Area | Remaining work |
| --- | --- |
| Returns | Dedicated return authorization, condition, exchange/refund linkage, hygiene policy, history and permissions |
| Email | Provider integration, templates, send permissions, delivery/audit tracking |
| Calendar | Persisted events, schedule permissions, workspace controls |
| Kanban | Backed operational workflow, assignments, persistence |
| Couriers | Provider/rate/status integrations and fulfillment tracking |
| Automation | Server-side rules, approval/safety guardrails, execution logs |
| Tax | Validated tax settings/reporting and applicable rules |
| Webhooks | Signed delivery, retries, secrets, replay protection and event logs |

Do not silently label these eight placeholders complete, infer backend availability, or create false notifications or financial figures. Keep the existing explicit `Soon` badge.

## Launch gating

- All native and bridged navigation routes: verify accessible and unauthorized behavior using an authenticated admin session and constrained staff roles.
- The Inventory stock endpoint must accept only stock status/quantity; it uses a fresh `products.edit` permission and rejects unchanged/mismatched stock values. Do not modify production stock during automated smoke tests.
- Verify stock updates with user-initiated inventory adjustment, check activity log, refresh and storefront display, then validate preorder/stock status across checkout.
- Protect existing 21 historical TEST orders and billing data. No historical finance record mutations.
- GitHub regression, Next.js production build, Vercel preview, and production deploy must pass before release.
- **Admin V2 remains incomplete until eight remaining modules are explicitly implemented or formally removed from launch scope with owner approval.**

This audit does not certify a full production launch, courier integration, payment receipt, or end-to-end buyer checkout.
