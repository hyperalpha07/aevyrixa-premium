import { hasPermission } from "@/app/lib/admin-permissions";
import { requireAdminV2Session } from "@/lib/admin-v2/auth";
import { requireAdminV2RouteAccess } from "@/lib/admin-v2/permissions";
import { AdminV2SupportView } from "@/components/admin-v2/views/support/AdminV2SupportView";

/**
 * Dedicated staff live-chat workspace.
 * Conversation history and actions use the same persisted, permissioned support API.
 * Support Cases remains a separate case-management surface; no duplicate data.
 */
export default async function AdminV2ChatPage() {
  const session = await requireAdminV2Session();
  requireAdminV2RouteAccess(session, "chat");
  return <AdminV2SupportView
    workspace="chat"
    canReply={hasPermission(session, "support.reply")}
    canClose={hasPermission(session, "support.close")}
    canManage={hasPermission(session, "support.manage")}
    aiEnabled={Boolean(process.env.OPENAI_API_KEY)}
  />;
}
