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
  createStaff,
  listActivityLogs,
  listStaff,
  logStaffActivity,
} from "@/app/lib/admin-staff";

export const dynamic = "force-dynamic";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function text(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function bool(value: unknown, fallback: boolean) {
  return typeof value === "boolean" ? value : fallback;
}

function permissionsFromPayload(role: ReturnType<typeof normalizeRole>, value: unknown) {
  const normalized = normalizePermissions(role, value);
  return adminPermissionKeys.reduce((result, key) => {
    result[key] = normalized[key];
    return result;
  }, {} as Record<AdminPermission, boolean>);
}

function staffError(error: unknown) {
  if (error instanceof AdminStaffStoreError) {
    return Response.json(
      {
        errors: [
          error.code === "STAFF_TABLE_MISSING" ||
          error.code === "STAFF_BACKEND_NOT_CONFIGURED"
            ? "Staff backend is not available. Run the Phase 38 staff SQL migration in Supabase first."
            : "Staff could not be loaded.",
        ],
        code: error.code,
      },
      { status: error.status }
    );
  }

  return Response.json({ errors: ["Staff request failed."] }, { status: 500 });
}

export async function GET(request: Request) {
  const session = await getFreshAdminRequestSession(request);
  if (!session) return unauthorizedAdminResponse();
  if (!hasPermission(session, "staff.manage") && !hasPermission(session, "activity.view")) {
    await logStaffActivity({
      actor: session,
      action: "permission.denied",
      targetType: "staff",
      targetId: "list",
      metadata: { reason: "missing_permission" },
    });
    return forbiddenAdminResponse();
  }

  try {
    const [staff, activityLogs] = await Promise.all([
      hasPermission(session, "staff.manage") ? listStaff() : Promise.resolve([]),
      hasPermission(session, "activity.view") ? listActivityLogs() : Promise.resolve([]),
    ]);
    return Response.json({ staff, activityLogs });
  } catch (error) {
    console.error("Failed to load staff:", error);
    return staffError(error);
  }
}

export async function POST(request: Request) {
  const session = await getFreshAdminRequestSession(request);
  if (!session) return unauthorizedAdminResponse();
  if (!hasPermission(session, "staff.manage")) {
    await logStaffActivity({
      actor: session,
      action: "permission.denied",
      targetType: "staff",
      targetId: "create",
      metadata: { reason: "missing_permission" },
    });
    return forbiddenAdminResponse();
  }

  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return Response.json({ errors: ["Invalid JSON body."] }, { status: 400 });
  }

  if (!isRecord(payload)) {
    return Response.json({ errors: ["Invalid staff payload."] }, { status: 400 });
  }

  const name = text(payload.name);
  const username = text(payload.username);
  const email = text(payload.email);
  const password = text(payload.password);
  const role = normalizeRole(payload.role);
  const errors: string[] = [];

  if (!name) errors.push("Name is required.");
  if (!username) errors.push("Username is required.");
  if (password && password.length < 8) errors.push("Temporary password must be at least 8 characters.");
  if (role === "owner") errors.push("Owner staff accounts cannot be created from this UI.");
  if (errors.length > 0) return Response.json({ errors }, { status: 400 });

  try {
    const staff = await createStaff({
      name,
      username,
      email,
      role,
      permissions: permissionsFromPayload(role, payload.permissions),
      password: password || undefined,
      isActive: bool(payload.isActive, true),
      createdBy: session.displayName,
    });
    await logStaffActivity({
      actor: session,
      action: "staff.created",
      targetType: "staff",
      targetId: staff.id,
      metadata: { username: staff.username, role: staff.role },
    });
    return Response.json({ staff }, { status: 201 });
  } catch (error) {
    console.error("Failed to create staff:", error);
    return staffError(error);
  }
}
