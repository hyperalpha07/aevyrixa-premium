import { forbiddenAdminResponse, getFreshAdminRequestSession, unauthorizedAdminResponse } from "@/app/lib/admin-auth";
import { revokeAdminInvite } from "@/app/lib/admin-identity-access";
import { hasPermission } from "@/app/lib/admin-permissions";
import { logStaffActivity } from "@/app/lib/admin-staff";

export const dynamic = "force-dynamic";

export async function DELETE(request: Request, context: { params: Promise<{ id: string }> }) {
  const session = await getFreshAdminRequestSession(request);
  if (!session) return unauthorizedAdminResponse();
  if (!hasPermission(session, "staff.manage")) return forbiddenAdminResponse();
  const { id } = await context.params;
  await revokeAdminInvite(id);
  await logStaffActivity({ actor: session, action: "staff.invite_revoked", targetType: "staff_invite", targetId: id });
  return Response.json({ ok: true });
}
