import { forbiddenAdminResponse, verifyFreshAdminRequestPermission } from "@/app/lib/admin-auth";
import { createSupportAttachmentManifest } from "@/app/lib/support-attachment-finalize";
import { prepareSupportAttachmentUploads, type SupportAttachmentUploadMetadata } from "@/app/lib/support-attachments";
import { getConversationById } from "@/app/lib/support-store";

export const dynamic = "force-dynamic";

function json(payload: unknown, init: ResponseInit = {}) {
  const headers = new Headers(init.headers);
  headers.set("cache-control", "no-store");
  return Response.json(payload, { ...init, headers });
}

function metadataFromBody(body: unknown): SupportAttachmentUploadMetadata[] {
  const files: unknown[] = typeof body === "object" && body && Array.isArray((body as Record<string, unknown>).files)
    ? (body as Record<string, unknown>).files as unknown[]
    : [];
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
  if (!(await verifyFreshAdminRequestPermission(request, "support.reply"))) return forbiddenAdminResponse();
  const { id } = await params;

  let files: SupportAttachmentUploadMetadata[];
  try {
    files = metadataFromBody(await request.json());
  } catch {
    return json({ error: "Invalid request body." }, { status: 400 });
  }

  try {
    const conversation = await getConversationById(id);
    if (!conversation) return json({ error: "Conversation not found." }, { status: 404 });
    if (conversation.status === "closed") return json({ error: "Conversation closed. Reopen it before replying." }, { status: 409 });
    const messageId = crypto.randomUUID();
    const attachments = await prepareSupportAttachmentUploads(id, messageId, files);
    const manifestToken = createSupportAttachmentManifest({ conversationId: id, messageId, senderType: "admin", attachments });
    return json({ messageId, manifestToken, attachments });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not prepare attachments.";
    return json({ error: message }, { status: 400 });
  }
}
