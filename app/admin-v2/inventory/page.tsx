import { hasPermission } from "@/app/lib/admin-permissions";
import { AdminV2InventoryView } from "@/components/admin-v2/views/inventory/AdminV2InventoryView";
import { requireAdminV2Session } from "@/lib/admin-v2/auth";
import { requireAdminV2RouteAccess } from "@/lib/admin-v2/permissions";
import { getAdminV2ProductCatalog } from "@/lib/admin-v2/products";

export default async function AdminV2InventoryPage() {
  const session = await requireAdminV2Session();
  requireAdminV2RouteAccess(session, "inventory");
  const data = await getAdminV2ProductCatalog();
  return <AdminV2InventoryView data={data} canEdit={hasPermission(session, "products.edit")} />;
}
