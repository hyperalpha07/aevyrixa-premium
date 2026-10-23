import { hasPermission } from "@/app/lib/admin-permissions";
import { AdminV2ReturnsView } from "@/components/admin-v2/views/returns/AdminV2ReturnsView";
import { requireAdminV2Session } from "@/lib/admin-v2/auth";
import { requireAdminV2RouteAccess } from "@/lib/admin-v2/permissions";
import { loadReturnCases } from "@/lib/admin-v2/returns/returns-store";

export default async function AdminV2ReturnsPage(props: PageProps<"/admin-v2/returns">) {
  const session = await requireAdminV2Session();
  requireAdminV2RouteAccess(session, "returns");
  const search = await props.searchParams;
  const rawPage = Number(Array.isArray(search?.page) ? search.page[0] : search?.page);
  const page = Number.isSafeInteger(rawPage) && rawPage > 0 ? rawPage : 1;
  const status = Array.isArray(search?.status) ? search.status[0] : search?.status ?? "all";
  const filter = ["requested","reviewing","approved","rejected","closed"].includes(status) ? status : "all";
  const data = await loadReturnCases(page, filter).catch(() => ({ available: false, rows: [], totalCount: 0, page: 1 }));
  return <AdminV2ReturnsView data={data} filter={filter} canManage={hasPermission(session, "orders.editStatus")} />;
}
