import { hasPermission } from "@/app/lib/admin-permissions";
import { AdminV2ApprovalsView } from "@/components/admin-v2/views/approvals/AdminV2ApprovalsView";
import { requireAdminV2Session } from "@/lib/admin-v2/auth";
import { requireAdminV2RouteAccess } from "@/lib/admin-v2/permissions";

export default async function AdminV2ApprovalsPage() {
  const session = await requireAdminV2Session();
  requireAdminV2RouteAccess(session, "approvals");
  return (
    <AdminV2ApprovalsView
      permissions={{
        canRequest: hasPermission(session, "approvals.request"),
        canDecide: hasPermission(session, "approvals.decide"),
        isOwner: session.userType === "owner",
        actorType: session.userType === "owner" ? "owner" : "staff",
        actorId: session.userType === "staff" ? session.staffId ?? session.username : session.username,
      }}
    />
  );
}
