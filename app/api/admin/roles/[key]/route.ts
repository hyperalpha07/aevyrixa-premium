import { forbiddenAdminResponse, getFreshAdminRequestSession, unauthorizedAdminResponse } from "@/app/lib/admin-auth";
import { actorCanGrantPermissions, deleteAdminRole, getAdminRole, updateAdminRole, validateRolePayload } from "@/app/lib/admin-identity-access";
import { hasPermission } from "@/app/lib/admin-permissions";
import { listStaff, logStaffActivity } from "@/app/lib/admin-staff";

export const dynamic = "force-dynamic";

export async function GET(request: Request, context: { params: Promise<{ key: string }> }) {
  const session = await getFreshAdminRequestSession(request);
  if (!session) return unauthorizedAdminResponse();
  const { key } = await context.params;
  const role = await getAdminRole(key);
  if (!role) return Response.json({ errors: ["Role not found."] }, { status: 404 });
  return Response.json({ role }, { headers: { "cache-control": "no-store" } });
}

export async function PATCH(request: Request, context: { params: Promise<{ key: string }> }) {
  const session = await getFreshAdminRequestSession(request);
  if (!session) return unauthorizedAdminResponse();
  if (!hasPermission(session, "roles.manage")) return forbiddenAdminResponse();
  const { key } = await context.params;
  const body = await request.json().catch(() => null) as Record<string, unknown> | null;
  const parsed = validateRolePayload({
    name: typeof body?.name === "string" ? body.name : "",
    permissions: body?.permissions,
  }, true);
  if (parsed.errors.length) return Response.json({ errors: parsed.errors }, { status: 400 });
  if (!actorCanGrantPermissions(session, parsed.permissions)) return forbiddenAdminResponse();
  try {
    const role = await updateAdminRole(key, {
      name: parsed.name,
      description: typeof body?.description === "string" ? body.description.slice(0, 500) : null,
      permissions: parsed.permissions,
      isActive: typeof body?.isActive === "boolean" ? body.isActive : undefined,
    });
    if (!role) return Response.json({ errors: ["Role not found."] }, { status: 404 });
    await logStaffActivity({ actor: session, action: "role.updated", targetType: "role", targetId: role.key, metadata: { key: role.key } });
    return Response.json({ role });
  } catch (error) {
    return Response.json({ errors: [error instanceof Error ? error.message : "Role could not be updated."] }, { status: 409 });
  }
}

export async function DELETE(request: Request, context: { params: Promise<{ key: string }> }) {
  const session = await getFreshAdminRequestSession(request);
  if (!session) return unauthorizedAdminResponse();
  if (!hasPermission(session, "roles.manage")) return forbiddenAdminResponse();
  const { key } = await context.params;
  try {
    const deleted = await deleteAdminRole(key, await listStaff().catch(() => []));
    if (!deleted) return Response.json({ errors: ["Role not found."] }, { status: 404 });
    await logStaffActivity({ actor: session, action: "role.deleted", targetType: "role", targetId: key, metadata: { key } });
    return Response.json({ ok: true });
  } catch (error) {
    return Response.json({ errors: [error instanceof Error ? error.message : "Role could not be deleted."] }, { status: 409 });
  }
}
