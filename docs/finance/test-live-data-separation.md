# Noromi Care — Test/Live financial data separation (staged foundation)

## Verified facts and boundaries

- Production currently has **21** orders, all explicitly confirmed by the store owner as test orders.
- The existing `orders` schema does **not** contain a persisted test/live designation.
- `OrderRecord.isTestOrder` exists in TypeScript as a legacy compatibility field but the reproducible database baseline expressly rejects `is_test_order` / `test_order` fallback columns.
- Invoice, payment, refund, and linked-expense rows have order references; **their cash amounts must never be rewritten** just to classify test provenance.
- Existing billing metrics are operational order/ledger snapshots, **not externally verified bank settlement**.
- Screenshot reviews with synthetic fixtures do not prove live classification is correct.

## Contract

The staged migration adds `orders.record_scope text not null default 'live'`, constrained to `live` or `test`. It is historical *provenance*, independent of `orders.order_source`, payment status, cancelled status, invoices, and delivery events.

Historical test orders are identified using **exactly 21 unique persisted order references** confirmed by the owner. Do **not** infer classification from date, name, amount, the checkout source, or status. The migration explicitly fails before the column is added if the production set differs. It is safe to stop and reconcile, not safe to widen the predicate to `created_at < ...`.

New customer-facing checkout rows take the server/database default `live`. The public request must never accept an untrusted client-provided `record_scope`. Any future test-order insertion needs a separately authorized and auditable administrative workflow; do not repurpose normal checkout to write test orders. An update trigger makes a recorded order's classification immutable in normal application workflows.

## Separation contract (before launch)

The migration is **only phase A**. Do not apply/deploy phase A on its own to claim completion.

Implement the following with shared query-level scope handling, paginated counts, and matching exports:

1. **Orders:** admin operations can still inspect both scopes, visibly labeled. Customer purchase records must not be silently reclassified, and an admin filter should support Live / Test / All.
2. **Analytics & Reports:** default live-only; an explicitly labeled test review mode, authorized and clearly excluded from live totals. Enforce filters in the database BEFORE pagination and aggregates, not after fetching arbitrary pages. Export must use the identical scope as the UI.
3. **Billing due/reconciliation:** live-only for overview metrics. Diagnostics must offer separate live/test views and clearly identify provenance, preserving historic test exceptions without cluttering live business reporting.
4. **Invoices and payment ledgers:** derive classification by the trusted order's `order_ref` relation, never by document status, actor, or payment method. Live-only business totals, with accessible, permission-protected test history.
5. **Refunds & expenses:** refunds inherit scope from their order. For expenses with nullable `order_ref`, introduce explicit server-authored provenance before advertising live-only global expense totals; unknown or unclassified money must be treated as **unknown**, never silently counted as live.
6. **Dashboard and exports:** all owner-facing financial totals and exported figures must explain their data scope. No fabricated zeroes when a source is unavailable. Mixed currencies remain separated.
7. **Tests:** cover empty-live / populated-test scenarios; incoming live checkout; missing source; 10k+ row cap; scope filters before pagination; test payments/refunds/invoices; legacy missing due; disabled exports on incomplete datasets; unauthorized access and CSV parity.

**Security:** Do not broaden access to the order table, financial ledgers, or diagnostic endpoints. Respect existing Admin V2 permissions. No public writable classification API.

## Coordinated release gates

A. **Baseline:** read-only snapshot of order refs/count (all statuses), linked invoices, payments, refunds, expenses; check migration SQL against this snapshot. Expected order refs/count must still match on release day.

B. **Database:** backup and rehearse in staging; explicitly approve classification data write; apply migration atomically, verify exactly 21 `test` and no `live` historical rows. Database deployment and app read-path update must be coordinated. A partial release must not silently show test money as live.

C. **Application:** implement all finance read/query/export scope paths; run full test suite and production build; compare authenticated Billing/Diagnostics, Orders, Analytics, Reports, and ledger views on 1440px/1920px desktop.

D. **After launch:** re-check real test orders, customer-facing checkout orders, and settlement paths. Monitor regression. Do not erase or void historical test invoices or payments.

E. **Fallback:** do not drop the column or move orders back to `live` automatically. If read-path rollout fails, roll back application code to a maintenance/unavailable state for finance totals until safely fixed. Preserve classification and ledger history.

## Current status

The guarded schema migration, explicit finance/query scope implementation, and regression contracts are staged for code review. Deployment remains blocked on CI, end-to-end staging verification, expense scope coverage, and the coordinated release gates above. **No production migration, update, deletion, financial backfill, or release has been executed.**
