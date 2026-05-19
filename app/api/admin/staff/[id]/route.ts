import {
  forbiddenAdminResponse,
  getFreshAdminRequestSession,
  unauthorizedAdminResponse,
} from "@/app/lib/admin-auth";
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
  if (role === "owner") {
    return Response.json(
      { errors: ["Owner role is reserved for the environment admin login."] },
      { status: 400 }
    );
  }

  const password = text(payload.password);
  if (password && password.length < 8) {
    return Response.json(
      { errors: ["Reset password must be at least 8 characters."] },
      { status: 400 }
    );
  }

  try {
    const staff = await updateStaff(id, {
      name: payload.name === undefined ? undefined : text(payload.name),
      username: payload.username === undefined ? undefined : text(payload.username),
      email: payload.email === undefined ? undefined : text(payload.email),
      role,
      permissions: role
        ? permissionsFromPayload(role, payload.permissions)
        : payload.permissions && isRecord(payload.permissions)
          ? permissionsFromPayload("viewer", payload.permissions)
          : undefined,
      password: password || undefined,
      isActive:
        typeof payload.isActive === "boolean" ? payload.isActive : undefined,
    });
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
