import {
  getConversationByToken,
  getMessagesByConversation,
} from "@/app/lib/support-store";

export const dynamic = "force-dynamic";

function json(payload: unknown, init: ResponseInit = {}) {
  const headers = new Headers(init.headers);
  headers.set("cache-control", "no-store");
  return Response.json(payload, { ...init, headers });
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const url = new URL(request.url);
  const token = url.searchParams.get("token") ?? "";

  if (!id || !token) {
    return json({ error: "Missing conversation id or token." }, { status: 400 });
  }

  try {
    const conversation = await getConversationByToken(id, token);
    if (!conversation) {
      return json({ error: "Conversation not found." }, { status: 404 });
    }

    const messages = await getMessagesByConversation(id);

    return json({
      id: conversation.id,
      status: conversation.status,
      created_at: conversation.created_at,
      messages: messages.map((m) => ({
        id: m.id,
        body: m.body,
        sender_type: m.sender_type,
        created_at: m.created_at,
      })),
    });
  } catch (error) {
    console.error("Failed to load conversation:", error);
    return json({ error: "Could not load conversation." }, { status: 503 });
  }
}
