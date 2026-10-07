import { forbiddenAdminResponse, getFreshAdminRequestSession, unauthorizedAdminResponse } from "@/app/lib/admin-auth";
import { disableMfaCredential } from "@/app/lib/admin-identity-access";
import { hasPermission } from "@/app/lib/admin-permissions";
import { logStaffActivity } from "@/app/lib/admin-staff";

export const dynamic = "force-dynamic";

export async function DELETE(request: Request, context: { params: Promise<{ id: string }> }) {
  const session = await getFreshAdminRequestSession(request);
  if (!session) return unauthorizedAdminResponse();
  if (!hasPermission(session, "security.manage")) return forbiddenAdminResponse();
  const { id } = await context.params;
  await disableMfaCredential({ principalType: "staff", principalId: id });
  await logStaffActivity({ actor: session, action: "mfa.disabled", targetType: "staff", targetId: id });
  return Response.json({ ok: true });
}
