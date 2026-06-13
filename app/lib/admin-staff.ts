import { randomBytes, scryptSync, timingSafeEqual } from "node:crypto";
import {
  normalizePermissions,
  normalizeRole,
  type AdminPermission,
  type AdminRole,
  type AdminSessionUser,
} from "@/app/lib/admin-permissions";

const STAFF_TABLE = "admin_staff";
const ACTIVITY_TABLE = "admin_staff_activity_logs";

export type AdminStaffRecord = {
  id: string;
  name: string;
  email: string;
  username: string;
  role: AdminRole;
  permissions: Record<AdminPermission, boolean>;
  isActive: boolean;
  createdBy?: string;
  lastLoginAt?: string;
  createdAt?: string;
  updatedAt?: string;
};

export type StaffActivityLog = {
  id: string;
  staffId?: string;
  actorName?: string;
  action: string;
  targetType?: string;
  targetId?: string;
  metadata: Record<string, unknown>;
  createdAt?: string;
};

type StaffRow = {
  id?: string;
  name?: string | null;
  email?: string | null;
  username?: string | null;
  password_hash?: string | null;
  role?: string | null;
  permissions?: unknown;
  is_active?: boolean | null;
  created_by?: string | null;
  last_login_at?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
};

type ActivityRow = {
  id?: string;
  staff_id?: string | null;
  actor_name?: string | null;
  action?: string | null;
  target_type?: string | null;
  target_id?: string | null;
  metadata?: unknown;
  created_at?: string | null;
};

export class AdminStaffStoreError extends Error {
  code: string;
  status: number;

  constructor(message: string, code = "STAFF_STORE_ERROR", status = 500) {
    super(message);
    this.name = "AdminStaffStoreError";
    this.code = code;
    this.status = status;
  }
}

function hasSupabaseConfig() {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.SUPABASE_SERVICE_ROLE_KEY
  );
}

function supabaseHeaders() {
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";
  return {
    apikey: serviceRoleKey,
    Authorization: `Bearer ${serviceRoleKey}`,
    "content-type": "application/json",
  };
}

function supabaseEndpoint(pathAndQuery: string) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!supabaseUrl) throw new Error("Missing Supabase URL.");
  return `${supabaseUrl.replace(/\/$/, "")}/rest/v1/${pathAndQuery}`;
}

async function staffStoreError(response: Response, action: string) {
  const detail = await response.text().catch(() => "");
  const lower = detail.toLowerCase();
  const missing =
    response.status === 404 ||
    lower.includes(STAFF_TABLE) ||
    lower.includes(ACTIVITY_TABLE) ||
    lower.includes("could not find the table") ||
    lower.includes("schema cache");

  return new AdminStaffStoreError(
    `Supabase staff ${action} failed with ${response.status}. ${detail.slice(0, 240)}`,
    missing ? "STAFF_TABLE_MISSING" : "STAFF_SUPABASE_ERROR",
    missing ? 503 : response.status
  );
}

function mapStaff(row: StaffRow): AdminStaffRecord {
  const role = normalizeRole(row.role);
  return {
    id: row.id ?? "",
    name: row.name ?? "",
    email: row.email ?? "",
    username: row.username ?? "",
    role,
    permissions: normalizePermissions(role, row.permissions),
    isActive: row.is_active !== false,
    createdBy: row.created_by ?? undefined,
    lastLoginAt: row.last_login_at ?? undefined,
    createdAt: row.created_at ?? undefined,
    updatedAt: row.updated_at ?? undefined,
  };
}

function mapActivity(row: ActivityRow, index = 0): StaffActivityLog {
  const fallbackId = [
    row.actor_name || row.staff_id || "Owner",
    row.action || "activity",
    row.target_type || "target",
    row.target_id || "none",
    row.created_at || "unknown-date",
    index,
  ].join("-");

  return {
    id: row.id || fallbackId,
    staffId: row.staff_id ?? undefined,
    actorName: row.actor_name ?? undefined,
    action: row.action ?? "",
    targetType: row.target_type ?? undefined,
    targetId: row.target_id ?? undefined,
    metadata:
      typeof row.metadata === "object" && row.metadata !== null && !Array.isArray(row.metadata)
        ? (row.metadata as Record<string, unknown>)
        : {},
    createdAt: row.created_at ?? undefined,
  };
}

export function hashStaffPassword(password: string) {
  const salt = randomBytes(16).toString("base64url");
  const hash = scryptSync(password, salt, 64).toString("base64url");
  return `scrypt:${salt}:${hash}`;
}

function verifyStaffPassword(password: string, storedHash?: string | null) {
  if (!storedHash) return false;
  const [method, salt, hash] = storedHash.split(":");
  if (method !== "scrypt" || !salt || !hash) return false;

  const actual = Buffer.from(scryptSync(password, salt, 64).toString("base64url"));
  const expected = Buffer.from(hash);
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}

export async function listStaff() {
  if (!hasSupabaseConfig()) {
    throw new AdminStaffStoreError("Supabase is not configured.", "STAFF_BACKEND_NOT_CONFIGURED", 503);
  }

  const response = await fetch(
    supabaseEndpoint(`${STAFF_TABLE}?select=id,name,email,username,role,permissions,is_active,created_by,last_login_at,created_at,updated_at&order=created_at.desc`),
    { headers: supabaseHeaders(), cache: "no-store" }
  );

  if (!response.ok) throw await staffStoreError(response, "list");
  return ((await response.json()) as StaffRow[]).map(mapStaff);
}

export async function getStaffById(id: string) {
  if (!hasSupabaseConfig()) return null;

  const response = await fetch(
    supabaseEndpoint(
      `${STAFF_TABLE}?id=eq.${encodeURIComponent(id)}&select=id,name,email,username,role,permissions,is_active,created_by,last_login_at,created_at,updated_at&limit=1`
    ),
    { headers: supabaseHeaders(), cache: "no-store" }
  );

  if (!response.ok) return null;
  const row = ((await response.json()) as StaffRow[])[0];
  if (!row || row.is_active === false) return null;
  return mapStaff(row);
}

export async function listActivityLogs() {
  if (!hasSupabaseConfig()) {
    throw new AdminStaffStoreError("Supabase is not configured.", "STAFF_BACKEND_NOT_CONFIGURED", 503);
  }

  const response = await fetch(
    supabaseEndpoint(`${ACTIVITY_TABLE}?select=*&order=created_at.desc&limit=80`),
    { headers: supabaseHeaders(), cache: "no-store" }
  );

  if (!response.ok) throw await staffStoreError(response, "activity list");
  return ((await response.json()) as ActivityRow[]).map(mapActivity);
}

export async function createStaff(input: {
  name: string;
  username: string;
  email?: string;
  role: AdminRole;
  permissions: Record<AdminPermission, boolean>;
  password?: string;
  isActive: boolean;
  createdBy?: string;
}) {
  if (!hasSupabaseConfig()) {
    throw new AdminStaffStoreError("Supabase is not configured.", "STAFF_BACKEND_NOT_CONFIGURED", 503);
  }

  const payload = {
    name: input.name,
    username: input.username,
    email: input.email || null,
    role: input.role,
    permissions: input.permissions,
    password_hash: input.password ? hashStaffPassword(input.password) : null,
    is_active: input.isActive,
    created_by: input.createdBy ?? null,
    updated_at: new Date().toISOString(),
  };

  const response = await fetch(supabaseEndpoint(`${STAFF_TABLE}?select=*`), {
    method: "POST",
    headers: { ...supabaseHeaders(), prefer: "return=representation" },
    body: JSON.stringify(payload),
  });

  if (!response.ok) throw await staffStoreError(response, "create");
  return mapStaff(((await response.json()) as StaffRow[])[0] ?? {});
}

export async function updateStaff(
  id: string,
  input: Partial<{
    name: string;
    username: string;
    email: string;
    role: AdminRole;
    permissions: Record<AdminPermission, boolean>;
    password: string;
    isActive: boolean;
  }>
) {
  if (!hasSupabaseConfig()) {
    throw new AdminStaffStoreError("Supabase is not configured.", "STAFF_BACKEND_NOT_CONFIGURED", 503);
  }

  const payload: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (input.name !== undefined) payload.name = input.name;
  if (input.username !== undefined) payload.username = input.username;
  if (input.email !== undefined) payload.email = input.email || null;
  if (input.role !== undefined) payload.role = input.role;
  if (input.permissions !== undefined) payload.permissions = input.permissions;
  if (input.isActive !== undefined) payload.is_active = input.isActive;
  if (input.password) payload.password_hash = hashStaffPassword(input.password);

  const response = await fetch(
    supabaseEndpoint(`${STAFF_TABLE}?id=eq.${encodeURIComponent(id)}&select=*`),
    {
      method: "PATCH",
      headers: { ...supabaseHeaders(), prefer: "return=representation" },
      body: JSON.stringify(payload),
    }
  );

  if (!response.ok) throw await staffStoreError(response, "update");
  return mapStaff(((await response.json()) as StaffRow[])[0] ?? {});
}

export async function authenticateStaff(username: string, password: string) {
  if (!hasSupabaseConfig()) return null;

  const response = await fetch(
    supabaseEndpoint(
      `${STAFF_TABLE}?username=eq.${encodeURIComponent(username)}&select=*&limit=1`
    ),
    { headers: supabaseHeaders(), cache: "no-store" }
  );

  if (!response.ok) {
    const error = await staffStoreError(response, "login");
    if (error.code === "STAFF_TABLE_MISSING") return null;
    throw error;
  }

  const row = ((await response.json()) as StaffRow[])[0];
  if (!row || row.is_active === false || !verifyStaffPassword(password, row.password_hash)) {
    return null;
  }

  const staff = mapStaff(row);
  await updateStaff(staff.id, { isActive: true }).catch(() => null);
  await fetch(
    supabaseEndpoint(`${STAFF_TABLE}?id=eq.${encodeURIComponent(staff.id)}`),
    {
      method: "PATCH",
      headers: supabaseHeaders(),
      body: JSON.stringify({ last_login_at: new Date().toISOString() }),
    }
  ).catch(() => null);

  return staff;
}

export async function logStaffActivity(input: {
  actor?: AdminSessionUser | null;
  action: string;
  targetType?: string;
  targetId?: string;
  metadata?: Record<string, unknown>;
}) {
  if (!hasSupabaseConfig()) return;

  const payload = {
    staff_id: input.actor?.staffId ?? null,
    actor_name: input.actor?.displayName ?? input.actor?.username ?? "Owner",
    action: input.action,
    target_type: input.targetType ?? null,
    target_id: input.targetId ?? null,
    metadata: input.metadata ?? {},
  };

  await fetch(supabaseEndpoint(ACTIVITY_TABLE), {
    method: "POST",
    headers: supabaseHeaders(),
    body: JSON.stringify(payload),
  }).catch(() => null);
}
