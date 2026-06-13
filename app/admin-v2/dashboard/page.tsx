import { AdminV2DashboardView } from "@/components/admin-v2/views/AdminV2DashboardView";
import { getAdminV2DashboardData } from "@/lib/admin-v2/data";
import { requireAdminV2Session } from "@/lib/admin-v2/auth";
import { requireAdminV2RouteAccess } from "@/lib/admin-v2/permissions";

export default async function AdminV2DashboardPage() {
  const session = await requireAdminV2Session();
  requireAdminV2RouteAccess(session, "dashboard");
  const data = await getAdminV2DashboardData();

  return <AdminV2DashboardView data={data} />;
}
