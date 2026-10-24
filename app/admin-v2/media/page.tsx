import { hasPermission } from "@/app/lib/admin-permissions";
import { AdminV2MediaView } from "@/components/admin-v2/views/media/AdminV2MediaView";
import { requireAdminV2Session } from "@/lib/admin-v2/auth";
import { requireAdminV2RouteAccess } from "@/lib/admin-v2/permissions";
import { getAdminV2ProductCatalog } from "@/lib/admin-v2/products";

export default async function AdminV2MediaPage() {
  const session = await requireAdminV2Session();
  requireAdminV2RouteAccess(session, "media");
  const data = await getAdminV2ProductCatalog();
  return <AdminV2MediaView data={data} canManage={hasPermission(session,"products.media")} />;
}
