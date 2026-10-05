// Server-only. Do NOT import from client components.
import { buildSupportInbox } from "@/lib/admin-v2/support/support-query";
import { signedSupportAttachmentUrl, type PreparedSupportAttachment, type SupportAttachment } from "@/app/lib/support-attachments";

export type ConversationStatus = "open" | "pending" | "closed";
export type SupportPriority = "low" | "normal" | "high" | "urgent";
export type SenderType = "customer" | "admin";

export type SupportConversation = {
  id: string;
  public_token: string;
  status: ConversationStatus;
  source_page: string;
  created_at: string;
  updated_at: string | null;
  assigned_staff_id?: string | null;
  assigned_staff_name?: string | null;
  priority?: SupportPriority | null;
  sla_started_at?: string | null;
  escalated_at?: string | null;
  escalated_by?: string | null;
  escalation_reason?: string | null;
};

export type SupportMessage = {
  id: string;
  conversation_id: string;
  message?: string | null;
  body: string;
  sender_type: SenderType;
  created_at: string;
  is_read?: boolean | null;
};

export type SupportMessageWithAttachments = SupportMessage & {
  attachments?: SupportAttachment[];
  product_shares?: SupportProductShare[];
  order_shares?: SupportOrderShare[];
};

export type SupportProductShare = {
  id: string;
  message_id: string;
  conversation_id: string;
  product_id: string | null;
  product_slug: string;
  title: string;
  image_url: string | null;
  price: number | null;
  currency: string | null;
  stock_status: string | null;
  created_at: string;
};

export type SupportOrderShare = {
  id: string;
  message_id: string;
  conversation_id: string;
  order_reference: string;
  order_date: string | null;
  amount: number | null;
  currency: string | null;
  status: string | null;
  created_at: string;
};

export type SupportInternalNote = {
  id: string;
  conversation_id: string;
  body: string;
  author_name: string;
  created_at: string;
};

export type SupportLabel = {
  id: string;
  name: string;
  color: string | null;
  created_at?: string;
};

export type SupportSavedReply = {
  id: string;
  title: string;
  body: string;
  created_by: string | null;
  created_at: string;
  updated_at: string;
};

function hasConfig() {
  return Boolean(
    (process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL) &&
      process.env.SUPABASE_SERVICE_ROLE_KEY
  );
}

function baseUrl() {
  return (process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || "").replace(/\/$/, "");
}

function authHeaders(extra: Record<string, string> = {}): Record<string, string> {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";
  return {
    apikey: key,
    Authorization: `Bearer ${key}`,
    "content-type": "application/json",
    ...extra,
  };
}

function endpoint(rel: string) {
  return `${baseUrl()}/rest/v1/${rel}`;
}

async function dbGet<T>(path: string): Promise<T> {
  const res = await fetch(endpoint(path), {
    headers: authHeaders(),
    cache: "no-store",
  });
  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new Error(`Support DB GET failed ${res.status}: ${detail.slice(0, 200)}`);
  }
  return res.json() as Promise<T>;
}

async function dbPost<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(endpoint(path), {
    method: "POST",
    headers: authHeaders({ prefer: "return=representation" }),
    body: JSON.stringify(body),
    cache: "no-store",
  });
  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new Error(`Support DB POST failed ${res.status}: ${detail.slice(0, 200)}`);
  }
  return res.json() as Promise<T>;
}

async function dbPatch(path: string, body: unknown): Promise<void> {
  const res = await fetch(endpoint(path), {
    method: "PATCH",
    headers: authHeaders({ prefer: "return=minimal" }),
    body: JSON.stringify(body),
    cache: "no-store",
  });
  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new Error(`Support DB PATCH failed ${res.status}: ${detail.slice(0, 200)}`);
  }
}

async function dbDelete(path: string): Promise<void> {
  const res = await fetch(endpoint(path), {
    method: "DELETE",
    headers: authHeaders({ prefer: "return=minimal" }),
    cache: "no-store",
  });
  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new Error(`Support DB DELETE failed ${res.status}: ${detail.slice(0, 200)}`);
  }
}

function normalizeSupportMessage(message: SupportMessage): SupportMessage {
  return {
    ...message,
    body: (message.body ?? message.message ?? "").trim(),
  };
}

function normalizeSupportMessages(messages: SupportMessage[]): SupportMessage[] {
  return messages.map(normalizeSupportMessage);
}

export async function createConversation(sourcePage: string): Promise<SupportConversation> {
  if (!hasConfig()) throw new Error("Support backend not configured.");

  const now = new Date().toISOString();
  const rows = await dbPost<SupportConversation[]>(
    "support_conversations?select=*",
    {
      public_token: crypto.randomUUID(),
      status: "open",
      priority: "normal",
      sla_started_at: now,
      source_page: sourcePage || "homepage",
      created_at: now,
      updated_at: now,
    }
  );

  if (!rows[0]) throw new Error("Failed to create support conversation.");
  return rows[0];
}

export async function getConversationByToken(
  id: string,
  publicToken: string
): Promise<SupportConversation | null> {
  if (!hasConfig()) return null;

  const rows = await dbGet<SupportConversation[]>(
    `support_conversations?id=eq.${encodeURIComponent(id)}&public_token=eq.${encodeURIComponent(publicToken)}&select=*&limit=1`
  );

  return rows[0] ?? null;
}

export async function getMessagesByConversation(conversationId: string): Promise<SupportMessageWithAttachments[]> {
  if (!hasConfig()) return [];

  const rows = await dbGet<SupportMessage[]>(
    `support_messages?conversation_id=eq.${encodeURIComponent(conversationId)}&order=created_at.asc&select=*`
  );
  const messages = normalizeSupportMessages(rows);
  const [attachments, productShares, orderShares] = await Promise.all([
    getAttachmentsByConversation(conversationId),
    getProductSharesByConversation(conversationId),
    getOrderSharesByConversation(conversationId),
  ]);
  return attachSupportMetadata(messages, attachments, productShares, orderShares);
}

export async function addMessage(
  conversationId: string,
  body: string,
  senderType: SenderType,
  options: { id?: string } = {}
): Promise<SupportMessage> {
  if (!hasConfig()) throw new Error("Support backend not configured.");

  const now = new Date().toISOString();
  const text = body.trim();
  const rows = await dbPost<SupportMessage[]>(
    "support_messages?select=*",
    {
      id: options.id ?? crypto.randomUUID(),
      conversation_id: conversationId,
      message: text,
      body: text,
      sender_type: senderType,
      created_at: now,
    }
  );

  if (!rows[0]) throw new Error("Failed to save support message.");

  // Best-effort: update last_message_at + updated_at on the conversation
  dbPatch(
    `support_conversations?id=eq.${encodeURIComponent(conversationId)}`,
    { last_message_at: now, updated_at: now }
  ).catch(() => null);

  return normalizeSupportMessage(rows[0]);
}

export async function addMessageAttachments(messageId: string, conversationId: string, attachments: PreparedSupportAttachment[]) {
  if (!attachments.length) return [] as SupportAttachment[];
  const messageRows = await dbGet<Pick<SupportMessage, "id" | "conversation_id">[]>(
    `support_messages?id=eq.${encodeURIComponent(messageId)}&conversation_id=eq.${encodeURIComponent(conversationId)}&select=id,conversation_id&limit=1`
  );
  if (!messageRows[0]) {
    throw new Error("Support attachment message/conversation mismatch.");
  }
  const rows = await dbPost<SupportAttachment[]>(
    "support_message_attachments?select=*",
    attachments.map(attachment => ({
      message_id: messageId,
      conversation_id: conversationId,
      storage_path: attachment.storage_path,
      file_name: attachment.file_name,
      mime_type: attachment.mime_type,
      size_bytes: attachment.size_bytes,
    }))
  );
  return rows;
}

export async function addMessageProductShare(
  messageId: string,
  conversationId: string,
  share: Omit<SupportProductShare, "id" | "message_id" | "conversation_id" | "created_at">
) {
  const rows = await dbPost<SupportProductShare[]>(
    "support_message_product_shares?select=*",
    {
      message_id: messageId,
      conversation_id: conversationId,
      ...share,
    }
  );
  if (!rows[0]) throw new Error("Failed to save support product share.");
  return rows[0];
}

export async function deleteSupportMessage(messageId: string, conversationId: string) {
  if (!hasConfig()) return;
  await dbDelete(`support_messages?id=eq.${encodeURIComponent(messageId)}&conversation_id=eq.${encodeURIComponent(conversationId)}`);
}

async function getAttachmentsByConversation(conversationId: string): Promise<SupportAttachment[]> {
  try {
    const rows = await dbGet<SupportAttachment[]>(
      `support_message_attachments?conversation_id=eq.${encodeURIComponent(conversationId)}&select=*&order=created_at.asc,id.asc`
    );
    return Promise.all(rows.map(async attachment => ({
      ...attachment,
      signed_url: await signedSupportAttachmentUrl(attachment.storage_path).catch(() => ""),
    })));
  } catch {
    return [];
  }
}

async function getProductSharesByConversation(conversationId: string): Promise<SupportProductShare[]> {
  try {
    return await dbGet<SupportProductShare[]>(
      `support_message_product_shares?conversation_id=eq.${encodeURIComponent(conversationId)}&select=*&order=created_at.asc,id.asc`
    );
  } catch {
    return [];
  }
}

async function getOrderSharesByConversation(conversationId: string): Promise<SupportOrderShare[]> {
  try {
    return await dbGet<SupportOrderShare[]>(
      `support_message_order_shares?conversation_id=eq.${encodeURIComponent(conversationId)}&select=*&order=created_at.asc,id.asc`
    );
  } catch {
    return [];
  }
}

function groupByMessage<T extends { message_id: string }>(items: T[]) {
  const grouped = new Map<string, T[]>();
  for (const item of items) {
    const group = grouped.get(item.message_id) ?? [];
    group.push(item);
    grouped.set(item.message_id, group);
  }
  return grouped;
}

function attachSupportMetadata(
  messages: SupportMessage[],
  attachments: SupportAttachment[],
  productShares: SupportProductShare[] = [],
  orderShares: SupportOrderShare[] = []
): SupportMessageWithAttachments[] {
  const grouped = new Map<string, SupportAttachment[]>();
  for (const attachment of attachments) {
    const group = grouped.get(attachment.message_id) ?? [];
    group.push(attachment);
    grouped.set(attachment.message_id, group);
  }
  const products = groupByMessage(productShares);
  const orders = groupByMessage(orderShares);
  return messages.map(message => ({
    ...message,
    attachments: grouped.get(message.id) ?? [],
    product_shares: products.get(message.id) ?? [],
    order_shares: orders.get(message.id) ?? [],
  }));
}

export async function markCustomerMessagesRead(conversationId: string): Promise<void> {
  if (!hasConfig()) return;

  await dbPatch(
    `support_messages?conversation_id=eq.${encodeURIComponent(conversationId)}&sender_type=eq.customer`,
    { is_read: true }
  );
}

export async function markCustomerMessagesUnread(conversationId: string): Promise<void> {
  if (!hasConfig()) return;

  await dbPatch(
    `support_messages?conversation_id=eq.${encodeURIComponent(conversationId)}&sender_type=eq.customer`,
    { is_read: false }
  );
}

export async function getAllConversations(): Promise<SupportConversation[]> {
  if (!hasConfig()) return [];

  return dbGet<SupportConversation[]>(
    "support_conversations?order=created_at.desc&select=*"
  );
}

// Batch inbox reads, not one full message query for every conversation.
// Continue paging until empty, including installations with a lower REST row cap.
async function dbGetAll<T>(path: string): Promise<T[]> {
  const result: T[] = [];
  for (let offset = 0; ; ) {
    const rows = await dbGet<T[]>(`${path}&limit=500&offset=${offset}`);
    if (!rows.length) return result;
    result.push(...rows);
    offset += rows.length;
  }
}

export async function getAdminSupportInbox() {
  if (!hasConfig()) throw new Error("Support backend not configured.");
  const [conversations, messages] = await Promise.all([
    dbGetAll<Omit<SupportConversation, "public_token">>("support_conversations?select=id,status,source_page,created_at,updated_at,assigned_staff_id,assigned_staff_name,priority,sla_started_at,escalated_at,escalated_by,escalation_reason&order=created_at.desc,id.asc"),
    dbGetAll<SupportMessage>("support_messages?select=id,conversation_id,message,body,sender_type,created_at,is_read&order=created_at.asc,id.asc"),
  ]);
  return buildSupportInbox(conversations, normalizeSupportMessages(messages));
}

export async function getAdminSupportMessages(conversationId: string): Promise<SupportMessageWithAttachments[]> {
  if (!hasConfig()) throw new Error("Support backend not configured.");
  const rows = await dbGetAll<SupportMessage>(`support_messages?conversation_id=eq.${encodeURIComponent(conversationId)}&select=*&order=created_at.asc,id.asc`);
  const messages = normalizeSupportMessages(rows);
  const [attachments, productShares, orderShares] = await Promise.all([
    getAttachmentsByConversation(conversationId),
    getProductSharesByConversation(conversationId),
    getOrderSharesByConversation(conversationId),
  ]);
  return attachSupportMetadata(messages, attachments, productShares, orderShares);
}

export async function getSupportInternalNotes(conversationId: string): Promise<SupportInternalNote[]> {
  if (!hasConfig()) return [];
  try {
    return await dbGet<SupportInternalNote[]>(
      `support_internal_notes?conversation_id=eq.${encodeURIComponent(conversationId)}&select=id,conversation_id,body,author_name,created_at&order=created_at.asc,id.asc`
    );
  } catch {
    return [];
  }
}

export async function addSupportInternalNote(conversationId: string, body: string, authorName: string): Promise<SupportInternalNote> {
  const value = body.trim();
  if (!value) throw new Error("Internal note body is required.");
  const rows = await dbPost<SupportInternalNote[]>("support_internal_notes?select=id,conversation_id,body,author_name,created_at", {
    conversation_id: conversationId,
    body: value,
    author_name: authorName || "Admin",
  });
  if (!rows[0]) throw new Error("Failed to save internal note.");
  return rows[0];
}

export async function getSupportMessageWithAttachments(messageId: string, conversationId: string): Promise<SupportMessageWithAttachments | null> {
  if (!hasConfig()) return null;
  const rows = await dbGet<SupportMessage[]>(
    `support_messages?id=eq.${encodeURIComponent(messageId)}&conversation_id=eq.${encodeURIComponent(conversationId)}&select=*&limit=1`
  );
  const message = rows[0] ? normalizeSupportMessage(rows[0]) : null;
  if (!message) return null;
  const [attachments, productShares, orderShares] = await Promise.all([
    getAttachmentsByConversation(conversationId),
    getProductSharesByConversation(conversationId),
    getOrderSharesByConversation(conversationId),
  ]);
  return attachSupportMetadata([message], attachments, productShares, orderShares)[0] ?? null;
}

export async function getConversationById(id: string): Promise<SupportConversation | null> {
  if (!hasConfig()) return null;

  const rows = await dbGet<SupportConversation[]>(
    `support_conversations?id=eq.${encodeURIComponent(id)}&select=*&limit=1`
  );

  return rows[0] ?? null;
}

export async function updateConversationStatus(
  id: string,
  status: ConversationStatus
): Promise<void> {
  if (!hasConfig()) return;

  await dbPatch(
    `support_conversations?id=eq.${encodeURIComponent(id)}`,
    { status, updated_at: new Date().toISOString() }
  );
}

export async function updateConversationAssignment(
  id: string,
  assignment: { staffId: string | null; staffName: string | null }
): Promise<void> {
  if (!hasConfig()) return;

  await dbPatch(
    `support_conversations?id=eq.${encodeURIComponent(id)}`,
    {
      assigned_staff_id: assignment.staffId,
      assigned_staff_name: assignment.staffName,
      updated_at: new Date().toISOString(),
    }
  );
}

export async function updateConversationPriority(id: string, priority: SupportPriority): Promise<void> {
  if (!hasConfig()) return;

  await dbPatch(
    `support_conversations?id=eq.${encodeURIComponent(id)}`,
    { priority, updated_at: new Date().toISOString() }
  );
}

export async function escalateSupportConversation(
  id: string,
  input: { actorName: string; reason: string; staffId?: string | null; staffName?: string | null }
): Promise<void> {
  if (!hasConfig()) return;
  const now = new Date().toISOString();
  const payload: Record<string, unknown> = {
    escalated_at: now,
    escalated_by: input.actorName || "Admin",
    escalation_reason: input.reason.trim(),
    updated_at: now,
  };
  if ("staffId" in input) {
    payload.assigned_staff_id = input.staffId ?? null;
    payload.assigned_staff_name = input.staffName ?? null;
  }
  await dbPatch(`support_conversations?id=eq.${encodeURIComponent(id)}`, payload);
}

export async function clearSupportEscalation(id: string): Promise<void> {
  if (!hasConfig()) return;
  await dbPatch(
    `support_conversations?id=eq.${encodeURIComponent(id)}`,
    { escalated_at: null, escalated_by: null, escalation_reason: null, updated_at: new Date().toISOString() }
  );
}

export async function listSupportLabels(): Promise<SupportLabel[]> {
  if (!hasConfig()) return [];
  try {
    return await dbGet<SupportLabel[]>("support_labels?select=id,name,color,created_at&order=name.asc");
  } catch {
    return [];
  }
}

export async function getSupportConversationLabels(conversationId: string): Promise<SupportLabel[]> {
  if (!hasConfig()) return [];
  try {
    const rows = await dbGet<Array<{ support_labels?: SupportLabel | SupportLabel[] | null }>>(
      `support_conversation_labels?conversation_id=eq.${encodeURIComponent(conversationId)}&select=support_labels(id,name,color,created_at)&order=created_at.asc`
    );
    return rows.flatMap(row => {
      const label = row.support_labels;
      return Array.isArray(label) ? label : label ? [label] : [];
    });
  } catch {
    return [];
  }
}

export async function createSupportLabel(name: string, color: string | null = null): Promise<SupportLabel> {
  const clean = name.trim().replace(/\s+/g, " ").slice(0, 80);
  if (!clean) throw new Error("Label name is required.");
  const rows = await dbPost<SupportLabel[]>("support_labels?select=id,name,color,created_at", {
    name: clean,
    color,
  });
  if (!rows[0]) throw new Error("Failed to create support label.");
  return rows[0];
}

export async function updateSupportLabel(labelId: string, input: { name: string; color: string | null }): Promise<SupportLabel> {
  const clean = input.name.trim().replace(/\s+/g, " ").slice(0, 80);
  if (!clean) throw new Error("Label name is required.");
  const res = await fetch(endpoint(`support_labels?id=eq.${encodeURIComponent(labelId)}&select=id,name,color,created_at`), {
    method: "PATCH",
    headers: authHeaders({ prefer: "return=representation" }),
    body: JSON.stringify({ name: clean, color: input.color }),
    cache: "no-store",
  });
  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new Error(`Support label update failed ${res.status}: ${detail.slice(0, 200)}`);
  }
  const rows = (await res.json()) as SupportLabel[];
  if (!rows[0]) throw new Error("Support label not found.");
  return rows[0];
}

export async function deleteSupportLabel(labelId: string): Promise<void> {
  if (!hasConfig()) return;
  await dbDelete(`support_labels?id=eq.${encodeURIComponent(labelId)}`);
}

export async function attachSupportLabel(conversationId: string, labelId: string): Promise<void> {
  if (!hasConfig()) return;
  await dbPost("support_conversation_labels?select=conversation_id,label_id", {
    conversation_id: conversationId,
    label_id: labelId,
  }).catch(async error => {
    if (!String(error?.message ?? "").toLowerCase().includes("duplicate")) throw error;
  });
}

export async function removeSupportLabel(conversationId: string, labelId: string): Promise<void> {
  if (!hasConfig()) return;
  await dbDelete(
    `support_conversation_labels?conversation_id=eq.${encodeURIComponent(conversationId)}&label_id=eq.${encodeURIComponent(labelId)}`
  );
}

export async function listSupportSavedReplies(): Promise<SupportSavedReply[]> {
  if (!hasConfig()) return [];
  return dbGet<SupportSavedReply[]>("support_saved_replies?select=id,title,body,created_by,created_at,updated_at&order=updated_at.desc,id.asc");
}

export async function createSupportSavedReply(input: { title: string; body: string; createdBy: string }): Promise<SupportSavedReply> {
  const now = new Date().toISOString();
  const rows = await dbPost<SupportSavedReply[]>("support_saved_replies?select=id,title,body,created_by,created_at,updated_at", {
    title: input.title.trim(),
    body: input.body.trim(),
    created_by: input.createdBy || null,
    created_at: now,
    updated_at: now,
  });
  if (!rows[0]) throw new Error("Failed to create saved reply.");
  return rows[0];
}

export async function updateSupportSavedReply(id: string, input: { title: string; body: string }): Promise<SupportSavedReply | null> {
  const res = await fetch(endpoint(`support_saved_replies?id=eq.${encodeURIComponent(id)}&select=id,title,body,created_by,created_at,updated_at`), {
    method: "PATCH",
    headers: authHeaders({ prefer: "return=representation" }),
    body: JSON.stringify({ title: input.title.trim(), body: input.body.trim(), updated_at: new Date().toISOString() }),
    cache: "no-store",
  });
  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new Error(`Support saved reply update failed ${res.status}: ${detail.slice(0, 200)}`);
  }
  return ((await res.json()) as SupportSavedReply[])[0] ?? null;
}

export async function deleteSupportSavedReply(id: string): Promise<boolean> {
  if (!hasConfig()) return false;
  const existing = await dbGet<Pick<SupportSavedReply, "id">[]>(`support_saved_replies?id=eq.${encodeURIComponent(id)}&select=id&limit=1`);
  if (!existing[0]) return false;
  await dbDelete(`support_saved_replies?id=eq.${encodeURIComponent(id)}`);
  return true;
}
