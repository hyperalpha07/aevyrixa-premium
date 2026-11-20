import { hasPermission } from "@/app/lib/admin-permissions";
import { AdminV2EmailDraftWorkspace } from "@/components/admin-v2/views/email/AdminV2EmailDraftWorkspace";
import { requireAdminV2Session } from "@/lib/admin-v2/auth";
import { listEmailDrafts } from "@/lib/admin-v2/email-drafts-store";
import { requireAdminV2RouteAccess } from "@/lib/admin-v2/permissions";

export default async function AdminV2EmailPage() {
  const session = await requireAdminV2Session();
  requireAdminV2RouteAccess(session, "email");
  const drafts = await listEmailDrafts().catch(() => null);
  return <AdminV2EmailDraftWorkspace initial={drafts} canManage={hasPermission(session, "email.manage")} />;
}
