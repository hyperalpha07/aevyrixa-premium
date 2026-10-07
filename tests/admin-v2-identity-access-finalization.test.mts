import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import {
  adminPermissionKeys,
  applyPermissionOverrides,
  normalizePermissionOverrides,
  normalizePermissions,
} from "../app/lib/admin-permissions.ts";

const read = (path: string) => readFileSync(new URL(`../${path}`, import.meta.url), "utf8");

test("identity/access migration creates additive protected security tables", () => {
  const sql = read("supabase/migrations/20261006100000_admin_identity_access_finalization.sql");
  for (const table of [
    "admin_roles",
    "admin_staff_invites",
    "admin_password_reset_tokens",
    "admin_sessions",
    "admin_mfa_credentials",
    "admin_login_throttle",
    "admin_mfa_challenges",
  ]) {
    assert.match(sql, new RegExp(`create table if not exists public\\.${table}`));
    assert.match(sql, new RegExp(`alter table public\\.${table} enable row level security`));
    assert.match(sql, new RegExp(`revoke all on table public\\.${table} from public, anon, authenticated, service_role`));
    assert.match(sql, new RegExp(`create policy ${table}_service_role_all on public\\.${table}`));
  }
  assert.match(sql, /alter table public\.admin_staff\s+add column if not exists permission_overrides jsonb not null default '\{\}'::jsonb/);
  assert.doesNotMatch(sql, /insert into public\.admin_staff[\s\S]+owner/i);
  assert.doesNotMatch(sql, /token text|raw_token|secret text not null/i);
});

test("new security permissions are explicit and not assigned to manager by default", () => {
  for (const permission of ["roles.manage", "permissions.manage", "security.manage"] as const) {
    assert.ok(adminPermissionKeys.includes(permission));
    assert.equal(normalizePermissions("owner", {})[permission], true);
    assert.equal(normalizePermissions("manager", {})[permission], false);
    assert.equal(normalizePermissions("viewer", {})[permission], false);
  }
});

test("permission overrides support inherit allow and deny without unknown grants", () => {
  const base = normalizePermissions("support_staff", {});
  const overrides = normalizePermissionOverrides({
    "orders.view": true,
    "support.reply": false,
    "unknown.permission": true,
  });
  const effective = applyPermissionOverrides(base, overrides);

  assert.equal(effective["orders.view"], true);
  assert.equal(effective["support.reply"], false);
  assert.equal(Object.prototype.hasOwnProperty.call(overrides, "unknown.permission"), false);
});

test("staff, role, invite, reset, session and permission APIs enforce scoped security boundaries", () => {
  assert.match(read("app/api/admin/roles/route.ts"), /hasPermission\(session, "roles\.manage"\)/);
  assert.match(read("app/api/admin/roles/[key]/route.ts"), /System roles cannot be deleted|deleteAdminRole/);
  assert.match(read("app/api/admin/staff/[id]/permissions/route.ts"), /hasPermission\(session, "permissions\.manage"\)/);
  assert.match(read("app/api/admin/staff/invites/route.ts"), /hasPermission\(session, "staff\.manage"\)/);
  assert.match(read("app/api/admin/staff/[id]/reset-link/route.ts"), /hasPermission\(session, "security\.manage"\)/);
  assert.match(read("app/api/admin/staff/[id]/sessions/route.ts"), /security\.manage/);
  assert.match(read("app/api/admin/staff/[id]/sessions/route.ts"), /revokeAdminSessionForStaff/);
  assert.match(read("app/api/admin/login/route.ts"), /isThrottleLocked/);
  assert.match(read("app/api/admin/login/route.ts"), /createPersistentAdminSessionToken/);
});

test("invite and reset public acceptance flows use hashed tokens and one-time server routes", () => {
  const identity = read("app/lib/admin-identity-access.ts");
  assert.match(identity, /token_hash/);
  assert.match(identity, /accepted_at/);
  assert.match(identity, /used_at/);
  assert.match(identity, /getAdminRole\(mapped\.role_key\)/);
  assert.match(identity, /role\.is_active === false/);
  assert.match(identity, /revokeStaffSessions\(staffId, "password_reset"\)/);
  assert.match(read("app/admin/invite/[token]/page.tsx"), /\/api\/admin\/invites\/accept/);
  const resetPage = read("app/admin/reset/[token]/page.tsx");
  const resetRoute = read("app/api/admin/reset/accept/route.ts");
  assert.match(resetPage, /\/api\/admin\/reset\/accept/);
  assert.match(resetPage, /name="confirmPassword"/);
  assert.match(resetRoute, /Password confirmation does not match/);
  assert.match(resetRoute, /Reset link is invalid or expired/);
});

test("MFA helpers encrypt secrets, hash recovery codes, and never expose encryption key to public env", () => {
  const identity = read("app/lib/admin-identity-access.ts");
  const env = read(".env.example");
  assert.match(env, /^ADMIN_SECURITY_ENCRYPTION_KEY=/m);
  assert.doesNotMatch(env, /NEXT_PUBLIC_ADMIN_SECURITY_ENCRYPTION_KEY/);
  assert.match(identity, /createCipheriv\("aes-256-gcm"/);
  assert.match(identity, /generateTotpSecret/);
  assert.match(identity, /verifyTotp/);
  assert.match(identity, /hashRecoveryCode/);
});

test("MFA login step-up creates a hashed short-lived challenge before issuing a full session", () => {
  const login = read("app/api/admin/login/route.ts");
  const mfaLogin = read("app/api/admin/login/mfa/route.ts");
  const identity = read("app/lib/admin-identity-access.ts");
  const form = read("app/admin/login/admin-login-form.tsx");

  assert.match(login, /mfaEnabled/);
  assert.match(login, /createMfaChallenge/);
  assert.match(login, /mfaRequired: true/);
  assert.match(mfaLogin, /getMfaChallenge/);
  assert.match(mfaLogin, /verifyMfaCredential/);
  assert.match(mfaLogin, /consumeMfaChallenge/);
  assert.match(identity, /token_hash: hashValue\(token\)/);
  assert.match(identity, /5 \* 60 \* 1000/);
  assert.match(form, /mfaRequired/);
  assert.match(form, /\/api\/admin\/login\/mfa/);
});

test("DB session cutover rejects legacy signed sessions once admin_sessions exists", () => {
  const auth = read("app/lib/admin-auth.ts");
  assert.match(auth, /adminSessionInfrastructureReady/);
  assert.match(auth, /if \(await adminSessionInfrastructureReady\(\)\) return null/);
  assert.match(auth, /return refreshStaffSession\(getAdminSessionFromToken\(token\)\)/);
  assert.match(auth, /createPersistentAdminSession/);
  assert.match(auth, /throw error/);
});

test("MFA self-service and administrative reset endpoints are real and scoped", () => {
  const mfa = read("app/api/admin/security/mfa/route.ts");
  const staffMfa = read("app/api/admin/staff/[id]/mfa/route.ts");
  assert.match(mfa, /startMfaSetup/);
  assert.match(mfa, /confirmMfaSetup/);
  assert.match(mfa, /regenerateMfaRecoveryCodes/);
  assert.match(mfa, /disableMfaCredential/);
  assert.match(mfa, /verifyMfaCredential/);
  assert.match(staffMfa, /security\.manage/);
  assert.match(staffMfa, /disableMfaCredential/);
});
