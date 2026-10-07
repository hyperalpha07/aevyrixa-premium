import { forbiddenAdminResponse, getFreshAdminRequestSession, unauthorizedAdminResponse } from "@/app/lib/admin-auth";
import { createPasswordResetLink, revokeStaffSessions } from "@/app/lib/admin-identity-access";
import { hasPermission } from "@/app/lib/admin-permissions";
import { logStaffActivity } from "@/app/lib/admin-staff";

export const dynamic = "force-dynamic";

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const session = await getFreshAdminRequestSession(request);
  if (!session) return unauthorizedAdminResponse();
  if (!hasPermission(session, "security.manage")) return forbiddenAdminResponse();
  const { id } = await context.params;
  const { reset, token } = await createPasswordResetLink({ staffId: id, createdBy: session.displayName || session.username });
  await revokeStaffSessions(id, "password_reset_created").catch(() => null);
  await logStaffActivity({ actor: session, action: "staff.password_reset_link_created", targetType: "staff", targetId: id, metadata: { resetId: reset?.id } });
  return Response.json({ reset, resetLink: `/admin/reset/${encodeURIComponent(token)}` }, { status: 201 });
}
