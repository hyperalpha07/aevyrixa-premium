import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const read = (p: string) => readFileSync(new URL(`../${p}`, import.meta.url), "utf8");

test("email drafts use an additive service-role-only table with RLS and no delivery queue", () => {
  const sql = read("supabase/migrations/20261120140000_admin_v2_email_drafts.sql");
  assert.match(sql, /create table if not exists public\.admin_email_drafts/);
  assert.match(sql, /enable row level security/);
  assert.match(sql, /revoke all on table public\.admin_email_drafts from public, anon, authenticated/);
  assert.match(sql, /grant select, insert, update on table public\.admin_email_drafts to service_role/);
  assert.match(sql, /revision integer not null default 1/);
  assert.match(sql, /archived_at timestamptz/);
  assert.doesNotMatch(sql, /send_mail|send_email|outbound_queue|delivery_status\s+text/);
});

test("email draft endpoints enforce fresh least-privilege view and manage permissions", () => {
  const collection = read("app/api/admin-v2/email-drafts/route.ts");
  const detail = read("app/api/admin-v2/email-drafts/[id]/route.ts");
  assert.match(collection, /verifyFreshAdminRequestPermission\(request, "email.view"\)/);
  assert.match(collection, /verifyFreshAdminRequestPermission\(request, "email.manage"\)/);
  assert.match(detail, /verifyFreshAdminRequestPermission\(request, "email.manage"\)/);
  assert.match(detail, /revision/);
  assert.match(detail, /email_draft.archived/);
  assert.match(collection, /logStaffActivity/);
  assert.doesNotMatch(collection + detail, /sendMail\(|sendMessage\(|smtp|resend\.emails/);
});

test("draft editing uses optimistic concurrency and soft archive only", () => {
  const store = read("lib/admin-v2/email-drafts-store.ts");
  assert.match(store, /revision=eq\.\$\{revision\}/);
  assert.match(store, /archived_at=is\.null/);
  assert.match(store, /revision: revision \+ 1/);
  assert.match(store, /archived_at: new Date\(\)\.toISOString\(\)/);
  assert.match(store, /length > 20000/);
  assert.match(store, /emailPattern\.test\(toAddress\)/);
  assert.doesNotMatch(store, /method: "DELETE"/);
});

test("email UI persists real drafts and never simulates inbox or delivery", () => {
  const page = read("app/admin-v2/email/page.tsx");
  const view = read("components/admin-v2/views/email/AdminV2EmailDraftWorkspace.tsx");
  assert.match(page, /requireAdminV2RouteAccess\(session, "email"\)/);
  assert.match(page, /listEmailDrafts\(\)/);
  assert.match(page, /hasPermission\(session, "email.manage"\)/);
  assert.match(view, /No email is sent, received, queued or marked delivered/);
  assert.match(view, /Save draft/);
  assert.match(view, /Send unavailable/);
  assert.match(view, /email-drafts/);
  assert.match(view, /Concurrent edits are rejected rather than overwritten/);
});

test("email route and role model grant access explicitly rather than reusing support permission", () => {
  const perms = read("app/lib/admin-permissions.ts");
  const routes = read("configs/admin-v2/routes.ts");
  const rules = read("configs/admin-v2/permissions.ts");
  assert.match(perms, /"email.view"/);
  assert.match(perms, /"email.manage"/);
  assert.match(rules, /email: \{ permission: "email.view" \}/);
  assert.match(routes, /module: "email"[^\n]+implemented: true/);
});
