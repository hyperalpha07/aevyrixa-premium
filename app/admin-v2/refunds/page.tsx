import { AdminV2RefundsView } from "@/components/admin-v2/views/refunds/AdminV2RefundsView";
import { requireAdminV2Session } from "@/lib/admin-v2/auth";
import { requireAdminV2RouteAccess } from "@/lib/admin-v2/permissions";
import { getAdminV2Refunds } from "@/lib/admin-v2/refunds/refunds-query";

export default async function AdminV2RefundsPage(props: PageProps<"/admin-v2/refunds">) {
  const session = await requireAdminV2Session();
  requireAdminV2RouteAccess(session, "refunds");
  const search = await props.searchParams;
  const params = new URLSearchParams();
  Object.entries(search ?? {}).forEach(([key, value]) => {
    if (Array.isArray(value)) value.forEach((item) => params.append(key, item));
    else if (value !== undefined) params.set(key, value);
  });
  const data = await getAdminV2Refunds(params);

  return <AdminV2RefundsView data={data} />;
}
