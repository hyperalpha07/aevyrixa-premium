import {
  adminPermissionKeys,
  permissionGroups,
  roleDefaultPermissions,
  roleLabels,
  type AdminPermission,
  type AdminRole,
} from "@/app/lib/admin-permissions";
import type { AdminStaffRecord } from "@/app/lib/admin-staff";

export const roleDirectoryOrder: AdminRole[] = [
  "manager",
  "order_staff",
  "product_staff",
  "support_staff",
  "viewer",
];

export const ownerRoleKey: AdminRole = "owner";

export type RoleAccessLevel = "full" | "privileged" | "focused" | "read_only";

export type RoleSummary = {
  role: AdminRole;
  label: string;
  purpose: string;
  assignedStaff: number;
  activeStaff: number;
  permissionCount: number;
  accessLevel: RoleAccessLevel;
  protected: boolean;
};

export type RoleComparison = {
  roleA: AdminRole;
  roleB: AdminRole;
  shared: AdminPermission[];
  onlyA: AdminPermission[];
  onlyB: AdminPermission[];
};

export type RolesMetrics = {
  builtInRoles: number;
  activeStaff: number;
  privilegedRoles: number;
  unknownRoleCount: number;
};

export const rolePurposes: Record<AdminRole, string> = {
  owner:
    "Protected system access for the environment-backed owner account. Not created or edited from Staff.",
  manager:
    "Broad operations lead with order, product, support, storefront, analytics, and activity visibility.",
  order_staff:
    "Focused order operations role for fulfilment, courier updates, notes, invoices, and exports.",
  product_staff:
    "Catalog operations role for product content, media, merchandising, reviews, and categories.",
  support_staff:
    "Customer care role for live support visibility, replies, and conversation closing.",
  viewer:
    "Read-mostly role for safe operational visibility without mutation-heavy access.",
};

export function roleAccessLevel(role: AdminRole): RoleAccessLevel {
  if (role === "owner") return "full";
  const count = roleDefaultPermissions[role].length;
  if (count >= 20) return "privileged";
  if (role === "viewer") return "read_only";
  return "focused";
}

export function roleStaff(staff: AdminStaffRecord[], role: AdminRole) {
  return staff.filter((member) => member.role === role);
}

export function buildRoleSummary(role: AdminRole, staff: AdminStaffRecord[]): RoleSummary {
  const members = roleStaff(staff, role);
  return {
    role,
    label: roleLabels[role],
    purpose: rolePurposes[role],
    assignedStaff: members.length,
    activeStaff: members.filter((member) => member.isActive).length,
    permissionCount: roleDefaultPermissions[role].length,
    accessLevel: roleAccessLevel(role),
    protected: role === "owner",
  };
}

export function buildRoleSummaries(staff: AdminStaffRecord[]) {
  return [ownerRoleKey, ...roleDirectoryOrder].map((role) => buildRoleSummary(role, staff));
}

export function rolesMetrics(staff: AdminStaffRecord[]) {
  return {
    builtInRoles: Object.keys(roleLabels).length,
    activeStaff: staff.filter((member) => member.isActive).length,
    privilegedRoles: (Object.keys(roleLabels) as AdminRole[]).filter((role) =>
      ["full", "privileged"].includes(roleAccessLevel(role))
    ).length,
    unknownRoleCount: staff.filter(
      (member) => !Object.prototype.hasOwnProperty.call(roleLabels, member.role)
    ).length,
  } satisfies RolesMetrics;
}

export function compareRoles(roleA: AdminRole, roleB: AdminRole): RoleComparison {
  const permissionsA = new Set(roleDefaultPermissions[roleA]);
  const permissionsB = new Set(roleDefaultPermissions[roleB]);

  return {
    roleA,
    roleB,
    shared: adminPermissionKeys.filter((key) => permissionsA.has(key) && permissionsB.has(key)),
    onlyA: adminPermissionKeys.filter((key) => permissionsA.has(key) && !permissionsB.has(key)),
    onlyB: adminPermissionKeys.filter((key) => !permissionsA.has(key) && permissionsB.has(key)),
  };
}

export function groupedRolePermissions(role: AdminRole) {
  const defaults = new Set(roleDefaultPermissions[role]);
  return permissionGroups.map((group) => ({
    title: group.title,
    permissions: group.permissions.map((permission) => ({
      permission,
      enabled: role === "owner" || defaults.has(permission),
    })),
  }));
}
