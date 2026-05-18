import { createConversation } from "@/app/lib/support-store";

export const dynamic = "force-dynamic";

function json(payload: unknown, init: ResponseInit = {}) {
  const headers = new Headers(init.headers);
  headers.set("cache-control", "no-store");
  return Response.json(payload, { ...init, headers });
}

export async function POST(request: Request) {
  let sourcePage = "homepage";
  try {
    const body = (await request.json()) as Record<string, unknown>;
    if (typeof body.sourcePage === "string") sourcePage = body.sourcePage;
  } catch {
    // use default
  }

  try {
    const conversation = await createConversation(sourcePage);
    return json({
      id: conversation.id,
      public_token: conversation.public_token,
      status: conversation.status,
      created_at: conversation.created_at,
    });
  } catch (error) {
    console.error("Failed to create support conversation:", error);
    return json(
      { error: "Support is not available right now. Please try WhatsApp." },
      { status: 503 }
    );
  }
}
