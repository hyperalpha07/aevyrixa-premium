import {
  ADMIN_SESSION_COOKIE,
  adminSessionCookieOptions,
  createAdminSessionToken,
  getAdminCredentials,
} from "@/app/lib/admin-auth";
import { normalizePermissions } from "@/app/lib/admin-permissions";
import { authenticateStaff } from "@/app/lib/admin-staff";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function text(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function passwordText(value: unknown) {
  return typeof value === "string" ? value : "";
}

export async function POST(request: Request) {
  const credentials = getAdminCredentials();
  if (!credentials) {
    return Response.json(
      {
        errors: [
          "Admin credentials are not configured. Set ADMIN_USERNAME and ADMIN_PASSWORD.",
        ],
      },
      { status: 503 }
    );
  }

  let payload: unknown;

  try {
    payload = await request.json();
  } catch {
    return Response.json({ errors: ["Invalid JSON body."] }, { status: 400 });
  }

  const username = isRecord(payload) ? text(payload.username) : "";
  const password = isRecord(payload) ? passwordText(payload.password) : "";

  if (username !== credentials.username || password !== credentials.password) {
    const staff = await authenticateStaff(username, password).catch((error) => {
      console.error("Staff login lookup failed:", error);
      return null;
    });

    if (!staff) {
      return Response.json({ errors: ["Invalid admin credentials."] }, { status: 401 });
    }

    const token = createAdminSessionToken({
      userType: "staff",
      staffId: staff.id,
      username: staff.username,
      displayName: staff.name,
      role: staff.role,
      permissions: staff.permissions,
    });

    if (!token) {
      return Response.json(
        { errors: ["Admin session could not be created."] },
        { status: 500 }
      );
    }

    const response = NextResponse.json({
      ok: true,
      userType: "staff",
      role: staff.role,
    });
    response.cookies.set(ADMIN_SESSION_COOKIE, token, adminSessionCookieOptions());
    return response;
  }

  const token = createAdminSessionToken({
    userType: "owner",
    username: credentials.username,
    displayName: "Owner",
    role: "owner",
    permissions: normalizePermissions("owner", {}),
  });
  if (!token) {
    return Response.json(
      { errors: ["Admin session could not be created."] },
      { status: 500 }
    );
  }

  const response = NextResponse.json({
    ok: true,
    isDevelopmentFallback: credentials.isDevelopmentFallback,
  });
  response.cookies.set(ADMIN_SESSION_COOKIE, token, adminSessionCookieOptions());
  return response;
}
