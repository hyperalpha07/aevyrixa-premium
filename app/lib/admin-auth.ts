import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";

export const ADMIN_SESSION_COOKIE = "aevyrixa_admin_session";

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

export function createAdminSessionToken(username: string) {
  const expiresAt = Date.now() + sessionMaxAgeSeconds * 1000;
  const session = Buffer.from(JSON.stringify({ username, expiresAt })).toString(
    "base64url"
  );
  const payload = `${sessionVersion}.${session}`;
  const signature = signSessionPayload(payload);

  if (!signature) return null;

  return `${payload}.${signature}`;
}

export function verifyAdminSessionToken(token?: string | null) {
  if (!token) return false;

  const [version, session, signature, ...extra] = token.split(".");
  if (extra.length > 0) return false;

  if (version !== sessionVersion) return false;

  let parsedSession: { username?: unknown; expiresAt?: unknown };

  try {
    parsedSession = JSON.parse(Buffer.from(session, "base64url").toString("utf8"));
  } catch {
    return false;
  }

  const credentials = getAdminCredentials();
  if (!credentials || parsedSession.username !== credentials.username) return false;

  const expiresAt = Number(parsedSession.expiresAt);
  if (!Number.isFinite(expiresAt) || expiresAt <= Date.now()) return false;

  const expectedSignature = signSessionPayload(`${version}.${session}`);

  return Boolean(expectedSignature && safeEqual(signature, expectedSignature));
}

export async function hasAdminSession() {
  const cookieStore = await cookies();
  return verifyAdminSessionToken(cookieStore.get(ADMIN_SESSION_COOKIE)?.value);
}

export function verifyAdminRequest(request: Request) {
  return verifyAdminSessionToken(readCookie(request, ADMIN_SESSION_COOKIE));
}

export function unauthorizedAdminResponse() {
  return Response.json(
    { errors: ["Admin authentication is required."] },
    { status: 401 }
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
