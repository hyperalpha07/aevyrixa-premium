import { AdminV2RolesView } from "@/components/admin-v2/views/roles/AdminV2RolesView";
import { requireAdminV2Session } from "@/lib/admin-v2/auth";
import { requireAdminV2RouteAccess } from "@/lib/admin-v2/permissions";

export default async function AdminV2RolesPage() {
  const session = await requireAdminV2Session();
  requireAdminV2RouteAccess(session, "roles");

  return <AdminV2RolesView />;
}
