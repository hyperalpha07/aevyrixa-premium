import { forbiddenAdminResponse, getFreshAdminRequestSession, unauthorizedAdminResponse } from "@/app/lib/admin-auth";
import { listAdminSessions, revokeAdminSession, revokeAdminSessionForStaff, revokeStaffSessions } from "@/app/lib/admin-identity-access";
import { hasPermission } from "@/app/lib/admin-permissions";
import { logStaffActivity } from "@/app/lib/admin-staff";

export const dynamic = "force-dynamic";

export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
  const session = await getFreshAdminRequestSession(request);
  if (!session) return unauthorizedAdminResponse();
  const { id } = await context.params;
  if (session.staffId !== id && !hasPermission(session, "security.manage")) return forbiddenAdminResponse();
  return Response.json({ sessions: await listAdminSessions({ staffId: id }) }, { headers: { "cache-control": "no-store" } });
}

export async function DELETE(request: Request, context: { params: Promise<{ id: string }> }) {
  const session = await getFreshAdminRequestSession(request);
  if (!session) return unauthorizedAdminResponse();
  const { id } = await context.params;
  if (session.staffId !== id && !hasPermission(session, "security.manage")) return forbiddenAdminResponse();
  const url = new URL(request.url);
  const sessionId = url.searchParams.get("session");
  const canManageSecurity = hasPermission(session, "security.manage");
  if (sessionId && canManageSecurity) await revokeAdminSession(sessionId, "manual_revoke");
  else if (sessionId) {
    const revoked = await revokeAdminSessionForStaff({ sessionId, staffId: id, reason: "manual_revoke" });
    if (!revoked) return forbiddenAdminResponse();
  }
  else await revokeStaffSessions(id, "manual_revoke_all");
  await logStaffActivity({ actor: session, action: sessionId ? "session.revoked" : "session.revoked_all", targetType: "staff", targetId: id, metadata: { sessionId: sessionId ?? "all" } });
  return Response.json({ ok: true });
}
