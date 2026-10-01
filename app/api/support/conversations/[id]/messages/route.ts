import {
  addMessage,
  getConversationByToken,
} from "@/app/lib/support-store";
import { notifySupportChat } from "@/app/lib/support-notifications";
import { readSupportMessageInput } from "@/app/lib/support-message-input";

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

  const parsed = await readSupportMessageInput(request);
  if ("error" in parsed) return json({ error: parsed.error }, { status: parsed.status });
  const { body, token } = parsed.input;

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
    notifySupportChat("customer_message", conversation, message).catch((notifyErr) => {
      console.error("Failed to send support Telegram notification:", notifyErr);
    });

    return json({
      id: message.id,
      body: message.body,
      sender_type: message.sender_type,
      created_at: message.created_at,
      attachments: [],
    });
  } catch (error) {
    console.error("Failed to save customer message:", error);
    return json({ error: "Could not send message right now." }, { status: 503 });
  }
}
