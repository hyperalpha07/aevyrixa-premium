import {
  adminPermissionKeys,
  permissionGroups,
  permissionLabels,
  roleDefaultPermissions,
  roleLabels,
  type AdminPermission,
  type AdminRole,
} from "@/app/lib/admin-permissions";
import type { AdminStaffRecord } from "@/app/lib/admin-staff";

export const permissionRoleOrder: AdminRole[] = [
  "manager",
  "order_staff",
  "product_staff",
  "support_staff",
  "viewer",
  "owner",
];

export type PermissionGrantFilter = "all" | "any" | "normal_none" | "wide";

export type PermissionMatrixRow = {
  permission: AdminPermission;
  label: string;
  group: string;
  grants: Record<AdminRole, boolean>;
  normalGrantCount: number;
};

export type StaffPermissionAccess = {
  staff: AdminStaffRecord;
  granted: boolean;
  defaultGranted: boolean;
  override: boolean;
};

export type StaffPermissionOverride = {
  staff: AdminStaffRecord;
  grantedBeyondDefault: AdminPermission[];
  removedFromDefault: AdminPermission[];
  differenceCount: number;
};

export function permissionGroupName(permission: AdminPermission) {
  return (
    permissionGroups.find((group) =>
      (group.permissions as readonly AdminPermission[]).includes(permission)
    )?.title ?? "Other"
  );
}

export function roleHasDefaultPermission(role: AdminRole, permission: AdminPermission) {
  if (role === "owner") return true;
  return roleDefaultPermissions[role]?.includes(permission) === true;
}

export function buildPermissionMatrix() {
  return adminPermissionKeys.map((permission) => {
    const grants = permissionRoleOrder.reduce((result, role) => {
      result[role] = roleHasDefaultPermission(role, permission);
      return result;
    }, {} as Record<AdminRole, boolean>);

    return {
      permission,
      label: permissionLabels[permission],
      group: permissionGroupName(permission),
      grants,
      normalGrantCount: permissionRoleOrder.filter((role) => role !== "owner" && grants[role]).length,
    } satisfies PermissionMatrixRow;
  });
}

export function queryPermissionRows(
  rows: PermissionMatrixRow[],
  query: string,
  group: string,
  grantFilter: PermissionGrantFilter
) {
  const term = query.trim().toLowerCase();
  return rows.filter((row) => {
    if (group !== "all" && row.group !== group) return false;
    if (term && ![row.label, row.permission].some((value) => value.toLowerCase().includes(term))) {
      return false;
    }
    if (grantFilter === "any" && row.normalGrantCount <= 0) return false;
    if (grantFilter === "normal_none" && row.normalGrantCount > 0) return false;
    if (grantFilter === "wide" && row.normalGrantCount < 3) return false;
    return true;
  });
}

export function roleCoverage() {
  return permissionRoleOrder.map((role) => ({
    role,
    label: roleLabels[role],
    count: role === "owner" ? adminPermissionKeys.length : roleDefaultPermissions[role].length,
    total: adminPermissionKeys.length,
  }));
}

export function effectiveStaffAccess(staff: AdminStaffRecord[], permission: AdminPermission) {
  return staff.map((member) => {
    const defaultGranted = roleHasDefaultPermission(member.role, permission);
    const granted = member.role === "owner" ? true : member.permissions?.[permission] === true;
    return {
      staff: member,
      granted,
      defaultGranted,
      override: granted !== defaultGranted,
    } satisfies StaffPermissionAccess;
  });
}

export function staffPermissionOverrides(staff: AdminStaffRecord[]) {
  return staff
    .map((member) => {
      const grantedBeyondDefault: AdminPermission[] = [];
      const removedFromDefault: AdminPermission[] = [];

      for (const permission of adminPermissionKeys) {
        const defaultGranted = roleHasDefaultPermission(member.role, permission);
        const granted = member.role === "owner" ? true : member.permissions?.[permission] === true;
        if (granted && !defaultGranted) grantedBeyondDefault.push(permission);
        if (!granted && defaultGranted) removedFromDefault.push(permission);
      }

      return {
        staff: member,
        grantedBeyondDefault,
        removedFromDefault,
        differenceCount: grantedBeyondDefault.length + removedFromDefault.length,
      } satisfies StaffPermissionOverride;
    })
    .filter((item) => item.differenceCount > 0);
}

export function permissionsMetrics(staff: AdminStaffRecord[]) {
  return {
    totalPermissions: adminPermissionKeys.length,
    permissionGroups: permissionGroups.length,
    builtInRoles: Object.keys(roleLabels).length,
    staffOverrides: staffPermissionOverrides(staff).length,
  };
}
