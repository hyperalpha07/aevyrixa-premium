import "server-only";

import {
  createCipheriv,
  createDecipheriv,
  createHash,
  createHmac,
  randomBytes,
  timingSafeEqual,
} from "node:crypto";
import {
  adminPermissionKeys,
  normalizePermissions,
  normalizeRole,
  protectedAdminRoleKeys,
  roleDefaultPermissions,
  roleLabels,
  systemStaffRoleKeys,
  type AdminPermission,
  type AdminRole,
  type AdminSessionUser,
} from "@/app/lib/admin-permissions";
import { hashStaffPassword, type AdminStaffRecord } from "@/app/lib/admin-staff";

const ROLE_TABLE = "admin_roles";
const STAFF_TABLE = "admin_staff";
const INVITE_TABLE = "admin_staff_invites";
const RESET_TABLE = "admin_password_reset_tokens";
const SESSION_TABLE = "admin_sessions";
const MFA_TABLE = "admin_mfa_credentials";
const THROTTLE_TABLE = "admin_login_throttle";
const MFA_CHALLENGE_TABLE = "admin_mfa_challenges";

export const ADMIN_SESSION_SECONDS = 60 * 60 * 8;

export type PermissionOverrideValue = true | false | null;
export type PermissionOverrides = Partial<Record<AdminPermission, PermissionOverrideValue>>;

export type AdminRoleRecord = {
  key: string;
  name: string;
  description: string | null;
  permissions: Record<AdminPermission, boolean>;
  is_system: boolean;
  is_active: boolean;
  created_by: string | null;
  created_at: string;
  updated_at: string;
};

export type AdminSessionRecord = {
  id: string;
  principal_type: "owner" | "staff";
  staff_id: string | null;
  username: string;
  created_at: string;
  last_seen_at: string;
  expires_at: string;
  revoked_at: string | null;
  revoke_reason: string | null;
  user_agent_hash: string | null;
};

export type AdminInviteRecord = {
  id: string;
  email: string;
  role_key: string;
  permission_overrides: PermissionOverrides;
  expires_at: string;
  accepted_at: string | null;
  revoked_at: string | null;
  created_by: string | null;
  created_at: string;
};

export type AdminMfaCredentialRecord = {
  id: string;
  principal_type: "owner" | "staff";
  principal_id: string;
  secret_encrypted: string;
  enabled_at: string | null;
  recovery_codes_hashes: string[];
};

export type AdminMfaChallengeRecord = {
  id: string;
  principal_type: "owner" | "staff";
  principal_id: string;
  username: string;
  expires_at: string;
  consumed_at: string | null;
  revoked_at: string | null;
  attempts: number;
};

function hasConfig() {
  return Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY);
}

function endpoint(path: string) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!url) throw new Error("Missing Supabase URL.");
  return `${url.replace(/\/$/, "")}/rest/v1/${path}`;
}

function headers(extra: Record<string, string> = {}) {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";
  return {
    apikey: key,
    Authorization: `Bearer ${key}`,
    "content-type": "application/json",
    ...extra,
  };
}

async function dbGet<T>(path: string): Promise<T> {
  const res = await fetch(endpoint(path), { headers: headers(), cache: "no-store" });
  if (!res.ok) throw new Error(`Admin identity GET failed ${res.status}: ${(await res.text()).slice(0, 220)}`);
  return res.json() as Promise<T>;
}

async function dbPost<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(endpoint(path), {
    method: "POST",
    headers: headers({ prefer: "return=representation" }),
    body: JSON.stringify(body),
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`Admin identity POST failed ${res.status}: ${(await res.text()).slice(0, 220)}`);
  return res.json() as Promise<T>;
}

async function dbPatch<T = unknown>(path: string, body: unknown, representation = false): Promise<T> {
  const res = await fetch(endpoint(path), {
    method: "PATCH",
    headers: headers({ prefer: representation ? "return=representation" : "return=minimal" }),
    body: JSON.stringify(body),
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`Admin identity PATCH failed ${res.status}: ${(await res.text()).slice(0, 220)}`);
  return representation ? res.json() as Promise<T> : undefined as T;
}

async function dbDelete(path: string) {
  const res = await fetch(endpoint(path), {
    method: "DELETE",
    headers: headers({ prefer: "return=minimal" }),
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`Admin identity DELETE failed ${res.status}: ${(await res.text()).slice(0, 220)}`);
}

function missingInfrastructure(error: unknown) {
  const message = error instanceof Error ? error.message.toLowerCase() : String(error).toLowerCase();
  return message.includes("schema cache") || message.includes("could not find") || message.includes("does not exist") || message.includes("404");
}

function hashValue(value: string) {
  return createHash("sha256").update(value).digest("base64url");
}

function publicToken(bytes = 32) {
  return randomBytes(bytes).toString("base64url");
}

function normalizePermissionMap(value: unknown): Record<AdminPermission, boolean> {
  const source = typeof value === "object" && value !== null && !Array.isArray(value) ? value as Record<string, unknown> : {};
  return adminPermissionKeys.reduce((result, key) => {
    result[key] = source[key] === true;
    return result;
  }, {} as Record<AdminPermission, boolean>);
}

export function normalizePermissionOverrides(value: unknown): PermissionOverrides {
  const source = typeof value === "object" && value !== null && !Array.isArray(value) ? value as Record<string, unknown> : {};
  return adminPermissionKeys.reduce((result, key) => {
    if (source[key] === true || source[key] === false || source[key] === null) result[key] = source[key] as PermissionOverrideValue;
    return result;
  }, {} as PermissionOverrides);
}

export function applyPermissionOverrides(base: Record<AdminPermission, boolean>, overrides: PermissionOverrides) {
  return adminPermissionKeys.reduce((result, key) => {
    const override = overrides[key];
    result[key] = override === true ? true : override === false ? false : base[key] === true;
    return result;
  }, {} as Record<AdminPermission, boolean>);
}

export function actorCanGrantPermissions(actor: AdminSessionUser, permissions: Record<AdminPermission, boolean>) {
  if (actor.userType === "owner" || actor.isOwner) return true;
  return adminPermissionKeys.every(key => permissions[key] !== true || actor.permissions[key] === true);
}

export function actorCanApplyOverrides(actor: AdminSessionUser, overrides: PermissionOverrides) {
  if (actor.userType === "owner" || actor.isOwner) return true;
  return adminPermissionKeys.every(key => overrides[key] !== true || actor.permissions[key] === true);
}

function systemRoleRecord(key: (typeof systemStaffRoleKeys)[number]): AdminRoleRecord {
  return {
    key,
    name: roleLabels[key],
    description: "Built-in protected role template.",
    permissions: normalizePermissions(key, {}),
    is_system: true,
    is_active: true,
    created_by: null,
    created_at: new Date(0).toISOString(),
    updated_at: new Date(0).toISOString(),
  };
}

function mapRole(row: Record<string, unknown>): AdminRoleRecord {
  return {
    key: String(row.key ?? ""),
    name: String(row.name ?? ""),
    description: typeof row.description === "string" ? row.description : null,
    permissions: normalizePermissionMap(row.permissions),
    is_system: row.is_system === true,
    is_active: row.is_active !== false,
    created_by: typeof row.created_by === "string" ? row.created_by : null,
    created_at: typeof row.created_at === "string" ? row.created_at : "",
    updated_at: typeof row.updated_at === "string" ? row.updated_at : "",
  };
}

export async function listAdminRoles(): Promise<AdminRoleRecord[]> {
  if (!hasConfig()) return systemStaffRoleKeys.map(systemRoleRecord);
  try {
    const rows = await dbGet<Record<string, unknown>[]>(`${ROLE_TABLE}?select=*&order=is_system.desc,name.asc`);
    const byKey = new Map(rows.map(row => [String(row.key), mapRole(row)]));
    for (const key of systemStaffRoleKeys) if (!byKey.has(key)) byKey.set(key, systemRoleRecord(key));
    return [...byKey.values()];
  } catch {
    return systemStaffRoleKeys.map(systemRoleRecord);
  }
}

export async function getAdminRole(key: string) {
  const normalized = normalizeRole(key);
  if (systemStaffRoleKeys.includes(normalized as (typeof systemStaffRoleKeys)[number])) return systemRoleRecord(normalized as (typeof systemStaffRoleKeys)[number]);
  if (!hasConfig()) return null;
  const row = (await dbGet<Record<string, unknown>[]>(`${ROLE_TABLE}?key=eq.${encodeURIComponent(normalized)}&select=*&limit=1`))[0];
  return row ? mapRole(row) : null;
}

export function validateRolePayload(input: { key?: string; name?: string; permissions?: unknown }, updating = false) {
  const key = input.key?.trim().toLowerCase() ?? "";
  const name = input.name?.trim() ?? "";
  const errors: string[] = [];
  if (!updating && !/^[a-z][a-z0-9_]{1,63}$/.test(key)) errors.push("Role key must be a stable lowercase slug.");
  if (!updating && (protectedAdminRoleKeys as readonly string[]).includes(key)) errors.push("Built-in role keys are reserved.");
  if (!name || name.length > 120) errors.push("Role name must be 1 to 120 characters.");
  const permissions = normalizePermissionMap(input.permissions);
  return { key, name, permissions, errors };
}

export async function createAdminRole(input: { key: string; name: string; description?: string; permissions: Record<AdminPermission, boolean>; createdBy?: string | null }) {
  const rows = await dbPost<Record<string, unknown>[]>(`${ROLE_TABLE}?select=*`, {
    key: input.key,
    name: input.name,
    description: input.description ?? null,
    permissions: input.permissions,
    is_system: false,
    is_active: true,
    created_by: input.createdBy ?? null,
  });
  return mapRole(rows[0] ?? {});
}

export async function updateAdminRole(key: string, input: { name?: string; description?: string | null; permissions?: Record<AdminPermission, boolean>; isActive?: boolean }) {
  const role = await getAdminRole(key);
  if (!role) return null;
  if (role.is_system) throw new Error("System roles cannot be edited through this API.");
  const payload: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (input.name !== undefined) payload.name = input.name;
  if (input.description !== undefined) payload.description = input.description;
  if (input.permissions !== undefined) payload.permissions = input.permissions;
  if (input.isActive !== undefined) payload.is_active = input.isActive;
  const rows = await dbPatch<Record<string, unknown>[]>(`${ROLE_TABLE}?key=eq.${encodeURIComponent(key)}&select=*`, payload, true);
  return mapRole(rows[0] ?? {});
}

export async function deleteAdminRole(key: string, staff: AdminStaffRecord[]) {
  const role = await getAdminRole(key);
  if (!role) return false;
  if (role.is_system) throw new Error("System roles cannot be deleted.");
  if (staff.some(member => member.role === key)) throw new Error("Cannot delete a role assigned to staff.");
  await dbDelete(`${ROLE_TABLE}?key=eq.${encodeURIComponent(key)}`);
  return true;
}

export async function updateStaffPermissionOverrides(staffId: string, overrides: PermissionOverrides) {
  const rows = await dbPatch<Record<string, unknown>[]>(
    `${STAFF_TABLE}?id=eq.${encodeURIComponent(staffId)}&select=id,permission_overrides`,
    { permission_overrides: overrides, updated_at: new Date().toISOString() },
    true,
  );
  return rows[0] ?? null;
}

export async function createAdminInvite(input: { email: string; roleKey: string; overrides: PermissionOverrides; createdBy?: string | null; expiresAt?: string }) {
  const role = await getAdminRole(input.roleKey);
  if (!role || role.key === "owner" || role.is_active === false) throw new Error("Selected role is not available.");
  const rawToken = publicToken(32);
  const expiresAt = input.expiresAt ?? new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
  const rows = await dbPost<Record<string, unknown>[]>(`${INVITE_TABLE}?select=*`, {
    email: input.email.trim().toLowerCase(),
    role_key: role.key,
    permission_overrides: input.overrides,
    token_hash: hashValue(rawToken),
    expires_at: expiresAt,
    created_by: input.createdBy ?? null,
  });
  return { invite: mapInvite(rows[0] ?? {}), token: rawToken };
}

function mapInvite(row: Record<string, unknown>): AdminInviteRecord {
  return {
    id: String(row.id ?? ""),
    email: String(row.email ?? ""),
    role_key: String(row.role_key ?? ""),
    permission_overrides: normalizePermissionOverrides(row.permission_overrides),
    expires_at: String(row.expires_at ?? ""),
    accepted_at: typeof row.accepted_at === "string" ? row.accepted_at : null,
    revoked_at: typeof row.revoked_at === "string" ? row.revoked_at : null,
    created_by: typeof row.created_by === "string" ? row.created_by : null,
    created_at: String(row.created_at ?? ""),
  };
}

export async function listAdminInvites() {
  if (!hasConfig()) return [] as AdminInviteRecord[];
  const rows = await dbGet<Record<string, unknown>[]>(`${INVITE_TABLE}?select=id,email,role_key,permission_overrides,expires_at,accepted_at,revoked_at,created_by,created_at&order=created_at.desc&limit=80`);
  return rows.map(mapInvite);
}

export async function revokeAdminInvite(id: string) {
  await dbPatch(`${INVITE_TABLE}?id=eq.${encodeURIComponent(id)}`, { revoked_at: new Date().toISOString() });
}

export async function acceptAdminInvite(input: { token: string; name: string; username: string; password: string }) {
  const tokenHash = hashValue(input.token);
  const invite = (await dbGet<Record<string, unknown>[]>(`${INVITE_TABLE}?token_hash=eq.${encodeURIComponent(tokenHash)}&select=*&limit=1`))[0];
  if (!invite) throw new Error("Invite is invalid or expired.");
  const mapped = mapInvite(invite);
  const now = Date.now();
  if (mapped.revoked_at || mapped.accepted_at || Date.parse(mapped.expires_at) <= now) throw new Error("Invite is invalid or expired.");
  if (input.password.length < 12) throw new Error("Password must be at least 12 characters.");
  const role = await getAdminRole(mapped.role_key);
  if (!role || role.key === "owner" || role.is_active === false) throw new Error("Invite is invalid or expired.");
  const rows = await dbPost<Record<string, unknown>[]>(`${STAFF_TABLE}?select=*`, {
    name: input.name.trim(),
    username: input.username.trim(),
    email: mapped.email,
    role: mapped.role_key,
    permissions: {},
    permission_overrides: mapped.permission_overrides,
    password_hash: hashStaffPassword(input.password),
    is_active: true,
    created_by: mapped.created_by,
    updated_at: new Date().toISOString(),
  });
  await dbPatch(`${INVITE_TABLE}?id=eq.${encodeURIComponent(mapped.id)}`, { accepted_at: new Date().toISOString() });
  return rows[0] ?? null;
}

export async function createPasswordResetLink(input: { staffId: string; createdBy?: string | null; expiresAt?: string }) {
  const token = publicToken(32);
  const rows = await dbPost<Record<string, unknown>[]>(`${RESET_TABLE}?select=id,staff_id,expires_at,created_at`, {
    staff_id: input.staffId,
    token_hash: hashValue(token),
    expires_at: input.expiresAt ?? new Date(Date.now() + 60 * 60 * 1000).toISOString(),
    created_by: input.createdBy ?? null,
  });
  return { reset: rows[0] ?? null, token };
}

export async function acceptPasswordReset(input: { token: string; password: string }) {
  if (input.password.length < 12) throw new Error("Password must be at least 12 characters.");
  const tokenHash = hashValue(input.token);
  const reset = (await dbGet<Record<string, unknown>[]>(
    `${RESET_TABLE}?token_hash=eq.${encodeURIComponent(tokenHash)}&select=id,staff_id,expires_at,used_at,revoked_at&limit=1`
  ))[0];
  if (!reset) throw new Error("Reset link is invalid or expired.");
  const resetId = String(reset.id ?? "");
  const staffId = String(reset.staff_id ?? "");
  const usedAt = typeof reset.used_at === "string" ? reset.used_at : null;
  const revokedAt = typeof reset.revoked_at === "string" ? reset.revoked_at : null;
  const expiresAt = typeof reset.expires_at === "string" ? reset.expires_at : "";
  if (!resetId || !staffId || usedAt || revokedAt || Date.parse(expiresAt) <= Date.now()) {
    throw new Error("Reset link is invalid or expired.");
  }

  await dbPatch(`${STAFF_TABLE}?id=eq.${encodeURIComponent(staffId)}`, {
    password_hash: hashStaffPassword(input.password),
    updated_at: new Date().toISOString(),
  });
  await dbPatch(`${RESET_TABLE}?id=eq.${encodeURIComponent(resetId)}`, { used_at: new Date().toISOString() });
  await revokeStaffSessions(staffId, "password_reset");
  return { staffId, resetId };
}

export async function createPersistentAdminSession(input: {
  principalType: "owner" | "staff";
  username: string;
  staffId?: string | null;
  userAgent?: string | null;
}) {
  const token = `db.${publicToken(32)}`;
  const expiresAt = new Date(Date.now() + ADMIN_SESSION_SECONDS * 1000).toISOString();
  await dbPost(`${SESSION_TABLE}?select=id`, {
    principal_type: input.principalType,
    staff_id: input.principalType === "staff" ? input.staffId ?? null : null,
    username: input.username,
    token_hash: hashValue(token),
    expires_at: expiresAt,
    user_agent_hash: input.userAgent ? hashValue(input.userAgent.slice(0, 300)) : null,
  });
  return token;
}

export async function adminSessionInfrastructureReady() {
  if (!hasConfig()) return false;
  try {
    await dbGet<Record<string, unknown>[]>(`${SESSION_TABLE}?select=id&limit=1`);
    return true;
  } catch (error) {
    if (missingInfrastructure(error)) return false;
    return true;
  }
}

export async function getPersistentAdminSession(token: string | null | undefined) {
  if (!token?.startsWith("db.") || !hasConfig()) return null;
  const rows = await dbGet<Record<string, unknown>[]>(`${SESSION_TABLE}?token_hash=eq.${encodeURIComponent(hashValue(token))}&select=*&limit=1`);
  const row = rows[0];
  if (!row) return null;
  const session = mapSession(row);
  if (session.revoked_at || Date.parse(session.expires_at) <= Date.now()) return null;
  await dbPatch(`${SESSION_TABLE}?id=eq.${encodeURIComponent(session.id)}`, { last_seen_at: new Date().toISOString() }).catch(() => null);
  return session;
}

function mapSession(row: Record<string, unknown>): AdminSessionRecord {
  return {
    id: String(row.id ?? ""),
    principal_type: row.principal_type === "owner" ? "owner" : "staff",
    staff_id: typeof row.staff_id === "string" ? row.staff_id : null,
    username: String(row.username ?? ""),
    created_at: String(row.created_at ?? ""),
    last_seen_at: String(row.last_seen_at ?? ""),
    expires_at: String(row.expires_at ?? ""),
    revoked_at: typeof row.revoked_at === "string" ? row.revoked_at : null,
    revoke_reason: typeof row.revoke_reason === "string" ? row.revoke_reason : null,
    user_agent_hash: typeof row.user_agent_hash === "string" ? row.user_agent_hash : null,
  };
}

export async function listAdminSessions(input: { staffId?: string; ownerUsername?: string }) {
  if (!hasConfig()) return [] as AdminSessionRecord[];
  const filter = input.staffId
    ? `staff_id=eq.${encodeURIComponent(input.staffId)}`
    : `username=eq.${encodeURIComponent(input.ownerUsername ?? "")}&principal_type=eq.owner`;
  const rows = await dbGet<Record<string, unknown>[]>(`${SESSION_TABLE}?${filter}&select=id,principal_type,staff_id,username,created_at,last_seen_at,expires_at,revoked_at,revoke_reason,user_agent_hash&order=created_at.desc&limit=50`);
  return rows.map(mapSession);
}

export async function revokeAdminSession(sessionId: string, reason = "revoked") {
  await dbPatch(`${SESSION_TABLE}?id=eq.${encodeURIComponent(sessionId)}`, { revoked_at: new Date().toISOString(), revoke_reason: reason });
}

export async function revokeAdminSessionForStaff(input: { sessionId: string; staffId: string; reason?: string }) {
  const session = (await dbGet<Record<string, unknown>[]>(
    `${SESSION_TABLE}?id=eq.${encodeURIComponent(input.sessionId)}&staff_id=eq.${encodeURIComponent(input.staffId)}&select=id&limit=1`
  ).catch(() => []))[0];
  if (!session?.id) return false;
  await revokeAdminSession(input.sessionId, input.reason ?? "revoked");
  return true;
}

export async function revokeStaffSessions(staffId: string, reason = "staff_security_change") {
  await dbPatch(`${SESSION_TABLE}?staff_id=eq.${encodeURIComponent(staffId)}&revoked_at=is.null`, { revoked_at: new Date().toISOString(), revoke_reason: reason });
}

export function mfaEncryptionAvailable() {
  const raw = process.env.ADMIN_SECURITY_ENCRYPTION_KEY ?? "";
  try {
    return Buffer.from(raw, "base64").length === 32;
  } catch {
    return false;
  }
}

function encryptionKey() {
  const key = Buffer.from(process.env.ADMIN_SECURITY_ENCRYPTION_KEY ?? "", "base64");
  if (key.length !== 32) throw new Error("ADMIN_SECURITY_ENCRYPTION_KEY must be a base64-encoded 32-byte key.");
  return key;
}

export function encryptMfaSecret(secret: string) {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", encryptionKey(), iv);
  const encrypted = Buffer.concat([cipher.update(secret, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return [iv, tag, encrypted].map(part => part.toString("base64url")).join(".");
}

export function decryptMfaSecret(value: string) {
  const [ivRaw, tagRaw, encryptedRaw] = value.split(".");
  const decipher = createDecipheriv("aes-256-gcm", encryptionKey(), Buffer.from(ivRaw, "base64url"));
  decipher.setAuthTag(Buffer.from(tagRaw, "base64url"));
  return Buffer.concat([decipher.update(Buffer.from(encryptedRaw, "base64url")), decipher.final()]).toString("utf8");
}

function base32Encode(input: Buffer) {
  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
  let bits = "";
  for (const byte of input) bits += byte.toString(2).padStart(8, "0");
  const chunks = bits.match(/.{1,5}/g) ?? [];
  return chunks.map(chunk => alphabet[parseInt(chunk.padEnd(5, "0"), 2)]).join("");
}

export function generateTotpSecret() {
  return base32Encode(randomBytes(20));
}

function hotp(secret: Buffer, counter: bigint) {
  const buffer = Buffer.alloc(8);
  buffer.writeBigUInt64BE(counter);
  const hmac = createHmac("sha1", secret).update(buffer).digest();
  const offset = hmac[hmac.length - 1] & 0xf;
  const binary = ((hmac[offset] & 0x7f) << 24) | (hmac[offset + 1] << 16) | (hmac[offset + 2] << 8) | hmac[offset + 3];
  return String(binary % 1_000_000).padStart(6, "0");
}

function base32Decode(input: string) {
  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
  let bits = "";
  for (const char of input.replace(/=+$/g, "").toUpperCase()) {
    const value = alphabet.indexOf(char);
    if (value < 0) continue;
    bits += value.toString(2).padStart(5, "0");
  }
  const bytes = bits.match(/.{1,8}/g)?.filter(chunk => chunk.length === 8).map(chunk => parseInt(chunk, 2)) ?? [];
  return Buffer.from(bytes);
}

export function verifyTotp(secret: string, code: string, now = Date.now()) {
  if (!/^\d{6}$/.test(code)) return false;
  const secretBytes = base32Decode(secret);
  const counter = BigInt(Math.floor(now / 30_000));
  return [BigInt(-1), BigInt(0), BigInt(1)].some(offset =>
    timingSafeEqual(Buffer.from(hotp(secretBytes, counter + offset)), Buffer.from(code))
  );
}

export function hashRecoveryCode(code: string) {
  return hashValue(code.trim());
}

export function recoveryCodes(count = 10) {
  return Array.from({ length: count }, () => randomBytes(5).toString("base64url").toUpperCase());
}

export async function upsertMfaCredential(input: {
  principalType: "owner" | "staff";
  principalId: string;
  secret: string;
  recoveryCodes: string[];
  enabled: boolean;
}) {
  if (!mfaEncryptionAvailable()) throw new Error("MFA encryption is not configured.");
  const encrypted = encryptMfaSecret(input.secret);
  const recoveryHashes = input.recoveryCodes.map(hashRecoveryCode);
  const existing = (await dbGet<Record<string, unknown>[]>(
    `${MFA_TABLE}?principal_type=eq.${input.principalType}&principal_id=eq.${encodeURIComponent(input.principalId)}&select=id&limit=1`
  ).catch(() => []))[0];
  const payload = {
    principal_type: input.principalType,
    principal_id: input.principalId,
    secret_encrypted: encrypted,
    recovery_codes_hashes: recoveryHashes,
    enabled_at: input.enabled ? new Date().toISOString() : null,
    updated_at: new Date().toISOString(),
  };
  if (existing?.id) {
    await dbPatch(`${MFA_TABLE}?id=eq.${encodeURIComponent(String(existing.id))}`, payload);
    return { id: String(existing.id), recoveryCodes: input.recoveryCodes };
  }
  const rows = await dbPost<Record<string, unknown>[]>(`${MFA_TABLE}?select=id`, payload);
  return { id: String(rows[0]?.id ?? ""), recoveryCodes: input.recoveryCodes };
}

export async function disableMfaCredential(input: { principalType: "owner" | "staff"; principalId: string }) {
  await dbPatch(
    `${MFA_TABLE}?principal_type=eq.${input.principalType}&principal_id=eq.${encodeURIComponent(input.principalId)}`,
    { enabled_at: null, updated_at: new Date().toISOString() }
  );
}

function mapMfaCredential(row: Record<string, unknown>): AdminMfaCredentialRecord {
  return {
    id: String(row.id ?? ""),
    principal_type: row.principal_type === "owner" ? "owner" : "staff",
    principal_id: String(row.principal_id ?? ""),
    secret_encrypted: String(row.secret_encrypted ?? ""),
    enabled_at: typeof row.enabled_at === "string" ? row.enabled_at : null,
    recovery_codes_hashes: Array.isArray(row.recovery_codes_hashes)
      ? row.recovery_codes_hashes.filter((code): code is string => typeof code === "string")
      : [],
  };
}

export function ownerPrincipalId(username: string) {
  return `owner:${hashValue(username.trim().toLowerCase())}`;
}

export async function getMfaCredential(input: { principalType: "owner" | "staff"; principalId: string }) {
  if (!hasConfig()) return null;
  const rows = await dbGet<Record<string, unknown>[]>(
    `${MFA_TABLE}?principal_type=eq.${input.principalType}&principal_id=eq.${encodeURIComponent(input.principalId)}&select=*&limit=1`
  ).catch(() => []);
  return rows[0] ? mapMfaCredential(rows[0]) : null;
}

export async function mfaEnabled(input: { principalType: "owner" | "staff"; principalId: string }) {
  const credential = await getMfaCredential(input);
  return Boolean(credential?.enabled_at);
}

export function otpauthUri(input: { issuer: string; accountName: string; secret: string }) {
  const label = encodeURIComponent(`${input.issuer}:${input.accountName}`);
  const issuer = encodeURIComponent(input.issuer);
  return `otpauth://totp/${label}?secret=${encodeURIComponent(input.secret)}&issuer=${issuer}&algorithm=SHA1&digits=6&period=30`;
}

export async function startMfaSetup(input: { principalType: "owner" | "staff"; principalId: string; username: string }) {
  if (!mfaEncryptionAvailable()) throw new Error("MFA encryption is not configured.");
  const secret = generateTotpSecret();
  await upsertMfaCredential({
    principalType: input.principalType,
    principalId: input.principalId,
    secret,
    recoveryCodes: [],
    enabled: false,
  });
  return { otpauthUri: otpauthUri({ issuer: "Noromi Care Admin", accountName: input.username, secret }) };
}

export async function confirmMfaSetup(input: { principalType: "owner" | "staff"; principalId: string; code: string }) {
  const credential = await getMfaCredential(input);
  if (!credential) throw new Error("MFA setup was not started.");
  const secret = decryptMfaSecret(credential.secret_encrypted);
  if (!verifyTotp(secret, input.code)) throw new Error("Verification failed.");
  const codes = recoveryCodes();
  await upsertMfaCredential({
    principalType: input.principalType,
    principalId: input.principalId,
    secret,
    recoveryCodes: codes,
    enabled: true,
  });
  return { recoveryCodes: codes };
}

export async function regenerateMfaRecoveryCodes(input: { principalType: "owner" | "staff"; principalId: string; code: string }) {
  const credential = await getMfaCredential(input);
  if (!credential?.enabled_at) throw new Error("MFA is not enabled.");
  const secret = decryptMfaSecret(credential.secret_encrypted);
  if (!verifyTotp(secret, input.code)) throw new Error("Verification failed.");
  const codes = recoveryCodes();
  await upsertMfaCredential({
    principalType: input.principalType,
    principalId: input.principalId,
    secret,
    recoveryCodes: codes,
    enabled: true,
  });
  return { recoveryCodes: codes };
}

export async function verifyMfaCredential(input: { credential: AdminMfaCredentialRecord; code: string }) {
  const code = input.code.trim();
  if (/^\d{6}$/.test(code)) {
    return verifyTotp(decryptMfaSecret(input.credential.secret_encrypted), code)
      ? { ok: true, recoveryUsed: false }
      : { ok: false, recoveryUsed: false };
  }
  const hash = hashRecoveryCode(code);
  const remaining = input.credential.recovery_codes_hashes.filter((item) => item !== hash);
  if (remaining.length === input.credential.recovery_codes_hashes.length) {
    return { ok: false, recoveryUsed: false };
  }
  await dbPatch(`${MFA_TABLE}?id=eq.${encodeURIComponent(input.credential.id)}`, {
    recovery_codes_hashes: remaining,
    updated_at: new Date().toISOString(),
  });
  return { ok: true, recoveryUsed: true };
}

export async function createMfaChallenge(input: { principalType: "owner" | "staff"; principalId: string; username: string }) {
  const token = `mfa.${publicToken(32)}`;
  await dbPost(`${MFA_CHALLENGE_TABLE}?select=id`, {
    principal_type: input.principalType,
    principal_id: input.principalId,
    username: input.username,
    token_hash: hashValue(token),
    expires_at: new Date(Date.now() + 5 * 60 * 1000).toISOString(),
  });
  return token;
}

function mapMfaChallenge(row: Record<string, unknown>): AdminMfaChallengeRecord {
  return {
    id: String(row.id ?? ""),
    principal_type: row.principal_type === "owner" ? "owner" : "staff",
    principal_id: String(row.principal_id ?? ""),
    username: String(row.username ?? ""),
    expires_at: String(row.expires_at ?? ""),
    consumed_at: typeof row.consumed_at === "string" ? row.consumed_at : null,
    revoked_at: typeof row.revoked_at === "string" ? row.revoked_at : null,
    attempts: Number(row.attempts ?? 0),
  };
}

export async function getMfaChallenge(token: string | null | undefined) {
  if (!token?.startsWith("mfa.") || !hasConfig()) return null;
  const rows = await dbGet<Record<string, unknown>[]>(
    `${MFA_CHALLENGE_TABLE}?token_hash=eq.${encodeURIComponent(hashValue(token))}&select=*&limit=1`
  ).catch(() => []);
  const row = rows[0];
  if (!row) return null;
  const challenge = mapMfaChallenge(row);
  if (challenge.consumed_at || challenge.revoked_at || Date.parse(challenge.expires_at) <= Date.now()) return null;
  return challenge;
}

export async function recordMfaChallengeFailure(id: string) {
  const challenge = (await dbGet<Record<string, unknown>[]>(
    `${MFA_CHALLENGE_TABLE}?id=eq.${encodeURIComponent(id)}&select=attempts&limit=1`
  ).catch(() => []))[0];
  await dbPatch(`${MFA_CHALLENGE_TABLE}?id=eq.${encodeURIComponent(id)}`, {
    attempts: Number(challenge?.attempts ?? 0) + 1,
  });
}

export async function consumeMfaChallenge(id: string) {
  await dbPatch(`${MFA_CHALLENGE_TABLE}?id=eq.${encodeURIComponent(id)}`, { consumed_at: new Date().toISOString() });
}

export async function recordThrottleAttempt(input: { key: string; purpose: "login" | "mfa"; success: boolean }) {
  if (!hasConfig()) return { locked: false };
  const keyHash = hashValue(`${input.purpose}:${input.key.toLowerCase()}`);
  const existing = (await dbGet<Record<string, unknown>[]>(`${THROTTLE_TABLE}?key_hash=eq.${encodeURIComponent(keyHash)}&select=*&limit=1`).catch(() => []))[0];
  const attempts = input.success ? 0 : Number(existing?.attempts ?? 0) + 1;
  const lockedUntil = !input.success && attempts >= 5 ? new Date(Date.now() + 15 * 60 * 1000).toISOString() : null;
  const body = { key_hash: keyHash, purpose: input.purpose, attempts, locked_until: lockedUntil, updated_at: new Date().toISOString() };
  if (existing) await dbPatch(`${THROTTLE_TABLE}?key_hash=eq.${encodeURIComponent(keyHash)}`, body);
  else await dbPost(`${THROTTLE_TABLE}?select=key_hash`, body);
  return { locked: Boolean(lockedUntil), lockedUntil };
}

export async function isThrottleLocked(input: { key: string; purpose: "login" | "mfa" }) {
  if (!hasConfig()) return false;
  const keyHash = hashValue(`${input.purpose}:${input.key.toLowerCase()}`);
  const row = (await dbGet<Record<string, unknown>[]>(`${THROTTLE_TABLE}?key_hash=eq.${encodeURIComponent(keyHash)}&select=locked_until&limit=1`).catch(() => []))[0];
  return typeof row?.locked_until === "string" && Date.parse(row.locked_until) > Date.now();
}
