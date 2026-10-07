import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import {
  hasPermission,
  normalizePermissions,
  type AdminPermission,
  type AdminSessionUser,
} from "@/app/lib/admin-permissions";
import { getStaffById, logStaffActivity } from "@/app/lib/admin-staff";
import {
  adminSessionInfrastructureReady,
  createPersistentAdminSession,
  getPersistentAdminSession,
  revokeAdminSession,
} from "@/app/lib/admin-identity-access";

export const ADMIN_SESSION_COOKIE = "aevyrixa_admin_session";
export const ADMIN_MFA_CHALLENGE_COOKIE = "aevyrixa_admin_mfa";

const sessionMaxAgeSeconds = 60 * 60 * 8;
const sessionVersion = "v1";

type AdminCredentials = {
  username: string;
  password: string;
  isDevelopmentFallback: boolean;
};

export function adminSessionCookieOptions() {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: sessionMaxAgeSeconds,
  };
}

export function getAdminCredentials(): AdminCredentials | null {
  const username = process.env.ADMIN_USERNAME?.trim();
  const password = process.env.ADMIN_PASSWORD;

  if (username && password) {
    return { username, password, isDevelopmentFallback: false };
  }

  if (process.env.NODE_ENV !== "production") {
    return {
      username: "admin",
      password: "admin",
      isDevelopmentFallback: true,
    };
  }

  return null;
}

function sessionSecret() {
  const credentials = getAdminCredentials();
  if (!credentials) return null;
  return credentials.password;
}

function signSessionPayload(payload: string) {
  const secret = sessionSecret();
  if (!secret) return null;

  return createHmac("sha256", secret).update(payload).digest("base64url");
}

function safeEqual(first: string, second: string) {
  const firstBuffer = Buffer.from(first);
  const secondBuffer = Buffer.from(second);

  if (firstBuffer.length !== secondBuffer.length) return false;

  return timingSafeEqual(firstBuffer, secondBuffer);
}

export function createAdminSessionToken(user: string | AdminSessionUser) {
  const expiresAt = Date.now() + sessionMaxAgeSeconds * 1000;
  const payloadUser =
    typeof user === "string"
      ? {
          userType: "owner",
          username: user,
          displayName: "Owner",
          role: "owner",
          permissions: normalizePermissions("owner", {}),
        }
      : user;
  const session = Buffer.from(
    JSON.stringify({ ...payloadUser, expiresAt })
  ).toString("base64url");
  const payload = `${sessionVersion}.${session}`;
  const signature = signSessionPayload(payload);

  if (!signature) return null;

  return `${payload}.${signature}`;
}

export function adminMfaChallengeCookieOptions() {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 5 * 60,
  };
}

export async function createPersistentAdminSessionToken(
  user: AdminSessionUser,
  request?: Request
) {
  try {
    return await createPersistentAdminSession({
      principalType: user.userType,
      username: user.username,
      staffId: user.staffId ?? null,
      userAgent: request?.headers.get("user-agent"),
    });
  } catch (error) {
    if (!(await adminSessionInfrastructureReady())) return createAdminSessionToken(user);
    throw error;
  }
}

export function getAdminSessionFromToken(token?: string | null): AdminSessionUser | null {
  if (!token) return null;

  const [version, session, signature, ...extra] = token.split(".");
  if (extra.length > 0) return null;

  if (version !== sessionVersion) return null;

  let parsedSession: {
    username?: unknown;
    expiresAt?: unknown;
    userType?: unknown;
    staffId?: unknown;
    displayName?: unknown;
    role?: unknown;
    permissions?: unknown;
  };

  try {
    parsedSession = JSON.parse(Buffer.from(session, "base64url").toString("utf8"));
  } catch {
    return null;
  }

  const credentials = getAdminCredentials();
  if (!credentials || typeof parsedSession.username !== "string") return null;

  const expiresAt = Number(parsedSession.expiresAt);
  if (!Number.isFinite(expiresAt) || expiresAt <= Date.now()) return null;

  const expectedSignature = signSessionPayload(`${version}.${session}`);
  if (!expectedSignature || !safeEqual(signature, expectedSignature)) return null;

  if (!parsedSession.userType) {
    if (parsedSession.username !== credentials.username) return null;
    return {
      userType: "owner",
      username: credentials.username,
      displayName: "Owner",
      role: "owner",
      permissions: normalizePermissions("owner", {}),
    };
  }

  if (parsedSession.userType === "owner") {
    if (parsedSession.username !== credentials.username) return null;
    return {
      userType: "owner",
      username: credentials.username,
      displayName:
        typeof parsedSession.displayName === "string"
          ? parsedSession.displayName
          : "Owner",
      role: "owner",
      permissions: normalizePermissions("owner", parsedSession.permissions),
    };
  }

  if (parsedSession.userType !== "staff") return null;

  const staffRole =
    parsedSession.role === "manager" ||
    parsedSession.role === "order_staff" ||
    parsedSession.role === "product_staff" ||
    parsedSession.role === "support_staff" ||
    parsedSession.role === "viewer"
      ? parsedSession.role
      : "viewer";

  return {
    userType: "staff",
    staffId:
      typeof parsedSession.staffId === "string" ? parsedSession.staffId : undefined,
    username: parsedSession.username,
    displayName:
      typeof parsedSession.displayName === "string"
        ? parsedSession.displayName
        : parsedSession.username,
    role: staffRole,
    permissions: normalizePermissions(staffRole, parsedSession.permissions),
  };
}

export function verifyAdminSessionToken(token?: string | null) {
  return Boolean(getAdminSessionFromToken(token));
}

export async function hasAdminSession() {
  const cookieStore = await cookies();
  return Boolean(await getSessionFromTokenWithCutover(cookieStore.get(ADMIN_SESSION_COOKIE)?.value));
}

export async function getAdminSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get(ADMIN_SESSION_COOKIE)?.value;
  return getSessionFromTokenWithCutover(token);
}

export function verifyAdminRequest(request: Request) {
  return verifyAdminSessionToken(readCookie(request, ADMIN_SESSION_COOKIE));
}

export function getAdminRequestSession(request: Request) {
  return getAdminSessionFromToken(readCookie(request, ADMIN_SESSION_COOKIE));
}

export async function getFreshAdminRequestSession(request: Request) {
  const token = readCookie(request, ADMIN_SESSION_COOKIE);
  return getSessionFromTokenWithCutover(token);
}

export function verifyAdminRequestPermission(
  request: Request,
  permission: AdminPermission
) {
  const session = getAdminRequestSession(request);
  return hasPermission(session, permission) ? session : null;
}

export async function verifyFreshAdminRequestPermission(
  request: Request,
  permission: AdminPermission
) {
  const session = await getFreshAdminRequestSession(request);
  if (hasPermission(session, permission)) return session;

  if (session) {
    await logStaffActivity({
      actor: session,
      action: "permission.denied",
      targetType: "permission",
      targetId: permission,
      metadata: { reason: "missing_permission" },
    });
  }

  return null;
}

export function unauthorizedAdminResponse() {
  return Response.json(
    { errors: ["Admin authentication is required."] },
    { status: 401 }
  );
}

export function forbiddenAdminResponse() {
  return Response.json(
    { errors: ["You do not have permission to perform this action."] },
    { status: 403 }
  );
}

function readCookie(request: Request, name: string) {
  const cookieHeader = request.headers.get("cookie");
  if (!cookieHeader) return null;

  const prefix = `${name}=`;
  const cookie = cookieHeader
    .split(";")
    .map((item) => item.trim())
    .find((item) => item.startsWith(prefix));

  return cookie ? cookie.slice(prefix.length) : null;
}

async function refreshStaffSession(session: AdminSessionUser | null) {
  if (!session || session.userType !== "staff" || !session.staffId) return session;

  const staff = await getStaffById(session.staffId).catch(() => null);
  if (!staff) return null;

  return {
    userType: "staff" as const,
    staffId: staff.id,
    username: staff.username,
    displayName: staff.name,
    role: staff.role,
    permissions: staff.permissions,
  };
}

async function getSessionFromTokenWithCutover(token?: string | null) {
  const persistent = await getAdminSessionFromPersistentToken(token);
  if (persistent) return persistent;
  if (await adminSessionInfrastructureReady()) return null;
  return refreshStaffSession(getAdminSessionFromToken(token));
}

async function getAdminSessionFromPersistentToken(token?: string | null): Promise<AdminSessionUser | null> {
  const persistent = await getPersistentAdminSession(token).catch(() => null);
  if (!persistent) return null;
  if (persistent.principal_type === "owner") {
    const credentials = getAdminCredentials();
    if (!credentials || persistent.username !== credentials.username) return null;
    return {
      userType: "owner",
      username: credentials.username,
      displayName: "Owner",
      role: "owner",
      permissions: normalizePermissions("owner", {}),
    };
  }
  if (!persistent.staff_id) return null;
  const staff = await getStaffById(persistent.staff_id).catch(() => null);
  if (!staff) {
    await revokeAdminSession(persistent.id, "inactive_or_missing_staff").catch(() => null);
    return null;
  }
  return {
    userType: "staff",
    staffId: staff.id,
    username: staff.username,
    displayName: staff.name,
    role: staff.role,
    permissions: staff.permissions,
  };
}
