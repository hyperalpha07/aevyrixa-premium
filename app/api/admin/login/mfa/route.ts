import {
  ADMIN_MFA_CHALLENGE_COOKIE,
  ADMIN_SESSION_COOKIE,
  adminSessionCookieOptions,
  createPersistentAdminSessionToken,
  getAdminCredentials,
} from "@/app/lib/admin-auth";
import {
  consumeMfaChallenge,
  getMfaChallenge,
  getMfaCredential,
  isThrottleLocked,
  recordMfaChallengeFailure,
  recordThrottleAttempt,
  verifyMfaCredential,
} from "@/app/lib/admin-identity-access";
import { getStaffById, logStaffActivity } from "@/app/lib/admin-staff";
import { normalizePermissions } from "@/app/lib/admin-permissions";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

function readCookie(request: Request, name: string) {
  const cookieHeader = request.headers.get("cookie");
  if (!cookieHeader) return null;
  const prefix = `${name}=`;
  return cookieHeader
    .split(";")
    .map((item) => item.trim())
    .find((item) => item.startsWith(prefix))
    ?.slice(prefix.length) ?? null;
}

function text(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => null) as Record<string, unknown> | null;
  const code = text(body?.code);
  const next = typeof body?.next === "string" && body.next.startsWith("/admin") ? body.next : "/admin";
  if (!code) return Response.json({ errors: ["Verification failed."] }, { status: 400 });

  const challenge = await getMfaChallenge(readCookie(request, ADMIN_MFA_CHALLENGE_COOKIE));
  if (!challenge) return Response.json({ errors: ["Verification expired. Please sign in again."] }, { status: 401 });
  if (await isThrottleLocked({ key: challenge.username, purpose: "mfa" })) {
    return Response.json({ errors: ["Verification failed."] }, { status: 429 });
  }

  const credential = await getMfaCredential({
    principalType: challenge.principal_type,
    principalId: challenge.principal_id,
  });
  if (!credential?.enabled_at) return Response.json({ errors: ["Verification failed."] }, { status: 401 });

  const verified = await verifyMfaCredential({ credential, code }).catch(() => ({ ok: false, recoveryUsed: false }));
  if (!verified.ok) {
    await recordMfaChallengeFailure(challenge.id).catch(() => null);
    await recordThrottleAttempt({ key: challenge.username, purpose: "mfa", success: false }).catch(() => null);
    return Response.json({ errors: ["Verification failed."] }, { status: 401 });
  }

  await consumeMfaChallenge(challenge.id);
  await recordThrottleAttempt({ key: challenge.username, purpose: "mfa", success: true }).catch(() => null);

  let token: string | null = null;
  if (challenge.principal_type === "owner") {
    const credentials = getAdminCredentials();
    if (!credentials || credentials.username !== challenge.username) {
      return Response.json({ errors: ["Verification failed."] }, { status: 401 });
    }
    token = await createPersistentAdminSessionToken({
      userType: "owner",
      username: credentials.username,
      displayName: "Owner",
      role: "owner",
      permissions: normalizePermissions("owner", {}),
    }, request);
  } else {
    const staff = await getStaffById(challenge.principal_id);
    if (!staff) return Response.json({ errors: ["Verification failed."] }, { status: 401 });
    token = await createPersistentAdminSessionToken({
      userType: "staff",
      staffId: staff.id,
      username: staff.username,
      displayName: staff.name,
      role: staff.role,
      permissions: staff.permissions,
    }, request);
    await logStaffActivity({
      actor: { userType: "staff", staffId: staff.id, username: staff.username, displayName: staff.name, role: staff.role, permissions: staff.permissions },
      action: verified.recoveryUsed ? "mfa.recovery_code_used" : "mfa.verified",
      targetType: "staff",
      targetId: staff.id,
    });
  }

  if (!token) return Response.json({ errors: ["Admin session could not be created."] }, { status: 500 });
  const response = NextResponse.json({ ok: true, next });
  response.cookies.set(ADMIN_SESSION_COOKIE, token, adminSessionCookieOptions());
  response.cookies.delete(ADMIN_MFA_CHALLENGE_COOKIE);
  return response;
}
