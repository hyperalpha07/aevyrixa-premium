import { AdminV2PermissionsView } from "@/components/admin-v2/views/permissions/AdminV2PermissionsView";
import { requireAdminV2Session } from "@/lib/admin-v2/auth";
import { requireAdminV2RouteAccess } from "@/lib/admin-v2/permissions";

export default async function AdminV2PermissionsPage() {
  const session = await requireAdminV2Session();
  requireAdminV2RouteAccess(session, "permissions");

  return <AdminV2PermissionsView />;
}
