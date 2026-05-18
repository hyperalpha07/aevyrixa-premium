// Server-only. Do NOT import from client components.

export type ConversationStatus = "open" | "pending" | "closed";
export type SenderType = "customer" | "admin";

export type SupportConversation = {
  id: string;
  public_token: string;
  status: ConversationStatus;
  source_page: string;
  created_at: string;
  updated_at: string | null;
};

export type SupportMessage = {
  id: string;
  conversation_id: string;
  body: string;
  sender_type: SenderType;
  created_at: string;
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

export async function createConversation(sourcePage: string): Promise<SupportConversation> {
  if (!hasConfig()) throw new Error("Support backend not configured.");

  const now = new Date().toISOString();
  const rows = await dbPost<SupportConversation[]>(
    "support_conversations?select=*",
    {
      public_token: crypto.randomUUID(),
      status: "open",
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

export async function getMessagesByConversation(conversationId: string): Promise<SupportMessage[]> {
  if (!hasConfig()) return [];

  return dbGet<SupportMessage[]>(
    `support_messages?conversation_id=eq.${encodeURIComponent(conversationId)}&order=created_at.asc&select=*`
  );
}

export async function addMessage(
  conversationId: string,
  body: string,
  senderType: SenderType
): Promise<SupportMessage> {
  if (!hasConfig()) throw new Error("Support backend not configured.");

  const now = new Date().toISOString();
  const rows = await dbPost<SupportMessage[]>(
    "support_messages?select=*",
    {
      id: crypto.randomUUID(),
      conversation_id: conversationId,
      body: body.trim(),
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

  return rows[0];
}

export async function getAllConversations(): Promise<SupportConversation[]> {
  if (!hasConfig()) return [];

  return dbGet<SupportConversation[]>(
    "support_conversations?order=created_at.desc&select=*"
  );
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
