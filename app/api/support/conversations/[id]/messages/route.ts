import {
  addMessage,
  getConversationByToken,
} from "@/app/lib/support-store";

export const dynamic = "force-dynamic";

function json(payload: unknown, init: ResponseInit = {}) {
  const headers = new Headers(init.headers);
  headers.set("cache-control", "no-store");
  return Response.json(payload, { ...init, headers });
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  let body: string;
  let token: string;

  try {
    const payload = (await request.json()) as Record<string, unknown>;
    body = typeof payload.body === "string" ? payload.body.trim() : "";
    token = typeof payload.token === "string" ? payload.token : "";
  } catch {
    return json({ error: "Invalid request body." }, { status: 400 });
  }

  if (!body) return json({ error: "Message body is required." }, { status: 400 });
  if (body.length > 2000) return json({ error: "Message too long." }, { status: 400 });
  if (!token) return json({ error: "Missing token." }, { status: 401 });

  try {
    const conversation = await getConversationByToken(id, token);
    if (!conversation) {
      return json({ error: "Conversation not found." }, { status: 404 });
    }

    if (conversation.status === "closed") {
      return json({ error: "This conversation is closed." }, { status: 410 });
    }

    const message = await addMessage(id, body, "customer");

    return json({
      id: message.id,
      body: message.body,
      sender_type: message.sender_type,
      created_at: message.created_at,
    });
  } catch (error) {
    console.error("Failed to save customer message:", error);
    return json({ error: "Could not send message right now." }, { status: 503 });
  }
}
