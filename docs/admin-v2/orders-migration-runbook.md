# Orders Migration Runbook

Migration file: `docs/20260614_admin_v2_orders_backend.sql`.

1. Review the SQL locally. Confirm it is additive only.
2. Open Supabase SQL Editor for the target project.
3. Paste the SQL and run it manually.
4. Verify tables: `order_notes`, `order_events`, `invoices`.
5. Verify indexes for `orders`, `order_notes`, `order_events`, and `invoices`.
6. Verify RLS is enabled on new tables and only service-role policies exist.
7. Deploy code only after the migration is applied.
8. Run a non-production note/invoice/status workflow or an isolated test order.
9. Rollback safely by deploying previous code first. Only then consider dropping the new function, policies, indexes, or tables if the new records are not needed.

No secrets are required in the SQL. Do not paste service-role keys into SQL comments or logs.
