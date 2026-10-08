import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { registerHooks } from "node:module";
import path from "node:path";
import { test } from "node:test";
import { fileURLToPath, pathToFileURL } from "node:url";
import { adminPermissionKeys, hasPermission, normalizePermissions, roleDefaultPermissions } from "../app/lib/admin-permissions.ts";
import { adminV2AccessRules } from "../configs/admin-v2/permissions.ts";
import { findAdminV2Route } from "../configs/admin-v2/routes.ts";

const read = (path: string) => readFileSync(new URL(`../${path}`, import.meta.url), "utf8");
const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const hooks = registerHooks({
  resolve(specifier, context, nextResolve) {
    if (specifier.startsWith("@/")) {
      const target = path.join(repoRoot, specifier.slice(2));
      return nextResolve(pathToFileURL(existsSync(target) ? target : `${target}.ts`).href, context);
    }
    if ((specifier.startsWith("./") || specifier.startsWith("../")) && context.parentURL) {
      const target = path.resolve(path.dirname(fileURLToPath(context.parentURL)), specifier);
      if (!path.extname(target) && existsSync(`${target}.ts`)) {
        return nextResolve(pathToFileURL(`${target}.ts`).href, context);
      }
    }
    return nextResolve(specifier, context);
  },
});
const { __approvalStoreTest } = await import("../lib/admin-v2/approvals/approvals-store.ts");
hooks.deregister();
const migration = read("supabase/migrations/20261008090000_admin_audit_approvals_finalization.sql");
const store = read("lib/admin-v2/approvals/approvals-store.ts");
const page = read("app/admin-v2/approvals/page.tsx");
const view = read("components/admin-v2/views/approvals/AdminV2ApprovalsView.tsx");

test("Approvals route is implemented, protected by approvals.view, and placeholder is removed", () => {
  assert.equal(findAdminV2Route("approvals")?.implemented, true);
  assert.deepEqual(adminV2AccessRules.approvals, { permission: "approvals.view" });
  assert.match(page, /requireAdminV2RouteAccess\(session, "approvals"\)/);
  assert.doesNotMatch(page, /AdminV2ModulePage/);
  assert.match(view, /Governance decisions are recorded here/);
  assert.match(view, /Approved means decision recorded; it does not execute a business action/);
});

test("approval permissions and system role defaults are catalogued", () => {
  for (const key of ["approvals.view", "approvals.request", "approvals.decide"] as const) {
    assert.ok(adminPermissionKeys.includes(key));
  }
  assert.ok(hasPermission({ userType: "owner", username: "admin", displayName: "Owner", role: "owner", permissions: normalizePermissions("owner", {}) }, "approvals.decide"));
  assert.ok(roleDefaultPermissions.manager.includes("approvals.decide"));
  for (const role of ["order_staff", "product_staff", "support_staff"]) {
    assert.ok(roleDefaultPermissions[role].includes("approvals.view"));
    assert.ok(roleDefaultPermissions[role].includes("approvals.request"));
    assert.equal(roleDefaultPermissions[role].includes("approvals.decide"), false);
  }
  assert.equal(roleDefaultPermissions.viewer.includes("approvals.view"), false);
});

test("approval migration creates request and immutable event infrastructure with service-role-only ACL", () => {
  assert.match(migration, /create table if not exists public\.admin_approval_requests/);
  assert.match(migration, /create table if not exists public\.admin_approval_events/);
  assert.match(migration, /references public\.admin_approval_requests\(id\) on delete restrict/i);
  assert.match(migration, /create trigger admin_approval_requests_event_trigger[\s\S]+after insert or update/i);
  assert.match(migration, /insert into public\.admin_approval_events[\s\S]+requested/i);
  assert.match(migration, /old\.status = 'pending' and new\.status in \('approved', 'rejected', 'cancelled'\)/);
  assert.match(migration, /alter table public\.admin_approval_requests enable row level security/i);
  assert.match(migration, /alter table public\.admin_approval_events enable row level security/i);
  assert.match(migration, /revoke all on table public\.admin_approval_requests from public, anon, authenticated, service_role/i);
  assert.match(migration, /grant select, insert, update on table public\.admin_approval_requests to service_role/i);
  assert.match(migration, /grant select, insert on table public\.admin_approval_events to service_role/i);
  assert.doesNotMatch(migration, /grant\s+[^;]*(?:delete|truncate|trigger|references)[^;]*on table public\.admin_approval/i);
});

test("approval migration validates statuses, categories, actors and additive role defaults", () => {
  assert.match(migration, /status in \('pending', 'approved', 'rejected', 'cancelled'\)/);
  assert.match(migration, /category in \('access', 'operations', 'finance', 'customer', 'content', 'settings', 'other'\)/);
  assert.match(migration, /requested_by_type in \('owner', 'staff', 'system'\)/);
  assert.match(migration, /resolved_by_type is null or resolved_by_type in \('owner', 'staff', 'system'\)/);
  assert.match(migration, /permissions = coalesce\(permissions, '\{\}'::jsonb\) \|\| '\{"approvals\.view": true, "approvals\.request": true, "approvals\.decide": true\}'::jsonb/);
  assert.match(migration, /where key in \('order_staff', 'product_staff', 'support_staff'\) and is_system = true/);
});

test("approval API routes enforce permissions and do not trust client actor identity", () => {
  const rootRoute = read("app/api/admin/approvals/route.ts");
  const detailRoute = read("app/api/admin/approvals/[id]/route.ts");
  const decisionRoute = read("app/api/admin/approvals/[id]/decision/route.ts");
  const cancelRoute = read("app/api/admin/approvals/[id]/cancel/route.ts");
  assert.match(rootRoute, /hasPermission\(session, "approvals\.view"\)/);
  assert.match(rootRoute, /hasPermission\(session, "approvals\.request"\)/);
  assert.match(detailRoute, /hasPermission\(session, "approvals\.view"\)/);
  assert.match(decisionRoute, /hasPermission\(session, "approvals\.decide"\)/);
  assert.match(cancelRoute, /hasPermission\(session, "approvals\.view"\)/);
  assert.match(store, /requested_by_type: actorType\(session\)/);
  assert.match(store, /requested_by_id: actorId\(session\)/);
  assert.match(store, /resolved_by_type: actorType\(session\)/);
  assert.doesNotMatch(store, /payload\.requested_by|payload\.resolved_by|input\.actor/i);
});

test("approval validation rejects sensitive payloads and unsafe business execution claims", () => {
  assert.match(store, /Buffer\.byteLength\(serialized, "utf8"\) > 16 \* 1024/);
  assert.match(store, /password\|passwordhash\|secret\|token\|tokenhash\|apikey\|authorization\|cookie\|session\|recoverycode\|otp\|totp\|encryptionkey\|mfa/i);
  assert.match(store, /Action key must be a stable lowercase identifier/);
  assert.doesNotMatch(view, /Action executed|Execute approved/i);
});

test("approval create validation rejects altered categories, truncation attempts and camelCase secrets", () => {
  const basePayload = {
    title: "Approve temporary access",
    category: "access",
    actionKey: "access.temp",
    summary: "Review a temporary access change.",
    reason: "Manager requested an accountable decision.",
    payload: { staffId: "staff-1" },
  };
  assert.doesNotThrow(() => __approvalStoreTest.validateCreatePayload(basePayload));
  assert.throws(() => __approvalStoreTest.validateCreatePayload({ ...basePayload, category: "unsafe" }), /supported approval category/);
  assert.throws(() => __approvalStoreTest.validateCreatePayload({ ...basePayload, title: "x".repeat(161) }), /160 characters/);
  assert.throws(() => __approvalStoreTest.validateCreatePayload({ ...basePayload, payload: { apiKey: "secret" } }), /sensitive/);
  assert.throws(() => __approvalStoreTest.validateCreatePayload({ ...basePayload, payload: { nested: [{ recoveryCode: "secret" }] } }), /sensitive/);
});

test("approval visibility, decisions, self-approval, cancellation and concurrency are enforced server-side", () => {
  assert.match(store, /requestVisibilityParams/);
  assert.match(store, /hasPermission\(session, "approvals\.decide"\)/);
  assert.match(store, /Staff cannot decide their own approval request/);
  assert.match(store, /Owner self-decision requires a note/);
  assert.match(store, /Rejection note is required/);
  assert.match(store, /new URLSearchParams\(\{ id: `eq\.\$\{id\}`, status: "eq\.pending", select: "\*" \}\)/);
  assert.match(store, /Approval request is already resolved\.", 409/);
  assert.match(store, /Only the requester or owner can cancel this request/);
});

test("approval central audit events contain concise safe metadata only", () => {
  for (const action of ["approval.requested", "approval.approved", "approval.rejected", "approval.cancelled"]) {
    assert.match(store, new RegExp(action.replace(".", "\\.")));
  }
  assert.match(store, /metadata: \{ reference: existing\.reference, category: existing\.category, action_key: existing\.actionKey, subject_type: existing\.subjectType, subject_id: existing\.subjectId, status:/);
  assert.doesNotMatch(store, /metadata:[\s\S]{0,160}(reason|resolution_note|requestPayload|request_payload)/);
});

test("Approvals UI exposes real request, decision, cancellation and event-history flows", () => {
  assert.match(view, /fetch\("\/api\/admin\/approvals"/);
  assert.match(view, /\/api\/admin\/approvals\/\$\{encodeURIComponent\(selected\.id\)\}\/decision/);
  assert.match(view, /\/api\/admin\/approvals\/\$\{encodeURIComponent\(selected\.id\)\}\/cancel/);
  assert.match(view, /Event history/);
  assert.match(view, /Create approval request/);
  assert.match(view, /Owner self-decision override requires a note/);
  assert.match(view, /Safe payload summary[\s\S]+maxHeight: 220[\s\S]+overflow: "auto"/);
});
