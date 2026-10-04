import { AdminV2BillingView } from "@/components/admin-v2/views/billing/AdminV2BillingView";
import { requireAdminV2Session } from "@/lib/admin-v2/auth";
import { getAdminV2BillingOverview } from "@/lib/admin-v2/billing/billing-query";
import { requireAdminV2RouteAccess } from "@/lib/admin-v2/permissions";

export default async function AdminV2BillingPage() {
  const session = await requireAdminV2Session();
  requireAdminV2RouteAccess(session, "billing");
  const data = await getAdminV2BillingOverview();

  return <AdminV2BillingView data={data} />;
}
