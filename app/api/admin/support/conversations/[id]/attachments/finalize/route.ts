import { forbiddenAdminResponse, verifyFreshAdminRequestPermission } from "@/app/lib/admin-auth";
import { logStaffActivity } from "@/app/lib/admin-staff";
import { finalizeSupportAttachmentMessage } from "@/app/lib/support-attachment-finalize";
import { getConversationById } from "@/app/lib/support-store";

export const dynamic = "force-dynamic";

function json(payload: unknown, init: ResponseInit = {}) {
  const headers = new Headers(init.headers);
  headers.set("cache-control", "no-store");
  return Response.json(payload, { ...init, headers });
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await verifyFreshAdminRequestPermission(request, "support.reply");
  if (!session) return forbiddenAdminResponse();
  const { id } = await params;

  let body: Record<string, unknown>;
  try {
    body = await request.json() as Record<string, unknown>;
  } catch {
    return json({ error: "Invalid request body." }, { status: 400 });
  }

  const manifestToken = typeof body.manifestToken === "string" ? body.manifestToken : "";
  const submittedMessageId = typeof body.messageId === "string" ? body.messageId : undefined;
  const text = typeof body.body === "string" ? body.body.trim() : "";
  if (!manifestToken) return json({ error: "Missing attachment manifest." }, { status: 400 });
  if (text.length > 4000) return json({ error: "Reply too long." }, { status: 400 });

  try {
    const conversation = await getConversationById(id);
    if (!conversation) return json({ error: "Conversation not found." }, { status: 404 });
    if (conversation.status === "closed") return json({ error: "Conversation closed. Reopen it before replying." }, { status: 409 });
    const message = await finalizeSupportAttachmentMessage({ conversationId: id, body: text, senderType: "admin", manifestToken, submittedMessageId });
    await logStaffActivity({ actor: session, action: "support.reply_sent", targetType: "conversation", targetId: id });
    return json({
      id: message.id,
      body: message.body,
      sender_type: message.sender_type,
      created_at: message.created_at,
      attachments: message.attachments ?? [],
    });
  } catch (error) {
    console.error("Failed to finalize admin attachment reply:", error);
    return json({ error: "Could not finalize attachment reply." }, { status: 503 });
  }
}
