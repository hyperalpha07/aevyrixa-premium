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
  type AdminPermission,
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
    permissions: normalizePermissions("manager", {
      "settings.editSensitive": true,
      "orders.export": false,
    }),
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

function roleHasDefaultPermission(role: AdminRole, permission: AdminPermission) {
  if (role === "owner") return true;
  return roleDefaultPermissions[role].includes(permission);
}

function staffOverrides(member: AdminStaffRecord) {
  const grantedBeyondDefault: AdminPermission[] = [];
  const removedFromDefault: AdminPermission[] = [];

  for (const permission of adminPermissionKeys) {
    const actual = member.permissions[permission] === true;
    const expected = roleHasDefaultPermission(member.role, permission);
    if (actual && !expected) grantedBeyondDefault.push(permission);
    if (!actual && expected) removedFromDefault.push(permission);
  }

  return { grantedBeyondDefault, removedFromDefault };
}

test("Permissions route is implemented while Staff and Roles remain implemented", () => {
  const routes = read("configs/admin-v2/routes.ts");
  assert.match(routes, /title: "Staff"[\s\S]+?module: "staff"[\s\S]+?implemented: true/);
  assert.match(routes, /title: "Roles"[\s\S]+?module: "roles"[\s\S]+?implemented: true/);
  assert.match(routes, /title: "Permissions"[\s\S]+?module: "permissions"[\s\S]+?implemented: true/);
});

test("Permissions access remains staff.manage and uses the Admin V2 server boundary", () => {
  const page = read("app/admin-v2/permissions/page.tsx");
  const permissions = read("configs/admin-v2/permissions.ts");
  assert.match(page, /requireAdminV2Session\(\)/);
  assert.match(page, /requireAdminV2RouteAccess\(session, "permissions"\)/);
  assert.match(permissions, /permissions:\s*\{\s*permission: "staff\.manage"\s*\}/);
  assert.doesNotMatch(permissions, /permissions:\s*\{\s*section: "staff"\s*\}/);
});

test("Permissions workspace uses existing permission source of truth", () => {
  const query = read("lib/admin-v2/permissions/permissions-query.ts");
  const view = read("components/admin-v2/views/permissions/AdminV2PermissionsView.tsx");
  assert.match(query, /adminPermissionKeys/);
  assert.match(query, /permissionLabels/);
  assert.match(query, /permissionGroups/);
  assert.match(query, /roleDefaultPermissions/);
  assert.match(view, /permissionLabels/);
  assert.equal(permissionLabels["orders.view"], "View orders");
  assert.equal(permissionLabels["support.manage"], "Manage support assignment, labels, saved replies, priority, and escalation");
  assert.ok(permissionGroups.some((group) => group.title === "Support"));
  assert.ok(roleDefaultPermissions.manager.includes("support.reply"));
  assert.ok(roleDefaultPermissions.manager.includes("support.manage"));
  assert.ok(roleDefaultPermissions.support_staff.includes("support.manage"));
});

test("Owner is treated as full protected access", () => {
  const query = read("lib/admin-v2/permissions/permissions-query.ts");
  const view = read("components/admin-v2/views/permissions/AdminV2PermissionsView.tsx");
  assert.match(query, /if \(role === "owner"\) return true/);
  assert.match(view, /Owner access is controlled by the protected admin authentication path/);
  assert.equal(adminPermissionKeys.every((permission) => roleHasDefaultPermission("owner", permission)), true);
});

test("Matrix and filters are permission-centric and read-only", () => {
  const view = read("components/admin-v2/views/permissions/AdminV2PermissionsView.tsx");
  assert.match(view, /Permission Matrix/);
  assert.match(view, /Search permission label or key/);
  assert.match(view, /All Groups/);
  assert.match(view, /Granted to any role/);
  assert.match(view, /Owner-only \/ none/);
  assert.match(view, /Widely granted/);
  assert.doesNotMatch(view, /Save Permissions|Edit Permissions|Create Permission|Delete Permission|Custom Permission|Bulk grant|Bulk revoke/i);
});

test("Real staff API is used for effective access and Manage Staff Access links to Staff", () => {
  const view = read("components/admin-v2/views/permissions/AdminV2PermissionsView.tsx");
  assert.match(view, /fetch\("\/api\/admin\/staff"/);
  assert.match(view, /Manage Staff Access/);
  assert.match(view, /href="\/admin-v2\/staff"/);
  assert.match(view, /Real staff access/);
});

test("Effective access uses actual staff permission map, not role label inference", () => {
  const query = read("lib/admin-v2/permissions/permissions-query.ts");
  assert.match(query, /member\.permissions\?\.\[permission\] === true/);
  const manager = staff[0];
  assert.equal(manager.permissions["settings.editSensitive"], true);
  assert.equal(roleHasDefaultPermission(manager.role, "settings.editSensitive"), false);
});

test("Override detection compares actual permissions against role defaults", () => {
  const query = read("lib/admin-v2/permissions/permissions-query.ts");
  assert.match(query, /staffPermissionOverrides/);
  assert.match(query, /roleHasDefaultPermission\(member\.role, permission\)/);
  const overrides = staffOverrides(staff[0]);
  assert.ok(overrides.grantedBeyondDefault.includes("settings.editSensitive"));
  assert.ok(overrides.removedFromDefault.includes("orders.export"));
});

test("Unknown or malformed values are handled without granting unknown permissions", () => {
  const query = read("lib/admin-v2/permissions/permissions-query.ts");
  assert.match(query, /roleDefaultPermissions\[role\]\?\.includes\(permission\) === true/);
  assert.equal(adminPermissionKeys.includes("not.real" as AdminPermission), false);
  const normalized = normalizePermissions("viewer", { "not.real": true });
  assert.equal(Object.prototype.hasOwnProperty.call(normalized, "not.real"), false);
});

test("No permission mutation API is introduced", () => {
  const view = read("components/admin-v2/views/permissions/AdminV2PermissionsView.tsx");
  assert.doesNotMatch(view, /\/api\/admin\/permissions/);
  assert.doesNotMatch(view, /method:\s*"(POST|PATCH|DELETE)"/);
});
