import { forbiddenAdminResponse, verifyFreshAdminRequestPermission } from "@/app/lib/admin-auth";
import { logStaffActivity } from "@/app/lib/admin-staff";
import { addSupportInternalNote, getConversationById } from "@/app/lib/support-store";

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

  let body = "";
  try {
    const payload = (await request.json()) as Record<string, unknown>;
    body = typeof payload.body === "string" ? payload.body.trim() : "";
  } catch {
    return json({ error: "Invalid request body." }, { status: 400 });
  }
  if (!body) return json({ error: "Internal note body is required." }, { status: 400 });
  if (body.length > 4000) return json({ error: "Internal note is too long." }, { status: 400 });

  try {
    if (!(await getConversationById(id))) return json({ error: "Conversation not found." }, { status: 404 });
    const note = await addSupportInternalNote(id, body, session.displayName || session.username);
    await logStaffActivity({
      actor: session,
      action: "support.internal_note_added",
      targetType: "conversation",
      targetId: id,
      metadata: { noteId: note.id, bodyLength: body.length },
    });
    return json({ note }, { status: 201 });
  } catch (error) {
    console.error("Failed to add support internal note:", error);
    return json({ error: "Could not add internal note." }, { status: 503 });
  }
}
