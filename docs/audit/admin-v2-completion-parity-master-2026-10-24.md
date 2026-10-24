# Admin V2 — original scope, parity and launch gates

Status recorded October 24, 2026. **'Route implemented' does not imply full module parity or launch approval.** Owner wants one simple, WordPress-like, reliable desktop-first Admin with full control over the Noromi Care store, while keeping existing functionality, finances and product data intact. Mobile/tablet final pass. No paid integrations, invented business data, or destructive financial writes.

## Scope and honest current baseline

| Area | Current implementation | Full parity still to verify/build |
| --- | --- | --- |
| Dashboard | Real operational cards; some available sources | Source failure paths; no fabricated revenue; links and full staff authorization |
| Orders, invoices | List, status, courier, notes, invoice, live/test isolation | Payment/fulfilment transition invariants, invoice issuance, return linkage; authenticated E2E |
| Products & inventory | Draft creation/edit, publish, real stock controls | All active-product editing, variants, price, full media/SEO, stock/cart checkout propagation, permissions |
| Categories & homepage content | Category management in Classic settings; seven fixed cards; no native parity yet | All 7 status/title/description/URL/sort/media/upload; other homepage content/page/SEO controls |
| Media | Classic mixed real data and static usage mock | Real upload/storage listing, safe delete & metadata, role-gated coverage; no fake storage usage |
| Discounts/coupons | Classic campaign metrics and coupon codes are hardcoded samples | Genuine coupon schema/validation/checkout application/redemption reporting; don't fake campaigns |
| Customers, reviews, support | Native workflows | Permissioned read/write, message history, status propagation, sensitive-data handling and E2E |
| Billing, payments, refunds, expenses & reports | Real source-aware financial ledgers with TEST isolation | No fake zero/source states, payment settlement reconciliation, CSV export, safe refund policies; export enhancement |
| Returns & couriers | Manual LIVE cases and manual shipment assignments | Real hygiene/3-day eligibility, shipment timeline, exchange/stock consequences; optional courier provider integration only with confirmed credentials |
| Staff, roles, approvals, audit | Native access surfaces | Full owner/staff role matrix, denied-action paths, audit trail, rollback |
| Settings | Native core identity/checkout/delivery + Classic advanced | Full group parity, policy, SEO, appearance, homepage, payment methods, notices, safe concurrent edits |
| Integrations, email, automation, webhooks, tax | Partial adapters, placeholders; no credible automated providers | Signed webhooks, retry/idempotency, email provider & records, safe automation, validated applicable tax rules; no false connected badges |
| Kanban, Calendar | Persisted internal task board and due date calendar | Optional advanced scheduling/reminders; lower priority than checkout and content parity |

## Release priority

**P0 — Launch safety:** Auth/RBAC, migration/schema reproducibility, invoice/refund/payment integrity, truthful metrics, source failure states, actual TEST/LIVE separation, secure order-to-checkout flow.

**P1 — Merchandising & operations:** Full product CRUD including live-product edit/variants/media/SEO, seven categories and homepage content, accurate coupons/discounts, customers/support, inventory/cart stock, return hygiene & courier manual operations, native business/settings controls and lawful tax configuration.

**P2 — Quality/advanced:** Legitimate exports/PDF/report scheduling, media vault, CRM extras, verified provider/email integrations, signed webhook reliability, automation with explicit safety guardrails, audit export.

**P3 — Convenience:** Kanban, task Calendar, optional AI helpers. Existing P3 work is not a substitute for P0/P1.

## Mandatory migration and acceptance protocol

1. Preserve `/admin` and `/admin-v2` independently while migrating. For each module check list/detail, read/write, validation, empty/error states, permissions/unauthorized behavior, undo/destructive actions, relevant exports, tests, visual desktop QA and later mobile QA.
2. Keep working Classic paths until native parity is proven; do not unconditionally redirect legacy routes to read-only partial pages.
3. Never present test/synthetic values as live numbers. Historical 21 TEST orders and posted finance entries remain intact. Do not change production inventory or order data during automated QA.
4. All CI regression tests, Next.js/TypeScript production build and deployment checks must pass. Build rate-limits on the free tier are a launch blocker, not a reason to pay or to merge blind.
5. Before final replacement of `/admin`, run authenticated Owner + limited Staff smoke tests and full checkout/payments/order/stock/customer-support E2E against approved test scenarios. Only then redirect old aliases and decommission legacy with rollback.
6. **Do not say 'Admin fully complete' until every P0/P1 feature passes this checklist** and explicit outstanding P2/P3 limitations are clearly labeled.
