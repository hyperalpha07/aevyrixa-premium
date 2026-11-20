import { forbiddenAdminResponse, verifyFreshAdminRequestPermission } from "@/app/lib/admin-auth";
import { logStaffActivity } from "@/app/lib/admin-staff";
import { createEmailDraft, listEmailDrafts, validateEmailDraft } from "@/lib/admin-v2/email-drafts-store";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  if (!(await verifyFreshAdminRequestPermission(request, "email.view"))) return forbiddenAdminResponse();
  try {
    return Response.json({ drafts: await listEmailDrafts() }, { headers: { "Cache-Control": "private, no-store" } });
  } catch {
    return Response.json({ errors: ["Email draft storage is unavailable."] }, { status: 503 });
  }
}

export async function POST(request: Request) {
  const session = await verifyFreshAdminRequestPermission(request, "email.manage");
  if (!session) return forbiddenAdminResponse();
  if (Number(request.headers.get("content-length") || 0) > 26000) {
    return Response.json({ errors: ["Draft is too large."] }, { status: 413 });
  }
  const validation = validateEmailDraft(await request.json().catch(() => null));
  if (!validation.input) return Response.json({ errors: validation.errors }, { status: 400 });
  try {
    const draft = await createEmailDraft(validation.input, session.username);
    await logStaffActivity({
      actor: session, action: "email_draft.created", targetType: "admin_email_draft", targetId: draft.id,
      metadata: { revision: draft.revision },
    });
    return Response.json({ draft }, { status: 201, headers: { "Cache-Control": "private, no-store" } });
  } catch {
    return Response.json({ errors: ["Email draft could not be saved."] }, { status: 503 });
  }
}
