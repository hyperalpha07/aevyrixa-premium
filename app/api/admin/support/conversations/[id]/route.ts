import { unauthorizedAdminResponse, verifyAdminRequest } from "@/app/lib/admin-auth";
import {
  getConversationById,
  getMessagesByConversation,
  updateConversationStatus,
  type ConversationStatus,
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
  if (!verifyAdminRequest(request)) return unauthorizedAdminResponse();

  const { id } = await params;

  try {
    const conversation = await getConversationById(id);
    if (!conversation) return json({ error: "Conversation not found." }, { status: 404 });

    const messages = await getMessagesByConversation(id);

    return json({
      id: conversation.id,
      status: conversation.status,
      source_page: conversation.source_page,
      created_at: conversation.created_at,
      updated_at: conversation.updated_at,
      messages: messages.map((m) => ({
        id: m.id,
        body: m.body,
        sender_type: m.sender_type,
        created_at: m.created_at,
      })),
    });
  } catch (error) {
    console.error("Failed to load admin conversation:", error);
    return json({ error: "Could not load conversation." }, { status: 503 });
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!verifyAdminRequest(request)) return unauthorizedAdminResponse();

  const { id } = await params;

  let status: ConversationStatus;
  try {
    const body = (await request.json()) as Record<string, unknown>;
    const s = body.status;
    if (s !== "open" && s !== "pending" && s !== "closed") {
      return json({ error: "Invalid status. Use open, pending, or closed." }, { status: 400 });
    }
    status = s;
  } catch {
    return json({ error: "Invalid request body." }, { status: 400 });
  }

  try {
    await updateConversationStatus(id, status);
    return json({ ok: true, status });
  } catch (error) {
    console.error("Failed to update conversation status:", error);
    return json({ error: "Could not update status." }, { status: 503 });
  }
}
