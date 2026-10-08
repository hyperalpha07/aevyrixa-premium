import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { registerHooks } from "node:module";
import path from "node:path";
import { test } from "node:test";
import { fileURLToPath, pathToFileURL } from "node:url";
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
const { __auditLogStoreTest } = await import("../lib/admin-v2/audit-logs/audit-log-store.ts");
hooks.deregister();

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
  assert.match(routes, /title: "Approvals"[\s\S]+?module: "approvals"[\s\S]+?implemented: true/);
});

test("Audit Logs access requires activity.view and uses the Admin V2 server boundary", () => {
  const page = read("app/admin-v2/audit-logs/page.tsx");
  const permissions = read("configs/admin-v2/permissions.ts");
  assert.match(page, /requireAdminV2Session\(\)/);
  assert.match(page, /requireAdminV2RouteAccess\(session, "auditLogs"\)/);
  assert.match(permissions, /auditLogs:\s*\{\s*permission: "activity\.view"\s*\}/);
  assert.doesNotMatch(permissions, /auditLogs:\s*\{\s*section: "staff"\s*\}/);
});

test("Audit Logs workspace uses dedicated audit API and no fake audit data", () => {
  const view = read("components/admin-v2/views/audit-logs/AdminV2AuditLogsView.tsx");
  const staffApi = read("app/api/admin/staff/route.ts");
  const auditApi = read("app/api/admin/audit-logs/route.ts");
  const exportApi = read("app/api/admin/audit-logs/export/route.ts");
  assert.match(view, /fetch\(`\/api\/admin\/audit-logs\?/);
  assert.doesNotMatch(view, /fetch\("\/api\/admin\/staff"/);
  assert.match(view, /Export CSV/);
  assert.match(auditApi, /hasPermission\(session, "activity\.view"\)/);
  assert.match(exportApi, /auditLogsCsv/);
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
  assert.doesNotMatch(view, /Delete Log|Clear Logs|Edit Event|Replay Event|Retention|method:\s*"(POST|PATCH|DELETE)"/i);
});

test("dedicated Audit API supports cursor pagination, bounds, filters, CSV and server sanitization", () => {
  const store = read("lib/admin-v2/audit-logs/audit-log-store.ts");
  const auditApi = read("app/api/admin/audit-logs/route.ts");
  const exportApi = read("app/api/admin/audit-logs/export/route.ts");
  assert.match(store, /Math\.min\(Math\.max\(Number\(input\.limit\) \|\| 50, 1\), 100\)/);
  assert.match(store, /order", "created_at\.desc,id\.desc"/);
  assert.match(store, /Buffer\.from\(JSON\.stringify\(\{ createdAt: row\.createdAt, id: row\.id \}\)\)\.toString\("base64url"\)/);
  assert.match(store, /sanitizeMetadata\(row\.metadata/);
  assert.match(store, /\^\\s\*\[=\+\\-@\]/);
  assert.match(store, /while \(pages\.length < 10000\)/);
  assert.match(auditApi, /query: url\.searchParams\.get\("query"\)/);
  assert.match(auditApi, /cursor: url\.searchParams\.get\("cursor"\)/);
  assert.match(exportApi, /content-type": "text\/csv; charset=utf-8"/);
});

test("dedicated Audit API helpers reject malformed cursors and escape spreadsheet formulas", () => {
  assert.throws(() => __auditLogStoreTest.parseCursor("not-a-valid-cursor"), /Invalid audit cursor/);
  assert.equal(__auditLogStoreTest.csvEscape("=1+1"), "\"'=1+1\"");
  assert.equal(__auditLogStoreTest.csvEscape("  @cmd"), "\"'  @cmd\"");
});

test("audit sanitizer covers explicit secret metadata key families and new actor identity", () => {
  const query = read("lib/admin-v2/audit-logs/audit-log-query.ts");
  const staff = read("app/lib/admin-staff.ts");
  for (const token of ["password_hash", "token_hash", "api_key", "authorization", "cookie", "session", "recovery_code", "otp", "totp", "encryption_key"]) {
    assert.match(query, new RegExp(token));
  }
  assert.match(staff, /actor_type: input\.actor\?\.userType \?\? "system"/);
  assert.match(staff, /actor_id:/);
});
