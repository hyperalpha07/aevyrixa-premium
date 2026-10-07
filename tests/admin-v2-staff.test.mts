import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { adminPermissionKeys, normalizePermissions, roleDefaultPermissions } from "../app/lib/admin-permissions.ts";
import { parseStaffRoleFilter, parseStaffStatusFilter, queryStaff, staffMetrics } from "../lib/admin-v2/staff/staff-query.ts";

const read = (path: string) => readFileSync(new URL(`../${path}`, import.meta.url), "utf8");

const staff = [
  { id: "1", name: "Mina Manager", username: "mina", email: "mina@example.com", role: "manager" as const, permissions: normalizePermissions("manager", {}), isActive: true },
  { id: "2", name: "Rafi Support", username: "rafi", email: "rafi@example.com", role: "support_staff" as const, permissions: normalizePermissions("support_staff", {}), isActive: false },
];

test("Staff, Roles and Permissions routes are implemented", () => {
  const routes = read("configs/admin-v2/routes.ts");
  assert.match(routes, /title: "Staff"[\s\S]+?module: "staff"[\s\S]+?implemented: true/);
  assert.match(routes, /title: "Roles"[\s\S]+?module: "roles"[\s\S]+?implemented: true/);
  assert.match(routes, /title: "Permissions"[\s\S]+?module: "permissions"[\s\S]+?implemented: true/);
});

test("Staff page is guarded and passes independent staff/activity permissions", () => {
  const page = read("app/admin-v2/staff/page.tsx");
  assert.match(page, /requireAdminV2Session\(\)/);
  assert.match(page, /requireAdminV2RouteAccess\(session, "staff"\)/);
  assert.match(page, /canManageStaff: hasPermission\(session, "staff.manage"\)/);
  assert.match(page, /canViewActivity: hasPermission\(session, "activity.view"\)/);
});

test("Staff query supports search, role filter, status filter and real metrics", () => {
  assert.equal(parseStaffRoleFilter("owner"), "all");
  assert.equal(parseStaffRoleFilter("support_staff"), "support_staff");
  assert.equal(parseStaffStatusFilter("inactive"), "inactive");
  assert.deepEqual(staffMetrics(staff), { total: 2, active: 1, inactive: 1, managers: 1 });
  assert.deepEqual(queryStaff(staff, "rafi", "all", "all").map(member => member.id), ["2"]);
  assert.deepEqual(queryStaff(staff, "", "support_staff", "inactive").map(member => member.id), ["2"]);
});

test("Staff APIs use existing backend, reject owner creation and require create password", () => {
  const route = read("app/api/admin/staff/route.ts");
  assert.match(route, /listStaff\(\)/);
  assert.match(route, /listActivityLogs\(\)/);
  assert.match(route, /createStaff\(/);
  assert.match(route, /Owner staff accounts cannot be created from this UI/);
  assert.match(route, /Temporary password is required/);
  assert.match(route, /permissionsFromPayload/);
});

test("Staff edit route keeps password reset optional and rejects owner role", () => {
  const route = read("app/api/admin/staff/[id]/route.ts");
  assert.match(route, /updateStaff\(/);
  assert.match(route, /Owner role is reserved/);
  assert.match(route, /password: password \|\| undefined/);
  assert.match(route, /Reset password must be at least 8 characters/);
});

test("Staff view uses real API, full permission map and role defaults", () => {
  const view = read("components/admin-v2/views/staff/AdminV2StaffView.tsx");
  assert.match(view, /fetch\("\/api\/admin\/staff"/);
  assert.match(view, /fetch\(creating \? "\/api\/admin\/staff" : `\/api\/admin\/staff\/\$\{encodeURIComponent\(draft\.id!\)\}`/);
  assert.match(view, /permissions: draft\.permissions/);
  assert.match(view, /roleDefaultPermissions/);
  assert.match(view, /editableRoles/);
  assert.doesNotMatch(view, /owner[",]?\s*\]/);
  for (const key of adminPermissionKeys) assert.equal(typeof normalizePermissions("viewer", {})[key], "boolean");
  assert.ok(roleDefaultPermissions.manager.includes("staff.manage") || roleDefaultPermissions.manager.includes("activity.view"));
});

test("Activity logs sanitize metadata while Staff security uses real invite/reset/session APIs", () => {
  const query = read("lib/admin-v2/staff/staff-query.ts");
  const view = read("components/admin-v2/views/staff/AdminV2StaffView.tsx");
  assert.match(query, /password\|secret\|token\|hash\|key/i);
  assert.match(view, /ActivityLog/);
  assert.match(view, /Create Invite Link/);
  assert.match(view, /\/api\/admin\/staff\/invites/);
  assert.match(view, /Create Reset Link/);
  assert.match(view, /\/api\/admin\/staff\/\$\{encodeURIComponent\(member\.id\)\}\/sessions/);
  assert.doesNotMatch(view, /Email sent|Invite by email|2FA enabled/i);
});
