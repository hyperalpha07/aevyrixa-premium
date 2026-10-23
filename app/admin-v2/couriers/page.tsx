import { hasPermission } from "@/app/lib/admin-permissions";
import { AdminV2CouriersView } from "@/components/admin-v2/views/couriers/AdminV2CouriersView";
import { requireAdminV2Session } from "@/lib/admin-v2/auth";
import { requireAdminV2RouteAccess } from "@/lib/admin-v2/permissions";
import { getAdminV2Orders } from "@/lib/admin-v2/orders";

export default async function AdminV2CouriersPage(props: PageProps<"/admin-v2/couriers">) {
  const session = await requireAdminV2Session();
  requireAdminV2RouteAccess(session, "couriers");
  const search = await props.searchParams;
  const params = new URLSearchParams({ recordScope: "live", pageSize: "25" });
  const page = Array.isArray(search?.page) ? search.page[0] : search?.page;
  const q = Array.isArray(search?.q) ? search.q[0] : search?.q;
  const delivery = Array.isArray(search?.delivery) ? search.delivery[0] : search?.delivery;
  if (page) params.set("page", page);
  if (q) params.set("q", q);
  if (delivery) params.set("delivery", delivery);
  const data = await getAdminV2Orders(params);
  return <AdminV2CouriersView data={data} canUpdate={hasPermission(session, "orders.editCourier")} />;
}
