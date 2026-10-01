import { readSupportMessageInput } from "@/app/lib/support-message-input";
import { notifySupportChat } from "@/app/lib/support-notifications";
import { addMessage, createConversation } from "@/app/lib/support-store";

export const dynamic = "force-dynamic";

function json(payload: unknown, init: ResponseInit = {}) {
  const headers = new Headers(init.headers);
  headers.set("cache-control", "no-store");
  return Response.json(payload, { ...init, headers });
}

export async function POST(request: Request) {
  const parsed = await readSupportMessageInput(request);
  if ("error" in parsed) return json({ error: parsed.error }, { status: parsed.status });

  const sourcePage = parsed.input.sourcePage || "homepage";
  const firstMessage = parsed.input.body;

  if (firstMessage.length > 2000) return json({ error: "Message too long." }, { status: 400 });

  try {
    const conversation = await createConversation(sourcePage);

    const messages: { id: string; body: string; sender_type: string; created_at: string; attachments?: unknown[] }[] = [];

    if (firstMessage) {
      try {
        const msg = await addMessage(conversation.id, firstMessage, "customer");
        messages.push({
          id: msg.id,
          body: msg.body,
          sender_type: msg.sender_type,
          created_at: msg.created_at,
          attachments: [],
        });
        notifySupportChat("new_conversation", conversation, msg).catch((notifyErr) => {
          console.error("Failed to send support Telegram notification:", notifyErr);
        });
      } catch (msgErr) {
        console.error("Failed to save first support message:", msgErr);
        // Non-fatal - conversation still created; widget falls back to /messages endpoint.
      }
    } else {
      notifySupportChat("new_conversation", conversation).catch((notifyErr) => {
        console.error("Failed to send support Telegram notification:", notifyErr);
      });
    }

    return json({
      id: conversation.id,
      public_token: conversation.public_token,
      status: conversation.status,
      created_at: conversation.created_at,
      messages,
    });
  } catch (error) {
    console.error("Failed to create support conversation:", error);
    const msg = error instanceof Error ? error.message : String(error);
    const detail = msg.includes("not configured") ? "missing-env" : "insert-conversation-failed";
    return json(
      { error: "Failed to create support conversation", detail },
      { status: 503 }
    );
  }
}
