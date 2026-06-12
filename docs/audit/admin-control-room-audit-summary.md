# Admin Control Room Audit Summary

Audit date: June 2, 2026

## Scope

This summary covers the Aevyrixa Her Care admin panel audit. No app code, styling, database schema, migrations, Supabase data, or fallback data were changed.

## Key Findings

- The admin routing is real and split across `app/admin/*/page.tsx`, but all routes render the same shared `AdminPanel` with a fixed `view` prop.
- Most page content still lives in `app/admin/admin-panel.tsx`; Reviews and Settings use separate active components.
- Orders, Products, Reviews, Settings, Support, Customers, and Staff have real backend/API integration.
- Media, Discounts, Integrations, Billing, and large parts of Analytics are mostly visual/demo.
- Customers has real API loading, but the UI switches to demo records when fewer than 9 live customers exist, which can hide real data.
- Products has the strongest live CRUD implementation, including create/edit/status/soft delete/restore/permanent delete.
- Reviews has live single-review moderation but staged bulk controls and no real export.
- Support has live conversation reply/status flows when real conversations exist, but many detail, macro, channel, attachment, and escalation controls are visual.
- Staff has live create/edit/toggle flows, but invitation, role matrix editing, approvals, security settings, and export are visual.
- Settings saves real `store_settings`, but many toggles/buttons are fixed, no-op, or visual-only.
- Risky actions need a shared confirmation/approval/audit system before final production polish.

## Highest Priority Work

1. Add shared admin modal/drawer/action/confirmation components.
2. Replace browser confirms/prompts for destructive actions.
3. Remove or clearly gate misleading fallback/demo data, starting with Customers.
4. Build missing order notes and invoice surfaces.
5. Create a real media library backend and wire Media page actions.
6. Add PII export confirmations and audit logging.
7. Build guarded integration key/webhook workflows.
8. Replace hardcoded Billing/Analytics/Discounts data with real tables or provider APIs.

## Files Created For This Audit

- `docs/audit/admin-control-room-full-audit.md`
- `docs/audit/admin-control-room-audit-summary.md`
- `docs/audit/admin-control-room-full-audit.zip`
