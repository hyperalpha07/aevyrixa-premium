import {
  forbiddenAdminResponse,
  getFreshAdminRequestSession,
  unauthorizedAdminResponse,
} from "@/app/lib/admin-auth";
import {
  actorCanGrantPermissions,
  getAdminRole,
  revokeStaffSessions,
} from "@/app/lib/admin-identity-access";
import {
  adminPermissionKeys,
  hasPermission,
  normalizePermissions,
  normalizeRole,
  type AdminPermission,
} from "@/app/lib/admin-permissions";
import {
  AdminStaffStoreError,
  logStaffActivity,
  updateStaff,
} from "@/app/lib/admin-staff";

export const dynamic = "force-dynamic";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function text(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function staffError(error: unknown) {
  if (error instanceof AdminStaffStoreError) {
    return Response.json(
      {
        errors: [
          error.code === "STAFF_TABLE_MISSING" ||
          error.code === "STAFF_BACKEND_NOT_CONFIGURED"
            ? "Staff backend is not available. Run the Phase 38 staff SQL migration in Supabase first."
            : "Staff could not be updated.",
        ],
        code: error.code,
      },
      { status: error.status }
    );
  }

  return Response.json({ errors: ["Staff request failed."] }, { status: 500 });
}

function permissionsFromPayload(role: ReturnType<typeof normalizeRole>, value: unknown) {
  const normalized = normalizePermissions(role, value);
  return adminPermissionKeys.reduce((result, key) => {
    result[key] = normalized[key];
    return result;
  }, {} as Record<AdminPermission, boolean>);
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const session = await getFreshAdminRequestSession(request);
  if (!session) return unauthorizedAdminResponse();
  if (!hasPermission(session, "staff.manage")) {
    await logStaffActivity({
      actor: session,
      action: "permission.denied",
      targetType: "staff",
      targetId: "update",
      metadata: { reason: "missing_permission" },
    });
    return forbiddenAdminResponse();
  }

  const { id } = await context.params;
  let payload: unknown;

  try {
    payload = await request.json();
  } catch {
    return Response.json({ errors: ["Invalid JSON body."] }, { status: 400 });
  }

  if (!isRecord(payload)) {
    return Response.json({ errors: ["Invalid staff payload."] }, { status: 400 });
  }

  const role = payload.role === undefined ? undefined : normalizeRole(payload.role);
  if (session.staffId === id && (role !== undefined || payload.permissions !== undefined || typeof payload.isActive === "boolean")) {
    return Response.json({ errors: ["You cannot change your own role, permissions, or active status."] }, { status: 409 });
  }
  if (role === "owner") {
    return Response.json(
      { errors: ["Owner role is reserved for the environment admin login."] },
      { status: 400 }
    );
  }
  if (role) {
    const roleRecord = await getAdminRole(role);
    if (!roleRecord || roleRecord.is_active === false) {
      return Response.json({ errors: ["Selected role is not available."] }, { status: 400 });
    }
  }

  const password = text(payload.password);
  if (password && password.length < 8) {
    return Response.json(
      { errors: ["Reset password must be at least 8 characters."] },
      { status: 400 }
    );
  }
  if (password && !hasPermission(session, "security.manage")) return forbiddenAdminResponse();
  const nextPermissions = role
    ? permissionsFromPayload(role, payload.permissions)
    : payload.permissions && isRecord(payload.permissions)
      ? permissionsFromPayload("viewer", payload.permissions)
      : undefined;
  if (nextPermissions && !actorCanGrantPermissions(session, nextPermissions)) return forbiddenAdminResponse();

  try {
    const staff = await updateStaff(id, {
      name: payload.name === undefined ? undefined : text(payload.name),
      username: payload.username === undefined ? undefined : text(payload.username),
      email: payload.email === undefined ? undefined : text(payload.email),
      role,
      permissions: nextPermissions,
      password: password || undefined,
      isActive:
        typeof payload.isActive === "boolean" ? payload.isActive : undefined,
    });
    if (password || typeof payload.isActive === "boolean" && payload.isActive === false) {
      await revokeStaffSessions(id, password ? "password_changed" : "staff_deactivated").catch(() => null);
    }
    await logStaffActivity({
      actor: session,
      action: "staff.updated",
      targetType: "staff",
      targetId: staff.id,
      metadata: { username: staff.username, role: staff.role, isActive: staff.isActive },
    });
    return Response.json({ staff });
  } catch (error) {
    console.error("Failed to update staff:", error);
    return staffError(error);
  }
}
