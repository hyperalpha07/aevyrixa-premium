import { forbiddenAdminResponse, verifyFreshAdminRequestPermission } from "@/app/lib/admin-auth";
import { logStaffActivity } from "@/app/lib/admin-staff";
import { readSupportMessageInput } from "@/app/lib/support-message-input";
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

  const parsed = await readSupportMessageInput(request);
  if ("error" in parsed) return json({ error: parsed.error }, { status: parsed.status });

  const body = parsed.input.body;
  if (!body) return json({ error: "Reply body is required." }, { status: 400 });
  if (body.length > 4000) return json({ error: "Reply too long." }, { status: 400 });

  try {
    const conversation = await getConversationById(id);
    if (!conversation) {
      return json({ error: "Conversation not found." }, { status: 404 });
    }

    if (conversation.status === "closed") {
      return json({ error: "Conversation closed. Reopen it before replying." }, { status: 409 });
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
      attachments: [],
    });
  } catch (error) {
    console.error("Failed to send admin reply:", error);
    return json({ error: "Could not send reply." }, { status: 503 });
  }
}
