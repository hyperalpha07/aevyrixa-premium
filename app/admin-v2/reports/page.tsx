import { AdminV2ReportsView } from "@/components/admin-v2/views/reports/AdminV2ReportsView";
import { requireAdminV2Session } from "@/lib/admin-v2/auth";
import { requireAdminV2RouteAccess } from "@/lib/admin-v2/permissions";
import { getAdminV2Report } from "@/lib/admin-v2/reports/reports-query";

export default async function AdminV2ReportsPage(props: PageProps<"/admin-v2/reports">) {
  const session = await requireAdminV2Session();
  requireAdminV2RouteAccess(session, "reports");
  const search = await props.searchParams;
  const params = new URLSearchParams();
  Object.entries(search ?? {}).forEach(([key, value]) => {
    if (Array.isArray(value)) value.forEach((item) => params.append(key, item));
    else if (value !== undefined) params.set(key, value);
  });
  const data = await getAdminV2Report(params);

  return <AdminV2ReportsView data={data} />;
}
