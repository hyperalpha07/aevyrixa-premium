import { addMessage, createConversation } from "@/app/lib/support-store";

export const dynamic = "force-dynamic";

function json(payload: unknown, init: ResponseInit = {}) {
  const headers = new Headers(init.headers);
  headers.set("cache-control", "no-store");
  return Response.json(payload, { ...init, headers });
}

export async function POST(request: Request) {
  let sourcePage = "homepage";
  let firstMessage = "";

  try {
    const body = (await request.json()) as Record<string, unknown>;
    if (typeof body.sourcePage === "string") sourcePage = body.sourcePage;
    if (typeof body.message === "string") firstMessage = body.message.trim();
  } catch {
    // use defaults
  }

  try {
    const conversation = await createConversation(sourcePage);

    const messages: { id: string; body: string; sender_type: string; created_at: string }[] = [];

    if (firstMessage) {
      try {
        const msg = await addMessage(conversation.id, firstMessage, "customer");
        messages.push({
          id: msg.id,
          body: msg.body,
          sender_type: msg.sender_type,
          created_at: msg.created_at,
        });
      } catch (msgErr) {
        console.error("Failed to save first support message:", msgErr);
        // Non-fatal — conversation still created; widget falls back to /messages endpoint
      }
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
