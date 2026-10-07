import { forbiddenAdminResponse, getFreshAdminRequestSession, unauthorizedAdminResponse } from "@/app/lib/admin-auth";
import { actorCanApplyOverrides, createAdminInvite, listAdminInvites, normalizePermissionOverrides } from "@/app/lib/admin-identity-access";
import { hasPermission } from "@/app/lib/admin-permissions";
import { logStaffActivity } from "@/app/lib/admin-staff";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const session = await getFreshAdminRequestSession(request);
  if (!session) return unauthorizedAdminResponse();
  if (!hasPermission(session, "staff.manage")) return forbiddenAdminResponse();
  return Response.json({ invites: await listAdminInvites() }, { headers: { "cache-control": "no-store" } });
}

export async function POST(request: Request) {
  const session = await getFreshAdminRequestSession(request);
  if (!session) return unauthorizedAdminResponse();
  if (!hasPermission(session, "staff.manage")) return forbiddenAdminResponse();
  const body = await request.json().catch(() => null) as Record<string, unknown> | null;
  const email = typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";
  const roleKey = typeof body?.roleKey === "string" ? body.roleKey.trim() : "";
  const overrides = normalizePermissionOverrides(body?.permissionOverrides);
  if (!email || !roleKey || roleKey === "owner") return Response.json({ errors: ["Email and non-owner role are required."] }, { status: 400 });
  if (!actorCanApplyOverrides(session, overrides)) return forbiddenAdminResponse();
  try {
    const { invite, token } = await createAdminInvite({ email, roleKey, overrides, createdBy: session.displayName || session.username });
    await logStaffActivity({ actor: session, action: "staff.invite_created", targetType: "staff_invite", targetId: invite.id, metadata: { email, roleKey } });
    return Response.json({ invite, inviteLink: `/admin/invite/${encodeURIComponent(token)}` }, { status: 201 });
  } catch {
    return Response.json({ errors: ["Invite could not be created."] }, { status: 503 });
  }
}
