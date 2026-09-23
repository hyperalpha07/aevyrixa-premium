import { hasPermission } from "@/app/lib/admin-permissions";
import { requireAdminV2Session } from "@/lib/admin-v2/auth";
import { requireAdminV2RouteAccess } from "@/lib/admin-v2/permissions";
import { AdminV2SupportView } from "@/components/admin-v2/views/support/AdminV2SupportView";

export default async function AdminV2SupportPage() {
  const session = await requireAdminV2Session();
  requireAdminV2RouteAccess(session, "support");
  return <AdminV2SupportView canReply={hasPermission(session, "support.reply")} canClose={hasPermission(session, "support.close")} />;
}
