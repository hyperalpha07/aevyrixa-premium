import { forbiddenAdminResponse, getFreshAdminRequestSession, unauthorizedAdminResponse } from "@/app/lib/admin-auth";
import { actorCanApplyOverrides, normalizePermissionOverrides, updateStaffPermissionOverrides } from "@/app/lib/admin-identity-access";
import { hasPermission } from "@/app/lib/admin-permissions";
import { logStaffActivity } from "@/app/lib/admin-staff";

export const dynamic = "force-dynamic";

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  const session = await getFreshAdminRequestSession(request);
  if (!session) return unauthorizedAdminResponse();
  if (!hasPermission(session, "permissions.manage")) return forbiddenAdminResponse();
  const { id } = await context.params;
  if (session.staffId === id) return Response.json({ errors: ["You cannot edit your own permission overrides."] }, { status: 409 });
  const body = await request.json().catch(() => null) as Record<string, unknown> | null;
  const overrides = normalizePermissionOverrides(body?.overrides);
  if (!actorCanApplyOverrides(session, overrides)) return forbiddenAdminResponse();
  const result = await updateStaffPermissionOverrides(id, overrides);
  await logStaffActivity({ actor: session, action: "staff.permissions_updated", targetType: "staff", targetId: id, metadata: { keys: Object.keys(overrides) } });
  return Response.json({ overrides, result });
}
