import { hasPermission } from "@/app/lib/admin-permissions";
import { AdminV2MediaView } from "@/components/admin-v2/views/media/AdminV2MediaView";
import { requireAdminV2Session } from "@/lib/admin-v2/auth";
import { requireAdminV2RouteAccess } from "@/lib/admin-v2/permissions";
import { listMediaLibraryObjects } from "@/lib/admin-v2/product-media-store";
import { getAdminV2ProductCatalog } from "@/lib/admin-v2/products";

export default async function AdminV2MediaPage() {
  const session = await requireAdminV2Session();
  requireAdminV2RouteAccess(session, "media");
  const [data, library] = await Promise.all([
    getAdminV2ProductCatalog(),
    listMediaLibraryObjects().catch((error) => {
      console.error("[admin-v2/media] Storage listing unavailable", error instanceof Error ? error.name : "unknown error");
      return { available: false, items: [] };
    }),
  ]);
  return <AdminV2MediaView data={data} library={library} canManage={hasPermission(session,"products.media")} />;
}
