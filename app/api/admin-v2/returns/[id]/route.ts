import { forbiddenAdminResponse, getFreshAdminRequestSession, unauthorizedAdminResponse } from "@/app/lib/admin-auth";
import { hasPermission } from "@/app/lib/admin-permissions";
import { transitionReturnCase } from "@/lib/admin-v2/returns/returns-store";
import { validateReturnTransition } from "@/lib/admin-v2/returns/returns-validation";

export const dynamic = "force-dynamic";

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  const session = await getFreshAdminRequestSession(request);
  if (!session) return unauthorizedAdminResponse();
  if (!hasPermission(session, "orders.view") || !hasPermission(session, "orders.editStatus")) return forbiddenAdminResponse();
  const { id } = await context.params;
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id))
    return Response.json({ errors: ["Invalid case ID."] }, { status: 400 });
  const input = validateReturnTransition(await request.json().catch(() => null));
  if (!input) return Response.json({ errors: ["Invalid status transition, hygiene check or review note."] }, { status: 400 });
  try {
    const item = await transitionReturnCase({ id, ...input, actor: session.displayName });
    return Response.json({ case: item }, { headers: { "cache-control": "no-store" } });
  } catch (error) {
    console.error("[admin-v2:returns] Update rejected", error instanceof Error ? error.message : "Unknown error");
    return Response.json({ errors: ["Return case could not be updated. Check current status and refresh to resolve a concurrent edit."] }, { status: 409 });
  }
}
