import { unauthorizedAdminResponse, verifyAdminRequest } from "@/app/lib/admin-auth";
import { getAllConversations, getMessagesByConversation } from "@/app/lib/support-store";

export const dynamic = "force-dynamic";

function json(payload: unknown, init: ResponseInit = {}) {
  const headers = new Headers(init.headers);
  headers.set("cache-control", "no-store");
  return Response.json(payload, { ...init, headers });
}

export async function GET(request: Request) {
  if (!verifyAdminRequest(request)) return unauthorizedAdminResponse();

  try {
    const conversations = await getAllConversations();

    // Attach latest message preview for each conversation
    const withPreviews = await Promise.all(
      conversations.map(async (conv) => {
        try {
          const messages = await getMessagesByConversation(conv.id);
          const last = messages[messages.length - 1];
          const unread = messages.filter((m) => m.sender_type === "customer").length;
          return {
            id: conv.id,
            status: conv.status,
            source_page: conv.source_page,
            created_at: conv.created_at,
            updated_at: conv.updated_at,
            last_message: last
              ? {
                  body: last.body.slice(0, 80),
                  sender_type: last.sender_type,
                  created_at: last.created_at,
                }
              : null,
            message_count: messages.length,
            unread_customer_count: unread,
          };
        } catch {
          return {
            id: conv.id,
            status: conv.status,
            source_page: conv.source_page,
            created_at: conv.created_at,
            updated_at: conv.updated_at,
            last_message: null,
            message_count: 0,
            unread_customer_count: 0,
          };
        }
      })
    );

    return json({ conversations: withPreviews });
  } catch (error) {
    console.error("Failed to load admin support conversations:", error);
    return json({ conversations: [], error: "Could not load conversations." });
  }
}
