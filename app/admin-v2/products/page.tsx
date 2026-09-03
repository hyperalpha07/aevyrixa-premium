import { requireAdminV2Session } from "@/lib/admin-v2/auth";
import { requireAdminV2RouteAccess } from "@/lib/admin-v2/permissions";
import { getAdminV2ProductCatalog } from "@/lib/admin-v2/products";
import { AdminV2ProductsView } from "@/components/admin-v2/views/products/AdminV2ProductsView";

export default async function AdminV2ProductsPage() {
  const session = await requireAdminV2Session();
  requireAdminV2RouteAccess(session, "products");
  const data = await getAdminV2ProductCatalog();

  return <AdminV2ProductsView data={data} />;
}
