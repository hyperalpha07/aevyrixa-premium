import type { AdminRole } from "@/app/lib/admin-permissions";
import type { AdminStaffRecord, StaffActivityLog } from "@/app/lib/admin-staff";

export type StaffRoleFilter = "all" | Exclude<AdminRole, "owner">;
export type StaffStatusFilter = "all" | "active" | "inactive";

export function parseStaffRoleFilter(value: string | null | undefined): StaffRoleFilter {
  return value === "manager" || value === "order_staff" || value === "product_staff" || value === "support_staff" || value === "viewer" ? value : "all";
}

export function parseStaffStatusFilter(value: string | null | undefined): StaffStatusFilter {
  return value === "active" || value === "inactive" ? value : "all";
}

export function staffListHref(query: string, role: StaffRoleFilter, status: StaffStatusFilter) {
  const params = new URLSearchParams();
  if (query.trim()) params.set("q", query.trim());
  if (role !== "all") params.set("role", role);
  if (status !== "all") params.set("status", status);
  return `/admin-v2/staff${params.size ? `?${params}` : ""}`;
}

export function queryStaff(staff: AdminStaffRecord[], query: string, role: StaffRoleFilter, status: StaffStatusFilter) {
  const term = query.trim().toLowerCase();
  return staff.filter(member => {
    if (role !== "all" && member.role !== role) return false;
    if (status === "active" && !member.isActive) return false;
    if (status === "inactive" && member.isActive) return false;
    return !term || [member.name, member.username, member.email].some(value => value.toLowerCase().includes(term));
  });
}

export function staffMetrics(staff: AdminStaffRecord[]) {
  return {
    total: staff.length,
    active: staff.filter(member => member.isActive).length,
    inactive: staff.filter(member => !member.isActive).length,
    managers: staff.filter(member => member.role === "manager").length,
  };
}

export function safeActivitySummary(log: StaffActivityLog) {
  const metadata = Object.entries(log.metadata ?? {})
    .filter(([key]) => !/password|secret|token|hash|key/i.test(key))
    .slice(0, 3)
    .map(([key, value]) => `${key}: ${typeof value === "string" || typeof value === "number" || typeof value === "boolean" ? String(value) : "updated"}`);
  return metadata.join(" · ");
}
