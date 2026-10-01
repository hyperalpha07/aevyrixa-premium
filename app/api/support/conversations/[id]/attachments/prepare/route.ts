import { createSupportAttachmentManifest } from "@/app/lib/support-attachment-finalize";
import { prepareSupportAttachmentUploads, type SupportAttachmentUploadMetadata } from "@/app/lib/support-attachments";
import { getConversationByToken } from "@/app/lib/support-store";

export const dynamic = "force-dynamic";

function json(payload: unknown, init: ResponseInit = {}) {
  const headers = new Headers(init.headers);
  headers.set("cache-control", "no-store");
  return Response.json(payload, { ...init, headers });
}

function metadataFromBody(body: Record<string, unknown>): SupportAttachmentUploadMetadata[] {
  const files: unknown[] = Array.isArray(body.files) ? body.files as unknown[] : [];
  return files.map(file => {
    const source = typeof file === "object" && file ? file as Record<string, unknown> : {};
    return {
      file_name: typeof source.file_name === "string" ? source.file_name : typeof source.name === "string" ? source.name : "",
      mime_type: typeof source.mime_type === "string" ? source.mime_type : typeof source.type === "string" ? source.type : "",
      size_bytes: typeof source.size_bytes === "number" ? source.size_bytes : typeof source.size === "number" ? source.size : 0,
    };
  });
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
  if (!token) return json({ error: "Missing token." }, { status: 401 });

  try {
    const conversation = await getConversationByToken(id, token);
    if (!conversation) return json({ error: "Conversation not found." }, { status: 404 });
    if (conversation.status === "closed") return json({ error: "This conversation is closed." }, { status: 410 });
    const messageId = crypto.randomUUID();
    const attachments = await prepareSupportAttachmentUploads(id, messageId, metadataFromBody(body));
    const manifestToken = createSupportAttachmentManifest({ conversationId: id, messageId, senderType: "customer", attachments });
    return json({ messageId, manifestToken, attachments });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not prepare attachments.";
    return json({ error: message }, { status: 400 });
  }
}
