import { hasPermission } from "@/app/lib/admin-permissions";
import { AdminV2StaffView } from "@/components/admin-v2/views/staff/AdminV2StaffView";
import { requireAdminV2Session } from "@/lib/admin-v2/auth";
import { requireAdminV2RouteAccess } from "@/lib/admin-v2/permissions";
import { parseStaffRoleFilter, parseStaffStatusFilter } from "@/lib/admin-v2/staff/staff-query";

export default async function AdminV2StaffPage(props: PageProps<"/admin-v2/staff">) {
  const session = await requireAdminV2Session();
  requireAdminV2RouteAccess(session, "staff");
  const search = await props.searchParams;
  const query = typeof search.q === "string" ? search.q.slice(0, 140) : "";
  const role = parseStaffRoleFilter(typeof search.role === "string" ? search.role : undefined);
  const status = parseStaffStatusFilter(typeof search.status === "string" ? search.status : undefined);
  return <AdminV2StaffView
    initialQuery={query}
    initialRole={role}
    initialStatus={status}
    permissions={{
      canManageStaff: hasPermission(session, "staff.manage"),
      canViewActivity: hasPermission(session, "activity.view"),
    }}
  />;
}
