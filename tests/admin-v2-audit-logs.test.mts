import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import type { StaffActivityLog } from "../app/lib/admin-staff.ts";
import {
  auditLogMetrics,
  humanizeAction,
  humanizeTarget,
  isSecurityEvent,
  queryAuditLogs,
  sanitizeMetadata,
  sortAuditLogsNewestFirst,
  summarizeMetadata,
} from "../lib/admin-v2/audit-logs/audit-log-query.ts";

const read = (path: string) => readFileSync(new URL(`../${path}`, import.meta.url), "utf8");

const logs = [
  {
    id: "3",
    actorName: "Mina Manager",
    action: "permission.denied",
    targetType: "staff",
    targetId: "create",
    metadata: { reason: "missing_permission", token: "secret-token" },
    createdAt: "2026-10-03T01:00:00.000Z",
  },
  {
    id: "2",
    actorName: "Rafi Support",
    action: "staff.updated",
    targetType: "staff",
    targetId: "staff-1",
    metadata: { role: "support_staff", nested: { password_hash: "hidden", safe: true } },
    createdAt: "2026-09-28T01:00:00.000Z",
  },
  {
    id: "1",
    actorName: "Owner",
    action: "custom.unknown_event",
    targetType: "settings",
    targetId: "global",
    metadata: { note: "legacy import" },
    createdAt: "2026-09-01T01:00:00.000Z",
  },
] satisfies StaffActivityLog[];

test("Audit Logs route is implemented while related route flags stay scoped", () => {
  const routes = read("configs/admin-v2/routes.ts");
  assert.match(routes, /title: "Audit Logs"[\s\S]+?module: "auditLogs"[\s\S]+?implemented: true/);
  assert.match(routes, /title: "Staff"[\s\S]+?module: "staff"[\s\S]+?implemented: true/);
  assert.match(routes, /title: "Roles"[\s\S]+?module: "roles"[\s\S]+?implemented: true/);
  assert.match(routes, /title: "Permissions"[\s\S]+?module: "permissions"[\s\S]+?implemented: true/);
  assert.match(routes, /title: "Approvals"[\s\S]+?module: "approvals"[\s\S]+?implemented: false/);
});

test("Audit Logs access requires activity.view and uses the Admin V2 server boundary", () => {
  const page = read("app/admin-v2/audit-logs/page.tsx");
  const permissions = read("configs/admin-v2/permissions.ts");
  assert.match(page, /requireAdminV2Session\(\)/);
  assert.match(page, /requireAdminV2RouteAccess\(session, "auditLogs"\)/);
  assert.match(permissions, /auditLogs:\s*\{\s*permission: "activity\.view"\s*\}/);
  assert.doesNotMatch(permissions, /auditLogs:\s*\{\s*section: "staff"\s*\}/);
});

test("Audit Logs workspace uses real staff activity API and no fake audit data", () => {
  const view = read("components/admin-v2/views/audit-logs/AdminV2AuditLogsView.tsx");
  const staffApi = read("app/api/admin/staff/route.ts");
  assert.match(view, /fetch\("\/api\/admin\/staff"/);
  assert.match(view, /activityLogs/);
  assert.match(staffApi, /hasPermission\(session, "activity\.view"\) \? listActivityLogs\(\)/);
  assert.doesNotMatch(view, /mock|fixture|demo audit|sample log|fake/i);
});

test("newest-first activity order is preserved and helper labels are safe", () => {
  assert.deepEqual(sortAuditLogsNewestFirst([...logs].reverse()).map((log) => log.id), ["3", "2", "1"]);
  assert.equal(humanizeAction("staff.updated"), "Staff Updated");
  assert.equal(humanizeAction("custom.unknown_event"), "Custom Unknown Event");
  assert.equal(humanizeTarget("staff", "staff-1"), "Staff · staff-1");
  assert.equal(humanizeTarget(undefined, undefined), "No target");
});

test("search and filters use real actor, action, target and metadata text", () => {
  assert.deepEqual(queryAuditLogs(logs, { query: "rafi", action: "all", actor: "all", targetType: "all", timeRange: "all" }).map((log) => log.id), ["2"]);
  assert.deepEqual(queryAuditLogs(logs, { query: "legacy", action: "all", actor: "all", targetType: "all", timeRange: "all" }).map((log) => log.id), ["1"]);
  assert.deepEqual(queryAuditLogs(logs, { query: "", action: "permission.denied", actor: "all", targetType: "all", timeRange: "all" }).map((log) => log.id), ["3"]);
  assert.deepEqual(queryAuditLogs(logs, { query: "", action: "all", actor: "Owner", targetType: "settings", timeRange: "all" }).map((log) => log.id), ["1"]);
});

test("time filters and metrics derive from real timestamps", () => {
  const now = Date.parse("2026-10-03T12:00:00.000Z");
  assert.deepEqual(queryAuditLogs(logs, { query: "", action: "all", actor: "all", targetType: "all", timeRange: "24h" }, now).map((log) => log.id), ["3"]);
  assert.deepEqual(queryAuditLogs(logs, { query: "", action: "all", actor: "all", targetType: "all", timeRange: "7d" }, now).map((log) => log.id), ["3", "2"]);
  assert.deepEqual(auditLogMetrics(logs, now), { total: 3, actors: 3, securityEvents: 1, recent24h: 1 });
  assert.equal(isSecurityEvent(logs[0]), true);
  assert.equal(isSecurityEvent(logs[1]), false);
});

test("metadata sanitizer recursively removes secret-like keys", () => {
  const sanitized = sanitizeMetadata({
    username: "mina",
    password: "remove",
    nested: {
      api_key: "remove",
      visible: "keep",
      list: [{ token: "remove", ok: true }],
    },
  });
  assert.deepEqual(sanitized, { username: "mina", nested: { visible: "keep", list: [{ ok: true }] } });
  const summary = summarizeMetadata(sanitized, 4);
  assert.match(summary, /username: mina/);
  assert.match(summary, /nested\.visible: keep/);
  assert.doesNotMatch(summary, /password|api_key|token|remove/i);
});

test("detail view is read-only and exposes no mutation controls", () => {
  const view = read("components/admin-v2/views/audit-logs/AdminV2AuditLogsView.tsx");
  assert.match(view, /Audit logs are read-only in Admin V2/);
  assert.match(view, /Safe metadata/);
  assert.doesNotMatch(view, /Delete Log|Clear Logs|Edit Event|Replay Event|Export CSV|Export Logs|Retention|method:\s*"(POST|PATCH|DELETE)"/i);
});
