import type { StaffActivityLog } from "@/app/lib/admin-staff";

export type AuditLogTimeRange = "all" | "24h" | "7d" | "30d";

export type AuditLogFilters = {
  query: string;
  action: string;
  actor: string;
  targetType: string;
  timeRange: AuditLogTimeRange;
};

const secretKeyPattern = /password|password_hash|secret|token|token_hash|api_key|apikey|authorization|cookie|session|recovery_code|otp|totp|encryption_key|service_role|access_token|refresh_token/i;
const securityActionPattern = /permission\.denied|denied|unauthorized|forbidden|security|auth/i;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function safePrimitive(value: unknown) {
  return typeof value === "string" || typeof value === "number" || typeof value === "boolean";
}

function dateValue(value?: string) {
  if (!value) return 0;
  const date = new Date(value);
  return Number.isFinite(date.getTime()) ? date.getTime() : 0;
}

export function humanizeAction(action: string) {
  const trimmed = action.trim();
  if (!trimmed) return "Unknown activity";
  return trimmed
    .replace(/[._:-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

export function humanizeTarget(targetType?: string, targetId?: string) {
  const type = targetType?.trim();
  const id = targetId?.trim();
  if (!type && !id) return "No target";
  const label = type ? humanizeAction(type) : "Target";
  return id ? `${label} · ${id}` : label;
}

export function actorLabel(log: StaffActivityLog) {
  return log.actorName?.trim() || log.staffId?.trim() || "System";
}

export function isSecurityEvent(log: Pick<StaffActivityLog, "action">) {
  return securityActionPattern.test(log.action);
}

export function sanitizeMetadata(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value
      .map((item) => sanitizeMetadata(item))
      .filter((item) => item !== undefined);
  }

  if (!isRecord(value)) {
    return safePrimitive(value) || value === null ? value : undefined;
  }

  const entries = Object.entries(value)
    .filter(([key]) => !secretKeyPattern.test(key))
    .map(([key, item]) => [key, sanitizeMetadata(item)] as const)
    .filter(([, item]) => item !== undefined);

  return entries.reduce<Record<string, unknown>>((result, [key, item]) => {
    result[key] = item;
    return result;
  }, {});
}

function flattenMetadata(value: unknown, prefix = ""): string[] {
  if (Array.isArray(value)) {
    return value.flatMap((item, index) => flattenMetadata(item, prefix ? `${prefix}.${index}` : String(index)));
  }
  if (isRecord(value)) {
    return Object.entries(value).flatMap(([key, item]) => flattenMetadata(item, prefix ? `${prefix}.${key}` : key));
  }
  if (safePrimitive(value)) return [`${prefix}: ${String(value)}`];
  if (value === null && prefix) return [`${prefix}: null`];
  return [];
}

export function summarizeMetadata(metadata: unknown, maxItems = 3) {
  const sanitized = sanitizeMetadata(metadata);
  const summary = flattenMetadata(sanitized).slice(0, maxItems);
  return summary.join(" · ");
}

export function metadataSearchText(metadata: unknown) {
  return flattenMetadata(sanitizeMetadata(metadata)).join(" ").toLowerCase();
}

export function auditLogMetrics(logs: StaffActivityLog[], now = Date.now()) {
  const actors = new Set(logs.map(actorLabel).filter(Boolean));
  const dayAgo = now - 24 * 60 * 60 * 1000;
  return {
    total: logs.length,
    actors: actors.size,
    securityEvents: logs.filter(isSecurityEvent).length,
    recent24h: logs.filter((log) => dateValue(log.createdAt) >= dayAgo).length,
  };
}

export function auditFilterOptions(logs: StaffActivityLog[]) {
  return {
    actions: Array.from(new Set(logs.map((log) => log.action).filter(Boolean))).sort((a, b) => a.localeCompare(b)),
    actors: Array.from(new Set(logs.map(actorLabel).filter(Boolean))).sort((a, b) => a.localeCompare(b)),
    targetTypes: Array.from(new Set(logs.map((log) => log.targetType ?? "").filter(Boolean))).sort((a, b) => a.localeCompare(b)),
  };
}

function matchesTimeRange(log: StaffActivityLog, range: AuditLogTimeRange, now: number) {
  if (range === "all") return true;
  const created = dateValue(log.createdAt);
  if (!created) return false;
  const durations: Record<Exclude<AuditLogTimeRange, "all">, number> = {
    "24h": 24 * 60 * 60 * 1000,
    "7d": 7 * 24 * 60 * 60 * 1000,
    "30d": 30 * 24 * 60 * 60 * 1000,
  };
  return created >= now - durations[range];
}

export function queryAuditLogs(logs: StaffActivityLog[], filters: AuditLogFilters, now = Date.now()) {
  const term = filters.query.trim().toLowerCase();
  return logs.filter((log) => {
    if (filters.action !== "all" && log.action !== filters.action) return false;
    if (filters.actor !== "all" && actorLabel(log) !== filters.actor) return false;
    if (filters.targetType !== "all" && log.targetType !== filters.targetType) return false;
    if (!matchesTimeRange(log, filters.timeRange, now)) return false;
    if (!term) return true;
    return [
      actorLabel(log),
      log.action,
      humanizeAction(log.action),
      log.targetType ?? "",
      log.targetId ?? "",
      metadataSearchText(log.metadata),
    ].some((value) => value.toLowerCase().includes(term));
  });
}

export function sortAuditLogsNewestFirst(logs: StaffActivityLog[]) {
  return [...logs].sort((a, b) => dateValue(b.createdAt) - dateValue(a.createdAt));
}
