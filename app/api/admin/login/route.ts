import {
  ADMIN_MFA_CHALLENGE_COOKIE,
  ADMIN_SESSION_COOKIE,
  adminMfaChallengeCookieOptions,
  adminSessionCookieOptions,
  createPersistentAdminSessionToken,
  getAdminCredentials,
} from "@/app/lib/admin-auth";
import {
  createMfaChallenge,
  isThrottleLocked,
  mfaEnabled,
  ownerPrincipalId,
  recordThrottleAttempt,
} from "@/app/lib/admin-identity-access";
import { safeAdminNextPath } from "@/app/lib/admin-login";
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

async function parseLoginRequest(request: Request) {
  const contentType = request.headers.get("content-type") ?? "";
  const requestUrl = new URL(request.url);

  if (contentType.includes("application/json")) {
    let payload: unknown;

    try {
      payload = await request.json();
    } catch {
      return { errors: ["Invalid JSON body."] };
    }

    if (!isRecord(payload)) return { errors: ["Invalid login payload."] };

    return {
      username: text(payload.username),
      password: passwordText(payload.password),
      next: safeAdminNextPath(payload.next ?? requestUrl.searchParams.get("next")),
    };
  }

  if (
    contentType.includes("application/x-www-form-urlencoded") ||
    contentType.includes("multipart/form-data")
  ) {
    let formData: FormData;

    try {
      formData = await request.formData();
    } catch {
      return { errors: ["Invalid form body."] };
    }

    return {
      username: text(formData.get("username")),
      password: passwordText(formData.get("password")),
      next: safeAdminNextPath(formData.get("next") ?? requestUrl.searchParams.get("next")),
    };
  }

  return { errors: ["Unsupported login request content type."] };
}

function loginSuccessResponse(body: Record<string, unknown>, token: string) {
  const response = NextResponse.json(body);
  response.cookies.set(ADMIN_SESSION_COOKIE, token, adminSessionCookieOptions());
  response.cookies.delete(ADMIN_MFA_CHALLENGE_COOKIE);
  return response;
}

function mfaRequiredResponse(body: Record<string, unknown>, challengeToken: string) {
  const response = NextResponse.json({ ...body, mfaRequired: true });
  response.cookies.set(ADMIN_MFA_CHALLENGE_COOKIE, challengeToken, adminMfaChallengeCookieOptions());
  return response;
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

  const parsed = await parseLoginRequest(request);
  if ("errors" in parsed) return Response.json({ errors: parsed.errors }, { status: 400 });

  const { username, password, next } = parsed;
  if (!username || !password) {
    return Response.json(
      { errors: ["Username and password are required."] },
      { status: 400 }
    );
  }

  if (await isThrottleLocked({ key: username, purpose: "login" })) {
    return Response.json({ errors: ["Invalid admin credentials."] }, { status: 429 });
  }

  if (username !== credentials.username || password !== credentials.password) {
    const staff = await authenticateStaff(username, password).catch((error) => {
      console.error("Staff login lookup failed:", error);
      return null;
    });

    if (!staff) {
      await recordThrottleAttempt({ key: username, purpose: "login", success: false }).catch(() => null);
      return Response.json({ errors: ["Invalid admin credentials."] }, { status: 401 });
    }

    if (await mfaEnabled({ principalType: "staff", principalId: staff.id }).catch(() => false)) {
      const challengeToken = await createMfaChallenge({
        principalType: "staff",
        principalId: staff.id,
        username: staff.username,
      });
      await recordThrottleAttempt({ key: username, purpose: "login", success: true }).catch(() => null);
      return mfaRequiredResponse({ ok: true, next }, challengeToken);
    }

    const token = await createPersistentAdminSessionToken({
      userType: "staff",
      staffId: staff.id,
      username: staff.username,
      displayName: staff.name,
      role: staff.role,
      permissions: staff.permissions,
    }, request);

    if (!token) {
      return Response.json(
        { errors: ["Admin session could not be created."] },
        { status: 500 }
      );
    }

    await recordThrottleAttempt({ key: username, purpose: "login", success: true }).catch(() => null);
    return loginSuccessResponse({
      ok: true,
      userType: "staff",
      role: staff.role,
      next,
    }, token);
  }

  if (await mfaEnabled({ principalType: "owner", principalId: ownerPrincipalId(credentials.username) }).catch(() => false)) {
    const challengeToken = await createMfaChallenge({
      principalType: "owner",
      principalId: ownerPrincipalId(credentials.username),
      username: credentials.username,
    });
    await recordThrottleAttempt({ key: username, purpose: "login", success: true }).catch(() => null);
    return mfaRequiredResponse({ ok: true, isDevelopmentFallback: credentials.isDevelopmentFallback, next }, challengeToken);
  }

  const token = await createPersistentAdminSessionToken({
    userType: "owner",
    username: credentials.username,
    displayName: "Owner",
    role: "owner",
    permissions: normalizePermissions("owner", {}),
  }, request);
  if (!token) {
    return Response.json(
      { errors: ["Admin session could not be created."] },
      { status: 500 }
    );
  }

  await recordThrottleAttempt({ key: username, purpose: "login", success: true }).catch(() => null);
  return loginSuccessResponse({
    ok: true,
    isDevelopmentFallback: credentials.isDevelopmentFallback,
    next,
  }, token);
}
