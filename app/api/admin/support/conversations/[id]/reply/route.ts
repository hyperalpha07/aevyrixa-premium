import { forbiddenAdminResponse, verifyFreshAdminRequestPermission } from "@/app/lib/admin-auth";
import { logStaffActivity } from "@/app/lib/admin-staff";
import {
  addMessage,
  getConversationById,
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
  const session = await verifyFreshAdminRequestPermission(request, "support.reply");
  if (!session) return forbiddenAdminResponse();

  const { id } = await params;

  let body: string;
  try {
    const payload = (await request.json()) as Record<string, unknown>;
    body = typeof payload.body === "string" ? payload.body.trim() : "";
  } catch {
    return json({ error: "Invalid request body." }, { status: 400 });
  }

  if (!body) return json({ error: "Reply body is required." }, { status: 400 });
  if (body.length > 4000) return json({ error: "Reply too long." }, { status: 400 });

  try {
    const conversation = await getConversationById(id);
    if (!conversation) {
      return json({ error: "Conversation not found." }, { status: 404 });
    }

    const message = await addMessage(id, body, "admin");
    await logStaffActivity({
      actor: session,
      action: "support.reply_sent",
      targetType: "conversation",
      targetId: id,
    });

    return json({
      id: message.id,
      body: message.body,
      sender_type: message.sender_type,
      created_at: message.created_at,
    });
  } catch (error) {
    console.error("Failed to send admin reply:", error);
    return json({ error: "Could not send reply." }, { status: 503 });
  }
}
