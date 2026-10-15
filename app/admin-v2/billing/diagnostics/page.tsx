import { AdminV2BillingView } from "@/components/admin-v2/views/billing/AdminV2BillingView";
import { requireAdminV2Session } from "@/lib/admin-v2/auth";
import { getAdminV2BillingOverview } from "@/lib/admin-v2/billing/billing-query";
import { parseAdminV2FinancialDataScope } from "@/lib/admin-v2/finance/financial-data-scope";
import { requireAdminV2RouteAccess } from "@/lib/admin-v2/permissions";

export default async function AdminV2BillingDiagnosticsPage(props: PageProps<"/admin-v2/billing/diagnostics">) {
  const session = await requireAdminV2Session();
  requireAdminV2RouteAccess(session, "billing");
  const params = await props.searchParams;
  const requestedScope = typeof params?.scope === "string" ? params.scope : "test";
  const scope = parseAdminV2FinancialDataScope(requestedScope);
  const data = await getAdminV2BillingOverview(scope);

  return <AdminV2BillingView data={data} mode="diagnostics" />;
}
