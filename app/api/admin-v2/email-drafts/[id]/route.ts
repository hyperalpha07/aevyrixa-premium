import { forbiddenAdminResponse, verifyFreshAdminRequestPermission } from "@/app/lib/admin-auth";
import { logStaffActivity } from "@/app/lib/admin-staff";
import { archiveEmailDraft, editEmailDraft, validDraftId, validateEmailDraft } from "@/lib/admin-v2/email-drafts-store";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };
function conflict() {
  return Response.json({ errors: ["Draft has changed or was already archived. Refresh your drafts before trying again."] }, { status: 409 });
}

export async function PATCH(request: Request, context: Ctx) {
  const session = await verifyFreshAdminRequestPermission(request, "email.manage");
  if (!session) return forbiddenAdminResponse();
  const { id } = await context.params;
  if (!validDraftId(id)) return Response.json({ errors: ["Invalid draft ID."] }, { status: 400 });
  if (Number(request.headers.get("content-length") || 0) > 26000) {
    return Response.json({ errors: ["Draft is too large."] }, { status: 413 });
  }
  const body = await request.json().catch(() => null) as Record<string, unknown> | null;
  const revision = body?.revision;
  if (!Number.isSafeInteger(revision) || typeof revision !== "number" || revision < 1) {
    return Response.json({ errors: ["Invalid draft revision."] }, { status: 400 });
  }
  const validation = validateEmailDraft(body);
  if (!validation.input) return Response.json({ errors: validation.errors }, { status: 400 });
  try {
    const draft = await editEmailDraft(id, revision, validation.input, session.username);
    if (!draft) return conflict();
    await logStaffActivity({
      actor: session, action: "email_draft.updated", targetType: "admin_email_draft", targetId: id,
      metadata: { revision: draft.revision },
    });
    return Response.json({ draft }, { headers: { "Cache-Control": "private, no-store" } });
  } catch {
    return Response.json({ errors: ["Email draft could not be updated."] }, { status: 503 });
  }
}

export async function DELETE(request: Request, context: Ctx) {
  const session = await verifyFreshAdminRequestPermission(request, "email.manage");
  if (!session) return forbiddenAdminResponse();
  const { id } = await context.params;
  if (!validDraftId(id)) return Response.json({ errors: ["Invalid draft ID."] }, { status: 400 });
  const body = await request.json().catch(() => null) as Record<string, unknown> | null;
  const revision = body?.revision;
  if (typeof revision !== "number" || !Number.isSafeInteger(revision) || revision < 1) {
    return Response.json({ errors: ["Invalid draft revision."] }, { status: 400 });
  }
  try {
    const archived = await archiveEmailDraft(id, revision, session.username);
    if (!archived) return conflict();
    await logStaffActivity({
      actor: session, action: "email_draft.archived", targetType: "admin_email_draft", targetId: id,
      metadata: { revision: archived.revision },
    });
    return Response.json({ archived: true }, { headers: { "Cache-Control": "private, no-store" } });
  } catch {
    return Response.json({ errors: ["Email draft could not be archived."] }, { status: 503 });
  }
}
