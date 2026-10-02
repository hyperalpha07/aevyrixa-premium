import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import {
  adminPermissionKeys,
  normalizePermissions,
  permissionGroups,
  permissionLabels,
  roleDefaultPermissions,
  roleLabels,
  type AdminRole,
} from "../app/lib/admin-permissions.ts";
import type { AdminStaffRecord } from "../app/lib/admin-staff.ts";

const read = (path: string) => readFileSync(new URL(`../${path}`, import.meta.url), "utf8");

const staff = [
  {
    id: "1",
    name: "Mina Manager",
    username: "mina",
    email: "mina@example.com",
    role: "manager",
    permissions: normalizePermissions("manager", {}),
    isActive: true,
  },
  {
    id: "2",
    name: "Rafi Support",
    username: "rafi",
    email: "rafi@example.com",
    role: "support_staff",
    permissions: normalizePermissions("support_staff", {}),
    isActive: false,
  },
] satisfies AdminStaffRecord[];

function compareDefaults(roleA: AdminRole, roleB: AdminRole) {
  const permissionsA = new Set(roleDefaultPermissions[roleA]);
  const permissionsB = new Set(roleDefaultPermissions[roleB]);
  return {
    shared: adminPermissionKeys.filter((key) => permissionsA.has(key) && permissionsB.has(key)),
    onlyA: adminPermissionKeys.filter((key) => permissionsA.has(key) && !permissionsB.has(key)),
    onlyB: adminPermissionKeys.filter((key) => !permissionsA.has(key) && permissionsB.has(key)),
  };
}

function countRoleStaff(role: AdminRole) {
  return staff.filter((member) => member.role === role);
}

test("Roles and Permissions routes are implemented", () => {
  const routes = read("configs/admin-v2/routes.ts");
  assert.match(routes, /title: "Roles"[\s\S]+?module: "roles"[\s\S]+?implemented: true/);
  assert.match(routes, /title: "Permissions"[\s\S]+?module: "permissions"[\s\S]+?implemented: true/);
});

test("Roles page is guarded by the existing staff/security administration boundary", () => {
  const page = read("app/admin-v2/roles/page.tsx");
  const permissions = read("configs/admin-v2/permissions.ts");
  assert.match(page, /requireAdminV2Session\(\)/);
  assert.match(page, /requireAdminV2RouteAccess\(session, "roles"\)/);
  assert.match(permissions, /roles:\s*\{\s*section: "staff"\s*\}/);
});

test("Roles source uses existing role labels, default permissions and permission labels", () => {
  const query = read("lib/admin-v2/roles/roles-query.ts");
  const view = read("components/admin-v2/views/roles/AdminV2RolesView.tsx");
  assert.match(query, /roleLabels/);
  assert.match(query, /roleDefaultPermissions/);
  assert.match(query, /permissionGroups/);
  assert.match(view, /permissionLabels/);
  assert.equal(roleLabels.manager, "Manager");
  assert.ok(roleDefaultPermissions.manager.includes("orders.view"));
  assert.ok(permissionGroups.some((group) => group.title === "Orders"));
  assert.equal(permissionLabels["staff.manage"], "Manage staff");
});

test("Owner is displayed as protected full-access system role", () => {
  const view = read("components/admin-v2/views/roles/AdminV2RolesView.tsx");
  const query = read("lib/admin-v2/roles/roles-query.ts");
  assert.match(query, /protected:\s*role === "owner"/);
  assert.equal(roleDefaultPermissions.owner.length, adminPermissionKeys.length);
  assert.match(view, /Protected System Role/);
  assert.match(view, /Owner access is controlled by the existing environment\/admin authentication/);
});

test("Roles workspace has no role mutation API or fake mutation actions", () => {
  const view = read("components/admin-v2/views/roles/AdminV2RolesView.tsx");
  assert.doesNotMatch(view, /Create Role|Edit Role|Delete Role|Duplicate Role|Custom Role|Save Changes/i);
  assert.doesNotMatch(view, /fetch\([^)]*\/api\/admin\/roles/);
  assert.doesNotMatch(view, /method:\s*"(POST|PATCH|DELETE)"/);
});

test("Real staff API is used for role usage counts and assigned staff", () => {
  const view = read("components/admin-v2/views/roles/AdminV2RolesView.tsx");
  assert.match(view, /fetch\("\/api\/admin\/staff"/);
  assert.match(view, /staff\.filter\(\(member\) => member\.role === selected\.role\)/);
  assert.equal(countRoleStaff("manager").length, 1);
  assert.equal(countRoleStaff("manager").filter((member) => member.isActive).length, 1);
  assert.equal(countRoleStaff("support_staff").filter((member) => member.isActive).length, 0);
});

test("Unknown roles are counted safely without inventing roles", () => {
  const query = read("lib/admin-v2/roles/roles-query.ts");
  assert.match(query, /unknownRoleCount/);
  assert.match(query, /hasOwnProperty\.call\(roleLabels, member\.role\)/);
});

test("Role comparison logic uses default permissions only", () => {
  const query = read("lib/admin-v2/roles/roles-query.ts");
  assert.match(query, /export function compareRoles/);
  assert.match(query, /roleDefaultPermissions\[roleA\]/);
  assert.match(query, /roleDefaultPermissions\[roleB\]/);
  const comparison = compareDefaults("order_staff", "support_staff");
  assert.ok(comparison.shared.includes("dashboard.view"));
  assert.ok(comparison.onlyA.includes("orders.view"));
  assert.ok(comparison.onlyB.includes("support.reply"));
  assert.equal(comparison.onlyA.includes("support.reply"), false);
  assert.equal(comparison.onlyB.includes("orders.editStatus"), false);
});

test("Grouped role permissions mirror existing permission groups", () => {
  const query = read("lib/admin-v2/roles/roles-query.ts");
  assert.match(query, /export function groupedRolePermissions/);
  assert.match(query, /permissionGroups\.map/);
  const viewerDefaults = new Set(roleDefaultPermissions.viewer);
  const grouped = permissionGroups.map((group) => ({
    title: group.title,
    permissions: group.permissions.map((permission) => ({
      permission,
      enabled: viewerDefaults.has(permission),
    })),
  }));
  assert.deepEqual(grouped.map((group) => group.title), permissionGroups.map((group) => group.title));
  assert.equal(grouped.find((group) => group.title === "Admin")?.permissions.some((item) => item.permission === "staff.manage" && item.enabled), false);
});
