import { forbiddenAdminResponse, getFreshAdminRequestSession, unauthorizedAdminResponse } from "@/app/lib/admin-auth";
import { actorCanGrantPermissions, createAdminRole, listAdminRoles, validateRolePayload } from "@/app/lib/admin-identity-access";
import { hasPermission } from "@/app/lib/admin-permissions";
import { logStaffActivity } from "@/app/lib/admin-staff";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const session = await getFreshAdminRequestSession(request);
  if (!session) return unauthorizedAdminResponse();
  const roles = await listAdminRoles();
  return Response.json({ roles }, { headers: { "cache-control": "no-store" } });
}

export async function POST(request: Request) {
  const session = await getFreshAdminRequestSession(request);
  if (!session) return unauthorizedAdminResponse();
  if (!hasPermission(session, "roles.manage")) return forbiddenAdminResponse();
  const body = await request.json().catch(() => null) as Record<string, unknown> | null;
  const parsed = validateRolePayload({
    key: typeof body?.key === "string" ? body.key : "",
    name: typeof body?.name === "string" ? body.name : "",
    permissions: body?.permissions,
  });
  if (parsed.errors.length) return Response.json({ errors: parsed.errors }, { status: 400 });
  if (!actorCanGrantPermissions(session, parsed.permissions)) {
    await logStaffActivity({ actor: session, action: "permission.denied", targetType: "role", targetId: parsed.key, metadata: { reason: "grant_above_actor" } });
    return forbiddenAdminResponse();
  }
  try {
    const role = await createAdminRole({
      key: parsed.key,
      name: parsed.name,
      description: typeof body?.description === "string" ? body.description.slice(0, 500) : undefined,
      permissions: parsed.permissions,
      createdBy: session.displayName || session.username,
    });
    await logStaffActivity({ actor: session, action: "role.created", targetType: "role", targetId: role.key, metadata: { key: role.key } });
    return Response.json({ role }, { status: 201 });
  } catch {
    return Response.json({ errors: ["Role could not be created."] }, { status: 503 });
  }
}
