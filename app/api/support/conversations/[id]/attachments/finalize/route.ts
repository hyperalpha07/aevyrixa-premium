import { finalizeSupportAttachmentMessage } from "@/app/lib/support-attachment-finalize";
import { notifySupportChat } from "@/app/lib/support-notifications";
import { getConversationByToken } from "@/app/lib/support-store";

export const dynamic = "force-dynamic";

function json(payload: unknown, init: ResponseInit = {}) {
  const headers = new Headers(init.headers);
  headers.set("cache-control", "no-store");
  return Response.json(payload, { ...init, headers });
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  let body: Record<string, unknown>;
  try {
    body = await request.json() as Record<string, unknown>;
  } catch {
    return json({ error: "Invalid request body." }, { status: 400 });
  }
  const token = typeof body.token === "string" ? body.token : "";
  const manifestToken = typeof body.manifestToken === "string" ? body.manifestToken : "";
  const submittedMessageId = typeof body.messageId === "string" ? body.messageId : undefined;
  const text = typeof body.body === "string" ? body.body.trim() : "";
  if (!token) return json({ error: "Missing token." }, { status: 401 });
  if (!manifestToken) return json({ error: "Missing attachment manifest." }, { status: 400 });
  if (text.length > 2000) return json({ error: "Message too long." }, { status: 400 });

  try {
    const conversation = await getConversationByToken(id, token);
    if (!conversation) return json({ error: "Conversation not found." }, { status: 404 });
    if (conversation.status === "closed") return json({ error: "This conversation is closed." }, { status: 410 });
    const message = await finalizeSupportAttachmentMessage({ conversationId: id, body: text, senderType: "customer", manifestToken, submittedMessageId });
    notifySupportChat("customer_message", conversation, message).catch((notifyErr) => {
      console.error("Failed to send support Telegram notification:", notifyErr);
    });
    return json({
      id: message.id,
      body: message.body,
      sender_type: message.sender_type,
      created_at: message.created_at,
      attachments: message.attachments ?? [],
    });
  } catch (error) {
    console.error("Failed to finalize customer attachment message:", error);
    return json({ error: "Could not finalize attachment message." }, { status: 503 });
  }
}
