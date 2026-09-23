import type { ConversationStatus, SupportConversation, SupportMessage } from "@/app/lib/support-store";

export type SupportInboxItem = Omit<SupportConversation, "public_token"> & {
  last_message: Pick<SupportMessage, "body" | "sender_type" | "created_at"> | null;
  message_count: number;
  unread_customer_count: number;
};
export type SupportDetail = Omit<SupportConversation, "public_token"> & {
  messages: Pick<SupportMessage, "id" | "body" | "sender_type" | "created_at">[];
};
export type SupportFilter = "all" | ConversationStatus | "unread";

export function parseSupportFilter(value: string | null): SupportFilter {
  return value === "open" || value === "pending" || value === "closed" || value === "unread" ? value : "all";
}

export function orderSupportMessages<T extends { id: string; created_at: string }>(messages: T[]): T[] {
  return [...messages].sort((a, b) => a.created_at.localeCompare(b.created_at) || a.id.localeCompare(b.id));
}

export function buildSupportInbox(conversations: Omit<SupportConversation, "public_token">[], messages: SupportMessage[]): SupportInboxItem[] {
  const grouped = new Map<string, SupportMessage[]>();
  for (const message of messages) {
    const group = grouped.get(message.conversation_id) ?? [];
    group.push(message);
    grouped.set(message.conversation_id, group);
  }
  return conversations.map(({ id, status, source_page, created_at, updated_at }) => {
    const history = orderSupportMessages(grouped.get(id) ?? []);
    const last = history.at(-1);
    return {
      id, status, source_page, created_at, updated_at,
      last_message: last ? { body: last.body.slice(0, 80), sender_type: last.sender_type, created_at: last.created_at } : null,
      message_count: history.length,
      unread_customer_count: history.filter(m => m.sender_type === "customer" && m.is_read !== true).length,
    };
  });
}

export function querySupportInbox(items: SupportInboxItem[], query: string, filter: SupportFilter) {
  const term = query.trim().toLowerCase();
  return items.filter(item => {
    if (filter === "unread" ? item.unread_customer_count === 0 : filter !== "all" && item.status !== filter) return false;
    return !term || [item.id, item.source_page, item.last_message?.body ?? ""].some(value => value.toLowerCase().includes(term));
  }).sort((a, b) => (b.last_message?.created_at ?? b.created_at).localeCompare(a.last_message?.created_at ?? a.created_at) || a.id.localeCompare(b.id));
}

export function supportHref(query: string, filter: SupportFilter, conversation: string) {
  const params = new URLSearchParams();
  if (query) params.set("q", query);
  if (filter !== "all") params.set("status", filter);
  if (conversation) params.set("conversation", conversation);
  return `/admin-v2/support${params.size ? `?${params}` : ""}`;
}

export function canReplyToSupport(canReply: boolean, status: ConversationStatus) {
  return canReply && status !== "closed";
}
