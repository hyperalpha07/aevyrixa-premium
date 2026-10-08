import { randomBytes } from "node:crypto";
import { hasPermission, type AdminSessionUser } from "@/app/lib/admin-permissions";
import { logStaffActivity } from "@/app/lib/admin-staff";
import { sanitizeMetadata } from "@/lib/admin-v2/audit-logs/audit-log-query";

const REQUESTS_TABLE = "admin_approval_requests";
const EVENTS_TABLE = "admin_approval_events";
const categories = ["access", "operations", "finance", "customer", "content", "settings", "other"] as const;
const terminalStatuses = ["approved", "rejected", "cancelled"] as const;

export type ApprovalStatus = "pending" | "approved" | "rejected" | "cancelled";
export type ApprovalCategory = (typeof categories)[number];
export type ApprovalEvent = {
  id: string;
  approvalId: string;
  eventType: "requested" | ApprovalStatus;
  actorType: "owner" | "staff" | "system";
  actorId?: string;
  actorName: string;
  note?: string;
  metadata: Record<string, unknown>;
  createdAt: string;
};
export type ApprovalRequest = {
  id: string;
  reference: string;
  title: string;
  category: ApprovalCategory;
  actionKey: string;
  subjectType?: string;
  subjectId?: string;
  summary: string;
  reason: string;
  requestPayload: Record<string, unknown>;
  status: ApprovalStatus;
  requestedByType: "owner" | "staff" | "system";
  requestedById?: string;
  requestedByName: string;
  requestedAt: string;
  resolvedByType?: "owner" | "staff" | "system";
  resolvedById?: string;
  resolvedByName?: string;
  resolvedAt?: string;
  resolutionNote?: string;
  updatedAt: string;
  events: ApprovalEvent[];
};

type RequestRow = {
  id: string;
  reference: string;
  title: string;
  category: ApprovalCategory;
  action_key: string;
  subject_type?: string | null;
  subject_id?: string | null;
  summary: string;
  reason: string;
  request_payload?: unknown;
  status: ApprovalStatus;
  requested_by_type: "owner" | "staff" | "system";
  requested_by_id?: string | null;
  requested_by_name: string;
  requested_at: string;
  resolved_by_type?: "owner" | "staff" | "system" | null;
  resolved_by_id?: string | null;
  resolved_by_name?: string | null;
  resolved_at?: string | null;
  resolution_note?: string | null;
  updated_at: string;
};

type EventRow = {
  id: string;
  approval_id: string;
  event_type: "requested" | ApprovalStatus;
  actor_type: "owner" | "staff" | "system";
  actor_id?: string | null;
  actor_name: string;
  note?: string | null;
  metadata?: unknown;
  created_at: string;
};

export class ApprovalStoreError extends Error {
  status: number;

  constructor(message: string, status = 503) {
    super(message);
    this.status = status;
  }
}

function supabaseUrl() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, "");
  if (!url || !process.env.SUPABASE_SERVICE_ROLE_KEY) throw new ApprovalStoreError("Approvals backend is not configured.");
  return url;
}

function headers(extra?: HeadersInit) {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";
  return { apikey: key, Authorization: `Bearer ${key}`, "content-type": "application/json", ...extra };
}

function endpoint(pathAndQuery: string) {
  return `${supabaseUrl()}/rest/v1/${pathAndQuery}`;
}

async function db<T>(pathAndQuery: string, init?: RequestInit): Promise<T> {
  const response = await fetch(endpoint(pathAndQuery), { ...init, headers: headers(init?.headers), cache: "no-store" });
  if (!response.ok) throw new ApprovalStoreError("Approval backend request failed.", response.status >= 400 && response.status < 500 ? response.status : 503);
  return response.status === 204 ? ([] as T) : ((await response.json()) as T);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function text(value: unknown, max?: number) {
  const trimmed = typeof value === "string" ? value.trim() : "";
  return typeof max === "number" ? trimmed.slice(0, max) : trimmed;
}

function actorId(session: AdminSessionUser) {
  return session.userType === "staff" ? session.staffId ?? session.username : session.username;
}

function actorType(session: AdminSessionUser) {
  return session.userType === "owner" ? "owner" : "staff";
}

function mapEvent(row: EventRow): ApprovalEvent {
  return {
    id: row.id,
    approvalId: row.approval_id,
    eventType: row.event_type,
    actorType: row.actor_type,
    actorId: row.actor_id ?? undefined,
    actorName: row.actor_name,
    note: row.note ?? undefined,
    metadata: (sanitizeMetadata(row.metadata ?? {}) ?? {}) as Record<string, unknown>,
    createdAt: row.created_at,
  };
}

function mapRequest(row: RequestRow, events: EventRow[] = []): ApprovalRequest {
  return {
    id: row.id,
    reference: row.reference,
    title: row.title,
    category: row.category,
    actionKey: row.action_key,
    subjectType: row.subject_type ?? undefined,
    subjectId: row.subject_id ?? undefined,
    summary: row.summary,
    reason: row.reason,
    requestPayload: (sanitizeMetadata(row.request_payload ?? {}) ?? {}) as Record<string, unknown>,
    status: row.status,
    requestedByType: row.requested_by_type,
    requestedById: row.requested_by_id ?? undefined,
    requestedByName: row.requested_by_name,
    requestedAt: row.requested_at,
    resolvedByType: row.resolved_by_type ?? undefined,
    resolvedById: row.resolved_by_id ?? undefined,
    resolvedByName: row.resolved_by_name ?? undefined,
    resolvedAt: row.resolved_at ?? undefined,
    resolutionNote: row.resolution_note ?? undefined,
    updatedAt: row.updated_at,
    events: events.filter((event) => event.approval_id === row.id).map(mapEvent),
  };
}

function isSensitiveKey(key: string) {
  const normalized = key.replace(/[^a-z0-9]/gi, "").toLowerCase();
  return /password|passwordhash|secret|token|tokenhash|apikey|authorization|cookie|session|recoverycode|otp|totp|encryptionkey|mfa/.test(normalized);
}

function containsSensitiveKey(value: unknown): boolean {
  if (Array.isArray(value)) return value.some(containsSensitiveKey);
  if (!isRecord(value)) return false;
  return Object.entries(value).some(([key, item]) => (
    isSensitiveKey(key)
    || containsSensitiveKey(item)
  ));
}

function parsePayload(value: unknown) {
  if (value === undefined) return {};
  if (!isRecord(value) || containsSensitiveKey(value)) throw new ApprovalStoreError("Approval payload contains unsupported or sensitive fields.", 400);
  const serialized = JSON.stringify(value);
  if (Buffer.byteLength(serialized, "utf8") > 16 * 1024) throw new ApprovalStoreError("Approval payload is too large.", 400);
  return (sanitizeMetadata(value) ?? {}) as Record<string, unknown>;
}

function validateCreatePayload(input: unknown) {
  if (!isRecord(input)) throw new ApprovalStoreError("Invalid approval request.", 400);
  const title = text(input.title);
  const category = categories.includes(input.category as never) ? (input.category as ApprovalCategory) : null;
  const actionKey = text(input.actionKey);
  const subjectType = text(input.subjectType) || null;
  const subjectId = text(input.subjectId) || null;
  const summary = text(input.summary);
  const reason = text(input.reason);
  const requestPayload = parsePayload(input.payload);
  const errors: string[] = [];
  if (!title) errors.push("Title is required.");
  if (title.length > 160) errors.push("Title must be 160 characters or fewer.");
  if (!category) errors.push("Category must be a supported approval category.");
  if (!/^[a-z0-9][a-z0-9._:-]{0,119}$/.test(actionKey)) errors.push("Action key must be a stable lowercase identifier.");
  if (subjectType && subjectType.length > 120) errors.push("Subject type must be 120 characters or fewer.");
  if (subjectId && subjectId.length > 160) errors.push("Subject ID must be 160 characters or fewer.");
  if (!summary) errors.push("Summary is required.");
  if (summary.length > 1000) errors.push("Summary must be 1000 characters or fewer.");
  if (!reason) errors.push("Reason is required.");
  if (reason.length > 2000) errors.push("Reason must be 2000 characters or fewer.");
  if (errors.length) throw new ApprovalStoreError(errors.join(" "), 400);
  return { title, category, actionKey, subjectType, subjectId, summary, reason, requestPayload };
}

export const __approvalStoreTest = { containsSensitiveKey, validateCreatePayload };

function requestVisibilityParams(session: AdminSessionUser, params: URLSearchParams) {
  if (session.userType === "owner" || hasPermission(session, "approvals.decide")) return;
  params.set("requested_by_type", `eq.${actorType(session)}`);
  params.set("requested_by_id", `eq.${actorId(session)}`);
}

async function listEvents(ids: string[]) {
  if (ids.length === 0) return [];
  const params = new URLSearchParams();
  params.set("select", "*");
  params.set("approval_id", `in.(${ids.join(",")})`);
  params.set("order", "created_at.asc,id.asc");
  return db<EventRow[]>(`${EVENTS_TABLE}?${params.toString()}`);
}

async function nextReference() {
  const date = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  return `APR-${date}-${randomBytes(3).toString("hex").toUpperCase()}`;
}

export async function listApprovals(session: AdminSessionUser, status = "pending", mine = false) {
  const params = new URLSearchParams();
  params.set("select", "*");
  params.set("order", "requested_at.desc,id.desc");
  params.set("limit", "100");
  if (["pending", ...terminalStatuses].includes(status as never)) params.set("status", `eq.${status}`);
  if (mine) {
    params.set("requested_by_type", `eq.${actorType(session)}`);
    params.set("requested_by_id", `eq.${actorId(session)}`);
  } else {
    requestVisibilityParams(session, params);
  }
  const rows = await db<RequestRow[]>(`${REQUESTS_TABLE}?${params.toString()}`);
  const events = await listEvents(rows.map((row) => row.id));
  return rows.map((row) => mapRequest(row, events));
}

export async function getApproval(session: AdminSessionUser, id: string) {
  const params = new URLSearchParams();
  params.set("select", "*");
  params.set("id", `eq.${id}`);
  requestVisibilityParams(session, params);
  const rows = await db<RequestRow[]>(`${REQUESTS_TABLE}?${params.toString()}`);
  const row = rows[0];
  if (!row) throw new ApprovalStoreError("Approval request was not found.", 404);
  const events = await listEvents([row.id]);
  return mapRequest(row, events);
}

export async function createApproval(session: AdminSessionUser, input: unknown) {
  const parsed = validateCreatePayload(input);
  let row: RequestRow | null = null;
  for (let attempt = 0; attempt < 3 && !row; attempt += 1) {
    const payload = [{
      reference: await nextReference(),
      title: parsed.title,
      category: parsed.category,
      action_key: parsed.actionKey,
      subject_type: parsed.subjectType,
      subject_id: parsed.subjectId,
      summary: parsed.summary,
      reason: parsed.reason,
      request_payload: parsed.requestPayload,
      requested_by_type: actorType(session),
      requested_by_id: actorId(session),
      requested_by_name: session.displayName || session.username,
    }];
    try {
      row = (await db<RequestRow[]>(REQUESTS_TABLE, { method: "POST", headers: { Prefer: "return=representation" }, body: JSON.stringify(payload) }))[0] ?? null;
    } catch (error) {
      if (attempt === 2) throw error;
    }
  }
  if (!row) throw new ApprovalStoreError("Approval request could not be created.");
  await logStaffActivity({
    actor: session,
    action: "approval.requested",
    targetType: "approval",
    targetId: row.id,
    metadata: { reference: row.reference, category: row.category, action_key: row.action_key, subject_type: row.subject_type, subject_id: row.subject_id, status: row.status },
  });
  return getApproval(session, row.id);
}

export async function decideApproval(session: AdminSessionUser, id: string, input: unknown) {
  const existing = await getApproval(session, id);
  if (existing.status !== "pending") throw new ApprovalStoreError("Approval request is already resolved.", 409);
  if (!hasPermission(session, "approvals.decide")) throw new ApprovalStoreError("Approval decision permission is required.", 403);
  const body = isRecord(input) ? input : {};
  const decision = body.decision === "approved" || body.decision === "rejected" ? body.decision : null;
  const note = text(body.note, 2000);
  if (!decision) throw new ApprovalStoreError("Decision must be approved or rejected.", 400);
  if (decision === "rejected" && !note) throw new ApprovalStoreError("Rejection note is required.", 400);
  const sameActor = existing.requestedByType === actorType(session) && existing.requestedById === actorId(session);
  const isOwner = session.userType === "owner";
  if (sameActor && !isOwner) throw new ApprovalStoreError("Staff cannot decide their own approval request.", 403);
  if (sameActor && isOwner && !note) throw new ApprovalStoreError("Owner self-decision requires a note.", 400);
  const now = new Date().toISOString();
  const params = new URLSearchParams({ id: `eq.${id}`, status: "eq.pending", select: "*" });
  const rows = await db<RequestRow[]>(`${REQUESTS_TABLE}?${params.toString()}`, {
    method: "PATCH",
    headers: { Prefer: "return=representation" },
    body: JSON.stringify({
      status: decision,
      resolved_by_type: actorType(session),
      resolved_by_id: actorId(session),
      resolved_by_name: session.displayName || session.username,
      resolved_at: now,
      resolution_note: note || null,
      updated_at: now,
    }),
  });
  if (!rows[0]) throw new ApprovalStoreError("Approval request is already resolved.", 409);
  await logStaffActivity({
    actor: session,
    action: decision === "approved" ? "approval.approved" : "approval.rejected",
    targetType: "approval",
    targetId: id,
    metadata: { reference: existing.reference, category: existing.category, action_key: existing.actionKey, subject_type: existing.subjectType, subject_id: existing.subjectId, status: decision, owner_self_decision: sameActor && isOwner },
  });
  return getApproval(session, id);
}

export async function cancelApproval(session: AdminSessionUser, id: string) {
  const existing = await getApproval(session, id);
  if (existing.status !== "pending") throw new ApprovalStoreError("Approval request is already resolved.", 409);
  const sameActor = existing.requestedByType === actorType(session) && existing.requestedById === actorId(session);
  if (!sameActor && session.userType !== "owner") throw new ApprovalStoreError("Only the requester or owner can cancel this request.", 403);
  const now = new Date().toISOString();
  const params = new URLSearchParams({ id: `eq.${id}`, status: "eq.pending", select: "*" });
  const rows = await db<RequestRow[]>(`${REQUESTS_TABLE}?${params.toString()}`, {
    method: "PATCH",
    headers: { Prefer: "return=representation" },
    body: JSON.stringify({
      status: "cancelled",
      resolved_by_type: actorType(session),
      resolved_by_id: actorId(session),
      resolved_by_name: session.displayName || session.username,
      resolved_at: now,
      updated_at: now,
    }),
  });
  if (!rows[0]) throw new ApprovalStoreError("Approval request is already resolved.", 409);
  await logStaffActivity({
    actor: session,
    action: "approval.cancelled",
    targetType: "approval",
    targetId: id,
    metadata: { reference: existing.reference, category: existing.category, action_key: existing.actionKey, subject_type: existing.subjectType, subject_id: existing.subjectId, status: "cancelled" },
  });
  return getApproval(session, id);
}
