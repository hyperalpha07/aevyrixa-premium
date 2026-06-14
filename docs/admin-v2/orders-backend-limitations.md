# Orders Backend Limitations

- Historical detailed timeline events were not stored before Phase 2.2. The UI shows the known created date plus stored events going forward.
- Existing historical financial mismatches are detected, not repaired automatically.
- PDF generation is not added because the project has no compatible PDF library. Invoices remain print/PDF-ready HTML via browser print.
- The current CSV export remains limited to loaded server results to avoid introducing a new PII export surface without a dedicated approval flow.
- Status transition atomicity depends on applying `docs/20260614_admin_v2_orders_backend.sql`, which creates the RPC used by the PATCH route.
