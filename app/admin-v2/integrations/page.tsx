import { AdminV2IntegrationsView } from "@/components/admin-v2/views/integrations/AdminV2IntegrationsView";
import { hasPermission } from "@/app/lib/admin-permissions";
import { requireAdminV2Session } from "@/lib/admin-v2/auth";
import { collectIntegrationFacts } from "@/lib/admin-v2/integrations/status";
import { requireAdminV2RouteAccess } from "@/lib/admin-v2/permissions";

export default async function AdminV2IntegrationsPage() {
  const session = await requireAdminV2Session();
  requireAdminV2RouteAccess(session, "integrations");
  const facts = await collectIntegrationFacts();
  return <AdminV2IntegrationsView facts={facts} canVerifyProvider={hasPermission(session, "settings.editSensitive")} />;
}
