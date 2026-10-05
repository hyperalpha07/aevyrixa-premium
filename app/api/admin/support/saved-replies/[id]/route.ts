import { forbiddenAdminResponse, verifyFreshAdminRequestPermission } from "@/app/lib/admin-auth";
import { logStaffActivity } from "@/app/lib/admin-staff";
import { deleteSupportSavedReply, updateSupportSavedReply } from "@/app/lib/support-store";

export const dynamic = "force-dynamic";

function json(payload: unknown, init: ResponseInit = {}) {
  const headers = new Headers(init.headers);
  headers.set("cache-control", "no-store");
  return Response.json(payload, { ...init, headers });
}

function parseSavedReplyInput(payload: Record<string, unknown>) {
  const title = typeof payload.title === "string" ? payload.title.trim().replace(/\s+/g, " ") : "";
  const body = typeof payload.body === "string" ? payload.body.trim() : "";
  if (!title || title.length > 120) return { error: "Saved reply title must be 1-120 characters." };
  if (!body || body.length > 4000) return { error: "Saved reply body must be 1-4000 characters." };
  return { title, body };
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await verifyFreshAdminRequestPermission(request, "support.manage");
  if (!session) return forbiddenAdminResponse();
  const { id } = await params;
  let parsed: ReturnType<typeof parseSavedReplyInput>;
  try {
    parsed = parseSavedReplyInput((await request.json()) as Record<string, unknown>);
  } catch {
    return json({ error: "Invalid request body." }, { status: 400 });
  }
  if ("error" in parsed) return json({ error: parsed.error }, { status: 400 });
  try {
    const reply = await updateSupportSavedReply(id, { title: parsed.title, body: parsed.body });
    if (!reply) return json({ error: "Saved reply not found." }, { status: 404 });
    await logStaffActivity({ actor: session, action: "support.saved_reply_updated", targetType: "support_saved_reply", targetId: id });
    return json({ reply });
  } catch (error) {
    console.error("Failed to update support saved reply:", error);
    return json({ error: "Could not update saved reply." }, { status: 503 });
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await verifyFreshAdminRequestPermission(request, "support.manage");
  if (!session) return forbiddenAdminResponse();
  const { id } = await params;
  try {
    const deleted = await deleteSupportSavedReply(id);
    if (!deleted) return json({ error: "Saved reply not found." }, { status: 404 });
    await logStaffActivity({ actor: session, action: "support.saved_reply_deleted", targetType: "support_saved_reply", targetId: id });
    return json({ ok: true });
  } catch (error) {
    console.error("Failed to delete support saved reply:", error);
    return json({ error: "Could not delete saved reply." }, { status: 503 });
  }
}
