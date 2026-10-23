import { forbiddenAdminResponse, getFreshAdminRequestSession, unauthorizedAdminResponse } from "@/app/lib/admin-auth";
import { hasPermission } from "@/app/lib/admin-permissions";
import { createReturnCase } from "@/lib/admin-v2/returns/returns-store";
import { validateReturnCreation } from "@/lib/admin-v2/returns/returns-validation";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const session = await getFreshAdminRequestSession(request);
  if (!session) return unauthorizedAdminResponse();
  if (!hasPermission(session, "orders.view") || !hasPermission(session, "orders.editStatus")) return forbiddenAdminResponse();
  const input = validateReturnCreation(await request.json().catch(() => null));
  if (!input) return Response.json({ errors: ["Enter a valid delivered order reference, request type and reason (10–1500 characters)."] }, { status: 400 });
  try {
    const item = await createReturnCase({ ...input, actor: session.displayName });
    return Response.json({ case: item }, { status: 201, headers: { "cache-control": "no-store" } });
  } catch (error) {
    console.error("[admin-v2:returns] Create rejected", error instanceof Error ? error.message : "Unknown error");
    return Response.json({ errors: ["Return case could not be created. Verify LIVE delivered order eligibility and whether a case already exists."] }, { status: 409 });
  }
}
