import { AdminV2AnalyticsView } from "@/components/admin-v2/views/analytics/AdminV2AnalyticsView";
import { getAdminV2Analytics } from "@/lib/admin-v2/analytics/analytics-query";
import { requireAdminV2Session } from "@/lib/admin-v2/auth";
import { requireAdminV2RouteAccess } from "@/lib/admin-v2/permissions";

export default async function AdminV2AnalyticsPage(props: PageProps<"/admin-v2/analytics">) {
  const session = await requireAdminV2Session();
  requireAdminV2RouteAccess(session, "analytics");
  const search = await props.searchParams;
  const params = new URLSearchParams();
  Object.entries(search ?? {}).forEach(([key, value]) => {
    if (Array.isArray(value)) value.forEach((item) => params.append(key, item));
    else if (value !== undefined) params.set(key, value);
  });
  const data = await getAdminV2Analytics(params);

  return <AdminV2AnalyticsView data={data} />;
}
