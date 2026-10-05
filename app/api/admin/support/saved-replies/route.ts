import { forbiddenAdminResponse, getFreshAdminRequestSession } from "@/app/lib/admin-auth";
import { hasPermission } from "@/app/lib/admin-permissions";
import { logStaffActivity } from "@/app/lib/admin-staff";
import { createSupportSavedReply, listSupportSavedReplies } from "@/app/lib/support-store";

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

export async function GET(request: Request) {
  const session = await getFreshAdminRequestSession(request);
  if (!hasPermission(session, "support.view") && !hasPermission(session, "support.reply")) return forbiddenAdminResponse();
  try {
    return json({ replies: await listSupportSavedReplies() });
  } catch (error) {
    console.error("Failed to list support saved replies:", error);
    return json({ error: "Could not load saved replies." }, { status: 503 });
  }
}

export async function POST(request: Request) {
  const session = await getFreshAdminRequestSession(request);
  if (!hasPermission(session, "support.manage")) return forbiddenAdminResponse();
  let parsed: ReturnType<typeof parseSavedReplyInput>;
  try {
    parsed = parseSavedReplyInput((await request.json()) as Record<string, unknown>);
  } catch {
    return json({ error: "Invalid request body." }, { status: 400 });
  }
  if ("error" in parsed) return json({ error: parsed.error }, { status: 400 });
  try {
    const reply = await createSupportSavedReply({
      title: parsed.title,
      body: parsed.body,
      createdBy: session?.displayName || session?.username || "Admin",
    });
    await logStaffActivity({ actor: session, action: "support.saved_reply_created", targetType: "support_saved_reply", targetId: reply.id });
    return json({ reply }, { status: 201 });
  } catch (error) {
    console.error("Failed to create support saved reply:", error);
    return json({ error: "Could not create saved reply." }, { status: 503 });
  }
}
