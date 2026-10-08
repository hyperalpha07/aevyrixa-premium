import type { StaffActivityLog } from "@/app/lib/admin-staff";
import { sanitizeMetadata } from "@/lib/admin-v2/audit-logs/audit-log-query";

const ACTIVITY_TABLE = "admin_staff_activity_logs";

export type AuditLogListInput = {
  query?: string;
  action?: string;
  actor?: string;
  targetType?: string;
  timeRange?: string;
  cursor?: string;
  limit?: number;
};

type ActivityRow = {
  id?: string;
  staff_id?: string | null;
  actor_type?: string | null;
  actor_id?: string | null;
  actor_name?: string | null;
  action?: string | null;
  target_type?: string | null;
  target_id?: string | null;
  metadata?: unknown;
  created_at?: string | null;
};

export class AuditLogStoreError extends Error {
  status: number;

  constructor(message: string, status = 503) {
    super(message);
    this.status = status;
  }
}

function hasSupabaseConfig() {
  return Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY);
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

function mapRow(row: ActivityRow, index = 0): StaffActivityLog {
  return {
    id: row.id ?? `${row.created_at ?? "unknown"}-${index}`,
    staffId: row.staff_id ?? undefined,
    actorType: row.actor_type ?? undefined,
    actorId: row.actor_id ?? undefined,
    actorName: row.actor_name ?? undefined,
    action: row.action ?? "",
    targetType: row.target_type ?? undefined,
    targetId: row.target_id ?? undefined,
    metadata: (sanitizeMetadata(row.metadata ?? {}) ?? {}) as Record<string, unknown>,
    createdAt: row.created_at ?? undefined,
  };
}

function parseCursor(cursor?: string) {
  if (!cursor) return null;
  try {
    const parsed = JSON.parse(Buffer.from(cursor, "base64url").toString("utf8")) as { createdAt?: string; id?: string };
    if (!parsed.createdAt || !parsed.id) throw new AuditLogStoreError("Invalid audit cursor.", 400);
    const date = new Date(parsed.createdAt);
    if (!Number.isFinite(date.getTime())) throw new AuditLogStoreError("Invalid audit cursor.", 400);
    return parsed;
  } catch {
    throw new AuditLogStoreError("Invalid audit cursor.", 400);
  }
}

function makeCursor(row?: StaffActivityLog) {
  if (!row?.createdAt || !row.id) return null;
  return Buffer.from(JSON.stringify({ createdAt: row.createdAt, id: row.id })).toString("base64url");
}

function timeLowerBound(range?: string) {
  const now = Date.now();
  const ranges: Record<string, number> = {
    "24h": 24 * 60 * 60 * 1000,
    "7d": 7 * 24 * 60 * 60 * 1000,
    "30d": 30 * 24 * 60 * 60 * 1000,
  };
  if (!range || range === "all" || !ranges[range]) return null;
  return new Date(now - ranges[range]).toISOString();
}

function text(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function csvEscape(value: unknown) {
  const raw = typeof value === "string" ? value : value == null ? "" : JSON.stringify(value);
  const safe = /^\s*[=+\-@]/.test(raw) ? `'${raw}` : raw;
  return `"${safe.replace(/"/g, '""')}"`;
}

export const __auditLogStoreTest = { csvEscape, parseCursor };

export async function listAuditLogs(input: AuditLogListInput = {}) {
  if (!hasSupabaseConfig()) throw new AuditLogStoreError("Audit backend is not configured.");
  const limit = Math.min(Math.max(Number(input.limit) || 50, 1), 100);
  const params = new URLSearchParams();
  params.set("select", "*");
  params.set("order", "created_at.desc,id.desc");
  params.set("limit", String(limit + 1));
  const action = text(input.action);
  const actor = text(input.actor);
  const targetType = text(input.targetType);
  if (action && action !== "all") params.set("action", `eq.${action}`);
  if (actor && actor !== "all") params.set("actor_name", `eq.${actor}`);
  if (targetType && targetType !== "all") params.set("target_type", `eq.${targetType}`);
  const lower = timeLowerBound(input.timeRange);
  if (lower) params.set("created_at", `gte.${lower}`);
  const cursor = parseCursor(input.cursor);
  if (cursor) params.set("or", `(created_at.lt.${cursor.createdAt},and(created_at.eq.${cursor.createdAt},id.lt.${cursor.id}))`);

  const response = await fetch(supabaseEndpoint(`${ACTIVITY_TABLE}?${params.toString()}`), { headers: supabaseHeaders(), cache: "no-store" });
  if (!response.ok) throw new AuditLogStoreError("Audit logs unavailable.");
  let logs = ((await response.json()) as ActivityRow[]).map(mapRow);
  const query = text(input.query).toLowerCase();
  if (query) {
    logs = logs.filter((log) => [
      log.actorName ?? "",
      log.action,
      log.targetType ?? "",
      log.targetId ?? "",
      JSON.stringify(log.metadata),
    ].some((value) => value.toLowerCase().includes(query)));
  }
  const page = logs.slice(0, limit);
  return { logs: page, nextCursor: logs.length > limit ? makeCursor(page.at(-1)) : null };
}

export async function auditFilterMetadata() {
  const { logs } = await listAuditLogs({ limit: 100 });
  return {
    actions: Array.from(new Set(logs.map((log) => log.action).filter(Boolean))).sort(),
    actors: Array.from(new Set(logs.map((log) => log.actorName ?? "").filter(Boolean))).sort(),
    targetTypes: Array.from(new Set(logs.map((log) => log.targetType ?? "").filter(Boolean))).sort(),
  };
}

export async function auditLogsCsv(input: AuditLogListInput = {}) {
  const pages: StaffActivityLog[] = [];
  let cursor = input.cursor;
  while (pages.length < 10000) {
    const result = await listAuditLogs({ ...input, cursor, limit: Math.min(100, 10000 - pages.length) });
    pages.push(...result.logs);
    if (!result.nextCursor) break;
    cursor = result.nextCursor;
  }
  const rows = [["id", "created_at", "actor_type", "actor_id", "actor_name", "action", "target_type", "target_id", "metadata"]];
  for (const log of pages) rows.push([log.id, log.createdAt ?? "", log.actorType ?? "", log.actorId ?? "", log.actorName ?? "", log.action, log.targetType ?? "", log.targetId ?? "", JSON.stringify(log.metadata ?? {})]);
  return rows.map((row) => row.map(csvEscape).join(",")).join("\r\n");
}
