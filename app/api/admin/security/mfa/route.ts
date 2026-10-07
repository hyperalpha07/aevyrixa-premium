import {
  forbiddenAdminResponse,
  getAdminCredentials,
  getFreshAdminRequestSession,
  unauthorizedAdminResponse,
} from "@/app/lib/admin-auth";
import {
  confirmMfaSetup,
  disableMfaCredential,
  getMfaCredential,
  mfaEncryptionAvailable,
  ownerPrincipalId,
  regenerateMfaRecoveryCodes,
  startMfaSetup,
  verifyMfaCredential,
} from "@/app/lib/admin-identity-access";
import { logStaffActivity } from "@/app/lib/admin-staff";

export const dynamic = "force-dynamic";

function text(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function principal(session: Awaited<ReturnType<typeof getFreshAdminRequestSession>>) {
  if (!session) return null;
  if (session.userType === "owner") {
    const credentials = getAdminCredentials();
    if (!credentials) return null;
    return { principalType: "owner" as const, principalId: ownerPrincipalId(credentials.username), username: credentials.username };
  }
  if (!session.staffId) return null;
  return { principalType: "staff" as const, principalId: session.staffId, username: session.username };
}

export async function GET(request: Request) {
  const session = await getFreshAdminRequestSession(request);
  if (!session) return unauthorizedAdminResponse();
  const target = principal(session);
  if (!target) return forbiddenAdminResponse();
  const credential = await getMfaCredential(target).catch(() => null);
  return Response.json({
    mfa: {
      available: mfaEncryptionAvailable(),
      enabled: Boolean(credential?.enabled_at),
      setupStarted: Boolean(credential && !credential.enabled_at),
    },
  });
}

export async function POST(request: Request) {
  const session = await getFreshAdminRequestSession(request);
  if (!session) return unauthorizedAdminResponse();
  const target = principal(session);
  if (!target) return forbiddenAdminResponse();
  const body = await request.json().catch(() => null) as Record<string, unknown> | null;
  const action = text(body?.action);

  try {
    if (action === "start") {
      const result = await startMfaSetup(target);
      await logStaffActivity({ actor: session, action: "mfa.setup_started", targetType: target.principalType, targetId: target.principalId });
      return Response.json({ setup: result });
    }
    if (action === "confirm") {
      const result = await confirmMfaSetup({ ...target, code: text(body?.code) });
      await logStaffActivity({ actor: session, action: "mfa.enabled", targetType: target.principalType, targetId: target.principalId });
      return Response.json(result);
    }
    if (action === "regenerate_recovery") {
      const result = await regenerateMfaRecoveryCodes({ ...target, code: text(body?.code) });
      await logStaffActivity({ actor: session, action: "mfa.recovery_codes_regenerated", targetType: target.principalType, targetId: target.principalId });
      return Response.json(result);
    }
    if (action === "disable") {
      const credential = await getMfaCredential(target);
      if (credential?.enabled_at) {
        const verified = await verifyMfaCredential({ credential, code: text(body?.code) });
        if (!verified.ok) throw new Error("Verification failed.");
      }
      await disableMfaCredential(target);
      await logStaffActivity({ actor: session, action: "mfa.disabled", targetType: target.principalType, targetId: target.principalId });
      return Response.json({ ok: true });
    }
    return Response.json({ errors: ["Unsupported MFA action."] }, { status: 400 });
  } catch (error) {
    return Response.json({ errors: [error instanceof Error ? error.message : "MFA action failed."] }, { status: 400 });
  }
}
