import type { ConversationStatus, SupportMessage, SupportPriority } from "@/app/lib/support-store";

export const supportSlaPolicy: Record<SupportPriority, { firstResponseMinutes: number; resolutionMinutes: number }> = {
  urgent: { firstResponseMinutes: 15, resolutionMinutes: 4 * 60 },
  high: { firstResponseMinutes: 60, resolutionMinutes: 8 * 60 },
  normal: { firstResponseMinutes: 4 * 60, resolutionMinutes: 24 * 60 },
  low: { firstResponseMinutes: 8 * 60, resolutionMinutes: 48 * 60 },
};

export type SupportSlaState = {
  tracked: boolean;
  label: string;
  firstResponseDeadline: string | null;
  resolutionDeadline: string | null;
  firstResponseBreached: boolean;
  resolutionBreached: boolean;
  firstResponseAt: string | null;
};

function parseTime(value?: string | null) {
  if (!value) return null;
  const timestamp = Date.parse(value);
  return Number.isFinite(timestamp) ? timestamp : null;
}

function toIso(timestamp: number) {
  return new Date(timestamp).toISOString();
}

export function firstAdminResponseAt(messages: Pick<SupportMessage, "sender_type" | "created_at">[], slaStartedAt?: string | null) {
  const started = parseTime(slaStartedAt);
  if (started === null) return null;
  const match = messages
    .filter(message => message.sender_type === "admin")
    .map(message => parseTime(message.created_at))
    .filter((timestamp): timestamp is number => timestamp !== null && timestamp >= started)
    .sort((a, b) => a - b)[0];
  return typeof match === "number" ? toIso(match) : null;
}

export function supportSlaDeadlines(priority: SupportPriority, slaStartedAt?: string | null) {
  const started = parseTime(slaStartedAt);
  if (started === null) return { firstResponseDeadline: null, resolutionDeadline: null };
  const policy = supportSlaPolicy[priority] ?? supportSlaPolicy.normal;
  return {
    firstResponseDeadline: toIso(started + policy.firstResponseMinutes * 60_000),
    resolutionDeadline: toIso(started + policy.resolutionMinutes * 60_000),
  };
}

export function deriveSupportSlaState(input: {
  priority?: SupportPriority | null;
  slaStartedAt?: string | null;
  status: ConversationStatus;
  messages: Pick<SupportMessage, "sender_type" | "created_at">[];
  now?: string | Date;
}): SupportSlaState {
  const priority = input.priority && input.priority in supportSlaPolicy ? input.priority : "normal";
  const started = parseTime(input.slaStartedAt);
  if (started === null) {
    return {
      tracked: false,
      label: "SLA not tracked",
      firstResponseDeadline: null,
      resolutionDeadline: null,
      firstResponseBreached: false,
      resolutionBreached: false,
      firstResponseAt: null,
    };
  }
  const now = input.now instanceof Date ? input.now.getTime() : parseTime(input.now ? String(input.now) : new Date().toISOString()) ?? Date.now();
  const deadlines = supportSlaDeadlines(priority, input.slaStartedAt);
  const firstResponseAt = firstAdminResponseAt(input.messages, input.slaStartedAt);
  const firstDeadline = parseTime(deadlines.firstResponseDeadline);
  const resolutionDeadline = parseTime(deadlines.resolutionDeadline);
  const firstResponseBreached = !firstResponseAt && firstDeadline !== null && now > firstDeadline;
  const resolutionBreached = input.status !== "closed" && resolutionDeadline !== null && now > resolutionDeadline;
  const label = input.status === "closed"
    ? "Resolved"
    : resolutionBreached
      ? "Resolution breached"
      : firstResponseBreached
        ? "First response breached"
        : "On track";
  return {
    tracked: true,
    label,
    firstResponseDeadline: deadlines.firstResponseDeadline,
    resolutionDeadline: deadlines.resolutionDeadline,
    firstResponseBreached,
    resolutionBreached,
    firstResponseAt,
  };
}
